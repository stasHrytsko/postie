/* Replays every level's stored solution (cells tapped in order) through the engine: every tap must be legal and the
   level must end won (5 lines) exactly on the last tap. Run: node tests/run.js tight-shelf */
module.exports = function (E, LEVELS, check) {
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = !E.won(s) && E.legalNow(s).length > 0;
    L.solution.forEach(function (c, j) { if (!ok) return; if (!E.move(s, c)) ok = false; else if (E.won(s) !== (j === L.solution.length - 1)) ok = false; });
    check('level ' + (k + 1) + ' solution (' + s.moves + ' pieces, ' + s.lines + ' lines)', ok && E.won(s));
  });
};
