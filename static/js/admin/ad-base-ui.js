var socket = window.socket;


$('#start-btn').click(() => { socket.emit('start'); });
$('#end-btn').click(() => { socket.emit('end'); });
$('#next-round').click(() => { socket.emit('redirect'); });