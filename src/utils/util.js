import {Chess} from "../../public/chess.min.js"
import CryptoJS from 'crypto-js';
import {getEmojiFlag} from "./countries";

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

export function isToday(timestamp) {
    if (typeof timestamp === 'string') {
        timestamp = parseInt(timestamp, 10);
    }
    if (timestamp < 1e12) {
        timestamp *= 1000;
    }

    const date = new Date(timestamp);
    const today = new Date();

    return date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();
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

const secretKey = 'your-secret-key';

export function encryptTournamentId(tournamentId) {
    return btoa(tournamentId);
}

export async function fetchTournament(id) {
    try {
        const tournamentRes = await fetch(getTourneyUrl(id));
        const encryptedData = await tournamentRes.json();
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedData.data, secretKey);
        return JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
        console.error('Error fetching or decrypting tournament data:', error);
    }
}

export async function fetchPairsData(id, rounds) {
    try {
        const fetchedRounds = rounds.map(round => fetch(getRoundUrl(id, round)));
        const fetchedRoundsResponses = await Promise.all(fetchedRounds);

        return await Promise.all(
            fetchedRoundsResponses.map(async (response) => {
                const encryptedData = await response.json();
                const decryptedBytes = CryptoJS.AES.decrypt(encryptedData.data, secretKey);
                return JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));
            })
        );
    } catch (error) {
        console.error('Error fetching or decrypting rounds data:', error);
        throw error;
    }
}
export async function getGamesInfo(games) {
    const fetchGame = async (game) => {
        try {
            const response = await fetch(game.url, { cache: 'no-store' });
            const encryptedData = await response.json();

            const decryptedBytes = CryptoJS.AES.decrypt(encryptedData.data, secretKey);
            return JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));
        } catch (error) {
            return { error: `Failed to fetch game data: ${error.message}` };
        }
    };

    const gamesPromises = games.map(fetchGame);
    return await Promise.allSettled(gamesPromises);
}
const PROXY_URL = 'https://secure.mensch-sandbox.com/api/proxy';
const PROXY_LOCALHOST_URL = 'http://localhost:3333/api/proxy';
const PROXY_ECUTV_URL = 'https://secure.ecutv.eu/api/proxy';

export function getTourneyUrl(id) {
    return `${PROXY_LOCALHOST_URL}?id=${id}`;
}

export function getRoundUrl(id, round) {
    return `${PROXY_LOCALHOST_URL}?id=${id}&round=${round}`;
}

export function getGameUrl(id, round, game) {
    return `${PROXY_LOCALHOST_URL}?id=${id}&round=${round}&game=${game}`;
}

export function getGamesUrl(id, round, game) {
    return `${PROXY_LOCALHOST_URL}/game?id=${id}&round=${round}&game=${game}`;
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

export function getPlayerFullName(player) {
    const flag = player?.federation ? getEmojiFlag(player.federation) : '';
    const full = `${flag} ${player?.title || ''} ${player?.lname || ''} ${player?.fname || ''} ${player?.rating || ''}`;
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
        `[TimeControl "${tournament.timecontrol || '?'}"]`,
    ].join('\n');
    pgn += '\n\n';
    if (game.moves) {
        pgn += getFormattedMoves(game.moves);
        pgn += ` ${getGameResult(game.result)}`;
    }
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
        console.error('No valid PGN found');
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

export function formatMovesToSanNotation(moveLine, currentGameHistory) {
    let chess = new Chess();
    const validSanMoves = [];

    for (let i = 0; i < currentGameHistory.length; i++) {
        let move = currentGameHistory[i];
        chess.move(move);
    }

    for (const move of moveLine) {
        let moveInSanFormat = chess.move({from: move.substring(0, 2), to: move.substring(2, 4)})
        if (moveInSanFormat)
            validSanMoves.push(moveInSanFormat.san);
    }

    return validSanMoves
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

export const fetchGames = async (tournamentId, roundId, gameIndex) => {
    const endpoint = getGamesUrl(tournamentId, roundId, gameIndex);
    if (cancel) {
        cancel();
    }
    try {
        const response = await axios.get(endpoint, {
            cancelToken: new CancelToken(function executor(c) {
                cancel = c;
            }),
        });
        const encryptedData = response.data;
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedData.data, secretKey);
        return JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
        if (axios.isCancel(error)) {
            // console.error('Request canceled:', error.message);
        } else {
            console.error('Error fetching or decrypting tournament data:', error);
        }
        return null;
    }
};

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

export function isTwentyMinutesLater(givenTime) {
    if (typeof givenTime !== 'string') {
        throw new Error('givenTime must be a string in the format "HH:MM:SS"');
    }

    const currentTime = new Date();
    const [hours, minutes, seconds] = givenTime.split(':').map(Number);
    const givenDate = new Date();
    givenDate.setHours(hours, minutes, seconds || 0, 0);

    if (givenDate > currentTime) {
        givenDate.setDate(givenDate.getDate() - 1);
    }

    const differenceInMinutes = (currentTime - givenDate) / (1000 * 60);
    return differenceInMinutes >= 20;
}
/**
 * Formats chess player information by removing any 4-digit number (rating).
 * Handles both single player format and paired players separated by a hyphen.
 *
 * For paired players format like "SLO GM Fedoseev Vladimir 2731 - MNE Djukanovic Mitar 2033",
 * it will return "SLO GM Fedoseev Vladimir - MNE Djukanovic Mitar"
 *
 * @param {string} input - Player information string (single player or paired players)
 * @returns {string} - Formatted string with ratings removed
 */
export function formatPlayerInfo(input) {
    // Check if the input contains a hyphen (paired players)
    if (input.includes(' - ')) {
        // Split by the hyphen and process each player separately
        const players = input.split(' - ');
        const formattedPlayers = players.map(player => removeRating(player.trim()));
        return formattedPlayers.join(' - ');
    } else {
        // Single player format
        return removeRating(input);
    }
}

/**
 * Helper function to remove the rating from a single player's information
 *
 * @param {string} playerInfo - Single player information string
 * @returns {string} - Player information with rating removed
 */
function removeRating(playerInfo) {
    // Check if the string ends with a 4-digit number (rating)
    const hasRating = /\d{4}$/.test(playerInfo);

    if (!hasRating) {
        // If there's no rating, return the input as is
        return playerInfo;
    }

    // Remove the 4-digit number at the end
    return playerInfo.trim().replace(/\s?\d{4}$/, '');
}

export function timeStringToSeconds(timeStr) {
    if (!timeStr) return null;
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}

export function findPreviousNonNullClockByColorFromId(array, color, currentId) {
    const sorted = array.slice().sort((a, b) => a.id - b.id);

    if (!currentId) return '01:30:00';

    // Handle the special case where currentId === 1
    if (currentId === 1) {
        const firstWhiteMove = sorted.find(item => item.id === 1 && item.color === color);
        if (!firstWhiteMove || firstWhiteMove.clock === null || firstWhiteMove.clock === undefined) {
            return '01:30:00';
        }
        return firstWhiteMove.clock;
    }

    // General case: search for previous move
    for (let i = sorted.length - 1; i >= 0; i--) {
        const item = sorted[i];

        if (
            item.id < currentId &&
            item.color === color &&
            item.clock !== null &&
            item.clock !== undefined
        ) {
            return item.clock;
        }
    }

    // No match found
    return null;
}
