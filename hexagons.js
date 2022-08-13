import {qs, qsa, ael, aelo} from './utility.js';

const h = Math.sqrt(3);

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
  for (let y = -5; y <= 5; y++) {
    for (const x of abbr[y]) sites.push([x, y]);
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
  for (const x of [-6, -3, 0, 3, 6]) {
    for (const y of abbr[x]) centers.push([x, y]);
  }
}

const hexSites = centers.map(c => {
  const rel = [
    [ 2, 0], [ 1,  1], [-1,  1],
    [-2, 0], [-1, -1], [ 1, -1]
  ];
  return rel.map(r => sites.findIndex(
    s => s[0] === c[0] + r[0] && s[1] === c[1] + r[1]
  ));
});

const hexTypes = [
  'brick', 'brick', 'brick',
  'wood', 'wood', 'wood', 'wood',
  'grain', 'grain', 'grain', 'grain',
  'sheep', 'sheep', 'sheep', 'sheep',
  'rock', 'rock', 'rock',
  'desert',
];


// const frameVertices = [
//   [10, 2], [8, 4],
//   [2, 6], [-2, 6],
//   [-8, 4], [-10, 2],
//   [-10, -2], [-8, -4],
//   [-2, -6], [2, -6],
//   [8, -4], [10, -2],
// ];
const frameVertices = [
  [9, 3], [0, 6], [-9, 3], [-9, -3], [0, -6], [9, -3],
];


// const oldSpaces = [
//   [6, 12, 18, 19, 13, 7],
//   [18, 24, 30, 31, 25, 19],
//   [30, 36, 42, 43, 37, 31],
//   [2, 7, 13, 14, 8, 3],
//   [13, 19, 25, 26, 20, 14],
//   [25, 31, 37, 38, 32, 26],
//   [37, 43, 48, 49, 44, 38],
//   [0, 3, 8, 9, 4, 1],
//   [8, 14, 20, 21, 15, 9],
//   [20, 26, 32, 33, 27, 21],
//   [32, 38, 44, 45, 39, 33],
//   [44, 49, 52, 53, 50, 45],
//   [4, 9, 15, 16, 10, 5],
//   [15, 21, 27, 28, 22, 16],
//   [27, 33, 39, 40, 34, 28],
//   [39, 45, 50, 51, 46, 40],
//   [10, 16, 22, 23, 17, 11],
//   [22, 28, 34, 35, 29, 23],
//   [34, 40, 46, 47, 41, 35],
// ];
//
// const oldCenters = [
//   [-6, -2*h], [-6, 0], [-6, 2*h],
//   [-3, -3*h], [-3, -h], [-3, h], [-3, 3*h],
//   [0, -4*h], [0, -2*h], [0, 0], [0, 2*h], [0, 4*h],
//   [3, -3*h], [3, -h], [3, h], [3, 3*h],
//   [6, -2*h], [6, 0], [6, 2*h],
// ];
//
// const relative = [
//   [2, 0], [1, h], [-1, h], [-2, 0], [-1, -h], [1, -h]
// ];

const svg = qs('svg');
const ns = svg.namespaceURI;

// for (const [xCenter, yCenter] of oldCenters) {
//   const pg = document.createElementNS(ns, 'polygon');
//   pg.classList.add('hexagon');
//   for (const [xRel, yRel] of relative) {
//     const pt = svg.createSVGPoint();
//     pt.x = xCenter + xRel;
//     pt.y = yCenter + yRel;
//     pg.points.appendItem(pt);
//   }
//   svg.append(pg);
// }

{
  const pg = document.createElementNS(ns, 'polygon');
  pg.classList.add('water');
  const pointsArr = [];
  for (const [x, y] of frameVertices) {
    pointsArr.push(x, y * h);
  }
  pg.setAttribute('points', pointsArr.join(' '));
  svg.append(pg);
}

for (const siteArr of hexSites) {
  const pg = document.createElementNS(ns, 'polygon');
  pg.classList.add('hex');
  pg.classList.add(hexTypes.pop());
  const pointsArr = [];
  for (const s of siteArr) {
    pointsArr.push(sites[s][0], sites[s][1] * h);
  }
  pg.setAttribute('points', pointsArr.join(' '));
  svg.append(pg);
}

for (let x = -9; x <= 9; x++) {
  const l = document.createElementNS(ns, 'line');
  l.classList.add('gridline');
  if (x === 0) l.classList.add('axis');
  l.setAttribute('x1', x);
  l.setAttribute('x2', x);
  l.setAttribute('y1', -10);
  l.setAttribute('y2', 10);
  svg.append(l);
}
for (let y = -5; y <= 5; y++) {
  const l = document.createElementNS(ns, 'line');
  l.classList.add('gridline');
  if (y === 0) l.classList.add('axis');
  l.setAttribute('x1', -10);
  l.setAttribute('x2', 10);
  l.setAttribute('y1', y * h);
  l.setAttribute('y2', y * h);
  svg.append(l);
}

for (const [i, [x, y]] of Object.entries(sites)) {
  const t = document.createElementNS(ns, 'text');
  t.classList.add('debug-label');
  t.setAttribute('x', x);
  t.setAttribute('y', y * h);
  t.innerHTML = i;
  svg.append(t);
}
for (const [i, [x, y]] of Object.entries(centers)) {
  const t = document.createElementNS(ns, 'text');
  t.classList.add('debug-label');
  t.setAttribute('x', x);
  t.setAttribute('y', y * h);
  t.innerHTML = i;
  svg.append(t);
}
