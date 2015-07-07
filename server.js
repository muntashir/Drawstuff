var app = require('./app');

var canvasData = {
    'size': 0
};
var userPositionsObject = {};

//Init HTTP server
var port = process.env.PORT || 80;
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);

function getUserData(userPositionsObject) {
    var userData = [];
    for (var key in userPositionsObject) {
        if (userPositionsObject.hasOwnProperty(key)) {
            userData.push(userPositionsObject[key]);
        }
    }
    return userData;
}

//Init socket
io.on('connection', function (socket) {
    socket.emit('transmit-userData', userPositionsObject);

    socket.on('get-username', function (sessionID) {
        if (canvasData.hasOwnProperty(sessionID)) {
            socket.emit('send-username', userPositionsObject[sessionID].username);
        } else {
            socket.emit('send-username', null);
        }
    });

    socket.on('add-userData', function (sessionID, data) {
        userPositionsObject[sessionID] = data;
        io.emit('transmit-userData', getUserData(userPositionsObject));
    });

    socket.on('add-canvasData', function (sessionID, data) {
        canvasData.size += 1;
        Array.prototype.push.apply(canvasData[sessionID], data);
        socket.broadcast.emit('transmit-canvasData', sessionID, data);
    });

    socket.on('clear', function () {
        canvasData.size = 0;
        for (var key in canvasData) {
            if (canvasData.hasOwnProperty(key)) {
                canvasData[key] = [];
            }
        }
        socket.broadcast.emit('clear');
    });

    socket.on('new-user', function (sessionID, username) {
        socket.broadcast.emit('add-user', sessionID);
        if (!canvasData[sessionID]) {
            canvasData[sessionID] = [];
        }
        socket.emit('init-canvasData', canvasData);
    });

    socket.on('user-leave', function (sessionID, username) {
        delete userPositionsObject[sessionID];
        io.emit('transmit-userData', getUserData(userPositionsObject));
    });

    socket.on('chat-message', function (msg) {
        socket.broadcast.emit('chat-message', msg);
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