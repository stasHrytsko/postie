/* Nest — converts stazzi levels to Postie's compact format and plans a move-by-move solution for each level.
   Input: JSON { LEVELS, PLANTED } exported from stazzi apps/casual/nested-tangram (src/level.ts, tests/planted.ts — the solver's
   solution: final r, c, rot of every node by id "r.0.1"). Output: games/nest/levels.js.
   Run from repo root: node games/nest/tools/make-levels.js <nest.json>
   The planner only drives the Postie engine (open, enter, rotate, move, exit), so every stored move is legal on the real board:
   it fixes the deepest parts first; on a board it puts each child onto its solved place, parking blockers in free space. */
const path = require('path'), fs = require('fs');
global.Postie = require(path.join(__dirname, '../../../web/kit/kit.js'));
require(path.join(__dirname, '../engine.js'));
const E = Postie.engines.nest;
const { LEVELS, PLANTED } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

/* compact level data: frame quarters grouped by cell "r,c:kk" */
function frameStr(frame) {
  const by = new Map();
  frame.forEach(([r, c, k]) => { const id = r + ',' + c; by.set(id, (by.get(id) || '') + k); });
  return [...by].map(([id, ks]) => id + ':' + ks).join(' ');
}
function compact(d) {
  if (!d.children) return [d.type, d.rot, d.r, d.c];
  return { n: d.name, h: d.rows, w: d.cols, f: frameStr(d.frame), r: d.r, c: d.c, k: d.children.map(compact) };
}
function lit(v) { /* JS literal, compact */
  if (Array.isArray(v)) return '[' + v.map(lit).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).map((k) => k + ':' + lit(v[k])).join(',') + '}';
  return JSON.stringify(v);
}

const WON = {};
function plan(L, planted) {
  const s = E.fresh(L), moves = [];
  const act = (m) => {
    const ok = m[0] === 'open' ? E.open(s) : m[0] === 'in' ? E.enter(s, m[1]) : m[0] === 'out' ? E.exit(s) : m[0] === 'rot' ? E.rotate(s, m[1]) : E.move(s, m[1], m[2], m[3]);
    if (!ok) throw new Error('illegal ' + JSON.stringify(m));
    moves.push(m);
    if (E.won(s)) throw WON; /* the game ends the moment the picture fits (even from inside a part) */
  };
  const ids = new Map(); /* node -> stazzi id */
  (function tag(n, id) { ids.set(n, id); if (n.children) n.children.forEach((ch, i) => tag(ch, id + '.' + i)); })(s.root, 'r');
  const T = (n) => planted[ids.get(n)];
  const targetCells = (n) => { const t = T(n); return n.kind === 'leaf' ? E.cellsAt(Object.assign({}, n, { rot: t.rot }), t.r, t.c) : E.cellsAt(n, t.r, t.c); };
  const atPlace = (n) => E.key(E.cellsOf(n)) === E.key(targetCells(n));
  const solvedDeep = (n) => atPlace(n) && (n.kind === 'leaf' || n.children.every(solvedDeep));
  const innerSolved = (n) => n.children.every(solvedDeep);

  function arrange() {
    const x = E.cur(s);
    x.children.forEach((ch, i) => { if (ch.kind === 'comp' && !innerSolved(ch)) { act(['in', i]); arrange(); act(['out']); } });
    for (let guard = 0; guard < 200; guard++) {
      const todo = x.children.map((n, i) => i).filter((i) => !atPlace(x.children[i]));
      if (!todo.length) return;
      let progress = false;
      for (const i of todo) {
        const n = x.children[i], tc = new Set(targetCells(n).map(E.qk));
        const blockers = x.children.filter((o) => o !== n && E.cellsOf(o).some((q) => tc.has(E.qk(q))));
        if (blockers.length) continue;
        if (n.kind === 'leaf') {
          const want = E.key(E.orient(E.SHAPES[n.type], T(n).rot));
          for (let k = 0; k < 4 && E.key(E.orient(E.SHAPES[n.type], n.rot)) !== want; k++) {
            if (!E.rotate(s, i)) { park(i, null); continue; }
            moves.push(['rot', i]); if (E.won(s)) throw WON;
          }
          if (E.key(E.orient(E.SHAPES[n.type], n.rot)) !== want) continue;
        }
        const t = T(n);
        if (!(n.r === t.r && n.c === t.c)) act(['mv', i, t.r, t.c]);
        progress = true;
      }
      if (progress) continue;
      /* stuck: park one blocker of the first waiting child somewhere outside every unfinished target */
      const i = todo[0], n = x.children[i], tc = new Set(targetCells(n).map(E.qk));
      const bi = x.children.findIndex((o) => o !== n && E.cellsOf(o).some((q) => tc.has(E.qk(q))));
      park(bi, todo);
    }
    throw new Error('planner stuck');
  }
  /* move child i to the nearest free spot that covers no target cell of the unfinished children (or just any other free spot) */
  function park(i, todo) {
    const x = E.cur(s), n = x.children[i];
    const avoid = new Set();
    x.children.forEach((o, j) => { if (j !== i && !atPlace(o)) targetCells(o).forEach((q) => avoid.add(E.qk(q))); });
    let best = null;
    for (let r = -2; r < x.rows + 2; r++) for (let c = -2; c < x.cols + 2; c++) {
      if ((r === n.r && c === n.c) || !E.fitsAt(n, x, r, c)) continue;
      const cells = E.cellsAt(n, r, c), bad = cells.some((q) => avoid.has(E.qk(q))) ? 1 : 0;
      const d = bad * 1000 + Math.hypot(r - n.r, c - n.c);
      if (!best || d < best.d) best = { r, c, d };
    }
    if (!best) throw new Error('nowhere to park');
    act(['mv', i, best.r, best.c]);
  }

  try { act(['open']); arrange(); } catch (e) { if (e !== WON) throw e; }
  if (!E.won(s)) throw new Error('plan does not win');
  return moves;
}

