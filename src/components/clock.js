let currentTimeoutId = null;

export function timeToSeconds(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') {
        console.log('Invalid time string:', timeStr);
        clearClockTimeoutInterval();
        return;
    }

    const [hours, minutes, seconds] = timeStr.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        console.log('Time string contains invalid numbers:', timeStr);
        clearClockTimeoutInterval();
        return;
    }

    return hours * 3600 + minutes * 60 + seconds;
}

export function secondsToTime(seconds) {
    if (seconds == null || typeof seconds !== 'number' || seconds < 0) {
        console.log('Invalid seconds value:', seconds);
        clearClockTimeoutInterval();
        return;
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function calculateRemainingTime(sat, startTime) {
    if (!sat || !startTime) {
        console.log('Invalid input times: sat, startTime, or realTime is null or undefined.');
        clearClockTimeoutInterval();
        return;
    }

    const realTimeInSeconds = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        return (hours * 3600) + ((minutes) * 60) + seconds;
    };

    const satSeconds = timeToSeconds(sat);
    const startTimeInSeconds = timeToSeconds(startTime);

    console.log(`${satSeconds} ${startTimeInSeconds} ${realTimeInSeconds()}`);

    if (satSeconds == null || startTimeInSeconds == null) {
        return;
    }

    const elapsed = realTimeInSeconds() - startTimeInSeconds;
    const remaining = satSeconds - elapsed;

    return secondsToTime(Math.max(0, remaining));
}

export function countdownTimer(playerColor, startingTime) {
    let remainingSeconds = timeToSeconds(startingTime);

    if (remainingSeconds == null) {
        console.log('Invalid starting time:', startingTime);
        return;
    }

    if (currentTimeoutId !== null) {
        clearClockTimeoutInterval();
    }

    function tick() {
        if (remainingSeconds > 0) {
            remainingSeconds--;
            currentTimeoutId = setTimeout(tick, 1000);
            if (playerColor === 'black') {
                let clockElement = document.getElementById('whitePlayerClock');
                if (clockElement) {
                    clockElement.innerText = secondsToTime(remainingSeconds);
                } else {
                    console.log('Element with id "whitePlayerClock" not found.');
                    clearClockTimeoutInterval();
                }
            } else if (playerColor === 'white'){
                let clockElement = document.getElementById('blackPlayerClock');
                if (clockElement) {
                    clockElement.innerText = secondsToTime(remainingSeconds);
                } else {
                    console.log('Element with id "blackPlayerClock" not found.');
                    clearClockTimeoutInterval();
                }
            }
        } else {
            clearClockTimeoutInterval();
            console.log("Countdown finished!");
        }
    }

    tick();
}

export function clearClockTimeoutInterval() {
    if (currentTimeoutId !== null) {
        clearTimeout(currentTimeoutId);
        currentTimeoutId = null;
    }
}

export function clockUsageTest(playerColor, playerClock, timeWhenLastMoveWasPlayed) {
    if (!playerClock || !timeWhenLastMoveWasPlayed) {
        console.log('playerClock or timeWhenLastMoveWasPlayed is null or undefined.');
        clearClockTimeoutInterval();
        return;
    }
    console.log('playerClock', timeWhenLastMoveWasPlayed);
    const startingTime = calculateRemainingTime(playerClock, timeWhenLastMoveWasPlayed);
    if (!startingTime) {
        return;
    }
    countdownTimer(playerColor, startingTime);
}

function addMinutesToTime(timeStr, minutesToAdd) {
    if (!timeStr || typeof minutesToAdd !== 'number') {
        console.log('Invalid input to addMinutesToTime:', timeStr, minutesToAdd);
        clearClockTimeoutInterval();
        return;
    }

    const totalSeconds = timeToSeconds(timeStr);
    if (totalSeconds == null) {
        return;
    }

    const additionalSeconds = minutesToAdd * 60;
    const newTotalSeconds = totalSeconds + additionalSeconds;

    return secondsToTime(newTotalSeconds);
}