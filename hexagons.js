import {
  qs, qsa, ael, shuffle, draw, sum, seq
} from './utility.js';
import {resources, pieceCount} from './constants.js';
import {
  w, sites, centers, hexSites, frameVertices,
  convertCoordinates,
} from './geometry.js';
import {makeBoard, boardCode} from './make-board.js';
import {renderBoard} from './render-board.js';

const board = makeBoard(1);
renderBoard(board);

function fromTemplate(className) {
  const fragment = qs(`template.${className}`);
  const node = fragment.content.firstElementChild;
  return node.cloneNode(true);
}

function makePlayerArea(i, color) {
  const pa = fromTemplate('player-area');
  pa.classList.add(color);
  const isRight = i > 1;
  const side = isRight ? 'right' : 'left';
  pa.classList.add(side, i % 2 ? 'bottom' : 'top');
  qs(`.side-zone.${side}`).append(pa);
  for (const houseType of ['city', 'settlement']) {
    for (let n = 0; n < pieceCount[houseType]; n++) {
      stockHouse(color, houseType, isRight);
    }
  }
  for (let n = 0; n < pieceCount.road; n++) {
    stockRoad(color);
  }
}

function showPlayerName(color, playerName) {
  const pn = qs(`.player-area.${color} .player-name`);
  pn.innerHTML = playerName;
}

function moveRobber(hex) {
  qs('.chit.robber')?.classList.remove('robber');
  const e = qsa('.chit')[hex];
  e.classList.add('robber');
  e.append(
    qs('svg.robber') ?? fromTemplate('robber')
  );
}

function placeHouse(color, type, site) {
  const siteClassString = `site-${site}`;
  qs(`.piece.${siteClassString}`)?.remove();
  const [l, t] = convertCoordinates(sites[site]);
  const e = fromTemplate(type);
  e.classList.add(color, siteClassString);
  e.setAttribute('style', `--l: ${l}; --t: ${t};`);
  const pa = qs(`.player-area.${color}`);
  if (pa.classList.contains('right')) {
    e.classList.add('flipped');
  }
  qs(`.player-area.${color} .${type}`).remove();
  qs('.on-board').append(e);
}

function placeRoad(color, site0, site1) {
  const [s0, s1] = [site0, site1].map(s => sites[s]);
  const center = [0, 1].map(i => (s0[i] + s1[i]) / 2);
  const [l, t] = convertCoordinates(center);
  const a = Math.sign(
    (s0[0] - s1[0]) * (s0[1] - s1[1])
  );
  const e = document.createElement('div');
  e.classList.add('road', 'piece', color);
  const style = `--l: ${l}; --t: ${t}; --a: ${a};`;
  e.setAttribute('style', style);
  qs(`.player-area.${color} .road`).remove();
  qs('.on-board').append(e);
}

function stockHouse(color, type, flipped) {
  const e = fromTemplate(type);
  e.classList.add(color);
  if (flipped) e.classList.add('flipped');
  qs(`.player-area.${color} .houses`).append(e);
}

function stockRoad(color) {
  const e = document.createElement('div');
  e.classList.add('road', 'piece', color);
  qs(`.player-area.${color} .roads`).append(e);  
}

function makeCard(kind, cardName) {
  const card = fromTemplate(kind);
  if (cardName) {
    const type = kind === 'resource' ? cardName :
        cardName === 'knight' ? 'knight' :
        cardName.startsWith('vp') ? 'vp' : 'progress';
    card.classList.add(type);
    const i = type === 'vp' ? 'vp' : cardName;
    qs('img', card).src = `img/${kind}/${i}.svg`;
  } else card.classList.add('unknown');
  return card;
}

function gainCard(color, loc, cardName) {
  const kind = loc === 'played' ? 'development' : loc;
  const card = makeCard(kind, cardName);
  const sel = `.player-area.${color} .hand.${loc}`;
  qs(sel).append(card);
}

