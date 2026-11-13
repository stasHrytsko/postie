/* Arrow Flip — offline solver (port of stazzi flipEngine.ts solve/optimalSolution). Not used by the game.
   Iterative deepening from limit = blocks; DFS prunes "more blocks than moves left" (a move removes at most one block)
   and remembers failed positions. Run: node games/arrow-flip/tools/solve.js  -> prints best length, random-player win rate and difficulty per level. */
var path = require('path');
global.Postie = global.Postie || require(path.join(__dirname, '../../../web/kit/kit.js'));
require(path.join(__dirname, '../engine.js'));
var E = Postie.engines['arrow-flip'];

function gridKey(s) { var a = []; for (var i = 0; i < s.size * s.size; i++) a.push('.'); s.blocks.forEach(function (b) { a[b.r * s.size + b.c] = b.d; }); return a.join(''); }
function solve(s0, limit) {
  var failed = {}, out = [];
  function dfs(s, left) {
    if (!s.blocks.length) return true;
    if (s.blocks.length > left) return false;
    var k = gridKey(s); if ((failed[k] === undefined ? -1 : failed[k]) >= left) return false;
    var opts = s.blocks.map(function (b) { return { b: b, p: E.plan(s, b.id) }; }).filter(function (o) { return o.p; });
    opts.sort(function (x, y) { return Number(y.p.exited) - Number(x.p.exited); });
    for (var i = 0; i < opts.length; i++) {
      var n = E.clone(s), b = opts[i].b; out.push([b.r, b.c]); E.tap(n, b.id);
      if (dfs(n, left - 1)) return true;
      out.pop();
    }
    failed[k] = left; return false;
  }
  return dfs(s0, limit) ? out : null;
}
function optimal(L, maxExtra) {
  var s = E.fresh(L);
  for (var extra = 0; extra <= (maxExtra || 14); extra++) { var sol = solve(E.clone(s), s.blocks.length + extra); if (sol) return sol; }
  return null;
}
/* Difficulty (same measure as stazzi SPEC §6 "random player"): share of wins of a player who taps a random legal block,
   4000 runs, fixed seed. >= 75% -> 1 easy, 40..75% -> 2 medium, < 40% -> 3 hard. */
function randomWins(L, runs) {
  var seed = 36, N = runs || 4000, win = 0;
  function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
  for (var t = 0; t < N; t++) {
    var s = E.fresh(L);
    for (;;) { var m = s.blocks.filter(function (b) { return E.plan(s, b.id); }); if (!m.length) break; E.tap(s, m[Math.floor(rnd() * m.length)].id); }
    if (E.won(s)) win++;
  }
  return win / N;
}
function difficulty(L) { var w = randomWins(L); return w >= 0.75 ? 1 : w >= 0.4 ? 2 : 3; }
module.exports = { optimal: optimal, randomWins: randomWins, difficulty: difficulty };
if (require.main === module) {
  require(path.join(__dirname, '../levels.js'));
  Postie.levels['arrow-flip'].forEach(function (L, i) { var s = optimal(L); console.log('level ' + (i + 1) + ': best ' + (s ? s.length : 'none') + ', random player wins ' + Math.round(randomWins(L) * 100) + '% -> difficulty ' + difficulty(L)); });
}
