/* Rebuilds games/slide-out/levels.js from stazzi (read only): src/levels/levels.json + tools/solutions.json.
   Run from the Postie repo root: node games/slide-out/tools/import-from-stazzi.js /path/to/stazzi */
const fs = require('fs'), path = require('path');
const SRC = path.join(process.argv[2] || '../stazzi', 'apps/casual/slide-out');
const levels = JSON.parse(fs.readFileSync(path.join(SRC, 'src/levels/levels.json'), 'utf8')).levels;
const sols = JSON.parse(fs.readFileSync(path.join(SRC, 'tools/solutions.json'), 'utf8'));
const COL = { red: 1, blue: 2, yellow: 4 }; /* Postie.PIECES slots (1-based): 1 apricot/triangle, 2 blue/circle, 4 butter/diamond */
/* Difficulty from the stazzi generator's bands (tools/generate-levels.ts): casual-bot win-rate band of each level.
   1 easy: band upper bound >= 45% (levels 1–3) · 2 medium: 10–35% (levels 4–8) · 3 hard: <= 5% (levels 9–15). */
const DIFF = [1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3];
const out = levels.map((L, k) => {
  const board = Array(25).fill('.'), pos = {};
  L.blocks.forEach(b => { board[b.row * 5 + b.col] = COL[b.color]; pos[b.id] = [b.row, b.col]; });
  const sol = sols.find(s => s.level === L.id).moves.map(m => {
    const p = pos[m.blockId], dir = m.row < p[0] ? 'up' : m.row > p[0] ? 'down' : m.col < p[1] ? 'left' : 'right';
    const from = p[0] * 5 + p[1]; pos[m.blockId] = [m.row, m.col]; return [from, dir[0]];
  });
  const goals = L.goals.map(g => [COL[g.color], g.target.side, g.target.index, g.initialCountdown, g.unlockAfterServed]);
  return '  { board: \'' + board.join('') + '\', difficulty: ' + DIFF[k] + ',\n    goals: ' + JSON.stringify(goals).replace(/"/g, "'") +
    ',\n    solution: ' + JSON.stringify(sol).replace(/"/g, "'") + ' }';
});
const head = `/* Slide Out — all ${levels.length} levels from stazzi apps/casual/slide-out (src/levels/levels.json), same order. Built by tools/import-from-stazzi.js.
   board: 25 chars, rows top to bottom; '.' empty, digit = colour slot in Postie.PIECES (1 apricot/triangle = stazzi red, 2 blue/circle = blue, 4 butter/diamond = yellow).
   goals: [colour, side top|right|bottom|left, index 0..4 along the side (left→right / top→bottom), countdown in moves, unlockAfterServed], in stazzi order.
   solution: [cell 0..24, direction u|d|l|r] swipes — the stazzi solver route (tools/solutions.json), checked by test.js.
   difficulty: 1 easy · 2 medium · 3 hard, from the stazzi generator band (casual-bot win rate), see README.
   No 'best': the stazzi solver is not exhaustive, so its route length is not a proven minimum. */
Postie.addLevels('slide-out', [
${out.join(',\n')}
]);
`;
fs.writeFileSync(path.join(__dirname, '..', 'levels.js'), head);
console.log('wrote', levels.length, 'levels');
