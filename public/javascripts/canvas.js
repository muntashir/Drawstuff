function canvasDraw(canvas, ctx, canvasData) {
    canvas.width = canvas.width;
    ctx.font = "20px Lato";
    ctx.textAlign = 'center';
    for (var i = 0, len = canvasData.length; i < len; i += 1) {
        if (canvasData[i].type === 'line') {
            ctx.strokeStyle = canvasData[i].color;
            ctx.beginPath();
            ctx.moveTo(canvasData[i].fromX, canvasData[i].fromY);
            ctx.lineTo(canvasData[i].toX, canvasData[i].toY);
            ctx.lineWidth = canvasData[i].thickness;
            ctx.stroke();
        } else if (canvasData[i].type === 'user') {
            ctx.fillStyle = canvasData[i].color;
            ctx.beginPath();
            ctx.arc(canvasData[i].centerX, canvasData[i].centerY, canvasData[i].thickness / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillText(canvasData[i].username, canvasData[i].centerX, canvasData[i].centerY - 7);
        } else if (canvasData[i].type === 'path-start') {
            ctx.fillStyle = canvasData[i].color;
            ctx.moveTo(canvasData[i].x, canvasData[i].y);
            ctx.lineWidth = canvasData[i].thickness;
        } else if (canvasData[i].type === 'path-point') {
            ctx.lineTo(canvasData[i].x, canvasData[i].y);
            if (i === len || canvasData[i + 1].type !== 'path-point') {
                ctx.stroke();
            }
        }
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