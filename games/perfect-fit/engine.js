/* Perfect Fit — pure rules, no DOM. Port of stazzi apps/casual/perfect-fit/src/engine/packEngine.ts (game part; the
   level-generator search is in stazzi only). Pick a number N, draw a connected piece of N squares in the 4×4 builder
   (only on the mask's cells if the level has a shaped builder), place it on empty board cells without rotating or flipping.
   Constraints on a placed piece: clue cells need a piece of exactly that size; a pair of dots is covered by one piece or by
   none; the two cells of a seam belong to different pieces. Win: all numbers used (the board is then full).
   Lose (no_moves): after a placement no remaining number fits anywhere — the game never predicts it earlier.
   Points are [row, col]. */
Postie.engine('perfect-fit', (function () {
  var B = 4, STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function key(p) { return p[0] + ',' + p[1]; }
  function parseMap(map) { return map.map(function (row) { return row.split('').map(function (ch) { return ch === '.' ? 0 : -1; }); }); }
  function rules(L) { return { mask: L.mask, clues: L.clues || [], pairs: L.pairs || [], seams: L.seams || [] }; }
  function fresh(L) {
    return { L: L, board: parseMap(L.map), nums: L.nums.slice(), used: L.nums.map(function () { return false; }), placed: [], status: 'playing' };
  }
  function isConnected(cells) {
    if (!cells.length) return false;
    var set = {}; cells.forEach(function (p) { set[key(p)] = 1; });
    var seen = {}, st = [cells[0]], n = 1; seen[key(cells[0])] = 1;
    while (st.length) { var p = st.pop(); STEPS.forEach(function (d) { var q = [p[0] + d[0], p[1] + d[1]], k = key(q); if (set[k] && !seen[k]) { seen[k] = 1; n++; st.push(q); } }); }
    return n === Object.keys(set).length;
  }
  /* shift to the top-left corner, sorted in reading order */
  function normalize(cells) {
    var r0 = Math.min.apply(null, cells.map(function (p) { return p[0]; })), c0 = Math.min.apply(null, cells.map(function (p) { return p[1]; }));
    return cells.map(function (p) { return [p[0] - r0, p[1] - c0]; }).sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
  }
  /* does the shape fit the builder (4×4, inside the mask cells at some offset)? */
  function fitsBuilder(cells, mask) {
    if (!cells.length) return true;
    var n = normalize(cells);
    if (!n.every(function (p) { return p[0] < B && p[1] < B; })) return false;
    if (!mask) return true;
    for (var dr = 0; dr < B; dr++) for (var dc = 0; dc < B; dc++)
      if (n.every(function (p) { return mask[p[0] + dr] && mask[p[0] + dr][p[1] + dc] === '.'; })) return true;
    return false;
  }
  function isPieceReady(cells, size) {
    var u = {}; cells.forEach(function (p) { u[key(p)] = 1; });
    return cells.length === size && Object.keys(u).length === size && isConnected(cells);
  }
  /* why a piece of these board cells can't go there: '' if it can (same checks and order as stazzi's assessDrop) */
  function problem(s, cells) {
    var b = s.board, R = rules(s.L), on = {}; cells.forEach(function (p) { on[key(p)] = 1; });
    var has = function (r, c) { return !!on[r + ',' + c]; };
    if (cells.some(function (p) { return !b[p[0]] || b[p[0]][p[1]] === undefined; })) return 'edge';
    if (cells.some(function (p) { return b[p[0]][p[1]] === -1; })) return 'edge';
    if (cells.some(function (p) { return b[p[0]][p[1]] !== 0; })) return 'taken';
    if (R.clues.some(function (q) { return has(q[0], q[1]) && q[2] !== cells.length; })) return 'clue';
    if (R.pairs.some(function (q) { return has(q[0], q[1]) !== has(q[2], q[3]); })) return 'pair';
    if (R.seams.some(function (q) { return has(q[0], q[1]) && has(q[2], q[3]); })) return 'seam';
    return '';
  }
  function canPlace(s, cells) { return problem(s, cells) === ''; }
  /* place number #index as these board cells. Returns false (nothing changes) if not allowed. */
  function place(s, index, cells) {
    var size = s.nums[index];
    if (s.status !== 'playing' || size === undefined || s.used[index]) return false;
    if (!isPieceReady(cells, size) || !fitsBuilder(cells, s.L.mask) || problem(s, cells) !== '') return false;
    cells.forEach(function (p) { s.board[p[0]][p[1]] = size; });
    s.used[index] = true; s.placed.push({ index: index, cells: cells.map(function (p) { return [p[0], p[1]]; }) });
    var left = s.nums.filter(function (_, i) { return !s.used[i]; });
    s.status = !left.length ? 'won' : hasMove(s, left) ? 'playing' : 'failed';
    return true;
  }
  /* first unused number of this size, or -1 */
  function indexFor(s, size) { for (var i = 0; i < s.nums.length; i++) if (!s.used[i] && s.nums[i] === size) return i; return -1; }

  /* --- "is there any move at all" (not a prediction: just whether some number still fits somewhere) --- */
  function piecesAt(s, free, h, w, root, k, R, stopAtOne) {
    var out = [], excluded = new Uint8Array(free.length);
    function nb(i) { var r = Math.floor(i / w), c = i % w, o = []; if (r > 0) o.push(i - w); if (r < h - 1) o.push(i + w); if (c > 0) o.push(i - 1); if (c < w - 1) o.push(i + 1); return o; }
    function inBox(cur) {
      var rs = cur.map(function (i) { return Math.floor(i / w); }), cs = cur.map(function (i) { return i % w; });
      return Math.max.apply(null, rs) - Math.min.apply(null, rs) < B && Math.max.apply(null, cs) - Math.min.apply(null, cs) < B;
    }
    function grow(cur, untried) {
      if (stopAtOne && out.length) return;
      if (R.clues.some(function (q) { return q[2] !== k && cur.indexOf(q[0] * w + q[1]) >= 0; })) return;
      if (cur.length === k) {
        var cells = cur.map(function (i) { return [Math.floor(i / w), i % w]; });
        if (inBox(cur) && fitsBuilder(cells, R.mask) && rulesOk(cells, R)) out.push(cur.slice());
        return;
      }
      if (!inBox(cur)) return;
      var pool = untried.slice();
      while (pool.length) {
        var x = pool.pop(), fr = nb(x).filter(function (y) { return y > root && free[y] === 1 && excluded[y] !== 1; });
        fr.forEach(function (y) { excluded[y] = 1; });
        cur.push(x); grow(cur, pool.concat(fr)); cur.pop();
        fr.forEach(function (y) { excluded[y] = 0; });
      }
    }
    excluded[root] = 1;
    var start = nb(root).filter(function (y) { return y > root && free[y] === 1; });
    start.forEach(function (y) { excluded[y] = 1; });
    grow([root], start);
    return out;
  }
  function rulesOk(cells, R) {
    var on = {}; cells.forEach(function (p) { on[key(p)] = 1; });
    var has = function (r, c) { return !!on[r + ',' + c]; };
    return R.pairs.every(function (q) { return has(q[0], q[1]) === has(q[2], q[3]); }) && R.seams.every(function (q) { return !(has(q[0], q[1]) && has(q[2], q[3])); });
  }
  function hasMove(s, sizes) {
    var h = s.board.length, w = s.board[0].length, free = new Uint8Array(h * w), R = rules(s.L), seen = {};
    s.board.forEach(function (row, r) { row.forEach(function (v, c) { free[r * w + c] = v === 0 ? 1 : 0; }); });
    for (var t = 0; t < sizes.length; t++) {
      var k = sizes[t]; if (seen[k]) continue; seen[k] = 1;
      for (var root = 0; root < free.length; root++) if (free[root] === 1 && piecesAt(s, free, h, w, root, k, R, true).length) return true;
    }
    return false;
  }
  function won(s) { return s.status === 'won'; }
  function lost(s) { return s.status === 'failed'; }
  function clone(s) { var L = s.L; s.L = null; var c = JSON.parse(JSON.stringify(s)); s.L = L; c.L = L; return c; }
  return { BUILDER: B, fresh: fresh, isConnected: isConnected, normalize: normalize, fitsBuilder: fitsBuilder, isPieceReady: isPieceReady,
    problem: problem, canPlace: canPlace, place: place, indexFor: indexFor, hasMove: hasMove, won: won, lost: lost, clone: clone };
})());
