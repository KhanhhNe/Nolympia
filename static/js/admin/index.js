var socket = io('/socket/index');

$('#start-btn').click(function () { if (!$(this).prop('disabled')) { socket.emit('start'); } });

socket.on('ready', (data) => { $('#ready').html(data); });
socket.on('completed', (tf) => { $('#start-btn').prop('disabled', !tf); });
socket.on('redirect', (url) => { window.location.assign(url); })