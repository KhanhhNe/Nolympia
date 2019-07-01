var socket = window.socket;


$('.select').click(function () {
    var self = $(this);
    var num = parseInt($(this).attr('id'));
    socket.emit('choose', num, () => {
        self.addClass('disabled');
        $('[to="'+self.attr('id')+'"]').addClass('active');
    });
});


socket.on('subs', (subs) => {
    $('#submissions').children().each(function (ind) {
        $(this).find('.submission').text(subs[ind] || '');
    });
    $('.show-subs').prop('disabled', false);
});


socket.on('timeout', () => {
});


socket.on('key', (id) => {
    $('.key-commit').prop('disabled', false);
});


socket.on('key answered', (tf) => {
    $('.key-commit').prop('disabled', false);
    if (tf) {
        $('.end-btn').prop('disabled', false);
        $('.show-clue').addClass('all');
        $('.show-clue').click(() => {
            $('.clue-image, .answer-text').addClass('open done');
        });
    }
});

socket.on('no question', () => {
    $('.end-btn').prop('disabled', false);
});


$('.show-subs').click(function () {
    $(this).prop('disabled', true);
    $('#submissions').css('visibility', 'visible');
});

$('.next-q').click(function () {
    $('#submissions').css('visibility', 'hidden');
    $('.clue-image.active, .answer-text.active').removeClass('active');
});

$('.key-commit').click(function () {
    var res = JSON.parse($(this).attr('res'));
    socket.emit('submit key', res, () => {
        $('.key-commit').prop('disabled', true);
    });
});

$('.end-btn').click(function () {
    socket.emit('end');
});


function replaceDisplay (firstElem, secondElem) {
    $(firstElem).addClass('hide');
    $(secondElem).removeClass('hide');
};



$('.start-btn').click(() => { replaceDisplay('.ready-div', '.contest-div'); });
$('.end-btn').click(() => { replaceDisplay('.contest-div', '.end-div'); });
$('.next-round').click(() => { socket.emit('redirect'); });


socket.on('end', () => {
    $('.end-btn').prop('disabled', false);
});

$('.next-btn').click(() => {
    socket.emit('redirect');
});

$('.show-clue').click(() => {
    var image = $('.clue-image.active');
    image.toggleClass('active open');
    var answer = $('.answer-text.active');
    answer.toggleClass('active done');
});