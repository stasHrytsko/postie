/* Replays every level's stored solution (the stazzi sample) through the engine: must win, in exactly `best` moves,
   and not before the last action. Also checks the stazzi level rules: strips cover more cells than the pattern colours
   (so overlaps are needed) and no strip is fully hidden in the solution. Run: node tests/run.js carpet-layers */
module.exports = function (E, LEVELS, check) {
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = !E.won(s), bad = '';
    L.solution.forEach(function (a, i) {
      if (!ok) return;
      var done = a[0] === 'd' ? E.drop(L, s, a[1], a[2], a[3]) : E.removeById(L, s, a[1]);
      if (!done) { ok = false; bad = 'action ' + (i + 1) + ' refused'; }
      else if (E.won(s) && i < L.solution.length - 1) { ok = false; bad = 'won early'; }
    });
    var len = 0, colored = E.pattern(L).filter(Boolean).length;
    L.strips.forEach(function (st) { len += st.c.length; });
    /* every strip shows at least one cell (glass counts when it mixes) */
    var seen = {}, n = L.size, stacks = []; for (var i = 0; i < n * n; i++) stacks.push([]);
    s.placed.slice().sort(function (a, b) { return a.z - b.z; }).forEach(function (p) {
      var st = L.strips[p.id]; E.cells(st, p.r, p.c).forEach(function (rc, j) { stacks[rc[0] * n + rc[1]].push({ id: p.id, c: +st.c[j], clear: !!st.clear }); });
    });
    stacks.forEach(function (st) { for (var j = st.length - 1; j >= 0; j--) { seen[st[j].id] = 1; var b = st[j - 1]; if (!(st[j].clear && b && (st[j].c + b.c === 6) && st[j].c !== b.c)) break; } });
    var hidden = L.strips.filter(function (_, j) { return !seen[j]; }).length;
    check('level ' + (k + 1) + ' solution (' + s.moves + ' moves, best ' + L.best + ', ' + n + '×' + n + ')',
      ok && E.won(s) && s.moves === L.best && len > colored && hidden === 0, bad || (s.moves !== L.best ? 'moves ' + s.moves : '') || (len <= colored ? 'no overlap needed' : '') || (hidden ? hidden + ' hidden strips' : ''));
  });
};
