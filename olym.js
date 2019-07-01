var http = require('http');
var path = require('path');
var helmet = require('helmet'); // Security
var express = require('express'); // ExpressJS
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser'); // Request parser
var socketio = require('socket.io'); // Socket.io
var internalIp = require('internal-ip');

var router = require('./routing');

var sessionMiddleware = session({
    secret: '4WQIjjKHETwflm186NQu1gTwOO3eVYAW',
    resave: true,
    saveUninitialized: true
})
var app = express();
var server = http.Server(app);
var io = socketio(server);

io.use(function (socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next)
})


var host = '0.0.0.0';
var port = 80;

app.use(helmet());
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'pug');
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/', router);

module.exports.app = app;
module.exports.io = io;
var routing = require('./routing');
var socket = require('./socket');

server.listen(port, host, function (err) {
    if(err) throw err;
    internalIp.v4().then( (ip) => console.log('Server started on '+ip+':'+port+'.') );
})
