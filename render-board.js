import {qs, ael} from './utility.js';
import {
  w, sites, centers, hexSites, edges, 
  frameVertices, coast, convertCoordinates,
} from './geometry.js';
import {
  clickSite, clickEdge, clickHex,
} from './hexagons.js';

export function renderBoard(board) {

  const {ports, hexes, chits} = board;

  const svg = qs('.board svg');
  const ns = svg.namespaceURI;
  const ce = e => document.createElementNS(ns, e);

  // Set SVG viewbox based on frame
  {
    const fvx = frameVertices.map(v => v[0]);
    const fvy = frameVertices.map(v => v[1]);
    const xMax = Math.max(...fvx) * w;
    const yMax = Math.max(...fvy);
    const vb = [-xMax, -yMax, 2 * xMax, 2 * yMax];
    svg.setAttribute('viewBox', vb.join(' '));    
  }

  // Outer water frame
  {
    const e = ce('polygon');
    e.classList.add('water');
    const pointsArr = frameVertices.flatMap(
      v => [v[0] * w, v[1]]
    );
    e.setAttribute('points', pointsArr.join());
    svg.append(e);
  }

  // Hexes
  for (const [i, sArr] of hexSites.entries()) {
    const e = ce('polygon');
    e.classList.add('hex', hexes[i]);
    const pointsArr = sArr.flatMap(
      s => [sites[s][0] * w, sites[s][1]]
    );
    e.setAttribute('points', pointsArr.join());
    ael(e, 'click', () => clickHex(i));
    svg.append(e);
  }

  // Debug labels
  {
    const renderDebugLabel = (point, i) => {
      const e = ce('text');
      e.classList.add('debug-label');
      e.setAttribute('x', point[0] * w);
      e.setAttribute('y', point[1]);
      e.innerHTML = i;
      svg.append(e);
    };
    sites.map(renderDebugLabel);
    centers.map(renderDebugLabel);
  }

  // Chits
  for (const [i, c] of centers.entries()) {
    const e = document.createElement('div');
    e.classList.add('chit', 'circle');
    const [l, t] = convertCoordinates(c);
    e.setAttribute('style', `--l: ${l}; --t: ${t};`);
    e.innerHTML = chits[i] || '';
    qs('.on-board').append(e);
  }

  // Ports
  for (const [i, type] of ports.entries()) {
    if (! type) continue;
    const [s0, s1 = coast[0]] = coast.slice(i, i + 2);
    const [p0, p1] = [s0, s1].map(i => [...sites[i]]);
    for (const p of [p0, p1]) p[0] *= w;
    const p2 = outerEqTriPoint(p0, p1);
    const center = [0, 1].map(
      i => (p0[i] + p1[i] + 2 * p2[i]) / 4
    );
    const r = 0.5;
    const pointsArr = [p0, p1, p2].flatMap(
      p => [0, 1].map(
        i => p[i] * r + center[i] * (1 - r)
      )
    );
    const e = ce('polygon');
    e.classList.add('port', type);
    e.setAttribute('points', pointsArr.join());
    svg.append(e);
  }
  
  // Invisible roads as pointer targets
  for (const [i, sArr] of edges.entries()) {
    const [s0, s1] = sArr.map(s => sites[s]);
    const [l, t] = convertCoordinates(
      [0, 1].map(u => (s0[u] + s1[u]) / 2)
    );
    const a = Math.sign(
      (s0[0] - s1[0]) * (s0[1] - s1[1])
    );
    const e = document.createElement('div');
    e.classList.add(
      'piece', 'road', 'invisible', `edge-${i}`
    );
    const style = `--l: ${l}; --t: ${t}; --a: ${a};`;
    e.setAttribute('style', style);
    ael(e, 'click', () => clickEdge(i));
    qs('.on-board').append(e);
  }
  
  // Circles on sites as pointer targets
  for (const [i, s] of sites.entries()) {
    const [l, t] = convertCoordinates(s);
    const e = document.createElement('div');
    e.classList.add('site', 'circle', `site-${i}`);
    e.setAttribute('style', `--l: ${l}; --t: ${t};`);
    ael(e, 'click', () => clickSite(i));
    qs('.on-board').append(e);
  }
  
}


// Outer point of equilateral triangle
function outerEqTriPoint(p0, p1) {
  const m = [0, 1].map(i => (p0[i] + p1[i]) / 2);
  const v = [0, 1].map(i => p1[i] - p0[i]);
  const hyp = Math.hypot;
  const d = hyp(...v);
  const a = Math.atan2(...v.reverse());
  const aRot = a + Math.PI / 2;
  const vRotUnit = [Math.cos(aRot), Math.sin(aRot)];
  const h = d * Math.sqrt(3) / 2;
  const p2a = [0, 1].map(i => m[i] + vRotUnit[i] * h);
  const p2b = [0, 1].map(i => m[i] - vRotUnit[i] * h);
  return hyp(...p2a) > hyp(...p2b) ? p2a : p2b;
}
