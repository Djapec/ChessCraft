onmessage = function(e) {
    const { gameIndex, parsedData } = e.data;

    function parseTimeStringToTimeObject(timeString) {
        const now = new Date();
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds);
    }

    function getCurrentMoveScheduledByTime(halfMoves, currentTime) {
        let lastMove = null;

        for (const move of halfMoves) {
            const moveTime = parseTimeStringToTimeObject(move.time);

            if (moveTime <= currentTime) {
                lastMove = move;
            } else {
                break; // Prekidamo petlju kada nađemo prvi budući potez
            }
        }

        return lastMove;
    }

    const now = new Date();
    const futureMoves = parsedData.halfMoves.filter(move => {
        const targetTime = parseTimeStringToTimeObject(move.time);
        return targetTime > now;
    });

    if (futureMoves.length === 0) {
        postMessage({ gameIndex, status: "complete", parsedData });
        return;
    }

    const timeoutIds = [];

    const scheduleNextMove = (moves, index) => {
        if (index >= moves.length) {
            postMessage({ gameIndex, status: "complete", parsedData });
            return;
        }

        const move = moves[index];
        const targetTime = parseTimeStringToTimeObject(move.time);
        const delay = targetTime - new Date();

        const timeoutId = setTimeout(() => {
            const moveScheduledByTime = getCurrentMoveScheduledByTime(parsedData.halfMoves, new Date());

            postMessage({
                gameIndex,
                status: "update",
                moveScheduledByTime
            });

            scheduleNextMove(moves, index + 1);
        }, delay);

        timeoutIds.push(timeoutId);
    };

    scheduleNextMove(futureMoves, 0);

    self.addEventListener('message', function(e) {
        if (e.data.command === 'stop') {
            timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
            postMessage({ gameIndex, status: "stopped" });
        }
    });
};
