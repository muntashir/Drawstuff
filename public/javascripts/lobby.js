(function () {
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

        $('#enter-room-form').submit(function () {
            if (checkRoomID($('#enter-room-text').val())) {
                roomID = $('#enter-room-text').val();
                socket.emit('check-room', roomID);
            } else {
                bootbox.alert("The channel name can only have numbers and letters");
            }
            return false;
        });

        socket.on('check-room-response', function (response) {
            if (!response) socket.emit('create-room', roomID);
            window.location = "/channels/" + roomID;
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