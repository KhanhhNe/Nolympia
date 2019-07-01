var socket = io.connect('/socket/vong1');


socket.on('score', (uid, score) => { $('#'+uid+' .score').html(score); });

socket.on('user', (uid) => {
    $('.active').removeClass('active');
    if (uid) {
        $('#'+uid).addClass('active');
    }
});

socket.on('played', () => {
    var active = $('.active');
    if (active) {
        active.removeClass('active');
    }
});

socket.on('redirect', (url) => {
  window.location.href = url;
});

socket.on('question', (question) => {  $('.question').html(question); });
socket.on('time', () => {
	$('.question').addClass('timing');
	startTimerSound(60);
});
socket.on('timeout', () => {
    $('.question').removeClass('timing');
    stopTimerSound();
});