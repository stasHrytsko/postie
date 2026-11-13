/* Replays every level's stored ladder through the engine: 7 steps, the stored swaps, all four lanes matched.
   Also: the level is not won without swaps, and best = swaps in the stored solution. Run: node tests/run.js recruit-ladder */
module.exports = function (E, LEVELS, check) {
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = !E.won(s);
    L.solution.forEach(function (sw) { if (sw >= 0 && !E.swap(s, sw)) ok = false; if (!E.step(s)) ok = false; });
    var idle = E.fresh(L); for (var i = 0; i < E.ROWS; i++) E.step(idle);
    check('level ' + (k + 1) + ' solution (' + s.swaps + ' swaps, best ' + L.best + ')', ok && E.won(s) && s.swaps === L.best && !E.won(idle));
  });
};
