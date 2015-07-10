var action;
var roomID;

$(document).ready(function () {
    socket = io();

    $('#create-room-form').submit(function () {
        action = 'create';
        if ($('#create-room-text').val()) {
            roomID = $('#create-room-text').val();
            socket.emit('check-room', roomID);
        }
        return false;
    });

    $('#join-room-form').submit(function () {
        action = 'join';
        if ($('#join-room-text').val()) {
            roomID = $('#join-room-text').val();
            socket.emit('check-room', roomID);
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
});