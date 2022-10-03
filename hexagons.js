import {
  qs, qsa, ael, shuffle, draw, sum, seq,
} from './utility.js';
import {
  resources, pieceCount, developmentCardCount, config,
} from './constants.js';
import {
  w, sites, edges, neighbors, centers, hexSites, 
  frameVertices, convertCoordinates,
} from './geometry.js';
import {makeBoard, boardCode} from './make-board.js';
import {renderBoard} from './render-board.js';

function fromTemplate(className, textOnly) {
  const content = qs(`template.${className}`).content;
  if (textOnly) {
    return content.firstChild.textContent.trim();
  }
  return content.firstElementChild.cloneNode(true);
}

function makePlayerArea(i, color) {
  const pa = fromTemplate('player-area');
  pa.classList.add(color);
  const isRight = i > 1;
  const isTop = i % 3;
  const side = isRight ? 'right' : 'left';
  pa.classList.add(side, isTop ? 'top' : 'bottom');
  const sz = qs(`.side-zone.${side}`);
  sz[isTop ? 'prepend' : 'append'](pa);
  for (const houseType of ['city', 'settlement']) {
    for (let n = 0; n < pieceCount[houseType]; n++) {
      stockHouse(color, houseType, isRight);
    }
  }
  for (let n = 0; n < pieceCount.road; n++) {
    stockRoad(color);
  }
}
export function showPlayerName(color, username) {
  const pn = qs(`.player-area.${color} .username`);
  pn.innerHTML = username;
}

function moveRobber(hex) {
  qs('.chit.robber')?.classList.remove('robber');
  const e = qsa('.chit')[hex];
  e.classList.add('robber');
  e.append(
    qs('svg.robber') ?? fromTemplate('robber')
  );
}

export function placeHouse(color, type, site) {
  const siteClassString = `site-${site}`;
  qs(`.piece.${siteClassString}`)?.remove();
  const siteElement = qs(`.site.${siteClassString}`);
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
  let c = color.substring(0, 1);
  if (type === 'city') c = c.toUpperCase();
  gso.houses[site] = c;
  if (gso.setup === 1) gainStartingHand(color, site);
}
export function placeRoad(color, edge) {
  qs(`.player-area.${color} .road`).remove();
  const e = qs(`.road.edge-${edge}`);
  e.classList.remove('invisible');
  e.classList.add(color);
  gso.roads[edge] = color.substring(0, 1);
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
    card.classList.add(type, cardName);
    const i = type === 'vp' ? 'vp' : cardName;
    qs('img', card).src = `img/${kind}/${i}.svg`;
  } else card.classList.add('unknown');
  return card;
}
export function gainCard(color, loc, cardName) {
  const kind = loc === 'played' ? 'development' : loc;
  const card = makeCard(kind, cardName);
  ael(card, 'click', () => showCardViewer(card));
  const sel = `.player-area.${color} .hand.${loc}`;
  qs(sel).append(card);
}
function gainStartingHand(color, site) {
  const adjacentHexes = board.hexes.filter(
    (e, i) => hexSites[i].includes(site)
  );
  for (const hex of adjacentHexes) {
    if (! resources.includes(hex)) continue;
    gainCard(color, 'resource', hex);
  }
  adjustCards('resource');
}

export function adjustCards(kind) {
  if (! kind) {
    const all = ['resource', 'development', 'played'];
    for (const k of all) adjustCards(k);
    return;
  }
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
        - Math.ceil(26 * (n - limit) / (n - u));
    for (const cards of cardsByType) {
      for (const [j, card] of cards.entries()) {
        card.style = `--adj: ${j ? adj : 0}px`;
      }
    }
  }
}

export function awardBadge(color, type) {
  qs(`.${type}.awarded`)?.classList.remove('awarded');
  if (! color) return;
  const badge = qs(`.player-area.${color} .${type}`);
  badge.classList.add('awarded');
}

function okRoad(color, edge) {
  if (gso.roads[edge]) return false;
  const s = edges[edge];
  const h = s.map(x => gso.houses[x].toLowerCase());
  const c = color.substring(0, 1);
  if (h.includes(c)) return true;
  const rTo = s.map(x => edges.some(
    (e, i) => e.includes(x) && gso.roads[i] === c
  ));
  return rTo.some((e, i) => e && ! h[i]);
}
function okHouse(color, type, site) {
  const c = color.substring(0, 1);
  if (type === 'city') return gso.houses[site] === c;
  if (gso.houses[site]) return false;
  const nbs = neighbors[site];
  if (nbs.some(x => gso.houses[x])) return false;
  if (gso.setup) return true;
  return edges.some(
    (e, i) => e.includes(site) && gso.roads[i] === c
  );
}

function edgesClickable(color) {
  for (const i of seq(edges.length)) {
    qs(`.road.edge-${i}`).classList.toggle(
      'clickable', color && okRoad(color, i)
    );
  }
}
function sitesClickable(color, type) {
  for (const i of seq(sites.length)) {
    qs(`.site.site-${i}`).classList.toggle(
      'clickable', color && okHouse(color, type, i)
    );
  }
}

