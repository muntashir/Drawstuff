var paths = [];
var oldDataSize = 0;

function insertPath(path) {
    if (paths.length === 0) {
        paths.push(jQuery.extend(true, {}, path));
    } else {
        for (var i = 0, len = paths.length; i < len; i += 1) {
            if (path.time < paths[i].time) {
                paths.splice(i, 0, jQuery.extend(true, {}, path));
                return;
            }
        }
        paths.push(jQuery.extend(true, {}, path));
    }
}

function drawPaths(ctx) {
    for (var i = 0, len = paths.length; i < len; i += 1) {
        ctx.beginPath();
        ctx.strokeStyle = paths[i].color;
        ctx.lineWidth = paths[i].thickness;
        ctx.moveTo(paths[i].startX, paths[i].startY);
        for (var j = 0, ilen = paths[i].x.length; j < ilen; j += 1) {
            ctx.lineTo(paths[i].x[j], paths[i].y[j]);
        }
        ctx.stroke();
    }
}

function canvasDraw(canvas, ctx, canvasData, userData, forceUpdate) {
    //Clear canvas
    canvas.width = canvas.width;

    if (canvasData['size'] >= oldDataSize || forceUpdate) {
        paths = [];
        var path = {};
        path['x'] = [];
        path['y'] = [];

        for (var key in canvasData) {
            if (canvasData.hasOwnProperty(key)) {
                var dataElement = canvasData[key];
                for (var i = 0, len = dataElement.length; i < len; i += 1) {
                    if (dataElement[i].type === 'path-start') {
                        path.time = dataElement[i].time;
                        path.color = dataElement[i].color;
                        path.startX = dataElement[i].x;
                        path.startY = dataElement[i].y;
                        path.thickness = dataElement[i].thickness;
                    } else if (dataElement[i].type === 'path-point') {
                        path['x'].push(dataElement[i].x);
                        path['y'].push(dataElement[i].y);
                        if (i === len - 1 || dataElement[i + 1].type !== 'path-point') {
                            insertPath(path);
                            path = {};
                            path['x'] = [];
                            path['y'] = [];
                        }
                    }
                }
            }
        }
        oldDataSize = canvasData['size'];
    }

    drawPaths(ctx);

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