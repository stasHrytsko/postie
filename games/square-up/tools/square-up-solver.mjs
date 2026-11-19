// Солвер и генератор уровней Square Up. Правила повторяет index.html (блок «правила») — держать в синхроне;
// tools/check-levels.mjs прогоняет сохранённые решения через движок из index.html и проверяет оптимум перебором.
//
// Уровень: { pts: [[x, y]], edges: [[a, b]], coins: [число у каждого], limit, sol: [[человек, +1 отдать | -1 забрать]] }.
// Тап «отдать» (+1): человек отдаёт по монете каждому соседу (минус степень у него, плюс 1 у каждого соседа).
// Тап «забрать» (−1): наоборот. Цель — у всех ровно 0. Попытка — ровно limit тапов, отмены нет.
//
// Математика: порядок тапов не важен, итог зависит только от чистого числа тапов y (отдать − забрать) у каждого.
// Уровень строится от ответа x: монеты c = L·x (L — лапласиан графа), сумма монет 0. Любой ответ y = x − t
// (t — одно число на всех), и самый короткий — Σ|x_i − t| при t = медиана x. Отсюда оптимум без перебора.
//
// Запуск: node tools/square-up-solver.mjs > tools/square-up-levels.json && node tools/inject-levels.mjs

export const nbrs = L => { const a = L.pts.map(() => []); for (const [p, q] of L.edges) { a[p].push(q); a[q].push(p); } return a; };
// Тап по человеку v: s = +1 отдать, −1 забрать. Возвращает новые монеты.
export function tap(L, coins, v, s, nb = nbrs(L)) {
  const c = coins.slice(); c[v] -= s * nb[v].length; for (const j of nb[v]) c[j] += s; return c;
}
export const solved = c => c.every(v => v === 0);
const lap = (nb, x) => nb.map((n, i) => n.length * x[i] - n.reduce((s, j) => s + x[j], 0));

// Оптимум по ответу x: длина, все оптимальные сдвиги t.
function optOf(x) {
  let best = Infinity, ts = [];
  for (let t = Math.min(...x); t <= Math.max(...x); t++) {
    const len = x.reduce((s, v) => s + Math.abs(v - t), 0);
    if (len < best) { best = len; ts = [t]; } else if (len === best) ts.push(t);
  }
  return { opt: best, ts };
}
// Решение по сдвигу t: список тапов. Сначала «отдать», потом «забрать», по возрастанию номера.
const solOf = (x, t) => {
  const s = [];
  x.forEach((v, i) => { for (let k = 0; k < v - t; k++) s.push([i, 1]); });
  x.forEach((v, i) => { for (let k = 0; k < t - v; k++) s.push([i, -1]); });
  return s;
};
// Жадный игрок: тапает того, у кого больше всех по модулю (плюс — отдать, минус — забрать).
// Перебирает все ничьи. true — хоть одна ветка решает за limit тапов.
export function greedyWins(L, limit, coins = L.coins, nb = nbrs(L)) {
  if (solved(coins)) return true;
  if (!limit) return false;
  const m = Math.max(...coins.map(Math.abs));
  for (let v = 0; v < coins.length; v++) {
    if (Math.abs(coins[v]) !== m) continue;
    if (greedyWins(L, limit - 1, tap(L, coins, v, Math.sign(coins[v]), nb), nb)) return true;
  }
  return false;
}

// Ловушка помягче: хоть одна ветка жадного игрока (при ничьей) не укладывается в limit.
export function greedyCanFail(L, limit, coins = L.coins, nb = nbrs(L)) {
  if (solved(coins)) return false;
  if (!limit) return true;
  const m = Math.max(...coins.map(Math.abs));
  for (let v = 0; v < coins.length; v++) {
    if (Math.abs(coins[v]) !== m) continue;
    if (greedyCanFail(L, limit - 1, tap(L, coins, v, Math.sign(coins[v]), nb), nb)) return true;
  }
  return false;
}

// ---- графы: координаты для экрана (портрет), рёбра ----
const G = {
  path4: { pts: [[0, 0], [1, 0], [2, 0], [3, 0]], edges: [[0, 1], [1, 2], [2, 3]] },
  paw: { pts: [[0, 0], [2, 0], [1, 1.4], [1, 2.9]], edges: [[0, 1], [0, 2], [1, 2], [2, 3]] },
  house: { pts: [[1, 0], [0, 1.2], [2, 1.2], [0, 2.9], [2, 2.9]], edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]] },
  pentagon: { pts: [[1, 0], [2.05, 0.76], [1.65, 2], [0.35, 2], [-0.05, 0.76]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] },
  // от 6 людей — графы с «хвостами» (у кого один сосед): без них жадное правило почти всегда проходит
  sq2tails: { pts: [[0, 0.9], [2, 0.9], [0, 2.4], [2, 2.4], [1, 0], [2.9, 3.2]], edges: [[0, 1], [0, 2], [1, 3], [2, 3], [0, 4], [3, 5]] },
  sun: { pts: [[1.5, 1], [2.4, 2.5], [0.6, 2.5], [1.5, -0.2], [3.4, 3.2], [-0.4, 3.2]], edges: [[0, 1], [1, 2], [2, 0], [0, 3], [1, 4], [2, 5]] },
  tree7: { pts: [[0, 0], [2, 0], [1, 0.9], [1, 2], [0, 2.9], [2, 2.9], [1, 3.8]], edges: [[0, 2], [1, 2], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6], [0, 1]] },
  pent2tails: { pts: [[1, 0.9], [2.05, 1.66], [1.65, 2.9], [0.35, 2.9], [-0.05, 1.66], [1, -0.4], [2.6, 3.9]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 5], [2, 6]] },
  ladder8: { pts: [[0, 0], [2, 0], [0, 1.2], [2, 1.2], [0, 2.4], [2, 2.4], [0, 3.6], [2, 3.6]], edges: [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5], [4, 6], [5, 7]] },
  hex2tails: { pts: [[1, 0.9], [2, 1.5], [2, 2.7], [1, 3.3], [0, 2.7], [0, 1.5], [1, -0.3], [1, 4.5]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [3, 7], [1, 4]] },
};

