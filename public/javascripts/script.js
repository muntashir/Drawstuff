var ctx;
var socket;
var mousePos;
var mouseDown = false;
var username;

$(document).ready(function () {
   socket = io();

   getUserName();

   $(window).on('beforeunload', function () {
      socket.close();
   });

   $('form').submit(function () {
      if ($('#chat-input').val()) {
         socket.emit('chat message', username + ": " + $('#chat-input').val());
         $('#chat-input').val('');
      }
      return false;
   });

   socket.on('chat message', function (msg) {
      $('#chat-window').append($('<li>').text(msg).addClass('list-group-item'));
      $('#chat-window').scrollTop($('#chat-window').scrollHeight);
   });

   initCanvas();

   socket.on('draw', function (c) {
      var image = new Image();
      image.onload = function () {
         ctx.drawImage(image, 0, 0);
      };
      image.src = c;
   });
});

function initCanvas() {
   var canvas = document.getElementById("canvas");
   canvas.height = 500;
   canvas.width = 850;
   ctx = canvas.getContext("2d");
   ctx.clearRect(0, 0, canvas.width, canvas.height);

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
         ctx.beginPath();
         ctx.moveTo(mousePos.x, mousePos.y);
         mousePos = getMousePos(canvas, e.originalEvent);
         ctx.lineTo(mousePos.x, mousePos.y);
         ctx.stroke();
         socket.emit('draw', canvas.toDataURL());
      }
   });
}

function getMousePos(canvas, e) {
   var rect = canvas.getBoundingClientRect();
   return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
   };
}

function getUserName() {
   bootbox.prompt({
      title: "Enter a username",
      value: "",
      callback: function (result) {
         if (result === null) {
            getUserName();
         } else {
            username = result;
            socket.emit('chat message', username + " has joined");
         }
      }
   });
}