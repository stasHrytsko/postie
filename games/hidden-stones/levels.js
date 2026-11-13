/* Hidden Stones — all 15 levels, same order as stazzi apps/casual/hidden-stones/tools/hidden-stones-levels.json
   (generator tools/hidden-stones-solver.mjs, PLAN seeds 11…131; every placement is the only one that fits all ray results).
   n: grid size (n×n). k: stones to find. stones: hidden stone cells, index r*n+c (the answer; the screen never shows it).
   difficulty: 1 easy · 2 medium · 3 hard — by stone count: 1–2 stones → 1, 3–4 → 2, 5 → 3.
   solution: { shots: edge ports to fire (0..n-1 top, n..2n-1 right, 2n..3n-1 bottom, 3n..4n-1 left), marks: cells to mark }.
   The shots were found by tools/shots.js: after them exactly one placement of k stones fits every result seen.
   No best: stazzi has no optimal shot count (the shots list is a short greedy one, not proven minimal). */
Postie.addLevels('hidden-stones', [
  { n: 5, k: 1, stones: [12], difficulty: 1,
    solution: { shots: [1], marks: [12] } },
  { n: 5, k: 1, stones: [2], difficulty: 1,
    solution: { shots: [1, 0], marks: [2] } },
  { n: 5, k: 2, stones: [12, 24], difficulty: 1,
    solution: { shots: [2, 7, 11, 3, 1, 4], marks: [12, 24] } },
  { n: 5, k: 2, stones: [12, 21], difficulty: 1,
    solution: { shots: [2, 7, 11, 1, 0], marks: [12, 21] } },
  { n: 6, k: 2, stones: [2, 29], difficulty: 1,
    solution: { shots: [2, 15, 19, 4], marks: [2, 29] } },
  { n: 6, k: 3, stones: [11, 15, 35], difficulty: 2,
    solution: { shots: [1, 2, 22, 3, 4], marks: [11, 15, 35] } },
  { n: 6, k: 3, stones: [5, 24, 27], difficulty: 2,
    solution: { shots: [1, 16, 4], marks: [5, 24, 27] } },
  { n: 6, k: 4, stones: [3, 6, 31, 33], difficulty: 2,
    solution: { shots: [1, 0, 2, 16, 7, 22, 9], marks: [3, 6, 31, 33] } },
  { n: 6, k: 3, stones: [4, 19, 27], difficulty: 2,
    solution: { shots: [1, 2, 15, 4, 11], marks: [4, 19, 27] } },
  { n: 6, k: 4, stones: [7, 10, 31, 34], difficulty: 2,
    solution: { shots: [1, 0, 10, 3, 21, 22], marks: [7, 10, 31, 34] } },
  { n: 6, k: 4, stones: [5, 12, 25, 34], difficulty: 2,
    solution: { shots: [1, 0, 2, 18, 15, 10, 8], marks: [5, 12, 25, 34] } },
  { n: 6, k: 4, stones: [5, 21, 29, 33], difficulty: 2,
    solution: { shots: [1, 2, 6, 11, 3, 23, 14], marks: [5, 21, 29, 33] } },
  { n: 6, k: 5, stones: [4, 12, 16, 25, 28], difficulty: 3,
    solution: { shots: [0, 1, 16, 17, 23, 3, 7, 9, 2, 21], marks: [4, 12, 16, 25, 28] } },
  { n: 6, k: 5, stones: [8, 17, 18, 31, 35], difficulty: 3,
    solution: { shots: [0, 1, 5, 4, 11, 15, 9, 10, 13, 14, 12, 16, 19, 20], marks: [8, 17, 18, 31, 35] } },
  { n: 6, k: 5, stones: [3, 6, 22, 31, 35], difficulty: 3,
    solution: { shots: [0, 1, 2, 16, 7, 8, 22, 23, 20, 10, 12], marks: [3, 6, 22, 31, 35] } }
]);
