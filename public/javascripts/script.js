var ctx;
var socket;
var mousePos;
var mouseDown = false;
var username;
var canvas;
var canvasColor = '#000';
var dataBuffer = [];
var bufferLength = 5;

$(document).ready(function () {
    socket = io();
    initChat();
    initCanvas();

    $('#clear').on('click', function () {
        socket.emit('clear');
    });

    socket.on('transmit-canvasData', function (canvasData) {
        canvasDraw(canvas, ctx, canvasData);
    });

    window.requestAnimationFrame(requestUpdate);
});

function initChat() {
    getUserName();

    $(window).on('beforeunload', function () {
        if (username) {
            socket.emit('chat-message', username + " has left");
            socket.emit('user-leave', username);
        }
        socket.close();
    });

    $('form').submit(function () {
        if ($('#chat-input').val()) {
            socket.emit('chat-message', username + ": " + $('#chat-input').val());
            $('#chat-messages').append($('<li>').text("You: " + $('#chat-input').val()).addClass('list-group-item active'));
            $('#chat-input').val('');
        }
        return false;
    });

    socket.on('chat-message', function (msg) {
        $('#chat-messages').append($('<li>').text(msg).addClass('list-group-item'));
        $("#chat-window").animate({
            scrollTop: $("#chat-window")[0].scrollHeight
        }, 1000);
    });
}

function initCanvas() {
    canvas = document.getElementById("canvas");
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
            socket.emit('add-canvasData', dataBuffer);
            dataBuffer = [];
        }
    });

    $(window).on('mousemove touchmove', function (e) {
        e.preventDefault();
        if (mouseDown) {
            var line = {};
            line.type = 'line';
            line.fromX = mousePos.x;
            line.fromY = mousePos.y;
            mousePos = getMousePos(canvas, e.originalEvent);
            line.toX = mousePos.x;
            line.toY = mousePos.y;
            line.color = canvasColor;
            dataBuffer.push(line);
            if (dataBuffer.length > bufferLength) {
                socket.emit('add-canvasData', dataBuffer);
                dataBuffer = [];
            }
        }
    });

    $("#color-picker").spectrum({
        color: "#000",
        showButtons: false,
        replacerClassName: 'color-picker',
        preferredFormat: "hex",
        showInput: true
    });

    $("#color-picker").on('move.spectrum change.spectrum', function (e, color) {
        ctx.strokeStyle = color.toHexString();
        canvasColor = color.toHexString();
    });
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
                socket.emit('chat-message', username + " has joined");
                $('#chat-messages').append($('<li>').text(username + " has joined").addClass('list-group-item active'));
                socket.emit('new-user', username);
            }
        }
    });
}

function requestUpdate() {
    socket.emit('request-canvasData');
    window.requestAnimationFrame(requestUpdate);
}