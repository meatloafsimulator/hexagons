import {
  qs, qsa, ael, shuffle, draw, sum, seq, rep,
  camelCase
} from './utility.js';
import {
  resources, cost, pieceCount,
  resourceCount, developmentCount, vpCards, vpTarget,
  playerColors, exchangeRate, badgeMinimum,
  numberWords, config,
} from './constants.js';
import {
  w, sites, edges, neighbors, centers, hexSites, 
  frameVertices, convertCoordinates, coast,
} from './geometry.js';
import {makeBoard, boardCode} from './make-board.js';
import {renderBoard} from './render-board.js';

function fromTemplate(className) {
  const content = qs(`template.${className}`).content;
  return content.childElementCount ?
      content.firstElementChild.cloneNode(true) :
      content.textContent.trim();
}

function makePlayerArea(i, color) {
  const pa = fromTemplate('player-area');
  pa.classList.add(color);
  const isTop = i % 3;
  const side = i > 1 ? 'right' : 'left';
  pa.classList.add(side, isTop ? 'top' : 'bottom');
  const sz = qs(`.side-zone.${side}`);
  sz[isTop ? 'prepend' : 'append'](pa);
  for (const houseType of ['city', 'settlement']) {
    for (let n = 0; n < pieceCount[houseType]; n++) {
      stockHouse(color, houseType);
    }
  }
  for (let n = 0; n < pieceCount.road; n++) {
    stockRoad(color);
  }
}
export function showPlayerName(color, username) {
  for (const x of qsa(`.${color} .username`)) {
    x.innerHTML = username;    
  }
}

function moveRobber(hex) {
  qs('.chit.robber')?.classList.remove('robber');
  qs('.hex.robber')?.classList.remove('robber');
  const chit = qsa('.chit')[hex];
  chit.classList.add('robber');
  chit.append(
    qs('svg.robber') ?? fromTemplate('robber')
  );
  const hexElement = qsa('.hex')[hex];
  hexElement.classList.add('robber');
  gs.robber = hex;
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
  const isRight = pa.classList.contains('right');
  e.classList.toggle('flipped', isRight);
  qs(`.${type}`, pa).remove();
  qs('.on-board').append(e);
  let c = color.substring(0, 1);
  if (type === 'city') {
    c = c.toUpperCase();
    stockHouse(color, 'settlement');
    gs.piecesLeft[color].settlement++;
  }
  gs.houses[site] = c;
  gs.piecesLeft[color][type]--;
  if (gs.setup === 1) gainStartingHand(color, site);
}
export function placeRoad(color, edge) {
  qs(`.player-area.${color} .road`).remove();
  const e = qs(`.road.edge-${edge}`);
  e.classList.remove('invisible');
  e.classList.add(color);
  gs.roads[edge] = color.substring(0, 1);
  gs.piecesLeft[color].road--;
}
function removeRoad(edge) {
  const color = playerColors.find(
    x => x.substring(0, 1) === gs.roads[edge]
  );
  if (! color) return;
  stockRoad(color);
  const e = qs(`.road.edge-${edge}`);
  e.classList.add('invisible');
  e.classList.remove(color);
  gs.roads[edge] = '';
  gs.piecesLeft[color].road++;
}

function stockHouse(color, type) {
  const e = fromTemplate(type);
  e.classList.add(color);
  const pa = qs(`.player-area.${color}`);
  const isRight = pa.classList.contains('right');
  e.classList.toggle('flipped', isRight);
  qs('.houses', pa).append(e);
}
function stockRoad(color) {
  const e = document.createElement('div');
  e.classList.add('road', 'piece', color);
  qs(`.player-area.${color} .roads`).append(e);  
}

