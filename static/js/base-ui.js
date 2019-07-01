var socket = window.socket;


socket.on('start', () => {
    $('#ready').hide();
    $('#contest').show();
    $('#end').hide();
});
socket.on('end', () => {
    $('#ready').hide();
    $('#contest').hide();
    $('#end').show();
});
socket.on('redirect', (url) => { window.location.assign(url); });