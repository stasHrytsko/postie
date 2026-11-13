/* Outgrow — pure rules, no DOM. Faithful to stazzi apps/casual/outgrow/src/engine/outgrowEngine.ts (SPEC §3–5).
   Grid cell: -1 wall, 0 free, k (1..5) territory k. Cell i = r * w + c. Neighbours: 4 sides.
   Layer of k: every free cell with a side neighbour owned by k (computed on the board before the tap).
   grow(k): the whole layer becomes k, moves + 1. Then, in order: some territory larger than its need → failed 'overgrown';
   no free cells → won; free cells left but no unfinished territory has a non-empty layer → failed 'stranded'. */
Postie.engine('outgrow', (function () {
  function fresh(L) {
    var grid = [];
    L.rows.forEach(function (row) { for (var c = 0; c < row.length; c++) { var ch = row.charAt(c); grid.push(ch === '#' ? -1 : ch === '.' ? 0 : ch.charCodeAt(0) - 64); } });
    return { w: L.w, h: L.h, grid: grid, need: L.need.slice(), moves: 0, status: 'playing', reason: null, overgrown: null };
  }
  function neighbors(s, i) {
    var r = Math.floor(i / s.w), c = i % s.w, out = [];
    if (r > 0) out.push(i - s.w);
    if (r < s.h - 1) out.push(i + s.w);
    if (c > 0) out.push(i - 1);
    if (c < s.w - 1) out.push(i + 1);
    return out;
  }
  function sizeOf(s, k) { var n = 0; for (var i = 0; i < s.grid.length; i++) if (s.grid[i] === k) n++; return n; }
  function layer(s, k) {
    var out = [];
    for (var i = 0; i < s.grid.length; i++) if (s.grid[i] === 0 && neighbors(s, i).some(function (j) { return s.grid[j] === k; })) out.push(i);
    return out;
  }
  /* territories that would take free cell i on their next tap (the "future layer" dots) */
  function reachers(s, i) {
    if (s.grid[i] !== 0) return [];
    var set = [];
    neighbors(s, i).forEach(function (j) { var v = s.grid[j]; if (v > 0 && set.indexOf(v) < 0) set.push(v); });
    return set.sort(function (a, b) { return a - b; });
  }
  function statusOf(s) {
    var k;
    for (k = 1; k <= s.need.length; k++) if (sizeOf(s, k) > s.need[k - 1]) return { status: 'failed', reason: 'overgrown', overgrown: k };
    if (s.grid.indexOf(0) < 0) return { status: 'won', reason: null, overgrown: null };
    for (k = 1; k <= s.need.length; k++) if (sizeOf(s, k) < s.need[k - 1] && layer(s, k).length > 0) return { status: 'playing', reason: null, overgrown: null };
    return { status: 'failed', reason: 'stranded', overgrown: null };
  }
  /* Tap on territory k. Returns the grown cells as [{i, from}] (from = the own neighbour it grew out of), or null if nothing changed. */
  function grow(s, k) {
    if (s.status !== 'playing') return null;
    var cells = layer(s, k);
    if (!cells.length) return null;
    var before = s.grid.slice(), out = cells.map(function (i) {
      var from = i; neighbors(s, i).some(function (j) { if (before[j] === k) { from = j; return true; } return false; });
      return { i: i, from: from };
    });
    cells.forEach(function (i) { s.grid[i] = k; });
    s.moves++;
    var st = statusOf(s); s.status = st.status; s.reason = st.reason; s.overgrown = st.overgrown;
    return out;
  }
  function won(s) { return s.status === 'won'; }
  return { fresh: fresh, neighbors: neighbors, sizeOf: sizeOf, layer: layer, reachers: reachers, statusOf: statusOf, grow: grow, won: won };
})());
