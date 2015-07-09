$(document).ready(function () {
    socket = io();

    $('#create-room-form').submit(function () {
        if ($('#create-room-text').val()) {
            roomID = $('#create-room-text').val();
            socket.emit('create-room', roomID);
            window.location = "/rooms/" + roomID;
        }
        return false;
    });

    $('#join-room-form').submit(function () {
        if ($('#join-room-text').val()) {
            roomID = $('#join-room-text').val();
            socket.emit('check-room', roomID);
            socket.on('check-room-response', function (response) {
                if (response) {
                    window.location = "/rooms/" + roomID;
                } else {
                    bootbox.alert("Room does not exist", function () {});
                }
            });
        }
        return false;
    });
});