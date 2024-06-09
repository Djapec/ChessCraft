import {
    createGameLookupMap,
    fetchIndexData,
    fetchTournament,
    generatePgn,
    getExtendedGamesUrls,
    getGamesData,
    getRoundsWithGames
} from "@/components/pgn/lib/utils";

export async function generatePgnForTournament(tournamentId: string): Promise<string> {
    try {
        const tournament = await fetchTournament(tournamentId);
        const roundsWithGames = getRoundsWithGames(tournament.rounds);
        const indexData = await fetchIndexData(tournamentId, roundsWithGames);

        const extendedGamesUrls = getExtendedGamesUrls(tournamentId, roundsWithGames, indexData);
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
