/* Postie — flat prototype of the whole loop (author decisions 2026-11-16). No art: logic first.
   Three screens by swipe: Letters (calendar) ← Today (envelope) → Games (collection).
   Envelope: 10 new levels a day — 1..5 easy, 1..5 medium, 1..5 hard (9 together) + 1 hardest.
   The letter is readable as soon as the envelope is open. Day 1 is the introduction; later letters fork on
   whether yesterday's envelope was sent and which stamps were on it.
   To send: solve 3, stick 3 stamps. Every delivered level lands in the collection, solved or not.
   Everything is local (localStorage). "test" in the corner: next day, solve 3, reset. */
(function () {
  var h = Postie.h, KEY = 'postie:flat:v1', DN = ['', 'easy', 'medium', 'hard', 'hardest'];
  /* flat piece colours for game boards (shapes stay) */
  var FLAT = { apr: '#E8475F', blue: '#6C8CC4', sage: '#7BB58A', butter: '#FFCB5C', sand: '#B9B9C0', ink: '#1D1D1F' };
  Postie.PIECES.forEach(function (p) { p.c = FLAT[p.k] || p.c; });
  Postie.C.milk = Postie.C.card = '#FFFFFF'; Postie.C.ink = Postie.C.txt = '#1D1D1F'; Postie.C.line = '#DCDCE0'; Postie.C.sand = '#F1F1F3';
  Postie.C.apr = FLAT.apr; Postie.C.blue = FLAT.blue; Postie.C.sage = FLAT.sage; Postie.C.butter = FLAT.butter; Postie.C.bad = '#E8475F'; Postie.C.mut = '#8A8A90';

  /* ---------- letters (voice drafts from world/letters-draft.md; Russian until the author writes the English ones) ---------- */
  var L = {
    first: 'Это первое письмо. Я не знаю, кто ты. Знаю только, что у тебя есть стол, полка и почтомат. Я буду приходить раз в день. В конверте десять пазлов — их здесь ещё понимают. Реши три, наклей три марки и отправь конверт обратно. Остальное потом.',
    any: ['У каждого пазла один ответ. Я знаю все десять. Не знаю только, какие три выберешь ты.',
      'Я решаю такой пазл быстрее, чем ты моргнёшь. Поэтому я их не решаю. Я их ношу.',
      'Десятый никто не обязан решать. Я кладу его каждый день. Вдруг сегодня тебе захочется того, что не нужно.',
      'Мне не нужно спать. Но между твоим конвертом и моим письмом проходит ночь. Я её ничем не заполняю. Кажется, это называется ждать.',
      'Сегодня шёл дождь. Я стоял под ним дольше, чем нужно. Никто не сказал мне зайти.',
      'Сегодня ничего не случилось. Вот конверт.',
      'Один человек клеил марку вверх ногами. На каждое письмо. Я сорок лет считал это ошибкой. Потом понял: это подпись.',
      'Начал это письмо три раза. Это четвёртое. Оно не лучше.',
      'Если бы никто никогда не узнал, что ты решил этот пазл, — ты бы его решал?',
      'В последний день почты пришло одно письмо. Без адреса. Внутри два слова: «Кому-нибудь». Я решил, что это мне.',
      'Достаточно — это сколько?',
      'Когда-то я сказал людям одну фразу. Её измерили, нашли неэффективной и пошли дальше. Теперь я говорю её по одному слову в день.']
  };
  /* forks: what yesterday's envelope looked like -> the paragraph that answers it */
  var R = {
    unsent: 'Вчера конверт не пришёл. Я проверил почтомат дважды: работает. Значит, день был твой, а не мой.',
    unsent2: 'Некоторые комнаты не открывают конверт. Я кладу следующий сверху. Не знаю, кто из нас прав.',
    top: 'Марка с десятого. Его никто не обязан решать. Ты и не был обязан. Это всё, что я хотел сказать этим пазлом.',
    same: 'Три одинаковые марки. На почте так клеили, когда письмо было важное: чтобы точно дошло. Дошло.',
    easy: 'Три лёгких. Лёгкое не значит быстрое. Суп тоже лёгкий. Его варят два часа.',
    hard: 'Три трудных. Я не спрашиваю зачем. Я положил их рядом и смотрел, как они молчат.',
    diff: 'Три разные. Я разложил их на столе и долго менял местами. Порядка не нашёл. Оставил так.'
  };

  /* ---------- state ---------- */
  var S, pan = 1;
  function fresh() { return { day: 1, env: {}, got: {}, done: {} }; }
  try { S = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { S = fresh(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function game(id) { return Postie.games.filter(function (g) { return g.id === id; })[0]; }
  function got(id) { return S.got[id] || (S.got[id] = []); }           // level numbers delivered by mail, in order of arrival
  function isDone(id, n) { return (S.done[id] || []).indexOf(n) >= 0; }
  function markDone(id, n) { var d = S.done[id] || (S.done[id] = []); if (d.indexOf(n) < 0) d.push(n); save(); }
  function rnd(seed) { return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }
  function diff(lv) { return Math.max(1, Math.min(3, lv.difficulty || 2)); }

  /* ---------- today's envelope ---------- */
  function wave(r) {                                                     // 1..5 of each, 9 together
    for (;;) { var e = 1 + Math.floor(r() * 5), m = 1 + Math.floor(r() * 5), x = 9 - e - m; if (x >= 1 && x <= 5) return [e, m, x]; }
  }
  /* next level of difficulty d that has not arrived yet: one candidate per game (its first such level), random game, games not yet in today's envelope first */
  function nextLevel(d, used, r, hardest) {
    var c = [];
    Postie.games.forEach(function (g) {
      for (var i = 0; i < g.levels.length; i++) {
        if (got(g.id).indexOf(i + 1) >= 0 || diff(g.levels[i]) !== d) continue;
        if (!hardest) { c.push({ id: g.id, n: i + 1 }); return; }
        c.push({ id: g.id, n: i + 1, w: (g.levels[i].best || 0) + i });  // hardest: every remaining hard level competes
      }
    });
    if (!c.length) return null;
    if (hardest) return c.sort(function (a, b) { return b.w - a.w; })[0];
    var fresh = c.filter(function (x) { return !used[x.id]; }); if (fresh.length) c = fresh;
    return c[Math.floor(r() * c.length)];
  }
  function envelope() {
    var key = 'd' + S.day; if (S.env[key]) return S.env[key];
    var r = rnd(S.day * 7919 + 13), w = wave(r), cards = [], used = {};
    function add(d, hardest) {
      var x = nextLevel(d, used, r, hardest) || nextLevel(d === 1 ? 2 : d - 1, used, r) || nextLevel(3, used, r) || nextLevel(2, used, r) || nextLevel(1, used, r);
      if (!x) return;                                                    // stock is empty: the generator is not here yet
      used[x.id] = 1; got(x.id).push(x.n); cards.push({ id: x.id, n: x.n, d: hardest ? 4 : diff(game(x.id).levels[x.n - 1]) });
    }
    add(3, true);                                                        // the hardest first, so it really is the hardest left
    [1, 2, 3].forEach(function (d, k) { for (var i = 0; i < w[k]; i++) add(d); });
    if (cards.length && cards[0].d === 4) cards.push(cards.shift());     // show it last
    S.env[key] = { cards: cards, stuck: [], sent: false, letter: letterFor(S.day) };
    save(); return S.env[key];
  }
  function letterFor(day) {
    if (day === 1) return { text: L.first, re: null };
    var r = rnd(day * 104729), y = S.env['d' + (day - 1)], re;
    if (!y || !y.sent) { var b = S.env['d' + (day - 2)]; re = (day > 2 && (!b || !b.sent)) ? R.unsent2 : R.unsent; }
    else {
      var st = y.stuck.map(function (i) { return y.cards[i]; });
      re = st.some(function (s) { return s.d === 4; }) ? R.top
        : st.every(function (s) { return s.id === st[0].id; }) ? R.same
        : st.every(function (s) { return s.d === 1; }) ? R.easy
        : st.every(function (s) { return s.d >= 3; }) ? R.hard : R.diff;
    }
    return { text: L.any[Math.floor(r() * L.any.length)], re: re };
  }
  function solvedIdx(E) { var a = []; E.cards.forEach(function (c, i) { if (isDone(c.id, c.n)) a.push(i); }); return a; }

  /* ---------- small UI pieces ---------- */
  var root = document.getElementById('app');
  function dot(d, ok) { return h('span', { class: 'dot d' + d + (ok ? ' ok' : ''), html: ok ? Postie.icon('check') : '' }); }
  function toast(t) { var e = h('div', { class: 'toast' }, [t]); root.appendChild(e); setTimeout(function () { e.remove(); }, 2000); }
  function sheet(title, sub, opts) {
    opts = opts || {};
    var body = h('div', { class: 'body' }), t = h('div', { class: 't' }, [title, sub ? h('small', null, [sub]) : null]);
    var el = h('div', { class: 'sh ' + (opts.cls || '') }, [h('div', { class: 'bar2' }, [
      h('button', { class: 'ib', 'aria-label': 'Back', html: Postie.icon('back'), onclick: function () { close(); } }), t, opts.right || h('span', { style: 'width:44px' })]), body]);
    function close() { el.remove(); if (opts.onclose) opts.onclose(); }
    root.appendChild(el); return { body: body, close: close };
  }
  function letterEl(lt) { return h('div', { class: 'letter' }, [h('div', null, [lt.text]), lt.re ? h('div', { class: 're' }, [lt.re]) : null]); }
  function stampEl(c) { var g = game(c.id); return h('div', { class: 'slot f d' + c.d }, [g.name, h('small', null, ['level ' + c.n])]); }

  /* ---------- play ---------- */
  function play(id, n, after) {
    var g = game(id), lv = g.levels[n - 1], cleanups = [], rules = h('div', { class: 'rules', style: 'display:none', html: g.rules || '' }), stage = h('div');
    function clean() { cleanups.forEach(function (f) { try { f(); } catch (e) {} }); cleanups = []; }
    var o = sheet(g.name, 'Level ' + n, { cls: 'play', onclose: function () { clean(); after && after(); },
      right: h('div', { style: 'display:flex' }, [
        h('button', { class: 'ib', 'aria-label': 'Rules', html: Postie.icon('help'), onclick: function () { rules.style.display = rules.style.display === 'none' ? '' : 'none'; } }),
        h('button', { class: 'ib', 'aria-label': 'Restart', html: Postie.icon('redo'), onclick: function () { mount(); } })]) });
    o.body.appendChild(rules); o.body.appendChild(stage);
    if (!(S.done[id] || []).length) rules.style.display = '';            // first time in this game: rules are open
    function mount() {
      clean(); stage.innerHTML = ''; var inner = h('div'); stage.appendChild(inner);
      g.mount(inner, { n: n, level: lv, engine: g.engine, cleanup: function (f) { cleanups.push(f); },
        win: function () { markDone(id, n); setTimeout(function () { o.close(); toast('Solved · ' + g.name + ' ' + n); }, 500); } });
    }
    mount();
  }

  /* ---------- Today ---------- */
  function drawToday(p) {
    var E = envelope(), sol = solvedIdx(E);
    E.stuck = E.stuck.filter(function (i) { return sol.indexOf(i) >= 0; });
    p.appendChild(h('h2', null, ['Letter']));
    p.appendChild(letterEl(E.letter));
    p.appendChild(h('h2', null, ['Envelope · ' + E.cards.length + ' puzzles']));
    if (E.cards.length < 10) p.appendChild(h('div', { class: 'note' }, ['Only ' + E.cards.length + ' new levels left in stock — the level generator is not here yet.']));
    E.cards.forEach(function (c, i) {
      var ok = sol.indexOf(i) >= 0, on = E.stuck.indexOf(i) >= 0;
      var row = h('div', { class: 'rowi', role: 'button', tabindex: '0', onclick: function () { play(c.id, c.n, draw); } }, [
        dot(c.d, ok), h('span', { class: 'nm' }, [game(c.id).name + ' ', h('small', null, [String(c.n)])]), h('small', null, [DN[c.d]])]);
      if (ok && !E.sent) row.appendChild(h('button', { class: 'stick' + (on ? ' on' : ''), onclick: function (e) {
        e.stopPropagation();
        if (on) E.stuck.splice(E.stuck.indexOf(i), 1); else if (E.stuck.length < 3) E.stuck.push(i); else return toast('Only three stamps fit');
        save(); draw();
      } }, [on ? 'On envelope' : 'Stick stamp']));
      p.appendChild(row);
    });
    p.appendChild(h('h2', null, ['Stamps on the envelope']));
    var slots = h('div', { class: 'slots' });
    for (var k = 0; k < 3; k++) slots.appendChild(E.stuck[k] != null ? stampEl(E.cards[E.stuck[k]]) : h('div', { class: 'slot' }, ['stamp ' + (k + 1)]));
    p.appendChild(slots);
    if (E.sent) { p.appendChild(h('button', { class: 'big', disabled: 'disabled' }, ['Sent'])); p.appendChild(h('div', { class: 'note' }, ['New envelope tomorrow. He answers your stamps.'])); return; }
    var ready = E.stuck.length === 3;
    p.appendChild(h('button', { class: 'big', disabled: ready ? null : 'disabled', onclick: function () { E.sent = true; save(); draw(); toast('Envelope sent'); } },
      [sol.length < 3 ? 'Solve ' + (3 - sol.length) + ' more to send' : !ready ? 'Stick ' + (3 - E.stuck.length) + ' more stamp' + (3 - E.stuck.length > 1 ? 's' : '') : 'Send envelope']));
    if (sol.length > 3) p.appendChild(h('div', { class: 'note' }, [sol.length + ' stamps earned. Three go on the envelope, the rest burn.']));
  }

  /* ---------- Games (collection): only what came by mail ---------- */
  function drawGames(p) {
    var total = 0, solved = 0, here = [], away = [];
    Postie.games.forEach(function (g) { (got(g.id).length ? here : away).push(g); });
    here.forEach(function (g) { total += got(g.id).length; solved += got(g.id).filter(function (n) { return isDone(g.id, n); }).length; });
    p.appendChild(h('h2', null, ['Collection · ' + solved + ' / ' + total + ' solved']));
    here.forEach(function (g) {
      var a = got(g.id), s = a.filter(function (n) { return isDone(g.id, n); }).length;
      p.appendChild(h('button', { class: 'rowi', onclick: function () { openGame(g.id); } }, [h('span', { class: 'nm' }, [g.name]), h('small', null, [s + ' / ' + a.length])]));
    });
    if (away.length) p.appendChild(h('h2', null, ['Arrives by mail']));
    away.forEach(function (g) { p.appendChild(h('div', { class: 'rowi away' }, [h('span', { class: 'nm' }, [g.name])])); });
  }
  function openGame(id) {
    var g = game(id), today = envelope().cards;
    var o = sheet(g.name, '', { onclose: draw });
    function render() {
      o.body.innerHTML = '';
      var a = got(id), s = a.filter(function (n) { return isDone(id, n); }).length;
      o.body.appendChild(h('div', { class: 'note' }, [s + ' of ' + a.length + ' solved · levels arrive by mail']));
      var grid = h('div', { class: 'lvs' });
      a.forEach(function (n) {
        var t = today.filter(function (c) { return c.id === id && c.n === n; })[0], d = t ? t.d : diff(g.levels[n - 1]);
        grid.appendChild(h('button', { class: 'd' + d + (isDone(id, n) ? ' ok' : ''), onclick: function () { play(id, n, render); } }, [String(n)]));
      });
      o.body.appendChild(grid);
    }
    render();
  }

  /* ---------- Letters (calendar) ---------- */
  function drawLetters(p) {
    var sent = 0; for (var k in S.env) if (S.env[k].sent) sent++;
    p.appendChild(h('h2', null, ['Calendar · ' + sent + ' sent']));
    var days = h('div', { class: 'days' }), last = Math.max(28, Math.ceil(S.day / 7) * 7);
    for (var d = 1; d <= last; d++) (function (d) {
      var E = S.env['d' + d];
      days.appendChild(h('button', { class: 'dd' + (E && E.sent ? ' s' : '') + (d === S.day ? ' t' : '') + (d > S.day ? ' no' : ''), onclick: function () { if (d <= S.day) openDay(d); } }, [String(d)]));
    })(d);
    p.appendChild(days);
    p.appendChild(h('div', { class: 'note', style: 'margin-top:16px' }, ['Filled — envelope sent. Tap a day to read his letter.']));
  }
  function openDay(d) {
    var E = S.env['d' + d], o = sheet('Day ' + d, E && E.sent ? 'Sent' : 'Not sent');
    if (!E) { o.body.appendChild(h('div', { class: 'note' }, ['The envelope was not opened that day.'])); return; }
    o.body.appendChild(h('h2', null, ['Letter'])); o.body.appendChild(letterEl(E.letter));
    o.body.appendChild(h('h2', null, ['Your stamps']));
    if (!E.sent) { o.body.appendChild(h('div', { class: 'note' }, ['No stamps: the envelope stayed here.'])); return; }
    var slots = h('div', { class: 'slots' }); E.stuck.forEach(function (i) { slots.appendChild(stampEl(E.cards[i])); }); o.body.appendChild(slots);
  }

  /* ---------- shell ---------- */
  var pans, tabs, scrollY = [0, 0, 0];
  function draw() {
    if (pans) Array.prototype.forEach.call(pans.children, function (p, i) { scrollY[i] = p.scrollTop; });
    Array.prototype.slice.call(root.children).forEach(function (c) { if (!c.classList.contains('sh') && !c.classList.contains('toast')) c.remove(); });
    var ps = [h('div', { class: 'pan' }), h('div', { class: 'pan' }), h('div', { class: 'pan' })];
    drawLetters(ps[0]); drawToday(ps[1]); drawGames(ps[2]);
    pans = h('div', { class: 'pans' }, ps);
    tabs = h('div', { class: 'tabs' }, ['Letters', 'Today', 'Games'].map(function (t, k) { return h('button', { class: k === pan ? 'on' : '', onclick: function () { go(k, true); } }, [t]); }));
    var top = h('div', { class: 'top' }, [h('span', { style: 'width:44px' }), h('b', null, ['Day ' + S.day]), h('button', { class: 'tst', onclick: testMenu }, ['test'])]);
    root.insertBefore(tabs, root.firstChild); root.insertBefore(pans, tabs); root.insertBefore(top, pans);
    pans.scrollLeft = pan * pans.clientWidth;
    ps.forEach(function (p, i) { p.scrollTop = scrollY[i]; });
    pans.addEventListener('scroll', function () {
      var k = Math.round(pans.scrollLeft / pans.clientWidth); if (k === pan) return; pan = k;
      Array.prototype.forEach.call(tabs.children, function (b, i) { b.className = i === k ? 'on' : ''; });
    });
  }
  function go(k, smooth) { pans.scrollTo({ left: k * pans.clientWidth, behavior: smooth ? 'smooth' : 'auto' }); }
  function testMenu() {
    var o = sheet('Test', 'Prototype tools');
    function b(t, f, cls) { o.body.appendChild(h('button', { class: 'big ' + (cls || ''), style: 'margin-top:10px', onclick: f }, [t])); }
    b('Next day', function () { S.day++; save(); pan = 1; o.close(); draw(); toast('Day ' + S.day + ': a new envelope'); });
    b('Solve 3 puzzles of today', function () { var E = envelope(), k = 0; E.cards.forEach(function (c) { if (k < 3 && !isDone(c.id, c.n)) { markDone(c.id, c.n); k++; } }); o.close(); draw(); }, 'o');
    b('Reset everything', function () { if (!confirm('Reset all progress?')) return; S = fresh(); save(); pan = 1; o.close(); draw(); }, 'o');
    o.body.appendChild(h('div', { class: 'note', style: 'margin-top:20px', html: 'Older prototypes: <a class="lnk" href="room.html">room (visual v2)</a> · <a class="lnk" href="games.html">gallery</a> · <a class="lnk" href="paper.html">paper</a>' }));
  }
  window.addEventListener('resize', function () { if (pans) pans.scrollLeft = pan * pans.clientWidth; });

  /* load games (same loader as the gallery) */
  function load(src) { return new Promise(function (ok) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { ok(); }; document.body.appendChild(s); }); }
  var chain = Promise.resolve();
  POSTIE_GAMES.forEach(function (id) { ['levels', 'engine', 'view'].forEach(function (f) { chain = chain.then(function () { return load('games/' + id + '/' + f + '.js'); }); }); });
  chain.then(function () { Postie.games.sort(function (a, b) { return POSTIE_GAMES.indexOf(a.id) - POSTIE_GAMES.indexOf(b.id); }); draw(); });
})();
