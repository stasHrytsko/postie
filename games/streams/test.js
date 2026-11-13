/* Replays every level's solution (stazzi "opt") through the engine as finger moves (tip -> next cell) and checks the win
   and best. Also: pool 0 blocks a step; retracting a drop cell gives the move back and takes the drop back. */
module.exports = function (E, LEVELS, check) {
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = !E.won(s);
    L.solution.forEach(function (st) { var m = E.move(L, s, E.tipOf(L, s, st[0]), st[1]); if (!m || m.kind !== 'step' || m.line !== st[0]) ok = false; });
    check('level ' + (k + 1) + ' solution (' + s.moves + ' moves, best ' + L.best + ', left ' + s.energy + ')', ok && E.won(s) && s.moves === L.best);
  });
  /* retract a drop: level 2's solution passes drops; walk to the first drop, pull back one cell */
  var L2 = LEVELS[1], s = E.fresh(L2), i = 0;
  while (!E.dropAt(L2, s.lines[0][s.lines[0].length - 1])) { E.step(L2, s, 0, L2.solution[i][1]); i++; }
  var e = s.energy, tip = E.tipOf(L2, s, 0), back = s.lines[0][s.lines[0].length - 2], x = E.dropAt(L2, tip);
  var r = E.move(L2, s, tip, back);
  check('dragging back over a drop returns the move and takes the drop back', r && r.kind === 'retract' && s.energy === e + 1 - x);
  /* out of moves: an empty pool blocks the next step */
  var L1 = LEVELS[0], z = E.fresh(L1); z.energy = 0;
  check('no step with an empty pool', !E.step(L1, z, 0, L1.solution[0][1]));
};
