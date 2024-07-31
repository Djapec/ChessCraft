import { Chess } from "../../../public/chess.min.js"; // version 0.13.4
import { nanoid } from 'nanoid'

export function parsePgnWithDelay(pgn, startTournamentTime = null, delay = null) {
    const [metadataPart, movesPart] = pgn.split('\n\n');

    const metadata = metadataPart ? Object.fromEntries(
        metadataPart.split('\n').map(line => {
            const match = line.match(/^\[(\w+)\s+"(.+)"\]$/);
            return match ? [match[1], match[2]] : null;
        }).filter(Boolean)
    ) : {};

    const chess = new Chess();
    const moves = [];
    const halfMoves = [];
    let halfMoveId = 1; // Initialize the half-move ID counter

    //const tournamentStartDate = startTournamentTime ? new Date(startTournamentTime) : null;
    let gameStartDate = null;
    if (metadata.StartTime !== '?') {
        gameStartDate = new Date(Number(metadata.StartTime))
    }
    const delayInSeconds = delay ? delay * 60 : 0; // 0 if delay is null

    if (movesPart) {
        let cumulativeEMT = 0; // Cumulative elapsed move time

        movesPart.split(/\d+\./).slice(1).forEach(line => {
            const moveMatch = line.trim().match(/([^\s]+)\s*(?:{\[%clk\s*([0-9:]+)\]})?\s*(?:{\[%emt\s*([0-9:]+)\]})?\s*([^\s]+)?\s*(?:{\[%clk\s*([0-9:]+)\]})?\s*(?:{\[%emt\s*([0-9:]+)\]})?/);
            if (moveMatch) {
                const [_, whiteMove, whiteClockTime, whiteEMTTime, blackMove, blackClockTime, blackEMTTime] = moveMatch;

                if (chess.move(whiteMove, { sloppy: true })) {
                    const whiteTime = gameStartDate ? calculateMoveTime(gameStartDate, delayInSeconds, cumulativeEMT, whiteEMTTime) : null;
                    cumulativeEMT += parseTimeToSeconds(whiteEMTTime || '0:00:00');
                    const whiteHalfMove = {
                        id: halfMoveId++,
                        color: "white",
                        move: whiteMove,
                        clock: whiteClockTime || null,
                        emt: whiteEMTTime || null,
                        time: whiteTime || null,
                    };
                    moves.push({ white: whiteHalfMove });
                    halfMoves.push(whiteHalfMove);
                }

                if (blackMove && chess.move(blackMove, { sloppy: true })) {
                    const blackTime = gameStartDate ? calculateMoveTime(gameStartDate, delayInSeconds, cumulativeEMT, blackEMTTime) : null;
                    cumulativeEMT += parseTimeToSeconds(blackEMTTime || '0:00:00');
                    const blackHalfMove = {
                        id: halfMoveId++,
                        color: "black",
                        move: blackMove,
                        clock: blackClockTime || null,
                        emt: blackEMTTime || null,
                        time: blackTime || null,
                    };
                    moves[moves.length - 1].black = blackHalfMove;
                    halfMoves.push(blackHalfMove);
                }
            }
        });
    }

    return {
        id: nanoid(),
        metadata,
        moves,
        chess,
        halfMoves,
    };
}

function calculateMoveTime(startTournamentTime, delayInSeconds, cumulativeEMT, emt) {
    const emtSeconds = parseTimeToSeconds(emt || '0:00:00'); // default 0 seconds if emt is null
    const moveTime = new Date(startTournamentTime.getTime() + (delayInSeconds + cumulativeEMT + emtSeconds) * 1000);

    return moveTime.toTimeString().split(' ')[0]; // Return the time part only
}

function parseTimeToSeconds(timeStr) {
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
            break; // Prekidamo petlju kada nađemo prvi budući potez
        }
    }

    return lastMove;
}

export function addDelayToTime(time, delayMinutes) {
    const delayedTime = new Date(time);
    delayedTime.setMinutes(delayedTime.getMinutes() + delayMinutes);
    return delayedTime;
}