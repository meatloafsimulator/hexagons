import {
  sum, count, unique, rep, seq,
  draw, shuffle, sample,
} from './utility.js';
import {resources} from './constants.js';
import {centers} from './geometry.js';

export function makeBoard(variability = 1) {
  const pl = makePortLocations(variability);
  const pt = makePortTypes(sum(pl), variability);
  const h = makeHexes(variability);
  const c = makeChits(h, variability);
  const p = pl.map(x => x ? pt.shift() : '');
  return {ports: p, hexes: h, chits: c};
}
export function boardCode(board) {
  const {ports, hexes, chits} = board;
  const codeCharacter = seq(52).map(
    x => String.fromCharCode(x + (x < 26 ? 65 : 71))
  );
  let result = '00';
  for (let i = 0; i < ports.length / 2; i++) {
    const portPair = ports.slice(i * 2, i * 2 + 2);
    const ints = [];
    for (const type of portPair) {
      const t = resources.indexOf(type);
      ints.push(
        t > -1 ? t : type === 'generic' ? 5 : 6
      );
    }
    result += codeCharacter[ints[0] * 7 + ints[1]];
  }
  for (const [i, type] of hexes.entries()) {
    const k = chits[i];
    const t = resources.indexOf(type);
    result += codeCharacter[
      t > -1 ? t * 10 + k - (k < 7 ? 2 : 3) : 50
    ];
  }
  return result;
}

function makePortLocations(variability = 1) {
  // Arrangements on frame pieces
  const a0 = [0, 1, 0, 0, 1];
  const a1 = [0, 0, 1, 0, 0];
  if (! variability) return rep([a0, a1], 3).flat(2);
  if (variability === 1) {
    const framePiece = shuffle([0, 0, 0, 1, 1, 1]);
    return framePiece.map(x => x ? a0 : a1).flat();
  }
  const conc = concentration(variability, 18);
  const alpha = rep(conc / 2, 2);
  const p = variability === 2 ? 0.5 :
      variability === 4 ? draw([0, 1]) :
      rDirichlet(alpha)[0];
  const f = () => +(Math.random() < p);
  // Two-edge side bays and one-edge corner capes
  const isBay = rep([1, 1, 0], 6).flat();
  // No more than one port per bay
  const fBay = () => shuffle([0, f()]);
  return isBay.map(x => x ? fBay() : f()).flat();
}
function makePortTypes(n, variability = 1) {
  // Fixed arrangement
  const a = [
    'sheep', 'generic', 'rock', 'wheat', 'generic',
    'wood', 'brick', 'generic', 'generic',
  ];
  if (variability <= 1) {
    const result = variability ? shuffle(a) : [...a];
    // Adjust if n ≠ 9
    {
      let extra = [];
      while (result.length < n) {
        if (! extra.length) extra = shuffle(a);
        result.splice(
          draw(seq(result.length + 1)), 0, extra.pop()
        );
      }
      while (result.length > n) {
        result.splice(draw(seq(result.length)), 1);
      }
    }
    return result;
  }
  return pickViaDirichlet(a, n, variability);
}
function makeHexes(variability = 1) {
  const a = [
    'wood', 'sheep', 'wheat',
    'brick', 'rock', 'brick', 'sheep',
    'desert', 'wood', 'wheat', 'wood', 'wheat',
    'brick', 'sheep', 'sheep', 'rock',
    'rock', 'wheat', 'wood',
  ];
  if (! variability) return [...a];
  if (variability === 1) return shuffle(a);
  return pickViaDirichlet(a, a.length, variability);
}
function makeChits(hexes, variability = 1) {
  const a = [
    11, 12, 9, 4, 6, 5, 10, null, 3,
    11, 4, 8, 8, 10, 9, 3, 5, 2, 6,
  ];
  const aNoNull = a.filter(x => x);
  const nDeserts = count(hexes, 'desert');
  if (variability <= 1) {
    const result = variability ? shuffle(a) : [...a];
    // Remove chits on deserts and store as unused
    let unused = [];
    for (let i = 0; i < a.length; i++) {
      if (hexes[i] !== 'desert') continue;
      unused.push(result[i]);
      result[i] = null;
    }
    // If no deserts, put extra chit in unused
    if (! nDeserts) unused.push(draw(aNoNull));
    // Shuffle unused and put on hexes as needed
    unused = shuffle(unused);
    for (let i = 0; i < a.length; i++) {
      if (hexes[i] === 'desert') continue;
      if (! result[i]) result[i] = unused.pop();
    }
    // Prevent adjacent sixes/eights
    const adjacent = [];
    for (let i = 0; i < a.length; i++) {
      const [xi, yi] = centers[i];
      for (let j = i + 1; j < a.length; j++) {
        const [xj, yj] = centers[j];
        const xAdj = Math.abs(xi - xj) < 3;
        const yAdj = Math.abs(yi - yj) < 4;
        if (xAdj && yAdj) adjacent.push([i, j]);
      }
    }
    const red = u => Math.abs(result[u] - 7) === 1;
    while (true) {
      const bad = adjacent.filter(e => e.every(red));
      if (! bad.length) break;
      const i = draw(bad.flat());
      const j = draw(seq(a.length).filter(
        u => ! red(u) && result[u]
      ));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  const resultNoNull = pickViaDirichlet(
    aNoNull, a.length - nDeserts, variability
  );
  const result = [];
  for (let i = 0; i < a.length; i++) result.push(
    hexes[i] === 'desert' ? null : resultNoNull.pop()
  );
  return result;
}

function pickViaDirichlet(a, n, variability) {
  const u = unique(a);
  const freq = u.map(x => count(a, x) / a.length);
  const conc = concentration(variability, n);
  const alpha = freq.map(x => x * conc);
  let p;
  if (variability === 2) p = freq;
  else if (variability === 4) {
    const d = draw(a);
    p = u.map(x => +(x === d));
  } else p = rDirichlet(alpha);
  return rep(0, n).map(x => sample(u, p));
}
function concentration(variability, n) {
  const z = variability / 2 - 1;
  return (n - n ** z) / (n ** z - 1);
}
function rDirichlet(alpha, prng = Math.random) {
  const g = alpha.map(x => rGamma(x, prng));
  return g.map(x => x / sum(g));
}
function rGamma(shape, prng = Math.random) {
  let r = 0;
  const k = Math.floor(shape);
  for (let i = 0; i < k; i++) r -= Math.log(prng());
  if (shape === k) return r;
  const d = shape - k;
  let xi, eta;
  do {
    let [u, v, w] = [prng(), prng(), prng()];
    const cond = u < Math.E / (Math.E + d);
    xi = cond ? v ** (1 / d) : 1 - Math.log(v);
    eta = w * (cond ? xi ** (d - 1) : Math.exp(- xi));
  } while (eta > (xi ** (d - 1)) * Math.exp(- xi));
  return r + xi;
}
