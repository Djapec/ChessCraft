import {
    createGameLookupMap,
    fetchPairsData,
    fetchTournament,
    generatePgn,
    getGamesUrls,
    getGamesInfo,
    validateRoundNumber,
} from "../utils/util.js";
import {getPairsForRound} from "./getPairs";

// desiredPairs ovo je lista sa ID-jevima npr: [1,2,3,4]
export async function generatePgnForRound(tournamentId, roundStr, desiredPairs = null) {
    try {
        const tournament = await fetchTournament(tournamentId);
        const round = validateRoundNumber(roundStr);
        const pairsData = await fetchPairsData(tournamentId, [round]);

       if (pairsData[0].pairings.length === 0) {
           console.log('Inactive Round')
           return null
       }
           const gamesUrls = getGamesUrls(tournamentId, [round], pairsData, desiredPairs);
           const lookupMap = createGameLookupMap(gamesUrls);
           const gamesData = await getGamesInfo(gamesUrls);
           return generatePgn(tournament, pairsData, gamesData, gamesUrls, lookupMap);
    } catch (e) {
        console.log(new Error(`Invalid request: ${e}`));
        return null
    }
}