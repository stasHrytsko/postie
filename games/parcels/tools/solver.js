/* Parcels — fast solver and difficulty (any level: numbers, dots, both). Same rules as engine.js on a compact board
   (a string, row by row: '.' plain, '2'..'9' number, 'B' / 'W' dot, ' ' empty) with prefix sums, so a frame is checked in O(1).
   test.js replays every stored solution through the real engine, so the two cannot drift apart unnoticed.
   solve(L) -> { solvable, solution, firstMoves, goodFirst } — goodFirst = first frames after which the level can still be cleared.
   difficulty(goodFirst / firstMoves): >= 0.5 -> 1 easy, 0.25–0.5 -> 2 medium, < 0.25 -> 3 hard (same scale as stazzi levels 1–30). */
const path = require('path');
global.Postie = global.Postie || require(path.join(__dirname, '../../../web/kit/kit.js'));
require(path.join(__dirname, '../engine.js'));
const E = Postie.engines.parcels;

function boardOf(L) { let b = ''; for (let r = 0; r < L.h; r++) for (let c = 0; c < L.w; c++) { const ch = (L.rows[r] || '').charAt(c) || ' '; b += ch === '_' ? ' ' : ch; } return b; }
function maker(w, h) {
  const W1 = w + 1;
  function sums(b) {                                                     // 5 tables: empty, numbers, number value, black, white
    const t = [0, 1, 2, 3, 4].map(() => new Int32Array((h + 1) * W1));
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      const ch = b[r * w + c], v = [ch === ' ' ? 1 : 0, ch >= '2' && ch <= '9' ? 1 : 0, ch >= '2' && ch <= '9' ? +ch : 0, ch === 'B' ? 1 : 0, ch === 'W' ? 1 : 0];
      for (let k = 0; k < 5; k++) t[k][(r + 1) * W1 + c + 1] = v[k] + t[k][r * W1 + c + 1] + t[k][(r + 1) * W1 + c] - t[k][r * W1 + c];
    }
    return t;
  }
  function q(t, r0, c0, r1, c1) { return t[(r1 + 1) * W1 + c1 + 1] - t[r0 * W1 + c1 + 1] - t[(r1 + 1) * W1 + c0] + t[r0 * W1 + c0]; }
  function frames(b) {
    const t = sums(b), out = [];
    for (let r0 = 0; r0 < h; r0++) for (let c0 = 0; c0 < w; c0++) for (let r1 = r0; r1 < h; r1++) for (let c1 = c0; c1 < w; c1++) {
      if (q(t[0], r0, c0, r1, c1)) break;                                // a gap: a wider frame from here has it too
      const n = q(t[1], r0, c0, r1, c1), bl = q(t[3], r0, c0, r1, c1), wh = q(t[4], r0, c0, r1, c1);
      if (n && (bl || wh)) continue;
      if (n === 1) { if ((r1 - r0 + 1) * (c1 - c0 + 1) === q(t[2], r0, c0, r1, c1)) out.push([r0, c0, r1, c1]); continue; }
      if (!n && bl === 1 && wh === 1) out.push([r0, c0, r1, c1]);
    }
    return out;
  }
  function ship(b, f) {
    const a = b.split(''), hg = f[2] - f[0] + 1;
    for (let c = f[1]; c <= f[3]; c++) {
      for (let r = f[2]; r >= hg; r--) a[r * w + c] = a[(r - hg) * w + c];
      for (let r = 0; r < hg; r++) a[r * w + c] = ' ';
    }
    return a.join('');
  }
  return { frames, ship };
}
function solve(L) {
  const M = maker(L.w, L.h), memo = new Map(), blank = ' '.repeat(L.w * L.h);
  function go(b) {
    if (b === blank) return [];
    if (memo.has(b)) return memo.get(b);
    memo.set(b, null);
    let out = null;
    for (const f of M.frames(b)) { const p = go(M.ship(b, f)); if (p) { out = [f].concat(p); break; } }
    memo.set(b, out); return out;
  }
  const b0 = boardOf(L), first = M.frames(b0);
  let good = 0, solution = null;
  for (const f of first) { const p = go(M.ship(b0, f)); if (p) { good++; if (!solution) solution = [f].concat(p); } }
  return { solvable: !!solution, solution, firstMoves: first.length, goodFirst: good };
}
function difficulty(r) { const q = r.goodFirst / r.firstMoves; return q >= 0.5 ? 1 : q >= 0.25 ? 2 : 3; }
module.exports = { E, solve, difficulty };