// ---- генератор ----
let seed = 20261119; // mulberry32
const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// spec: { g, limit, take: 'need' | 'mix' | 'none', trap, maxCoin }
function generate(spec, tries = 20000) {
  const L0 = G[spec.g], nb = nbrs(L0), n = L0.pts.length;
  let best = null;
  for (let t = 0; t < tries; t++) {
    const x = Array.from({ length: n }, () => Math.floor(rnd() * 5) - 2);
    const c = lap(nb, x);
    if (solved(c) || Math.max(...c.map(Math.abs)) > spec.maxCoin) continue;
    const { opt, ts } = optOf(x);
    if (opt !== spec.limit) continue;
    const giveOnly = x.reduce((s, v) => s + v - Math.min(...x), 0);
    const takeOnly = x.reduce((s, v) => s + Math.max(...x) - v, 0);
    if (spec.take === 'need' && giveOnly <= opt) continue;
    if (spec.take === 'mix' && (giveOnly <= opt || takeOnly <= opt)) continue;
    const L = { ...L0, coins: c };
    if (spec.easy && greedyCanFail(L, spec.limit)) continue; // лёгкий: «тапай самое большое число» проходит при любом выборе
    if (spec.easyish && !greedyWins(L, spec.limit)) continue; // почти лёгкий: проходит при удачном выборе из ничьих
    if (spec.trap === 'hard' && greedyWins(L, spec.limit)) continue;
    if (spec.trap === 'soft' && (!greedyCanFail(L, spec.limit) || !greedyWins(L, spec.limit))) continue; // мягкая: проходит, но при ничьей можно ошибиться
    const zeros = c.filter(v => v === 0).length;
    const score = (ts.length === 1 ? 100 : 0) - zeros * 10 - Math.max(...c.map(Math.abs));
    if (!best || score > best.score) best = { score, L: { ...L, limit: spec.limit, sol: solOf(x, ts[0]), optimal: ts.length, greedy: greedyWins(L, spec.limit) ? (greedyCanFail(L, spec.limit) ? 'tie' : 'wins') : 'fails' } };
  }
  if (!best) throw new Error('нет уровня для ' + JSON.stringify(spec));
  return best.L;
}

// Кривая (решения автора 2026-11-19: «3 уровень уже сложноватый», потом «до 5 уровня должно быть легко
// и просто»): уровни 1–5 лёгкие (2–3 тапа, маленькие числа, жадное правило проходит всегда),
// 6 — переход (4 тапа, нужны оба хода), 7–8 — 5 тапов с мягкой ловушкой, 9–10 — с жёсткой (2026-11-19).
const SPECS = [
  { g: 'paw', limit: 2, take: 'need', easy: true, maxCoin: 3 },
  { g: 'house', limit: 2, take: 'any', easy: true, maxCoin: 3 },
  { g: 'pentagon', limit: 3, take: 'any', easy: true, maxCoin: 4 },
  { g: 'sq2tails', limit: 3, take: 'any', easy: true, maxCoin: 3 },
  { g: 'sun', limit: 4, take: 'mix', trap: 'soft', maxCoin: 5 },
  { g: 'tree7', limit: 5, take: 'mix', trap: 'soft', maxCoin: 5 },
  { g: 'pent2tails', limit: 5, take: 'mix', trap: 'soft', maxCoin: 5 },
  { g: 'ladder8', limit: 5, take: 'mix', trap: 'hard', maxCoin: 6 },
  { g: 'hex2tails', limit: 5, take: 'mix', trap: 'hard', maxCoin: 6 },
];

if (import.meta.url === `file://${process.argv[1]}`) {
  // Уровень 1 — скетч автора: Даша −1, Аня 1, Боря 1, Вика −1; Аня отдаёт, Боря отдаёт.
  const out = [{ ...G.path4, coins: [-1, 1, 1, -1], limit: 2, sol: [[1, 1], [2, 1]], optimal: 1 }];
  for (const s of SPECS) {
    out.push(generate(s));
    const L = out.at(-1);
    process.stderr.write(`уровень ${out.length}: ${s.g}, монеты ${L.coins.join(' ')}, тапов ${L.limit}, оптимальных ответов ${L.optimal}, жадный ${L.greedy}\n`);
  }
  console.log(JSON.stringify(out));
}
