import {
    createGameLookupMap,
    fetchIndexData,
    fetchTournament,
    generatePgn,
    getExtendedGamesUrls,
    getGamesData,
    validateNumber
} from "../../lib/utils.js";

export async function generatePgnForRound(tournamentId, roundStr) {
    try {
        const tournament = await fetchTournament(tournamentId);
        const round = validateNumber(roundStr);
        const indexData = await fetchIndexData(tournamentId, [round]);

        const extendedGamesUrls = getExtendedGamesUrls(tournamentId, [round], indexData);
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