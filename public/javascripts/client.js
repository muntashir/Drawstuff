(function () {
    var canvas;
    var ctx;
    var canvasOffsetX;
    var canvasOffsetY;

    var socket;
    var username;

    var mousePos;
    var mouseDown = false;

    var canvasColor = '#000';
    var thickness = 2;

    //Data
    var userPositionsObject = {};
    var usersTyping = {};
    var typingNodes = [];
    var canvasData = {};
    var dataBuffer = [];
    var bufferLength = 3;

    var unreadCount = 0;

    //var sessionID, roomID passed in from Jade

    function updateWindowTitle() {
        if (unreadCount) {
            window.document.title = "Drawstuff (" + unreadCount + ")";
        } else {
            window.document.title = "Drawstuff";
        }
    }

    function joinRoom(id) {
        socket.emit('check-room', roomID);

        socket.on('check-room-response', function (response) {
            if (response) {
                socket.emit('join-room', roomID, sessionID);
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

    function undo(id) {
        if (canvasData.hasOwnProperty(id)) {
            for (var i = canvasData[id].length - 1; i >= 0; i -= 1) {
                if (canvasData[id].pop().type === 'path-start') {
                    break;
                }
            }
            canvasDraw(canvas, ctx, canvasData, userPositionsObject, true);
        }
    }

    $(document).ready(function () {
        socket = io();
        io = null;

        initControls();
        initCanvas();
        joinRoom(roomID);

        $('#clear').on('click touchend', function () {
            bootbox.confirm("Are you sure you want to clear everything?", function (result) {
                if (result) {
                    clearCanvas();
                    socket.emit('clear');
                }
            });
        });

        $('#undo').on('click touchend', function () {
            undo(sessionID);
            socket.emit('undo');
        });

        socket.on('undo', function (id) {
            undo(id);
        });

        socket.on('clear', function () {
            clearCanvas();
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
            canvasData.size += parseInt(data.length);
            Array.prototype.push.apply(canvasData[id], data);
        });

        socket.on('transmit-userData', function (id, data) {
            userPositionsObject[id] = data;
        });
    });

    function clearCanvas() {
        canvasDraw(canvas, ctx, canvasData, userPositionsObject, true);
        for (var key in canvasData) {
            if (canvasData.hasOwnProperty(key)) {
                canvasData[key] = [];
            }
        }
        canvasData.size = parseInt(0);
        oldDataSize = parseInt(0);
    }

    function drawLoop() {
        canvasDraw(canvas, ctx, canvasData, userPositionsObject);
        window.requestAnimationFrame(drawLoop);
    }

    function displayUsersTyping() {
        for (var i = 0; i < typingNodes.length; i += 1) {
            typingNodes[i].remove();
        }

        typingNodes = [];

        for (var user in usersTyping) {
            if (usersTyping.hasOwnProperty(user)) {
                var node = $('<li class="list-group-item">' + user + ' is typing...</li>');
                typingNodes.push(node);
                $('#chat-messages').append(node);
            }
        }

        scrollChat();
    }

    function initChat() {
        socket.emit('get-username');

        socket.on('send-username', function (u) {
            if (u) {
                username = u;
                socket.emit('check-username', username);
            } else {
                getUserName();
            }
        });

        socket.on('check-username-response', function (response) {
            if (response) {
                addUser();
            } else {
                bootbox.alert("Username is already taken", function () {
                    getUserName();
                });
            }
        });

        socket.on('start-typing', function (username) {
            usersTyping[username] = "";
            displayUsersTyping();
        });

        socket.on('stop-typing', function (username) {
            if (usersTyping.hasOwnProperty(username)) {
                delete usersTyping[username];
                displayUsersTyping();
            }
        });

        $('#chat-input').on('click keydown', function () {
            unreadCount = 0;
            updateWindowTitle();
        });

        $('#chat-input').on('input', function () {
            if ($('#chat-input').val()) {
                socket.emit('start-typing', username);
            } else {
                socket.emit('stop-typing', username);
            }
        });

        $(window).on('beforeunload', function () {
            socket.close();
        });

        $(window).on('resize', function () {
            canvas.height = window.innerHeight;
            canvas.width = window.innerWidth;
        });

        $('form').submit(function () {
            if ($('#chat-input').val()) {
                socket.emit('chat-message', username + ": " + $('#chat-input').val());
                printToChat("You: " + $('#chat-input').val(), true);
                $('#chat-input').val('');
            }
            socket.emit('stop-typing', username);
            return false;
        });

        socket.on('chat-message', function (msg) {
            printToChat(msg, false);
            unreadCount += 1;
            updateWindowTitle();
            scrollChat();
        });
    }

    function flushBuffer() {
        socket.emit('add-canvasData', dataBuffer);
        Array.prototype.push.apply(canvasData[sessionID], dataBuffer);
        canvasData.size += parseInt(dataBuffer.length);
        dataBuffer = [];
    }

    function initCanvas() {
        canvas = document.getElementById("canvas");
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        canvasOffsetX = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) + parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) + document.body.parentNode.offsetLeft;
        canvasOffsetY = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) + parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) + document.body.parentNode.offsetTop;

        $('#canvas').on('mousedown touchstart', function (e) {
            mouseDown = true;
            mousePos = getMousePos(canvas, e.originalEvent, canvasOffsetX, canvasOffsetY);
            var point = {};
            point.type = 'path-start';
            point.time = new Date().getTime();
            point.x = mousePos.x;
            point.y = mousePos.y;
            point.color = canvasColor;
            point.thickness = Math.min(thickness, 15);
            dataBuffer.push(point);
            flushBuffer();
        });

        $(window).on('mouseup touchend touchcancel', function (e) {
            mouseDown = false;
            flushBuffer();
        });

        $(window).on('mouseleave touchend touchcancel', function (e) {
            if (username) {
                var user = {};
                userPositionsObject[sessionID] = user;
                socket.emit('add-userData', user);
            }
        });

        $(window).on('mousemove touchmove', function (e) {
            if (username) {
                var userPos = getMousePos(canvas, e.originalEvent, canvasOffsetX, canvasOffsetY);
                var user = {};
                user.username = username;
                user.centerX = userPos.x;
                user.centerY = userPos.y;
                user.color = canvasColor;
                user.thickness = Math.min(thickness, 15);
                userPositionsObject[sessionID] = user;
                socket.emit('add-userData', user);
            }
        });

        $(window).on('mousemove touchmove', function (e) {
            if (mouseDown) {
                var point = {};
                point.type = 'path-point';
                mousePos = getMousePos(canvas, e.originalEvent, canvasOffsetX, canvasOffsetY);
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
                    username = result.trim();
                    socket.emit('check-username', username);
                }
            }
        });
    }

    function addUser() {
        printToChat(username + " has joined", true);
        socket.emit('new-user', username);
    }

    function scrollChat() {
        $("#chat-window").stop().animate({
            scrollTop: $("#chat-window")[0].scrollHeight
        }, 300);
    }

    function printToChat(text, active) {
        var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        text = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(exp, "<a href='$1' target='_blank'>$1</a>");
        if (active) {
            $('#chat-messages').append('<li class="list-group-item active">' + text + '</li>');
        } else {
            $('#chat-messages').append('<li class="list-group-item">' + text + '</li>');
        }
        displayUsersTyping();
    }
})();