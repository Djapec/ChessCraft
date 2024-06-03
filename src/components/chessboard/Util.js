export function uniques (arr) {
  return arr.filter(function (elem, index, self) {
    return index === self.indexOf(elem)
  })
}

export function getMove(parsedPGN, moveDetails) {
  const { moveNumber, color, playedMove } = moveDetails;
  const { moves } = parsedPGN;

  if (moveNumber < 1 || moveNumber > moves.length) {
    return null; // Invalid move number
  }

  var moveInfo = null

  if (color === "white") {
    moveInfo = moves[moveNumber - 1].white
  } else if (color === "black") {
    moveInfo = moves[moveNumber - 1].black
  } else {
    return null; // Invalid color
  }

  if (moveInfo.move !== playedMove) {
    return null; // Move not found or played move does not match
  }

  return moveInfo; // Return the move object for the given color and played move
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
