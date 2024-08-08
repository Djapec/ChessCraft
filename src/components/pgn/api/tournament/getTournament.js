import {
    createGameLookupMap,
    fetchPairsData,
    fetchTournament,
    generatePgn,
    getGamesUrls,
    getGamesInfo,
    getRoundsWithGames
} from "../../utils/util.js";

export async function generatePgnForTournament(tournamentId) {
    try {
        const tournament = await fetchTournament(tournamentId);
        const roundsWithGames = getRoundsWithGames(tournament.rounds);
        const pairsData = await fetchPairsData(tournamentId, roundsWithGames);

        const gamesUrls = getGamesUrls(tournamentId, roundsWithGames, pairsData);
        const lookupMap = createGameLookupMap(gamesUrls);
        const gamesData = await getGamesInfo(gamesUrls);
        return generatePgn(tournament, pairsData, gamesData, gamesUrls, lookupMap);
    } catch (e) {
        throw new Error('Invalid request');
    }
}
