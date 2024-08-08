export function calculateMoveTime(startTournamentTime, delayInSeconds, cumulativeEMT, emt) {
    const emtSeconds = parseTimeToSeconds(emt || '0:00:00');
    const moveTime = new Date(startTournamentTime.getTime() + (delayInSeconds + cumulativeEMT + emtSeconds) * 1000);

    return moveTime.toTimeString().split(' ')[0];
}

export function parseTimeToSeconds(timeStr) {
    const timeParts = timeStr.split(':');
    const hours = parseInt(timeParts[0]) || 0;
    const minutes = parseInt(timeParts[1]) || 0;
    const seconds = parseInt(timeParts[2]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
}

export function partlyClonePgn(parsedPGN, moveLimit) {
    const { metadata, moves, chess: originalChess, halfMoves: originalHalfMoves } = parsedPGN;

    // Create a new Chess instance and apply moves up to the moveLimit
    const chess = new Chess();
    const newMoves = [];
    const newHalfMoves = [];

    for (let i = 0; i < originalHalfMoves.length && i < moveLimit; i++) {
        const move = originalHalfMoves[i];
        chess.move(move.move, { sloppy: true });
        newHalfMoves.push(move);

        // Add the move to the newMoves array in the correct format
        if (move.color === 'white') {
            newMoves.push({ white: move });
        } else {
            newMoves[newMoves.length - 1].black = move;
        }
    }

    return {
        metadata,
        moves: newMoves,
        chess,
        halfMoves: newHalfMoves
    };
}

export function validateRoundNumber(stringNumber) {
    const number = Number(stringNumber);
    if (!Number.isInteger(number) || number <= 0) {
        throw new Error('Invalid round number: must be a positive integer.');
    }
    return number;
}

export function parseTimeToDate(timeStr) {
    const now = new Date();
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds);
}

export function parseTimeStringToTimeObject(timeString) {
    const now = new Date();
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds);
}

export function getCurrentMoveScheduledByTime(halfMoves, currentTime) {
    let lastMove = null;
    for (const move of halfMoves) {
        const moveTime = parseTimeStringToTimeObject(move.time);

        if (moveTime <= currentTime) {
            lastMove = move;
        } else {
            break;
        }
    }
    return lastMove;
}

export function addDelayToTime(time, delayMinutes) {
    const delayedTime = new Date(time);
    delayedTime.setMinutes(delayedTime.getMinutes() + delayMinutes);
    return delayedTime;
}

export async function fetchTournament(id) {
    const tournamentRes = await fetch(getTourneyUrl(id));
    return await tournamentRes.json();
}

export async function fetchPairsData(id, rounds) {
    const fetchedRounds = rounds.map(round => fetch(getRoundUrl(id, round)));
    const fetchedRoundsResponses = await Promise.all(fetchedRounds);
    const jsonResponses = fetchedRoundsResponses.map(response => response.json());
    return await Promise.all(jsonResponses);
}

export async function getGamesInfo(games) {
    const fetchGame = async (game) => {
        try {
            const response = await fetch(game.url, { cache: 'no-store' });
            return await response.json();
        } catch (error) {
            return { error: `Failed to fetch game data: ${error.message}` };
        }
    };

    const gamesPromises = games.map(fetchGame);
    return await Promise.allSettled(gamesPromises);
}

export function getTourneyUrl(id) {
    return `https://1.pool.livechesscloud.com/get/${id}/tournament.json`;
}

export function getRoundUrl(id, round) {
    return `https://1.pool.livechesscloud.com/get/${id}/round-${round}/index.json`;
}

export function getGameUrl(id, round, game) {
    return `https://1.pool.livechesscloud.com/get/${id}/round-${round}/game-${game}.json?poll`;
}

export function getGamesUrls(id, roundsWithGames, pairsData, desiredPairs = null) {
    return roundsWithGames.flatMap((round, roundIndex) => {
        const pairingsCount = pairsData[roundIndex].pairings.length;
        const pairs = Array.from({ length: pairingsCount }, (_, i) => ({
            url: getGameUrl(id, round, i + 1),
            round: round,
            game: i + 1,
        }));
        return desiredPairs ? pairs.filter(pair => desiredPairs.includes(pair.game)) : pairs;
    });
}

