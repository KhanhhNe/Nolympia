var fs = require('fs');
var md5 = require('md5');

var data = require('./data/data.json');

var users = data.users;
var rounds = data.rounds;

var data_v1 = rounds.vong1;
var data_v2 = rounds.vong2;
var data_v3 = rounds.vong3;
var data_v4 = rounds.vong4;


const userList = Object.keys(users);
const userCount = userList.length-1; // Users number (except admin)
const userNames = userList.map((uid) => users[uid].name);
const isAdmin = Object.values(users).map(u => u.is_admin); // List  of users by is_admin

var commit = (operation) => {
    fs.writeFile('./data/data.json', JSON.stringify(data), (err) => {
        if (err) throw err
    });
    return operation;
}


// Authentication
function getUser (passw) {
    var hash = md5(passw);
    var obj;
    var id;
    
    for (var uid in userList) {
        id = userList[uid];
        if (users[id].password === hash) {
            obj = users[id];
            obj.id = id;
            return obj;
        }
    }
}


// Prepare
function ready (uid) {
    if (uid) {
        var ready = rounds.index[uid] = !rounds.index[uid];
        commit();
    }
    
    return Object.values(rounds.index)
        .reduce((a,b) => a + (b?1:0), 0);
}


function nextUrl (url) {
    switch (url) {
        case 'index':
            return 'vong1';
        case 'vong1':
            return 'vong2';
        case 'vong2':
            return 'vong3';
        case 'vong3':
            return 'vong4';
        default:
            return '';
    }
}

// Url
function url (next=false) {
    if (!next) { return '/'+rounds.current; }
    else {
        return '/'+commit(rounds.current = nextUrl(rounds.current));
    }
}


// User
function nextUser (uid) {
    var ind = userList.indexOf(uid) + 1;
    if (ind > 0 && ind <= userCount) { return userList[ind]; }
    else if (uid == '') { return userList[1]; }
}


// Point
function score (uid, sc=0) {
    // Get score (sc!=0 -> add score)
    if (sc) {
        users[uid].score += sc;
        commit();
    }
    return users[uid].score;
}


// Function for reusing - DRY rule :))
const set_user = (url) => {
    // Set current user for vong1 / vong4
    return (next=false) => {
        if (next) {
            var uid = rounds[url].uid;
            uid = nextUser(uid);
            if (!uid) { return false; }
            rounds[url].uid = uid;
            commit();
        }
        return rounds[url].uid;
    }
}

const status = (url) => {
    return (stt) => {
        // Get round status (stt!=undefined -> set status)
        // '' -> get ready
        // 'start' -> started
        // 'play' -> timer started
        // 'next' -> next user|question required
        // 'end' -> ended
        if (stt != undefined) {
            rounds[url].stt = stt;
            commit();
        }
        return rounds[url].stt;
    }
}

const time = (url) => (t) => {
    var d = new Date();
    var time = rounds[url].time;
    
    if (typeof(t) == 'boolean') {
        time.time = t ? d.getTime() + time.max * 1000 : 0;
        commit();
    }

    var time = rounds[url].time.time - d.getTime();
    return time > 0 ? time : 0;
}



// Rounds manager
var vong1 = {
    status: status('vong1'),
    
    all_question: () => data_v1.current > data_v1[data_v1.uid].length,
    
    user: set_user('vong1'),
    
    time: time('vong1'),
    
    get: (save=false) => {
        // Get current question (save=true -> next question)
        c = data_v1.current;
        if (save) {
            commit(data_v1.current++);
        }
        c = data_v1.current;
        return c < data_v1[data_v1.uid].length ? data_v1[data_v1.uid][c] : undefined;
    },
    
    reset: () => commit(data_v1.current = -1),
    
    answer: (tf) => {
        var uid = data_v1.uid;
        var sc = score(uid, tf?10:0);
        var next = vong1.get(save=true);
        var next_user;
        
        if (next == undefined) {
            // No question
            next_user = nextUser(uid); 
            if (next_user) { vong1.status('next'); }
            else { vong1.status('end'); }
        }
        
        return {
            score: sc,
            question: next,
        }
    }
}



