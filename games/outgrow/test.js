/* Replays every level's stored solution (stazzi solver's opt) through the engine. Run: node tests/run.js outgrow */
module.exports = function (E, LEVELS, check) {
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = !E.won(s) && s.status === 'playing', total = 0;
    s.grid.forEach(function (v) { if (v !== -1) total++; });
    var sum = L.need.reduce(function (a, b) { return a + b; }, 0);
    L.solution.split('').forEach(function (ch) { if (!E.grow(s, ch.charCodeAt(0) - 64)) ok = false; });
    check('level ' + (k + 1) + ' solution (' + s.moves + ' taps)', ok && sum === total && [1, 2, 3].indexOf(L.difficulty) >= 0 && E.won(s), s.status + (s.reason ? ' ' + s.reason : ''));
  });
};
