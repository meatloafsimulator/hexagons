import {
  qs, qsa, shuffle, draw, sum, seq
} from './utility.js';
import {resources} from './constants.js';
import {
  w, sites, centers, hexSites, frameVertices,
  convertCoordinates,
} from './geometry.js';
import {makeBoard, boardCode} from './make-board.js';
import {renderBoard} from './render-board.js';

const board = makeBoard(1);
renderBoard(board);

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

function fromTemplate(className) {
  const fragment = qs(`template.${className}`);
  const node = fragment.content.firstElementChild;
  return node.cloneNode(true);
}

const svg = qs('.board svg');
const ns = svg.namespaceURI;

const robber = draw(seq(board.hexes.length).filter(
  x => board.hexes[x] === 'desert'
));
// const robber = draw(seq(board.hexes.length));
console.log(robber);
if (robber) {
  const e = qsa('.chit')[robber];
  e.classList.add('robber');
  e.append(fromTemplate('robber'));
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
  const pa = fromTemplate('player-area');
  pa.classList.add(player);
  if (i) pa.classList.add('opponent');
  const side = i < 2 ? 'left' : 'right';
  pa.classList.add(side, i % 2 ? 'bottom' : 'top');
  qs('.player-name', pa).innerHTML = playerNames[i];
  for (const [j, resource] of resources.entries()) {
    for (let n = 0; n < handsResource[i][j]; n++) {
      const card = fromTemplate('resource');
      if (playerVisible[i]) {
        card.classList.add(resource);
        const src = `img/resource/${resource}.svg`
        qs('img', card).src = src;        
      } else card.classList.add('unknown');
      qs('.hand.resource', pa).append(card);
    }
  }
  function makeDevelopmentCard(cardName, visible) {
    const card = fromTemplate('development');
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
    const svg = fromTemplate('city');
    svg.classList.add(player);
    if (pa.classList.contains('right')) {
      svg.classList.add('flipped');
    }
    inv.append(svg);
  }
  for (let n = 0; n < 4; n++) {
    const inv = qs('.inventory.houses', pa);
    const svg = fromTemplate('settlement');
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
    const svg = fromTemplate('settlement');
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
    const svg = fromTemplate('city');
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
