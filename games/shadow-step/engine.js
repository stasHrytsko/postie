/* Shadow Step — pure rules (IDEA.md «Правила (общие)», variants A and B). */
Postie.engine('shadow-step', (function () {
  var O = [[1, 0], [-1, 0], [0, 1], [0, -1]], DG = [[1, 1], [1, -1], [-1, 1], [-1, -1]], KN = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  var LINE = { line3: [O, 1, 3], dash2: [O, 2, 2], ud2: [[[1, 0], [-1, 0]], 1, 2], side: [[[0, 1], [0, -1]], 1, 1], step: [O, 1, 1] };
  function find(b, ch) { for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) if (b[r][c] === ch) return [r, c]; }
  function eq(a, b) { return a[0] === b[0] && a[1] === b[1]; }
  function fresh(L) { return { L: L, blue: find(L.board, 'B'), red: find(L.board, 'R'), crystal: find(L.board, 'C'), hand: L.hand.slice(), status: 'playing', moves: 0 }; }
  function ok(L, r, c) { return r >= 0 && c >= 0 && r < 5 && c < 5 && L.board[r][c] !== '#'; }
  /* moves of a card from pos: [{to:[r,c], path:[cells passed before to]}] */
  function moves(L, card, pos) {
    var r = pos[0], c = pos[1], out = [];
    if (LINE[card]) { var d = LINE[card]; d[0].forEach(function (v) { var path = []; for (var k = 1; k <= d[2]; k++) { var rr = r + v[0] * k, cc = c + v[1] * k; if (!ok(L, rr, cc)) break; if (k >= d[1]) out.push({ to: [rr, cc], path: path.slice() }); path.push([rr, cc]); } }); }
    if (card === 'diag') DG.forEach(function (v) { if (ok(L, r + v[0], c + v[1])) out.push({ to: [r + v[0], c + v[1]], path: [] }); });
    if (card === 'knight') KN.forEach(function (v) { if (ok(L, r + v[0], c + v[1])) out.push({ to: [r + v[0], c + v[1]], path: [] }); });
    return out;
  }
  function dests(s, card) { return moves(s.L, card, s.blue).map(function (m) { return m.to; }).filter(function (t) { return !eq(t, s.red); }); }
  function dist(L, a, b) { var q = [[a, 0]], seen = {}; seen[a] = 1; while (q.length) { var x = q.shift(), p = x[0]; if (eq(p, b)) return x[1]; O.forEach(function (d) { var n = [p[0] + d[0], p[1] + d[1]]; if (ok(L, n[0], n[1]) && !seen[n]) { seen[n] = 1; q.push([n, x[1] + 1]); } }); } return 99; }
  function topLeft(a, b) { return a.to[0] - b.to[0] || a.to[1] - b.to[1]; }
  function passes(m, p) { return m.path.some(function (x) { return eq(x, p); }); }
  /* play: returns false if illegal; otherwise updates status ('won' | 'lost' | 'playing') */
  function play(s, card, to) {
    if (s.status !== 'playing' || s.hand.indexOf(card) < 0) return false;
    var m = moves(s.L, card, s.blue).filter(function (x) { return eq(x.to, to); })[0];
    if (!m || eq(to, s.red)) return false;
    s.hand.splice(s.hand.indexOf(card), 1); s.blue = to; s.moves++;
    if (s.L.jump === 'B' && passes(m, s.red)) { s.status = 'lost'; s.why = 'jumped'; return true; }
    if (eq(to, s.crystal)) { s.status = 'won'; return true; }
    var opts = moves(s.L, card, s.red);
    if (opts.length) {
      var catches = s.L.jump === 'B' ? opts.filter(function (x) { return eq(x.to, s.blue) || passes(x, s.blue); }).sort(topLeft) : [];
      var pick = catches[0] || opts.sort(function (a, b) { return dist(s.L, a.to, s.blue) - dist(s.L, b.to, s.blue) || topLeft(a, b); })[0];
      s.red = pick.to;
      if (catches.length || eq(s.red, s.blue)) { s.status = 'lost'; s.why = 'caught'; return true; }
    }
    if (!s.hand.length) { s.status = 'lost'; s.why = 'cards'; }
    return true;
  }
  return { fresh: fresh, play: play, dests: dests };
})());
