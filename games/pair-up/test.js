/* Replays every level's only solution through the engine (one draw per rectangle) and checks the win and best.
   Also: a covered board with a wrong rectangle is not a win; drawing over a rectangle replaces it. */
module.exports = function (E, LEVELS, check) {
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = !E.won(s);
    L.solution.forEach(function (p) { if (!E.draw(s, p)) ok = false; });
    check('level ' + (k + 1) + ' solution (' + s.moves + ' moves, best ' + L.best + ')', ok && E.won(s) && s.moves === L.best);
  });
  var L1 = LEVELS[0], s = E.fresh(L1);
  E.draw(s, [0, 0, L1.h - 1, L1.w - 1]);
  check('whole board as one rectangle is covered but not a win', E.coveredAll(s) && !E.won(s));
  E.draw(s, [0, 0, 0, 1]);
  check('drawing over a rectangle replaces it', s.rects.length === 1 && s.moves === 2);
  check('tap removes the rectangle under it', E.remove(s, 0, 0) && s.rects.length === 0 && s.moves === 3);
};
