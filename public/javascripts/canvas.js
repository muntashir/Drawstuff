var paths = [];
var oldDataSize = 0;

//Inserts paths in order they are drawn according to time
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
    for (var pathIndex = 0, outerLen = paths.length; pathIndex < outerLen; pathIndex += 1) {
        //Set path properties
        ctx.beginPath();
        ctx.strokeStyle = paths[pathIndex].color;
        ctx.lineWidth = paths[pathIndex].thickness;
        ctx.moveTo(paths[pathIndex].startX, paths[pathIndex].startY);

        //Draw points
        for (var pointIndex = 0, innerLen = paths[pathIndex].x.length; pointIndex < innerLen; pointIndex += 1) {
            ctx.lineTo(paths[pathIndex].x[pointIndex], paths[pathIndex].y[pointIndex]);
        }
        ctx.stroke();
    }
}

function canvasDraw(canvas, ctx, canvasData, userData, forceUpdate) {
    //Clear canvas
    canvas.width = canvas.width;

    //Only update paths if new data is available or update is being forced
    if (canvasData.size >= oldDataSize || forceUpdate) {
        paths = [];
        var path = {};
        path.x = [];
        path.y = [];

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
                        path.x.push(dataElement[i].x);
                        path.y.push(dataElement[i].y);
                        if (i === len - 1 || dataElement[i + 1].type !== 'path-point') {
                            insertPath(path);
                            path = {};
                            path.x = [];
                            path.y = [];
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
        ctx.fillText(userData[i].username, userData[i].centerX, userData[i].centerY - 9);
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