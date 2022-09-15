export const w = Math.sqrt(3);

export const sites = [];
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

export const centers = [];
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

export const hexSites = centers.map(c => {
  const rel = [
    [1, 1], [0, 2], [-1, 1],
    [-1, -1], [0, -2], [1, -1],
  ];
  return rel.map(r => sites.findIndex(
    s => s[0] === c[0] + r[0] && s[1] === c[1] + r[1]
  ));
});

export const frameVertices = [
  [6, 0], [3, 9], [-3, 9], [-6, 0], [-3, -9], [3, -9],
];
frameVertices.sort((a, b) => angle(a) - angle(b));

export const coast = sites.map((e, i) => i).filter(
  u => Math.hypot(sites[u][0] * w, sites[u][1]) > 6
);
coast.sort(
  (a, b) => angle(sites[a]) - angle(sites[b])
);
while (coast[0] !== 36) coast.unshift(coast.pop());

export function convertCoordinates(svgCoords) {
  const hh = 300;
  const [x, y] = svgCoords;
  return [
    `${(x / 6 + 1) * hh * 2 / Math.sqrt(3)}px`,
    `${(y / 9 + 1) * hh}px`,
  ];
}

function angle(coords) {
  return Math.atan2(...coords);
}