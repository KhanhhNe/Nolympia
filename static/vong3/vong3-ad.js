var socket = window.socket;


$('.next-question').click(function () {
    $('#submissions').addClass('hide-vis');
    var self = $(this);
    
    socket.emit('question', () => {
        self.prop('disabled', true);
        $('.show-subs').prop('disabled', true);
        startTimer(30, '#time-bar');
    });
});


socket.on('timeout', () => {
    $('.next-question').prop('disabled', false);
});


$('.show-subs').click(function () {
    socket.emit('score');
    $('#submissions').removeClass('hide-vis');
    $(this).prop('disabled', true);
});


socket.on('subs', (subs) => {
    var def = $('.time').attr('default-value');
    
    for (var id in subs) {
        var sub = $("[to='"+id+"']").children('.sub');
        sub.children('.answer').html(subs[id][0]);
        sub.children('.time').html(subs[id][0] != '' ? subs[id][1]/1000 : def);
    }
    
    $('.show-subs').prop('disabled', false);
});


function replaceDisplay (firstElem, secondElem) {
    $(firstElem).addClass('hide');
    $(secondElem).removeClass('hide');
};

$('.start-btn').click(() => { replaceDisplay('.ready-div', '.contest-div'); });
$('.end-btn').click(() => { replaceDisplay('.contest-div', '.end-div'); });
$('.next-round').click(() => { socket.emit('redirect') });


socket.on('end', () => {
    $('.sans:not(.end-btn)').prop('disabled', true);
    $('.end-btn').prop('disabled', false);
});