function convertDateFormat(inputDate) {
    return inputDate.split('-').join('.');
}

function getFormattedMoves(moves) {
    let str = '';

    function convertSecondsToClock(seconds) {
        const hrs = String(Math.floor(seconds / 3600)).padStart(1, '0');
        const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        return `${hrs}:${mins}:${secs}`;
    }

    for (let i = 0; i < moves.length; i++) {
        if (i % 2 === 0) {
            str += `${Math.ceil((i + 1) / 2).toString()}. `;
        }

        const [move, time] = moves[i].split(' ');

        if (!move) {
            console.error(`Invalid move format at index ${i}: ${moves[i]}`);
            continue;
        }

        if (!time || isNaN(parseInt(time.split('+')[0])) || isNaN(parseInt(time.split('+')[1]))) {
            // If time is missing or invalid, just add the move without the clock time
            str += `${move} `;
        } else {
            const mainTimeSeconds = parseInt(time.split('+')[0]);
            const emtSeconds = parseInt(time.split('+')[1]);
            const mainTime = convertSecondsToClock(mainTimeSeconds);
            const emtTime = convertSecondsToClock(emtSeconds);
            str += `${move} {[%clk ${mainTime}]} {[%emt ${emtTime}]} `;
        }
    }

    str = str.trim();
    return str;
}

function getPlayerFullName(player) {
    const full = `${player.title || ''} ${player.lname || ''}, ${player.fname || ''}`;
    return full.trim() === ',' ? '?' : full;
}

export function parseToPgn(tournament, pairing, game, round, date) {
    let pgn = [
        `[Event "${tournament.name || '?'}"]`,
        `[Site "${tournament.location || '?'}"]`,
        `[Date "${date ? convertDateFormat(date) : '?'}"]`,
        `[Round "${round}"]`,
        `[White "${getPlayerFullName(pairing.white)}"]`,
        `[Black "${getPlayerFullName(pairing.black)}"]`,
        `[Result "${getGameResult(game.result)}"]`,
        `[StartTime "${game.firstMove || '?'}"]`,
        `[PlyCount "${game.moves.length}"]`,
        `[TimeControl "${tournament.timecontrol || '?'}"]`,
    ].join('\n');
    pgn += '\n\n';
    pgn += getFormattedMoves(game.moves);
    pgn += ` ${getGameResult(game.result)}`;
    return pgn;
}

function getGameResult(code) {
    switch (code) {
        case 'WHITEWIN':
            return '1-0';
        case 'BLACKWIN':
            return '0-1';
        case 'DRAW':
            return '1/2-1/2';
        case 'BLACKFORFAIT':
            return '0-1';
        case 'WHITEFORFAIT':
            return '1-0';
        default:
            return '*';
    }
}

export function createGameLookupMap(games) {
    return games.reduce((acc, { url, round, game }) => {
        acc[url] = { round, game };
        return acc;
    }, {});
}

export function getRoundsWithGames(rounds) {
    return rounds.reduce((acc, { count }, idx) => {
        if (count > 0) acc.push(idx + 1);
        return acc;
    }, []);
}

export function generatePgn(tournament, pairsInfo, gamesInfo, gamesUrls, lookupMap) {
    const pgnList = gamesInfo.reduce((acc, { status, value }, idx) => {
        if (status !== 'fulfilled') {
            return acc;
        }
        const { url } = gamesUrls[idx];
        const { round, game } = lookupMap[url];
        const pairs = pairsInfo[round - 1] || pairsInfo[0];
        const pairing = pairs.pairings[game - 1];
        const pgn = parseToPgn(tournament, pairing, value, round, pairs.date);
        acc.push(pgn);

        return acc;
    }, []);

    const pgn = pgnList.join('\n\n');

    if (!pgn) {
        throw new Error('No valid PGN found.');
    }
    return pgn;
}
