var url = require('url');

var dtman = require('./data-manage');
var socketio = require('./olym').io;


// Methods
const allReady = () => dtman.ready() == dtman.userCount;


var emit = {
    ready: (socket) => { socket.emit('ready', dtman.ready()); },
    redirect: (socket) => { socket.emit('redirect', dtman.url()); },
    start: (socket) => { socket.emit('start'); },
    end: (socket) => { socket.emit('end'); }
}


// Decorators
function invalidUrl (socket) {
    var curr = dtman.url();
    return url.parse(socket.request.url).pathname === curr?curr:undefined;
}

function adminRequired (socket, func) {
    return (...args) => {
        var url = invalidUrl(socket);
        if (url) { emit.redirect(socket, url); }
    
        var user = socket.request.session.user;
        if (user.is_admin) { return func(...args); }
    }
}

function userRequired (socket, func) {
    return (...args) => {
        var url = invalidUrl(socket);
        if (url) { emit.redirect(socket, url); }
    
        var user = socket.request.session.user;
        if (!user.is_admin) { return func(...args); }
    }
}


function auth_midware (socket, next) {
    if (socket.request.session.user) {
        if (socket.request.session.user.is_admin) {
            socket.join('admin');
            socket.on('disconnect', () => { socket.leave('admin'); } );
        } else {
            socket.join('player');
            socket.on('disconnect', () => { socket.leave('player'); });
        }
        next();
    }
}


function socket_handler (url, io) {
    return (socket, next) => {
        // Start round
        socket.on('start', adminRequired(socket, () => {
            if (dtman[url].status() == '') {
                dtman[url].status('start');
                emit.start(io);
                io.to('admin').emit('status', dtman[url].status());
            }
        }));
    
    
        // End round
        socket.on('end', adminRequired(socket, () => {
            if (dtman[url].status() != 'end') { return; }
            emit.end(io);
        }));


        // Go to next round
        socket.on('redirect', adminRequired(socket, () => {
            if (dtman[url].status() != 'end' || dtman.url() != '/'+url) { return; }
            dtman.url(next=true);
            emit.redirect(io);
        }));
        
        
        next();
    }
}



var indexio = socketio.of('/socket/index');
indexio.use(auth_midware);


// Socket
indexio.on('connect', function (socket) {
    var user = socket.request.session.user;
    
    socket.on('get ready', () => {
        var readyCount = dtman.ready(user.id);
        var ready = dtman.isReady(user.id);
        
        socket.emit('ok', ready);
        emit.ready(indexio, readyCount);
        indexio.to('admin').emit('completed', allReady());
        console.log(user.name+' -'+(ready?'':' not')+' ready. ('+readyCount+'/4)');
    });
    
    // Admin started the contest
    socket.on('start', adminRequired(socket, () => {
        if (allReady()) {
            dtman.url(next=true);
            emit.redirect(indexio);
        }
    }));
});



var vong1io = socketio.of('/socket/vong1');
vong1io.use(auth_midware);
//vong1io.use(socket_handler('vong1', vong1io));

