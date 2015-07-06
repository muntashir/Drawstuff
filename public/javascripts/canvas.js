function canvasDraw(canvas, ctx, canvasData) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < canvasData.length; i++) {
        if (canvasData[i].type === 'line') {
            ctx.strokeStyle = canvasData[i].color;
            ctx.beginPath();
            ctx.moveTo(canvasData[i].fromX, canvasData[i].fromY);
            ctx.lineTo(canvasData[i].toX, canvasData[i].toY);
            ctx.stroke();
        } else if (canvasData[i].type === 'user') {
            ctx.fillStyle = canvasData[i].color;
            ctx.beginPath();
            ctx.arc(canvasData[i].centerX, canvasData[i].centerY, 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.font = "20px Lato";
            ctx.textAlign = 'center';
            ctx.fillText(username, canvasData[i].centerX, canvasData[i].centerY - 7);
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
}