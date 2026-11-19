/* Knock Through — the 100 levels, by games/GENERATOR.md.
   Built from the answer backwards: cut the board into the order's rooms first, then split each of them into small rooms.
   Knocking the walls inside each order room clears the level, so every level is solvable by construction; the solver measures it.
     1–8    small boards (4×4 → 5×5), few rooms
     9–90   steps rise in a wave (base +1 / −1)
     91–100 7×7 finale
   Step from two measures: rooms (<=5 → 1, <=8 → 2, <=11 → 3, <=15 → 4, <=20 → 5, more → 6) and traps (share of walls that are part
   of some answer: 1 → 1, >=.75 → 2, >=.5 → 3, >=.3 → 4, >=.18 → 5, else 6); step = ceil(average); letter: 1–2 easy, 3–4 medium, 5–6 hard.
   Run: node make-100.js k n (workers) · node make-100.js write */
const fs = require('fs'), path = require('path');
const { solve } = require('./solver.js');
const OUT = path.join(__dirname, 'out');
function rng(seed) { return () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }; }
const stepP = n => n <= 5 ? 1 : n <= 8 ? 2 : n <= 11 ? 3 : n <= 15 ? 4 : n <= 20 ? 5 : 6;
const stepQ = q => q >= 0.999 ? 1 : q >= 0.75 ? 2 : q >= 0.5 ? 3 : q >= 0.3 ? 4 : q >= 0.18 ? 5 : 6;
const stepOf = (n, q) => Math.ceil((stepP(n) + stepQ(q)) / 2), diffOf = st => st <= 2 ? 1 : st <= 4 ? 2 : 3;

function plan() {
  const P = [], add = (step, big) => P.push({ step, big: !!big });
  [1, 1, 2, 2, 2, 3, 2, 3].forEach(s => add(s));
  const VAR = [0, 1, 0, -1, 1, 0, 1, -1, 0, 1];
  for (let i = 9; i <= 100; i++) { const st = Math.max(2, Math.min(6, 2 + Math.floor((i - 9) / 82 * 4) + VAR[(i - 9) % 10])); add(i > 90 ? Math.max(5, st) : st, i > 90); }
  return P;
}
const SPEC = [null,                                                      // sizes picked by sampling: each gives its step most often
  { w: 3, h: 3, t: [4, 5], sub: 3 }, { w: 4, h: 4, t: [4, 8], sub: 3 }, { w: 4, h: 4, t: [5, 8], sub: 4 },
  { w: 5, h: 5, t: [4, 8], sub: 2 }, { w: 6, h: 6, t: [3, 6], sub: 2 }, { w: 6, h: 6, t: [3, 6], sub: 2 }];
const BIG = { w: 7, h: 7, t: [5, 10], sub: 3 };

