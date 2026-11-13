/* Recruit Ladder — solver and levels.js writer. Port of stazzi src/engine/solver.ts `census`: tries all 4^7 ladders through the
   Postie engine and keeps the shortest one (fewest swaps; ties — first found in order none,0,1,2 per row).
   Run from repo root: node games/recruit-ladder/tools/solver.js <stazzi-levels.json>   (JSON = stazzi LEVELS: {grid:(0..3|null)[7][4], need:number[][]})
   Writes games/recruit-ladder/levels.js. */
const path = require('path'), fs = require('fs');
global.Postie = require(path.join(__dirname, '../../../web/kit/kit.js'));
require(path.join(__dirname, '../engine.js'));
const E = Postie.engines['recruit-ladder'];
const src = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const RUNGS = [-1, 0, 1, 2];
function census(L) {
  let wins = 0, best = null; const r = [];
  (function dfs(i) {
    if (i === 7) {
      const s = E.fresh(L); r.forEach((k) => { if (k >= 0) E.swap(s, k); E.step(s); });
      if (E.won(s)) { wins++; if (!best || s.swaps < best.swaps) best = { swaps: s.swaps, rungs: r.slice() }; }
      return;
    }
    for (const k of RUNGS) { r.push(k); dfs(i + 1); r.pop(); }
  })(0);
  return { wins, rate: wins / 16384, best };
}
const out = src.map((lv, i) => {
  const L = { grid: lv.grid.map((row) => row.map((x) => (x === null ? '.' : String(x))).join('')), need: lv.need.map((n) => n.join('')) };
  const c = census(L);
  const d = c.rate >= 0.025 ? 1 : c.rate >= 0.01 ? 2 : 3;
  console.log(`level ${i + 1}: ${c.wins} winning ladders (${(c.rate * 100).toFixed(2)}%), shortest ${c.best.swaps} swaps, difficulty ${d}`);
  return `  { grid: ${JSON.stringify(L.grid)}, need: ${JSON.stringify(L.need)}, difficulty: ${d}, best: ${c.best.swaps}, solution: ${JSON.stringify(c.best.rungs)} }`;
});
fs.writeFileSync(path.join(__dirname, '../levels.js'),
`/* Recruit Ladder — all 15 levels from stazzi apps/midcore/recruit-ladder/src/engine/levels.ts, same order (written by tools/solver.js).
   grid: 7 rows, row 0 first = the row just above the recruits (the screen shows it at the bottom). Each row is 4 chars, one per lane
     left to right: '.' empty, '0' Dojo, '1' Range, '2' Bastion, '3' Temple.
   need: per lane, left to right, the schools the recruit ending on that lane must remember (digits, order doesn't matter).
   solution: per row, the swap made before stepping onto it: -1 none, k = lanes k and k+1 (0-based). It is the shortest found by
     the solver (all 4^7 ladders); best = its number of swaps. difficulty (1 easy · 2 medium · 3 hard) from the share of all 16 384
     ladders that win: >= 2.5% -> 1, 1–2.5% -> 2, < 1% -> 3. */
Postie.addLevels('recruit-ladder', [
${out.join(',\n')}
]);
`);
