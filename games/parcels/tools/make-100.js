/* Parcels — the 100 levels (author 2026-11-19): numbers first, then the pair joins the numbers; no levels with dots alone.
     1–8    numbers only, 4×4 → 5×5
     9–11   numbers + exactly one pair (9 teaches the pair: its solution opens with the pair, the hand shows it)
     12–15  numbers + two pairs
     16–90  mixed, step by step harder; flavour changes level to level (balanced / few pairs / many pairs / numbers only now and then)
     91–100 7×7, steps 5–6 (author 2026-11-19: the big board at the end)
   Two builders: steps 1–3 — a random cover of the board (parcels ship top to bottom); steps 4–6 and 7×7 — tools/reverse.js
   (author's idea 2026-11-19: start from an empty board and put parcels in, under older ones — gravity becomes part of the answer).
   Step = how hard a level is, from two measures together (author 2026-11-19: one measure is not enough — level "2" had 8 parcels):
     parcels: <=4 -> 1, 5–6 -> 2, 7–8 -> 3, 9–10 -> 4, 11 -> 5, 12+ -> 6
     traps (share of good first frames): 1 -> 1, >=.75 -> 2, >=.5 -> 3, >=.3 -> 4, >=.18 -> 5, else 6
     step = ceil(average); difficulty in the letter: steps 1–2 easy, 3–4 medium, 5–6 hard.
   Every level is solvable by construction (a cover of the board by parcels, shipped top to bottom) and re-solved by tools/solver.js.
   Numbers-only slots from step 4 reuse stazzi's levels when one fits.
   Run: node games/parcels/tools/make-100.js [worker k of n]   — workers write tools/out/slot-N.json; then: node … make-100.js write */
const fs = require('fs'), path = require('path');
const { solve } = require('./solver.js');
const OUT = path.join(__dirname, 'out');

function rng(seed) { return () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }; }
const stepP = n => n <= 4 ? 1 : n <= 6 ? 2 : n <= 8 ? 3 : n <= 10 ? 4 : n <= 11 ? 5 : 6;
const stepQ = q => q >= 0.999 ? 1 : q >= 0.75 ? 2 : q >= 0.5 ? 3 : q >= 0.3 ? 4 : q >= 0.18 ? 5 : 6;
const stepOf = (n, q) => Math.ceil((stepP(n) + stepQ(q)) / 2);
const diffOf = st => st <= 2 ? 1 : st <= 4 ? 2 : 3;