function nb(w, h, p) { const r = Math.floor(p / w), c = p % w, o = []; if (c > 0) o.push(p - 1); if (c < w - 1) o.push(p + 1); if (r > 0) o.push(p - w); if (r < h - 1) o.push(p + w); return o; }
function grow(rnd, w, h, cells, label, want, pool) {                    // a connected blob of `want` cells from pool (label === -1 inside pool)
  const start = pool[Math.floor(rnd() * pool.length)], got = [start]; label[start] = -2;
  while (got.length < want) {
    const front = []; got.forEach(p => nb(w, h, p).forEach(q => { if (label[q] === -1 && cells.has(q)) front.push(q); }));
    if (!front.length) break; const q = front[Math.floor(rnd() * front.length)]; label[q] = -2; got.push(q);
  }
  return got;
}
function cutInto(rnd, w, h, cells, sizes) {                              // cut a set of cells into connected parts with sizes in [lo, hi]
  for (let t = 0; t < 300; t++) {
    const label = new Array(w * h).fill(-9); cells.forEach(p => label[p] = -1);
    const parts = []; let ok = true;
    while (true) {
      const pool = [...cells].filter(p => label[p] === -1); if (!pool.length) break;
      const want = sizes[0] + Math.floor(rnd() * (sizes[1] - sizes[0] + 1)), got = grow(rnd, w, h, cells, label, Math.min(want, pool.length), pool);
      if (got.length < sizes[0]) { ok = false; break; }
      got.forEach(p => label[p] = parts.length); parts.push(got);
    }
    if (ok) return parts;
  }
  return null;
}
const LET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function make(seed, sp) {
  const rnd = rng(seed), all = new Set([...Array(sp.w * sp.h).keys()]);
  const big = cutInto(rnd, sp.w, sp.h, all, sp.t); if (!big) return null;
  const cell = new Array(sp.w * sp.h).fill(-1), solution = []; let id = 0;
  for (const part of big) {
    const sub = cutInto(rnd, sp.w, sp.h, new Set(part), [1, sp.sub]); if (!sub || sub.length < 2) return null;
    const first = id; sub.forEach(s => { s.forEach(p => cell[p] = id); id++; });
    /* the answer: knock walls inside this order room along a spanning tree of its small rooms */
    const inTree = new Set([first]);
    while (inTree.size < sub.length) {
      let found = false;
      for (const p of part) { if (!inTree.has(cell[p])) continue; for (const q of nb(sp.w, sp.h, p)) if (part.includes(q) && !inTree.has(cell[q])) { inTree.add(cell[q]); solution.push([Math.floor(p / sp.w), p % sp.w, Math.floor(q / sp.w), q % sp.w]); found = true; break; } if (found) break; }
      if (!found) return null;
    }
  }
  if (id > 30 || id > LET.length) return null;
  const rows = []; for (let r = 0; r < sp.h; r++) { let s = ''; for (let c = 0; c < sp.w; c++) s += LET[cell[r * sp.w + c]]; rows.push(s); }
  const order = big.map(p => p.length).sort((a, b) => b - a);
  const L = { w: sp.w, h: sp.h, rows, order }, R = solve(L), q = R.goodFirst / R.firstMoves, st = stepOf(R.rooms, q);
  /* the stored sample: merge order following the solution groups found by the solver is the same as ours; keep ours */
  return Object.assign(L, { step: st, difficulty: diffOf(st), rooms: R.rooms, answers: R.sols, good: +q.toFixed(2), seed, solution });
}
module.exports = { plan, make, stepOf, diffOf };
if (require.main === module) {
  const P = plan();
  if (process.argv[2] === 'write') {
    const L = P.map((s, i) => JSON.parse(fs.readFileSync(path.join(OUT, 'slot-' + (i + 1) + '.json'), 'utf8')));
    L.forEach(x => { x.solution = x.solution.map(m => (m[2] * 100 + m[3] < m[0] * 100 + m[1]) ? [m[2], m[3], m[0], m[1]] : m); });   // first cell first (the hand compares moves)
    const q = a => "['" + a.join("', '") + "']";
    const body = L.map(x => `  { w: ${x.w}, h: ${x.h}, rows: ${q(x.rows)}, order: [${x.order.join(', ')}], step: ${x.step}, difficulty: ${x.difficulty}, rooms: ${x.rooms}, answers: ${x.answers}, good: ${x.good}, seed: ${x.seed},\n    solution: ${JSON.stringify(x.solution).replace(/,/g, ', ')} }`).join(',\n');
    fs.writeFileSync(path.join(__dirname, '../levels.js'), `/* Knock Through — 100 levels, made by tools/make-100.js (games/GENERATOR.md): built from the answer backwards, solvable by construction.
   rows: a letter = a room (its number = its cells). order: the rooms to end with. solution: walls to knock, [r1, c1, r2, c2] (two neighbouring cells).
   step 1..6 from rooms and traps; difficulty for the letter: 1–2 → 1, 3–4 → 2, 5–6 → 3. answers: how many ways (up to 400). good: share of walls
   that are part of some answer. 1–8 small boards; 9–90 a rising wave; 91–100 7×7. Level 0 and the "?" demo live in view.js. */
Postie.addLevels('knock-through', [
${body}
]);
`);
    const c = {}; L.forEach(x => c[x.difficulty] = (c[x.difficulty] || 0) + 1); console.log('wrote', L.length, JSON.stringify(c)); return;
  }
  const k = +process.argv[2] || 0, nW = +process.argv[3] || 1; fs.mkdirSync(OUT, { recursive: true });
  P.forEach((slot, i) => {
    if (i % nW !== k) return; const f = path.join(OUT, 'slot-' + (i + 1) + '.json'); if (fs.existsSync(f)) return;
    const sp = slot.big ? BIG : SPEC[slot.step]; let L = null;
    for (let seed = 1 + i * 10000; !L && seed < i * 10000 + 4000; seed++) { const x = make(seed, sp); if (x && (slot.step >= 5 ? x.step >= 5 : x.step === slot.step)) L = x; }
    if (!L) { console.log('slot', i + 1, 'FAILED', JSON.stringify(slot)); return; }
    fs.writeFileSync(f, JSON.stringify(L)); console.log('slot', i + 1, 'step', L.step, L.w + 'x' + L.h, 'rooms', L.rooms, 'order', L.order.join(' '), 'answers', L.answers, 'good', L.good);
  });
}
