export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}
export function qsa(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

export function ael(x, type, fn) {
  const f = e => {
    e.preventDefault();
    fn.bind(x, e)();
  }
  const element = typeof x === 'object' ? x : qs(x);
  element.addEventListener(type, f);
}
export function aelo(x, type, fn) {
  const f = e => {
    e.preventDefault();
    fn.bind(x, e)();
  }
  const element = typeof x === 'object' ? x : qs(x);
  element.addEventListener(type, f, {once: true});
}

export function sum(arr) {
  return arr.reduce((a, e) => a + e);
}
export function count(arr, element) {
  return arr.reduce((a, e) => a + (e === element), 0);
}
export function unique(arr) {
  return arr.filter((e, i, a) => a.indexOf(e) === i);
}
export function rep(element, nTimes) {
  return new Array(nTimes).fill(element);
}
export function seq(n) {
  return new Array(n).fill().map((e, i) => i);
}

export function draw(arr, prng = Math.random) {
  return arr[Math.floor(prng() * arr.length)];
}
export function shuffle(arr, prng = Math.random) {
  const result = [];
  const remaining = [...arr];
  while (remaining.length) result.push(
    ...remaining.splice(prng() * remaining.length, 1)
  );
  return result;
}
export function sample(
  arr, prob, prng = Math.random
) {
  const p = prob.map(x => x / sum(prob));
  const rand = prng();
  let i = 0;
  let cumulative = p[0];
  while (cumulative < rand) cumulative += p[++i];
  return arr[i];
}
