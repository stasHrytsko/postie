/* Shadow Step — all levels (2, from IDEA.md «Уровни прототипа», verified by brute force in postie 2026-11-03).
   board: 5 rows, '.' floor, '#' wall, 'B' blue (you), 'R' red, 'C' crystal. hand: 4 cards, each used once.
   jump: 'A' — pieces may pass over each other; 'B' — passing over the other piece on a line = loss.
   solution: [card, [row, col]] for blue. difficulty: 1 easy · 2 medium · 3 hard. */
Postie.addLevels('shadow-step', [
  { board: ['..C..', '###.R', '.....', '.....', '..B..'], hand: ['line3', 'dash2', 'diag', 'side'], jump: 'A', difficulty: 2,
    solution: [['diag', [3, 1]], ['dash2', [3, 3]], ['line3', [0, 3]], ['side', [0, 2]]] },
  { board: ['.C.#.', '#....', '##..#', '...R.', '...B.'], hand: ['dash2', 'diag', 'side', 'line3'], jump: 'B', difficulty: 2,
    solution: [['diag', [3, 4]], ['dash2', [3, 2]], ['line3', [0, 2]], ['side', [0, 1]]] }
]);
