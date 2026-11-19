/* Parcels — builds the dots and the mixed levels and rewrites levels.js (author 2026-11-19: numbers first, then dots, then both).
   1–30  numbers — stazzi levels, kept as they are in levels.js.
   dots  — Pair Up's levels 1–10 (stazzi apps/casual/pairs; level 11 with grey dots is not ported): every cell becomes a cube,
           dots stay on their cubes. Pair Up's own solution (the cover by rectangles), shipped top to bottom, clears the board,
           so every level is solvable; difficulty is measured again with gravity.
   mixed — generated: a random cover of the board by rectangles (2..MAXA cubes, no 1×1), each one gets a number = its area
           or a black and a white dot on two of its cubes. Shipped top to bottom, the cover clears the board, so the level is solvable.
           Kept only with at least 2 numbers and 2 pairs; difficulty by the solver.
   Run from the repo root: node games/parcels/tools/make-levels.js [mixedCount=15]   (seeded: the same run gives the same levels) */
const fs = require('fs'), path = require('path');
const { E, solve, difficulty } = require('./solver.js');
const FILE = path.join(__dirname, '../levels.js');
function rng(seed) { return () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }; }
function topDown(rects) { return rects.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); }
function checkCover(L, rects) { const s = E.fresh(L); for (const f of topDown(rects)) if (!E.frame(s, f[0], f[1], f[2], f[3])) return false; return E.won(s); }

/* ---- mixed: generated ---- */
function cover(w, h, maxA, rnd) {
  for (let t = 0; t < 500; t++) {
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
    if (ok) return rects;
  }
  return null;
}
function mixedLevel(seed, w, h, maxA, pairP = 0.5, corners = false) {
  const rnd = rng(seed), rects = cover(w, h, maxA, rnd); if (!rects) return null;
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  let nums = 0, pairs = 0;
  rects.forEach(f => {
    const cells = []; for (let i = f[0]; i <= f[2]; i++) for (let j = f[1]; j <= f[3]; j++) cells.push([i, j]);
    const asPair = cells.length > 9 || rnd() < pairP;                     // a number is one digit: 2..9
    if (asPair) { let a = Math.floor(rnd() * cells.length), b = Math.floor(rnd() * (cells.length - 1)); if (b >= a) b++;
      if (corners) { const x = rnd() < 0.5; a = x ? 0 : (f[3] - f[1]); b = cells.length - 1 - a; if (rnd() < 0.5) { const t = a; a = b; b = t; } } // opposite corners: the pair's frame is the whole rectangle
      g[cells[a][0]][cells[a][1]] = 'B'; g[cells[b][0]][cells[b][1]] = 'W'; pairs++; }
    else { const a = cells[Math.floor(rnd() * cells.length)]; g[a[0]][a[1]] = String(cells.length); nums++; }
  });
  if (nums < 2 || pairs < 2) return null;
  const L = { w, h, rows: g.map(r => r.join('')) };
  if (!checkCover(L, rects)) throw new Error('seed ' + seed + ': cover does not clear');
  const r = solve(L);
  return Object.assign(L, { difficulty: difficulty(r), solution: r.solution, seed, q: r.goodFirst / r.firstMoves });
}
/* Climb: keep the cover (so the level stays solvable), move markers inside their rectangles and flip number <-> pair,
   keeping a change when the share of good first frames does not grow. Same idea as stazzi parcels tools/climb-levels.mjs. */
