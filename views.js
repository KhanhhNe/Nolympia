var md5 = require('md5');
var url = require('url');

var dtman = require('./data-manage');



// Decorators
var anonymousRequired = view => (req, res) => {
    if (req.session.user) { res.redirect(dtman.url()); }
    else { return view(req, res); }
}

var loginRequired = (view, login_url='/') => (req, res) => {
    if (!req.session.user) { res.redirect(login_url); return false; }
    else { return view?view(req, res):true; }
}

var validUrl = view => (req, res) => {
    var currUrl = dtman.url();
    if (url.parse(req.url).pathname != currUrl) { res.redirect(currUrl); }
    else { return view(req, res); }
}

var loginAndValid = view => (req, res) => {
    if (loginRequired()(req, res)) { return validUrl(view)(req, res); }
}



// Main views
function login (req, res) {
    res.render('../templates/login', { error: req.query.error });
}


function authenticate (req, res) {
    var err = 0;
    
    if (req.body) {
        if (req.body.password) {
            var user_obj = dtman.getUser(req.body.password);
            
            if (user_obj) {
                req.session.user = user_obj;
                
                console.log('User '+user_obj.name+' logged in.');
            } else { err = 2; }
        } else { err = 1; }
    } else { err = 1; }
    
    if (err) { res.redirect('/?error='+err); }
    else { res.redirect('/index'); }
}


function index (req, res) {
    var user = req.session.user;
    res.render('../templates/index', {
        user: user,
        ready: dtman.ready(),
        all_ready: dtman.ready() == dtman.userCount,
        user_ready: dtman.isReady(user.id)
    });
}


function get_users () {
    // Support for below views, not a view
    var uids = dtman.userList;
    var names = dtman.userNames;
    var points = dtman.getPoints();
    var is_admin = dtman.isAdmin;
    
    return uids.map((uid, ind) => { return {
        id: uid,
        name: names[ind],
        score: points[ind],
        is_admin: is_admin[ind]
    } });
}


function vong1 (req, res) {
    res.render('../templates/vong1', {
        user: req.session.user,
        users: get_users(),
        
        active: dtman.vong1.user(),
        
        question: dtman.vong1.get(),
        
        time: dtman.vong1.time(),
        
        stt: dtman.vong1.status(),
        
        all_ready: dtman.ready() == dtman.userCount,
    });
}


function vong2 (req, res) {
    var user = req.session.user;
    var submissions = dtman.vong2.submissions();
    
    var answers = dtman.vong2.answers;
    var done = dtman.vong2.answered();
    
    answers.forEach((ans, ind) => {
        ans = done.indexOf(ind) >= 0 ? ans : '';
    });
    
    res.render('../templates/vong2', {
        user: user,
        users: get_users(),
        
        time: dtman.vong2.time(),
        main_src: dtman.vong2.img_src,
        
        answers: dtman.vong2.answers,
        done: dtman.vong2.answered(),
        banned: dtman.vong2.banned(),
        
        submissions: submissions
    });
}


function vong3 (req, res) {
    var user = req.session.user;
    var inf = {
        user: user,
        users: get_users(),
        time: dtman.vong3.time() / 10,
        stt: dtman.vong3.status()
    };
    
    if (user.is_admin) { Object.assign(inf, {
        subs: dtman.vong3.subs(),
    }); }
    else { Object.assign(inf, {
        sub: dtman.vong3.get_sub(user.id),
    }); }
    
    res.render('../templates/vong3', inf);
}


function vong4 (req, res) {
    res.render('../templates/vong4', {
        users: get_users(),
        user: req.session.user,
        active: dtman.vong4.player(),
        star: dtman.vong4.star(),
        question: dtman.vong4.question(),
        pack: dtman.vong4.pack(),
        ended: dtman.vong4.end_round(),
        to_add: dtman.vong4.get_score()
    });
}


module.exports.loginGET = anonymousRequired(login);
module.exports.loginPOST = anonymousRequired(authenticate);
module.exports.indexGET = loginAndValid(index);
module.exports.vong1GET = loginAndValid(vong1);
module.exports.vong2GET = loginAndValid(vong2);
module.exports.vong3GET = loginAndValid(vong3);
module.exports.vong4GET = loginAndValid(vong4);