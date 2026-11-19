/* Replays every level's stored solution through the engine; on pool levels also checks that pulling back gives the moves back.
   Run: node tests/run.js streams */
module.exports = function (E, LEVELS, check) {
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = true;
    L.solution.forEach(function (m) { if (!E.step(L, s, m[0], m[1])) ok = false; });
    var cells = 0; s.lines.forEach(function (l) { cells += l.length; });
    var back = true;
    if (L.energy !== null) {                                            // pull the first step back: the pool comes back
      var t = E.fresh(L), e0 = t.energy; E.step(L, t, L.solution[0][0], L.solution[0][1]); back = E.retract(L, t, L.solution[0][0]) && t.energy === e0;
    }
    check('level ' + (k + 1) + ' solution (' + L.solution.length + ' steps' + (L.energy === null ? '' : ', pool ' + L.energy) + ')',
      ok && back && E.won(s) && cells === L.w * L.h && [1, 2, 3].indexOf(L.difficulty) >= 0, s.won ? '' : 'not won');
  });
};
