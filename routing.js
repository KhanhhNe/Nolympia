var app = require('./olym').app;
var express = require('express');
var router = express.Router();

var views = require('./views');

router.use(function (req, res, next) {
    console.log(req.method+' '+req.originalUrl+' '+req.ip);
    next();
})

router.get('/', views.loginGET);
router.post('/login', views.loginPOST);
router.get('/index', views.indexGET);
router.get('/vong1', views.vong1GET);
router.get('/vong2', views.vong2GET);
router.get('/vong3', views.vong3GET);
router.get('/vong4', views.vong4GET);

module.exports = router;