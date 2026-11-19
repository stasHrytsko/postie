// Copied from stazzi apps/casual/rusla/tools/rusla-solver.mjs (2026-11-19). energy null = no pool: play() then never runs out.
// Солвер Streams (SPEC.md §5, §6). Нужен тестам и подбору уровней; в игре его нет.
//
// Скелет уровня: { w, h, start, fork, arrows, finish } — клетки как индексы r * w + c.
//   fork === null  — одна линия из start в finish[0] (лёгкие уровни);
//   fork !== null  — ствол start → fork, затем len(arrows) веток: arrows[k] — первая клетка
//                    ветки k, finish[k] — её финиш.
// Покрытие: непересекающиеся пути (ствол и ветки), вместе занимающие все клетки поля.
// Энергия после шага — функция только длин путей, поэтому проходимость покрытия — это путь по
// решётке (i₀, i₁, …), а не перебор состояний; порядок шагов выбираем по минимуму переключений.

/** Соседи клетки по сторонам, порядок: вверх, вправо, вниз, влево. */
export function neighbours(w, h) {
  const out = [];
  for (let r = 0; r < h; r += 1) {
    for (let c = 0; c < w; c += 1) {
      const list = [];
      if (r > 0) list.push((r - 1) * w + c);
      if (c < w - 1) list.push(r * w + c + 1);
      if (r < h - 1) list.push((r + 1) * w + c);
      if (c > 0) list.push(r * w + c - 1);
      out.push(list);
    }
  }
  return out;
}

/** Сегменты покрытия: у каждого начало и конец. Ствол кончается в развилке. */
export function segmentsOf(sk) {
  if (sk.fork === null) return [{ from: sk.start, to: sk.finish[0] }];
  return [{ from: sk.start, to: sk.fork }, ...sk.arrows.map((a, k) => ({ from: a, to: sk.finish[k] }))];
}

/**
 * Все покрытия скелета. Возвращает массив массивов: paths[s] — клетки сегмента s от начала до конца.
 * `limit` — защитный потолок числа покрытий (результат тогда помечен truncated).
 */
export function covers(sk, limit = 200000) {
  const { w, h } = sk;
  const n = w * h;
  const nb = neighbours(w, h);
  const segs = segmentsOf(sk);
  // Зарезервированные клетки: чужие начала/концы сегментов, а также развилка для веток.
  const owner = new Int16Array(n).fill(-1);
  segs.forEach((s, i) => {
    owner[s.from] = i;
    owner[s.to] = i;
  });
  const visited = new Uint8Array(n);
  const paths = segs.map(() => []);
  const found = [];
  let truncated = false;

  const pStart = sk.fork === null ? -1 : sk.fork; // клетка, из которой стартуют ветки

  function allowed(cell, seg) {
    if (visited[cell] === 1) return false;
    const o = owner[cell];
    return o === -1 || o === seg;
  }

  // Отсев: каждая непосещённая клетка должна быть достижима и иметь, куда продолжить путь.
  function alive(seg, tip) {
    let free = 0;
    for (let i = 0; i < n; i += 1) if (visited[i] === 0) free += 1;
    if (free === 0) return true;
    // Достижимость от кончика и от начал ещё не начатых сегментов.
    const seen = new Uint8Array(n);
    const stack = [];
    const seed = (cell) => {
      if (visited[cell] === 0 && seen[cell] === 0) {
        seen[cell] = 1;
        stack.push(cell);
      }
    };
    for (const v of nb[tip]) seed(v);
    for (let s = seg + 1; s < segs.length; s += 1) seed(segs[s].from);
    let reached = 0;
    while (stack.length > 0) {
      const u = stack.pop();
      reached += 1;
      for (const v of nb[u]) seed(v);
    }
    if (reached !== free) return false;
    // Тупики: клетка внутри пути обязана иметь двух соседей; начало и конец сегмента — одного.
    for (let u = 0; u < n; u += 1) {
      if (visited[u] === 1) continue;
      let deg = 0;
      for (const v of nb[u]) {
        if (visited[v] === 0 || v === tip) deg += 1;
        else if (v === pStart && owner[u] > 0 && segs[owner[u]].from === u) deg += 1;
      }
      const o = owner[u];
      const isEnd = o >= 0 && segs[o].to === u;
      const isStart = o >= 0 && segs[o].from === u && o > seg;
      let need = isEnd || isStart ? 1 : 2;
      if (isEnd && isStart) need = 1;
      if (deg < need) return false;
    }
    return true;
  }

  function run(seg, tip) {
    if (truncated) return;
    const path = paths[seg];
    if (tip === segs[seg].to) {
      // Сегмент закончен.
      if (seg === segs.length - 1) {
        let all = true;
        for (let i = 0; i < n; i += 1) if (visited[i] === 0) all = false;
        if (all) {
          found.push(paths.map((p) => p.slice()));
          if (found.length >= limit) truncated = true;
        }
        return;
      }
      const next = seg + 1;
      const from = segs[next].from;
      if (visited[from] === 1) return;
      visited[from] = 1;
      paths[next].push(from);
      if (alive(next, from)) run(next, from);
      paths[next].pop();
      visited[from] = 0;
      return;
    }
    for (const v of nb[tip]) {
      if (!allowed(v, seg)) continue;
      visited[v] = 1;
      path.push(v);
      if (alive(seg, v)) run(seg, v);
      path.pop();
      visited[v] = 0;
    }
  }

  visited[sk.start] = 1;
  paths[0].push(sk.start);
  if (sk.start === segs[0].to) {
    // Вырожденный случай: ствол из одной клетки.
    if (segs.length === 1) {
      if (n === 1) found.push([[sk.start]]);
    } else run(0, sk.start);
  } else if (alive(0, sk.start)) run(0, sk.start);
  return { list: found, truncated };
}

