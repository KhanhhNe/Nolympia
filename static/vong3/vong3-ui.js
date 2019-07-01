var socket = io.connect('/socket/vong3');

socket.on('redirect', (url) => {
    window.location.assign(url);
});

var socket = io.connect('/socket/vong3');
var vid = document.getElementById('vid');

socket.on('score', (scores) => {
    $('.user').children('.score').each(function (ind) {
        $(this).html(scores[ind+1]);
    });
    
    $('#timer').val(0);
});


socket.on('question', (q, src) => {
    $('#answer, #commit').prop('disabled', false);
    vid.src = src;
    $('.question').html(q);
    startTimer(30, '#time-bar');
    
    vid.load();
});


socket.on('timeout', () => {
    $('#answer, #commit').prop('disabled', true);
});


$('#commit').click(() => {
    var sub = $('#submission');
    var ans = $('#answer');
    var ans_text = sub.children('.answer');
    var ans_time = sub.children('.time');
    
    socket.emit('answer', ans.val().trim(), (sub) => {
        ans_text.html(sub[0]);
        ans_time.html(sub[0] != '' ? sub[1]/1000 : ans_time.attr('default-value'));
    });
});

socket.on('reset', () => {
    var sub = $('#submission');
    sub.children('.answer').html('');
    sub.children('.time').html(sub.children('.time').attr('default-value'));
    $('#answer').val('');
});