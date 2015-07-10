var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('lobby', {
        title: 'Drawstuff',
        sessionID: req.sessionID
    });
});

router.get('/rooms/:id', function (req, res) {
    res.render('room', {
        title: 'Drawstuff',
        sessionID: req.sessionID,
        roomID: req.params.id
    });
});

module.exports = router;