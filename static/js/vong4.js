var socket = io.connect('/socket/vong4');

socket.on('question', (q, sc) => {
  $('.question').removeClass('timing');
  $('.question').html(q);
  $('.point').html(sc);

  if (sc != null) {
    $('.question-info').removeClass('empty-point');
  } else {
    $('.question-info').addClass('empty-point');
  }
});

socket.on('pack', (p) => {
  $('.pack').text(p * 20 + 40);
  if (p != -1)
    $('.question-info').removeClass('empty-pack');
  else
    $('.question-info').addClass('empty-pack');
});

socket.on('score', (id, sc) => {
  $('.user#'+id+' .score').html(sc);
});

socket.on('star', (s) => {
  if (s == true) {
    $('.star-img').addClass('activated');
  } else if (s == false) {
    $('.star-img').removeClass('activated');
  }
});

socket.on('player', (id) => {
  $('.user#'+id).addClass('active');
});

socket.on('end game', () => {});

socket.on('end turn', (e) => {
  $('.user.active').removeClass('active');
});

socket.on('time', (t) => {
  $('.question').attr('data-time', t);
  $('.question').addClass('timing');
  startTimerSound(t);
  setTimeout("$('.question').removeClass('timing');", t*1000);
});

socket.on('countdown', (sec) => {
  $('.question').attr('data-time',  sec);
  $('.question').addClass('timing');
  setTimeout(() => {
    $('.question').removeClass('timing');
    stopTimerSound();
  }, sec*1000);
  startTimerSound(sec);
});

socket.on('raise hand', (uid) => {
  $('.user#'+uid).addClass('raising-hand');
});

function resetHand() {
  $('.user.raising-hand').removeClass('raising-hand');
}

$('.raise-hand').click(() => {
  socket.emit('raise hand');
});

socket.on('question', resetHand);
socket.on('end game', () => {
  resetHand();
  $('.question').removeClass('timing');
});
