/* Rebuilds games/carpet-layers/levels.js from stazzi (read only): src/levels/levels.json (levels carry their own sample solution and opt).
   Run from the Postie repo root: node games/carpet-layers/tools/import-from-stazzi.js /path/to/stazzi */
const fs = require('fs'), path = require('path');
const SRC = path.join(process.argv[2] || '../stazzi', 'apps/casual/carpet-layers');
const levels = JSON.parse(fs.readFileSync(path.join(SRC, 'src/levels/levels.json'), 'utf8'));
/* stazzi colour -> Postie.PIECES slot (1-based): coral 1 apricot/triangle, blue 2 blue/circle, green 3 sage/square, yellow 4 butter/diamond, plum 6 ink/pentagon */
const COL = { coral: 1, blue: 2, green: 3, yellow: 4, plum: 6 }, LET = { c: 1, b: 2, g: 3, y: 4, p: 6 };
/* Difficulty: 1 easy = 5×5 board, one-colour strips (levels 1–5) · 2 medium = 5×5 with multi-colour strips, and 6×6 (6–12) · 3 hard = 7×7 and 8×8, glass (13–20). */
const diff = L => L.size >= 7 ? 3 : (L.id >= 6 ? 2 : 1);
const out = levels.map(L => {
  const idx = id => L.strips.findIndex(s => s.id === id);
  L.strips.forEach((s, i) => { if (s.id !== 's' + (i + 1)) throw new Error('strip ids out of order'); if (s.back) throw new Error('two-sided strips not supported'); });
  const strips = L.strips.map(s => '{ c: \'' + s.colors.map(c => COL[c]).join('') + '\', d: \'' + s.dir + '\'' + (s.clear ? ', clear: 1' : '') + ' }');
  const start = L.start.map(p => [idx(p.id), p.row, p.col].concat(p.pinned ? [1] : []));
  const sol = L.solution.map(a => a.type === 'drop' ? ['d', idx(a.id), a.row, a.col] : a.type === 'remove' ? ['r', idx(a.id)] : (() => { throw new Error(a.type); })());
  const q = x => JSON.stringify(x).replace(/"/g, "'");
  return '  { size: ' + L.size + ', difficulty: ' + diff(L) + ', best: ' + L.opt + (L.tutorial ? ', tutorial: 1' : '') + ',\n' +
    '    pattern: ' + q(L.pattern.map(r => r.replace(/[a-z]/g, ch => LET[ch]))) + ',\n' +
    '    strips: [' + strips.join(', ') + '],\n' +
    (start.length ? '    start: ' + q(start) + ',\n' : '') +
    '    solution: ' + q(sol) + ' }';
});
const head = `/* Carpet Layers — all ${levels.length} levels from stazzi apps/casual/carpet-layers (src/levels/levels.json), same order. Built by tools/import-from-stazzi.js.
   size: board side (5..8). pattern: size strings, '.' empty, digit = colour slot in Postie.PIECES
     (1 apricot/triangle = stazzi coral, 2 blue/circle = blue, 3 sage/square = green, 4 butter/diamond = yellow, 6 ink/pentagon = plum).
   strips: index 0.. (stazzi s1, s2, …); c = cell colours left→right / top→bottom (length 2..4), d = 'h' | 'v', clear: 1 = glass (blue over butter or butter over blue shows sage).
   start: [strip, row, col, pinned?] strips already on the board, bottom first (level 2: misplaced; 11+: pinned, cannot be taken back).
   solution: ['d', strip, row, col] drop with top-left cell · ['r', strip] take back — the stazzi sample solution, checked by test.js.
   best: stazzi opt = minimum moves (a drop or a take-back is one move). difficulty: 1 easy · 2 medium · 3 hard, see README. tutorial: stazzi levels 1–2. */
Postie.addLevels('carpet-layers', [
${out.join(',\n')}
]);
`;
fs.writeFileSync(path.join(__dirname, '..', 'levels.js'), head);
console.log('wrote', levels.length, 'levels');