function build(w, h, rects, marks) {
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  let nums = 0, pairs = 0;
  rects.forEach((f, k) => {
    const m = marks[k], cw = f[3] - f[1] + 1, at = i => [f[0] + Math.floor(i / cw), f[1] + i % cw];
    if (m.pair) { const a = at(m.a), b = at(m.b); g[a[0]][a[1]] = 'B'; g[b[0]][b[1]] = 'W'; pairs++; }
    else { const a = at(m.a); g[a[0]][a[1]] = String((f[2] - f[0] + 1) * cw); nums++; }
  });
  return nums >= 2 && pairs >= 2 ? { w, h, rows: g.map(r => r.join('')) } : null;
}
function climbLevel(seed, w, h, maxA, steps) {
  const rnd = rng(seed), rects = cover(w, h, maxA, rnd); if (!rects) return null;
  const area = f => (f[2] - f[0] + 1) * (f[3] - f[1] + 1);
  const pick = (f, pair) => { const n = area(f), a = Math.floor(rnd() * n); let b = Math.floor(rnd() * (n - 1)); if (b >= a) b++; return { pair, a, b }; };
  let marks = rects.map(f => pick(f, area(f) > 9 || rnd() < 0.5)), L = build(w, h, rects, marks), best = L && solve(L);
  for (let t = 0; t < 40 && !L; t++) { marks = rects.map(f => pick(f, area(f) > 9 || rnd() < 0.5)); L = build(w, h, rects, marks); best = L && solve(L); }
  if (!L) return null;
  let q = best.goodFirst / best.firstMoves;
  for (let i = 0; i < steps; i++) {
    const k = Math.floor(rnd() * rects.length), m2 = marks.slice();
    m2[k] = pick(rects[k], area(rects[k]) > 9 ? true : rnd() < 0.3 ? !marks[k].pair : marks[k].pair);
    const L2 = build(w, h, rects, m2); if (!L2) continue;
    const r2 = solve(L2), q2 = r2.goodFirst / r2.firstMoves;
    if (r2.solvable && q2 <= q) { marks = m2; L = L2; best = r2; q = q2; }
  }
  if (!checkCover(L, rects)) throw new Error('climb ' + seed + ': cover does not clear');
  return Object.assign(L, { difficulty: difficulty(best), solution: best.solution, seed, q });
}
module.exports = { mixedLevel, cover, climbLevel };
if (require.main === module) {
/* ---- dots: Pair Up 1–10 ---- */
require(path.join(__dirname, '../../../archive/games/pair-up/levels.js'));
const pairUp = Postie.levels['pair-up'];
const dots = pairUp.filter(L => !L.rows.join('').includes('G')).map((P, i) => {
  const L = { w: P.w, h: P.h, rows: P.rows.slice() };
  if (!checkCover(L, P.solution)) throw new Error('pair-up ' + (i + 1) + ': cover does not clear with gravity');
  const r = solve(L);
  return Object.assign(L, { difficulty: difficulty(r), solution: r.solution, from: 'pair-up ' + (i + 1) });
});

const want = +(process.argv[2] || 15), per = Math.round(want / 3), mixed = [];
/* easy: plain random covers; medium and hard: climbed (5×5 is enough to get hard ones; 6×6 climbs are ~40× slower) */
const bands = [[1, (sd) => mixedLevel(sd, 5, 5, 6)], [1, (sd) => mixedLevel(sd, 6, 6, 6)],
  [2, (sd) => climbLevel(sd, 5, 5, 6, 40)], [3, (sd) => climbLevel(sd, 5, 5, 6, 150)], [3, (sd) => climbLevel(sd, 6, 6, 6, 60)]];
const quota = { 1: [Math.ceil(per / 2), Math.floor(per / 2)], 2: [per], 3: [per - 1, 1] }, used = {};
bands.forEach(([d, make], i) => {
  const k = (used[d] = (used[d] || 0)), need = quota[d][k]; used[d]++;
  let got = 0;
  for (let sd = 1 + 1000 * i; got < need && sd < 1000 * i + 400; sd++) { const L = make(sd); if (L && L.difficulty === d) { mixed.push(L); got++; process.stderr.write('.'); } }
});
/* ---- write levels.js: keep 1–30 as they are ---- */
const src = fs.readFileSync(FILE, 'utf8'), lines = src.split('\n');
const numbers = lines.filter(l => /^\s*\{ rules: 'numbers'|^\s*\{ w: .*numbers|^    solution: /.test(l));
const numBlock = src.slice(src.indexOf('Postie.addLevels'), src.indexOf("  /* Postie-only") > 0 ? src.indexOf("  /* Postie-only") : src.lastIndexOf(']);'))
  .replace(/^Postie\.addLevels\('parcels', \[\n/, '').replace(/,?\s*$/, '');
const fmt = (L, note) => `  { kind: '${L.kind}', w: ${L.w}, h: ${L.h}, rows: ${JSON.stringify(L.rows).replace(/","/g, "', '").replace(/^\["/, "['").replace(/"\]$/, "']")}, difficulty: ${L.difficulty}, ${note}\n    solution: ${JSON.stringify(L.solution).replace(/,/g, ', ')} }`;
const byD = (a, b) => a.difficulty - b.difficulty;
const out = `/* Parcels — all levels (author 2026-11-19: Parcels and Pair Up are one game; numbers first, then dots, then both).
   Per level:
     kind      'numbers' | 'dots' | 'mixed' — only for order and for the solver; the rules are the same everywhere (engine.js)
     w, h      board size
     rows      top to bottom: '.' plain cube, '2'..'9' cube with a number, 'B' / 'W' cube with a black / white dot, ' ' empty
     solution  frames [r0, c0, r1, c1] (corners, inclusive) in board coordinates at the moment of the move; verified by test.js
     difficulty 1 easy · 2 medium · 3 hard — share of first frames that do not lead to a dead end: >= 0.5 -> 1, 0.25–0.5 -> 2, < 0.25 -> 3
   1–${30} numbers — stazzi apps/casual/parcels levels.json, same order, stazzi solver's 'opt'.
   ${31}–${30 + dots.length} dots — Pair Up levels 1–${dots.length} (stazzi apps/casual/pairs) on cubes, solved again with gravity (tools/make-levels.js).
   ${31 + dots.length}–${30 + dots.length + mixed.length} mixed — generated by tools/make-levels.js (seed in each level). */
Postie.addLevels('parcels', [
${numBlock.replace(/\{ rules: 'numbers',/g, "{ kind: 'numbers',")},
${dots.sort(byD).map(L => fmt(Object.assign(L, { kind: 'dots' }), `from: '${L.from}',`)).join(',\n')},
${mixed.sort(byD).map(L => fmt(Object.assign(L, { kind: 'mixed' }), `seed: ${L.seed},`)).join(',\n')}
]);
`;
fs.writeFileSync(FILE, out);
console.log('dots', dots.map(L => L.difficulty).join(''), '| mixed', mixed.map(L => L.difficulty).join(''), mixed.length);
}
