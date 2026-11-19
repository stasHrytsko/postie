/* Replays every level's stored solution (the stazzi solver's answer) through the engine: exactly `limit` taps, everyone at 0.
   Also: the start is not solved, the coins sum to 0, and a breadth-first search confirms no shorter answer exists (so best = limit).
   Run: node tests/run.js square-up */
module.exports = function (E, LEVELS, check) {
  function shortest(L) {
    var nb = E.nbrs(L), front = [L.coins], seen = {}; seen[L.coins.join()] = 1;
    for (var d = 0; d <= L.limit; d++) {
      if (front.some(E.zero)) return d;
      var next = [];
      front.forEach(function (c) {
        for (var v = 0; v < c.length; v++) [1, -1].forEach(function (sg) {
          var n = c.slice(); n[v] -= sg * nb[v].length; nb[v].forEach(function (j) { n[j] += sg; });
          if (!seen[n.join()]) { seen[n.join()] = 1; next.push(n); }
        });
      });
      front = next;
    }
    return Infinity;
  }
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = !E.won(s) && L.coins.reduce(function (a, b) { return a + b; }, 0) === 0;
    ok = ok && L.solution.length === L.limit && L.best === L.limit && [1, 2, 3].indexOf(L.difficulty) >= 0;
    L.solution.forEach(function (m) { if (!E.tap(s, m[0], m[1])) ok = false; });
    var opt = shortest(L);
    check('level ' + (k + 1) + ' solution (' + s.taps + ' taps, shortest ' + opt + ')', ok && E.won(s) && opt === L.limit, s.status);
  });
  /* the try ends after `limit` taps that miss */
  var L = LEVELS[0], f = E.fresh(L); E.tap(f, 0, 1); E.tap(f, 0, 1);
  check('a missed try fails and takes no more taps', f.status === 'failed' && !E.tap(f, 1, 1));
};
