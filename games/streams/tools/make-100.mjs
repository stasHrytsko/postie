// Streams — 100 levels by games/GENERATOR.md (author 2026-11-19: the fork from the very first level — it is what makes the game;
// harder by more branches (up to 3), drops with the pool, and the board up to 8×8).
//   0      (view.js) teaches the fork
//   1–8    trunk + 2 branches, no pool, 3×3 → 5×5
//   9–30   2 → 3 branches, no pool, 4×4 → 6×5
//   31     teaches drops and the pool (teach: the hand up to the first drop)
//   32–80  mix: no pool / pool with drops (2 branches: the pool forces switching), 5×5 → 7×7
//   81–100 finale, hard: 8×8 with 3 branches (no pool) and 6×6 with drops that force switching (bigger boards: the pool cuts no ways)
// Built from the answer (stazzi gen-levels.mjs): a random cover of the board by the trunk and branches first, the level is its skeleton.
// Measures: cells (<=12 → 1, <=16 → 2, <=20 → 3, <=25 → 4, <=30 → 5, more → 6; 49+ cells add 1: a big board takes long to read) and traps along the answer (share of the moves that
// keep a cover possible, averaged over the moments with a choice); a pool that forces switching adds 1. step = ceil(average).
// Run: node make-100.mjs k n (workers) · node make-100.mjs write
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { covers, neighbours, play, playSequential, minEnergy, analyze } from './solver.mjs';
const require = createRequire(import.meta.url);
globalThis.Postie = require('../../../web/kit/kit.js');
require('../engine.js');
const E = Postie.engines.streams;
const OUT = new URL('./out/', import.meta.url);

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (rand, list) => list[Math.floor(rand() * list.length)];

/* stazzi randomCover: one path (B = 1) or a trunk with B branches; the answer comes first */
function randomCover(w, h, B, rand) {
  const n = w * h, nb = neighbours(w, h), visited = new Uint8Array(n);
  const freeDeg = (cell) => nb[cell].filter((v) => visited[v] === 0).length;
  const step = (path) => { const tip = path[path.length - 1]; const o = nb[tip].filter((v) => visited[v] === 0); if (!o.length) return false; o.sort((a, b) => freeDeg(a) - freeDeg(b) + (rand() - 0.5) * 1.6); visited[o[0]] = 1; path.push(o[0]); return true; };
  const start = Math.floor(rand() * n); visited[start] = 1; const trunk = [start];
  if (B === 1) { while (trunk.length < n && step(trunk)); if (trunk.length !== n) return null; return { sk: { w, h, start, fork: null, arrows: [], finish: [trunk[n - 1]] }, paths: [trunk] }; }
  const trunkSteps = 2 + Math.floor(rand() * 4);
  for (let i = 0; i < trunkSteps; i++) if (!step(trunk)) return null;
  const fork = trunk[trunk.length - 1], starts = nb[fork].filter((v) => visited[v] === 0);
  if (starts.length < B) return null;
  starts.sort(() => rand() - 0.5);
  const branches = starts.slice(0, B).map((a) => { visited[a] = 1; return [a]; });
  let alive = true; while (alive) { alive = false; for (const b of [...branches].sort(() => rand() - 0.5)) if (step(b)) alive = true; }
  if (visited.some((x) => x === 0) || branches.some((b) => b.length < 3)) return null;
  return { sk: { w, h, start, fork, arrows: branches.map((b) => b[0]), finish: branches.map((b) => b[b.length - 1]) }, paths: [trunk, ...branches] };
}
function randomDrops(sk, paths, count, rand) {
  const banned = new Set([sk.start, ...(sk.fork === null ? [] : [sk.fork]), ...sk.arrows, ...sk.finish]);
  const cells = paths.flatMap((p, i) => (sk.fork !== null && i === 0 ? [] : p)).filter((c) => !banned.has(c));
  if (cells.length < count) return null;
  const chosen = new Set(); while (chosen.size < count) chosen.add(pick(rand, cells));
  return new Map([...chosen].map((c) => [c, 2 + Math.floor(rand() * 5)]));
}

