/* The Gap — offline BFS solver on the Postie engine (levels come with stazzi's saved optimal solutions; this re-checks `best`).
   Not used by the game. Run: node games/the-gap/tools/solve.js */
var path = require('path');
global.Postie = global.Postie || require(path.join(__dirname, '../../../web/kit/kit.js'));
require(path.join(__dirname, '../engine.js'));
var E = Postie.engines['the-gap'], DIRS = ['right', 'left', 'down', 'up'];
function key(s) { return s.field.join('') + '|' + s.flasks.map(function (f) { return f.join(''); }).join('/'); }
function optimal(L) {
  var start = E.fresh(L), seen = {}, q = [[start, null]], head = 0;
  seen[key(start)] = 1;
  while (head < q.length) {
    var it = q[head++], s = it[0], acts = [];
    for (var y = 0; y < s.h; y++) for (var x = 0; x < s.w; x++) if (E.at(s, x, y) > 0) DIRS.forEach(function (d) { acts.push([x, y, d]); });
    for (var n = 1; n <= s.flasks.length; n++) acts.push([n]);
    for (var i = 0; i < acts.length; i++) {
      var c = E.clone(s); if (!E.step(c, acts[i])) continue;
      var k = key(c); if (seen[k]) continue; seen[k] = 1;
      var node = [c, { m: acts[i], prev: it[1] }];
      if (E.won(c)) { var sol = []; for (var p = node[1]; p; p = p.prev) sol.unshift(p.m); return sol; }
      q.push(node);
    }
  }
  return null;
}
module.exports = { optimal: optimal };
if (require.main === module) {
  require(path.join(__dirname, '../levels.js'));
  Postie.levels['the-gap'].forEach(function (L, i) { var s = optimal(L); console.log('level ' + (i + 1) + ' ' + L.name + ': BFS optimum ' + (s ? s.length : 'none') + ', stored best ' + L.best); });
}
