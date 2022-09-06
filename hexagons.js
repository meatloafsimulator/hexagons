import {
  qs, qsa, ael, aelo, shuffle, sum,
} from './utility.js';


const resources = [
  'brick', 'wood', 'sheep', 'wheat', 'rock',
];

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


const hexCount = {
  brick: 3, wood: 4, sheep: 4, wheat: 4, rock: 3,
};
let hexTypes = [];
for (const t in hexCount) {
  for (let i = 0; i < hexCount[t]; i++) {
    hexTypes.push(t);
  }
}
while (hexTypes.length < 19) hexTypes.push('desert');
hexTypes = shuffle(hexTypes);
const chits = shuffle([
  2, 3, 3, 4, 4, 5, 5, 6, 6,
  8, 8, 9, 9, 10, 10, 11, 11, 12,
]);
chits.splice(hexTypes.indexOf('desert'), 0, 0);

const robber = Math.floor(Math.random() * 19);

const frameVertices = [
  [6, 0], [3, 9], [-3, 9], [-6, 0], [-3, -9], [3, -9],
];
frameVertices.sort(
  (a, b) => Math.atan2(...a) - Math.atan2(...b)
);


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
const portTypes = shuffle([...resources, 0, 0, 0, 0]);


function fromTemplate(selector) {
  const node = qs(selector).content.firstElementChild;
  return node.cloneNode(true);
}

const svg = qs('.board svg');
const ns = svg.namespaceURI;

{
  const fvx = frameVertices.map(v => v[0]);
  const fvy = frameVertices.map(v => v[1]);
  const xMax = Math.max(...fvx) * w;
  const yMax = Math.max(...fvy);
  const vb = [-xMax, -yMax, 2 * xMax, 2 * yMax];
  svg.setAttribute('viewBox', vb.join(' '));
}

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

function convertCoordinates(svgCoords) {
  const hh = 300;
  const [x, y] = svgCoords;
  return [
    `${(x / 6 + 1) * hh * 2 / Math.sqrt(3)}px`,
    `${(y / 9 + 1) * hh}px`,
  ];
}

for (const [i, c] of centers.entries()) {
  const d = document.createElement('div');
  d.classList.add('chit', 'circle');
  const [l, t] = convertCoordinates(c);
  d.setAttribute('style', `--l: ${l}; --t: ${t};`);
  d.innerHTML = chits[i] || '';
  if (robber === i) {
    d.classList.add('robber');
    d.append(fromTemplate('#robber'));
  }
  qs('.on-board').append(d);
}

for (const [i, [p0, p1]] of ports.entries()) {
  const coastIndex = coast.indexOf(p1);
  const side = Math.floor(coastIndex / 5);
  const pos = coastIndex % 5;
  const [s0, s1] = [sites[p0], sites[p1]];
  const fv0 = frameVertices[(side + 5) % 6];
  const fv1 = frameVertices[side];
  const p = (Math.floor(pos / 2) + 1) / 3;
  const edgePoint = [
    fv0[0] * (1 - p) + fv1[0] * p,
    fv0[1] * (1 - p) + fv1[1] * p,
  ];
  const center = [
    (s0[0] + s1[0] + 2 * edgePoint[0]) / 4,
    (s0[1] + s1[1] + 2 * edgePoint[1]) / 4,
  ];
  const a = 1;
  const points = [s0, s1, edgePoint].map(u => [
    (u[0] * a + center[0]) / (a + 1) * w,
    (u[1] * a + center[1]) / (a + 1),
  ]);
  const pg = document.createElementNS(ns, 'polygon');
  pg.classList.add('port');
  pg.classList.add(portTypes[i] || 'generic');
  pg.setAttribute('points', points.flat().join(' '));
  svg.append(pg);
}


const playerColors = [
  'orange', 'blue', 'white', 'red',
];
const playerNames = [
  'Graham', 'Merrill', 'Morgan', 'Bo',
];
const playerVisible = [true, false, false, false];
// const playerVisible = [true, true, true, true];
const handsResource = [
  [2, 1, 1, 2, 3],
  [3, 0, 1, 0, 1],
  [0, 3, 0, 1, 0],
  [0, 0, 2, 3, 0],
];
const handsDevelopment = [
  ['knight', 'vp-palace', 'vp-university'],
  ['vp-market'],
  ['knight', 'knight'],
  ['knight', 'knight', 'knight', 'vp-library'],
];
const playedCards = [
  [
    'knight', 'knight', 'knight',
    'road-building', 'monopoly', 'year-of-plenty',
  ],
  ['knight', 'road-building'],
  ['knight', 'year-of-plenty'],
  ['knight', 'knight', 'monopoly'],
];
const developmentRemaining = [
  'knight', 'vp-chapel',
];

