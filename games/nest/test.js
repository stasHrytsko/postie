/* Replays every level's stored solution through the engine (open, enter, rotate, move, exit) and checks the win.
   Also: the start is not won, layers match stazzi's tests (2,2,3,3,3,2,2,3,3,3,3), every part at the start is in one piece,
   and the picture can't be won without opening a part (some top part doesn't match its outline). Run: node tests/run.js nest */
module.exports = function (E, LEVELS, check) {
  var LAYERS = [2, 2, 3, 3, 3, 2, 2, 3, 3, 3, 3];
  check('11 levels, layers as in stazzi', LEVELS.length === 11 && LEVELS.every(function (L, k) { return E.depth(E.fresh(L).root) === LAYERS[k] && L.layers === LAYERS[k]; }));
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = !E.won(s), bad = '';
    (function walk(x) { x.children.forEach(function (ch) { if (ch.kind === 'comp') { if (!E.whole(ch)) ok = false; walk(ch); } }); })(s.root);
    var wrongTop = s.root.children.some(function (ch) { return ch.kind === 'comp' && !E.fitsFrame(ch); });
    L.solution.forEach(function (m, j) {
      if (E.won(s) && !bad) { ok = false; bad = 'won before step ' + (j + 1); }
      var r = m[0] === 'open' ? E.open(s) : m[0] === 'in' ? E.enter(s, m[1]) : m[0] === 'out' ? E.exit(s) : m[0] === 'rot' ? E.rotate(s, m[1]) : E.move(s, m[1], m[2], m[3]);
      if (!r && !bad) { ok = false; bad = 'step ' + (j + 1) + ' ' + JSON.stringify(m) + ' refused'; }
    });
    check('level ' + (k + 1) + ' ' + L.name + ' solution (' + L.solution.length + ' steps, ' + s.moves + ' piece moves)', ok && wrongTop && E.won(s), bad);
  });
};
