/* Replays every level's stored solution through the engine (both rule sets). Run: node tests/run.js parcels */
module.exports = function (E, LEVELS, check) {
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = s.status === 'playing' && E.anyFrame(s);
    L.solution.forEach(function (f) { if (!E.frame(s, f[0], f[1], f[2], f[3])) ok = false; });
    check('level ' + (k + 1) + ' [' + L.rules + '] solution (' + s.shipped + ' frames)', ok && s.shipped === s.total && [1, 2, 3].indexOf(L.difficulty) >= 0 && E.won(s), s.status);
  });
};
