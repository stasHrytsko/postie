/* Hidden Stones — pure rules, no DOM. Black Box (Eric Solomon): stones hidden in an n×n grid; shoot rays in from the edges
   and see only where each ray ends up. Mark k cells as stones and check.
   Ports (edge entry points): 0..n-1 top (left→right), n..2n-1 right (top→bottom), 2n..3n-1 bottom (left→right), 3n..4n-1 left (top→bottom).
   Ray result: 'H' hit (absorbed), 'R' reflected (came back out where it went in), number = exit port.
   Ray rules = stazzi apps/casual/hidden-stones/tools/hidden-stones-solver.mjs (trace), unchanged:
   1) stone straight ahead — absorbed; 2) stone diagonally ahead — turn 90° away from it; both diagonals — turn back;
   3) a turn needed while still on the edge, before entering — reflected. A ray leaving where it entered is reflected too. */
Postie.engine('hidden-stones', (function () {
  function portStart(n, p) {
    var s = Math.floor(p / n), i = p % n;
    if (s === 0) return [-1, i, 1, 0];
    if (s === 1) return [i, n, 0, -1];
    if (s === 2) return [n, i, -1, 0];
    return [i, -1, 0, 1];
  }
  function portAt(n, r, c) { if (r < 0) return c; if (c >= n) return n + r; if (r >= n) return 2 * n + c; return 3 * n + r; }
  /* port at board position (r,c) where -1 and n are the edge rows/columns; -1 for corners and inner cells */
  function portOf(n, r, c) {
    if (r === -1 && c >= 0 && c < n) return c;
    if (c === n && r >= 0 && r < n) return n + r;
    if (r === n && c >= 0 && c < n) return 2 * n + c;
    if (c === -1 && r >= 0 && r < n) return 3 * n + r;
    return -1;
  }
  /* position of port p just outside the grid: [r, c] */
  function portPos(n, p) { var st = portStart(n, p); return [st[0], st[1]]; }
  /* stones: array of cell indices r*n+c */
  function trace(n, stones, p) {
    var set = {}; for (var i = 0; i < stones.length; i++) set[stones[i]] = 1;
    function has(r, c) { return r >= 0 && c >= 0 && r < n && c < n && set[r * n + c] === 1; }
    var st = portStart(n, p), r = st[0], c = st[1], dr = st[2], dc = st[3], path = [[r, c]], outside = true;
    for (var g = 0; g < 4 * n * n + 8; g++) {
      var ar = r + dr, ac = c + dc;
      if (has(ar, ac)) { path.push([ar, ac]); return { res: 'H', path: path }; }
      var L = has(ar - dc, ac + dr), R = has(ar + dc, ac - dr), t;
      if (L || R) {
        if (outside) return { res: 'R', path: path };
        if (L && R) { dr = -dr; dc = -dc; } else if (L) { t = dr; dr = dc; dc = -t; } else { t = dr; dr = -dc; dc = t; }
        continue;
      }
      r = ar; c = ac; outside = false; path.push([r, c]);
      if (r < 0 || c < 0 || r >= n || c >= n) { var to = portAt(n, r, c); return { res: to === p ? 'R' : to, path: path }; }
    }
    throw new Error('ray loop');
  }

  /* state: shots[port] = { res, kind: 'H'|'R'|'P', label, from }; a pass-through ray labels both ends with the same number */
  function fresh(L) { return { n: L.n, k: L.k, stones: L.stones.slice(), shots: {}, pairs: 0, fired: 0, marks: [], tries: 0, won: false }; }
  /* shoot from port p. Repeating an old ray is free and changes nothing. Returns the entry. */
  function shoot(s, p) {
    if (s.won || p < 0 || p >= 4 * s.n) return null;
    if (s.shots[p]) return s.shots[p];
    var t = trace(s.n, s.stones, p), e;
    if (t.res === 'H') e = { res: 'H', kind: 'H', label: '✕' };
    else if (t.res === 'R') e = { res: 'R', kind: 'R', label: '↩' };
    else { s.pairs++; e = { res: t.res, kind: 'P', label: s.pairs }; }
    e.from = p; s.shots[p] = e; s.fired++;
    if (typeof t.res === 'number') s.shots[t.res] = { res: p, kind: 'P', label: e.label, from: p };
    return e;
  }
  /* tap a cell: mark / unmark a stone guess. No more than k marks. */
  function toggle(s, cell) {
    if (s.won || cell < 0 || cell >= s.n * s.n) return false;
    var i = s.marks.indexOf(cell);
    if (i >= 0) { s.marks.splice(i, 1); return true; }
    if (s.marks.length >= s.k) return false;
    s.marks.push(cell); return true;
  }
  /* Check (only with exactly k marks): returns how many marks are right, or -1 if not allowed. Costs nothing. */
  function check(s) {
    if (s.won || s.marks.length !== s.k) return -1;
    var right = s.marks.filter(function (m) { return s.stones.indexOf(m) >= 0; }).length;
    s.tries++;
    if (right === s.k) s.won = true;
    return right;
  }
  function won(s) { return s.won; }
  return { portStart: portStart, portAt: portAt, portOf: portOf, portPos: portPos, trace: trace,
    fresh: fresh, shoot: shoot, toggle: toggle, check: check, won: won };
})());
