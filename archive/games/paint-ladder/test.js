module.exports = function (E, LEVELS, check) {
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = true;
    L.solution.forEach(function (x) { s = s && E.step(L, s, x); if (!s) ok = false; });
    check('level ' + (k + 1) + ' solution (' + (s && s.swaps) + ' swaps)', ok && E.won(L, s));
  });
};
