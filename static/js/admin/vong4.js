var socket = window.socket;

setInterval(() => {
  var uid = $('.user-select').val();
  var score = $('.user#'+uid+' .score').text();
  $('.score-input').attr('placeholder', score);
}, 200);

$('.update-score').click(function () {
  var self = this;
  self.disabled = true;

  var uid = $('.user-select').val();
  var sc = $('.score-input').val();
  socket.emit('change score', uid, sc, () => {
    self.disabled = false;
    $('.score-input').val('');
  });
});

$('.next').click(function () {
  socket.emit('next');
});

$('.choose-question').click(function () {
  var p = $('.question-select').val();
  socket.emit('choose pack', parseInt(p), () => {
    $('.choose-pack').addClass('hide');
  });
});

socket.on('pack', (p) => {
  if (p == -1) {
    $('.choose-pack').removeClass('hide');
    $('.question-select').val(0);
  }
});

$('.star').click(function () {
  if (!$(this).hasClass('activated')) {
    socket.emit('star', () => {
      $('.star').addClass('activated');
    });
  }
});

socket.on('end game', () => {
  $('.star').removeClass('activated');
});

$('.catch').click(() => {
  socket.emit('timer', 5);
});

$(document).ready(function () {
  $('.score-input').attr('placeholder',
    $('.user#'+$('.user-select').val())
    .children('.score')
    .text()
  );
});

$('.user').click(function () {
  $('.user-select').val(this.id);
  $('.score-input').attr(
    'placeholder',
    $(this).children('.score').text()
  );
});

tippy('.btn, .choice, .submit, .input');

$(document).keypress(function (event) {
  var key;
  var click = false;
  switch (event.which) {
    case 33: // Shift - 1
      $('.user#p1').click();
      $('.user-select').focus();
      break;
    case 64: // Shift - 2
      $('.user#p2').click();
      $('.user-select').focus();
      break;
    case 35: // Shift - 3
      $('.user#p3').click();
      $('.user-select').focus();
      break;
    case 36: // Shift - 4
      $('.user#p4').click();
      $('.user-select').focus();
      break;
    case 37: // Shift - 5
      $('.question-select').val(0);
      $('.question-select').focus();
      break;
    case 94: // Shift - 6
      $('.question-select').val(1);
      $('.question-select').focus();
      break;
    case 38: // Shift - 7
      $('.question-select').val(2);
      $('.question-select').focus();
      break;
    case 97: // A
      $('.score-input').focus();
      break;
    case 13: // Enter
      key = $('.update-score');
      click = true;
      break;
    case 90: // Shift - Z
      key = $('.choose-question');
      click = true;
      break;
    case 32: // Space
      key = $('.next');
      click = true;
      break;
    case 83: // Shift - S
      key = $('.star');
      click = true;
      break;
    case 115: // S
      key = $('.catch');
      click = true;
      break;
    case 81: // Shift - Q
      key = $('.end');
      click = true;
      break;
  }
  
  if (click) {
    key.focus();
    key.click();
  }
});