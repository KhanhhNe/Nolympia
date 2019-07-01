function setTime (milisec, max, timerId) {
	var percentage = milisec / (max*1000) * 100;
	$(timerId+' .progress-bar').css('width', percentage+'%');
}

function startTimer (seconds, timerId) {
	$(timerId+' .progress-bar').data('max', seconds);
	var max = seconds;
	var currentSeconds = $(timerId).data('current');
	if (currentSeconds) {
		max -= currentSeconds;
		$(timerId).data('current', 0);
	}

	var start = (new Date()).getTime();
	var secondsPassed;
	
	var interval = setInterval(function () {
		secondsPassed = (new Date()).getTime() - start;
		if (secondsPassed >= max*1000) {
			setTime(max*1000, max, timerId);
			clearInterval(interval);
			return;
		}
		setTime(secondsPassed, max, timerId);
	}, 100);
	
	return interval;
}

$('.timer-controller').click(function () {
	clearInterval($(this).data('interval'));
	var timerId = $(this).data('to');
	var duration = $(this).data('duration');
	var interval = startTimer(duration, timerId);
	$(this).data('interval', interval);
});