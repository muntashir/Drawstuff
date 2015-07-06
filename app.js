//Init modules
var path = require('path');
var favicon = require('serve-favicon');
//var logger = require('morgan');
var session = require('express-session');
var bodyParser = require('body-parser');
var stylus = require('stylus');

//Init routers
var routes = require('./routes/index');

//Init express
var express = require('express');
var app = express();

//Init Jade views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//Init middleware
app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(logger('dev'));
app.use(session({
    secret: 'SHHH EQUU',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(stylus.middleware({
    src: __dirname + '/views',
    dest: __dirname + '/public'
}));
app.use(express.static(path.join(__dirname, 'public')));

//Route request
app.use('/', routes);

//404 if no routes have handled request
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//Display error
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
});

module.exports = app;