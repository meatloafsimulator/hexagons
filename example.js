import {qs} from './utility.js';
import {resources} from './constants.js';
import {
  placeRoad, placeHouse, gainCard, awardBadge,
  showPlayerName, adjustCards,
} from './hexagons.js';

export function showExampleGame() {

  const playerVisible = {
    orange: true,
  };

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
      placeHouse(player, 'city', c);
    }
  }

  const handsR = {
    orange: [2, 1, 1, 2, 3],
    blue:   [3, 0, 1, 0, 1],
    white:  [0, 3, 0, 1, 0],
    red:    [0, 0, 2, 3, 0],
  };
  for (
    const [color, hand] of Object.entries(handsR)
  ) {
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
  for (
    const [color, hand] of Object.entries(handsD)
  ) {
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
  for (
    const [color, arr] of Object.entries(playedD)
  ) {
    for (const card of arr) {
      gainCard(color, 'played', card);
    }
  }

  const remainingD = ['knight', 'vp-chapel'];

  awardBadge('orange', 'largest-army');
  awardBadge('blue', 'longest-road');

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
  
  qs('.player-area.orange .username').classList.add(
    'on-turn'
  );

}
