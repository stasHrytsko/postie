/* Parcels — pure rules, no DOM. Two rule sets on one "frame → vanish → fall" board (author 2026-11-03).
   numbers: faithful to stazzi apps/casual/parcels/src/engine/parcelsEngine.ts (SPEC §4–5). A frame is valid if every cell holds a cube,
            it holds exactly one number and its area equals that number.
   pairs:   former Cave In (games/parcels/IDEA-cave-in.md). A frame is valid if it holds exactly one black and one white dot and no stone;
            empty cells may be framed.
   Both: the framed cells vanish; in each column of the frame everything above drops by the frame's height (empties come in at the top);
   other columns never move. Won: numbers — no cubes left; pairs — no dots left (stones stay). Failed (dead end): not won and no valid frame.
   Board: s.g[r][c] = null (empty) or a cell {id, v}: v = 0 plain cube / 2..8 number (numbers), 'B' | 'W' | 'S' (pairs). */
Postie.engine('parcels', (function () {
  function fresh(L) {
    var g = [], id = 0, total = 0;
    for (var r = 0; r < L.h; r++) {
      var row = [];
      for (var c = 0; c < L.w; c++) {
        var ch = (L.rows[r] || '').charAt(c) || ' ', cell = null;
        if (L.rules === 'pairs') { if (ch === 'B' || ch === 'W' || ch === 'S') cell = { id: id, v: ch }; if (ch === 'B') total++; }
        else if (ch !== ' ' && ch !== '_') { cell = { id: id, v: ch === '.' ? 0 : parseInt(ch, 36) }; if (cell.v > 0) total++; }
        row.push(cell); id++;
      }
      g.push(row);
    }
    return { rules: L.rules, w: L.w, h: L.h, g: g, shipped: 0, total: total, status: 'playing' };
  }
  function rect(ra, ca, rb, cb) { return [Math.min(ra, rb), Math.min(ca, cb), Math.max(ra, rb), Math.max(ca, cb)]; }
  /* null = valid frame; else the first broken rule: numbers 'gap' | 'no_number' | 'many_numbers' | 'wrong_size'; pairs 'stone' | 'not_a_pair' */
  function check(s, r0, c0, r1, c1) {
    if (r0 < 0 || c0 < 0 || r1 >= s.h || c1 >= s.w || r0 > r1 || c0 > c1) return 'outside';
    var r, c, x;
    if (s.rules === 'pairs') {
      var b = 0, w = 0, st = 0;
      for (r = r0; r <= r1; r++) for (c = c0; c <= c1; c++) { x = s.g[r][c]; if (!x) continue; if (x.v === 'B') b++; else if (x.v === 'W') w++; else st++; }
      if (st) return 'stone';
      return b === 1 && w === 1 ? null : 'not_a_pair';
    }
    var n = 0, num = 0;
    for (c = c0; c <= c1; c++) for (r = r0; r <= r1; r++) { x = s.g[r][c]; if (!x) return 'gap'; if (x.v > 0) { n++; num = x.v; } }
    if (n === 0) return 'no_number';
    if (n > 1) return 'many_numbers';
    return (r1 - r0 + 1) * (c1 - c0 + 1) === num ? null : 'wrong_size';
  }
  function anyFrame(s) {
    for (var r0 = 0; r0 < s.h; r0++) for (var c0 = 0; c0 < s.w; c0++) for (var r1 = r0; r1 < s.h; r1++) for (var c1 = c0; c1 < s.w; c1++)
      if (check(s, r0, c0, r1, c1) === null) return true;
    return false;
  }
  function cleared(s) {
    for (var r = 0; r < s.h; r++) for (var c = 0; c < s.w; c++) { var x = s.g[r][c]; if (x && (s.rules !== 'pairs' || x.v !== 'S')) return false; }
    return true;
  }
  /* Ship a frame. Returns {removed: [cell], falls: [{id, col, from, to}]} or null if the frame is invalid (nothing changes). */
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
  return { fresh: fresh, rect: rect, check: check, anyFrame: anyFrame, frame: frame, won: won };
})());
