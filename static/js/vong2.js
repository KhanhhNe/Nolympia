var socket = io.connect('/socket/vong2');


socket.on('resume', (cur, q, t) => {
    $('#question').html(q);
    $('#timer').data('current', 15-t);
    startTimer(15, '#timer');
    startTimerSound(15);
});


socket.on('key', (id) => {
    $('#'+id).addClass('key');
});


socket.on('question', q => {
    $('#question').html(q);
    $('#commit').prop('disabled', false);
    startTimer(15, '#timer');
    startTimerSound(15);
    
    $('#answer-key').prop('disabled', true);
    $('.sub').text('');
    $('#answer').val('');
});


socket.on('timeout', () => {
    $('#commit').prop('disabled', true);
    $('#answer-key').prop('disabled', false);
    stopTimerSound();
});

socket.on('scores', (scores) => {
    scores.forEach((val, ind) => {
        $('#p'+ind+' .score').html(val);    
    });
});


socket.on('key answered', (tf) => {
    var k_player = $('.key');
    k_player.removeClass('key');
    k_player.addClass(tf ? 'solver' : 'banned');
    
    if (k_player.hasClass('me')) {
        $('#submission').html('');
        $('#answer, .submit, .ans-key').prop('disabled', true);
    }
    
    if (tf) {
        $('#answer, .submit, .ans-key').prop('disabled', true);
    }
});


socket.on('time', () => {
    startTimer(15, '#timer');
    startTimerSound(15);
});


$('.submit').click(() => {
    var ans = $('#answer');

    socket.emit('answer', ans.val(), (sub) => {
        $('.sub').html(sub);
    });
});


$('.ans-key').click(() => {
    socket.emit('key');
});