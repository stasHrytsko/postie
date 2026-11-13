/* Replays every level's stored solution (stazzi's solver optimum) through the engine: every step legal, win in exactly `best` moves.
   Also checks the data: exits on the border cell, not walls, flasks within capacity. Run: node tests/run.js the-gap */
module.exports = function (E, LEVELS, check) {
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = !E.won(s), why = '';
    L.exits.forEach(function (e, i) {
      var border = (e[2] === -1 && e[0] === 0) || (e[2] === 1 && e[0] === s.w - 1) || (e[3] === -1 && e[1] === 0) || (e[3] === 1 && e[1] === s.h - 1);
      if (!border || E.at(s, e[0], e[1]) < 0 || L.flasks[i].length > L.caps[i]) { ok = false; why = 'bad exit ' + (i + 1); }
    });
    L.solution.forEach(function (m, i) { if (ok && !E.step(s, m)) { ok = false; why = 'illegal step #' + (i + 1); } });
    check('level ' + (k + 1) + ' ' + L.name + ' solution (' + s.moves + ' moves, best ' + L.best + ')', ok && E.won(s) && s.moves === L.best && [1, 2, 3].indexOf(L.difficulty) >= 0, why);
  });
};
