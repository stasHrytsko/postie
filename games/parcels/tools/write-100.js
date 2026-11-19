/* Parcels — assembles tools/out/slot-*.json (made by make-100.js) into levels.js. */
const fs = require('fs'), path = require('path');
module.exports = function (P) {
  const OUT = path.join(__dirname, 'out'), L = [];
  for (let i = 1; i <= P.length; i++) { const f = path.join(OUT, 'slot-' + i + '.json'); if (!fs.existsSync(f)) throw new Error('slot ' + i + ' is missing'); L.push(JSON.parse(fs.readFileSync(f, 'utf8'))); }
  const firstPair = L.findIndex(x => x.pairs > 0) + 1;
  const q = a => "['" + a.join("', '") + "']";
  const rows = L.map((x, i) => {
    const extra = (x.teach ? ' teach: true,' : '') + (x.pairs > 0 && i + 1 !== firstPair ? ' needs: ' + firstPair + ',' : '') + (x.from ? " from: '" + x.from + "'," : ' seed: ' + x.seed + ',');
    return `  { kind: '${x.pairs ? 'mixed' : 'numbers'}', w: ${x.w}, h: ${x.h}, rows: ${q(x.rows)}, step: ${x.step}, difficulty: ${x.difficulty}, parcels: ${x.parcels}, pairs: ${x.pairs}, good: ${x.good},${extra}\n    solution: ${JSON.stringify(x.solution).replace(/,/g, ', ')} }`;
  });
  const out = `/* Parcels — 100 levels (author 2026-11-19): numbers first, then the pair joins the numbers; no levels with dots alone.
   Made by tools/make-100.js (plan, steps and the measure are described there); every level is solvable by construction and re-solved.
     1–8    numbers only, 4×4 → 5×5
     9–11   numbers + one pair — level ${firstPair} teaches the pair (teach: the hand shows its first move, which is the pair)
     12–15  numbers + two pairs
     16–100 mixed, steps rise; flavour changes level to level (balanced / few pairs / many pairs / numbers only now and then)
   Per level:
     rows      top to bottom: '.' plain cube, '2'..'9' cube with a number, 'B' / 'W' cube with a black / white dot
     step      1..6 from parcels and traps together; difficulty for the letter: steps 1–2 → 1 easy, 3–4 → 2 medium, 5–6 → 3 hard
     parcels, pairs  how many parcels, how many of them are pairs; good — share of first frames after which the level still clears
     needs     a level with dots comes in a letter only after level ${firstPair} (the shell's letter rule)
     solution  frames [r0, c0, r1, c1] at the moment of the move; verified by test.js
   Level 0 (teaching) and the "?" demo live in view.js. */
Postie.addLevels('parcels', [
${rows.join(',\n')}
]);
`;
  fs.writeFileSync(path.join(__dirname, '../levels.js'), out);
  const c = {}; L.forEach(x => c[x.difficulty] = (c[x.difficulty] || 0) + 1);
  console.log('wrote', L.length, 'levels', JSON.stringify(c));
};
