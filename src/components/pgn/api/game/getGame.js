import {
    validateNumber,
    fetchTournament,
    fetchIndexData,
    getExtendedGamesUrls,
    createGameLookupMap,
    getGamesData,
    generatePgn
} from '../../lib/utils.js'

export async function generatePgnForGame(tournamentId, roundStr, gameStr) {
    try {
        const tournament = await fetchTournament(tournamentId);
        const round = validateNumber(roundStr);
        const game = validateNumber(gameStr);
        const indexData = await fetchIndexData(tournamentId, [round]);

        const extendedGamesUrls = getExtendedGamesUrls(
            tournamentId,
            [round],
            indexData
        ).filter((g) => g.game === game);

        const lookupMap = createGameLookupMap(extendedGamesUrls);
        const gamesData = await getGamesData(extendedGamesUrls);
        return generatePgn(
            tournament,
            indexData,
            gamesData,
            extendedGamesUrls,
            lookupMap
        );
    } catch (e) {
        throw new Error('Invalid request');
    }
}