vong1io.on('connect', function (socket) {
    var timer;
    
    // If timer still run, emit time left
    if (dtman.vong1.status() == 'play') {
        var time = dtman.vong1.time()
        if (time > 0) {
            socket.emit('time', time/1000);
        } else {
            dtman.vong1.status('');
        }
    }
    
    var user = socket.request.session.user;
    if (user.is_admin) {
        socket.emit('status', dtman.vong1.status());
    }
    
    
    // Commit an answer is true or false
    socket.on('commit', adminRequired(socket, (tf) => {
        if (dtman.vong1.status() != 'play' || typeof tf != 'boolean') { return; }
        var uid = dtman.vong1.user();
        if (dtman.vong1.all_question()) { return; }
        var resp = dtman.vong1.answer(tf);
        
        vong1io.emit('score', uid, resp.score);
        
        if (resp.question != undefined) {
            vong1io.emit('question', resp.question);
        } else {
            vong1io.emit('timeout');
            vong1io.emit('played');
            vong1io.to('admin').emit('status', dtman.vong1.status());
            dtman.vong1.reset();
            clearTimeout(timer);
        }
    }));
    
    
    // Next user
    socket.on('next', adminRequired(socket, () => {
        if (dtman.vong1.status() != 'next') { return; }
        var uid = dtman.vong1.user(next=true);
        
        if (!uid) {
            dtman.vong1.status('end');
            vong1io.emit('status', 'end');
        } else {
            vong1io.emit('user', uid);
            vong1io.emit('question', '');

            dtman.vong1.status('');
            vong1io.to('admin').emit('status', dtman.vong1.status());
        }
    }));
    
    
    // User play start - start timer
    socket.on('play', adminRequired(socket, () => {
        if (dtman.vong1.status() != '') { return; }  
        
        dtman.vong1.status('play');
        
        vong1io.emit('time');
        vong1io.emit('question', dtman.vong1.get(save=true));
        vong1io.to('admin').emit('status', dtman.vong1.status());
        
        var time = dtman.vong1.time(true)/1000;
        
        timer = setTimeout(() => {
            vong1io.emit('timeout');
            dtman.vong1.status('next');
            vong1io.emit('status', dtman.vong1.status());
            dtman.vong1.time(false);
            dtman.vong1.reset();
        }, time * 1000);
    }));
  
  
    socket.on('redirect', adminRequired(socket, () => {
        if (dtman.vong1.status() != 'end' || dtman.url() != '/vong1') { return; }
        dtman.url(next=true);
        emit.redirect(vong1io);
    }));
});



var vong2io = socketio.of('/socket/vong2');
vong2io.use(auth_midware);


vong2io.on('connect', (socket) => {
    var user = socket.request.session.user;
    
    var t;
    if (t = dtman.vong2.time()) {
        var q = dtman.vong2.get().question;
        var cur = dtman.vong2.current();
        
        socket.emit('resume', cur, q, t/1000);
    }
    
    var k;
    if (k = dtman.vong2.key()) {
        socket.emit('key', k);
    }
    
    if (user.is_admin) {
        if (dtman.vong2.answered().length >= 5 || dtman.vong2.key_answered()) {
            socket.emit('end');
        }
        
        // Start round
        socket.on('start', () => {
            if (dtman.vong2.status() == '') {
                dtman.vong2.status('start');
                emit.start(vong2io);
                vong2io.to('admin').emit('status', dtman.vong2.status());
            }
        });
    
    
        // End round
        socket.on('end', () => {
            if (dtman.vong2.answered().length >= 5 || dtman.vong2.key_answered()) {
                dtman.vong2.status('end');
                emit.end(vong2io);
            }
        });


        // Go to next round
        socket.on('redirect', () => {
            if (dtman.vong2.status() != 'end' || dtman.url() != '/vong2') { return; }
            dtman.url(next=true);
            emit.redirect(vong2io);
        });
        
        
        socket.on('choose', (num, f) => {debugger
            if (dtman.vong2.time() || dtman.vong2.key_answered()) { return; }
            
            var q = dtman.vong2.get(num);
            if (q) {
                var t = dtman.vong2.time(true);
                vong2io.emit('question', q.question);
                vong2io.to('admin').emit('subs', []);
                dtman.vong2.reset();
                f();
                
                setTimeout(() => {
                    dtman.vong2.time(false);
                    vong2io.emit('timeout');
                    
                    var scores = dtman.vong2.commit();
                    vong2io.emit('scores', scores);
                    
                    var subs = dtman.vong2.submissions();
                    vong2io.to('admin').emit('subs', subs);

                    if (dtman.vong2.answered().length >= 5) {
                        vong2io.to('admin').emit('no question');
                    }
                }, t);
            }
        });
        
        socket.on('submit key', (tf, f) => {
            if (dtman.vong2.time() > 0 || typeof tf != 'boolean' || dtman.vong2.key_answered()) { return; }
            
            var res = dtman.vong2.answer_key(tf);
            vong2io.emit('key answered', res);
            if (res) {
                vong2io.emit('scores', dtman.getPoints());
            }
            f();
        });
    } else {
        socket.on('answer', (ans, f) => {
            if (dtman.vong2.time() <= 0) { return; }
            var sub = dtman.vong2.submit(user.id, ans);
            f(sub);
        });
        
        socket.on('key', () => {
            if (dtman.vong2.time() > 0) { return; }
            dtman.vong2.key(user.id);
            vong2io.emit('key', user.id);
        });
    }
});



