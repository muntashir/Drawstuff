var app = require('./app');
var canvasData = [];
var userPos = {};
var numUsers;

//Init HTTP server
var port = process.env.PORT || 80;
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);

//Init socket
io.on('connection', function (socket) {
    socket.emit('transmit-canvasData', canvasData);

    socket.on('request-canvasData', function () {
        var userData = [];
        for (var key in userPos) {
            if (userPos.hasOwnProperty(key)) {
                userData.push(userPos[key]);
            }
        }
        socket.emit('transmit-canvasData', canvasData.concat(userData));
    });

    socket.on('add-userData', function (sessionID, data) {
        userPos[sessionID] = data;
    });

    socket.on('add-canvasData', function (data) {
        Array.prototype.push.apply(canvasData, data);
    });

    socket.on('clear', function () {
        canvasData = [];
        io.emit('transmit-canvasData', canvasData);
    });

    socket.on('new-user', function (sessionID, username) {
        numUsers++;
    });

    socket.on('user-leave', function (sessionID, username) {
        numUsers--;
        delete userPos[sessionID];
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