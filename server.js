var app = require('./app');
var redis = require('redis');
var db;

if (process.env.REDISCLOUD_URL) {
    var redisURL = require('url').parse(process.env.REDISCLOUD_URL);
    db = redis.createClient(redisURL.port, redisURL.hostname, {
        no_ready_check: true
    });
    db.auth(redisURL.auth.split(":")[1]);
} else {
    db = redis.createClient();
}

//Init HTTP server
var port = process.env.PORT || 80;
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);

function getRoomData(roomID, callback) {
    var data = {};
    var totalUsers = 0;
    var processedUsers = 0;

    db.get(roomID + ":size", function (err, reply) {
        data.size = parseInt(reply);

        db.smembers(roomID + ":users", function (err, reply) {
            totalUsers = reply.length;

            for (var i = 0; i < totalUsers; i += 1) {

                db.lrange(roomID + ":" + reply[i], 0, -1, function (err, d) {
                    var id = d[0];
                    data[id] = [];

                    for (var j = 1; j < d.length; j += 1) {
                        data[id].push(JSON.parse(d[j]));
                    }

                    processedUsers++;

                    if (totalUsers === processedUsers) {
                        callback(data);
                    }
                });
            }
        });
    });
}

db.on('connect', function () {
    console.log('Connected to Redis');
});

function matchmake() {
    var match = [];
    db.smembers("requests", function (err, requests) {
        for (var i = 0; i < requests.length; i += 1) {
            if (match.length < 2) {
                match.push(requests[i]);
            }
            if (match.length === 2) {
                db.sadd("rooms", match[0]);
                db.set(match[0] + ":size", 0);
                db.srem("requests", match[0]);
                db.srem("requests", match[1]);
                io.emit('request-chat-response', match);
                match = [];
            }
        }
    });
}

//Init socket
io.on('connection', function (socket) {
    socket.on('request-chat', function (request) {
        db.sadd("requests", request);
        socket.pendingRequest = true;
        socket.sessId = request;
        matchmake();
    });

    socket.on('start-typing', function (username) {
        var roomID = socket.rooms[1];
        socket.broadcast.to(roomID).emit('start-typing', username);
    });

    socket.on('stop-typing', function (username) {
        var roomID = socket.rooms[1];
        socket.broadcast.to(roomID).emit('stop-typing', username);
    });

    socket.on('get-username', function () {
        var sessionID = socket.sessId;
        db.hget("usernames", sessionID, function (err, reply) {
            if (reply) {
                socket.emit('send-username', reply);
            } else {
                socket.emit('send-username', null);
            }
        });
    });

    socket.on('check-room', function (roomID) {
        db.sismember("rooms", roomID, function (err, reply) {
            if (reply) {
                socket.emit('check-room-response', true);
            } else {
                socket.emit('check-room-response', false);
            }
        });
    });

    socket.on('create-room', function (roomID) {
        db.sadd("rooms", roomID);
        db.set(roomID + ":size", 0);
    });

    socket.on('join-room', function (roomID, sessionID) {
        socket.pendingRequest = false;
        socket.sessId = sessionID;
        socket.roomId = roomID;
        socket.join(roomID);
        db.sadd(roomID + ":users", sessionID);
    });

    socket.on('add-userData', function (data) {
        var sessionID = socket.sessId;
        var roomID = socket.rooms[1];
        socket.broadcast.to(roomID).emit('transmit-userData', sessionID, data);
    });

    socket.on('add-canvasData', function (data) {
        var sessionID = socket.sessId;
        var roomID = socket.rooms[1];
        socket.broadcast.to(roomID).emit('transmit-canvasData', sessionID, data);
        for (var i = 0; i < data.length; i += 1) {
            db.incr(roomID + ":size");
            db.rpush(roomID + ":" + sessionID, JSON.stringify(data[i]));
        }
    });

    socket.on('clear', function () {
        var roomID = socket.rooms[1];
        socket.broadcast.to(roomID).emit('clear');
        db.set(roomID + ":size", 0);
        db.smembers(roomID + ":users", function (err, reply) {
            for (var i = 0; i < reply.length; i += 1) {
                db.ltrim(roomID + ":" + reply[i], 0, 0);
            }
        });
    });

    socket.on('new-user', function (username) {
        var sessionID = socket.sessId;
        var roomID = socket.rooms[1];
        socket.broadcast.to(roomID).emit('chat-message', username + " has joined");
        socket.broadcast.to(roomID).emit('add-user', sessionID);
        db.hset("usernames", sessionID, username);
        db.rpush(roomID + ":usernames", username);
        db.llen(roomID + ":" + sessionID, function (err, reply) {
            if (!reply) {
                db.rpush(roomID + ":" + sessionID, sessionID);
            }
            getRoomData(roomID, function (data) {
                socket.emit('init-canvasData', data);
            });
        });
    });

    socket.on('check-username', function (username) {
        var response = true;
        var roomID = socket.rooms[1];
        db.lrange(roomID + ":usernames", 0, -1, function (err, d) {
            for (var i = 0; i < d.length; i += 1) {
                if (d[i] === username) {
                    response = false;
                    socket.emit('check-username-response', response);
                    return;
                }
            }
            socket.emit('check-username-response', response);
        });
    });

    socket.on('disconnect', function () {
        var sessionID = socket.sessId;

        if (socket.pendingRequest) {
            db.srem("requests", sessionID);
            return;
        }

        var roomID = socket.roomId;
        var data = {};
        io.to(roomID).emit('transmit-userData', sessionID, data);
        db.hget("usernames", sessionID, function (err, username) {
            if (username) {
                db.lrem(roomID + ":usernames", 0, username);
                io.to(roomID).emit('stop-typing', username);
                io.to(roomID).emit('chat-message', username + " has left");
            }
        });
    });

    socket.on('chat-message', function (msg) {
        var roomID = socket.rooms[1];
        socket.broadcast.to(roomID).emit('chat-message', msg);
    });
});

//Start server
server.on('error', onError);
server.on('listening', onListening);
server.listen(port);

//Server functions
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
    case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
    case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
    default:
        throw error;
    }
}

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}