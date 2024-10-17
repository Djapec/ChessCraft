import { Chess } from "../../../../public/chess.min.js"

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

    const chess = new Chess();
    const newMoves = [];
    const newHalfMoves = [];

    for (let i = 0; i < originalHalfMoves.length && i < moveLimit; i++) {
        const move = originalHalfMoves[i];
        chess.move(move.move, { sloppy: true });
        newHalfMoves.push(move);

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
    const full = `${player?.title || ''} ${player?.lname || ''}, ${player?.fname || ''}`;
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

export function areListsEqual(list1, list2) {
    if (list1.length !== list2.length) {
        return false;
    }

    for (let i = 0; i < list1.length; i++) {
        if (list1[i] !== list2[i]) {
            return false;
        }
    }
    return true;
}

export function createGameLookupMap(games) {
    return games.reduce((acc, { url, round, game }) => {
        acc[url] = { round, game };
        return acc;
    }, {});
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

export function getLastMove(history, turn) {
    let color = "";
    if (turn === 'white') {
        color = 'black';
    } else {
        color = 'white';
    }
    return {
        moveNumber: history.length - 1,
        color: color,
        playedMove: history[history.length - 1]
    };
}

export function getFirstLetter(str) {
    if (typeof str !== 'string' || str.length === 0) {
        return '';
    }
    return str.charAt(0);
}

export function replaceChessNotationWithIcons(notation) {
    return notation
        .replace(/N/g, '♞')
        .replace(/B/g, '♝')
        .replace(/K/g, '♚')
        .replace(/Q/g, '♛')
        .replace(/R/g, '♜');
}

export function groupMoves(movesString, startingNumber, playerToMove) {
    const movesArray = movesString.split(' ');
    let result = [];
    let isWhiteToMove = playerToMove === "w";

    let i = 0;

    if (!isWhiteToMove && i < movesArray.length) {
        result.push(`${startingNumber}. ... ${movesArray[i]}`);
        i++;
        startingNumber++;
    }

    for (; i < movesArray.length; i += 2) {
        if (i + 1 < movesArray.length && isWhiteToMove) {
            result.push(`${startingNumber +1}. ${movesArray[i]} ${movesArray[i + 1]}`);
        } else if (i + 1 < movesArray.length) {
            result.push(`${startingNumber}. ${movesArray[i]} ${movesArray[i + 1]}`);
        } else {
            result.push(`${startingNumber}. ${movesArray[i]}`);
        }
        startingNumber++;
    }

    return result.join(' ');
}

export function getPreviousMoveFenPosition(moveHistory) {
    let chess = new Chess();

    if (moveHistory.length > 1) {
        for (let i = 0; i < moveHistory.length; i++) {
            let move = moveHistory[i];
            chess.move(move);
        }
    }
    else {
        return {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            moveHistory: [],
        }
    }

    return {
        fen: chess.fen(),
        moveHistory: chess.history(),
    };
}

const axios = require('axios');
const CancelToken = axios.CancelToken;
let cancel;

export const getStockfishEvaluation = async (fen, depth) => {
    const endpoint = 'https://stockfish.online/api/s/v2.php';
    if (cancel) {
        cancel();
    }
    try {
        const response = await axios.get(endpoint, {
            params: {
                fen,
                depth,
            },
            cancelToken: new CancelToken(function executor(c) {
                cancel = c;
            }),
        });
        if (response.data && response.data.success) {
            return response.data.evaluation;
        } else {
            throw new Error('Failed to get evaluation data');
        }
    } catch (error) {
        if (axios.isCancel(error)) {
            //console.error('Request canceled:', error.message);
        } else {
            console.error('Error fetching evaluation:', error);
        }
        return null;
    }
};

export function handleEvaluationString(evaluation, apiScore) {
    if (evaluation.includes('mate')) {
        return evaluation;
    }

    const isPositive = isPositiveOrNegative(apiScore)
    if (isPositive === null) {
        return evaluation;
    }

    const numericValue = parseFloat(evaluation);
    if (!isNaN(numericValue)) {
        if (numericValue === 0.0) {
            return evaluation;
        }
        return isPositive > 0 ? Math.abs(numericValue).toString() : (-Math.abs(numericValue)).toString();
    }

    return evaluation;
}

function isPositiveOrNegative(numberString) {
    const numericValue = parseFloat(numberString);
    if (!isNaN(numericValue)) {
        return numericValue >= 0;
    }
    else return null
}

// Function to parse FEN notation and create a position object
function parseFEN(fen) {
    var pos = {
        board: [],
        sideToMove: 'w',
        castling: '',
        enPassant: '-',
        halfmoveClock: 0,
        fullmoveNumber: 1
    };

    var parts = fen.trim().split(/\s+/);
    var rows = parts[0].split('/');
    for (var i = 0; i < rows.length; i++) {
        var row = [];
        var chars = rows[i].split('');
        for (var j = 0; j < chars.length; j++) {
            var c = chars[j];
            if (isNaN(c)) {
                row.push(c);
            } else {
                for (var k = 0; k < parseInt(c); k++) {
                    row.push(null);
                }
            }
        }
        pos.board.push(row);
    }
    pos.sideToMove = parts[1];
    pos.castling = parts[2];
    pos.enPassant = parts[3];
    pos.halfmoveClock = parseInt(parts[4]);
    pos.fullmoveNumber = parseInt(parts[5]);

    return pos;
}

// Control of the center squares
function control_center(pos) {
    const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
    let score = 0;
    for (let [x, y] of centerSquares) {
        let piece = pos.board[x][y];
        if (piece) {
            if (piece === piece.toUpperCase()) score += 20;
            else score -= 20;
        }
    }
    return score;
}

// Pawn structure evaluation
// Pawn structure evaluation
function pawn_structure(pos) {
    let score = 0;
    let files = { 'a': [], 'b': [], 'c': [], 'd': [], 'e': [], 'f': [], 'g': [], 'h': [] };

    // Populate the files with pawns
    for (let i = 0; i < pos.board.length; i++) {
        for (let j = 0; j < pos.board[i].length; j++) {
            let piece = pos.board[i][j];
            if (piece && (piece === 'P' || piece === 'p')) {
                let file = 'abcdefgh'[j];
                files[file].push(piece);
            }
        }
    }

    // Penalize doubled and isolated pawns
    for (let file in files) {
        if (files[file].length > 1) {
            if (files[file][0] === 'P') score -= 30;
            else score += 30;
        }

        // Isolated pawns
        let prevFile = String.fromCharCode(file.charCodeAt(0) - 1);
        let nextFile = String.fromCharCode(file.charCodeAt(0) + 1);

        // Ensure prevFile and nextFile are within the valid range of 'a' to 'h'
        if (files[file].length > 0 &&
            ((!files[prevFile] || files[prevFile].length === 0) &&
                (!files[nextFile] || files[nextFile].length === 0))) {

            if (files[file][0] === 'P') score -= 30; // Isolated white pawn
            else score += 30;
        }
    }

    return score;
}

// King safety (simple penalty for exposed kings)
function king_safety(pos) {
    let score = 0;

    // King positions
    let whiteKingPos = null;
    let blackKingPos = null;

    for (let i = 0; i < pos.board.length; i++) {
        for (let j = 0; j < pos.board[i].length; j++) {
            if (pos.board[i][j] === 'K') whiteKingPos = [i, j];
            if (pos.board[i][j] === 'k') blackKingPos = [i, j];
        }
    }

    // Penalize for exposed kings
    if (whiteKingPos[0] < 2) score -= 50;
    if (blackKingPos[0] > 5) score += 50;

    return score;
}

// Mobility (number of pieces)
function mobility(pos) {
    let whitePieces = 0, blackPieces = 0;
    for (let i = 0; i < pos.board.length; i++) {
        for (let j = 0; j < pos.board[i].length; j++) {
            let piece = pos.board[i][j];
            if (piece) {
                if (piece === piece.toUpperCase()) whitePieces++;
                else blackPieces++;
            }
        }
    }

    // Return a small advantage to the side with more active pieces
    return whitePieces - blackPieces;
}

// Material and positional evaluation for middle game
function middle_game_evaluation(pos) {
    var pieceValues = {
        'P': 100,
        'N': 320,
        'B': 330,
        'R': 500,
        'Q': 900,
        'K': 20000,
        'p': -100,
        'n': -320,
        'b': -330,
        'r': -500,
        'q': -900,
        'k': -20000
    };

    var score = 0;
    for (var i = 0; i < pos.board.length; i++) {
        for (var j = 0; j < pos.board[i].length; j++) {
            var piece = pos.board[i][j];
            if (piece) {
                score += pieceValues[piece] || 0;
            }
        }
    }

    // Add positional factors
    score += control_center(pos);
    score += pawn_structure(pos);
    score += king_safety(pos);
    score += mobility(pos);

    return score;
}

// Main evaluation function
function main_evaluation(fen) {
    var pos = parseFEN(fen);
    var mg = middle_game_evaluation(pos);
    var eg = middle_game_evaluation(pos);
    var p = 64; // Assume midgame phase
    var rule50Val = pos.halfmoveClock;

    eg = (eg * 64 / 64) << 0;
    var v = (((mg * p + eg * (128 - p)) / 128) << 0);
    if (arguments.length === 1) v = ((v / 16) << 0) * 16;
    v += (pos.sideToMove === 'w' ? 16 : -16);
    v = ((v * (100 - rule50Val) / 100) << 0);
    return v;
}