var vong2 = {
    status: status('vong2'),
    time: time('vong2'),
    
    img_src: data_v2.bg_img,
    
    reset: () => commit(data_v2.subs = ['', '', '', '']),
    
    get: (num) => {
        if (num != undefined) {
            var quest;
            if (num == 4) {
                quest = data_v2.answered.length==4 ? data_v2.questions[4] : undefined;
            }
            else {
                quest = data_v2.answered.indexOf(num)<0 ? data_v2.questions[num] : undefined;
            }
            
            if (quest) {
                data_v2.current = num;
                commit();
                return quest;
            }
        } else { return data_v2.questions[data_v2.current]; }
    },
    
    current: () => data_v2.current,
    
    answers: data_v2.questions.map((q) => q.answ),
    answered: (num) => {
        var answered = data_v2.answered;
        if (num == undefined) {
            return answered;
        } else {
            return answered.indexOf(num) >= 0;
        }
    },
    
    submit: (uid, ans) => {
        var ind = userList.indexOf(uid) - 1;
        return commit(data_v2.subs[ind] = ans.toUpperCase().trim());
    },
    
    get_sub: (uid) => {
        var ind = userList.indexOf(uid) - 1;
        return data_v2.subs[ind];
    },
    
    submissions: () => data_v2.subs,
    
    answer: (uid) => {
        var ind = userList.indexOf(uid) - 1;
        var answ = data_v2.subs[ind];
        var tf = vong2.get().answ == answ;
        var sc = score(uid, tf?10:0);
        
        return sc;
    },
    
    commit: () => {
        var scores = [];
        
        userList.forEach((uid) => scores.push(vong2.answer(uid)));
        
        var v2 = data_v2;
        v2.answered.push(v2.current);
        commit();
        
        return scores;
    },
    
    key: (uid) => {
        if (uid) {
            return commit(data_v2.key = uid);
        }
        return data_v2.key;
    },
    
    answer_key: (tf) => {
        if (data_v2.key) {
            if (tf == true) {
                var answered = data_v2.answered.length;
                var sc = data_v2.points[answered];
                score(data_v2.key, sc);
                
                return commit(data_v2.key_answered = tf);
            } else if (tf == false) {
                var banned = data_v2.key;
                if (!banned) { return; }
                data_v2.banned.push(banned);
                commit(data_v2.key = '');

                return false;
            }
        }
    },
    
    key_answered: () => data_v2.key_answered,
    
    banned: (uid) => {
        var banned = data_v2.banned;
        if (uid) { return banned.indexOf(uid) >= 0; }
        else { return banned; }
    },
}



var vong3 = {
    status: status('vong3'),
    
    time: time('vong3'),
    
    question: (save=false) => {
        // Get current question (save=true -> next question)
        if (save) {
            commit(data_v3.current++);
        }
        return data_v3.questions[data_v3.current];
    },
    
    submit: (uid, answ) => {
        if (answ) {
            var t = data_v3.time.max*1000 - vong3.time();
            var dt = [answ.toUpperCase(), t];
            data_v3.subs[uid] = dt;
            return dt;
        }
    },
    
    subs: () => data_v3.subs,
    
    get_sub: (uid) => data_v3.subs[uid],
    
    reset: () => {
        for (var s in data_v3.subs) { data_v3.subs[s] = ['', -1]; }
        commit();
    },
    
    commit: () => {
        var times = [];
        
        for (var uid in data_v3.subs) {
            var sub = data_v3.subs[uid];
            var answ = vong3.question().answ;
            
            var res = answ.indexOf(sub[0]) >= 0;
            if (res) {
                times.push([uid, sub[1]]);
            }
        }
        
        times.sort((a,b) => a[1]-b[1]);
        times.forEach((obj, ind) => {
            score(obj[0], data_v3.scores[ind]);
        });
    }
}


var vong4 = {
    player: (next=false) => {
        if (next && !vong4.playing()) {
            vong4.reset();
            return commit(data_v4.uid = nextUser(data_v4.uid));
        } else { return data_v4.uid; }
    },
    
    star: (tf) => {
        if (typeof(tf) == 'boolean') {
            return commit(data_v4.star = tf);
        } else return data_v4.star;
    },
    
    end_turn: (next=false) => data_v4.cur > (next ? 1 : 2), // question index out of range
    end_round: () => vong4.end_turn() && !nextUser(data_v4.uid), // to boolean
    
    reset: () => {
        data_v4.pack = -1;
        data_v4.cur = -1;
        commit();
    },
    
    playing: (tf) => {
        if (typeof tf == 'boolean') {
            // Reset to original state
            vong4.star(false);
            
            // Return status
            return commit(data_v4.is_playing = tf);
        } else { return data_v4.is_playing; }
    },
    
    score: (id, sc) => score(id, sc - score(id)),
    
    pack: (p) => {
        if (p >= 0 && p <= 2 && !vong4.playing()) {
            return commit(data_v4.pack = p);
        } else { return data_v4.pack; }
    },
    
    question: (next=false) => {
        if (vong4.playing() && vong4.pack()>=0) {
            var dt = data_v4;
            var q;
            var q_list = dt.questions[dt.uid][dt.pack];
            if (next) {
                vong4.star(false);
                q = q_list[commit(++data_v4.cur)];
            } else {
                q = q_list[dt.cur];
            }
            return q;
        }
    },
    
    time: () => data_v4.pack >= 0 ? data_v4.time[data_v4.pack] : -1,
    
    get_score: () => {
        if (vong4.player() && vong4.pack()>=0 && data_v4.cur>=0) {
            var dt = data_v4;
            return dt.points[dt.pack][dt.cur];
        }
    },
}


Object.assign(module.exports, {
    getUser: getUser,
    
    ready: ready,
    isReady: (uid) => data.rounds.index[uid],
    
    userList: userList,
    userCount: userCount,
    userNames: userNames,
    isAdmin: isAdmin,
    
    url: url,
    
    score: score,
    getPoints: () => Object.values(data.users).map(u => u.score),
    
    vong1: vong1,
    vong2: vong2,
    vong3: vong3,
    vong4: vong4,
    
    nextUser: nextUser
})