const fs = require('fs')
const md5 = require('md5')


var data, users, rounds, data_v1, data_v2, data_v3, data_v4

function loadData() {
    data = require('./data/data.json')
    users = data.users
    rounds = data.rounds

    data_v1 = rounds.vong1
    data_v2 = rounds.vong2
    data_v3 = rounds.vong3
    data_v4 = rounds.vong4
}
loadData()


const userList = Object.keys(users)
const userCount = userList.length-1 // Non-admin users count
const userNames = Object.values(users).map(user => user.name)
const isAdmin = Object.values(users).map(user => user.is_admin) // List of users by is_admin


// Writing app data into data file
var commit = (operation) => {
    fs.writeFile('./data/data.json', JSON.stringify(data), (err) => {
        if (err) throw err
    })
    return operation
}


// Find user with matching password
function authenticate (password) {
    var hash = md5(password)

    const user = Object.entries(userList)
        .find(([uid, user]) => user.password === hash)
    
    if (user) {
        return { id: user[0], ...user[1] }
    }
}


// Toggle ready state of user uid (if provided) and return number of ready users
function ready (uid) {
    if (uid) {
        var ready = rounds.index[uid] = !rounds.index[uid]
        commit()
    }
    
    return Object.values(rounds.index)
        .filter(([id, isReady]) => isReady)
        .length
}


function nextUrl (url) {
    return {
        index: 'vong1',
        vong1: 'vong2',
        vong2: 'vong3',
        vong3: 'vong4',
    }[url] || ''
}


// Change to next URL if next is true. Return /{current-url}
function url (next=false) {
    if (next) {
        rounds.current = nextUrl(rounds.current)
        commit()
    }

    return '/' + rounds.current
}


// Return user id for uid, if not provided than return first user's id
function nextUser (uid) {
    if (!uid) {
        return userList[1]
    }

    var ind = userList.indexOf(uid) + 1
    if (ind > 0 && ind <= userCount) {
        return userList[ind]
    }
}


// Add score for user if score is provided. Return user's score
function score (uid, sc=0) {
    if (sc) {
        users[uid].score += sc
        commit()
    }

    return users[uid].score
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
    
    all_question() {
        return data_v1.current > data_v1[data_v1.uid].length
    },
    
    user: set_user('vong1'),
    
    time: time('vong1'),
    
    get(save=false) {
        // Get current question (save=true -> next question)
        if (save) {
            data_v1.current++
            commit()
        }
        const current = data_v1.current

        if (current < data_v1[data_v1.uid].length) {
            return data_v1[data_v1.uid][current]
        }
    },
    
    reset() {
        return commit(data_v1.current = -1)
    },
    
    answer(answerIsTrue) {
        var uid = data_v1.uid
        var sc = score(uid, answerIsTrue ? 10 : 0)
        var nextQuestion = vong1.get(save=true)
        var next_user
        
        if (nextQuestion == undefined) {
            // No question
            next_user = nextUser(uid)

            if (next_user) {
                vong1.status('next')
            } else {
                vong1.status('end')
            }
        }
        
        return {
            score: sc,
            question: nextQuestion
        }
    }
}



var vong2 = {
    status: status('vong2'),
    time: time('vong2'),
    
    img_src: data_v2.bg_img,
    
    reset() {
        data_v2.subs = ['', '', '', '']
        commit()
        return data_v2.subs
    },
    
    get(num) {
        if (num != undefined) {
            var quest

            if (num == 4 && data_v2.answered.length == 4) {
                quest = data_v2.questions[4]
            }
            else if (data_v2.answered.indexOf(num) < 0) {
                quest = data_v2.questions[num]
            }
            
            if (quest) {
                data_v2.current = num
                commit()
                return quest
            }
        } else {
            return data_v2.questions[data_v2.current]
        }
    },
    
    current() {
        return data_v2.current
    },
    
    answers: data_v2.questions.map((question) => question.answ),
    answered(questionNumber) {
        const answered = data_v2.answered

        if (!questionNumber) {
            return answered
        } else {
            return answered.includes(questionNumber)
        }
    },
    
    submit(uid, answer) {
        const userIndex = userList.indexOf(uid) - 1
        return commit(data_v2.subs[userIndex] = answer.toUpperCase().trim())
    },
    
    get_sub(uid) {
        const ind = userList.indexOf(uid) - 1
        return data_v2.subs[ind]
    },
    
    submissions() {
        return data_v2.subs
    },
    
    answer(uid) {
        const index = userList.indexOf(uid) - 1
        const answer = data_v2.subs[index]
        const isTrue = vong2.get().answ == answer
        const score = score(uid, isTrue ? 10 : 0)
        
        return score
    },
    
    commit() {
        const scores = []
        
        for (let uid in userList) {
            scores.push(vong2.answer(uid))
        }
        
        data_v2.answered.push(data_v2.current)
        commit()
        
        return scores
    },
    
    key(uid) {
        if (uid) {
            data_v2.key = uid
            commit()
            return uid
        }

        return data_v2.key
    },
    
    answer_key(isTrue) {
        if (data_v2.key) {
            if (isTrue === true) {
                var answered = data_v2.answered.length
                var sc = data_v2.points[answered]
                score(data_v2.key, sc)

                data_v2.key_answered = isTrue
                commit()

                return isTrue

            } else if (isTrue === false) {
                var userId = data_v2.key
                if (!userId) { return }

                data_v2.banned.push(userId)
                data_v2.key = ''
                commit()

                return false
            }
        }
    },
    
    key_answered() {
        return data_v2.key_answered
    },
    
    banned(uid) {
        if (uid) {
            return data_v2.banned.includes(uid)
        } else {
            return data_v2.banned
        }
    },
}