function nextSetupTurn() {
  if (gso.setup === 2) gso.turn++; else gso.turn--;
  if (gso.turn === gso.order.length) {
    gso.setup--;
    gso.turn--;
  } else if (gso.turn === -1) {
    gso.setup--;
    gso.turn++;
    nextTurn();
    return;
  }
  sitesClickable(gso.order[gso.turn], 'settlement');
}
function nextTurn() {
  
}

export function clickSite(site) {
  sitesClickable(false);
  const color = gso.order[gso.turn];
  placeHouse(color, 'settlement', site);
  if (gso.setup) edgesClickable(color);
}
export function clickEdge(edge) {
  edgesClickable(false);
  placeRoad(gso.order[gso.turn], edge);
  if (gso.setup) nextSetupTurn();
}

function showCardViewer(card) {
  const cv = qs('.card-viewer');
  const cvHand = qs('.hand', cv);
  const paHand = card.parentElement;
  for (const c of paHand.children) {
    const cNew = c.cloneNode(true);
    if (c === card) cNew.classList.add('selected');
    ael(cNew, 'click', () => swapCardViewer(cNew));
    cvHand.append(cNew);
  }
  qs('.zoomed', cv).append(enlargeCard(card));
  setTimeout(
    () => {cv.style.display = 'flex';}, config.delay
  );
}
function hideCardViewer() {
  const cv = qs('.card-viewer');
  cv.style.display = 'none';
  qs('.hand', cv).replaceChildren();
  qs('.zoomed', cv).replaceChildren();
}
function swapCardViewer(card) {
  const cv = qs('.card-viewer');
  qs('.selected', cv).classList.remove('selected');
  card.classList.add('selected');
  const z = qs('.zoomed', cv);
  const cNew = enlargeCard(card);
  setTimeout(
    () => z.replaceChildren(cNew), config.delay
  );
}
function enlargeCard(card) {
  const bigCard = card.cloneNode(true);
  let cardName = '';
  const names = Object.keys(developmentCardCount);
  for (const cl of card.classList) {
    if (names.includes(cl)) cardName = cl;
  }
  if (
    card.classList.contains('development') &&
    ! card.classList.contains('unknown')
  ) {
    let cardKey = cardName;
    if (cardName.startsWith('vp')) cardKey = 'vp';
    const cardText = fromTemplate(
      `development-text.${cardKey}`, true
    );
    qs('.card-text', bigCard).innerHTML = cardText;
    const cardTitle = fromTemplate(
      `development-title.${cardName}`, true
    );
    qs('.card-title', bigCard).innerHTML = cardTitle;
  }
  return bigCard;
}

function showBadgeViewer(badge) {
  const bv = qs('.badge-viewer');
  bv.prepend(enlargeBadge(badge));
  setTimeout(
    () => {bv.style.display = 'flex';}, config.delay
  );
}
function hideBadgeViewer(badge) {
  const bv = qs('.badge-viewer');
  bv.style.display = 'none';
  qs('.badge', bv).remove();
}
function enlargeBadge(badge) {
  const bigBadge = badge.cloneNode(true);
  const [la, lr] = ['largest-army', 'longest-road'];
  const bKey = badge.classList.contains(la) ? la : lr;
  const badgeTitle = fromTemplate(
    `badge-title.${bKey}`, true
  );
  const badgeText = fromTemplate(
    `badge-text.${bKey}`, true
  );
  qs('.badge-title', bigBadge).innerHTML = badgeTitle;
  qs('.badge-text', bigBadge).innerHTML = badgeText;
  return bigBadge;
}

// Game initialization starts here

// Make and render board
const board = makeBoard(1);
renderBoard(board);

// Game state objects, overt (gso) and covert (gsc)
// These will eventually also go in database
const gso = {
  setup: 2,
  turn: -1,
  houses: sites.map(s => ''),
  roads: edges.map(e => ''),
};

const robber = draw(seq(board.hexes.length).filter(
  x => board.hexes[x] === 'desert'
)) ?? -1;
if (robber > -1) moveRobber(robber);

// Regulate which user controls which color
// These will eventually be user ids or something
gso.control = {orange: true};
// qs('button.actions').classList.add('orange');

// Shuffle seating arrangement
gso.order = shuffle([
  'orange', 'blue', 'white', 'red',
]);
// Rotate until top-left is player under control
while (! gso.control[gso.order[1]]) {
  gso.order.unshift(gso.order.pop());
}

// Make player areas
for (const [i, color] of gso.order.entries()) {
  makePlayerArea(i, color);
  showPlayerName(color, 'Anonymous');
}

// Attach event listeners
ael('.card-viewer .close', 'click', hideCardViewer);
ael('.badge-viewer .close', 'click', hideBadgeViewer);
for (const b of qsa('.player-area .badge')) {
  ael(b, 'click', () => showBadgeViewer(b));
}

// Ensure that no template elements appear
for (const t of qsa('template')) {
  t.style.display = 'none';
}

// Determine who goes first and rotate accordingly
const goesFirst = draw(gso.order);
while (gso.order[0] !== goesFirst) {
  gso.order.unshift(gso.order.pop());
}

// ael('.board', 'click', e => console.log(
//   e.offsetX, e.offsetY
// ));
import {showExampleGame} from './example.js';
showExampleGame();

// adjustCards('resource');
// adjustCards('development');
// adjustCards('played');

// nextSetupTurn();
