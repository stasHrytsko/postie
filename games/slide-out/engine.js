/* Slide Out — pure rules, no DOM. Port of stazzi apps/casual/slide-out/src/engine/slideEngine.ts (same order of resolution).
   A swipe moves one tile one cell into an empty neighbour. If it lands on the exit cell of a waiting goal of its colour it leaves
   the board; then every other waiting goal's counter drops by 1 (counters count MOVES, not time); a goal at 0 fails the attempt.
   Then queued goals whose turn has come start waiting (unlockAfterServed <= served), and free matches resolve. Win: all goals served. */
Postie.engine('slide-out', (function () {
  var N = 5, D = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
  function exitCell(side, index) { return side === 'top' ? index : side === 'bottom' ? (N - 1) * N + index : side === 'left' ? index * N : index * N + N - 1; }
  function settle(s) {
    for (;;) {
      s.goals.forEach(function (g) { if (g.status === 'queued' && g.unlock <= s.served) { g.status = 'waiting'; g.countdown = g.init; } });
      var hit = null;
      for (var k = 0; k < s.goals.length; k++) { var g = s.goals[k]; if (g.status === 'waiting' && s.cells[g.cell] === g.color) { hit = g; break; } }
      if (!hit) break;
      s.cells[hit.cell] = 0; hit.status = 'served'; s.served++;
    }
    if (s.served === s.goals.length) s.status = 'won';
  }
  /* L.board: 25 chars row by row, '.' empty, 1..3 colour slot. L.goals: [colour, side, index, countdown, unlockAfterServed] */
  function fresh(L) {
    var s = { cells: L.board.split('').map(function (ch) { return ch === '.' ? 0 : +ch; }), moves: 0, served: 0, status: 'playing', fail: null,
      goals: L.goals.map(function (g, i) { return { id: i, color: g[0], side: g[1], index: g[2], cell: exitCell(g[1], g[2]), init: g[3], unlock: g[4], countdown: g[3], status: 'queued' }; }) };
    settle(s); return s;
  }
  function target(i, dir) { var r = Math.floor(i / N) + D[dir][0], c = i % N + D[dir][1]; return r < 0 || c < 0 || r >= N || c >= N ? -1 : r * N + c; }
  /* move(s, cell, dir) -> false if invalid (state unchanged), else true; then check s.status: playing | won | failed */
  function move(s, i, dir) {
    if (s.status !== 'playing' || !s.cells[i] || !D[dir]) return false;
    var j = target(i, dir); if (j < 0 || s.cells[j]) return false;
    var col = s.cells[i]; s.cells[i] = 0; s.cells[j] = col; s.moves++;
    for (var k = 0; k < s.goals.length; k++) { var g = s.goals[k]; if (g.status === 'waiting' && g.color === col && g.cell === j) { s.cells[j] = 0; g.status = 'served'; s.served++; break; } }
    s.goals.forEach(function (g) { if (g.status === 'waiting') g.countdown--; });
    var out = s.goals.filter(function (g) { return g.status === 'waiting' && g.countdown <= 0; });
    if (out.length) { out.forEach(function (g) { g.status = 'left'; }); s.status = 'failed'; s.fail = 'goal_timeout'; return true; }
    settle(s); return true;
  }
  function won(s) { return s.status === 'won'; }
  return { N: N, fresh: fresh, move: move, target: target, exitCell: exitCell, won: won };
})());
