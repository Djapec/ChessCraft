export function getTourneyUrl(id) {
    return `https://1.pool.livechesscloud.com/get/${id}/tournament.json`;
}

export function getIndexUrl(id, round) {
    return `https://1.pool.livechesscloud.com/get/${id}/round-${round}/index.json`;
}

export function getGameUrl(id, round, game) {
    return `https://1.pool.livechesscloud.com/get/${id}/round-${round}/game-${game}.json?poll`;
}

export function validateNumber(strNum) {
    const num = parseInt(strNum);
    if (isNaN(num) || num <= 0) throw new Error();
    return num;
}

export async function fetchTournament(id) {
    const tournamentRes = await fetch(getTourneyUrl(id));
    return await tournamentRes.json();
}

export async function fetchIndexData(id, rounds) {
    const indexPromises = rounds.map((round) => fetch(getIndexUrl(id, round)));
    const indexResponses = await Promise.all(indexPromises);
    return await Promise.all(indexResponses.map((prom) => prom.json()));
}

export async function getGamesData(games) {
    const gamesPromises = games.map((game) =>
        fetch(game.url, { cache: 'no-store' })
    );
    const gamesResponses = await Promise.all(gamesPromises);
    return await Promise.allSettled(gamesResponses.map((prom) => prom.json()));
}

export function getExtendedGamesUrls(id, roundsWithGames, indexData) {
    return roundsWithGames.flatMap((round, rndIdx) => {
        return Array.from({ length: indexData[rndIdx].pairings.length }, (_, i) => {
            return {
                url: getGameUrl(id, round, i + 1),
                round: round,
                game: i + 1,
            };
        });
    });
}

function getGameResult(code) {
    switch (code) {
        case 'WHITEWIN':
            return '1-0';
        case 'BLACKWIN':
            return '0-1';
        case 'DRAW':
            return '1/2-1/2';
        default:
            return '*';
    }
}

function convertDateFormat(inputDate) {
    return inputDate.split('-').join('.');
}

function getFormattedMoves(moves) {
    let str = '';
    for (let i = 0; i < moves.length; i++) {
        if (i % 2 == 0) {
            str += `${Math.ceil((i + 1) / 2).toString()}. `;
        }
        str += `${moves[i].split(' ')[0]} `;
    }
    str = str.trim();
    return str;
}

function getPlayerFullName(player) {
    const full = `${player.lname || ''}, ${player.fname || ''} ${player.mname || ''}`;
    return full.trim() === ',' ? '?' : full;
}

export function parseToPgn(tournament, pairing, game, round, date) {
    const event = tournament.name || '?';
    const site = tournament.location || '?';
    const formattedDate = date ? convertDateFormat(date) : '?';
    const white = getPlayerFullName(pairing.white);
    const black = getPlayerFullName(pairing.black);
    const plyCount = game.moves.length;
    const result = getGameResult(game.result);
    const meta = [
        `[Event "${event}"]`,
        `[Site "${site}"]`,
        `[Date "${formattedDate}"]`,
        `[Round "${round}"]`,
        `[White "${white}"]`,
        `[Black "${black}"]`,
        `[Result "${result}"]`,
        `[PlyCount "${plyCount}"]`,
    ].join('\n');
    let pgn = meta;
    pgn += '\n\n';
    pgn += getFormattedMoves(game.moves);
    pgn += ` ${result}`;
    return pgn;
}

export function createGameLookupMap(games) {
    return games.reduce((acc, curr) => {
        acc[curr.url] = {
            round: curr.round,
            game: curr.game,
        };
        return acc;
    }, {});
}

export function getRoundsWithGames(rounds) {
    return rounds.reduce((acc, curr, idx) => {
        if (curr.count > 0) acc.push(idx + 1);
        return acc;
    }, []);
}

export function generatePgn(tournament, indexData, gamesData, extendedGamesUrls, lookupMap) {
    const pgn = gamesData
        .reduce((acc, curr, idx) => {
            if (curr.status !== 'fulfilled') return acc;
            const rndAndGame = lookupMap[extendedGamesUrls[idx].url];
            const index = indexData[rndAndGame.round - 1] || indexData[0];
            const pairing = index.pairings[rndAndGame.game - 1];
            const pgn = parseToPgn(
                tournament,
                pairing,
                curr.value,
                rndAndGame.round,
                index.date
            );
            acc.push(pgn);
            return acc;
        }, [])
        .join('\n\n');

    if (pgn === '') throw new Error();
    return pgn;
}