/**
 * Проходимость покрытия при запасе `energy` и каплях `drops` (Map клетка → +X).
 * Возвращает { ok, order, switches }: order — шаги [сегмент, клетка] в порядке игры, switches — число
 * переключений между ветками; минимум берётся по всем проходимым порядкам.
 */
export function play(paths, drops, energy) {
  const gain = (cell) => (drops.get(cell) ?? 0) - 1;
  // Ствол (или единственная линия) идёт один.
  let e = energy == null ? Infinity : energy;
  const order = [];
  const trunk = paths[0];
  for (let i = 1; i < trunk.length; i += 1) {
    if (e < 1) return { ok: false, order: [], switches: 0 };
    e += gain(trunk[i]);
    order.push([0, trunk[i]]);
  }
  const branches = paths.slice(1);
  const k = branches.length;
  if (k === 0) return { ok: true, order, switches: 0 };
  // Префиксные приросты по веткам.
  const pref = branches.map((b) => {
    const p = [0];
    for (const cell of b) p.push(p[p.length - 1] + gain(cell));
    return p;
  });
  const dims = branches.map((b) => b.length + 1);
  const strides = [];
  let total = 1;
  for (let i = 0; i < k; i += 1) {
    strides.push(total);
    total *= dims[i];
  }
  // 0-1 BFS по (позиция, последняя ветка): вес — переключение.
  const INF = 1e9;
  const dist = new Int32Array(total * (k + 1)).fill(INF);
  const prev = new Int32Array(total * (k + 1)).fill(-1);
  const key = (pos, last) => pos * (k + 1) + last;
  const start = key(0, k);
  dist[start] = 0;
  const energyAt = (idx) => {
    let sum = e;
    for (let i = 0; i < k; i += 1) sum += pref[i][Math.floor(idx / strides[i]) % dims[i]];
    return sum;
  };
  const goal = total - 1;
  let best = -1;
  // 0-1 BFS: стек текущего уровня (нулевой вес) и очередь следующего (переключение).
  let cur = [start];
  let level = 0;
  const seenLevel = new Uint8Array(total * (k + 1));
  while (cur.length > 0 && best < 0) {
    const nextLevel = [];
    const stack = cur.slice();
    while (stack.length > 0) {
      const s = stack.pop();
      if (dist[s] !== level || seenLevel[s] === 1) continue;
      seenLevel[s] = 1;
      const pos = Math.floor(s / (k + 1));
      const last = s % (k + 1);
      if (pos === goal) {
        best = s;
        break;
      }
      const en = energyAt(pos);
      if (en < 1) continue;
      for (let b = 0; b < k; b += 1) {
        const at = Math.floor(pos / strides[b]) % dims[b];
        if (at >= branches[b].length) continue;
        const npos = pos + strides[b];
        const cost = last === k || last === b ? 0 : 1;
        const t = key(npos, b);
        if (dist[s] + cost < dist[t]) {
          dist[t] = dist[s] + cost;
          prev[t] = s;
          (cost === 0 ? stack : nextLevel).push(t);
        }
      }
    }
    cur = nextLevel;
    level += 1;
  }
  if (best < 0) return { ok: false, order: [], switches: 0 };
  const steps = [];
  for (let s = best; prev[s] !== -1; s = prev[s]) {
    const pos = Math.floor(s / (k + 1));
    const b = s % (k + 1);
    const at = Math.floor(pos / strides[b]) % dims[b];
    steps.push([b + 1, branches[b][at - 1]]);
  }
  steps.reverse();
  let switches = 0;
  for (let i = 1; i < steps.length; i += 1) if (steps[i][0] !== steps[i - 1][0]) switches += 1;
  return { ok: true, order: order.concat(steps), switches };
}

