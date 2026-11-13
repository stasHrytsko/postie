/* Arrow Flip — pure rules, no DOM. Port of stazzi apps/casual/arrow-flip/src/engine/flipEngine.ts (planMove).
   A tapped block slides cell by cell where its arrow points until the edge (it leaves the board), a block or a stone (it stops).
   Entering a spinner cell turns it 90° clockwise and it keeps going; a spinner loop (same cell + same direction twice) stops it.
   Every other block sharing an edge with any cell of the path (start and end included, the one it bumped into too) turns 90°
   clockwise exactly once — except blocks standing on an anchor. The mover itself turns only on spinners.
   A tap is legal if the block moved at least one cell or left the board. Win: no blocks left. Stuck: blocks left, no legal tap. */
Postie.engine('arrow-flip', (function () {
  var DELTA = { '^': [-1, 0], '>': [0, 1], 'v': [1, 0], '<': [0, -1] };
  var ROTATE = { '^': '>', '>': 'v', 'v': '<', '<': '^' };
  function key(r, c) { return r + ',' + c; }
  function set(cells) { var o = {}; (cells || []).forEach(function (p) { o[key(p[0], p[1])] = 1; }); return o; }

  /* level: { rows: ['.>..', ...], spin: [[r,c]], anchor: [[r,c]] } — '#' stone, '^ > v <' block, '.' empty */
  function fresh(L) {
    var size = L.rows.length, blocks = [], stones = [];
    L.rows.forEach(function (row, r) {
      row.split('').forEach(function (ch, c) {
        if (ch === '#') stones.push([r, c]);
        else if (DELTA[ch]) blocks.push({ id: blocks.length, r: r, c: c, d: ch });
      });
    });
    return { size: size, blocks: blocks, stones: stones, spinners: (L.spin || []).slice(), anchors: (L.anchor || []).slice(), moves: 0 };
  }
  function clone(s) {
    return { size: s.size, blocks: s.blocks.map(function (b) { return { id: b.id, r: b.r, c: b.c, d: b.d }; }), stones: s.stones, spinners: s.spinners, anchors: s.anchors, moves: s.moves };
  }
  function blockAt(s, r, c) { for (var i = 0; i < s.blocks.length; i++) if (s.blocks[i].r === r && s.blocks[i].c === c) return s.blocks[i]; return null; }
  function byId(s, id) { for (var i = 0; i < s.blocks.length; i++) if (s.blocks[i].id === id) return s.blocks[i]; return null; }
  function inside(s, r, c) { return r >= 0 && c >= 0 && r < s.size && c < s.size; }

  /* plan(s, id) -> null if the tap is illegal, else { id, from, to (null = left the board), exited, path, turns, touched: [{id, at, front}], endDir } */
  function plan(s, id) {
    var m = byId(s, id); if (!m) return null;
    var occ = {}; s.blocks.forEach(function (b) { occ[key(b.r, b.c)] = b.id; });
    var stones = set(s.stones), spin = set(s.spinners), anch = set(s.anchors);
    var d = m.d, r = m.r, c = m.c, steps = 0, exited = false, path = [[r, c]], turns = [], visited = {};
    visited[key(r, c) + d] = 1;
    for (;;) {
      var nr = r + DELTA[d][0], nc = c + DELTA[d][1];
      if (!inside(s, nr, nc)) { exited = true; break; }
      var k = key(nr, nc), hit = occ[k];
      if ((hit !== undefined && hit !== id) || stones[k]) break;
      r = nr; c = nc; steps++; path.push([r, c]);
      if (spin[k]) { d = ROTATE[d]; turns.push(path.length - 1); }
      if (visited[k + d]) break;
      visited[k + d] = 1;
    }
    if (!exited && steps === 0) return null;
    var er = DELTA[d][0], ec = DELTA[d][1], touched = [], seen = {};
    path.forEach(function (p, at) {
      [[p[0] - 1, p[1]], [p[0] + 1, p[1]], [p[0], p[1] - 1], [p[0], p[1] + 1]].forEach(function (q) {
        var hit = occ[key(q[0], q[1])];
        if (hit === undefined || hit === id || seen[hit] || anch[key(q[0], q[1])]) return;
        seen[hit] = 1;
        touched.push({ id: hit, at: at, front: !exited && at === path.length - 1 && q[0] === r + er && q[1] === c + ec });
      });
    });
    return { id: id, from: [m.r, m.c], to: exited ? null : [r, c], exited: exited, path: path, turns: turns, touched: touched, endDir: d };
  }
  /* tap(s, id) applies the move in place; returns the plan or null (illegal tap: nothing changes, no move spent) */
  function tap(s, id) {
    var p = plan(s, id); if (!p) return null;
    var hit = {}; p.touched.forEach(function (t) { hit[t.id] = 1; });
    s.blocks.forEach(function (b) { if (hit[b.id]) b.d = ROTATE[b.d]; });
    if (p.exited) s.blocks = s.blocks.filter(function (b) { return b.id !== id; });
    else { var m = byId(s, id); m.r = p.to[0]; m.c = p.to[1]; m.d = p.endDir; }
    s.moves++;
    return p;
  }
  /* tapAt(s, r, c) — tap the block standing on (r, c) */
  function tapAt(s, r, c) { var b = blockAt(s, r, c); return b ? tap(s, b.id) : null; }
  function hasMove(s) { return s.blocks.some(function (b) { return plan(s, b.id) !== null; }); }
  function won(s) { return s.blocks.length === 0; }
  function stuck(s) { return !won(s) && !hasMove(s); }
  function anchored(s, r, c) { return s.anchors.some(function (a) { return a[0] === r && a[1] === c; }); }
  return { fresh: fresh, clone: clone, plan: plan, tap: tap, tapAt: tapAt, blockAt: blockAt, hasMove: hasMove, won: won, stuck: stuck, anchored: anchored, ROTATE: ROTATE };
})());
