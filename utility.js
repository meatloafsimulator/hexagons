export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}
export function qsa(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

export function ael(x, type, fn) {
  const f = e => {
    e.preventDefault();
    fn.bind(x)();
  }
  const element = typeof x === 'object' ? x : qs(x);
  element.addEventListener(type, f);
}
export function aelo(x, type, fn) {
  const f = e => {
    e.preventDefault();
    fn.bind(x)();
  }
  const element = typeof x === 'object' ? x : qs(x);
  element.addEventListener(type, f, {once: true});
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

export function sum(arr) {
  return arr.reduce((a, e) => a + e);
}
export function rep(element, nTimes) {
  return new Array(nTimes).fill(element);
}
export function seq(n) {
  return new Array(n).fill().map((e, i) => i);
}
