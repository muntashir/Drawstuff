var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('roomSelect', {
        title: 'Drawstuff',
        sessionID: req.sessionID
    });
});

router.get('/rooms/:id', function (req, res) {
    res.render('index', {
        title: 'Drawstuff',
        sessionID: req.sessionID,
        roomID: req.params.id
    });
});

module.exports = router;