/* Parcels — pure rules, no DOM (author 2026-11-19: Parcels and Pair Up are one game; base — Parcels).
   The board is a stack of cubes pressed to the bottom. A cube is plain, carries a number, or carries a black or a white dot.
   A frame is valid if every cell in it holds a cube and it is ONE of:
     a number parcel — exactly one number, no dots, area = the number (faithful to stazzi apps/casual/parcels SPEC §4–5);
     a pair parcel   — exactly one black and one white dot, no number, any size (the Pair Up rule, stazzi apps/casual/pairs).
   The framed cubes vanish; in each column of the frame everything above drops by the frame's height (empties come in at the top);
   other columns never move. Won: no cubes left. Failed (dead end): cubes left and no valid frame.
   Board: s.g[r][c] = null (empty) or a cube {id, v}: v = 0 plain / 2..9 number / 'B' black dot / 'W' white dot. */
Postie.engine('parcels', (function () {
  function cube(ch) {
    if (ch === 'B' || ch === 'W') return ch;
    if (ch === '.') return 0;
    var n = parseInt(ch, 10); return n >= 2 ? n : null;                   // ' ' or '_' — empty
  }
  function fresh(L) {
    var g = [], id = 0, total = 0;
    for (var r = 0; r < L.h; r++) {
      var row = [];
      for (var c = 0; c < L.w; c++) {
        var v = cube((L.rows[r] || '').charAt(c) || ' '), cell = v === null ? null : { id: id, v: v };
        if (v !== null && v !== 0 && v !== 'W') total++;                   // one parcel per number and per black dot (= per pair)
        row.push(cell); id++;
      }
      g.push(row);
    }
    return { w: L.w, h: L.h, g: g, shipped: 0, total: total, status: 'playing' };
  }
  function rect(ra, ca, rb, cb) { return [Math.min(ra, rb), Math.min(ca, cb), Math.max(ra, rb), Math.max(ca, cb)]; }
  /* null = valid frame; else the first broken rule: 'outside' | 'gap' | 'mixed' | 'empty' | 'many_numbers' | 'wrong_size' | 'not_a_pair' */
  function check(s, r0, c0, r1, c1) {
    if (r0 < 0 || c0 < 0 || r1 >= s.h || c1 >= s.w || r0 > r1 || c0 > c1) return 'outside';
    var n = 0, num = 0, b = 0, w = 0, x;
    for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
      x = s.g[r][c]; if (!x) return 'gap';
      if (x.v === 'B') b++; else if (x.v === 'W') w++; else if (x.v > 0) { n++; num = x.v; }
    }
    if (n && (b || w)) return 'mixed';
    if (n > 1) return 'many_numbers';
    if (n === 1) return (r1 - r0 + 1) * (c1 - c0 + 1) === num ? null : 'wrong_size';
    if (!b && !w) return 'empty';
    return b === 1 && w === 1 ? null : 'not_a_pair';
  }
  function frames(s) {                                                   // every valid frame on the board now
    var out = [];
    for (var r0 = 0; r0 < s.h; r0++) for (var c0 = 0; c0 < s.w; c0++) for (var r1 = r0; r1 < s.h; r1++) for (var c1 = c0; c1 < s.w; c1++)
      if (check(s, r0, c0, r1, c1) === null) out.push([r0, c0, r1, c1]);
    return out;
  }
  function anyFrame(s) {
    for (var r0 = 0; r0 < s.h; r0++) for (var c0 = 0; c0 < s.w; c0++) for (var r1 = r0; r1 < s.h; r1++) for (var c1 = c0; c1 < s.w; c1++)
      if (check(s, r0, c0, r1, c1) === null) return true;
    return false;
  }
  function cleared(s) { for (var r = 0; r < s.h; r++) for (var c = 0; c < s.w; c++) if (s.g[r][c]) return false; return true; }
  /* Ship a frame. Returns {removed: [cube], falls: [{id, col, from, to}]} or null if the frame is invalid (nothing changes). */
  function frame(s, r0, c0, r1, c1) {
    if (s.status !== 'playing' || check(s, r0, c0, r1, c1) !== null) return null;
    var hgt = r1 - r0 + 1, removed = [], falls = [];
    for (var c = c0; c <= c1; c++) {
      var col = [];
      for (var r = 0; r < s.h; r++) col.push(s.g[r][c]);
      for (r = r0; r <= r1; r++) if (col[r]) removed.push(col[r]);
      for (r = 0; r < r0; r++) if (col[r]) falls.push({ id: col[r].id, col: c, from: r, to: r + hgt });
      var nc = col.slice(0, r0), rest = col.slice(r1 + 1);
      for (var k = 0; k < hgt; k++) nc.unshift(null);
      nc = nc.concat(rest);
      for (r = 0; r < s.h; r++) s.g[r][c] = nc[r];
    }
    s.shipped++;
    s.status = cleared(s) ? 'won' : anyFrame(s) ? 'playing' : 'failed';
    return { removed: removed, falls: falls };
  }
  function won(s) { return s.status === 'won'; }
  return { fresh: fresh, rect: rect, check: check, frames: frames, anyFrame: anyFrame, frame: frame, won: won };
})());
