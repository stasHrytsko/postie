/* Outgrow — all 50 levels, ported 1:1 from stazzi apps/casual/outgrow/src/levels/levels.json (same order).
   Per level:
     w, h      board size
     rows      top to bottom: '#' wall, '.' free cell, 'A'..'E' seed of territory A..E (territory k = letter index + 1)
     need      target size per territory, in letter order [A, B, ...]; sum = non-wall cells
     solution  stazzi solver's 'opt': the order of taps, one letter per tap (string), verified by test.js
     difficulty 1 easy · 2 medium · 3 hard — from stazzi's solver score (cfg.score = minCuts + len/3 + 6·dead + 4·trapShare + 1.5·forced):
               score < 13 → 1, 13–25 → 2, ≥ 25 → 3 (see README.md)
   No 'best': stazzi has no optimal tap count for Outgrow (opt is the solution with the fewest cuts, not the shortest). */
Postie.addLevels('outgrow', [
  { w: 4, h: 4, rows: ['A...', '....', '...B', '##..'], need: [6, 8], solution: 'AABB', difficulty: 1 },
  { w: 4, h: 4, rows: ['B...', '.A#.', '..#.', '....'], need: [7, 7], solution: 'BAAAABBBB', difficulty: 1 },
  { w: 5, h: 5, rows: ['.....', '.#...', '...A.', '.B...', 'C..#.'], need: [13, 7, 3], solution: 'ACBAAABBB', difficulty: 1 },
  { w: 5, h: 5, rows: ['...##', '.....', 'C....', '.B...', '....A'], need: [6, 12, 5], solution: 'AABBCCCCBBB', difficulty: 1 },
  { w: 5, h: 5, rows: ['.....', '.#...', '.C...', '..A#.', '...B.'], need: [12, 6, 5], solution: 'ABBBBACCCCAAA', difficulty: 1 },
  { w: 5, h: 5, rows: ['#....', '.....', 'A.#B.', '...#.', 'C....'], need: [9, 4, 9], solution: 'AACACCCCCBCCBB', difficulty: 1 },
  { w: 6, h: 6, rows: ['.AB...', '....D.', '..#...', '.....#', '...C#.', '......'], need: [7, 6, 16, 4], solution: 'ABAACCBBDCCD', difficulty: 2 },
  { w: 6, h: 6, rows: ['#.C...', 'A.....', '......', '..B..#', '.....#', '..D...'], need: [2, 13, 8, 10], solution: 'CCABDDDBBBBB', difficulty: 2 },
  { w: 6, h: 6, rows: ['A....#', '....#.', '.C.B..', '..#...', '...D..', '......'], need: [10, 6, 2, 15], solution: 'AAADDBBCDABD', difficulty: 2 },
  { w: 6, h: 6, rows: ['......', '.....#', 'B.#...', 'D.A...', '......', '..#C..'], need: [14, 2, 7, 10], solution: 'CDACACCADBDDDAAA', difficulty: 2 },
  { w: 7, h: 7, rows: ['.......', '......B', '##...#.', '.D.....', '.......', '.C..A..', '....#..'], need: [15, 8, 5, 17], solution: 'AABBCDDDDABCDD', difficulty: 2 },
  { w: 7, h: 7, rows: ['...#...', '......#', '..C....', '....#..', '#...D..', 'B..A...', '.......'], need: [4, 7, 22, 12], solution: 'BBACDDDCBCCCCD', difficulty: 2 },
  { w: 7, h: 7, rows: ['.......', '.......', 'D......', '...A.C.', '....#..', '..B...#', '...#..#'], need: [18, 13, 4, 10], solution: 'BABDDAABDACAABC', difficulty: 2 },
  { w: 7, h: 7, rows: ['D.C.#..', '.A.....', '......B', '#......', '.......', '.......', '.....#.'], need: [17, 23, 2, 4], solution: 'BBBBDDAAACBAAAAA', difficulty: 2 },
  { w: 7, h: 7, rows: ['...B...', '.......', '...DC..', '.#....#', '.....#.', 'A......', '.......'], need: [22, 16, 4, 4], solution: 'AAADBBBBACCAAAB', difficulty: 2 },
  { w: 7, h: 7, rows: ['......#', '.......', '.D...B.', '....#..', '..E...A', '#...C..', '...#...'], need: [4, 5, 10, 5, 21], solution: 'ACCDEECEEBEEEBEE', difficulty: 2 },
  { w: 7, h: 7, rows: ['#....D.', '.#..#..', '.#.....', '....#..', '.....B.', '..EC...', 'A......'], need: [4, 6, 2, 18, 14], solution: 'ADDDBDDEAECEEBBEE', difficulty: 2 },
  { w: 7, h: 7, rows: ['....#..', '#..B...', '#......', '....D..', '...C...', '#....E.', '......A'], need: [5, 2, 21, 14, 3], solution: 'AAEDCCCDCBCCCDDD', difficulty: 2 },
  { w: 7, h: 7, rows: ['#.....#', '.......', 'D......', '#.#....', '.A...E.', '..BC...', '....#..'], need: [24, 2, 3, 8, 7], solution: 'DABACDDAAAEEAAAAE', difficulty: 3 },
  { w: 7, h: 7, rows: ['......#', 'D......', '...#...', '.......', 'E...##C', 'B......', '..A....'], need: [12, 3, 6, 18, 6], solution: 'BADDDEEAAEDEAACECCDD', difficulty: 3 },
  { w: 7, h: 7, rows: ['.....A.', '.......', '..EB..#', '#....#.', '....#D.', '.......', '....C..'], need: [3, 24, 2, 8, 8], solution: 'BDDCEBBAABDEEBBB', difficulty: 2 },
  { w: 7, h: 7, rows: ['.......', '.....B.', '.#.....', '....C..', '..A#...', '#.E....', '#.....D'], need: [2, 12, 18, 8, 5], solution: 'BBCDDCADECCBCCCE', difficulty: 2 },
  { w: 7, h: 7, rows: ['......#', '.....C.', '.......', '....A..', '...D.#E', '#...#..', '.....B.'], need: [26, 2, 3, 10, 4], solution: 'ADACAEEBDAAAADDD', difficulty: 2 },
  { w: 7, h: 7, rows: ['.......', '...A..#', '......#', '#......', '..E..C.', '..B....', 'D#..#..'], need: [11, 6, 8, 2, 17], solution: 'DBEBECEAAEACCEEA', difficulty: 3 },
  { w: 7, h: 7, rows: ['#...D..', '...B..E', '.....A.', '.......', '..#....', '.......', '...##C.'], need: [2, 25, 11, 4, 3], solution: 'BCCDDEECABBBBCBBB', difficulty: 3 },
  { w: 8, h: 8, rows: ['........', '#......#', '......B.', '...#..#.', '.....E.#', '.D......', 'C...A...', '.....#..'], need: [13, 9, 2, 14, 20], solution: 'AEADCDEBBBEAADEEDEEEE', difficulty: 2 },
  { w: 8, h: 8, rows: ['........', '...#....', '..#....B', '#.C.....', '#.D...#.', '.....A..', '......E.', '...#....'], need: [29, 10, 7, 8, 4], solution: 'ABBDEAAACCDDAABDAAACCCE', difficulty: 2 },
  { w: 8, h: 8, rows: ['....#...', '........', '.E..#...', '...A....', '.....D.#', '..B....C', '........', '...##...'], need: [12, 27, 3, 2, 15], solution: 'BBACBEEBBBBEADAEEEAAAAA', difficulty: 3 },
  { w: 8, h: 8, rows: ['.....A..', '........', '..BD....', '.....E#.', '......C#', '....#...', '....#...', '........'], need: [4, 3, 22, 25, 6], solution: 'CCDEDBCCCCCDABCEDAADCCCEE', difficulty: 3 },
  { w: 8, h: 8, rows: ['....#...', '........', '....#...', 'A....##.', '.......D', 'C.......', '....E...', '.#B.....'], need: [26, 16, 9, 6, 2], solution: 'AABCACCBCEBBBBBBBAAAAADDDAD', difficulty: 3 },
  { w: 8, h: 8, rows: ['.....#..', '.....#..', '........', '.#.....#', 'E....#BC', '........', '...A....', '....D...'], need: [6, 11, 6, 6, 30], solution: 'CDAEEEEAACBBBCDEEBBEE', difficulty: 2 },
  { w: 8, h: 8, rows: ['........', '......#.', '#.#.....', '...#C...', '......A.', '...B..D.', '...E....', '...#.#..'], need: [2, 25, 19, 6, 6], solution: 'BEBCCACDBDDEEBBBBBCCC', difficulty: 2 },
  { w: 8, h: 8, rows: ['....E...', '.....#..', '#.......', '.......#', '...B.##.', '...A....', '....D...', '..C.....'], need: [7, 18, 5, 13, 16], solution: 'BABDDACCABCDDDEEEBEE', difficulty: 2 },
  { w: 8, h: 8, rows: ['.D....#.', '....A...', '...#....', '........', '........', '.....B.#', '...C.#..', '..E.....'], need: [5, 17, 30, 6, 2], solution: 'BBCDECCCCCDCACABBBBB', difficulty: 3 },
  { w: 8, h: 8, rows: ['........', '..A.....', '..#.C..#', '..E...#.', '...#....', '..#B.D..', '........', '........'], need: [3, 22, 11, 21, 2], solution: 'BDDBDBBBBEDCCABBBBBCCCC', difficulty: 3 },
  { w: 8, h: 8, rows: ['E.....D.', '....#.#C', '....#B..', '...#..A.', '........', '........', '........', '..#.#...'], need: [12, 34, 2, 7, 3], solution: 'DCBABABAABBABBDDDBEBB', difficulty: 2 },
  { w: 8, h: 8, rows: ['......E.', '..#.....', '....#...', '.D.#AC..', '.....B.#', '........', '....#...', '........'], need: [18, 11, 18, 10, 2], solution: 'AACBABBCCECCCDAACDAAABBDD', difficulty: 2 },
  { w: 8, h: 8, rows: ['........', '....#...', '.......#', '.E...#..', '........', '..C....A', '.B###..#', 'D.......'], need: [9, 3, 9, 6, 30], solution: 'DDBBCCEECADEEEEEEAAAAE', difficulty: 2 },
  { w: 8, h: 8, rows: ['...A.C..', '....B#.#', 'E##.....', '..##....', '........', '........', '......D.', '........'], need: [4, 18, 5, 29, 2], solution: 'BACCCBADDDBADBBBDDBDE', difficulty: 3 },
  { w: 8, h: 8, rows: ['...#....', '........', '.#E.B...', '....#...', '.#......', '..#..##.', '..DA....', '.C......'], need: [5, 27, 5, 7, 13], solution: 'BBDCCCDACDDEEEABBBBBBBE', difficulty: 3 },
  { w: 8, h: 8, rows: ['....E...', '........', '..A....#', '.B......', '....CD..', '........', '.#...#..', '...#...#'], need: [23, 2, 22, 2, 10], solution: 'ACCAAABDEEEEEAACAAACCE', difficulty: 3 },
  { w: 8, h: 8, rows: ['..#...#.', '...C....', '....B...', '.....#..', '........', 'E.##....', '.D...A..', '..#..#..'], need: [3, 12, 27, 9, 6], solution: 'CBCCEDDDADBECCCCBBBBBBB', difficulty: 3 },
  { w: 8, h: 8, rows: ['.....#..', '....E#..', '..#.....', '..#..B..', '........', '.....#..', '..D..A..', '#C......'], need: [24, 2, 17, 4, 11], solution: 'ACCDACCCDACABEAAAAEEEEE', difficulty: 3 },
  { w: 8, h: 8, rows: ['.D...#..', '....#.#.', '........', '........', '.E......', '#.A.....', '..B..#.C', '........'], need: [31, 2, 12, 6, 8], solution: 'ACCEABEAAEEDDDAACACCCC', difficulty: 3 },
  { w: 8, h: 8, rows: ['......#.', '...C#...', '..#..E..', '........', '.A.B....', '.....#..', '.D#.#...', '.....#..'], need: [9, 4, 27, 9, 8], solution: 'ACDDACCDDBCECBEECEECCCC', difficulty: 3 },
  { w: 8, h: 8, rows: ['.#.#....', '.......E', '..A...D.', '........', '....C...', '..B.....', '........', '.#...#..'], need: [32, 7, 4, 15, 2], solution: 'AADAABEDCABBBBAABCDDDD', difficulty: 3 },
  { w: 8, h: 8, rows: ['.....#..', '#.......', '.....#D.', '.......A', '......CE', '...#..B.', '#......#', '.....#..'], need: [6, 19, 24, 6, 2], solution: 'AADDDEBCABCBBBBCCBCBCCCCC', difficulty: 3 },
  { w: 8, h: 8, rows: ['....#...', '..#.....', '........', '........', '........', 'C###B...', '...#..D.', '....EA#.'], need: [3, 20, 8, 21, 5], solution: 'ACDDABBDDDEEECBDDBBCBBBB', difficulty: 3 },
  { w: 8, h: 8, rows: ['........', '..#.....', '##....D#', '...#....', '.AB...C.', '........', '..#.....', '.#...E..'], need: [6, 18, 3, 27, 3], solution: 'BBAAADDDBABDCBCEEDDDDD', difficulty: 3 },
  { w: 8, h: 8, rows: ['........', '.B.C....', 'E...#...', 'A....#.#', '..#.....', '........', '.#......', '.D#.....'], need: [10, 34, 9, 3, 2], solution: 'ADDAEBBBCBAABCCBABCCBBBBB', difficulty: 3 }
]);
