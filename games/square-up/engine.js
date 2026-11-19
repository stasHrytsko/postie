/* Square Up — pure rules, no DOM. Faithful to stazzi apps/casual/square-up (index.html "rules" block = tools/square-up-solver.mjs).
   People are joined by lines (edges). A tap on person v:
     give (+1): v hands 1 coin to each neighbour (v loses its degree, each neighbour +1);
     take (-1): v takes 1 coin from each neighbour (the opposite).
   Going below 0 on the way is fine. Win: everyone at exactly 0. A try has exactly `limit` taps, no undo:
   limit spent and not all at 0 → status 'failed' (the try starts over). */
Postie.engine('square-up', (function () {
  function nbrs(L) { var a = L.pts.map(function () { return []; }); L.edges.forEach(function (e) { a[e[0]].push(e[1]); a[e[1]].push(e[0]); }); return a; }
  function zero(c) { return c.every(function (v) { return v === 0; }); }
  function fresh(L) { return { nb: nbrs(L), coins: L.coins.slice(), limit: L.limit, taps: 0, status: 'playing' }; }
  /* tap(s, v, sign): sign +1 give, -1 take. Returns false if the try is over. */
  function tap(s, v, sign) {
    if (s.status !== 'playing' || v < 0 || v >= s.coins.length || (sign !== 1 && sign !== -1)) return false;
    s.coins[v] -= sign * s.nb[v].length;
    s.nb[v].forEach(function (j) { s.coins[j] += sign; });
    s.taps++;
    s.status = zero(s.coins) ? 'won' : s.taps >= s.limit ? 'failed' : 'playing';
    return true;
  }
  function won(s) { return s.status === 'won'; }
  return { nbrs: nbrs, fresh: fresh, tap: tap, won: won, zero: zero };
})());
