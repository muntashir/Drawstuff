var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('lobby', {
        title: 'Drawstuff',
        description: 'Realtime collaboration tool',
        sessionID: req.sessionID
    });
});

router.get('/channels/:id', function (req, res) {
    res.render('room', {
        title: 'Drawstuff',
        description: 'Realtime collaboration tool',
        sessionID: req.sessionID,
        roomID: req.params.id
    });
});

module.exports = router;