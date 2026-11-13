/* Replays every level's stored solution through the engine. Run all games: node tests/run.js */
module.exports = function (E, LEVELS, check) {
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = !E.won(s);
    L.solution.forEach(function (m) { if (!E.move(s, m[0], m[1])) ok = false; });
    check('level ' + (k + 1) + ' solution (' + s.moves + ' moves)', ok && E.won(s));
  });
};
