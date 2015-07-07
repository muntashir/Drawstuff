var ctx;
var socket;
var mousePos;
var mouseDown = false;
var username;
var canvas;
var canvasColor = '#000';
var dataBuffer = [];
var bufferLength = 3;
var numUsers = 0;
var thickness = 2;
var userData = [];
var canvasData = {};

$(document).ready(function () {
    socket = io();
    initChat();
    initCanvas();

    $('#clear').on('click', function () {
        for (var key in canvasData) {
            if (canvasData.hasOwnProperty(key)) {
                canvasData[key] = [];
            }
        }
        socket.emit('clear');
    });

    socket.on('clear', function () {
        for (var key in canvasData) {
            if (canvasData.hasOwnProperty(key)) {
                canvasData[key] = [];
            }
        }
    });

    socket.on('add-user', function (id, username) {
        canvasData[id] = [];
    });

    socket.on('init-canvasData', function (data) {
        canvasData = data;
    });

    socket.on('transmit-canvasData', function (id, data) {
        Array.prototype.push.apply(canvasData[id], data);
    });

    socket.on('transmit-userData', function (data) {
        userData = data;
    });

    socket.on('numUsers', function (n) {
        numUsers = n;
    });

    window.requestAnimationFrame(drawLoop);
});

function drawLoop() {
    canvasDraw(canvas, ctx, canvasData, userData);
    window.requestAnimationFrame(drawLoop);
}

function initChat() {
    getUserName();

    $(window).on('beforeunload', function () {
        if (username) {
            socket.emit('chat-message', username + " has left");
            socket.emit('user-leave', sessionID, username);
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

function flushBuffer() {
    socket.emit('add-canvasData', sessionID, dataBuffer);
    Array.prototype.push.apply(canvasData[sessionID], dataBuffer);
    dataBuffer = [];
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
            var point = {};
            point.type = 'path-start';
            point.x = mousePos.x;
            point.y = mousePos.y;
            point.color = canvasColor;
            point.thickness = thickness;
            dataBuffer.push(point);
            flushBuffer();
        }
    });

    $(window).on('mouseup touchend', function (e) {
        e.preventDefault();
        if (mouseDown) {
            mouseDown = false;
            flushBuffer();
        }
    });

    $('#canvas').on('mousemove touchmove', function (e) {
        if (username) {
            e.preventDefault();
            var userPos = getMousePos(canvas, e.originalEvent);
            var user = {};
            user.username = username;
            user.centerX = userPos.x;
            user.centerY = userPos.y;
            user.color = canvasColor;
            user.thickness = thickness
            socket.emit('add-userData', sessionID, user);
        }
    });
    $(window).on('mousemove touchmove', function (e) {
        e.preventDefault();

        if (mouseDown) {
            var point = {};
            point.type = 'path-point';
            mousePos = getMousePos(canvas, e.originalEvent);
            point.x = mousePos.x;
            point.y = mousePos.y;
            dataBuffer.push(point);
            if ((dataBuffer.length > bufferLength) || (point.fromX === point.toX && point.fromY === point.toY)) {
                flushBuffer();
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

    $("#thickness").slider({
        id: 'thickness',
        min: 1,
        max: 15,
        value: thickness,
        selection: 'none'
    });

    $("#thickness").on('slide', function (slider) {
        thickness = slider.value;
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
                socket.emit('new-user', sessionID, username);
            }
        }
    });
}