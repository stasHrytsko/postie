/* Replays every level's stored solution through the engine: each piece goes to the first unused number of its size,
   every placement must be accepted, and the last one must win (board full, all numbers used).
   Also checks the data: numbers add up to the empty cells. Run: node tests/run.js perfect-fit */
module.exports = function (E, LEVELS, check) {
  LEVELS.forEach(function (L, k) {
    var s = E.fresh(L), ok = !E.won(s), empty = L.map.join('').split('.').length - 1;
    var sum = L.nums.reduce(function (a, b) { return a + b; }, 0);
    L.solution.forEach(function (flat, j) {
      if (!ok) return;
      var cells = []; for (var t = 0; t < flat.length; t += 2) cells.push([flat[t], flat[t + 1]]);
      var i = E.indexFor(s, cells.length);
      if (i < 0 || !E.place(s, i, cells)) ok = false;
      else if (E.won(s) !== (j === L.solution.length - 1) || E.lost(s)) ok = false;
    });
    check('level ' + (k + 1) + ' solution (' + L.solution.length + ' pieces)', ok && E.won(s) && sum === empty, sum === empty ? '' : 'numbers ' + sum + ' ≠ cells ' + empty);
  });
};
