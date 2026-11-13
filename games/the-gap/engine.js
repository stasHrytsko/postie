/* The Gap — pure rules, no DOM. Port of stazzi apps/casual/the-gap/src/engine/gapEngine.ts (= solver `moves`).
   Swipe a square: it slides cell by cell while the next cell is inside, free and not a wall. On its last cell, if there is an exit
   pointing the same way and that exit's flask has room, it drops into the flask (on top). Otherwise it stays there.
   Legal if it moved at least one cell or dropped in. Tap flask n: its top square comes out onto exit n's cell, if that cell is free.
   Win: field empty, every non-empty flask holds one colour, no colour in two flasks. No move limit, no losing. */
Postie.engine('the-gap', (function () {
  var DELTA = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] };
  /* level: { rows: ['..1', ...] ('.' empty, '#' wall, '1'..'3' colour), exits: [[x, y, dx, dy]], caps: [..], flasks: [[bottom..top]] } */
  function fresh(L) {
    var field = [];
    L.rows.forEach(function (row) { row.split('').forEach(function (ch) { field.push(ch === '.' ? 0 : ch === '#' ? -1 : +ch); }); });
    return { w: L.rows[0].length, h: L.rows.length, exits: L.exits, caps: L.caps, field: field, flasks: L.flasks.map(function (f) { return f.slice(); }), moves: 0 };
  }
  function clone(s) { return { w: s.w, h: s.h, exits: s.exits, caps: s.caps, field: s.field.slice(), flasks: s.flasks.map(function (f) { return f.slice(); }), moves: s.moves }; }
  function at(s, x, y) { return s.field[y * s.w + x]; }
  /* planSwipe -> null (illegal) or { kind: 'slide'|'in', color, from:[x,y], to:[x,y], steps, flask (1-based or null) } */
  function planSwipe(s, x0, y0, dir) {
    var color = at(s, x0, y0); if (!(color > 0) || !DELTA[dir]) return null;
    var dx = DELTA[dir][0], dy = DELTA[dir][1], x = x0, y = y0;
    for (;;) {
      var nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= s.w || ny >= s.h || at(s, nx, ny) !== 0) break;
      x = nx; y = ny;
    }
    var steps = Math.abs(x - x0) + Math.abs(y - y0);
    for (var i = 0; i < s.exits.length; i++) {
      var e = s.exits[i];
      if (e[0] === x && e[1] === y && e[2] === dx && e[3] === dy) {
        if (s.flasks[i].length < s.caps[i]) return { kind: 'in', color: color, from: [x0, y0], to: [x, y], steps: steps, flask: i + 1 };
        break;
      }
    }
    if (steps === 0) return null;
    return { kind: 'slide', color: color, from: [x0, y0], to: [x, y], steps: steps, flask: null };
  }
  function swipe(s, x, y, dir) {
    var m = planSwipe(s, x, y, dir); if (!m) return null;
    s.field[y * s.w + x] = 0;
    if (m.kind === 'in') s.flasks[m.flask - 1].push(m.color); else s.field[m.to[1] * s.w + m.to[0]] = m.color;
    s.moves++; return m;
  }
  /* tapFlask(s, n) with n 1-based -> null or { kind: 'return', color, to:[x,y], flask } */
  function tapFlask(s, n) {
    var e = s.exits[n - 1], f = s.flasks[n - 1];
    if (!e || !f || !f.length || at(s, e[0], e[1]) !== 0) return null;
    var color = f.pop(); s.field[e[1] * s.w + e[0]] = color; s.moves++;
    return { kind: 'return', color: color, to: [e[0], e[1]], flask: n };
  }
  /* apply one solution step: [x, y, dir] swipe or [n] flask tap */
  function step(s, m) { return m.length === 1 ? tapFlask(s, m[0]) : swipe(s, m[0], m[1], m[2]); }
  function won(s) {
    if (s.field.some(function (c) { return c > 0; })) return false;
    var seen = {};
    for (var i = 0; i < s.flasks.length; i++) {
      var f = s.flasks[i]; if (!f.length) continue;
      if (f.some(function (c) { return c !== f[0]; }) || seen[f[0]]) return false;
      seen[f[0]] = 1;
    }
    return true;
  }
  /* goals: per colour { color, have, total, done } — have = size of the largest one-colour flask of that colour */
  function goals(s, L) {
    var total = {}, have = {};
    var start = fresh(L);
    start.field.forEach(function (c) { if (c > 0) total[c] = (total[c] || 0) + 1; });
    start.flasks.forEach(function (f) { f.forEach(function (c) { total[c] = (total[c] || 0) + 1; }); });
    s.flasks.forEach(function (f) { if (f.length && f.every(function (c) { return c === f[0]; })) have[f[0]] = Math.max(have[f[0]] || 0, f.length); });
    return Object.keys(total).sort().map(function (c) { return { color: +c, have: have[c] || 0, total: total[c], done: (have[c] || 0) === total[c] }; });
  }
  return { fresh: fresh, clone: clone, at: at, planSwipe: planSwipe, swipe: swipe, tapFlask: tapFlask, step: step, won: won, goals: goals };
})());
