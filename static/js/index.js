var socket = io.connect('/socket/index');
var ready_btn = $('#ready-btn');

ready_btn.click(() => { socket.emit('get ready'); });

socket.on('ok', function (r) {
    if (r) { ready_btn.addClass('ready'); }
    else { ready_btn.removeClass('ready'); }
})
socket.on('ready', function (count) { $('#ready').html(count); });
socket.on('redirect', (url) => { window.location.assign(url); });