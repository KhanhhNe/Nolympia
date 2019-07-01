var socket = window.socket;


$('.start').click(() => {
  socket.emit('play');
});
$('.true, .false').click(function () {
    socket.emit('commit', $(this).hasClass('true'));
});
$('.next').click(() => { socket.emit('next'); });
$('.end').click(() => {
  socket.emit('redirect');
});

function disable_tf (tf) { $('.true, .false').prop('disabled', tf); }

socket.on('status', (stt) => {
  $('.next').prop('disabled', stt != 'next');
  $('.end').prop('disabled', stt != 'end'); 
  $('.start').prop('disabled', stt != '');
  
  disable_tf (stt != 'play');
});

socket.on('time', () => {
  $('.start').prop('disabled', true); 
});

$(document).keypress(function (event) {
  var key;
  switch (event.which) {
    case 32: // Space
      key = $('.start:not( [disabled] )');
      break;
    case 97: // A
      key = $('.true:not( [disabled] )');
      break;
    case 100: // D
      key = $('.false:not( [disabled] )');
      break;
    case 65: // Shift - A
      key = $('.next:not( [disabled] )');
      break;
    case 68: // Shift - D
      key = $('.end:not( [disabled] )');
      break;
  }
  
  key.focus();
  key.click();
});