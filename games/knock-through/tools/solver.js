/* Knock Through — solver. The order of knocks does not matter, only which rooms end up together, so solving = splitting the rooms
   into connected groups whose sizes are the order (exact cover). Rooms: up to 30 (bit masks).
   solve(L) -> { sols (up to CAP), firstMoves, goodFirst, groups } — goodFirst: walls (neighbouring room pairs) that lie inside
   a group of some solution; any other first knock is a trap. */
const CAP = 400;
function graph(L) {
  const ids = {}, size = [], cellRoom = [];
  for (let r = 0; r < L.h; r++) for (let c = 0; c < L.w; c++) { const ch = L.rows[r][c]; if (!(ch in ids)) { ids[ch] = size.length; size.push(0); } size[ids[ch]]++; cellRoom.push(ids[ch]); }
  const n = size.length, adj = new Array(n).fill(0), pairs = new Set();
  for (let r = 0; r < L.h; r++) for (let c = 0; c < L.w; c++) {
    const a = cellRoom[r * L.w + c];
    for (const [rr, cc] of [[r, c + 1], [r + 1, c]]) {
      if (rr >= L.h || cc >= L.w) continue; const b = cellRoom[rr * L.w + cc]; if (a === b) continue;
      adj[a] |= 1 << b; adj[b] |= 1 << a; pairs.add(Math.min(a, b) * 64 + Math.max(a, b));
    }
  }
  return { n, size, adj, pairs: [...pairs].map(k => [Math.floor(k / 64), k % 64]), cellRoom };
}
function bits(m) { const r = []; for (let i = 0; m; i++, m >>>= 1) if (m & 1) r.push(i); return r; }
function solve(L) {
  const G = graph(L); if (G.n > 30) throw new Error('too many rooms');
  const order = L.order.slice().sort((a, b) => b - a), maxT = order[0];
  const together = new Set(); let sols = 0; const first = [];
  function groupsWith(u, free, wantSet) {                                // connected sets of free rooms that contain u, size sum in wantSet
    const out = [], seen = new Set();
    (function grow(S, sum) {
      if (seen.has(S)) return; seen.add(S);
      if (wantSet.has(sum)) out.push([S, sum]);
      let f = 0; for (const i of bits(S)) f |= G.adj[i]; f &= free & ~S;
      for (const j of bits(f)) if (sum + G.size[j] <= maxT) grow(S | (1 << j), sum + G.size[j]);
    })(1 << u, G.size[u]);
    return out;
  }
  (function rec(free, left, chosen) {
    if (sols >= CAP) return;
    if (!free) { if (!left.length) { sols++; if (!first.length) first.push(...chosen); for (const S of chosen) { const b = bits(S); for (const x of b) for (const y of b) if (x < y && (G.adj[x] & (1 << y))) together.add(x * 64 + y); } } return; }
    const u = bits(free)[0];
    for (const [S, sum] of groupsWith(u, free, new Set(left))) { const k = left.indexOf(sum); const l2 = left.slice(); l2.splice(k, 1); rec(free & ~S, l2, chosen.concat([S])); }
  })((1 << G.n) - 1 >>> 0, order, []);
  const good = G.pairs.filter(([a, b]) => together.has(a * 64 + b)).length;
  return { sols, firstMoves: G.pairs.length, goodFirst: good, rooms: G.n, groups: first };
}
module.exports = { solve, graph, bits };
