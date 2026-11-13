/* Carpet Layers — pure rules, no DOM. Port of stazzi apps/casual/carpet-layers/src/engine/carpetEngine.ts.
   Strips are dropped from the tray onto the board; each new strip lies on top (higher z). Tap on the board takes back the top strip
   in that cell (pinned strips stay). Glass strips (clear) mix with their partner below: blue over butter or butter over blue shows sage.
   Win: every strip is on the board and the visible board equals the pattern (empty = empty). Moves: every drop or take-back costs 1. */
Postie.engine('carpet-layers', (function () {
  var PARTNER = { 2: 4, 4: 2 }, MIX = 3; /* colour slots: 2 blue + 4 butter -> 3 sage (stazzi: blue + yellow -> green) */
  function cells(st, r, c) { var out = []; for (var i = 0; i < st.c.length; i++) out.push(st.d === 'h' ? [r, c + i] : [r + i, c]); return out; }
  function fits(L, st, r, c) { var n = st.c.length; return r >= 0 && c >= 0 && (st.d === 'h' ? r < L.size && c + n <= L.size : c < L.size && r + n <= L.size); }
  function fresh(L) {
    var placed = (L.start || []).map(function (p, i) { return { id: p[0], r: p[1], c: p[2], z: i + 1, pinned: !!p[3] }; });
    return { placed: placed, nextZ: placed.length + 1, moves: 0, status: 'playing' };
  }
  function pattern(L) { var out = []; L.pattern.forEach(function (row) { row.split('').forEach(function (ch) { out.push(ch === '.' ? 0 : +ch); }); }); return out; }
  function visible(L, s) {
    var g = []; for (var i = 0; i < L.size * L.size; i++) g.push(0);
    s.placed.slice().sort(function (a, b) { return a.z - b.z; }).forEach(function (p) {
      var st = L.strips[p.id];
      cells(st, p.r, p.c).forEach(function (rc, i) {
        var idx = rc[0] * L.size + rc[1], top = +st.c[i];
        g[idx] = st.clear && g[idx] && PARTNER[top] === g[idx] ? MIX : top;
      });
    });
    return g;
  }
  /* layers: placed strips bottom to top, each with the colour it shows in every cell (glass shows the mix where it mixes) — for drawing. */
  function layers(L, s) {
    var g = []; for (var i = 0; i < L.size * L.size; i++) g.push(0);
    return s.placed.slice().sort(function (a, b) { return a.z - b.z; }).map(function (p) {
      var st = L.strips[p.id];
      return { p: p, shown: cells(st, p.r, p.c).map(function (rc, i) {
        var idx = rc[0] * L.size + rc[1], top = +st.c[i];
        g[idx] = st.clear && g[idx] && PARTNER[top] === g[idx] ? MIX : top; return g[idx];
      }) };
    });
  }
  function allPlaced(L, s) { return s.placed.length === L.strips.length; }
  function matches(L, s) { var v = visible(L, s), w = pattern(L); for (var i = 0; i < v.length; i++) if (v[i] !== w[i]) return false; return true; }
  function settle(L, s) { s.status = allPlaced(L, s) && matches(L, s) ? 'won' : 'playing'; }
  function isPlaced(s, id) { return s.placed.some(function (p) { return p.id === id; }); }
  /* drop(L, s, stripIndex, row, col): top-left cell of the strip. false = not allowed (no move spent). */
  function drop(L, s, id, r, c) {
    var st = L.strips[id];
    if (s.status !== 'playing' || !st || isPlaced(s, id) || !fits(L, st, r, c)) return false;
    s.placed.push({ id: id, r: r, c: c, z: s.nextZ++, pinned: false }); s.moves++; settle(L, s); return true;
  }
  function topAt(L, s, r, c) {
    var best = null;
    s.placed.forEach(function (p) {
      if (cells(L.strips[p.id], p.r, p.c).some(function (rc) { return rc[0] === r && rc[1] === c; }) && (!best || p.z > best.z)) best = p;
    });
    return best;
  }
  /* removeAt: tap on a board cell takes back the top strip there. Returns the strip index or -1. */
  function removeAt(L, s, r, c) {
    if (s.status !== 'playing') return -1;
    var t = topAt(L, s, r, c); if (!t || t.pinned) return -1;
    s.placed = s.placed.filter(function (p) { return p !== t; }); s.moves++; settle(L, s); return t.id;
  }
  /* removeById: take back a given strip by tapping a cell where it is on top (as the stazzi sample solution does). */
  function removeById(L, s, id) {
    var p = s.placed.filter(function (x) { return x.id === id; })[0]; if (!p) return false;
    var cs = cells(L.strips[id], p.r, p.c);
    for (var i = 0; i < cs.length; i++) { var t = topAt(L, s, cs[i][0], cs[i][1]); if (t && t.id === id) return removeAt(L, s, cs[i][0], cs[i][1]) === id; }
    return false;
  }
  /* shiftedMatch: the picture is right but sits in the wrong place (stazzi fail reason wrong_place). */
  function shiftedMatch(L, s) {
    var v = visible(L, s), w = pattern(L), n = L.size;
    for (var dr = 1 - n; dr < n; dr++) for (var dc = 1 - n; dc < n; dc++) {
      if (!dr && !dc) continue;
      var m = [], inside = true, i; for (i = 0; i < n * n; i++) m.push(0);
      for (i = 0; i < n * n && inside; i++) { if (!v[i]) continue; var r = Math.floor(i / n) + dr, c = i % n + dc; if (r < 0 || c < 0 || r >= n || c >= n) inside = false; else m[r * n + c] = v[i]; }
      if (inside && m.every(function (x, j) { return x === w[j]; })) return { dr: dr, dc: dc };
    }
    return null;
  }
  function stuck(L, s) { return allPlaced(L, s) && !matches(L, s); }
  function won(s) { return s.status === 'won'; }
  return { fresh: fresh, cells: cells, layers: layers, fits: fits, pattern: pattern, visible: visible, drop: drop, topAt: topAt, removeAt: removeAt, removeById: removeById,
    isPlaced: isPlaced, allPlaced: allPlaced, matches: matches, stuck: stuck, shiftedMatch: shiftedMatch, won: won };
})());
