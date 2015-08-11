(function () {
    var action;
    var roomID;
    var socket;

    $(document).ready(function () {
        socket = io();
        io = null;

        $("#random").click(function () {
            socket.emit('request-chat', sessionID);
            $('#random').prop('disabled', true);
            $("#random").html('Looking for a match...');
        });

        socket.on('request-chat-response', function (response) {
            console.log(response);
            if (response[0] === sessionID || response[1] === sessionID) {
                window.location = "/rooms/" + response[0];
            }
        });

        $('#create-room-form').submit(function () {
            action = 'create';
            if (checkRoomID($('#create-room-text').val())) {
                roomID = $('#create-room-text').val();
                socket.emit('check-room', roomID);
            } else {
                bootbox.alert("Room ID must be alphanumeric");
            }
            return false;
        });

        $('#join-room-form').submit(function () {
            action = 'join';
            if (checkRoomID($('#join-room-text').val())) {
                roomID = $('#join-room-text').val();
                socket.emit('check-room', roomID);
            } else {
                bootbox.alert("Room ID must be alphanumeric");
            }
            return false;
        });

        socket.on('check-room-response', function (response) {
            if (action === 'create') {
                if (response) {
                    bootbox.alert("Room already exists", function () {});
                } else {
                    socket.emit('create-room', roomID);
                    window.location = "/rooms/" + roomID;
                }
            }
            if (action === 'join') {
                if (response) {
                    window.location = "/rooms/" + roomID;
                } else {
                    bootbox.alert("Room does not exist", function () {});
                }
            }
        });

        $(window).on('beforeunload', function () {
            socket.close();
        });
    });

    function checkRoomID(id) {
        var exp = /^[a-z0-9]+$/i;

        if (!id.match(exp))
            return false;
        else
            return true;
    }
})();