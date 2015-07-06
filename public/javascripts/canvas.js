var pathSettings = {};
var currentPathID;

function saveSettings(id, color, thickness, position) {
    pathSettings[id] = {
        'color': color,
        'thickness': thickness,
        'lastX': position[0],
        'lastY': position[1]
    };
}

function updatePathPosition(ctx, position) {
    pathSettings[currentPathID].lastX = position[0];
    pathSettings[currentPathID].lastY = position[1];
    ctx.lineTo(position[0], position[1]);
}

function restoreSettings(ctx, id) {
    currentPathID = id;
    ctx.beginPath();
    ctx.lineWidth = pathSettings[id].thickness;
    ctx.strokeStyle = pathSettings[id].color;
    ctx.moveTo(pathSettings[id].lastX, pathSettings[id].lastY);
}

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
            ctx.arc(canvasData[i].centerX, canvasData[i].centerY, canvasData[i].thickness / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillText(canvasData[i].username, canvasData[i].centerX, canvasData[i].centerY - 7);
        } else if (canvasData[i].type === 'path-start') {
            currentPathID = canvasData[i].id;
            saveSettings(currentPathID, canvasData[i].color, canvasData[i].thickness, [canvasData[i].x, canvasData[i].y]);
            restoreSettings(ctx, currentPathID);
        } else if (canvasData[i].type === 'path-point') {
            if (currentPathID !== canvasData[i].id) {
                restoreSettings(ctx, canvasData[i].id);
            }
            updatePathPosition(ctx, [canvasData[i].x, canvasData[i].y]);
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