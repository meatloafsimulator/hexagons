import {rep, seq, draw, shuffle} from './utility.js';
import {resources} from './constants.js';

function makePortLocations(novelty = 1) {
  let isPort = [];
  const a0 = [0, 1, 0, 0, 1];
  const a1 = [0, 0, 1, 0, 0];
  if (! novelty) return rep([a0, a1], 3).flat(2);
  if (novelty === 1) {
    const framePiece = shuffle([0, 0, 0, 1, 1, 1]);
    return framePiece.map(x => x ? a1 : a2).flat();
  }
  if (novelty === 2) {
    const bay = rep([1, 1, 0], 6).flat();
    const fBay = () => shuffle([0, draw([0, 1])]);
    const fCape = () => draw([0, 1]);
    return bay.map(x => x ? fBay() : fCape()).flat();
  }
  if (! novelty) {
    // for (let i = 0; i < 3; i++) {
    //   isPort.push(0, 1, 0, 0, 1);
    //   isPort.push(0, 0, 1, 0, 0);
    // }
  } else if (novelty === 1) {
    // const hasOnePort = shuffle([0, 0, 0, 1, 1, 1]);
    // for (let i = 0; i < 6; i++) {
    //   if (hasOnePort[i]) isPort.push(0, 0, 1, 0, 0);
    //   else isPort.push(0, 1, 0, 0, 1);
    // }
  } else if (novelty === 2) {
    // for (let i = 0; i < 6; i++) {
    //   for (let j = 0; j < 2; j++) {
    //     isPort.push(...shuffle(
    //       draw([0, 1]) ? [0, 1] : [0, 0]
    //     ));
    //   }
    //   isPort.push(draw([0, 1]));
    // }
  } else {
    // Dirichlet stuff goes here
  }
  return isPort;
}

function makePortTypes(n, variability = 1) {
  const types = [...resources, ...rep('generic', 4)];
  let portType = [];
  if (! variability) {
    portType = [
      'sheep', 'generic', 'rock', 'wheat', 'generic',
      'wood', 'brick', 'generic', 'generic',
    ];
  } else if (variability === 1) {
    portType = shuffle(types);
  } else if (variability === 2) {
    for (let i = 0; i < n; i++) {
      portType.push(draw(types));
    }
  } else {
    // Dirichlet stuff goes here
  }
  const extra = [];
  while (portType.length < n) {
    if (! extra.length) extra.push(...shuffle(types));
    portType.splice(
      draw(seq(portType.length + 1)), 0, extra.pop()
    );
  }
  while (portType.length > n) {
    portType.splice(draw(seq(portType.length)), 1);
  }
  return portType;
}

function makeHexes(variability = 1) {
  const a = [
    'wood', 'sheep', 'wheat',
    'brick', 'rock', 'brick', 'sheep',
    'desert', 'wood', 'wheat', 'wood', 'wheat',
    'brick', 'sheep', 'sheep', 'rock',
    'rock', 'wheat', 'wood',
  ];
  if (variability === 0) return [...a];
  if (variability === 1) return shuffle(a);
  if (variability === 2) return a.map(x => draw(a));
  // Dirichlet stuff goes here
}

function rDirichlet(alpha, prng = Math.random) {
  
}
// z = log w / log n
// w = (a + n) / (a + 1)
// aw + w = a + n
// a = (n - w) / (w - 1)
// w = exp(z log n) = n ^ z
// a = (n - n^z) / (n^z - 1)
function rGamma(alpha, prng = Math.random) {
  
}

console.log(makePortLocations(2));
