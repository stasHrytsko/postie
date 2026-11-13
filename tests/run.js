/* Runs games/<id>/test.js for every game in web/games.js: each replays all its levels through its pure engine.
   Run: node tests/run.js [id ...]   — exits non-zero on any failure. */
const path = require('path'), fs = require('fs'), ROOT = path.join(__dirname, '..');
global.Postie = require(path.join(ROOT, 'web/kit/kit.js'));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : require(path.join(ROOT, 'web/games.js'));
let fail = 0;
for (const id of ids) {
  const dir = path.join(ROOT, 'games', id);
  for (const f of ['levels.js', 'engine.js', 'view.js', 'icon.svg', 'test.js', 'README.md'])
    if (!fs.existsSync(path.join(dir, f))) { console.log(`FAIL ${id}: missing ${f}`); fail++; }
  if (!fs.existsSync(path.join(dir, 'test.js'))) continue;
  require(path.join(dir, 'levels.js')); require(path.join(dir, 'engine.js'));
  const E = Postie.engines[id], L = Postie.levels[id];
  if (!E || !L || !L.length) { console.log(`FAIL ${id}: engine or levels not registered`); fail++; continue; }
  require(path.join(dir, 'test.js'))(E, L, (name, ok, extra) => {
    if (!ok) fail++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${id}: ${name}${extra ? ' — ' + extra : ''}`);
  });
}
console.log(fail ? `\n${fail} failed` : '\nall ok');
process.exit(fail ? 1 : 0);
