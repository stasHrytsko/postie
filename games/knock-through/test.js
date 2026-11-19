/* Replays every level's stored solution through the engine. Run: node tests/run.js knock-through */
module.exports = function (E, LEVELS, check) {
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = s.status === 'playing', sum = 0;
    L.order.forEach(function (x) { sum += x; });
    L.solution.forEach(function (m) { if (!E.knock(s, m[0], m[1], m[2], m[3])) ok = false; });
    check('level ' + (k + 1) + ' solution (' + L.solution.length + ' walls)', ok && sum === L.w * L.h && [1, 2, 3].indexOf(L.difficulty) >= 0 && E.won(s), s.status);
  });
};