/** Проходится ли покрытие, если вести ветки по одной, в любом порядке (без чередования). */
export function playSequential(paths, drops, energy) {
  const gain = (cell) => (drops.get(cell) ?? 0) - 1;
  let e = energy == null ? Infinity : energy;
  for (let i = 1; i < paths[0].length; i += 1) {
    if (e < 1) return false;
    e += gain(paths[0][i]);
  }
  const branches = paths.slice(1);
  if (branches.length === 0) return true;
  const perms = (list) => (list.length <= 1 ? [list] : list.flatMap((x, i) => perms([...list.slice(0, i), ...list.slice(i + 1)]).map((p) => [x, ...p])));
  for (const perm of perms(branches.map((_, i) => i))) {
    let en = e;
    let good = true;
    for (const b of perm) {
      for (const cell of branches[b]) {
        if (en < 1) {
          good = false;
          break;
        }
        en += gain(cell);
      }
      if (!good) break;
    }
    if (good) return true;
  }
  return false;
}

/** Полный разбор уровня: сколько покрытий, сколько проходит, нужно ли чередование. */
export function analyze(level) {
  const sk = {
    w: level.w,
    h: level.h,
    start: level.start,
    fork: level.fork,
    arrows: level.arrows,
    finish: level.finish,
  };
  const drops = new Map(level.drops.map(([cell, x]) => [cell, x]));
  const all = covers(sk);
  let solving = 0;
  let sequential = 0;
  let bestSwitches = Infinity;
  let best = null;
  for (const paths of all.list) {
    const r = play(paths, drops, level.energy);
    if (!r.ok) continue;
    solving += 1;
    if (playSequential(paths, drops, level.energy)) sequential += 1;
    if (r.switches < bestSwitches) {
      bestSwitches = r.switches;
      best = { paths, order: r.order };
    }
  }
  const branchCount = sk.fork === null ? 0 : sk.arrows.length;
  return {
    covers: all.list.length,
    truncated: all.truncated,
    solving,
    sequential,
    needsSwitch: solving > 0 && sequential === 0,
    /** Переключений сверх минимума B − 1 в лучшем решении. */
    extraSwitches: Number.isFinite(bestSwitches) ? Math.max(0, bestSwitches - Math.max(branchCount - 1, 0)) : 0,
    switches: Number.isFinite(bestSwitches) ? bestSwitches : 0,
    best,
  };
}

/** Минимальный стартовый запас, при котором покрытие проходимо; null — если нет. */
export function minEnergy(paths, drops, cap = 60) {
  for (let e = 1; e <= cap; e += 1) if (play(paths, drops, e).ok) return e;
  return null;
}
