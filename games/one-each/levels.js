/* One Each — all levels. Cells 0..N*N-1 left-to-right, top-to-bottom. 0 = empty, 1..3 = colour slot (Postie.PIECES order: 1 apricot/triangle, 2 blue/circle, 3 sage/square).
   solution: [from, to] moves, verified by test.js. difficulty: 1 easy · 2 medium · 3 hard (for the letter wave). */
Postie.addLevels('one-each', [
  { n: 3, start: [0, 2, 2, 1, 3, 2, 1, 1, 0], difficulty: 2, best: 10,
    solution: [[1, 0], [4, 1], [3, 4], [0, 3], [1, 0], [2, 1], [5, 8], [4, 5], [5, 2], [7, 4]] }
]);
