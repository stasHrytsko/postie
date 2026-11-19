/* Pair Up — pure rules, no DOM. Port of stazzi apps/casual/pairs/src/engine/pairsEngine.ts (SPEC.md §3–5).
   Cover the board with rectangles; each holds exactly one dark and one light dot (level 11: exactly two grey dots, nothing else).
   Rect = [r0, c0, r1, c1], r0 <= r1, c0 <= c1. Cell i = r * w + c. Dots: 0 none, 1 dark (stazzi "black"), 2 light ("white"), 3 grey. */
Postie.engine('pair-up', (function () {
  function fresh(L) {
    var dots = [];
    L.rows.forEach(function (row) { for (var i = 0; i < row.length; i++) { var ch = row[i]; dots.push(ch === 'B' ? 1 : ch === 'W' ? 2 : ch === 'G' ? 3 : 0); } });
    return { w: L.w, h: L.h, dots: dots, rects: [], moves: 0 };
  }
  function rectOf(ra, ca, rb, cb) { return [Math.min(ra, rb), Math.min(ca, cb), Math.max(ra, rb), Math.max(ca, cb)]; }
  function area(p) { return (p[2] - p[0] + 1) * (p[3] - p[1] + 1); }
  function same(a, b) { return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]; }
  function overlaps(a, b) { return a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3]; }
  function contains(p, r, c) { return r >= p[0] && r <= p[2] && c >= p[1] && c <= p[3]; }
  function countIn(s, p) {
    var n = { b: 0, w: 0, g: 0 };
    for (var r = p[0]; r <= p[2]; r++) for (var c = p[1]; c <= p[3]; c++) { var d = s.dots[r * s.w + c]; if (d === 1) n.b++; else if (d === 2) n.w++; else if (d === 3) n.g++; }
    return n;
  }
  /* valid: exactly one dark + one light, or exactly two grey and nothing else */
  function isValid(s, p) { var n = countIn(s, p); return (n.b === 1 && n.w === 1 && n.g === 0) || (n.g === 2 && n.b === 0 && n.w === 0); }
  function coveredAll(s) { return s.rects.reduce(function (a, p) { return a + area(p); }, 0) === s.w * s.h; }
  function won(s) { return coveredAll(s) && s.rects.every(function (p) { return isValid(s, p); }); }
  /* draw: area >= 2, inside the board; rectangles it overlaps are removed; an exact repeat changes nothing (returns false). +1 move. */
  function draw(s, p) {
    if (won(s) || area(p) < 2) return false;
    if (p[0] < 0 || p[1] < 0 || p[2] >= s.h || p[3] >= s.w) return false;
    if (s.rects.some(function (q) { return same(q, p); })) return false;
    s.rects = s.rects.filter(function (q) { return !overlaps(q, p); }); s.rects.push(p.slice()); s.moves++;
    return true;
  }
  /* remove the rectangle under cell (r, c): +1 move; nothing there -> false */
  function remove(s, r, c) {
    if (won(s)) return false;
    for (var i = 0; i < s.rects.length; i++) if (contains(s.rects[i], r, c)) { s.rects.splice(i, 1); s.moves++; return true; }
    return false;
  }
  return { fresh: fresh, rectOf: rectOf, area: area, overlaps: overlaps, contains: contains, isValid: isValid, coveredAll: coveredAll, draw: draw, remove: remove, won: won };
})());
