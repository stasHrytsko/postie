/* Tight Shelf — pure rules, no DOM. Port of stazzi apps/casual/tight-shelf/src/engine/shelfEngine.ts (no timer).
   Board n×n (4, 5 or 6), cell i = row * n + col. Rule per cell: '.' any piece, colour B/Y/C or shape o/s/t.
   Piece = colour + shape, e.g. 'Bt' (blue triangle). Colours: B blue, Y yellow (butter), C coral (apricot).
   Placing a piece clears every full line of three through it (row, column or diagonal) whose pieces share a colour or a shape;
   no cascades. Queue: endless "bag" (all 9 types shuffled, then a new bag) from mulberry32 with the level's fixed seed,
   so every attempt of a level gets the same queue. Win: target lines (5). Lose: the current piece fits no empty cell. */
Postie.engine('tight-shelf', (function () {
  var TYPES = []; 'BYC'.split('').forEach(function (c) { 'ost'.split('').forEach(function (s) { TYPES.push(c + s); }); });
  var PREVIEW = 3, WIN = {};
  function windowsAt(n) {
    if (WIN[n]) return WIN[n];
    var all = [];
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) [[0, 1], [1, 0], [1, 1], [1, -1]].forEach(function (d) {
      var w = [];
      for (var k = 0; k < 3; k++) { var y = r + d[0] * k, x = c + d[1] * k; if (y < 0 || y >= n || x < 0 || x >= n) return; w.push(y * n + x); }
      all.push(w);
    });
    var at = []; for (var i = 0; i < n * n; i++) at.push(all.filter(function (w) { return w.indexOf(i) >= 0; }));
    return (WIN[n] = at);
  }
  function fits(rule, p) { return rule === '.' || rule === p[0] || rule === p[1]; }
  function share(a, b, c) { return (a[0] === b[0] && a[0] === c[0]) || (a[1] === b[1] && a[1] === c[1]); }
  function legal(rules, board, p) { var out = []; for (var i = 0; i < board.length; i++) if (!board[i] && fits(rules[i], p)) out.push(i); return out; }
  /* put piece p into cell i of board (mutates); returns { lines, cleared, lineCells } */
  function put(board, i, p) {
    board[i] = p; var n = Math.round(Math.sqrt(board.length)), kill = {}, lineCells = [];
    windowsAt(n)[i].forEach(function (w) {
      var a = board[w[0]], b = board[w[1]], c = board[w[2]];
      if (a && b && c && share(a, b, c)) { lineCells.push(w.slice()); w.forEach(function (k) { kill[k] = 1; }); }
    });
    var cleared = Object.keys(kill).map(Number); cleared.forEach(function (k) { board[k] = null; });
    return { lines: lineCells.length, cleared: cleared, lineCells: lineCells };
  }
  function rand(rng) {
    var next = (rng + 0x6d2b79f5) >>> 0, t = next;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, rng: next };
  }
  /* next piece from the bag (same as stazzi draw) */
  function draw(s) {
    if (!s.bag.length) {
      s.bag = TYPES.slice();
      for (var i = s.bag.length - 1; i > 0; i--) { var r = rand(s.rng); s.rng = r.rng; var j = Math.floor(r.value * (i + 1)), t = s.bag[i]; s.bag[i] = s.bag[j]; s.bag[j] = t; }
    }
    return s.bag.pop();
  }
  function rulesOf(L) { return L.rules.join('').split(''); }
  function fresh(L) {
    var rules = rulesOf(L), s = { n: L.rules.length, rules: rules, board: rules.map(function () { return null; }), queue: [], rng: L.seed >>> 0, bag: [],
      lines: 0, target: L.target || 5, moves: 0, status: 'playing', last: null };
    for (var i = 0; i <= PREVIEW; i++) s.queue.push(draw(s));
    return s;
  }
  function current(s) { return s.queue[0]; }
  function legalNow(s) { return legal(s.rules, s.board, s.queue[0]); }
  /* tap cell i: false if the move is not allowed. After the move: lines counted, queue shifts, win / no_moves checked. */
  function move(s, i) {
    if (s.status !== 'playing' || s.board[i] || !fits(s.rules[i], s.queue[0])) return false;
    var p = s.queue.shift(), res = put(s.board, i, p);
    s.queue.push(draw(s)); s.lines += res.lines; s.moves++; s.last = { cell: i, piece: p, lines: res.lines, cleared: res.cleared, lineCells: res.lineCells };
    if (s.lines >= s.target) s.status = 'won';
    else if (!legalNow(s).length) s.status = 'failed';
    return true;
  }
  function won(s) { return s.status === 'won'; }
  function lost(s) { return s.status === 'failed'; }
  function clone(s) { return JSON.parse(JSON.stringify(s)); }
  return { TYPES: TYPES, PREVIEW: PREVIEW, fits: fits, legal: legal, put: put, fresh: fresh, current: current, legalNow: legalNow, move: move, won: won, lost: lost, clone: clone };
})());