/* how much to fix: pieces/parts not on their solved place at the start */
function wrongCount(L, planted) {
  const s = E.fresh(L); let w = 0;
  (function walk(n, id) {
    if (n !== s.root) {
      const t = planted[id];
      const tc = n.kind === 'leaf' ? E.cellsAt(Object.assign({}, n, { rot: t.rot }), t.r, t.c) : null;
      if (n.kind === 'leaf' && E.key(E.cellsOf(n)) !== E.key(tc)) w++;
    }
    if (n.children) n.children.forEach((ch, i) => walk(ch, id + '.' + i));
  })(s.root, 'r');
  return w;
}

const rows = LEVELS.map((lv, i) => {
  const L = { name: lv.name, root: compact(lv.root) };
  const moves = plan(L, PLANTED[i]);
  const s = E.fresh(L), depth = E.depth(s.root), wrong = wrongCount(L, PLANTED[i]);
  L.layers = depth; L.wrong = wrong;
  L.difficulty = depth === 2 ? (wrong <= 7 ? 1 : 2) : wrong <= 12 ? 2 : 3;
  L.solution = moves;
  const pieceMoves = moves.filter((m) => m[0] === 'rot' || m[0] === 'mv').length;
  console.log(`level ${i + 1} ${lv.name}: ${depth} layers, ${wrong} pieces out of place, plan ${moves.length} steps (${pieceMoves} piece moves), difficulty ${L.difficulty}`);
  return '  ' + lit(L);
});
fs.writeFileSync(path.join(__dirname, '../levels.js'),
`/* Nest — all 11 levels from stazzi apps/casual/nested-tangram/src/level.ts, same order, coordinates unchanged (written by tools/make-levels.js).
   root = the picture, a part: { n name, h rows, w cols, f outline, r, c, k children }. (r, c) of a part = shift of its board on the
     parent's board. f = outline quarters grouped by cell: "r,c:kk" — cell row,col then its quarters (0 top, 1 right, 2 bottom, 3 left).
   A piece (leaf) = [type, rot, r, c]: type S small / M medium / L large triangle, Sq square, P parallelogram; rot = quarter turns
     clockwise; (r, c) = top-left of its bounding box. The start is the picture as built WITH its mistakes.
   layers = depth of the tree; wrong = tangram pieces not on their solved place at the start.
   difficulty (1 easy · 2 medium · 3 hard): 2 layers -> 1 if wrong <= 7 else 2; 3 layers -> 2 if wrong <= 12 else 3.
   solution: moves on the board the player is in, children by index — ['open'] tap the picture, ['in', i] tap part i, ['out'] Zoom out,
     ['rot', i] tap piece i, ['mv', i, r, c] drag child i to (r, c). Planned from stazzi's solver solution (tests/planted.ts). */
Postie.addLevels('nest', [
${rows.join(',\n')}
]);
`);