/* traps along the answer: at every moment with a choice, the share of legal steps that keep some cover possible */
function trapShare(L, list, order) {
  let s = E.fresh(L), alive = list.slice(), sum = 0, k = 0;
  const lines = L.arrows.length + 1;
  for (const [line, cell] of order) {
    let legal = 0, good = 0;
    for (let ln = 0; ln < lines; ln++) {
      const tip = E.tipOf(L, s, ln);
      if (tip === null || tip === undefined) continue;
      for (const v of E.neighbours(L, tip)) {
        const t = E.clone(s); if (!E.step(L, t, ln, v)) continue;
        legal++;
        const pre = t.lines[ln];
        if (alive.some((p) => pre.every((c, i) => p[ln][i] === c))) good++;
      }
    }
    if (legal > 1) { sum += good / legal; k++; }
    E.step(L, s, line, cell);
    alive = alive.filter((p) => s.lines[line].every((c, i) => p[line][i] === c));
  }
  return k ? sum / k : 1;
}
const stepP = (n) => n <= 12 ? 1 : n <= 16 ? 2 : n <= 20 ? 3 : n <= 25 ? 4 : n <= 30 ? 5 : 6;   // tuned after the first run: a line through 16 cells is still easy
const stepQ = (q) => q >= 0.999 ? 1 : q >= 0.75 ? 2 : q >= 0.5 ? 3 : q >= 0.3 ? 4 : q >= 0.18 ? 5 : 6;
const diffOf = (st) => st <= 2 ? 1 : st <= 4 ? 2 : 3;

