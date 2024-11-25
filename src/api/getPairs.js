import {fetchPairsData, getPlayerFullName, validateRoundNumber} from "../utils/util";

export async function getPairsForRound(tournamentId, roundStr) {
    try {
        const round = validateRoundNumber(roundStr);
        const pairsData = await fetchPairsData(tournamentId, [round]);
        const pairings = pairsData[0].pairings;

        if (pairings.length === 0) {
            console.log('Inactive Round')
            return null
        }

        return pairings.map(pair => generatePairObject(pair, round))
    } catch (e) {
        console.log(new Error(`Invalid request: ${e}`));
        return null
    }
}

export function generatePairObject(pair, round) {
    const whitePlayer = getPlayerFullName(pair.white)
    const blackPlayer = getPlayerFullName(pair.black)
    const name = `${whitePlayer} - ${blackPlayer}`

    return {
        result: pair.result,
        name: name,
        id: `${round}-${name}`,
    }
}
