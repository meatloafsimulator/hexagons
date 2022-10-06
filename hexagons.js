import {
  qs, qsa, ael, shuffle, draw, sum, seq,
} from './utility.js';
import {
  resources, cost, pieceCount, developmentCount,
  playerColors, exchangeRate, config,
} from './constants.js';
import {
  w, sites, edges, neighbors, centers, hexSites, 
  frameVertices, convertCoordinates, coast,
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
  
  // Add card visually
  const kind = loc === 'resource' ?
      'resource' : 'development';
  const card = makeCard(kind, cardName);
  ael(card, 'click', () => showCardViewer(card));
  if (loc === 'unripe') card.classList.add('unripe');
  const hand = loc === 'unripe' ? 'development' : loc;
  const sel = `.player-area.${color} .hand.${hand}`;
  qs(sel).append(card);
  
  // Add card in game state
  if (loc === 'played') {
    gso.hands[color][loc][cardName]++;
    return;
  }
  gso.hands[color][loc]++;
  if (! gso.control[color]) return;
  gsc.hands[color][loc][cardName]++;
  
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

function showCardViewer(card, showPlayButton) {
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
  const playButton = qs('.play', cv);
  playButton.style.display =
      showPlayButton ? 'inline' : 'none';
  playButton.disabled =
      card.classList.contains('vp') ||
      card.classList.contains('unripe');
  setTimeout(
    () => {
      hideTurnMenu();
      cv.style.display = 'flex';
    },
    config.delay
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
    () => {
      z.replaceChildren(cNew);
      qs('.play', cv).disabled =
          card.classList.contains('vp') ||
          card.classList.contains('unripe');
    },
    config.delay
  );
}
function enlargeCard(card) {
  const bigCard = card.cloneNode(true);
  let cardName = '';
  const names = Object.keys(developmentCount);
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

function showTurnMenu() {
  const tm = qs('.turn-menu');
  const color = gso.order[gso.turn];
  const rHand = gsc.hands[color].resource;
  for (const [x, xCost] of Object.entries(cost)) {
    let afford = true;
    for (const [r, n] of Object.entries(xCost)) {
      if (rHand[r] < n) afford = false;
    }
    qs(`.buy-${x} button`, tm).disabled = ! afford;
  }
  const nCards = gso.hands[color];
  qs('.play-development').disabled =
      gso.playedDevelopmentOnTurn ||
      ! (nCards.development + nCards.unripe);
  const portStatus = onPort(color);
  let okTradeWithBank = false;
  for (const [r, n] of Object.entries(rHand)) {
    const rate = exchangeRate[
      portStatus[r] ? 'portSpecific' :
      portStatus.generic ? 'portGeneric' : 'general'
    ];
    if (n >= rate) okTradeWithBank = true;
  }
  qs('.trade-bank').disabled = ! okTradeWithBank;
  setTimeout(
    () => {tm.style.display = 'flex';}, config.delay
  );
}
function hideTurnMenu() {
  qs('.turn-menu').style.display = 'none';
}

function chooseDevelopment() {
  const color = gso.order[gso.turn];
  let sel = `.player-area.${gso.order[gso.turn]}`;
  sel += ' .hand.development .card';
  const card = qs(`${sel}:not(.vp):not(.unripe)`);
  showCardViewer(card ?? qs(sel), true);
}

function onPort(color) {
  const c = color.substring(0, 1);
  const result = {};
  for (const [i, port] of board.ports.entries()) {
    if (! port) continue;
    const coastCycle = [...coast, coast[0]];
    const portSites = coastCycle.slice(i, i + 2);
    for (const s of portSites) {
      const h = gso.houses[s].toLowerCase();
      if (h === c) result[port] = true;
    }
  }
  return result;
}

// Game initialization starts here

// Make and render board
const board = makeBoard(1);
renderBoard(board);

const robber = draw(seq(board.hexes.length).filter(
  x => board.hexes[x] === 'desert'
)) ?? -1;
if (robber > -1) moveRobber(robber);

// Game state objects, overt (gso) and covert (gsc)
// These will eventually also go in database
export const gso = {
  setup: 2,
  turn: -1,
  playedDevelopmentOnTurn: false,
  houses: sites.map(s => ''),
  roads: edges.map(e => ''),
  hands: {},
};
export const gsc = {hands: {},};

// Regulate which user controls which color
// These will eventually be user ids or something
gso.control = {orange: true};

// Add hand information to game state objects
for (const c of playerColors) {
  const dObj = Object.fromEntries(
    Object.keys(developmentCount).map(d => [d, 0])
  );
  gso.hands[c] = {
    resource: 0, development: 0, unripe: 0,
    played: {...dObj},
  };
  if (! gso.control[c]) continue;
  const rObj = Object.fromEntries(
    resources.map(r => [r, 0])
  );
  gsc.hands[c] = {
    resource: {...rObj},
    development: {...dObj}, unripe: {...dObj},
  };
}

// Shuffle seating arrangement
gso.order = shuffle(playerColors);
// Rotate until top-left is player under control
while (! gso.control[gso.order[1]]) {
  gso.order.unshift(gso.order.pop());
}

// Make player areas
for (const [i, color] of gso.order.entries()) {
  makePlayerArea(i, color);
  showPlayerName(color, 'Anonymous');
}

// Add costs to turn menu
for (const [x, xCost] of Object.entries(cost)) {
  const costDiv = qs(`.buy-${x} .cost`);
  for (const [r, n] of Object.entries(xCost)) {
    for (let i = 0; i < n; i++) {
      costDiv.append(makeCard('resource', r));
    }
  }
}

// Attach event listeners
ael('.card-viewer .close', 'click', hideCardViewer);
ael('.badge-viewer .close', 'click', hideBadgeViewer);
for (const b of qsa('.player-area .badge')) {
  ael(b, 'click', () => showBadgeViewer(b));
}
ael('.my-turn', 'click', showTurnMenu);
ael('.turn-menu .close', 'click', hideTurnMenu);
ael('.play-development', 'click', chooseDevelopment);

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
console.log(gso);
console.log(gsc);
console.log(board);
