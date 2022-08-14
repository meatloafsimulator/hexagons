function qs(selector, parent = document) {
  return parent.querySelector(selector);
}
function qsa(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}
function ael(x, type, fn) {
  const f = e => {
    e.preventDefault();
    fn.bind(x)();
  }
  const element = typeof x === 'object' ? x : qs(x);
  element.addEventListener(type, f);
}
function aelo(x, type, fn) {
  const f = e => {
    e.preventDefault();
    fn.bind(x)();
  }
  const element = typeof x === 'object' ? x : qs(x);
  element.addEventListener(type, f, {once: true});
}
function shuffle(arr, prng = Math.random) {
  const result = [];
  const remaining = [...arr];
  while (remaining.length) result.push(
    ...remaining.splice(prng() * remaining.length, 1)
  );
  return result;
}

export {qs, qsa, ael, aelo, shuffle};
