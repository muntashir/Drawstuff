var app = require('./app');

//Init HTTP server
var port = "80";
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);

//Init socket
io.on('connection', function (socket) {
   socket.on('chat message', function (msg) {
      io.emit('chat message', msg);
   });
   socket.on('draw', function (c) {
      io.emit('draw', c);
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