for (const [i, player] of playerColors.entries()) {
  const pa = fromTemplate('#player-area');
  pa.classList.add(player);
  if (i) pa.classList.add('opponent');
  const side = i < 2 ? 'left' : 'right';
  pa.classList.add(side, i % 2 ? 'bottom' : 'top');
  qs('.player-name', pa).innerHTML = playerNames[i];
  for (const [j, resource] of resources.entries()) {
    for (let n = 0; n < handsResource[i][j]; n++) {
      const card = fromTemplate('#resource');
      if (playerVisible[i]) {
        card.classList.add(resource);
        const src = `img/resource/${resource}.svg`
        qs('img', card).src = src;        
      } else card.classList.add('unknown');
      qs('.hand.resource', pa).append(card);
    }
  }
  function makeDevelopmentCard(cardName, visible) {
    const card = fromTemplate('#development');
    const type = cardName === 'knight' ? 'knight' :
        cardName.startsWith('vp') ? 'vp' : 'progress';
    if (visible) {
      card.classList.add(type);
      const i = type === 'vp' ? 'vp' : cardName;
      qs('img', card).src =
          `img/development/${i}.svg`;      
    } else card.classList.add('unknown');
    return card;
  }
  for (const c of handsDevelopment[i]) {
    const visible = playerVisible[i];
    const card = makeDevelopmentCard(c, visible);
    qs('.hand.development', pa).append(card);
  }
  for (const c of playedCards[i]) {
    const card = makeDevelopmentCard(c, true);
    qs('.hand.played', pa).append(card);
  }
  for (let n = 0; n < 3; n++) {
    const inv = qs('.inventory.houses', pa);
    const svg = fromTemplate('#city');
    svg.classList.add(player);
    if (pa.classList.contains('right')) {
      svg.classList.add('flipped');
    }
    inv.append(svg);
  }
  for (let n = 0; n < 4; n++) {
    const inv = qs('.inventory.houses', pa);
    const svg = fromTemplate('#settlement');
    svg.classList.add(player);
    inv.append(svg);
  }
  for (let n = 0; n < 11; n++) {
    const inv = qs('.inventory.roads', pa);
    const d = document.createElement('div');
    d.classList.add('road', 'piece', player);
    inv.append(d);
  }
  if (! i) {
    for (const badge of qsa('.badge', pa)) {
      badge.classList.add('awarded');
    }
  }
  qs(`.side-zone.${side}`).append(pa);
}


const roads = {
  orange: [
    [33, 27], [27, 21], [20, 14], [14, 13], [21, 20]
  ],
  blue: [[31, 37], [37, 43], [24, 18], [18, 12]],
  white: [[3, 8], [8, 14], [15, 9], [9, 8]],
  red: [[10, 5], [5, 4], [40, 34], [34, 28]],
};
for (const player in roads) {
  for (const road of roads[player]) {
    const [s0, s1] = road.map(u => sites[u]);
    const center = [
      (s0[0] + s1[0]) / 2, (s0[1] + s1[1]) / 2
    ];
    const [l, t] = convertCoordinates(center);
    const a = Math.sign(
      (s0[0] - s1[0]) * (s0[1] - s1[1])
    );
    const d = document.createElement('div');
    d.classList.add('road', 'piece', player);
    const style = `--l: ${l}; --t: ${t}; --a: ${a};`
    d.setAttribute('style', style);
    qs('.on-board').append(d);
  }
}

const settlements = {
  orange: [20],
  blue: [24],
  white: [15],
  red: [40],
};
for (const player in settlements) {
  for (const s of settlements[player]) {
    const [l, t] = convertCoordinates(sites[s]);
    const svg = fromTemplate('#settlement');
    svg.classList.add(player);
    const style = `--l: ${l}; --t: ${t};`;
    svg.setAttribute('style', style);
    qs('.on-board').append(svg);
  }
}

const cities = {
  orange: [33],
  blue: [31],
  white: [3],
  red: [10],
};
for (const player in cities) {
  for (const c of cities[player]) {
    const [l, t] = convertCoordinates(sites[c]);
    const svg = fromTemplate('#city');
    svg.classList.add(player);
    const style = `--l: ${l}; --t: ${t};`;
    svg.setAttribute('style', style);
    const pa = qs(`.player-area.${player}`);
    if (pa.classList.contains('right')) {
      svg.classList.add('flipped');
    }
    qs('.on-board').append(svg);
  }
}

function adjustCards(kind) {
  const hands = qsa(`.hand.${kind}`);
  for (const hand of hands) {
    const types = kind === 'resource' ?
        [...resources] : ['knight', 'progress', 'vp'];
    types.push('unknown');
    const cardsByType = types.map(
      type => qsa(`.${type}`, hand)
    );
    const n = sum(cardsByType.map(x => x.length));
    const u = sum(cardsByType.map(x => !! x.length));
    const limit = kind === 'resource' ? 11 :
        kind === 'development' ? 10 : 7;
    const adj = n <= limit ? 0 :
        - Math.ceil(27 * (n - limit) / (n - u));
    for (const cards of cardsByType) {
      for (const [j, card] of cards.entries()) {
        card.style = `--adj: ${j ? adj : 0}px`;
      }
    }
  }
}

adjustCards('resource');
adjustCards('development');
adjustCards('played');
