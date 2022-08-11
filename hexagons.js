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
    for (const x of abbr[y]) sites.push([x, y * h]);
  }
}

const centers = [
  [-6, -2*h], [-6, 0], [-6, 2*h],
  [-3, -3*h], [-3, -h], [-3, h], [-3, 3*h],
  [0, -4*h], [0, -2*h], [0, 0], [0, 2*h], [0, 4*h],
  [3, -3*h], [3, -h], [3, h], [3, 3*h],
  [6, -2*h], [6, 0], [6, 2*h],
];

const relative = [
  [2, 0], [1, h], [-1, h], [-2, 0], [-1, -h], [1, -h]
];

const svg = qs('svg');
const ns = svg.namespaceURI;

for (const [xCenter, yCenter] of centers) {
  const pg = document.createElementNS(ns, 'polygon');
  pg.classList.add('hexagon');
  for (const [xRel, yRel] of relative) {
    const pt = svg.createSVGPoint();
    pt.x = xCenter + xRel;
    pt.y = yCenter + yRel;
    pg.points.appendItem(pt);
  }
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
  t.setAttribute('y', y);
  t.innerHTML = i;
  svg.append(t);
}