export function plan() {
  const P = [], add = (w, h, B, pool, extra) => P.push(Object.assign({ w, h, B, pool }, extra || {}));
  [[3, 3], [3, 3], [4, 3], [4, 4], [4, 4], [5, 4], [5, 4], [5, 5]].forEach(([w, h]) => add(w, h, 2, false));
  const early = [[4, 4], [5, 4], [5, 5], [5, 5], [6, 5], [6, 5]];
  for (let i = 9; i <= 30; i++) { const sz = early[Math.min(5, Math.floor((i - 9) / 22 * 6 + (i % 2) * 0.5))]; add(sz[0], sz[1], i >= 15 && sz[0] * sz[1] >= 20 && i % 3 !== 0 ? 3 : 2, false); }
  add(4, 4, 2, true, { teach: 'pool' });
  const mid = [[5, 5], [6, 5], [6, 6], [6, 6], [7, 7]];   // pool levels stay at 6×6 at most: on 7×7 the pool hardly cuts any way
  for (let i = 32; i <= 80; i++) {
    let sz = mid[Math.min(4, Math.floor((i - 32) / 49 * 5))]; const pool = i % 2 === 0; if (pool && sz[0] > 6) sz = [6, 6];
    const B = sz[0] * sz[1] >= 25 && i % 3 === 0 ? 3 : 2;
    add(sz[0], sz[1], B, pool, { interleave: pool && B === 2 && i >= 45 });
  }
  for (let i = 81; i <= 100; i++) {
    if (i % 2) add(8, 8, 3, false, { hard: true });
    else add(6, 6, 2, true, { interleave: true, hard: true });   // finale with drops: 6×6, the pool forces switching
  }
  return P;
}
export function make(slot, seed) {
  const rand = rng(seed * 7919 + slot.w * 31 + slot.h);
  const made = randomCover(slot.w, slot.h, slot.B, rand); if (!made) return null;
  const all = covers(made.sk, slot.w * slot.h >= 64 ? 200000 : slot.w * slot.h >= 49 ? 60000 : 6000); if (all.truncated) return null;
  let drops = new Map(), energy = null;
  if (slot.pool) {
    let ok = false;
    for (let t = 0; t < 12 && !ok; t++) {
      const d = randomDrops(made.sk, made.paths, slot.B === 1 ? 2 : Math.max(3, Math.round(slot.w * slot.h / 8)), rand); if (!d) break;
      const e = minEnergy(made.paths, d, slot.w * slot.h); if (e === null || e < 3) continue;   // whether the pool bites is measured below: how many ways it cuts
      let feasible = 0, seq = 0;
      for (const p of all.list) { if (!play(p, d, e).ok) continue; feasible++; if (playSequential(p, d, e)) seq++; }
      if (feasible < 1 || feasible > Math.max(3, all.list.length * (slot.B >= 3 ? 0.3 : 0.05))) continue;   // the pool must cut most ways (3 branches: most, not all but three)
      if (slot.interleave && seq > 0) continue;
      drops = d; energy = e; ok = true;
    }
    if (!ok) return null;
  }
  const L = { w: slot.w, h: slot.h, start: made.sk.start, fork: made.sk.fork, arrows: made.sk.arrows, finish: made.sk.finish, drops: [...drops.entries()], energy };
  const a = analyze(L); if (!a.best) return null;
  const order = a.best.order;
  const q = trapShare(L, all.list.filter((p) => play(p, drops, energy).ok), order);
  let st = Math.ceil((stepP(slot.w * slot.h) + stepQ(q)) / 2);
  if (a.needsSwitch) st = Math.min(6, st + 1);
  if (slot.w * slot.h >= 49) st = Math.min(6, st + 1);
  /* check the answer on the real engine */
  const s = E.fresh(L); for (const [line, cell] of order) if (!E.step(L, s, line, cell)) return null;
  if (!E.won(s)) return null;
  const extra = {};
  if (slot.teach === 'pool') { const i = order.findIndex(([, c]) => drops.has(c)); if (i < 0) return null; extra.teach = i + 1; }
  return Object.assign(L, { step: st, difficulty: diffOf(st), covers: all.list.length, good: +q.toFixed(2), switch: a.needsSwitch, seed, solution: order }, extra);
}
const P = plan();
const main = (process.argv[1] || '').endsWith('make-100.mjs');
if (!main) { /* imported */ } else if (process.argv[2] === 'write') {
  const Ls = P.map((s, i) => JSON.parse(readFileSync(new URL('slot-' + (i + 1) + '.json', OUT), 'utf8')));
  Ls.forEach((x) => { let st = Math.ceil((stepP(x.w * x.h) + stepQ(x.good)) / 2); if (x.switch) st = Math.min(6, st + 1); if (x.w * x.h >= 49) st = Math.min(6, st + 1); x.step = st; x.difficulty = diffOf(st); });   // the measure as it is now
  const poolAt = P.findIndex((s) => s.teach === 'pool') + 1;
  const body = Ls.map((x, i) => {
    const needs = x.energy !== null && i + 1 !== poolAt ? poolAt : null;
    return `  { w: ${x.w}, h: ${x.h}, start: ${x.start}, fork: ${x.fork}, arrows: [${x.arrows.join(', ')}], finish: [${x.finish.join(', ')}], drops: ${JSON.stringify(x.drops).replace(/,/g, ', ')}, energy: ${x.energy},\n    step: ${x.step}, difficulty: ${x.difficulty}, covers: ${x.covers}, good: ${x.good},${x.teach ? ' teach: ' + x.teach + ',' : ''}${needs ? ' needs: ' + needs + ',' : ''} seed: ${x.seed},\n    solution: ${JSON.stringify(x.solution).replace(/,/g, ', ')} }`;
  }).join(',\n');
  writeFileSync(new URL('../levels.js', import.meta.url), `/* Streams — 100 levels, made by tools/make-100.mjs (games/GENERATOR.md). Cells are indexes r * w + c.
   start: the start dot. fork: fork cell (null = one line). arrows[k]: first cell of branch k+1. finish[k]: its ring (no fork: the line's ring).
   drops: [cell, +X]. energy: the shared pool of moves at the start; null = no pool (author 2026-11-19: no pool first, drops come later).
   solution: steps [line, cell] in play order (line 0 = trunk). step 1..6 from cells and traps (+1 if the pool forces switching branches);
   difficulty: 1–2 → 1, 3–4 → 2, 5–6 → 3. Every level forks (author 2026-11-19). teach: the hand shows the first N steps (31: the pool). needs: comes in a letter only after
   that level. covers: ways to cover the board; good: share of steps that keep a cover possible. */
Postie.addLevels('streams', [
${body}
]);
`);
  const c = {}; Ls.forEach((x) => c[x.difficulty] = (c[x.difficulty] || 0) + 1); console.log('wrote', Ls.length, JSON.stringify(c));
} else {
  const k = +(process.argv[2] || 0), nW = +(process.argv[3] || 1); mkdirSync(OUT, { recursive: true });
  P.forEach((slot, i) => {
    if (i % nW !== k) return; const f = new URL('slot-' + (i + 1) + '.json', OUT); if (existsSync(f)) return;
    let L = null; for (let seed = 1 + i * 10000; !L && seed < i * 10000 + 6000; seed++) { L = make(slot, seed); if (L && slot.hard && L.difficulty !== 3) L = null; }
    if (!L) { console.log('slot', i + 1, 'FAILED', JSON.stringify(slot)); return; }
    writeFileSync(f, JSON.stringify(L)); console.log('slot', i + 1, slot.w + 'x' + slot.h, 'B', slot.B, 'pool', !!slot.pool, 'step', L.step, 'covers', L.covers, 'good', L.good, 'switch', L.switch);
  });
}