/* the plan: slot -> { step, flavour } */
function plan() {
  const P = [];
  const add = (step, fl, extra) => P.push(Object.assign({ step, fl }, extra || {}));
  add(1, 'num'); add(1, 'num'); add(2, 'num'); add(2, 'num'); add(2, 'num'); add(3, 'num'); add(3, 'num'); add(3, 'num');
  add(1, 'p1', { teach: true }); add(2, 'p1'); add(2, 'p1');
  add(2, 'p2'); add(2, 'p2'); add(2, 'p2'); add(3, 'p2');
  const FL = ['bal', 'few', 'bal', 'many', 'bal', 'few', 'bal', 'many', 'bal', 'num'], VAR = [0, 1, 0, -1, 1, 0, 1, -1, 0, 1];
  for (let i = 16; i <= 100; i++) {
    const base = 2 + Math.floor((i - 16) / 85 * 4);                     // 2 -> 5 over the run
    const st = Math.max(2, Math.min(6, base + VAR[(i - 16) % 10]));
    if (i > 90) add(Math.max(5, st), FL[(i - 16) % 10], { big: true }); else add(st, FL[(i - 16) % 10]);
  }
  return P;
}
function shape(step) {                                                   // board and cover sizes that give the step's parcel count
  return [null, { w: 4, h: 4, n: [3, 4], maxA: 6 }, { w: 5, h: 5, n: [5, 6], maxA: 7 }, { w: 5, h: 5, n: [6, 8], maxA: 6 },
    { w: 6, h: 6, n: [8, 10], maxA: 6 }, { w: 6, h: 6, n: [10, 11], maxA: 5 }, { w: 6, h: 6, n: [11, 13], maxA: 5 }][step];
}
function pairsFor(fl, n, rnd) {
  if (fl === 'num') return 0; if (fl === 'p1') return 1; if (fl === 'p2') return 2;
  if (fl === 'few') return 1 + Math.floor(rnd() * 2);
  if (fl === 'many') return Math.max(2, Math.round(n * (0.6 + rnd() * 0.15)));
  return Math.max(2, Math.round(n * (0.4 + rnd() * 0.2)));
}
function cover(w, h, maxA, nRange, rnd) {
  for (let t = 0; t < 4000; t++) {
    const used = Array.from({ length: h }, () => Array(w).fill(false)), rects = [];
    let ok = true;
    for (let r = 0; r < h && ok; r++) for (let c = 0; c < w && ok; c++) {
      if (used[r][c]) continue;
      const opts = [];
      for (let hh = 1; r + hh <= h; hh++) for (let ww = 1; c + ww <= w; ww++) {
        const a = hh * ww; if (a < 2 || a > maxA) continue;
        let free = true; for (let i = r; i < r + hh && free; i++) for (let j = c; j < c + ww; j++) if (used[i][j]) { free = false; break; }
        if (free) opts.push([r, c, r + hh - 1, c + ww - 1]);
      }
      if (!opts.length) { ok = false; break; }
      const f = opts[Math.floor(rnd() * opts.length)]; rects.push(f);
      for (let i = f[0]; i <= f[2]; i++) for (let j = f[1]; j <= f[3]; j++) used[i][j] = true;
    }
    if (ok && rects.length >= nRange[0] && rects.length <= nRange[1]) return rects;
  }
  return null;
}
const area = f => (f[2] - f[0] + 1) * (f[3] - f[1] + 1);
function build(w, h, rects, marks) {
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  rects.forEach((f, k) => {
    const m = marks[k], cw = f[3] - f[1] + 1, at = i => [f[0] + Math.floor(i / cw), f[1] + i % cw];
    if (m.pair) { const a = at(m.a), b = at(m.b); g[a[0]][a[1]] = 'B'; g[b[0]][b[1]] = 'W'; }
    else { const a = at(m.a); g[a[0]][a[1]] = String(area(f)); }
  });
  return { w, h, rows: g.map(r => r.join('')) };
}
function make(slot, seed) {
  const rnd = rng(seed), S = shape(slot.step), rects = cover(S.w, S.h, S.maxA, S.n, rnd); if (!rects) return null;
  const n = rects.length, k = pairsFor(slot.fl, n, rnd);
  const big = rects.map((f, i) => area(f) > 9 ? i : -1).filter(i => i >= 0);
  if (big.length > k) return null;
  const order = rects.map((f, i) => i).filter(i => big.indexOf(i) < 0).sort(() => rnd() - 0.5), pairSet = new Set(big.concat(order.slice(0, k - big.length)));
  const pick = (f, pair) => { const a = Math.floor(rnd() * area(f)); let b = Math.floor(rnd() * (area(f) - 1)); if (b >= a) b++; return { pair, a, b }; };
  let marks = rects.map((f, i) => pick(f, pairSet.has(i))), L = build(S.w, S.h, rects, marks), r = solve(L, { pairFirst: slot.teach });
  let q = r.goodFirst / r.firstMoves, st = stepOf(n, q);
  const steps = slot.step >= 5 ? 70 : 40;
  for (let i = 0; i < steps && st < slot.step; i++) {                 // climb: move markers, swap which parcels are pairs (keeps k)
    const m2 = marks.slice(), x = Math.floor(rnd() * n);
    if (rnd() < 0.25 && k > 0 && k < n) { const y = Math.floor(rnd() * n); if (m2[x].pair !== m2[y].pair && area(rects[m2[x].pair ? y : x]) <= 9) { m2[x] = pick(rects[x], !m2[x].pair); m2[y] = pick(rects[y], !m2[y].pair); } }
    else m2[x] = pick(rects[x], m2[x].pair);
    const L2 = build(S.w, S.h, rects, m2), r2 = solve(L2, { pairFirst: slot.teach }), q2 = r2.goodFirst / r2.firstMoves;
    if (q2 <= q) { marks = m2; L = L2; r = r2; q = q2; st = stepOf(n, q); }
  }
  if (st !== slot.step) return null;
  if (slot.teach) { const f = r.solution[0]; let b = false; for (let i = f[0]; i <= f[2]; i++) for (let j = f[1]; j <= f[3]; j++) if (L.rows[i][j] === 'B') b = true; if (!b) return null; }
  return Object.assign(L, { step: st, difficulty: diffOf(st), parcels: n, pairs: k, good: +q.toFixed(2), seed, solution: r.solution });
}
const RV = require('./reverse.js');
function revSpec(slot) {
  if (slot.big) return { w: 7, h: 7, n: [11, 15], maxA: 6, minA: 3, side: 3, deep: 0.95, climb: 3 };
  return [null, null, null, null, { w: 6, h: 6, n: [8, 10], maxA: 6, minA: 2, side: 3, deep: 0.8, climb: 20 },
    { w: 6, h: 6, n: [10, 13], maxA: 6, minA: 2, side: 3, deep: 0.95, climb: 15 }, { w: 6, h: 6, n: [10, 13], maxA: 6, minA: 2, side: 3, deep: 0.95, climb: 15 }][slot.step];
}
function makeRev(slot, seed) {
  const sp = revSpec(slot), rnd = rng(seed);
  const L0 = RV.build(seed, Object.assign({ pairs: 0 }, sp)); if (!L0) return null;
  const n = L0.parcels, B = L0.B, area = p => p.ww * p.hh;
  let k = pairsFor(slot.fl, n, rnd);
  if (slot.step >= 5) k = Math.min(k, slot.fl === 'many' ? 5 : 3);   // pairs are flexible and make a level easier: fewer of them at the top
  if (k > 0) {                                                          // choose which parcels carry pairs (numbers need area <= 9)
    const idx = B.placed.map((p, i) => i).sort(() => rnd() - 0.5), ps = new Set(idx.slice(0, k));
    B.mark = B.placed.map((p, i) => RV.pick(rnd, area(p), ps.has(i)));
    if (B.placed.some((p, i) => !ps.has(i) && area(p) > 9)) return null;
  }
  let L = RV.level(B); if (!L) return null;
  let r = solve(L), q = r.goodFirst / r.firstMoves, st = stepOf(n, q);
  for (let i = 0; i < sp.climb && st < Math.min(slot.step, 5); i++) {   // climb: move one marker inside its parcel
    const m2 = B.mark.slice(), x = Math.floor(rnd() * n); m2[x] = RV.pick(rnd, area(B.placed[x]), m2[x].pair);
    const B2 = Object.assign({}, B, { mark: m2 }), L2 = RV.level(B2); if (!L2) continue;
    const r2 = solve(L2), q2 = r2.goodFirst / r2.firstMoves;
    if (q2 <= q) { B.mark = m2; L = L2; r = r2; q = q2; st = stepOf(n, q); }
  }
  if (slot.step >= 5 ? st < 5 : st !== slot.step) return null;    // 5 and 6 are both "hard" in the letter; 6 is rare by chance
  return { w: L.w, h: L.h, rows: L.rows, step: st, difficulty: diffOf(st), parcels: n, pairs: k, good: +q.toFixed(2), seed, built: 'reverse', solution: L.solution };
}
function stazziFits(slot, used) {                                         // a numbers-only slot from step 4: reuse stazzi's levels
  global.Postie.levels = global.Postie.levels || {};
  const src = require(path.join(__dirname, 'stazzi-numbers.json'));
  for (let i = 0; i < src.length; i++) {
    if (used.has(i)) continue;
    const L = src[i], r = solve(L), q = r.goodFirst / r.firstMoves, st = stepOf(r.solution.length, q);
    if (st === slot.step) { used.add(i); return Object.assign({ w: L.w, h: L.h, rows: L.rows }, { step: st, difficulty: diffOf(st), parcels: r.solution.length, pairs: 0, good: +q.toFixed(2), from: 'stazzi', solution: L.solution }); }
  }
  return null;
}
module.exports = { plan, make, stepOf, diffOf };
if (require.main === module) {
  const P = plan();
  if (process.argv[2] === 'write') { require('./write-100.js')(P); return; }
  const k = +process.argv[2] || 0, nW = +process.argv[3] || 1, used = new Set(), reuse = {};
  fs.mkdirSync(OUT, { recursive: true });
  P.forEach((slot, i) => { if (slot.fl === 'num' && slot.step >= 4 && !slot.big) reuse[i] = stazziFits(slot, used); });   // same in every worker
  P.forEach((slot, i) => {
    if (i % nW !== k) return;
    const file = path.join(OUT, 'slot-' + (i + 1) + '.json'); if (fs.existsSync(file)) return;
    let L = reuse[i] || null;
    for (let seed = 1 + i * 10000; !L && seed < i * 10000 + 3000; seed++) L = slot.step >= 4 || slot.big ? makeRev(slot, seed) : make(slot, seed);
    if (!L) { console.log('slot', i + 1, 'FAILED', JSON.stringify(slot)); return; }
    fs.writeFileSync(file, JSON.stringify(Object.assign(L, { slot: i + 1, fl: slot.fl, teach: !!slot.teach })));
    console.log('slot', i + 1, 'step', L.step, L.w + 'x' + L.h, 'parcels', L.parcels, 'pairs', L.pairs, 'good', L.good);
  });
}
