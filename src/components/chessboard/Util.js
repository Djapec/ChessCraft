export function uniques (arr) {
  return arr.filter(function (elem, index, self) {
    return index === self.indexOf(elem)
  })
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