function adjustCards(kind) {
  const hands = qsa(`.hand.${kind}`);
  for (const hand of hands) {
    const types = kind === 'resource' ?
        [...resources] : ['knight', 'progress', 'vp'];
    types.push('unknown');
    // Sort
    const cardTypeIdFn = card => sum(types.map(
      (e, i) => card.classList.contains(e) ? i : 0
    ));
    const cardSortFn = (cardA, cardB) => (
      cardTypeIdFn(cardA) - cardTypeIdFn(cardB)
    );
    const cardsAll = qsa('.card', hand);
    cardsAll.sort(cardSortFn);
    for (const card of cardsAll) hand.append(card);
    // Adjust horizontally
    const cardsByType = types.map(
      type => qsa(`.${type}`, hand)
    );
    const n = sum(cardsByType.map(x => x.length));
    const u = sum(cardsByType.map(x => !! x.length));
    const limit = kind === 'resource' ? 10 :
        kind === 'development' ? 9 : 6;
    const adj = n <= limit ? 0 :
        - Math.ceil(27 * (n - limit) / (n - u));
    for (const cards of cardsByType) {
      for (const [j, card] of cards.entries()) {
        card.style = `--adj: ${j ? adj : 0}px`;
      }
    }
  }
}

function awardBadge(color, type) {
  qs(`.${type}.awarded`)?.classList.remove('awarded');
  if (! color) return;
  const badge = qs(`.player-area.${color} .${type}`);
  badge.classList.add('awarded');
}



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



const svg = qs('.board svg');
const ns = svg.namespaceURI;

const robber = draw(seq(board.hexes.length).filter(
  x => board.hexes[x] === 'desert'
)) ?? -1;
if (robber > -1) moveRobber(robber);

const playerColor = [
  'orange', 'blue', 'white', 'red',
];
const playerVisible = {
  orange: true,
};

for (const [i, color] of playerColor.entries()) {
  makePlayerArea(i, color);
}

const roads = {
  orange: [
    [33, 27], [27, 21], [21, 20], [20, 14], [14, 13]
  ],
  blue: [[31, 37], [37, 43], [24, 18], [18, 12]],
  white: [[3, 8], [8, 14], [15, 9], [9, 8]],
  red: [[10, 5], [5, 4], [40, 34], [34, 28]],
};
for (const player in roads) {
  for (const road of roads[player]) {
    placeRoad(player, ...road);
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
    placeHouse(player, 'settlement', s);
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
    placeHouse(player, 'city', c);
  }
}

const handsR = {
  orange: [2, 1, 1, 2, 3],
  blue:   [3, 0, 1, 0, 1],
  white:  [0, 3, 0, 1, 0],
  red:    [0, 0, 2, 3, 0],
};
for (const [color, hand] of Object.entries(handsR)) {
  for (const [i, resource] of resources.entries()) {
    for (let n = 0; n < hand[i]; n++) {
      const cardName = playerVisible[color] ?
          resource : null;
      gainCard(color, 'resource', cardName);
    }
  }  
}

const handsD = {
  orange: ['knight', 'vp-palace', 'vp-university'],
  blue: ['vp-market'],
  white: ['knight', 'knight'],
  red: ['knight', 'knight', 'knight', 'vp-library'],
};
for (const [color, hand] of Object.entries(handsD)) {
  for (const card of hand) {
    const cardName =
        playerVisible[color] ? card : null;
    gainCard(color, 'development', cardName);
  }
}

const playedD = {
  orange: [
    'knight', 'knight', 'knight',
    'road-building', 'monopoly', 'year-of-plenty',
  ],
  blue: ['knight', 'road-building'],
  white: ['knight', 'year-of-plenty'],
  red: ['knight', 'knight', 'monopoly'],
};
for (const [color, arr] of Object.entries(playedD)) {
  for (const card of arr) {
    gainCard(color, 'played', card);
  }
}

const remainingD = ['knight', 'vp-chapel'];

awardBadge('orange', 'largest-army');
awardBadge('orange', 'longest-road');

const names = {
  orange: 'Graham',
  blue: 'Merrill',
  white: 'Morgan',
  red: 'Bo',
};
for (const [color, nm] of Object.entries(names)) {
  showPlayerName(color, nm);
}


adjustCards('resource');
adjustCards('development');
adjustCards('played');

// ael('.board', 'click', e => console.log(
//   e.offsetX, e.offsetY
// ));
