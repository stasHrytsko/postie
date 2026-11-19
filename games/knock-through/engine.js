/* Knock Through — pure rules, no DOM. Bare mechanic of stazzi apps/midcore/knock-through (author 2026-11-19: no runs, money, shop,
   boosts, load-bearing walls or wishes — the core only, IDEA.md §2–5).
   The board is cut into small rooms; each shows how many cells it has. The order is a list of numbers.
   Knock down a wall between two neighbouring rooms: they become one room, their numbers add up.
   Won: the rooms match the order exactly (as a multiset). Stuck: a room is bigger than every number of the order,
   or every wall left would make a room bigger than that (no prediction beyond that — the game does not foretell a loss).
   Level: { w, h, rows: ['aab', ...] (a letter = a room), order: [8, 8, 5] }. Move: [r1, c1, r2, c2] — two neighbouring cells. */
Postie.engine('knock-through', (function () {
  function fresh(L) {
    var cell = [], ids = {}, n = 0, size = [];
    for (var r = 0; r < L.h; r++) for (var c = 0; c < L.w; c++) {
      var ch = L.rows[r].charAt(c); if (!(ch in ids)) { ids[ch] = n++; size.push(0); }
      cell.push(ids[ch]); size[ids[ch]]++;
    }
    var order = L.order.slice().sort(function (a, b) { return b - a; });
    var s = { w: L.w, h: L.h, cell: cell, size: size, order: order, max: order[0], knocks: 0, status: 'playing' };
    s.status = status(s); return s;
  }
  function rooms(s) { var out = []; s.size.forEach(function (z, i) { if (z > 0) out.push(i); }); return out; }
  function roomAt(s, r, c) { return s.cell[r * s.w + c]; }
  /* null = can knock; else 'outside' | 'not_next' | 'same_room' */
  function check(s, r1, c1, r2, c2) {
    if (r1 < 0 || c1 < 0 || r2 < 0 || c2 < 0 || r1 >= s.h || r2 >= s.h || c1 >= s.w || c2 >= s.w) return 'outside';
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return 'not_next';
    return roomAt(s, r1, c1) === roomAt(s, r2, c2) ? 'same_room' : null;
  }
  function matched(s) {                                                  // which order numbers are on the board now (multiset)
    var left = s.order.slice(), hit = s.order.map(function () { return false; });
    rooms(s).forEach(function (i) { for (var k = 0; k < left.length; k++) if (!hit[k] && left[k] === s.size[i]) { hit[k] = true; break; } });
    return hit;
  }
  function status(s) {
    var rs = rooms(s), sz = rs.map(function (i) { return s.size[i]; }).sort(function (a, b) { return b - a; });
    if (sz.length === s.order.length && sz.every(function (z, k) { return z === s.order[k]; })) return 'won';
    if (sz[0] > s.max) return 'failed';
    for (var p = 0; p < s.cell.length; p++) {                            // any wall that keeps the new room within the order?
      var r = Math.floor(p / s.w), c = p % s.w, a = s.cell[p];
      if (c + 1 < s.w && s.cell[p + 1] !== a && s.size[a] + s.size[s.cell[p + 1]] <= s.max) return 'playing';
      if (r + 1 < s.h && s.cell[p + s.w] !== a && s.size[a] + s.size[s.cell[p + s.w]] <= s.max) return 'playing';
    }
    return 'failed';
  }
  /* knock the wall between two neighbouring cells. Returns {keep, gone} (room ids) or null if not allowed (nothing changes). */
  function knock(s, r1, c1, r2, c2) {
    if (s.status !== 'playing' || check(s, r1, c1, r2, c2) !== null) return null;
    var a = roomAt(s, r1, c1), b = roomAt(s, r2, c2);
    for (var p = 0; p < s.cell.length; p++) if (s.cell[p] === b) s.cell[p] = a;
    s.size[a] += s.size[b]; s.size[b] = 0; s.knocks++;
    s.status = status(s);
    return { keep: a, gone: b };
  }
  function won(s) { return s.status === 'won'; }
  return { fresh: fresh, rooms: rooms, roomAt: roomAt, check: check, matched: matched, knock: knock, won: won };
})());
