/* Parcels — level builder "from the end" (author's idea 2026-11-19). Start from an empty board and put parcels in one by one,
   each at some depth inside the stacks: the cubes above it in its columns move up. A parcel put under part of an older one splits it,
   so on the start board the older one is no rectangle — it only comes together after the newer one is shipped and things fall.
   Shipping the parcels in reverse order clears the board, so every level is solvable by construction; gravity is part of the answer.
   Columns may end at different heights (' ' above them), as in stazzi levels. */
const { solve } = require('./solver.js');
global.Postie = global.Postie || require('../../../web/kit/kit.js');
require('../engine.js');
const E = Postie.engines.parcels;

function rng(seed) { return () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }; }

/* spec: { w, h, n: [min, max] parcels, maxA, pairs: k, fill: share of cells to fill, deep: chance to bury a parcel } */
function build(seed, spec) {
  const rnd = rng(seed), W = spec.w, H = spec.h, cols = Array.from({ length: W }, () => []);   // bottom first
  const placed = [];
  let cells = 0, tries = 0;
  const target = Math.round(W * H * (spec.fill || 1)), nMax = spec.n[1];
  while (cells < target && placed.length < nMax && tries < 4000) {
    tries++;
    const hh = 1 + Math.floor(rnd() * (spec.side || 3)), ww = 1 + Math.floor(rnd() * (spec.side || 3)), a = hh * ww;
    if (a < (spec.minA || 2) || a > spec.maxA || ww > W || hh > H) continue;
    const c0 = Math.floor(rnd() * (W - ww + 1));
    let kmin = H, room = true;
    for (let c = c0; c < c0 + ww; c++) { kmin = Math.min(kmin, cols[c].length); if (cols[c].length + hh > H) room = false; }
    if (!room) continue;
    let lo = 0;                                                         // the parcel must stand on cubes in every column: depth <= every height
    for (let c = c0; c < c0 + ww; c++) lo = Math.max(lo, 0);
    const d = rnd() < (spec.deep == null ? 0.6 : spec.deep) ? Math.floor(rnd() * (kmin + 1)) : kmin;
    if (d > kmin) continue;
    // every column under the parcel must be filled up to depth d (it is: d <= its height); the parcel can't hang over a lower column
    let ok = true; for (let c = c0; c < c0 + ww; c++) if (cols[c].length < d) ok = false;
    if (!ok) continue;
    const id = placed.length;
    for (let c = c0; c < c0 + ww; c++) { const add = []; for (let i = 0; i < hh; i++) add.push(id); cols[c].splice(d, 0, ...add); }
    placed.push({ c0, ww, hh, d }); cells += a;
  }
  if (placed.length < spec.n[0]) return null;
  const n = placed.length, area = p => p.ww * p.hh, k = Math.min(spec.pairs, n);
  const idx = placed.map((p, i) => i).sort(() => rnd() - 0.5), pairSet = new Set(idx.slice(0, k));
  for (const i of idx) if (!pairSet.has(i) && area(placed[i]) > 9) return null;
  const mark = placed.map((p, i) => pick(rnd, area(p), pairSet.has(i)));
  const B = { W, H, cols, placed, mark, rnd };
  const L = level(B); if (!L) return null;
  return Object.assign(L, { parcels: n, pairs: k, B });
}
function pick(rnd, n, pair) { const a = Math.floor(rnd() * n); let b = Math.floor(rnd() * (n - 1)); if (b >= a) b++; return { pair, a, b }; }
/* the start board and the sample for these parcels and markers */
function level(B) {
  const { W, H, cols, placed, mark } = B, area = p => p.ww * p.hh;
  const g = Array.from({ length: H }, () => Array(W).fill(' '));
  for (let c = 0; c < W; c++) cols[c].forEach((id, z) => { g[H - 1 - z][c] = id; });
  const seenCol = placed.map(() => ({}));
  const rows = g.map((row, r) => row.map((id, c) => {
    if (id === ' ') return ' ';
    const p = placed[id], m = mark[id], j = (seenCol[id][c] = (seenCol[id][c] || 0) + 1) - 1;
    const cell = j * p.ww + (c - p.c0);
    if (m.pair) return cell === m.a ? 'B' : cell === m.b ? 'W' : '.';
    return cell === m.a ? String(area(p)) : '.';
  }).join(''));
  /* the sample: last placed ships first, at its place when it was put in */
  const solution = placed.map(p => [H - p.d - p.hh, p.c0, H - 1 - p.d, p.c0 + p.ww - 1]).reverse();
  const L = { w: W, h: H, rows };
  const s = E.fresh(L); for (const f of solution) if (!E.frame(s, f[0], f[1], f[2], f[3])) return null;
  if (!E.won(s)) return null;
  return Object.assign(L, { solution });
}
module.exports = { build, level, pick, rng };
