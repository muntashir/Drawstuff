var canvas;
var ctx;
var leftBorder;
var topBorder;

var socket;
var username;

var mousePos;
var mouseDown = false;

var canvasColor = '#000';
var thickness = 2;

//Data
var userPositionsObject = {};
var canvasData = {};
var dataBuffer = [];
var bufferLength = 3;

//var sessionID, roomID passed in from Jade

function joinRoom(id) {
    socket.emit('check-room', roomID);

    socket.on('check-room-response', function (response) {
        if (response) {
            socket.emit('join-room', roomID, sessionID);
            initCanvas();
            initPreCanvas(canvas);
            initChat();
            //Start drawLoop
            window.requestAnimationFrame(drawLoop);
        } else {
            bootbox.alert("Room does not exist", function () {
                window.location = "/";
            });
        }
    });
}

$(document).ready(function () {
    socket = io();
    initControls();
    joinRoom(roomID);

    $('#clear').on('click', function () {
        clearCanvas()
        socket.emit('clear');
    });

    socket.on('clear', function () {
        clearCanvas()
    });

    socket.on('add-user', function (id, username) {
        if (!canvasData.hasOwnProperty(id)) {
            canvasData[id] = [];
        }
    });

    socket.on('init-canvasData', function (data) {
        canvasData = data;
    });

    socket.on('transmit-canvasData', function (id, data) {
        canvasData.size += data.length;
        Array.prototype.push.apply(canvasData[id], data);
    });

    socket.on('transmit-userData', function (id, data) {
        userPositionsObject[id] = data;
    });
});

function clearCanvas() {
    canvasData.size = 0;
    canvasDraw(canvas, ctx, canvasData, userPositionsObject, true);
    for (var key in canvasData) {
        if (canvasData.hasOwnProperty(key)) {
            canvasData[key] = [];
        }
    }
}

function drawLoop() {
    canvasDraw(canvas, ctx, canvasData, userPositionsObject);
    window.requestAnimationFrame(drawLoop);
}

function initChat() {
    socket.emit('get-username', sessionID);

    socket.on('send-username', function (u) {
        if (u) {
            username = u;
            addUser();
        } else {
            getUserName();
        }
    });

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
    canvasData.size += dataBuffer.length;
    dataBuffer = [];
}

function initCanvas() {
    canvas = document.getElementById("canvas");
    canvas.height = 500;
    canvas.width = 800;
    ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    leftBorder = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
    topBorder = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) || 0;


    $('#canvas').on('mousedown touchstart', function (e) {
        e.preventDefault();
        if (!mouseDown) {
            mouseDown = true;
            mousePos = getMousePos(canvas, e.originalEvent, leftBorder, topBorder);
            var point = {};
            point.type = 'path-start';
            point.time = new Date().getTime();
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

    $('#canvas').on('mouseleave', function (e) {
        if (username) {
            var user = {};
            userPositionsObject[sessionID] = user;
            socket.emit('add-userData', sessionID, user);
        }
    });

    $('#canvas').on('mousemove touchmove', function (e) {
        e.preventDefault();
        if (username) {
            var userPos = getMousePos(canvas, e.originalEvent, leftBorder, topBorder);
            var user = {};
            user.username = username;
            user.centerX = userPos.x;
            user.centerY = userPos.y;
            user.color = canvasColor;
            user.thickness = thickness;
            userPositionsObject[sessionID] = user;
            socket.emit('add-userData', sessionID, user);
        }
    });

    $(window).on('mousemove touchmove', function (e) {
        e.preventDefault();
        if (mouseDown) {
            var point = {};
            point.type = 'path-point';
            mousePos = getMousePos(canvas, e.originalEvent, leftBorder, topBorder);
            point.x = mousePos.x;
            point.y = mousePos.y;
            dataBuffer.push(point);
            if ((dataBuffer.length > bufferLength) || (point.fromX === point.toX && point.fromY === point.toY)) {
                flushBuffer();
            }
        }
    });
}

function initControls() {
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
                addUser();
            }
        }
    });
}

function addUser() {
    socket.emit('chat-message', username + " has joined");
    $('#chat-messages').append($('<li>').text(username + " has joined").addClass('list-group-item active'));
    socket.emit('new-user', sessionID, username);
}