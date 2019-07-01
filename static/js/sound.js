var audio = {}

function preloadSound(timeList) {
    $('body').append('<div id="audio" style="display: none;"');
    for (var i in timeList) {
        audio[timeList[i]] = new Audio('/static/sound/'+timeList[i]+'s.mp3');
        $('#audio').append($(audio[timeList[i]]));
    }
}


var currentAudio;

function startTimerSound (sec) {
    currentAudio = audio[sec];
    currentAudio.play();
}

function stopTimerSound () {
    currentAudio.pause();
    currentAudio.currentTime = 0;
}