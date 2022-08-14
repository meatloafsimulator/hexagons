import {
  qs, qsa, ael, aelo, shuffle,
} from './utility.js';

const w = Math.sqrt(3);

const sites = [];
{
  const abbr = {};
  abbr[0] = [-8, -4, -2, 2, 4, 8];
  abbr[1] = [-7, -5, -1, 1, 5, 7];
  abbr[2] = [...abbr[0]];
  abbr[3] = [...abbr[1]];
  abbr[-1] = [...abbr[1]];
  abbr[-2] = [...abbr[0]];
  abbr[-3] = [...abbr[1]];
  abbr[4] = [...abbr[0]].slice(1, 5);
  abbr[-4] = [...abbr[4]];
  abbr[5] = [...abbr[1]].slice(2, 4);
  abbr[-5] = [...abbr[5]];
  for (let x = -5; x <= 5; x++) {
    for (const y of abbr[x]) sites.push([x, y]);
  }
}

const centers = [];
{
  const abbr = {};
  abbr[0] = [-4, -2, 0, 2, 4];
  abbr[3] = [-3, -1, 1, 3];
  abbr[-3] = [...abbr[3]];
  abbr[6] = [...abbr[0]].slice(1, 4);
  abbr[-6] = [...abbr[6]];
  for (const y of [-6, -3, 0, 3, 6]) {
    for (const x of abbr[y]) centers.push([x, y]);
  }
}

const hexSites = centers.map(c => {
  const rel = [
    [1, 1], [0, 2], [-1, 1],
    [-1, -1], [0, -2], [1, -1],
  ];
  return rel.map(r => sites.findIndex(
    s => s[0] === c[0] + r[0] && s[1] === c[1] + r[1]
  ));
});

const hexTypes = shuffle([
  'brick', 'brick', 'brick',
  'wood', 'wood', 'wood', 'wood',
  'grain', 'grain', 'grain', 'grain',
  'sheep', 'sheep', 'sheep', 'sheep',
  'rock', 'rock', 'rock',
  'desert',
]);
const hexRollDiscs = shuffle([
  2, 3, 3, 4, 4, 5, 5, 6, 6,
  8, 8, 9, 9, 10, 10, 11, 11, 12,
]);
hexRollDiscs.splice(hexTypes.indexOf('desert'), 0, 0);


const frameVertices = [
  [6, 0], [3, 9], [-3, 9], [-6, 0], [-3, -9], [3, -9],
];


const neighbors = [];
for (let i = 0; i < sites.length; i++) {
  neighbors[i] = [];
  for (let j = 0; j < sites.length; j++ ) {
    if (i === j) continue;
    const dx = Math.abs(sites[i][0] - sites[j][0]);
    const dy = Math.abs(sites[i][1] - sites[j][1]);
    if (dx <= 1 && dy <= 2) neighbors[i].push(j);
  }
}

const capes = [];
const bays = [];
for (let i = 0; i < sites.length; i++) {
  const nb = neighbors[i];
  if (nb.length < 3) capes.push(i);
  else {
    const nnn = nb.map(x => neighbors[x].length);
    if (nnn.some(x => x === 2)) bays.push(i);
  }
}
const coast = [...capes, ...bays];
coast.sort((a, b) => (
  Math.atan2(...sites[a]) - Math.atan2(...sites[b])
));
while(! (
  bays.includes(coast[0]) && bays.includes(coast[2])
)) coast.unshift(coast.pop());
const ports = [];
const hasOnePort = shuffle([0, 0, 0, 1, 1, 1]);
for (let i = 0; i < 6; i++) {
  const side = coast.slice(i * 5, (i + 1) * 5);
  if (hasOnePort[i]) ports.push(side.slice(1, 3));
  else ports.push(side.slice(0, 2), side.slice(3));
}
const portEntryPoints = ports.map(p => {
  const [s0, s1] = p;
  const [x0, y0] = sites[s0];
  const [x1, y1] = sites[s1];
  return y0 - y1 === 2 ? [x0 + 1, y0 - 1] :
      x1 > x0 && y1 > y0 ? [x0, y1 + 1] :
      x1 > x0 && y0 > y1 ? [x1, y0 + 1] :
      x0 > x1 && y0 > y1 ? [x0, y1 - 1] :
      x0 > x1 && y1 > y0 ? [x1, y0 - 1] :
      [x0 - 1, y0 + 1];
});
const portMirrorPoints = ports.map((p, i) => {
  const pep = portEntryPoints[i];
  const pmp = [
    (sites[p[0]][0] + sites[p[1]][0]) / 2,
    (sites[p[0]][1] + sites[p[1]][1]) / 2,
  ];
  return [
    6 * pmp[0] - 5 * pep[0], 6 * pmp[1] - 5 * pep[1]
  ];
});


const svg = qs('svg');
const ns = svg.namespaceURI;