function makeCard(kind, cardName) {
  const card = fromTemplate(kind);
  card.dataset.name = cardName;
  if (cardName) {
    const type = kind === 'resource' ? cardName :
        vpCards.includes(cardName) ? 'vp' :
        cardName === 'knight' ? 'knight' : 'progress';
    card.classList.add(type);
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
  if (loc === 'played') card.classList.add('played');
  const hand = loc === 'unripe' ? 'development' : loc;
  const sel = `.player-area.${color} .hand.${hand}`;
  qs(sel).append(card);

  // Add card in game state unless played
  if (loc === 'played') return;
  gs.nCards[color][loc]++;
  if (! gs.control[color]) return;
  gs.hands[color][loc][cardName]++;

}
export function makeCardPlayed(color, cardName) {

  // Development card has now been played on turn
  gs.playedDevelopmentOnTurn = true;

  // Move card visually
  const h = `.player-area.${color} .hand.development`;
  const s = `[data-name="${cardName}"]:not(.unripe)`;
  qs(`${s}, .unknown`, qs(h)).remove()
  gainCard(color, 'played', cardName);
  adjustCards();
  
  // Move card in game state
  gs.nCards[color].development--;
  gs.playedCards[color][cardName]++;
  if (! gs.control[color]) return;
  gs.hands[color].development[cardName]--;
  
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
function ripenDevelopmentCards() {
  const color = colorOnTurn();
  const nCards = gs.nCards[color];
  nCards.development += nCards.unripe;
  nCards.unripe = 0;
  const hands = gs.hands[color];
  for (const x of Object.keys(hands.unripe)) {
    hands.development[x] += hands.unripe[x];
    hands.unripe[x] = 0;
  }
  for (const c of qsa('.unripe')) {
    c.classList.remove('unripe');
  }
}

function makeBadge(type) {
  const badge = fromTemplate('badge');
  badge.classList.add(type);
  qs('img:not([src])', badge).src = 
      `img/badge/${type}.svg`;
  ael(badge, 'click', () => showBadgeViewer(badge));
  return badge;
}
export function awardBadge(type, color, n) {
  const prop = camelCase(type);
  const {color: colorOld, n: nOld} = gs[prop];
  gs[prop].color = color;
  gs[prop].n = color ? n : null;
  if (color === colorOld) return;
  qs(`.player-area .${type}`)?.remove();
  if (color) {
    const badge = makeBadge(type);
    qs(`.player-area.${color} .badges`).append(badge);
  }
  const abm = qs('.acquire-badge');
  const title = fromTemplate(`badge-title.${type}`);
  qs('h2 span', abm).innerHTML = title;
  for (const q of qsa('.quadrant', abm)) {
    q.style.visibility = 'hidden';
  }
  function addCriterion(c) {
    const q = qs(`.quadrant.${c}`, abm);
    q.style.visibility = 'visible';
    if (type === 'largest-army') {
      const ph = qs(`.player-area.${c} .hand.played`)
          .cloneNode(true);
      ph.classList.add('centered');
      qs('.hand', q).replaceWith(ph);
    } else {
      const l = roadLength(c);
      qs('.hand', q).innerHTML = `Road Length: ${l}`;
    }
  }
  if (color) addCriterion(color);
  if (colorOld) addCriterion(colorOld);
  abm.style.display = 'flex';
}

function okRoad(color, edge) {
  if (gs.roads[edge]) return false;
  const s = edges[edge];
  const h = s.map(x => gs.houses[x].toLowerCase());
  const c = color.substring(0, 1);
  if (h.includes(c)) return true;
  const rTo = s.map(x => edges.some(
    (e, i) => e.includes(x) && gs.roads[i] === c
  ));
  return rTo.some((e, i) => e && ! h[i]);
}
function okHouse(color, type, site) {
  const c = color.substring(0, 1);
  if (type === 'city') return gs.houses[site] === c;
  if (gs.houses[site]) return false;
  const nbs = neighbors[site];
  if (nbs.some(x => gs.houses[x])) return false;
  if (gs.setup) return true;
  return edges.some(
    (e, i) => e.includes(site) && gs.roads[i] === c
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
function boardClickable(isClickable) {
  qs('.board').style.zIndex = isClickable ? 2 : 0;
}

export function clickSite(site) {
  sitesClickable(false);
  qs(`.site-${site}`).classList.add('selected');
  qs('.confirm-build').dataset.loc = site;
  showConfirm('build' ,sites[site]);
}
export function clickEdge(edge) {
  edgesClickable(false);
  qs(`.edge-${edge}`).classList.add('selected');
  qs('.confirm-build').dataset.loc = edge;
  const [s0, s1] = edges[edge].map(s => sites[s]);
  const center = [0, 1].map(i => (s0[i] + s1[i]) / 2);
  showConfirm('build', center);
}
export function clickHex(hex) {
  if (gs.robber === hex) {
    showExplanation(
      `You can't leave the robber where it is.`
    );
    return;
  }
  qsa('.chit')[hex].classList.add('selected');
  qs('.board svg').classList.remove('moving-robber');
  medianButton();
  qs('.confirm-robber').dataset.hex = hex;
  showConfirm('robber', centers[hex]);
}

function medianButton(type) {
  for (const button of qsa('.median button')) {
    button.style.display = 'none';
  }
  if (! type) return;
  qs(`.median .${type}`).style.display = 'block';
}

// Add confirm-cancel dialogs
{
  const ccd = [
    'robber', 'build', 'buy-card', 'end-turn',
  ];
  for (const x of ccd) {
    const cb = fromTemplate('dialog-confirm-cancel');
    cb.classList.add(`confirm-${x}`);
    qs('.prompt', cb).innerHTML =
        fromTemplate(`ui-text.confirm-${x}`);
    qs('.board').append(cb);
  }
}
function showConfirm(type, svgCoords) {
  const cb = qs(`.confirm-${type}`);
  const coords = svgCoords ?? [0, 0];
  const [l, t] = convertCoordinates(coords);
  const ab = ! svgCoords ? 0 : coords[1] > 0 ? -1 : 1;
  cb.style = `--l: ${l}; --t: ${t}; --ab: ${ab};`;
  cb.style.display = 'flex';
  medianButton();
}

function colorOnTurn() {
  return gs.order[gs.turn];
}
function nextSetupTurn() {
  const cb = qs('.confirm-build');
  if (gs.setup === 2) gs.turn++; else gs.turn--;
  if (gs.turn === gs.order.length) {
    gs.setup--;
    gs.turn--;
    cb.dataset.freePiecesToGo = 1;
  } else if (gs.turn === -1) {
    gs.setup--;
    gs.turn++;
    boardClickable(false);
    nextTurn();
    delete cb.dataset.freePiecesToGo;
    return;
  }
  sitesClickable(colorOnTurn(), 'settlement');
  cb.dataset.type = 'settlement';
  cb.dataset.freePiecesToGo = 2;
  boardClickable(true);
}
function nextTurn() {
  ripenDevelopmentCards();
  gs.turn = (gs.turn + 1) % gs.order.length;
  gs.playedDevelopmentOnTurn = false;
  gs.roll = null;
  passDice();
  checkGameOver();
  if (gs.winner) return;
  if (gs.control[colorOnTurn()]) {
    medianButton('my-turn');
  }
}
ael('.end-turn', 'click', () => {
  qs('.turn-menu').style.display = 'none';
  showConfirm('end-turn');
});
ael('.confirm-end-turn .cancel', 'click', () => {
  qs('.confirm-end-turn').style.display = 'none';
  medianButton('my-turn');
});
ael('.confirm-end-turn .confirm', 'click', () => {
  qs('.confirm-end-turn').style.display = 'none';
  nextTurn();
});

function recomputeVictoryPoints() {
  const vp = {};
  const abbr = {};
  for (const color of playerColors) {
    vp[color] = 0;
    const {development, unripe} = gs.hands[color];
    for (const card of vpCards) {
      vp[color] += development[card] + unripe[card];
    }
    abbr[color.substring(0, 1)] = color;
  }
  for (const x of gs.houses) {
    if (! x) continue;
    const a = x.toLowerCase();
    vp[abbr[a]] += x === a ? 1 : 2;
  }
  for (const b of ['largestArmy', 'longestRoad']) {
    if (gs[b].color) vp[gs[b].color] += 2;
  }
  gs.victoryPoints = vp;
  checkGameOver();
}
function checkGameOver() {
  const vp = gs.victoryPoints[colorOnTurn()];
  if (vp < vpTarget) return;
  gs.winner = colorOnTurn();
}
function showGameOver() {
  medianButton('final');
  const gom = qs('.game-over');
  for (const color of playerColors) {
    const vp = gs.victoryPoints[color];
    const h = qs(`.quadrant.${color} .hand`, gom);
    h.innerHTML = `Victory Points: ${vp}`;
  }
  gom.style.display = 'flex';
}
ael('.game-over .close', 'click', () => {
  qs('.game-over').style.display = 'none';
});
ael('.median .final', 'click', () => {
  qs('.game-over').style.display = 'flex';
});

function beginRobberMove(type, skipPrompt) {
  if (! skipPrompt) {
    showExplanation(
      'Select where you want to move the robber.'
    );    
  }
  boardClickable(true);
  qs('.board svg').classList.add('moving-robber');
  if (type) qs('.confirm-robber').dataset.type = type;
}
ael('.confirm-robber .cancel', 'click', () => {
  const cr = qs('.confirm-robber');
  qs('.selected').classList.remove('selected');
  cr.style.display = 'none';
  beginRobberMove(null, true);
  if (cr.dataset.type === 'knight') {
    medianButton('cancel');
  }
});
ael('.confirm-robber .confirm', 'click', () => {
  const cr = qs('.confirm-robber');
  qs('.selected').classList.remove('selected');
  cr.style.display = 'none';
  boardClickable(false);
  medianButton('my-turn');
  const hex = + cr.dataset.hex
  moveRobber(hex);
  if (cr.dataset.type === 'knight') {
    makeCardPlayed(colorOnTurn(), 'knight');
    recomputeBadge('largest-army');
    recomputeVictoryPoints();
  }
  if (gs.winner) return;
  const stealChoices = [];
  for (const color of playerColors) {
    if (color === colorOnTurn()) continue;
    const c = color.substring(0, 1);
    const adjHouses = gs.houses.filter(
      (e, i) => hexSites[hex].includes(i)
    );
    if (adjHouses.some(x => x.toLowerCase() === c)) {
      stealChoices.push(color);
    }
  }
  if (! stealChoices.length) return;
  gs.stealing = true;
  const sm = qs('.steal-menu');
  const cb = qs('.confirm', sm);
  cb.classList.add('unavailable');
  for (const color of playerColors) {
    const quadrant = qs(`.${color}`, sm);
    if (! stealChoices.includes(color)) continue; 
    quadrant.style.visibility = 'visible';
    const h = `.player-area.${color} .hand.resource`;
    const clonedHand = qs(h).cloneNode(true);
    clonedHand.classList.add('centered');
    qs('.hand', quadrant).replaceWith(clonedHand);
  }
  medianButton('steal');
  const abm = qs('.acquire-badge');
  if (abm.style.display !== 'none') return;
  sm.style.display = 'flex';
});

ael('.confirm-build .cancel', 'click', () => {
  const cb = qs('.confirm-build');
  qs('.selected').classList.remove('selected');
  cb.style.display = 'none';
  const color = colorOnTurn();
  if (cb.dataset.type === 'road') {
    edgesClickable(color);
  } else sitesClickable(color, cb.dataset.type);
  if (gs.setup) return;
  medianButton('cancel');
});
ael('.confirm-build .confirm', 'click', () => {
  const color = colorOnTurn();
  const cb = qs('.confirm-build');
  const type = cb.dataset.type;
  const loc = + (cb.dataset.loc);
  const nFree = + (cb.dataset.freePiecesToGo ?? 0);
  qs('.selected').classList.remove('selected');
  cb.style.display = 'none';
  if (! nFree) payCost(type);
  if (type === 'road') {
    placeRoad(color, loc);
    if (gs.setup) nextSetupTurn();
    else if (nFree > 1) {
      edgesClickable(color);
      cb.dataset.freePiecesToGo = nFree - 1;
      if (cb.dataset.freePiecesPlaced) {
        cb.dataset.freePiecesPlaced += ' ';
      }
      cb.dataset.freePiecesPlaced += loc;
      medianButton('cancel');
      const nRoadsLeft = gs.piecesLeft[color].road;
      const nClickable = qsa('.clickable').length;
      if (! nRoadsLeft || ! nClickable) {
        edgesClickable(false);
        const ffrm = qs('.forfeit-free-roads-menu');
        ffrm.style.display = 'flex';
      }
      return;
    } else if (nFree) {
      delete cb.dataset.freePiecesToGo;
      delete cb.dataset.freePiecesPlaced;
      makeCardPlayed(color, 'road-building');
    }
  } else {
    placeHouse(color, type, loc);
    if (gs.setup) {
      edgesClickable(color);
      cb.dataset.type = 'road';
    }    
  }
  recomputeBadge('longest-road');
  recomputeVictoryPoints();
  if (gs.setup) return;
  boardClickable(false);
  if (! gs.winner) medianButton('my-turn');
  else {
    const abd = qs('.acquire-badge').style.display;
    if (abd === 'none') showGameOver();
  }
});
function cancelBuildEntirely() {
  edgesClickable(false);
  sitesClickable(false);
  boardClickable(false);
  medianButton('my-turn');
  const cbds = qs('.confirm-build').dataset;
  const fpp = cbds.freePiecesPlaced;
  if (! (+ cbds.freePiecesToGo)) return;
  delete cbds.freePiecesToGo;
  delete cbds.freePiecesPlaced;
  if (! fpp) return;
  for (const loc of fpp.split(' ')) removeRoad(loc);
  showExplanation(
    `You have canceled playing the Road Building card.
     Any roads that you had already placed in the
     process of playing the card have been removed.`
  );
}
ael('.median .cancel', 'click', cancelBuildEntirely);

function payCost(type) {
  const color = colorOnTurn();
  const payment = [];
  for (const [r, n] of Object.entries(cost[type])) {
    const c = gs.control[color] ? r : 'unknown';
    for (let i = 0; i < n; i++) payment.push(c);
  }
  discard(color, payment);
}

function showCardViewer(card, playing) {
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
  for (const b of qsa('button', cv)) {
    b.style.display = 'none';
  }
  if (playing) {
    qs('.cancel', cv).style.display = 'inline';
    qs('.confirm', cv).style.display = 'inline';
    qs('.confirm', cv).classList.toggle(
      'unavailable',
      card.classList.contains('vp') ||
          card.classList.contains('unripe')
    );
  } else qs('.close', cv).style.display = 'inline';
  setTimeout(() => {
    hideTurnMenu();
    cv.style.display = 'flex';
  }, config.delay);
}
function hideCardViewer() {
  const cv = qs('.card-viewer');
  cv.style.display = 'none';
  qs('.hand', cv).replaceChildren();
  qs('.zoomed', cv).replaceChildren();
  if (! gs.winner) return;
  const mfd = qs('.median .final').style.display;
  if (mfd === 'none') showGameOver();
}
ael('.card-viewer .close', 'click', hideCardViewer);
ael('.card-viewer .cancel', 'click', hideCardViewer);
ael('.card-viewer .confirm', 'click', () => {
  const cv = qs('.card-viewer');
  const card = qs('.selected', cv);
  if (card.classList.contains('vp')) {
    showExplanation(
      `You don't play victory point cards directly.
       They will be revealed for you automatically
       whenever they allow you to win the game.`
    );
    return;
  }
  if (card.classList.contains('unripe')) {
    showExplanation(
      `You can't play a development card that<br>
       you purchased on the same turn.`
    );
    return;
  }
  playDevelopmentCard(card.dataset.name);
});
function swapCardViewer(card) {
  const cv = qs('.card-viewer');
  qs('.selected', cv).classList.remove('selected');
  card.classList.add('selected');
  const z = qs('.zoomed', cv);
  const cNew = enlargeCard(card);
  setTimeout(() => {
    z.replaceChildren(cNew);
    qs('.confirm', cv).classList.toggle(
      'unavailable',
      card.classList.contains('vp') ||
          card.classList.contains('unripe')      
    );
  }, config.delay);
}
function enlargeCard(card) {
  const bigCard = card.cloneNode(true);
  const cardName = card.dataset.name;
  if (
    card.classList.contains('development') &&
    ! card.classList.contains('unknown')
  ) {
    let cardKey = cardName;
    const p = qs('p', bigCard);
    if (vpCards.includes(cardName)) {
      cardKey = 'vp';
      p.classList.add('vp');
    }
    p.innerHTML =
        fromTemplate(`development-text.${cardKey}`);
    qs('h2', bigCard).innerHTML =
        fromTemplate(`development-title.${cardName}`);
  }
  return bigCard;
}

function showBadgeViewer(badge) {
  const bv = qs('.badge-viewer');
  bv.prepend(enlargeBadge(badge));
  setTimeout(() => {
    bv.style.display = 'flex';
  }, config.delay);
}
ael('.badge-viewer .close', 'click', () => {
  const bv = qs('.badge-viewer');
  bv.style.display = 'none';
  qs('.badge', bv).remove();  
});
function enlargeBadge(badge) {
  const type = ['largest-army', 'longest-road'].find(
    x => badge.classList.contains(x)
  );
  const bigBadge = badge.cloneNode(true);
  qs('h2', bigBadge).innerHTML =
      fromTemplate(`badge-title.${type}`);
  qs('p:not(.vp)', bigBadge).innerHTML =
      fromTemplate(`badge-text.${type}`);
  return bigBadge;
}

function showTurnMenu() {
  const tm = qs('.turn-menu');
  tm.classList.toggle('before-roll', ! gs.roll);
  const color = colorOnTurn();
  const rHand = gs.hands[color].resource;
  for (const [x, xCost] of Object.entries(cost)) {
    let afford = true;
    for (const [r, n] of Object.entries(xCost)) {
      if (rHand[r] < n) afford = false;
    }
    const button = qs(`.buy-${x} button`, tm);
    button.classList.toggle('unavailable', ! afford);
    const left = gs.piecesLeft[color][x] ?? 
        gs.developmentsLeft;
    if (! left) button.classList.add('unavailable');
  }
  const {development: nD, unripe: nU} =
      gs.nCards[color];
  const cantDevelop =
      gs.playedDevelopmentOnTurn || ! (nD + nU);
  for (const pdcb of qsa('.play-development', tm)) {
    pdcb.classList.toggle('unavailable', cantDevelop);
  }
  qs('.with-bank', tm).classList.toggle(
    'unavailable',
    ! Object.keys(bankTradeChoices(color)).length
  );
  setTimeout(() => {
    tm.style.display = 'flex';
    medianButton('my-turn');
  }, config.delay);
}
ael('.median .my-turn', 'click', showTurnMenu);
function hideTurnMenu() {
  qs('.turn-menu').style.display = 'none';
}
for (const b of qsa('.turn-menu .close')) {
  ael(b, 'click', hideTurnMenu);
}
 
ael('button.with-bank', 'click', () => {
  const button = qs('button.with-bank');
  if (button.classList.contains('unavailable')) {
    showExplanation(
      `You don't have enough of any resource
       to trade.`
    );
    return;
  }
  const twbm = qs('.trade-menu.with-bank');
  const mtbcl = qs('.confirm', twbm).classList;
  mtbcl.add('unavailable');
  qs('.note', twbm).style.display = 'none';
  const color = colorOnTurn();
  const choicesObj = bankTradeChoices(color);
  const cReceive = qs('.receive .choices', twbm);
  const cGive = qs('.give .choices', twbm);
  for (const r of resources) {
    const hReceive = document.createElement('div');
    hReceive.classList.add('hand', 'centered');
    hReceive.dataset.resource = r;
    const hGive = hReceive.cloneNode(true);
    if(! gs.bank[r]) {
      hReceive.classList.add('unavailable');
      qs('.note', twbm).style.display = 'block';
    }
    hReceive.append(makeCard('resource', r));
    const s = `.selected:not([data-resource="${r}"])`;
    ael(hReceive, 'click', () => {
      const hrcl = hReceive.classList;
      if (hrcl.contains('unavailable')) return;
      const previous = qs('.selected', cReceive);
      previous?.classList.remove('selected');
      hrcl.add('selected');      
      mtbcl.toggle('unavailable', ! qs(s, cGive));
    });
    cReceive.append(hReceive);
    if (! choicesObj[r]) continue;
    for (let i = 0; i < choicesObj[r]; i++) {
      hGive.append(makeCard('resource', r));
    }
    ael(hGive, 'click', () => {
      const previous = qs('.selected', cGive);
      previous?.classList.remove('selected');
      hGive.classList.add('selected');
      mtbcl.toggle('unavailable', ! qs(s, cReceive));
    });
    cGive.append(hGive);
  }
  setTimeout(() => {
    hideTurnMenu();
    twbm.style.display = 'flex';
  }, config.delay);
});
function hideBankTradeMenu() {
  const twbm = qs('.trade-menu.with-bank');
  twbm.style.display = 'none';
  for (const c of qsa('.choices', twbm)) {
    c.replaceChildren();
  }
}
ael('.with-bank .cancel', 'click', hideBankTradeMenu);
ael('.with-bank .confirm', 'click', () => {
  const twbm = qs('.trade-menu.with-bank');
  const bcl = qs('.confirm', twbm).classList;
  if (bcl.contains('unavailable')) {
    const e = qsa('.selected', twbm).length < 2 ?
        `Select which resources you want to trade.` :
        `You can't trade for the same resource type.`;
    showExplanation(e);
    return;
  }
  const receive =
      qs('.receive .selected', twbm).dataset.resource;
  const give = qsa('.give .selected .card', twbm).map(
    c => c.dataset.name
  );
  const color = colorOnTurn();
  discard(color, give);
  gainCard(color, 'resource', receive);
  gs.bank[receive]--;
  adjustCards('resource');
  hideBankTradeMenu();
});

for (const pdcb of qsa('.play-development')) {
  ael(pdcb, 'click', () => {
    if (pdcb.classList.contains('unavailable')) {
      const d = 'development card';
      const explanation = gs.playedDevelopmentOnTurn ?
          `You can play only one ${d} per turn.` :
          `You don't have any ${d}s to play.`;
      showExplanation(explanation);
      return;
    }
    let sel = `.player-area.${colorOnTurn()}`;
    sel += ' .hand.development .card';
    const card = qs(`${sel}:not(.vp):not(.unripe)`);
    showCardViewer(card ?? qs(sel), true);  
  });
}

function onPort(color) {
  const c = color.substring(0, 1);
  const result = {};
  for (const [i, port] of board.ports.entries()) {
    if (! port) continue;
    const coastCycle = [...coast, coast[0]];
    const portSites = coastCycle.slice(i, i + 2);
    for (const s of portSites) {
      const h = gs.houses[s].toLowerCase();
      if (h === c) result[port] = true;
    }
  }
  return result;
}
function bankTradeChoices(color) {
  const hand = gs.hands[color].resource;
  const portStatus = onPort(color);
  const result = {};
  for (const [r, n] of Object.entries(hand)) {
    const rate = exchangeRate[
      portStatus[r] ? 'portSpecific' :
      portStatus.generic ? 'portGeneric' : 'general'
    ];
    if (n >= rate) result[r] = rate;
  }
  return result;
}

function beginBuildFromTurnMenu(type) {
  const color = colorOnTurn();
  if (type === 'road') edgesClickable(color);
  else sitesClickable(color, type);
  boardClickable(true);
  qs('.confirm-build').dataset.type = type;
  hideTurnMenu();
  medianButton('cancel');
}
for (const type of ['road', 'settlement', 'city']) {
  const button = qs(`.buy-${type} button`);
  ael(button, 'click', () => {
    if (button.classList.contains('unavailable')) {
      const plural =
          type === 'city' ? 'cities' : `${type}s`;
      const explanation =
          gs.piecesLeft[colorOnTurn()][type] ?
          `You don't have the resources for a
           ${type}.` :
          `You're out of ${plural}.`;
      showExplanation(explanation);
      return;
    }
    beginBuildFromTurnMenu(type);
  });
}

function drawDevelopmentCard() {
  gs.developmentsLeft--;
  return gs.developmentDeck.pop();
}
ael('.buy-development button', 'click', () => {
  const button = qs('.buy-development button');
  if (button.classList.contains('unavailable')) {
    const explanation = gs.developmentsLeft ?
        `You don't have the resources for
         a development card.` :
        `There aren't any development cards left.`
    showExplanation(explanation);
    return;
  }
  hideTurnMenu();
  showConfirm('buy-card');
});
ael('.confirm-buy-card .cancel', 'click', () => {
  qs('.confirm-buy-card').style.display = 'none';
  medianButton('my-turn');
});
ael('.confirm-buy-card .confirm', 'click', () => {
  qs('.confirm-buy-card').style.display = 'none';
  const color = colorOnTurn();
  payCost('development');
  gainCard(color, 'unripe', drawDevelopmentCard());
  const sel = '.hand.development .card:last-child';
  const card = qs(`.player-area.${color} ${sel}`);
  adjustCards('development');
  showCardViewer(card);
  recomputeVictoryPoints();
  if (gs.winner) return;
  setTimeout(() => {
    medianButton('my-turn');
  }, config.delay);
});

function playDevelopmentCard(cardName) {
  if (cardName === 'knight') {
    hideCardViewer();
    medianButton('cancel');
    beginRobberMove('knight');
  }
  if (cardName === 'year-of-plenty') {
    const nCards = 2;
    const yopm = qs('.yop-menu');
    qs('.note', yopm).style.display = 'none';
    const cb = qs('.confirm', yopm);
    cb.classList.add('unavailable');
    const nText = numberWords[nCards] ?? nCards;
    qs('h2 span', yopm).innerHTML =
        nCards === 1 ? 'one card' : `${nText} cards`;
    for (const r of resources) {
      for (let i = 0; i < nCards; i++) {
        const h = document.createElement('div');
        h.classList.add('hand', 'centered');
        h.dataset.resource = r;
        if (i >= gs.bank[r]) {
          h.classList.add('unavailable');
          qs('.note', yopm).style.display = 'block';
        }
        h.append(makeCard('resource', r));
        ael(h, 'click', () => {
          const hcl = h.classList;
          if (hcl.contains('unavailable')) return;
          hcl.toggle('selected');
          cb.classList.toggle(
            'unavailable',
            qsa('.selected', yopm).length !== nCards
          );
          // Handle the case when the bank becomes
          // completely out of all resources
          const availableLeft = qsa(
            '.hand:not(.selected, .unavailable)', yopm
          );
          if (! availableLeft.length) {
            cb.classList.remove('unavailable');
          }
        });
        qs('.choices', yopm).append(h);
      }
    }
    setTimeout(() => {
      hideCardViewer();
      yopm.style.display = 'flex';
    }, config.delay);
  }
  if (cardName === 'monopoly') {
    const mm = qs('.monopoly-menu');
    const cb = qs('.confirm', mm);
    cb.classList.add('unavailable');
    for (const r of resources) {
      const h = document.createElement('div');
      h.classList.add('hand', 'centered');
      h.dataset.resource = r;
      h.append(makeCard('resource', r));
      ael(h, 'click', () => {
        const previous = qs('.selected', mm);
        previous?.classList.remove('selected');
        h.classList.add('selected');
        cb.classList.remove('unavailable');
      });
      qs('.choices', mm).append(h);
    }
    setTimeout(() => {
      hideCardViewer();
      mm.style.display = 'flex';
    }, config.delay);
  }
  if (cardName === 'road-building') {
    let nFreeRoads = 2;
    hideCardViewer();
    const color = colorOnTurn();
    const roadsLeft = gs.piecesLeft[color].road;
    if (! roadsLeft) {
      showExplanation(`You're out of roads.`);
      return;
    }
    showExplanation(
      'Select where you want to build your roads.'
    );
    edgesClickable(color);
    boardClickable(true);
    const cb = qs('.confirm-build');
    cb.dataset.type = 'road';
    cb.dataset.freePiecesToGo = nFreeRoads;
    cb.dataset.freePiecesPlaced = '';
    medianButton('cancel');
  }
}

function recomputeBadge(type) {
  const prop = camelCase(type);
  const size = {};
  for (const c of playerColors) {
    size[c] = type === 'largest-army' ?
        gs.playedCards[c].knight : roadLength(c);
  }
  const n = Math.max(... Object.values(size));
  if (n < badgeMinimum[type]) {
    awardBadge(type, null);
    return;
  }
  const leaders =
      playerColors.filter(c => size[c] === n);
  if (leaders.length > 1) {
    if (! leaders.includes(gs[prop].color)) {
      awardBadge(type, null);
    } else gs[prop].n = n;
  } else awardBadge(type, leaders[0], n);
}
function roadLength(color) {
  const c = color.substring(0, 1).toLowerCase();
  const finished = [];
  const working = sites.map((e, i) => (
    {roads: [], end: i}
  ));
  while (working.length) {
    const {roads, end} = working.pop();
    const h = gs.houses[end].toLowerCase();
    const blocked = h && h !== c;
    const adjacent = blocked ? [] : edges.flatMap(
      (e, i) => e.includes(end) ? [i] : []
    );
    const choices = adjacent.filter(
      e => gs.roads[e] === c && ! roads.includes(e)
    );
    for (const choice of choices) {
      const [otherEnd] =
          edges[choice].filter(s => s !== end);
      working.push(
        {roads: [...roads, choice], end: otherEnd}
      );
    }
    if (! choices.length) finished.push(roads);
  }
  return Math.max(...finished.map(x => x.length));
}

export function passDice() {
  for (const d of qsa('.dice .die')) d.remove();
  for (let i = 0; i < 2; i++) {
    qs(`.player-area.${colorOnTurn()} .dice`).append(
      fromTemplate('die')
    );
  }
}
function roll() {
  hideTurnMenu();
  gs.roll = [];
  for (const d of qsa('.dice .die')) {
    // d.classList.add('rolled');
    const value = draw(seq(6)) + 1;
    d.dataset.value = value;
    gs.roll.push(value);
  }
  if (sum(gs.roll) === 7) {
    makeDiscardOverview();
    if (Object.keys(gs.discard).length) {
      medianButton('discard');
    } else beginRobberMove('roll');
  } else medianButton('collect');
}
ael('.roll', 'click', roll);
function collect() {
  medianButton('my-turn');
  const colorAbbr = Object.fromEntries(
    playerColors.map(x => [x.substring(0, 1), x])
  );
  const resourceCountObj = Object.fromEntries(
    resources.map(r => [r, 0])
  );
  const result = Object.fromEntries(
    playerColors.map(x => [x, {...resourceCountObj}])
  );
  const total = {...resourceCountObj};
  for (const [i, r] of board.hexes.entries()) {
    if (gs.robber === i) continue;
    if (board.chits[i] !== sum(gs.roll)) continue;
    for (const s of hexSites[i]) {
      const house = gs.houses[s];
      if (! house) continue;
      const c = house.toLowerCase();
      const color = colorAbbr[c];
      const n = c === house ? 1 : 2;
      result[color][r] += n;
      total[r] += n;
    }
  }
  const notEnough = [];
  for (const [r, t] of Object.entries(total)) {
    if (t <= gs.bank[r]) continue;
    const cc = playerColors.filter(x => result[x][r]);
    if (cc.length > 1) {
      for (const c of cc) result[c][r] = 0;
    } else result[cc[0]][r] = gs.bank[r];
    notEnough.push(r);
  }
  if (notEnough.length) {
    const text = notEnough.join(' or ');
    showExplanation(
      `The bank doesn't have enough ${text}.`
    );
  }
  const acm = qs('.acquire-cards');
  const span = qs('h2 span', acm);
  span.innerHTML = 'Cards Collected';
  for (const [c, o] of Object.entries(result)) {
    const hand = qs(`.quadrant.${c} .hand`, acm);
    for (const [r, n] of Object.entries(o)) {
      for (let i = 0; i < n; i++) {
        hand.append(makeCard('resource', r));
        gs.bank[r]--;
        const card = gs.control[c] ? r : null;
        gainCard(c, 'resource', card);
      }
    }
  }
  acm.style.display = 'flex';
  adjustCards('resource');
}
ael('.median .collect', 'click', collect);
ael('.median .discard', 'click', () => {
  qs('.discard-overview').style.display = 'flex';
});
function makeDiscardOverview() {
  const dcov = qs('.discard-overview');
  qs('.continue', dcov).classList.add('unavailable');
  for (const c of playerColors) {
    const n = Math.floor(gs.nCards[c].resource / 2);
    const quadrant = qs(`.quadrant.${c}`, dcov);
    if (n > 3) {
      gs.discard[c] = null;
      quadrant.style.visibility = 'visible';
      const hand = qs('.hand', quadrant);
      hand.replaceChildren();
      const nText = numberWords[n] ?? n;
      if (gs.control[c]) {
        const b = document.createElement('button');
        b.innerHTML = `Discard ${nText}`;
        b.style.textTransform = 'capitalize';
        ael(b, 'click', () => showDiscardMenu(c, n));
        hand.append(b);
      } else {
        hand.innerHTML = `(must discard ${nText})`;
      }
    } else quadrant.style.visibility = 'hidden';
  }
}
function showDiscardMenu(color, nToDiscard) {
  const dm = qs('.discard-menu');
  dm.dataset.color = color;
  const confirmButton = qs('.confirm', dm);
  confirmButton.classList.add('unavailable');
  const hand = qsa(
    `.player-area.${color} .hand.resource .card`
  );
  const n = nToDiscard ?? Math.floor(hand.length / 2);
  const nText = numberWords[n] ?? n;
  qs('h2 span', dm).innerHTML =
      n === 1 ? 'one card' : `${nText} cards`;
  for (const c of hand) {
    const h = document.createElement('div');
    h.classList.add('hand', 'centered');
    h.dataset.resource = c.dataset.name;
    h.append(c.cloneNode(true));
    ael(h, 'click', () => {
      h.classList.toggle('selected');
      confirmButton.classList.toggle(
        'unavailable',
        qsa('.selected', dm).length !== n
      );
    });
    qs('.choices', dm).append(h);
  }
  setTimeout(() => {
    qs('.discard-overview').style.display = 'none';
    dm.style.display = 'flex';
  }, config.delay);
}
ael('.discard-overview .close', 'click', () => {
  qs('.discard-overview').style.display = 'none';
});
ael('.discard-overview .continue', 'click', () => {
  const button = qs('.discard-overview .continue');
  if (button.classList.contains('unavailable')) {
    showExplanation(
      'Some players still need to discard.'
    );
    return;
  }
  medianButton();
  qs('.discard-overview').style.display = 'none';
  beginRobberMove('roll');
});
function hideDiscardMenu() {
  const dm = qs('.discard-menu');
  dm.style.display = 'none';
  delete dm.dataset.color;
  qs('.choices', dm).replaceChildren();
  qs('h2 span', dm).innerHTML = 'zero cards';
}
ael('.discard-menu .close', 'click', hideDiscardMenu);
ael('.discard-menu .confirm', 'click', () => {
  const button = qs('.discard-menu .confirm');
  if (button.classList.contains('unavailable')) {
    showExplanation(
      `Select the right number of cards to discard.`
    );
    return;
  }
  const color = qs('.discard-menu').dataset.color;
  const dArr = qsa('.discard-menu .selected').map(
    x => x.dataset.resource
  );
  gs.discard[color] = dArr;
  const dcov = qs('.discard-overview');
  const hand = qs(`.quadrant.${color} .hand`, dcov);
  hand.replaceChildren();
  for (const r of dArr) {
    hand.append(makeCard('resource', r));
  }
  if (Object.values(gs.discard).every(x => x)) {
    const b = qs('.continue', dcov);
    b.classList.remove('unavailable');
    for (const [c, a] of Object.entries(gs.discard)) {
      discard(c, a);
    }
    gs.discard = {};
  }
  hideDiscardMenu();
  dcov.style.display = 'flex';
});
function discard(color, cards) {
  const hand =
      qs(`.player-area.${color} .hand.resource`);
  for (const card of cards) {
    gs.nCards[color].resource--;
    gs.hands[color].resource[card]--;
    gs.bank[card]++;
    qs(`.${card}, .unknown`, hand).remove();
  }
  adjustCards('resource');
}

// Attach button click listeners to quad-box modals
function hideAcquire(which) {
  const a = qs(`.acquire-${which}`);
  a.style.display = 'none';
  let v = 'hidden';
  if (which === 'cards') {
    qs('h2 span', a).innerHTML = 'Cards Collected';
    v = 'visible';
  }
  for (const quadrant of qsa('.quadrant', a)) {
    quadrant.style.visibility = v;
    qs('.hand', quadrant).replaceChildren();
  }
}
ael('.acquire-cards .continue', 'click', () => {
  hideAcquire('cards');
});
ael('.acquire-badge .continue', 'click', () => {
  hideAcquire('badge');
  if (gs.winner) {
    showGameOver();
    return;
  }
  if (! gs.stealing) return;
  qs('.steal-menu').style.display = 'flex';
});
function hideStealMenu() {
  const sm = qs('.steal-menu');
  sm.style.display = 'none';
  const cb = qs('.confirm', sm);
  delete cb.dataset.stealFrom;
  cb.classList.add('unavailable');
  qs('.selected', sm)?.classList.remove('selected');
}
ael('.steal-menu .close', 'click', hideStealMenu);
ael('.steal-menu .confirm', 'click', () => {
  const cb = qs('.steal-menu .confirm');
  if (cb.classList.contains('unavailable')) {
    showExplanation('Select a player.');
    return;
  }
  const from = cb.dataset.stealFrom;
  hideStealMenu();
  for (const q of qsa('.steal-menu .quadrant')) {
    q.style.visibility = 'hidden';
    qs('.hand', q).replaceChildren();
  }
  medianButton('my-turn');
  steal(from);
});
function steal(from) {
  gs.stealing = false;
  const to = colorOnTurn();
  const handObj = gs.hands[from].resource;
  const handArr = Object.entries(handObj).flatMap(
    e => rep(e[0], e[1])
  );
  if (! handArr.length) return;
  const r = draw(handArr);
  handObj[r]--;
  gs.nCards[from].resource--;
  const handEl =
      qs(`.player-area.${from} .hand.resource`);
  qs(`.${r}, .unknown`, handEl).remove();
  gainCard(to, 'resource', r);
  adjustCards('resource');
  const acm = qs('.acquire-cards');
  qs('h2 span', acm).innerHTML =
      'Card Stolen by Robber';
  for (const quadrant of qsa('.quadrant', acm)) {
    quadrant.style.visibility = 'hidden';
  }
  const qFrom = qs(`.quadrant.${from}`, acm);
  qFrom.style.visibility = 'visible';
  const card = makeCard('resource', r);
  qs('.hand', qFrom).append(makeCard('resource', r));
  const qTo = qs(`.quadrant.${to}`, acm);
  qTo.style.visibility = 'visible';
  qs('.hand', qTo).append('(receives card)');
  acm.style.display = 'flex';
}
ael('.median .steal', 'click', () => {
  qs('.steal-menu').style.display = 'flex';
});

// Attach button click listeners to yop-menu
{
  const yopm = qs('.yop-menu');
  const cb = qs('.confirm', yopm);
  function hideYearOfPlenty() {
    yopm.style.display = 'none';
    qs('.choices', yopm).replaceChildren();
    qs('h2 span', yopm).innerHTML = 'zero cards';
  }
  ael(qs('.cancel', yopm), 'click', hideYearOfPlenty);
  ael(cb, 'click', () => {
    if (cb.classList.contains('unavailable')) {
      showExplanation(
        `Select the right number of cards to take.`
      );
      return;
    }
    const color = colorOnTurn();
    const acm = qs('.acquire-cards');
    const span = qs('h2 span', acm);
    span.innerHTML = 'Cards Gained by Year of Plenty';
    for (const quadrant of qsa('.quadrant', acm)) {
      if (! quadrant.classList.contains(color)) {
        quadrant.style.visibility = 'hidden';
      }
    }
    const h = qs(`.quadrant.${color} .hand`, acm);
    for (const x of qsa('.selected', yopm)) {
      const r = x.dataset.resource;
      h.append(makeCard('resource', r));
      gs.bank[r]--;
      gainCard(color, 'resource', r);
    }
    makeCardPlayed(color, 'year-of-plenty');
    adjustCards('resource');
    hideYearOfPlenty();
    acm.style.display = 'flex';
  });
}

// Attach button click listeners to monopoly-menu
{
  const mm = qs('.monopoly-menu');
  const cb = qs('.confirm', mm);
  function hideMonopoly() {
    mm.style.display = 'none';
    qs('.choices', mm).replaceChildren();
  }
  ael(qs('.cancel', mm), 'click', hideMonopoly);
  ael(cb, 'click', () => {
    if (cb.classList.contains('unavailable')) {
      showExplanation(
        `Choose a resource type to monopolize.`
      );
      return;
    }
    const r = qs('.selected', mm).dataset.resource;
    const color = colorOnTurn();
    const acm = qs('.acquire-cards');
    const span = qs('h2 span', acm);
    span.innerHTML = 'Cards Lost to Monopoly';
    for (const c of playerColors) {
      const quadrant = qs(`.quadrant.${c}`, acm);
      if (c === color) {
        qs('.hand', quadrant).innerHTML =
            '(receives cards)';
        continue;
      }
      const n = gs.hands[c].resource[r];
      if (! n) continue;
      discard(c, rep(r, n));
      const h = qs(`.quadrant.${c} .hand`, acm);
      for (let i = 0; i < n; i++) {
        h.append(makeCard('resource', r));
        gs.bank[r]--;
        gainCard(color, 'resource', r);
      }
    }
    makeCardPlayed(color, 'monopoly');
    adjustCards();
    hideMonopoly();
    acm.style.display = 'flex';
  });
}

// Attach button click listeners to ffrm-menu
{
  const ffrm = qs('.forfeit-free-roads-menu');
  ael(qs('.cancel', ffrm), 'click', () => {
    ffrm.style.display = 'none';
    cancelBuildEntirely();
  });
  ael(qs('.play-anyway', ffrm), 'click', () => {
    ffrm.style.display = 'none';
    const cbds = qs('.confirm-build').dataset;
    delete cbds.freePiecesToGo;
    delete cbds.freePiecesPlaced;
    makeCardPlayed(colorOnTurn(), 'road-building');
    boardClickable(false);
    medianButton('my-turn');
    recomputeBadge('longest-road');
    recomputeVictoryPoints();
    if (gs.winner) showGameOver();
  });
}

function showExplanation(text) {
  const explanation = qs('.explanation');
  qs('.prompt', explanation).innerHTML = text;
  explanation.style.display = 'flex';
}
ael('.explanation .close', 'click', () => {
  qs('.explanation').style.display = 'none';
});

// Attach keyboard listeners
document.addEventListener('keydown', e => {
  const keys = {
    cancel: [27, 88, 90],   // escape x z
    confirm: [13, 32],      // enter space
  };
  keys.all = Object.values(keys).flat();
  if (! keys.all.includes(e.which)) return;
  e.preventDefault();
  for (const [b, k] of Object.entries(keys)) {
    if (k.includes(e.which)) pressButton(b);
  }
});
function pressButton(type) {
  let typeSel = `.${type}`;
  if (type === 'cancel') typeSel += ', .close';
  if (type === 'confirm') typeSel += ', .continue';
  function isUp(el) {
    return getComputedStyle(el).display !== 'none';
  }
  const buttonContainers = [
    '.explanation',
    '.modal',
    '.dialog-confirm-cancel',
    '.median',
  ];
  for (const selStr of buttonContainers) {
    for (const x of qsa(selStr)) {
      if (! isUp(x)) continue;
      for (const button of qsa(typeSel, x)) {
        if (isUp(button)) button.click();
      }
      return;
    }
  }
}

// Temporary debug feature
ael('.options', 'click', () => {
  console.log(gs);
});

// Game initialization starts here

// Make and render board
const board = makeBoard(1);
renderBoard(board);

// Game state object
export const gs = {
  control: {},
  order: {},
  setup: 2,
  turn: -1,
  roll: null,
  stealing: false,
  playedDevelopmentOnTurn: false,
  houses: sites.map(s => ''),
  roads: edges.map(e => ''),
  robber: -1,
  nCards: {},
  playedCards: {},
  piecesLeft: {},
  bank: {},
  hands: {},
  developmentDeck: [],
  largestArmy: {color: null, n: null},
  longestRoad: {color: null, n: null},
  victoryPoints: {},
  winner: null,
  discard: {},
};

// If exactly one desert, place robber there
{
  const deserts = board.hexes.flatMap((e, i) => (
    e === 'desert' ? [i] : []
  ));
  if (deserts.length === 1) moveRobber(deserts[0]);
}

// Regulate which user controls which color
// These will eventually be user ids or something
gs.control = {
  orange: true,
  blue: true,
  white: true,
  red: true,
};

// Add piece, hand, and vp information to game state
for (const c of playerColors) {
  gs.piecesLeft[c] = {...pieceCount};
  gs.nCards[c] = {
    resource: 0, development: 0, unripe: 0,
  };
  const dObj = Object.fromEntries(
    Object.keys(developmentCount).map(d => [d, 0])
  );
  gs.playedCards[c] = {...dObj};
  // if (! gs.control[c]) continue;
  gs.hands[c] = {
    resource: Object.fromEntries(
      resources.map(r => [r, 0])
    ),
    development: {...dObj}, unripe: {...dObj},
  };
  gs.victoryPoints[c] = 0;
}

// Shuffle seating arrangement
gs.order = shuffle(playerColors);
// Rotate until top-left is player under control,
// (unless no player is under control)
if (playerColors.some(color => gs.control[color])) {
  while (! gs.control[gs.order[1]]) {
    gs.order.unshift(gs.order.pop());
  }  
}

// Make player areas
for (const [i, color] of gs.order.entries()) {
  makePlayerArea(i, color);
  showPlayerName(color, 'Anonymous');
}

// Make quadrants on quad-box modals
for (const area of qsa('section.player-area')) {
  const s = fromTemplate('quadrant');
  for (const color of playerColors) {
    s.classList.toggle(
      color, area.classList.contains(color)
    );
  }
  qs('.username', s).innerHTML =
      qs('.username', area).innerHTML;
  const fn = area.classList.contains('left') ?
      'prepend' : 'append';
  const where = area.classList.contains('top') ?
      'top' : 'bottom';
  for (const qb of qsa('.quad-box')) {
    qs(`.${where}`, qb)[fn](s.cloneNode(true));
  }
}

// Attach quadrant click listeners to steal-menu
for (const color of playerColors) {
  const sm = qs('.steal-menu');
  const quadrant = qs(`.quadrant.${color}`, sm);
  ael(quadrant, 'click', () => {
    const previous = qs('.selected', sm);
    previous?.classList.remove('selected');
    quadrant.classList.add('selected');
    const cb = qs('.confirm', sm);
    cb.dataset.stealFrom = color;
    cb.classList.remove('unavailable');
  });
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

// Ensure that no template or modal elements appear
for (const t of qsa('template, .modal')) {
  t.style.display = 'none';
}

// Determine who goes first and rotate accordingly
{
  const goesFirst = draw(gs.order);
  while (gs.order[0] !== goesFirst) {
    gs.order.unshift(gs.order.pop());
  }
}

// Create and shuffle development card deck
gs.developmentDeck = shuffle(
  Object.entries(developmentCount).flatMap(
    a => rep(a[0], a[1])
  )
);
gs.developmentsLeft = gs.developmentDeck.length;

// Create and stock resource cards in bank
gs.bank = Object.fromEntries(resources.map(
  r => [r, resourceCount[r] ?? resourceCount.all]
));

// import {showExampleGame} from './example.js';
// showExampleGame();

nextSetupTurn();

// showDiscardMenu('orange');
// qs('.acquire-cards').style.display = 'flex';




// BUG LIST
// victory points not being computed
// no immediate robber prompt when rolling 7
// "warning" for disallowed development action
