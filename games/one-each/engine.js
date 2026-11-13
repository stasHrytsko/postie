/* One Each — pure rules, no DOM. Sliding marbles (like the 15-puzzle): move a marble into a free neighbouring cell.
   Win: no colour repeats in any row or column. */
Postie.engine('one-each', (function () {
  function fresh(L) { return { n: L.n, cells: L.start.slice(), moves: 0 }; }
  function adjacent(n, i, j) { var r1 = Math.floor(i / n), c1 = i % n, r2 = Math.floor(j / n), c2 = j % n; return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1; }
  function move(s, i, j) { if (!s.cells[i] || s.cells[j] || !adjacent(s.n, i, j)) return false; s.cells[j] = s.cells[i]; s.cells[i] = 0; s.moves++; return true; }
  function freeNeighbours(s, i) { var n = s.n, r = Math.floor(i / n), c = i % n, out = []; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var rr = r + d[0], cc = c + d[1]; if (rr >= 0 && cc >= 0 && rr < n && cc < n && !s.cells[rr * n + cc]) out.push(rr * n + cc); }); return out; }
  function conflicts(s) {
    var n = s.n, bad = {};
    for (var k = 0; k < n; k++) [0, 1].forEach(function (col) {
      var seen = {};
      for (var t = 0; t < n; t++) { var i = col ? t * n + k : k * n + t, v = s.cells[i]; if (v) (seen[v] = seen[v] || []).push(i); }
      Object.keys(seen).forEach(function (v) { if (seen[v].length > 1) seen[v].forEach(function (i) { bad[i] = 1; }); });
    });
    return bad;
  }
  function won(s) { return Object.keys(conflicts(s)).length === 0; }
  return { fresh: fresh, move: move, freeNeighbours: freeNeighbours, conflicts: conflicts, won: won };
})());
