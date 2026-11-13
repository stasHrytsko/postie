module.exports = function (E, LEVELS, check) {
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = true;
    L.solution.forEach(function (m) { if (!E.play(s, m[0], m[1])) ok = false; });
    check('level ' + (k + 1) + ' solution', ok && s.status === 'won');
  });
};
