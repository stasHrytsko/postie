/* Recruit Ladder — pure rules, no DOM. Port of stazzi apps/midcore/recruit-ladder/src/engine/rules.ts (version "ladder", IDEA.md §14).
   4 recruits on 4 lanes climb 7 rows. Before each step you may swap ONE pair of neighbours (lanes k and k+1), then everyone steps up
   one row and learns the school under them. A recruit remembers the last 3 DIFFERENT schools (a repeat moves to the end, a 4th pushes
   out the oldest). After row 7 the recruit on lane l must remember every school lane l asks for (extra schools don't hurt).
   Schools: 0 Dojo, 1 Range, 2 Bastion, 3 Temple. Nothing is random. */
Postie.engine('recruit-ladder', (function () {
  var LANES = 4, ROWS = 7, MEMORY = 3;
  function learn(mem, s) {
    if (s === null || s === undefined) return mem.slice();
    var next = mem.filter(function (x) { return x !== s; }); next.push(s);
    return next.length > MEMORY ? next.slice(next.length - MEMORY) : next;
  }
  /* state: at[lane] = recruit id, mem[id] = schools remembered (oldest first), row = rows climbed (0..7),
     pend = swap chosen for the next step (-1 none, k = lanes k and k+1), rungs = swaps made before each climbed row, swaps = count */
  function fresh(L) { return { L: L, at: [0, 1, 2, 3], mem: [[], [], [], []], row: 0, pend: -1, rungs: [], swaps: 0 }; }
  function done(s) { return s.row >= ROWS; }
  /* choose (or clear, if it is the same pair) the swap for the next step */
  function swap(s, k) {
    if (done(s) || k < 0 || k > LANES - 2) return false;
    s.pend = s.pend === k ? -1 : k; return true;
  }
  /* order of recruits on lanes right now, with the chosen swap applied (what the screen shows) */
  function lanes(s) { var a = s.at.slice(); if (s.pend >= 0) { var t = a[s.pend]; a[s.pend] = a[s.pend + 1]; a[s.pend + 1] = t; } return a; }
  /* Go: apply the chosen swap, everyone steps up one row and learns the school there */
  function step(s) {
    if (done(s)) return false;
    s.at = lanes(s); s.rungs.push(s.pend); if (s.pend >= 0) s.swaps++; s.pend = -1;
    for (var l = 0; l < LANES; l++) { var id = s.at[l]; s.mem[id] = learn(s.mem[id], school(s.L, s.row, l)); }
    s.row++; return true;
  }
  /* level data is compact strings (see levels.js): grid[r] = 4 chars, need[l] = digits */
  function school(L, r, l) { var ch = L.grid[r].charAt(l); return ch === '.' ? null : +ch; }
  function need(L, l) { return L.need[l].split('').map(Number); }
  function beats(need, mem) { return need.every(function (x) { return mem.indexOf(x) >= 0; }); }
  /* lanesWon: per lane, does the recruit standing there remember everything the lane asks for */
  function lanesWon(s) { return s.at.map(function (id, l) { return beats(need(s.L, l), s.mem[id]); }); }
  function won(s) { return done(s) && lanesWon(s).every(Boolean); }
  return { LANES: LANES, ROWS: ROWS, MEMORY: MEMORY, fresh: fresh, swap: swap, step: step, lanes: lanes, done: done, learn: learn, lanesWon: lanesWon, won: won, school: school, need: need };
})());
