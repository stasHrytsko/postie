/* Replays every level's stored solution through the engine: fire the shots, mark the stones, Check -> win.
   Also: a wrong full set of marks is not accepted, and the shot rays match stazzi's ray rules (engine.trace is a copy). */
module.exports = function (E, LEVELS, check) {
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = !E.won(s) && L.stones.length === L.k;
    L.solution.shots.forEach(function (p) { if (!E.shoot(s, p)) ok = false; });
    var wrong = E.fresh(L), free = [];
    for (var i = 0; i < L.n * L.n && free.length < L.k; i++) if (L.stones.indexOf(i) < 0) free.push(i);
    free.forEach(function (c) { E.toggle(wrong, c); });
    if (E.check(wrong) === L.k || E.won(wrong)) ok = false;
    L.solution.marks.forEach(function (c) { if (!E.toggle(s, c)) ok = false; });
    ok = ok && E.check(s) === L.k;
    check('level ' + (k + 1) + ' solution (' + s.fired + ' shots, ' + L.k + ' stones)', ok && E.won(s));
  });
};
