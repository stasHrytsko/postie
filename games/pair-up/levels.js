/* Pair Up — all 11 levels, same order as stazzi apps/casual/pairs/src/levels/levels.json (generator tools/gen-levels.mjs;
   level 6 is the author's level from IDEA.md; level 11 has grey dots). Every level has exactly one solution.
   rows: top to bottom; "." empty, "B" dark dot, "W" light dot, "G" grey dot.
   solution: the only solution, rectangles [r0, c0, r1, c1] (corners, rows/cols from 0). best = number of pairs (one draw per rectangle).
   look: stazzi solver metric lookSteps — how many "one step ahead" eliminations the level needs (0 = solved by "this cell has one option" alone).
   difficulty: 1 easy · 2 medium · 3 hard — by look: 0 → 1, 1–5 → 2, 6+ → 3. */
Postie.addLevels('pair-up', [
  { w: 4, h: 4, rows: ["B...", "....", ".WWB", ".W.B"], look: 0, difficulty: 1, best: 3,
    solution: [[0, 0, 2, 1], [0, 2, 2, 3], [3, 0, 3, 3]] },
  { w: 4, h: 4, rows: ["WB..", ".B.W", "WBB.", "...W"], look: 0, difficulty: 1, best: 4,
    solution: [[0, 0, 0, 3], [1, 0, 1, 3], [2, 0, 3, 1], [2, 2, 3, 3]] },
  { w: 5, h: 5, rows: [".B...", ".WW.B", ".WB..", "B....", ".WWB."], look: 2, difficulty: 2, best: 5,
    solution: [[0, 0, 1, 1], [0, 2, 1, 4], [2, 0, 2, 4], [3, 0, 4, 1], [3, 2, 4, 4]] },
  { w: 5, h: 5, rows: ["....B", "B.WB.", "..WB.", "WW..W", "..B.."], look: 3, difficulty: 2, best: 5,
    solution: [[0, 0, 4, 0], [0, 1, 1, 3], [0, 4, 4, 4], [2, 1, 2, 3], [3, 1, 4, 3]] },
  { w: 6, h: 6, rows: ["B..BW.", "..W...", "..BW..", "...W..", "B.WB..", ".B.W.."], look: 4, difficulty: 2, best: 6,
    solution: [[0, 0, 1, 2], [0, 3, 1, 5], [2, 0, 2, 5], [3, 0, 4, 2], [3, 3, 4, 5], [5, 0, 5, 5]] },
  { w: 6, h: 6, rows: ["......", "..B..W", "W..W..", ".BBBB.", "..W..B", "...W.W"], look: 5, difficulty: 2, best: 6,
    solution: [[0, 0, 5, 1], [0, 2, 2, 3], [0, 4, 3, 5], [3, 2, 5, 2], [3, 3, 5, 3], [4, 4, 5, 5]] },
  { w: 6, h: 6, rows: ["B...WW", ".BW.W.", "B..W..", "..BBBB", ".W.W..", "..B..W"], look: 6, difficulty: 3, best: 8,
    solution: [[0, 0, 0, 4], [0, 5, 4, 5], [1, 0, 1, 3], [1, 4, 4, 4], [2, 0, 2, 3], [3, 0, 4, 2], [3, 3, 4, 3], [5, 0, 5, 5]] },
  { w: 6, h: 6, rows: ["..WBWW", "W..B..", "W...BB", "B.W...", ".B.B..", "W..W.B"], look: 11, difficulty: 3, best: 8,
    solution: [[0, 0, 0, 3], [0, 4, 4, 4], [0, 5, 4, 5], [1, 0, 1, 3], [2, 0, 3, 1], [2, 2, 4, 3], [4, 0, 5, 1], [5, 2, 5, 5]] },
  { w: 6, h: 6, rows: [".W..BW", "W..B..", ".B.W..", "...B.B", "B.B.BW", "WW.W.."], look: 12, difficulty: 3, best: 8,
    solution: [[0, 0, 0, 4], [0, 5, 3, 5], [1, 0, 1, 4], [2, 0, 5, 0], [2, 1, 5, 1], [2, 2, 3, 4], [4, 2, 5, 3], [4, 4, 5, 5]] },
  { w: 6, h: 6, rows: ["B..WB.", "W..B..", ".BW.BW", "W.W...", "...B.B", ".B..WW"], look: 13, difficulty: 3, best: 8,
    solution: [[0, 0, 1, 1], [0, 2, 0, 5], [1, 2, 2, 3], [1, 4, 2, 5], [2, 0, 4, 1], [3, 2, 4, 4], [3, 5, 5, 5], [5, 0, 5, 4]] },
  { w: 6, h: 6, rows: ["GGG.G.", "....G.", "...GG.", ".GG...", "..G..G", "...G.."], look: 21, difficulty: 3, best: 6,
    solution: [[0, 0, 2, 1], [0, 2, 2, 3], [0, 4, 1, 5], [2, 4, 5, 5], [3, 0, 3, 3], [4, 0, 5, 3]] }
]);
