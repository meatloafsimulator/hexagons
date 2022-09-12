import {
  sum, count, unique, rep, seq,
  draw, shuffle, sample,
} from './utility.js';
import {resources} from './constants.js';

function makePortLocations(variability = 1) {
  // Arrangements on frame pieces
  const a0 = [0, 1, 0, 0, 1];
  const a1 = [0, 0, 1, 0, 0];
  if (! variability) return rep([a0, a1], 3).flat(2);
  if (variability === 1) {
    const framePiece = shuffle([0, 0, 0, 1, 1, 1]);
    return framePiece.map(x => x ? a1 : a2).flat();
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
  // const u = [...resources, 'generic'];
  // const freq = u.map(x => count(a, x) / a.length);
  // const conc = concentration(variability, n);
  // const alpha = freq.map(x => x * conc);
  // let p;
  // if (variability === 2) p = freq;
  // else if (variability === 4) {
  //   const d = draw(a);
  //   p = u.map(x => +(x === d));
  // } else p = rDirichlet(alpha);
  // return rep(0, n).map(x => sample(u, p));
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
  // const u = [...resources, 'desert'];
  // const freq = u.map(x => count(a, x) / a.length);
  // const conc = concentration(variability, a.length);
  // const alpha = freq.map(x => x * conc);
  // let p;
  // if (variability === 2) p = freq;
  //
  //
  // if (variability === 2) return a.map(x => draw(a));
  // Dirichlet stuff goes here
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

console.log(makePortTypes(12, 3));
// console.log(sum(rep(0, 1000).map(x => rGamma(0.1))));
console.log(makeHexes(3).sort());
