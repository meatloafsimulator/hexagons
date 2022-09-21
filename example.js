import {resources} from './constants.js';
import {
  placeRoad, placeHouse, gainCard, awardBadge,
  showPlayerName,
} from './hexagons.js';

export function showExampleGame() {

  const playerVisible = {
    orange: true,
  };

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

}
