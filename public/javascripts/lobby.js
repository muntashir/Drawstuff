(function () {
    var action;
    var roomID;
    var socket;

    $(document).ready(function () {
        socket = io();
        io = null;

        socket.emit('request-num-users');

        socket.on('num-users', function (numUsers) {
            $('#users').empty();
            if (numUsers === "1") {
                $('#users').append(numUsers + " person online");
            } else {
                $('#users').append(numUsers + " people online");
            }
        });

        $("#random").click(function () {
            socket.emit('request-chat', sessionID);
            $('#random').prop('disabled', true);
            $("#random").html('Looking for a match...');
        });

        socket.on('request-chat-response', function (response) {
            console.log(response);
            if (response[0] === sessionID || response[1] === sessionID) {
                window.location = "/channels/" + response[0];
            }
        });

        $('#create-room-form').submit(function () {
            action = 'create';
            if (checkRoomID($('#create-room-text').val())) {
                roomID = $('#create-room-text').val();
                socket.emit('check-room', roomID);
            } else {
                bootbox.alert("The channel name can only have numbers and letters");
            }
            return false;
        });

        $('#join-room-form').submit(function () {
            action = 'join';
            if (checkRoomID($('#join-room-text').val())) {
                roomID = $('#join-room-text').val();
                socket.emit('check-room', roomID);
            } else {
                bootbox.alert("The channel name can only have numbers and letters");
            }
            return false;
        });

        socket.on('check-room-response', function (response) {
            if (action === 'create') {
                if (response) {
                    bootbox.alert("This channel already exists", function () {});
                } else {
                    socket.emit('create-room', roomID);
                    window.location = "/channels/" + roomID;
                }
            }
            if (action === 'join') {
                if (response) {
                    window.location = "/channels/" + roomID;
                } else {
                    bootbox.alert("This channel does not exist", function () {});
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