/* Recruit Ladder — all 15 levels from stazzi apps/midcore/recruit-ladder/src/engine/levels.ts, same order (written by tools/solver.js).
   grid: 7 rows, row 0 first = the row just above the recruits (the screen shows it at the bottom). Each row is 4 chars, one per lane
     left to right: '.' empty, '0' Dojo, '1' Range, '2' Bastion, '3' Temple.
   need: per lane, left to right, the schools the recruit ending on that lane must remember (digits, order doesn't matter).
   solution: per row, the swap made before stepping onto it: -1 none, k = lanes k and k+1 (0-based). It is the shortest found by
     the solver (all 4^7 ladders); best = its number of swaps. difficulty (1 easy · 2 medium · 3 hard) from the share of all 16 384
     ladders that win: >= 2.5% -> 1, 1–2.5% -> 2, < 1% -> 3. */
Postie.addLevels('recruit-ladder', [
  { grid: ["0.3.","1..3",".2.0","11..","13..",".0.2","10.."], need: ["1","0","2","1"], difficulty: 1, best: 2, solution: [-1,-1,-1,-1,-1,1,2] },
  { grid: ["1..2","03..","3.2.","32..","31..",".12.",".01."], need: ["3","0","1","0"], difficulty: 1, best: 3, solution: [-1,-1,-1,0,1,-1,2] },
  { grid: ["3.0.","12..","..00",".30.","23..","2..1","2..2"], need: ["2","0","1","23"], difficulty: 1, best: 2, solution: [-1,-1,-1,-1,-1,1,2] },
  { grid: [".00.",".3.3","32..","..10","12..","3.0.","20.."], need: ["23","0","1","1"], difficulty: 2, best: 3, solution: [-1,-1,-1,-1,2,0,1] },
  { grid: ["0.3.",".3.3","02..",".31.","..13",".2.1","32.."], need: ["3","20","1","21"], difficulty: 1, best: 3, solution: [-1,-1,-1,-1,1,0,2] },
  { grid: ["2..1","3..1","..31","3.0.","32..",".30.","..31"], need: ["02","03","3","1"], difficulty: 3, best: 4, solution: [-1,-1,-1,0,1,0,1] },
  { grid: [".02.","3..3","0..1","2..2","2.2.",".0.2",".01."], need: ["2","0","312","30"], difficulty: 2, best: 3, solution: [-1,-1,-1,-1,0,1,2] },
  { grid: ["0.1.","3..2","3.2.",".02.",".0.3","..01","01.."], need: ["20","31","31","0"], difficulty: 1, best: 3, solution: [-1,-1,-1,-1,1,0,2] },
  { grid: [".33.","..02",".1.0","1.3.","..12",".0.1",".32."], need: ["203","3","20","1"], difficulty: 2, best: 4, solution: [-1,-1,-1,2,1,0,1] },
  { grid: [".3.2","1..0",".13.","..30","3..3","3.0.","2.2."], need: ["231","10","20","3"], difficulty: 2, best: 3, solution: [-1,-1,-1,-1,2,1,1] },
  { grid: ["2..0",".03.",".3.1","..32",".32.",".1.1","3.2."], need: ["13","3","12","013"], difficulty: 3, best: 4, solution: [-1,-1,-1,1,2,0,0] },
  { grid: [".3.3","1..1",".2.0",".0.0","..20",".2.0",".00."], need: ["2","0","120","201"], difficulty: 3, best: 4, solution: [-1,-1,-1,0,2,2,1] },
  { grid: ["2.2.","03..","..23",".01.","..32",".10.","32.."], need: ["103","321","30","2"], difficulty: 3, best: 4, solution: [-1,-1,-1,1,1,0,0] },
  { grid: ["..01",".1.0","23..",".2.1",".00.",".1.3",".32."], need: ["0","230","321","31"], difficulty: 3, best: 4, solution: [-1,-1,-1,0,1,0,1] },
  { grid: ["1..1","02..",".3.2","23..",".2.1","..32","0..2"], need: ["20","203","32","123"], difficulty: 3, best: 5, solution: [-1,-1,0,1,1,2,2] }
]);
