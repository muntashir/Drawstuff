function canvasDraw(canvas, ctx, canvasData, userData) {
    canvas.width = canvas.width;

    for (var key in canvasData) {
        if (canvasData.hasOwnProperty(key)) {
            var dataElement = canvasData[key];
            for (var i = 0, len = dataElement.length; i < len; i += 1) {
                if (dataElement[i].type === 'path-start') {
                    ctx.beginPath();
                    ctx.strokeStyle = dataElement[i].color;
                    ctx.moveTo(dataElement[i].x, dataElement[i].y);
                    ctx.lineWidth = dataElement[i].thickness;
                } else if (dataElement[i].type === 'path-point') {
                    ctx.lineTo(dataElement[i].x, dataElement[i].y);
                    if (i === len - 1 || dataElement[i + 1].type !== 'path-point') {
                        ctx.stroke();
                    }
                }
            }
        }
    }

    ctx.font = "20px Lato";
    ctx.textAlign = 'center';

    for (var i = 0, len = userData.length; i < len; i += 1) {
        ctx.fillStyle = userData[i].color;
        ctx.beginPath();
        ctx.arc(userData[i].centerX, userData[i].centerY, userData[i].thickness / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillText(userData[i].username, userData[i].centerX, userData[i].centerY - 7);
    }
}

function getMousePos(canvas, e) {
    var rect = canvas.getBoundingClientRect();
    if (e.clientX) {
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    if (e.changedTouches) {
        return {
            x: e.changedTouches[0].pageX - rect.left,
            y: e.changedTouches[0].pageY - rect.top
        };
    };
    return mousePos;
}