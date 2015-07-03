var ctx;
var socket;
var mousePos;
var mouseDown = false;

$(document).ready(function () {
   socket = io();

   $(window).on('beforeunload', function () {
      socket.close();
   });

   $('form').submit(function () {
      if ($('#chat-input').val()) {
         socket.emit('chat message', $('#chat-input').val());
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

   $('#canvas').on('mousedown', function (e) {
      if (!mouseDown) {
         mouseDown = true;
         mousePos = getMousePos(canvas, e);
      }
   });

   $(window).on('mouseup', function (e) {
      if (mouseDown) {
         mouseDown = false;
      }
   });

   $(window).on('mousemove', function (e) {
      if (mouseDown) {
         ctx.beginPath();
         ctx.moveTo(mousePos.x, mousePos.y);
         mousePos = getMousePos(canvas, e);
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