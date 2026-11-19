/* Streams — pure rules, no DOM. Port of stazzi apps/casual/rusla/src/engine/rusla.ts (SPEC.md §4–5), same behaviour.
   Lines: [0] = trunk (or the only line) from start; [k] = branch k, from its arrow cell after the fork. Cell i = r * w + c.
   Each new cell costs 1 from one shared pool; a drop gives +X after that. Pool 0 = no step. Retracting gives the move back
   (and takes the drop back). Win: every cell covered, every branch on its own finish (no fork: the line on the finish).
   energy: null = no pool at all (author 2026-11-19: the first levels have no moves to count; drops and the pool come later). */
Postie.engine('streams', (function () {
  function dropAt(L, cell) { for (var i = 0; i < L.drops.length; i++) if (L.drops[i][0] === cell) return L.drops[i][1]; return 0; }
  function fresh(L) {
    var lines = [[L.start]]; for (var i = 0; i < L.arrows.length; i++) lines.push([]);
    return { lines: lines, forked: false, energy: L.energy == null ? null : L.energy, moves: 0, won: false };
  }
  function clone(s) { return { lines: s.lines.map(function (l) { return l.slice(); }), forked: s.forked, energy: s.energy, moves: s.moves, won: s.won }; }
  function neighbours(L, cell) {
    var r = Math.floor(cell / L.w), c = cell % L.w, out = [];
    if (r > 0) out.push(cell - L.w); if (c < L.w - 1) out.push(cell + 1); if (r < L.h - 1) out.push(cell + L.w); if (c > 0) out.push(cell - 1);
    return out;
  }
  function visited(s) { var v = {}; s.lines.forEach(function (l) { l.forEach(function (c) { v[c] = 1; }); }); return v; }
  function covered(s) { return s.lines.reduce(function (a, l) { return a + l.length; }, 0); }
  /* tip of a line; an empty branch's tip is the fork */
  function tipOf(L, s, line) { var l = s.lines[line]; if (l && l.length) return l[l.length - 1]; return L.fork; }
  /* the cell a line steps back to; undefined for a trunk that is only the start */
  function backOf(L, s, line) {
    var l = s.lines[line] || [];
    if (l.length >= 2) return l[l.length - 2];
    if (l.length === 1 && line > 0) return L.fork === null ? undefined : L.fork;
    return undefined;
  }
  function finished(L, s, line) {
    var fin = L.fork === null ? L.finish[0] : line === 0 ? undefined : L.finish[line - 1];
    return fin !== undefined && tipOf(L, s, line) === fin;
  }
  function isWon(L, s) {
    if (covered(s) !== L.w * L.h) return false;
    if (L.fork === null) return finished(L, s, 0);
    for (var line = 1; line < s.lines.length; line++) if (!finished(L, s, line)) return false;
    return true;
  }
  function isActive(L, s, line) {
    if (s.won) return false;
    if (L.fork === null) return line === 0 && !finished(L, s, 0);
    if (line === 0) return !s.forked;
    return s.forked && !finished(L, s, line);
  }
  function mayEnter(L, s, line, cell) {
    var l = s.lines[line] || [], arrow = L.arrows.indexOf(cell), fin = L.finish.indexOf(cell);
    if (L.fork === null) return true;               // single line: the finish is an ordinary cell (entering it ends the line)
    if (line === 0) return arrow === -1 && fin === -1; // trunk: not into arrows or finishes; into the fork is fine
    if (l.length === 0) return cell === L.arrows[line - 1];
    if (arrow !== -1) return false;                  // someone else's arrow (own one is taken already)
    return fin === -1 || fin === line - 1;
  }
  /* step a line forward into cell; mutates s; false if not allowed */
  function step(L, s, line, cell) {
    if (!isActive(L, s, line) || (s.energy !== null && s.energy < 1)) return false;
    if (neighbours(L, tipOf(L, s, line)).indexOf(cell) < 0) return false;
    if (visited(s)[cell] || !mayEnter(L, s, line, cell)) return false;
    s.lines[line].push(cell);
    if (L.fork !== null && line === 0 && cell === L.fork) s.forked = true;
    if (s.energy !== null) s.energy = s.energy - 1 + dropAt(L, cell); s.moves++;
    s.won = isWon(L, s);
    return true;
  }
  /* pull a line back one cell: the move comes back, a drop is taken back. Trunk only while no branch has started. */
  function retract(L, s, line) {
    if (s.won) return false;
    var l = s.lines[line] || [];
    if (!l.length) return false;
    if (line === 0) {
      if (l.length < 2) return false;
      for (var i = 1; i < s.lines.length; i++) if (s.lines[i].length) return false;
    }
    var cell = l.pop();
    if (line === 0 && cell === L.fork) s.forked = false;
    if (s.energy !== null) s.energy = s.energy + 1 - dropAt(L, cell);
    return true;
  }
  /* finger moves from cell `from` to neighbour `to`: retract if `to` is where the line came from, else step forward.
     Returns { kind: 'step'|'retract', line } or null. */
  function move(L, s, from, to) {
    var n = s.lines.length, line;
    for (line = 0; line < n; line++) {
      if (!s.lines[line].length || tipOf(L, s, line) !== from) continue;
      if (backOf(L, s, line) === to && retract(L, s, line)) return { kind: 'retract', line: line };
    }
    for (line = 0; line < n; line++) {
      if (tipOf(L, s, line) !== from) continue;
      if (step(L, s, line, to)) return { kind: 'step', line: line };
    }
    return null;
  }
  /* can a finger put down on this cell grab a line? (at the fork: any branch once the fork is open) */
  function grabbable(L, s, cell) {
    return s.lines.some(function (l, line) { return (l.length > 0 || (line > 0 && s.forked)) && tipOf(L, s, line) === cell; });
  }
  function won(s) { return s.won; }
  return { fresh: fresh, clone: clone, neighbours: neighbours, dropAt: dropAt, tipOf: tipOf, finished: finished, covered: covered,
    step: step, retract: retract, move: move, grabbable: grabbable, won: won };
})());
