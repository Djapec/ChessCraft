import { Chess } from "../../../public/chess.min.js"; // version 0.13.4

export function parsePGN(pgn) {
    const [metadataPart, movesPart] = pgn.split('\n\n');

    const metadata = metadataPart ? Object.fromEntries(
        metadataPart.split('\n').map(line => {
            const match = line.match(/^\[(\w+)\s+"(.+)"\]$/);
            return match ? [match[1], match[2]] : null;
        }).filter(Boolean)
    ) : {};

    const chess = new Chess();
    const moves = [];
    const halfMoves = [];
    let halfMoveId = 1; // Initialize the half-move ID counter

    if (movesPart) {
        movesPart.split(/\d+\./).slice(1).forEach(line => {
            const moveMatch = line.trim().match(/([^\s]+)\s*(?:{\[%clk\s*([0-9:]+)\]})?\s*(?:{\[%emt\s*([0-9:]+)\]})?\s*([^\s]+)?\s*(?:{\[%clk\s*([0-9:]+)\]})?\s*(?:{\[%emt\s*([0-9:]+)\]})?/);
            if (moveMatch) {
                const [_, whiteMove, whiteClockTime, whiteEMTTime, blackMove, blackClockTime, blackEMTTime] = moveMatch;

                if (chess.move(whiteMove, { sloppy: true })) {
                    const whiteHalfMove = {
                        id: halfMoveId++,
                        color: "white",
                        move: whiteMove,
                        clock: whiteClockTime || null,
                        emt: whiteEMTTime || null
                    };
                    moves.push({ white: whiteHalfMove });
                    halfMoves.push(whiteHalfMove);
                }

                if (blackMove && chess.move(blackMove, { sloppy: true })) {
                    const blackHalfMove = {
                        id: halfMoveId++,
                        color: "black",
                        move: blackMove,
                        clock: blackClockTime || null,
                        emt: blackEMTTime || null
                    };
                    moves[moves.length - 1].black = blackHalfMove;
                    halfMoves.push(blackHalfMove);
                }
            }
        });
    }

    return {
        metadata,
        moves,
        chess,
        halfMoves,
    };
}
