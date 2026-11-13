/* Paint Ladder — pure rules. Each move: optional swap of two neighbouring chips, then all chips climb one row and take the paint they land on.
   Win: after the last row every lane matches the goal colour. */
Postie.engine('paint-ladder', (function () {
  function fresh(L) { return { chips: L.start.split(''), row: 0, swaps: 0 }; }
  function moves(L) { return L.paint.length; }
  /* returns a new state; swap = null or lane index i (swaps i and i+1) */
  function step(L, s, swap) {
    if (s.row >= moves(L)) return null;
    var c = s.chips.slice(), sw = s.swaps;
    if (swap !== null && swap !== undefined) { if (swap < 0 || swap > c.length - 2) return null; var t = c[swap]; c[swap] = c[swap + 1]; c[swap + 1] = t; sw++; }
    var row = s.row + 1, p = L.paint[row - 1];
    for (var l = 0; l < c.length; l++) if (p[l] !== '.') c[l] = p[l];
    return { chips: c, row: row, swaps: sw };
  }
  function done(L, s) { return s.row === moves(L); }
  function won(L, s) { return done(L, s) && s.chips.join('') === L.goal; }
  return { fresh: fresh, step: step, done: done, won: won, moves: moves };
})());
