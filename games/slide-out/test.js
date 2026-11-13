/* Replays every level's stored solution (the stazzi solver route) through the engine. Run: node tests/run.js slide-out */
module.exports = function (E, LEVELS, check) {
  var DIR = { u: 'up', d: 'down', l: 'left', r: 'right' };
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = s.status === 'playing', bad = '';
    L.solution.forEach(function (m, i) {
      if (!ok) return;
      if (!E.move(s, m[0], DIR[m[1]])) { ok = false; bad = 'move ' + (i + 1) + ' invalid'; }
      else if (s.status === 'failed') { ok = false; bad = 'counter ran out at move ' + (i + 1); }
      else if (s.status === 'won' && i < L.solution.length - 1) { ok = false; bad = 'won early'; }
    });
    check('level ' + (k + 1) + ' solution (' + s.moves + ' swipes, ' + L.goals.length + ' goals)', ok && E.won(s), bad);
  });
};
