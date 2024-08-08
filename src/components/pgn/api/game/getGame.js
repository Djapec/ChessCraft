import {
    validateRoundNumber,
    fetchTournament,
    fetchPairsData,
    getGamesUrls,
    createGameLookupMap,
    getGamesInfo,
    generatePgn
} from '../../utils/util.js'

export async function generatePgnForGame(tournamentId, roundStr, gameStr) {
    try {
        const tournament = await fetchTournament(tournamentId);
        const round = validateRoundNumber(roundStr);
        const game = validateRoundNumber(gameStr);
        const pairsData = await fetchPairsData(tournamentId, [round]);
        const gamesUrls =
            getGamesUrls(tournamentId, [round], pairsData).filter((g) => g.game === game);

        const lookupMap = createGameLookupMap(gamesUrls);
        const gamesData = await getGamesInfo(gamesUrls);
        return generatePgn(tournament, pairsData, gamesData, gamesUrls, lookupMap);
    } catch (e) {
        throw new Error('Invalid request');
    }
}
