let currentTimeoutId = null;

export function timeToSeconds(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}

export function secondsToTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const sec = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function calculateRemainingTime(sat, pocetnoVreme, realTime) {
    const satSeconds = timeToSeconds(sat);
    const pocetnoVremeSeconds = timeToSeconds(pocetnoVreme);
    const realTimeSeconds = timeToSeconds(realTime);

    const elapsed = realTimeSeconds - pocetnoVremeSeconds;
    const remaining = satSeconds - elapsed;

    return secondsToTime(Math.max(0, remaining));
}

export function countdownTimer(startingTime) {
    let remainingSeconds = timeToSeconds(startingTime);

    if (currentTimeoutId !== null) {
        clearTimeout(currentTimeoutId);
    }

    function tick() {
        if (remainingSeconds > 0) {
            remainingSeconds--;
            console.log(secondsToTime(remainingSeconds));
            currentTimeoutId = setTimeout(tick, 1000);
        } else {
            console.log("Countdown finished!");
        }
    }

    tick();
}

export function clockUsageTest(playerClock, timeWhenLastMoveWasPlayed) {
    const startingTime =
        calculateRemainingTime(playerClock, timeWhenLastMoveWasPlayed, addMinutesToTime(timeWhenLastMoveWasPlayed, 1));
    countdownTimer(startingTime);
}

function addMinutesToTime(timeStr, minutesToAdd) {
    const totalSeconds = timeToSeconds(timeStr);
    const additionalSeconds = minutesToAdd * 60;
    const newTotalSeconds = totalSeconds + additionalSeconds;

    return secondsToTime(newTotalSeconds);
}