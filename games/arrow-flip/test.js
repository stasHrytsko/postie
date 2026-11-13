/* Replays every level's stored solution through the engine: every tap must be legal, the board must end empty in exactly `best` taps.
   Also checks the level data: square board, one thing per cell, anchors under blocks, spinners on free cells. Run: node tests/run.js arrow-flip */
module.exports = function (E, LEVELS, check) {
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = !E.won(s), why = '';
    var square = L.rows.every(function (r) { return r.length === L.rows.length; });
    (L.anchor || []).forEach(function (a) { if (!E.blockAt(s, a[0], a[1])) { ok = false; why = 'anchor without block'; } });
    (L.spin || []).forEach(function (a) { if (L.rows[a[0]][a[1]] !== '.') { ok = false; why = 'spinner under a piece'; } });
    L.solution.forEach(function (m, i) { if (ok && !E.tapAt(s, m[0], m[1])) { ok = false; why = 'illegal tap #' + (i + 1); } });
    check('level ' + (k + 1) + ' solution (' + s.moves + ' taps, best ' + L.best + ')', square && ok && E.won(s) && s.moves === L.best && [1, 2, 3].indexOf(L.difficulty) >= 0, why);
  });
};
