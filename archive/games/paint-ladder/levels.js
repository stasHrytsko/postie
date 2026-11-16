/* Paint Ladder — all levels (1, from IDEA.md «Уровень прототипа», verified by brute force 4^7 in postie 2026-11-03: 45 solutions, min 4 swaps).
   Colours: A apricot, B blue, S sage, Y butter. start/goal: 4 lanes, left to right.
   paint: rows 1..moves bottom to top, each a 4-char string ('.' = no paint).
   solution: per move, the swap before it — null or i (swap lanes i and i+1, 0-based). difficulty: 1 easy · 2 medium · 3 hard. */
Postie.addLevels('paint-ladder', [
  { start: 'SABY', goal: 'AYBB', paint: ['AS..', '.AA.', 'S.A.', 'A..Y', '.AY.', '.BY.', '....'], difficulty: 1,
    solution: [null, 2, null, 2, 2, null, 1] }
]);
