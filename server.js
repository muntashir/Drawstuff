var app = require('./app');

var usernames = {};
var roomData = {};

//Init HTTP server
var port = process.env.PORT || 80;
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);

//Init socket
io.on('connection', function (socket) {
    socket.on('get-username', function (sessionID) {
        if (usernames.hasOwnProperty(sessionID)) {
            socket.to(socket.rooms[0]).emit('send-username', usernames[sessionID]);
        } else {
            socket.to(socket.rooms[0]).emit('send-username', null);
        }
    });

    socket.on('check-room', function (roomID) {
        if (roomData.hasOwnProperty(roomID)) {
            socket.emit('check-room-response', true);
        } else {
            socket.emit('check-room-response', false);
        }
    });

    socket.on('create-room', function (roomID) {
        roomData[roomID] = {
            'size': 0
        };
    });

    socket.on('join-room', function (roomID) {
        socket.join(roomID);
    });

    socket.on('add-userData', function (sessionID, data) {
        socket.broadcast.to(socket.rooms[0]).emit('transmit-userData', sessionID, data);
    });

    socket.on('add-canvasData', function (sessionID, data) {
        canvasData.size += 1;
        Array.prototype.push.apply(canvasData[sessionID], data);
        socket.broadcast.to(socket.rooms[0]).emit('transmit-canvasData', sessionID, data);
    });

    socket.on('clear', function () {
        canvasData.size = 0;
        for (var key in canvasData) {
            if (canvasData.hasOwnProperty(key)) {
                canvasData[key] = [];
            }
        }
        socket.broadcast.to(socket.rooms[0]).emit('clear');
    });

    socket.on('new-user', function (sessionID, username) {
        socket.broadcast.to(socket.rooms[0]).emit('add-user', sessionID);
        if (!canvasData.hasOwnProperty(sessionID)) {
            canvasData[sessionID] = [];
        }
        usernames[sessionID] = username;
        socket.to(socket.rooms[0]).emit('init-canvasData', canvasData);
    });

    socket.on('user-leave', function (sessionID, username) {
        var data = {}
        io.emit('transmit-userData', sessionID, data);
    });

    socket.on('chat-message', function (msg) {
        socket.broadcast.to(socket.rooms[0]).emit('chat-message', msg);
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