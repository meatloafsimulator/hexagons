import {qs} from './utility.js';
import {resources} from './constants.js';
import {
  placeRoad, placeHouse,
  gainCard, makeCardPlayed, adjustCards,
  awardBadge, showPlayerName, gs,
} from './hexagons.js';

export function showExampleGame() {

  const roads = {
    orange: [19, 21, 29, 31, 40],
    blue: [18, 27, 35, 43, 45, 54],
    white: [5, 7, 12, 13, 14],
    red: [6, 8, 41, 50],
  }
  for (const player in roads) {
    for (const edge of roads[player]) {
      placeRoad(player, edge);
    }
  }

  const settlements = {
    orange: [20],
    blue: [24],
    white: [15],
    red: [4, 40],
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
      placeHouse(player, 'settlement', c);
      placeHouse(player, 'city', c);
    }
  }

  const handsR = {
    // orange: [2, 1, 1, 2, 3],
    orange: [16, 16, 16, 14, 18],
    blue:   [3, 0, 1, 0, 1],
    white:  [0, 3, 0, 1, 0],
    red:    [0, 0, 2, 3, 0],
  };
  for (
    const [color, hand] of Object.entries(handsR)
  ) {
    for (const [i, r] of resources.entries()) {
      const n = hand[i];
      for (let j = 0; j < n; j++) {
        gs.bank[r]--;
        const own = gs.control[color];
        gainCard(color, 'resource', own ? r : '');
        if (! own) gs.hands[color].resource[r]++
      }
    }  
  }

  const handsD = {
    orange: [
      'knight', 'palace',
      'monopoly',  'year-of-plenty', 'road-building',
    ],
    blue: ['market'],
    white: ['knight', 'knight'],
    red: ['knight', 'knight', 'knight', 'library'],
  };
  for (
    const [color, hand] of Object.entries(handsD)
  ) {
    for (const card of hand) {
      const own = gs.control[color];
      gainCard(color, 'development', own ? card : '');
      if (! own) gs.hands[color].development[card]++;
    }
  }

  const unripeD = {
    orange: ['university'],
  };
  for (
    const [color, arr] of Object.entries(unripeD)
  ) {
    for (const card of arr) {
      gainCard(color, 'unripe', card);
    }
  }

  const playedD = {
    orange: ['knight', 'knight', 'knight'],
    blue: ['knight', 'road-building'],
    white: ['year-of-plenty'],
    red: ['knight', 'knight', 'knight', 'monopoly'],
  };
  for (
    const [color, arr] of Object.entries(playedD)
  ) {
    for (const card of arr) {
      const own = gs.control[color];
      gainCard(color, 'development', own ? card : '');
      makeCardPlayed(color, card);
    }
  }
  gs.playedDevelopmentOnTurn = false;
  
  gs.developmentDeck = ['knight', 'chapel'];
  gs.developmentsLeft = gs.developmentDeck.length;

  // awardBadge('largest-army', 'red', 3);
  awardBadge('longest-road', 'blue', 6);

  const names = {
    orange: 'Graham',
    blue: 'Merrill',
    white: 'Morgan',
    red: 'Bo',
  };
  for (const [color, nm] of Object.entries(names)) {
    showPlayerName(color, nm);
  }
  
  adjustCards();
  
  gs.setup = 0;
  gs.turn = gs.order.indexOf('orange');
  // gs.playedDevelopmentOnTurn = true;
  qs('.player-area.orange .username').classList.add(
    'on-turn'
  );

}