{
  const pg = document.createElementNS(ns, 'polygon');
  pg.classList.add('water');
  const pointsArr = [];
  for (const [x, y] of frameVertices) {
    pointsArr.push(x * w, y);
  }
  pg.setAttribute('points', pointsArr.join(' '));
  svg.append(pg);
}

{
  const pg = document.createElementNS(ns, 'polygon');
  pg.classList.add('beach');
  const pointsArr = [];
  for (const s of coast) {
    pointsArr.push(sites[s][0] * w, sites[s][1]);
    const portTimes2 = ports.flat().indexOf(s);
    if (portTimes2 % 2) continue;
    const p = portMirrorPoints[portTimes2 / 2];
    pointsArr.push(p[0] * w, p[1]);
  }
  pg.setAttribute('points', pointsArr.join(' '));
  svg.append(pg);
}

for (const [i, port] of ports.entries()) {
  const [px, py] = portEntryPoints[i];
  for (const s of port) {
    const [sx, sy] = sites[s];
    const l = document.createElementNS(ns, 'line');
    l.classList.add('dock');
    l.setAttribute('x1', sx * w);
    l.setAttribute('y1', sy);
    // l.setAttribute('x2', (sx + px) / 2 * w);
    // l.setAttribute('y2', (sy + py) / 2);
    l.setAttribute('x2', sx * w);
    l.setAttribute('y2', sy);
    svg.append(l);
  }
}

// for (const [i, [s0, s1]] of ports.entries()) {
//   const pg = document.createElementNS(ns, 'polygon');
//   pg.classList.add('water');
//   pg.classList.add('harbor');
//   const pep = portEntryPoints[i];
//   const pointsArr = [
//     pep[0] * w, pep[1],
//     sites[s0][0] * w, sites[s0][1],
//     sites[s1][0] * w, sites[s1][1],
//   ];
//   pg.setAttribute('points', pointsArr.join(' '));
//   svg.append(pg);
// }

for (const [i, siteArr] of hexSites.entries()) {
  const pg = document.createElementNS(ns, 'polygon');
  pg.classList.add('hex');
  pg.classList.add(hexTypes[i]);
  const pointsArr = [];
  for (const s of siteArr) {
    pointsArr.push(sites[s][0] * w, sites[s][1]);
  }
  pg.setAttribute('points', pointsArr.join(' '));
  svg.append(pg);
}

// for (let x = -9; x <= 9; x++) {
//   const l = document.createElementNS(ns, 'line');
//   l.classList.add('gridline');
//   if (x === 0) l.classList.add('axis');
//   l.setAttribute('x1', x);
//   l.setAttribute('x2', x);
//   l.setAttribute('y1', -10);
//   l.setAttribute('y2', 10);
//   svg.append(l);
// }
// for (let y = -5; y <= 5; y++) {
//   const l = document.createElementNS(ns, 'line');
//   l.classList.add('gridline');
//   if (y === 0) l.classList.add('axis');
//   l.setAttribute('x1', -10);
//   l.setAttribute('x2', 10);
//   l.setAttribute('y1', y * h);
//   l.setAttribute('y2', y * h);
//   svg.append(l);
// }

for (const [i, [x, y]] of sites.entries()) {
  const t = document.createElementNS(ns, 'text');
  t.classList.add('debug-label');
  t.setAttribute('x', x * w);
  t.setAttribute('y', y);
  t.innerHTML = i;
  svg.append(t);
}
for (const [i, [x, y]] of centers.entries()) {
  const t = document.createElementNS(ns, 'text');
  t.classList.add('debug-label');
  t.setAttribute('x', x * w);
  t.setAttribute('y', y);
  t.innerHTML = i;
  svg.append(t);
}

for (const [i, [x, y]] of centers.entries()) {
  // if (! hexRollDiscs[i]) continue;
  // const pg = document.createElementNS(ns, 'circle');
  // pg.classList.add('roll-disc');
  // pg.setAttribute('cx', x * w);
  // pg.setAttribute('cy', y);
  // pg.setAttribute('r', 0.6);
  // svg.append(pg);
  // const t = document.createElementNS(ns, 'text');
  // t.classList.add('roll-disc-text');
  // t.setAttribute('x', x * w);
  // t.setAttribute('y', y);
  // t.setAttribute('text-anchor', 'middle');
  // t.setAttribute('dominant-baseline', 'middle');
  // t.innerHTML = hexRollDiscs[i];
  // svg.append(t);
}

for (const [i, [x, y]] of centers.entries()) {
  if (! hexRollDiscs[i]) continue;
  const d = document.createElement('div');
  d.classList.add('roll-disc');
  const l = x / 6 + 1;
  const t = y / 9 + 1;
  d.setAttribute('style', `--l: ${l}; --t: ${t};`);
  d.innerHTML = hexRollDiscs[i];
  qs('.board').append(d);
}

