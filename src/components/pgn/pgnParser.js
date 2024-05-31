import  Chess  from 'chess.js';

export function parsePGN(pgn) {
    const [metadataPart, movesPart] = pgn.split('\n\n');

    const metadataLines = metadataPart ? metadataPart.split('\n') : [];
    const metadata = {};
    metadataLines.forEach(line => {
        const match = line.match(/^\[(\w+)\s+"(.+)"\]$/);
        if (match) {
            const [_, key, value] = match;
            metadata[key] = value;
        }
    });

    const chess = new Chess();
    const moves = [];
    if (movesPart) {
        const moveLines = movesPart.split(/\d+\./).slice(1);
        moveLines.forEach(line => {
            const moveMatch = line.trim().match(/([^\s]+)\s*({\[%clk\s*([0-9:]+)\]})?\s*({\[%emt\s*([0-9:]+)\]})?\s*([^\s]+)?\s*({\[%clk\s*([0-9:]+)\]})?\s*({\[%emt\s*([0-9:]+)\]})?/);
            if (moveMatch) {
                const [_, whiteMove, , whiteClockTime, , whiteEMTTime, blackMove, , blackClockTime, , blackEMTTime] = moveMatch;

                if (chess.move(whiteMove, { sloppy: true })) {
                    moves.push({
                        white: {
                            move: whiteMove,
                            clock: whiteClockTime || null,
                            emt: whiteEMTTime || null
                        }
                    });
                }

                if (blackMove && chess.move(blackMove, { sloppy: true })) {
                    moves[moves.length - 1].black = {
                        move: blackMove,
                        clock: blackClockTime || null,
                        emt: blackEMTTime || null
                    };
                }
            }
        });
    }

    return {
        metadata,
        moves,
        chess
    };
}