var vong3 = {
    status: status('vong3'),
    
    time: time('vong3'),
    
    question(save=false) {
        // Get current question (save=true -> next question)
        if (save) {
            data_v3.current++
            commit()
        }

        return data_v3.questions[data_v3.current]
    },
    
    submit(uid, answer) {
        if (answer) {
            var time = data_v3.time.max*1000 - vong3.time()
            var data = [answer.toUpperCase(), time]
            data_v3.subs[uid] = data

            return data
        }
    },
    
    subs() {
        return data_v3.subs
    },
    
    get_sub(uid) {
        return data_v3.subs[uid]
    },
    
    reset() {
        for (var userId in data_v3.subs) {
            data_v3.subs[userId] = ['', -1]
        }

        commit()
    },
    
    commit() {
        const submissionTime = []
        
        for (var uid in data_v3.subs) {
            const submit = data_v3.subs[uid]
            const answer = vong3.question().answ
            
            const result = answer.includes(submit[0])

            if (result) {
                submissionTime.push([uid, submit[1]]);
            }
        }
        
        submissionTime.sort()
        submissionTime.forEach((submit, index) => {
            score(submit[0], data_v3.scores[index])
        })
    }
}


var vong4 = {
    player(next=false) {
        if (next && !vong4.playing()) {
            vong4.reset()
            data_v4.uid = nextUser(data_v4.uid)
            commit()
        }

        return data_v4.uid
    },
    
    star(isOn) {
        if (typeof(isOn) == 'boolean') {
            data_v4.star = isOn
            commit()
        }
        
        return data_v4.star
    },
    
    end_turn(next=false) {
        return data_v4.cur > (next ? 1 : 2) // question index out of range
    },
    end_round() {
        return vong4.end_turn() && !nextUser(data_v4.uid)
    },
    
    reset() {
        data_v4.pack = -1
        data_v4.cur = -1

        commit()
    },
    
    playing(isPlaying) {
        if (typeof isPlaying == 'boolean') {
            // Reset to original state
            vong4.star(false);
            
            data_v4.is_playing = isPlaying
            commit()
        }

        return data_v4.is_playing
    },
    
    score(uid, sc) {
        return sc(uid, sc - sc(uid))
    },
    
    pack(selectedPack) {
        if (selectedPack >= 0 && selectedPack <= 2 && !vong4.playing()) {
            data_v4.pack = selectedPack
            commit()
        }

        return data_v4.pack
    },
    
    question(next=false) {
        if (vong4.playing() && vong4.pack() >= 0) {
            const questionList = data_v4.questions[data_v4.uid][data_v4.pack];

            if (next) {
                vong4.star(false)
                data_v4.cur++

                commit()
            }

            return questionList[data_v4.cur]
        }
    },
    
    time() {
        return data_v4.pack >= 0 ? data_v4.time[data_v4.pack] : -1
    },
    
    get_score() {
        if (vong4.player() && vong4.pack() >= 0 && data_v4.cur >= 0) {
            return data_v4.points[data_v4.pack][data_v4.cur];
        }
    },
}


Object.assign(module.exports, {
    loadData: loadData,

    authenticate: authenticate,
    
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