import {
    createGameLookupMap,
    fetchIndexData,
    fetchTournament,
    generatePgn,
    getExtendedGamesUrls,
    getGamesData,
    validateNumber
} from "@/components/pgn/lib/utils";

export async function generatePgnForGame(
    tournamentId: string,
    roundStr: string,
    gameStr: string
): Promise<string> {
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
