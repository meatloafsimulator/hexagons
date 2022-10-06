export const resources = [
  'brick', 'wood', 'sheep', 'wheat', 'rock',
];
export const playerColors = [
  'orange', 'blue', 'white', 'red',
];
export const pieceCount = {
  city: 4, settlement: 5, road: 15,
};
export const cost = {
  road: {brick: 1, wood: 1},
  settlement: {brick: 1, wood: 1, sheep: 1, wheat: 1},
  city: {wheat: 2, rock: 3},
  development: {sheep: 1, wheat: 1, rock: 1},
};
export const exchangeRate = {
  portSpecific: 2, portGeneric: 3, general: 4,
};
export const developmentCount = {
  'knight': 14,
  'monopoly': 2,
  'road-building': 2,
  'year-of-plenty': 2,
  'vp-chapel': 1,
  'vp-library': 1,
  'vp-market': 1,
  'vp-palace': 1,
  'vp-university': 1,  
};
export const config = {
  delay: 103,
};
