/* Nest — pure rules, no DOM. Port of stazzi apps/casual/nested-tangram/src/engine/{geom,pieces,state}.ts (version 3, SPEC.md §2).
   Geometry: every board cell is cut by its two diagonals into 4 quarters (k: 0 top, 1 right, 2 bottom, 3 left); a shape is a list
   of quarters [r, c, k]. Pieces are classic tangram pieces (no mirroring), turned by 90°, moved by whole cells.
   A level is a tree: a "comp" (part) has its own board (rows × cols) with an outline (frame) and children; a "leaf" is a tangram
   piece. Comp (r, c) = shift of its board on the parent's board; leaf (r, c) = corner of its bounding box.
   State: { root, path } — path = child indices from the root to the board the player is inside ([] = the picture's board).
   Moves act on the current board's children by index: open, enter, exit, rotate, move. Nothing ever moves on its own. */
Postie.engine('nest', (function () {
  /* ---- geometry ---- */
  function sortQ(a, b) { return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]; }
  function normalize(qs) {
    var r0 = Infinity, c0 = Infinity;
    qs.forEach(function (q) { r0 = Math.min(r0, q[0]); c0 = Math.min(c0, q[1]); });
    return qs.map(function (q) { return [q[0] - r0, q[1] - c0, q[2]]; }).sort(sortQ);
  }
  function rot90(qs) { return normalize(qs.map(function (q) { return [q[1], -q[0] - 1, (q[2] + 1) % 4]; })); }
  function orient(qs, k) { var out = normalize(qs); for (var i = 0; i < ((k % 4) + 4) % 4; i++) out = rot90(out); return out; }
  function qk(q) { return q[0] + ',' + q[1] + ',' + q[2]; }
  function key(qs) { return qs.map(qk).sort().join(';'); }
  function bbox(qs) { var h = 0, w = 0; qs.forEach(function (q) { h = Math.max(h, q[0] + 1); w = Math.max(w, q[1] + 1); }); return { h: h, w: w }; }
  function shift(qs, dr, dc) { return qs.map(function (q) { return [q[0] + dr, q[1] + dc, q[2]]; }); }
  function neighbors(q) {
    var r = q[0], c = q[1], k = q[2];
    var across = k === 0 ? [r - 1, c, 2] : k === 1 ? [r, c + 1, 3] : k === 2 ? [r + 1, c, 0] : [r, c - 1, 1];
    return [[r, c, (k + 1) % 4], [r, c, (k + 3) % 4], across];
  }
  function connected(qs) {
    if (!qs.length) return false;
    var set = {}, seen = {}, stack = [qs[0]], n = 1;
    qs.forEach(function (q) { set[qk(q)] = 1; }); seen[qk(qs[0])] = 1;
    while (stack.length) neighbors(stack.pop()).forEach(function (m) { var k = qk(m); if (set[k] && !seen[k]) { seen[k] = 1; n++; stack.push(m); } });
    return n === Object.keys(set).length;
  }
  /* three corners of a quarter in board coordinates (x = column, y = row) */
  function corners(q) {
    var r = q[0], c = q[1], k = q[2], tl = [c, r], tr = [c + 1, r], br = [c + 1, r + 1], bl = [c, r + 1], mid = [c + 0.5, r + 0.5];
    return k === 0 ? [tl, tr, mid] : k === 1 ? [tr, br, mid] : k === 2 ? [br, bl, mid] : [bl, tl, mid];
  }
  /* outer edges of a set of quarters (no inner seams): list of [[x1,y1],[x2,y2]] */
  function edges(qs) {
    var count = {};
    qs.forEach(function (q) {
      var v = corners(q);
      for (var i = 0; i < 3; i++) { var a = v[i], b = v[(i + 1) % 3], id = [a.join(','), b.join(',')].sort().join('|'); count[id] = count[id] ? null : [a, b]; }
    });
    return Object.keys(count).map(function (k) { return count[k]; }).filter(Boolean);
  }

  /* ---- tangram pieces (quarters, normal position; = stazzi pieces.ts fromPolygon); areas in quarters: S 2, M 4, Sq 4, P 4, L 8 ---- */
  var SHAPES = {
    S: [[0, 0, 0], [0, 0, 3]],
    M: [[0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 3]],
    L: [[0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 1, 0], [0, 1, 3], [1, 0, 0], [1, 0, 3]],
    Sq: [[0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 0, 3]],
    P: [[0, 0, 0], [0, 0, 1], [0, 1, 2], [0, 1, 3]]
  };
  var NAMES = { S: 'small triangle', M: 'medium triangle', L: 'large triangle', Sq: 'square', P: 'parallelogram' };

  /* ---- level data -> tree (format in levels.js) ---- */
  function parseFrame(f) {
    var out = [];
    f.split(' ').forEach(function (t) { var p = t.split(':'), rc = p[0].split(','); p[1].split('').forEach(function (k) { out.push([+rc[0], +rc[1], +k]); }); });
    return out.sort(sortQ);
  }
  function build(d) {
    if (Array.isArray(d)) return { kind: 'leaf', type: d[0], rot: d[1], r: d[2], c: d[3] };
    return { kind: 'comp', name: d.n, rows: d.h, cols: d.w, frame: parseFrame(d.f), r: d.r, c: d.c, opened: false, children: d.k.map(build) };
  }
  function fresh(L) { return { root: build(L.root), path: [], moves: 0 }; }

  /* ---- board rules ---- */
  function cellsAt(n, r, c) { return n.kind === 'leaf' ? shift(orient(SHAPES[n.type], n.rot), r, c) : shift(boardCells(n), r, c); }
  function cellsOf(n) { return cellsAt(n, n.r, n.c); }
  function boardCells(x) { var out = []; x.children.forEach(function (ch) { out = out.concat(cellsOf(ch)); }); return out; }
  function inBounds(cells, x) { return cells.every(function (q) { return q[0] >= 0 && q[0] < x.rows && q[1] >= 0 && q[1] < x.cols; }); }
  function takenBy(x, but) { var t = {}; x.children.forEach(function (o) { if (o !== but) cellsOf(o).forEach(function (q) { t[qk(q)] = 1; }); }); return t; }
  function fitsAt(n, x, r, c) { var cells = cellsAt(n, r, c), t = takenBy(x, n); return inBounds(cells, x) && cells.every(function (q) { return !t[qk(q)]; }); }
  /* nearest free spot to a fractional position, not further than radius cells */
  function nearestSpot(n, x, fr, fc, radius) {
    radius = radius === undefined ? 3 : radius;
    var cands = [];
    for (var r = Math.round(fr) - radius; r <= Math.round(fr) + radius; r++) for (var c = Math.round(fc) - radius; c <= Math.round(fc) + radius; c++) cands.push({ r: r, c: c, d: Math.hypot(r - fr, c - fc) });
    cands.sort(function (a, b) { return a.d - b.d; });
    for (var i = 0; i < cands.length; i++) if (fitsAt(n, x, cands[i].r, cands[i].c)) return { r: cands[i].r, c: cands[i].c };
    return null;
  }
  /* turn a leaf by 90° around its centre; if it doesn't fit, try shifts up to 2 cells; else unchanged, false */
  function turn(p, x) {
    var before = bbox(orient(SHAPES[p.type], p.rot)), old = { rot: p.rot, r: p.r, c: p.c };
    p.rot = (p.rot + 1) % 4;
    var after = bbox(orient(SHAPES[p.type], p.rot));
    var baseR = old.r + Math.floor((before.h - after.h) / 2), baseC = old.c + Math.floor((before.w - after.w) / 2);
    var offs = [[0, 0]];
    for (var d = 1; d <= 2; d++) for (var dr = -d; dr <= d; dr++) for (var dc = -d; dc <= d; dc++) if (Math.max(Math.abs(dr), Math.abs(dc)) === d) offs.push([dr, dc]);
    for (var i = 0; i < offs.length; i++) if (fitsAt(p, x, baseR + offs[i][0], baseC + offs[i][1])) { p.r = baseR + offs[i][0]; p.c = baseC + offs[i][1]; return true; }
    p.rot = old.rot; return false;
  }
  /* after zooming out a part may overlap a neighbour or leave the board: it moves to the nearest free spot, outside the outline if possible */
  function settle(n, x) {
    if (fitsAt(n, x, n.r, n.c)) return;
    var frame = {}; x.frame.forEach(function (q) { frame[qk(q)] = 1; });
    var radius = Math.max(x.rows, x.cols) * 2;
    var outside = nearestWhere(n, x, function (r, c) { return cellsAt(n, r, c).every(function (q) { return !frame[qk(q)]; }); }, radius);
    var sp = outside || nearestSpot(n, x, n.r, n.c, radius);
    if (sp) { n.r = sp.r; n.c = sp.c; }
  }
  function nearestWhere(n, x, ok, radius) {
    var best = null;
    for (var r = n.r - radius; r <= n.r + radius; r++) for (var c = n.c - radius; c <= n.c + radius; c++) {
      var d = Math.hypot(r - n.r, c - n.c);
      if ((!best || d < best.d) && fitsAt(n, x, r, c) && ok(r, c)) best = { r: r, c: c, d: d };
    }
    return best;
  }
  function whole(x) { return connected(boardCells(x)); }
  function allWhole(x) { return whole(x) && x.children.every(function (ch) { return ch.kind === 'leaf' || allWhole(ch); }); }
  function fitsFrame(x) {
    var frame = {}; x.frame.forEach(function (q) { frame[qk(q)] = 1; });
    var cells = boardCells(x).map(qk), uniq = {}; cells.forEach(function (k) { uniq[k] = 1; });
    return cells.length === x.frame.length && Object.keys(uniq).length === x.frame.length && cells.every(function (k) { return frame[k]; });
  }
  /* a part is done when its pieces fill its outline exactly, on every layer below too */
  function done(x) { return fitsFrame(x) && x.children.every(function (ch) { return ch.kind === 'leaf' || done(ch); }); }
  function depth(x) { var d = 0; x.children.forEach(function (ch) { if (ch.kind === 'comp') d = Math.max(d, depth(ch)); }); return 1 + d; }

  /* ---- state & moves ---- */
  function cur(s) { var x = s.root; s.path.forEach(function (i) { x = x.children[i]; }); return x; }
  function parent(s) { var x = s.root; s.path.slice(0, -1).forEach(function (i) { x = x.children[i]; }); return x; }
  /* tap on the picture's silhouette: zoom in, its parts become visible where they are */
  function open(s) { if (s.path.length || s.root.opened) return false; s.root.opened = true; return true; }
  function enter(s, i) { var x = cur(s), n = x.children[i]; if (!x.opened || !n || n.kind !== 'comp') return false; n.opened = true; s.path.push(i); return true; }
  function canExit(s) { return s.path.length > 0 && whole(cur(s)); }
  function exit(s) { if (!canExit(s)) return false; var n = cur(s); s.path.pop(); settle(n, cur(s)); return true; }
  function rotate(s, i) { var x = cur(s), n = x.children[i]; if (!x.opened || !n || n.kind !== 'leaf') return false; if (!turn(n, x)) return false; s.moves++; return true; }
  function move(s, i, r, c) {
    var x = cur(s), n = x.children[i]; if (!x.opened || !n || (n.r === r && n.c === c) || !fitsAt(n, x, r, c)) return false;
    n.r = r; n.c = c; s.moves++; return true;
  }
  /* win: the picture is open, its parts fill its outline exactly, every part on every layer is in one piece */
  function won(s) { var R = s.root; return R.opened && fitsFrame(R) && R.children.every(function (ch) { return ch.kind === 'leaf' || allWhole(ch); }); }

  return {
    SHAPES: SHAPES, NAMES: NAMES, orient: orient, key: key, qk: qk, corners: corners, edges: edges, connected: connected,
    fresh: fresh, build: build, cellsAt: cellsAt, cellsOf: cellsOf, boardCells: boardCells, fitsAt: fitsAt, nearestSpot: nearestSpot,
    whole: whole, fitsFrame: fitsFrame, done: done, depth: depth, cur: cur, parent: parent,
    open: open, enter: enter, canExit: canExit, exit: exit, rotate: rotate, move: move, won: won
  };
})());
