export function uniques (arr) {
  return arr.filter(function (elem, index, self) {
    return index === self.indexOf(elem)
  })
}

export function getInfoForLastTwoMoves(parsedPGN, moveDetails) {
  const { moveNumber, color, playedMove } = moveDetails;
  const { halfMoves } = parsedPGN;

  if (moveNumber < 0 || moveNumber >= halfMoves.length ||
      halfMoves[moveNumber].color !== color ||
      halfMoves[moveNumber].move !== playedMove) {
    return null; // Invalid move number or move details do not match
  }

  return {
    currentMoveInfo: halfMoves[moveNumber],
    previousMoveInfo: moveNumber > 0 ? halfMoves[moveNumber - 1] : null
  };
}

export function getAllProperties(obj) {
  let properties = new Set();
  let currentObj = obj;

  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item));
  } while ((currentObj = Object.getPrototypeOf(currentObj)));

  return {
    methods: [...properties.keys()].filter(item => typeof obj[item] === 'function'),
    fields: [...properties.keys()].filter(item => typeof obj[item] !== 'function')
  };
}