var vong3io = socketio.of('/socket/vong3');
vong3io.use(auth_midware);
//vong3io.use(socket_handler('vong3', vong3io));


vong3io.on('connect', (socket) => {
    var user = socket.request.session.user;
    
    if (dtman.vong3.time() > 0) {
        var q = dtman.vong3.question();
        var time = dtman.vong3.time();
        socket.emit('question', q.question, q.src);
        socket.emit('time', time/1000);
    }
    
    if (user.is_admin) {
        socket.on('question', (f) => {            
            if (dtman.vong3.time() > 0) { return; }
            
            dtman.vong3.reset();
            vong3io.to('admin').emit('subs', dtman.vong3.subs());
            vong3io.to('player').emit('reset');
            
            var q = dtman.vong3.question(next=true);
            
            if (!q) {
                dtman.vong3.status('end');
                emit.end(vong3io);
                return;
            }
            
            vong3io.emit('question', q.question, q.src);

            var t = dtman.vong3.time(true);
            
            setTimeout(() => {
                dtman.vong3.time(false);
                vong3io.emit('timeout');
                dtman.vong3.commit();
                
                vong3io.to('admin').emit('subs', dtman.vong3.subs());
                vong3io.emit('score', dtman.getPoints());
            }, t);
            
            f();
        });
        
        socket.on('score', () => {
            if (dtman.vong3.status() != 'start') { return; }
            vong3io.emit('scores', dtman.getPoints());
        });
        
        socket.on('redirect', () => {
            if (dtman.vong3.status() != 'end' || dtman.url() != '/vong3') { return; }
            dtman.url(next=true);
            emit.redirect(vong3io);
        });
    } else {        
        socket.on('answer', (answ, f) => {
            if (dtman.vong3.time() > 0) { f(dtman.vong3.submit(user.id, answ)); }
        });
    }
});





var vong4io = socketio.of('/socket/vong4');
vong4io.use(auth_midware);

var currentlyRunning = false;

vong4io.on('connect', function (socket) {
    var user = socket.request.session.user;
    
    if (user.is_admin) {
        socket.on('change score', (id, score, f) => {
            if (dtman.userList.indexOf(id) < 0) { return;   }
            
            dtman.vong4.score(id, score || 0);
            vong4io.emit('score', id, score || 0);
            f(); // acknowledge
        });
        
        socket.on('choose pack', (p, f) => {
            if (!dtman.vong4.end_turn()) {
                var res = dtman.vong4.pack(p);
                if (res >= 0) {
                    vong4io.emit('pack', res);
                    f();
                }
            }
        });
        
        socket.on('next', () => {
            if (!dtman.vong4.playing()) {
                if (dtman.vong4.end_turn(true) || !dtman.vong4.player()) {
                    if (dtman.vong4.end_round()) {
                        vong4io.emit('end turn', true);
                    } else {
                        vong4io.emit('end turn', false);
                        var playerId = dtman.vong4.player(next=true);
                        vong4io.emit('player', playerId);
                        
                        dtman.vong4.reset();
                        vong4io.emit('star', false);
                        vong4io.emit('pack', -1);
                        vong4io.emit('question', null, null);
                    }
                } else {
                    if (dtman.vong4.pack() >= 0) {
                        dtman.vong4.playing(true);

                        var q = dtman.vong4.question(next=true);
                        var sc = dtman.vong4.get_score();
                        vong4io.emit('question', q, sc);

                        var t = dtman.vong4.time();
                        
                        vong4io.emit('time', t);
                        
                        setTimeout(() => {
                            dtman.vong4.playing(false);
                            vong4io.emit('end game');
                        }, t*1000);
                    }
                }
            }
        });
        
        socket.on('star', (f) => {
            if (dtman.vong4.playing()) {
                dtman.vong4.star(true);
                vong4io.emit('star');
                f();
            }
        });
        
        socket.on('timer', (sec) => {
            vong4io.emit('countdown', sec);
            currentlyRunning = true;
            setTimeout(() => currentlyRunning = false, sec * 1000);
        });
    } else {
        socket.on('raise hand', () => {
            var uid = socket.request.session.user.id;
            
            if (currentlyRunning && dtman.vong4.player() != uid) {
                currentlyRunning = false;
                vong4io.emit('raise hand', uid);
            }
        });
    }
});