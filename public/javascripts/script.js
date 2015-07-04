var ctx;
var socket;
var mousePos;
var mouseDown = false;
var username;
var canvas;

$(document).ready(function () {
   socket = io();

   getUserName();

   $(window).on('beforeunload', function () {
      if (username)
         socket.emit('chat message', username + " has left");
      socket.close();
   });

   $('form').submit(function () {
      if ($('#chat-input').val()) {
         socket.emit('chat message', username + ": " + $('#chat-input').val());
         $('#chat-messages').append($('<li>').text("You: " + $('#chat-input').val()).addClass('list-group-item active'));
         $('#chat-input').val('');
      }
      return false;
   });

   socket.on('chat message', function (msg) {
      $('#chat-messages').append($('<li>').text(msg).addClass('list-group-item'));
      $("#chat-window").animate({
         scrollTop: $("#chat-window").scrollHeight
      }, 1000);
   });

   initCanvas();

   socket.on('draw-canvas', function (c) {
      var image = new Image();
      image.onload = function () {
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         ctx.drawImage(image, 0, 0);
      };
      image.src = c;
   });

   socket.on('draw-line', function (line) {
      ctx.beginPath();
      ctx.moveTo(line.oldX, line.oldY);
      ctx.lineTo(line.newX, line.newY);
      ctx.stroke();
   });
});

function initCanvas() {
   canvas = document.getElementById("canvas");
   canvas.height = 500;
   canvas.width = 850;
   ctx = canvas.getContext("2d");
   ctx.clearRect(0, 0, canvas.width, canvas.height);

   $('#clear').on('click', function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      socket.emit('update-canvas', canvas.toDataURL());
      socket.emit('reload-canvas');
   });

   $('#canvas').on('mousedown touchstart', function (e) {
      e.preventDefault();
      if (!mouseDown) {
         mouseDown = true;
         mousePos = getMousePos(canvas, e.originalEvent);
      }
   });

   $(window).on('mouseup touchend', function (e) {
      e.preventDefault();
      if (mouseDown) {
         mouseDown = false;
      }
   });

   $(window).on('mousemove touchmove', function (e) {
      e.preventDefault();
      if (mouseDown) {
         var line = {};
         line.oldX = mousePos.x;
         line.oldY = mousePos.y;
         mousePos = getMousePos(canvas, e.originalEvent);
         line.newX = mousePos.x;
         line.newY = mousePos.y;

         ctx.beginPath();
         ctx.moveTo(line.oldX, line.oldY);
         ctx.lineTo(line.newX, line.newY);
         ctx.stroke();

         socket.emit('draw-line', line);
         socket.emit('update-canvas', canvas.toDataURL());
      }
   });
}

function getMousePos(canvas, e) {
   var rect = canvas.getBoundingClientRect();
   if (e.clientX) {
      return {
         x: e.clientX - rect.left,
         y: e.clientY - rect.top
      };
   };
   if (e.changedTouches[0]) {
      return {
         x: e.changedTouches[0].pageX - rect.left,
         y: e.changedTouches[0].pageY - rect.top
      };
   };
}

function getUserName() {
   bootbox.prompt({
      title: "Enter a username",
      value: "",
      callback: function (result) {
         if (result === null || result === "") {
            getUserName();
         } else {
            username = result;
            socket.emit('chat message', username + " has joined");
            $('#chat-messages').append($('<li>').text(username + " has joined").addClass('list-group-item active'));
         }
      }
   });
}