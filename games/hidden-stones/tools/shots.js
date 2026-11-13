/* Hidden Stones — finds, for every level, a short set of shots whose results leave exactly one placement of k stones.
   That set becomes level.solution.shots (a deduction-fair way to the answer). Greedy: each next shot is the one that
   splits the still-possible placements best. Ray rules = stazzi tools/hidden-stones-solver.mjs (copied in engine.js).
   Run: node games/hidden-stones/tools/shots.js   (prints one line per level: shots, count) */
const path = require('path');
global.Postie = require(path.join(__dirname, '../../../web/kit/kit.js'));
require('../levels.js'); require('../engine.js');
const E = Postie.engines['hidden-stones'], LEVELS = Postie.levels['hidden-stones'];

function combos(m, k) { const out = [], cur = []; (function rec(s) { if (cur.length === k) { out.push(cur.slice()); return; } for (let i = s; i < m; i++) { cur.push(i); rec(i + 1); cur.pop(); } })(0); return out; }

LEVELS.forEach((L, li) => {
  const n = L.n, P = 4 * n, all = combos(n * n, L.k), cols = [];
  const code = r => r === 'H' ? -1 : r === 'R' ? -2 : r;
  const res = (ci, p) => { if (!cols[p]) { cols[p] = new Int16Array(all.length); for (let i = 0; i < all.length; i++) cols[p][i] = code(E.trace(n, all[i], p).res); } return cols[p][ci]; };
  const truth = all.findIndex(c => c.join() === L.stones.slice().sort((a, b) => a - b).join());
  let alive = all.map((_, i) => i); const shots = [], known = new Set();
  while (alive.length > 1) {
    let best = -1, bestScore = Infinity;
    for (let p = 0; p < P; p++) {
      if (known.has(p)) continue;
      const buckets = new Map(); for (const ci of alive) { const r = res(ci, p); buckets.set(r, (buckets.get(r) || 0) + 1); }
      let score = 0; buckets.forEach(v => { score += v * v; });  // expected size of what stays
      if (score < bestScore) { bestScore = score; best = p; }
    }
    const want = res(truth, best); shots.push(best); known.add(best);
    const r = E.trace(n, all[truth], best).res; if (typeof r === 'number') known.add(r);  // exit port is revealed too
    alive = alive.filter(ci => res(ci, best) === want);
  }
  console.log(JSON.stringify({ level: li + 1, shots, count: shots.length }));
});
