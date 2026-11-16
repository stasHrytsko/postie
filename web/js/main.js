/* Postie — flat prototype of the whole loop (author decisions 2026-11-16). No art: logic first.
   Three screens by swipe: Letters (calendar) ← Today (envelope) → Games (collection).
   Envelope: 10 new levels a day — 1..5 easy, 1..5 medium, 1..5 hard (9 together) + 1 hardest.
   The letter is readable as soon as the envelope is open. Day 1 is the introduction; later letters fork on
   whether yesterday's envelope was sent and which stamps were on it.
   Today is an empty screen with the letter in the middle (or "no letter" once sent). Tap -> the note -> "Go to puzzles" ->
   grid 3 x 4 -> after 3 solved "Send letter" appears -> the envelope and the stamps: stick any 3 in any order, go back to the puzzles and return later.
   An unsent envelope cannot be sent later. Every delivered level lands in the collection, solved or not.
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
  function today0() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(); }
  function fresh() { return { day: 1, env: {}, got: {}, done: {}, start: today0() }; }
  try { S = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { S = fresh(); }
  if (!S.start) S.start = today0();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function game(id) { return Postie.games.filter(function (g) { return g.id === id; })[0]; }
  function got(id) { return S.got[id] || (S.got[id] = []); }           // level numbers delivered by mail, in order of arrival
  function isDone(id, n) { return (S.done[id] || []).indexOf(n) >= 0; }
  function markDone(id, n) { var d = S.done[id] || (S.done[id] = []); if (d.indexOf(n) < 0) d.push(n); save(); }
  function rnd(seed) { return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }
  /* the collection shows a level only once its envelope has left: today's unsent levels live in the letter only */
  function shown(id) {
    var E = S.env['d' + S.day];
    if (!E || E.sent) return got(id);
    return got(id).filter(function (n) { return !E.cards.some(function (c) { return c.id === id && c.n === n; }); });
  }
  function ord(id, n) { return got(id).indexOf(n) + 1; }                // what the player sees: number by order of arrival
  function dOf(id, n) { return (S.top && S.top[id] || []).indexOf(n) >= 0 ? 4 : diff(game(id).levels[n - 1]); }
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
      used[x.id] = 1; got(x.id).push(x.n); if (hardest) { S.top = S.top || {}; (S.top[x.id] = S.top[x.id] || []).push(x.n); } cards.push({ id: x.id, n: x.n, d: hardest ? 4 : diff(game(x.id).levels[x.n - 1]) });
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
    var foot = h('div', { class: 'foot' });
    var el = h('div', { class: 'sh ' + (opts.cls || '') }, [h('div', { class: 'bar2' }, [
      h('button', { class: 'ib', 'aria-label': 'Back', html: Postie.icon('back'), onclick: function () { close(); } }), t, opts.right || h('span', { style: 'width:44px' })]), body, foot]);
    function close() { el.remove(); if (opts.onclose) opts.onclose(); }
    root.appendChild(el); return { body: body, foot: foot, close: close };
  }
  function letterEl(lt) { return h('div', { class: 'letter' }, [h('div', null, [lt.text]), lt.re ? h('div', { class: 're' }, [lt.re]) : null]); }
  function stampEl(c) { var g = game(c.id); return h('div', { class: 'slot f d' + c.d }, [g.name, h('small', null, ['level ' + ord(c.id, c.n)])]); }

  /* ---------- play ---------- */
  function play(id, n, after, E) {                                      // E: today's envelope, when the level is played from it
    var g = game(id), lv = g.levels[n - 1], cleanups = [], rules = h('div', { class: 'rules', style: 'display:none', html: g.rules || '' }), stage = h('div');
    function clean() { cleanups.forEach(function (f) { try { f(); } catch (e) {} }); cleanups = []; }
    var o = sheet(g.name, 'Level ' + ord(id, n), { cls: 'play', onclose: function () { clean(); after && after(); },
      right: h('div', { style: 'display:flex' }, [
        h('button', { class: 'ib', 'aria-label': 'Rules', html: Postie.icon('help'), onclick: function () { rules.style.display = rules.style.display === 'none' ? '' : 'none'; } }),
        h('button', { class: 'ib', 'aria-label': 'Restart', html: Postie.icon('redo'), onclick: function () { mount(); } })]) });
    o.body.appendChild(rules); o.body.appendChild(stage);
    if (!(S.done[id] || []).length) rules.style.display = '';            // first time in this game: rules are open
    function mount() {
      clean(); stage.innerHTML = ''; var inner = h('div'); stage.appendChild(inner);
      g.mount(inner, { n: n, level: lv, engine: g.engine, cleanup: function (f) { cleanups.push(f); },
        win: function () { markDone(id, n); setTimeout(function () { solvedPopup(); }, 500); } });
    }
    mount();
    /* popup after every puzzle of the envelope: Next; from the 3rd also Send letter; after the 10th only Send letter */
    function solvedPopup() {
      var box = h('div', { class: 'popbox' }, [h('span', { class: 'dot ok d' + dOf(id, n), html: Postie.icon('check') }), h('b', null, ['Solved'])]), nxt = null;
      function btn(t, f, cls) { box.appendChild(h('button', { class: 'big ' + (cls || ''), onclick: f }, [t])); }
      if (E && !E.sent) {                                                // from the envelope
        var sol = solvedIdx(E);
        E.cards.forEach(function (c, i) { if (!nxt && sol.indexOf(i) < 0) nxt = c; });
        box.appendChild(h('span', null, [sol.length + ' of ' + E.cards.length + (sol.length < 3 ? ' · ' + (3 - sol.length) + ' more to send' : '')]));
        if (nxt) btn('Next', function () { o.close(); play(nxt.id, nxt.n, after, E); }, sol.length >= 3 ? 'o' : '');
        if (sol.length >= 3) btn('Send letter', function () { o.close(); openEnvelope(E); });
      } else {                                                           // from the collection: next unsolved level of this game, no stamps
        var a = shown(id), rest = a.filter(function (m) { return !isDone(id, m); }), k = a.indexOf(n);
        nxt = rest.filter(function (m) { return a.indexOf(m) > k; })[0] || rest[0];
        box.appendChild(h('span', null, [(a.length - rest.length) + ' of ' + a.length + ' in ' + g.name]));
        if (nxt) btn('Next', function () { o.close(); play(id, nxt, after); });
        else btn('All solved · back', function () { o.close(); }, 'o');
      }
      o.body.parentNode.appendChild(h('div', { class: 'pop' }, [box]));
    }
  }

  /* ---------- Today: empty screen, in the middle — a letter, or no letter (already sent) ---------- */
  function drawToday(p) {
    var E = envelope();
    p.classList.add('mid');
    if (E.sent) { p.appendChild(h('div', { class: 'nol' }, [h('div', { class: 'envi off' }), h('b', null, ['No letter']), h('span', null, ['Already sent. The next one comes tomorrow.'])])); return; }
    p.appendChild(h('button', { class: 'nol', onclick: function () { openNote(E); } }, [h('div', { class: 'envi' }), h('b', null, [E.opened ? 'Letter' : 'New letter']), h('span', null, ['Tap to open'])]));
  }
  /* the note: his letter, one button below — to the puzzles */
  function openNote(E) {
    E.opened = true; save();
    var o = sheet('Day ' + S.day, 'Letter', { onclose: draw });
    o.body.appendChild(letterEl(E.letter));
    o.foot.appendChild(h('button', { class: 'big', onclick: function () { openPuzzles(E); } }, ['Go to puzzles']));
  }
  /* the puzzles: grid 3 x 4 for ten; after 3 solved the Send button appears */
  function openPuzzles(E) {
    var o = sheet('Day ' + S.day, 'Solve any 3 to send');
    function render() {
      o.body.innerHTML = ''; o.foot.innerHTML = '';
      var sol = solvedIdx(E), grid = h('div', { class: 'pz' });
      E.cards.forEach(function (c, i) {
        var ok = sol.indexOf(i) >= 0;
        grid.appendChild(h('button', { class: 'd' + c.d + (ok ? ' ok' : ''), onclick: function () { play(c.id, c.n, render, E); } }, [
          h('i', { html: ok ? Postie.icon('check') : '' }), h('b', null, [game(c.id).name]), h('small', null, [DN[c.d] + ' · ' + ord(c.id, c.n)])]));
      });
      o.body.appendChild(grid);
      if (E.cards.length < 10) o.body.appendChild(h('div', { class: 'note' }, ['Only ' + E.cards.length + ' new levels left in stock — the level generator is not here yet.']));
      if (sol.length < 3) return;
      o.foot.appendChild(h('button', { class: 'big', onclick: function () { openEnvelope(E); } }, ['Send letter']));
    }
    render();
  }
  /* Send letter -> the envelope and the stamps: stick any 3 in any order. Back returns to the puzzles; what is stuck stays stuck. */
  function openEnvelope(E) {
    var o = sheet('Day ' + S.day, 'Stick 3 stamps');
    function render() {
      o.body.innerHTML = ''; o.foot.innerHTML = '';
      var sol = solvedIdx(E);
      E.stuck = E.stuck.filter(function (i) { return sol.indexOf(i) >= 0; });
      var slots = h('div', { class: 'slots' });
      for (var k = 0; k < 3; k++) (function (k) {
        var i = E.stuck[k];
        if (i == null) return slots.appendChild(h('div', { class: 'slot' }, ['stamp ' + (k + 1)]));
        var el = stampEl(E.cards[i]); el.addEventListener('click', function () { E.stuck.splice(k, 1); save(); render(); }); slots.appendChild(el);
      })(k);
      o.body.appendChild(h('div', { class: 'envbig' }, [slots, h('div', { class: 'to' }, ['To: the postman'])]));
      o.body.appendChild(h('h2', null, ['Your stamps · ' + sol.length]));
      var tray = h('div', { class: 'pz' });
      sol.forEach(function (i) {
        var c = E.cards[i], on = E.stuck.indexOf(i) >= 0;
        tray.appendChild(h('button', { class: 'd' + c.d + ' ok' + (on ? ' used' : ''), onclick: function () {
          if (on) E.stuck.splice(E.stuck.indexOf(i), 1); else if (E.stuck.length < 3) E.stuck.push(i); else return toast('Only three stamps fit');
          save(); render();
        } }, [h('i'), h('b', null, [game(c.id).name]), h('small', null, ['level ' + ord(c.id, c.n)])]));
      });
      o.body.appendChild(tray);
      o.body.appendChild(h('div', { class: 'note' }, ['Tap a stamp to stick it, tap it on the envelope to take it off. The stamps you do not use burn.']));
      o.foot.appendChild(h('button', { class: 'big', disabled: E.stuck.length === 3 ? null : 'disabled', onclick: function () { send(E); } }, [E.stuck.length === 3 ? 'Send' : 'Stick ' + (3 - E.stuck.length) + ' more']));
    }
    render();
  }
  function send(E) {
    E.sent = true; save();
    Array.prototype.slice.call(root.querySelectorAll('.sh')).forEach(function (x) { x.remove(); });
    draw(); toast('Letter sent');
  }

  /* ---------- Games (collection): only what came by mail ---------- */
  function drawGames(p) {
    var here = Postie.games.filter(function (g) { return shown(g.id).length; }), total = 0, solved = 0, grid = h('div', { class: 'pz' });
    here.forEach(function (g) {
      var a = shown(g.id), sv = a.filter(function (n) { return isDone(g.id, n); }).length, left = a.length - sv; total += a.length; solved += sv;
      grid.appendChild(h('button', { class: 'gm' + (left ? '' : ' ok'), onclick: function () { openGame(g.id); } }, [
        h('i', { html: left ? String(left) : Postie.icon('check') }), h('b', null, [g.name]), h('small', null, [sv + ' / ' + a.length])]));
    });
    if (!here.length) { p.classList.add('mid'); p.appendChild(h('div', { class: 'nol' }, [h('b', null, ['Empty for now']), h('span', { style: 'text-align:center' }, ['Puzzles come here after you send the letter.'])])); return; }
    p.appendChild(h('h2', null, ['Collection · ' + solved + ' / ' + total + ' solved']));
    p.appendChild(grid);
    p.appendChild(h('div', { class: 'note', style: 'margin-top:18px' }, ['The number in the circle — levels still unsolved. Today\'s puzzles come here after you send the letter.']));
  }
  /* a game: its levels in order of arrival, numbered 1, 2, 3… */
  function openGame(id) {
    var g = game(id), o = sheet(g.name, '', { onclose: draw });
    function render() {
      o.body.innerHTML = '';
      var a = shown(id), sv = a.filter(function (n) { return isDone(id, n); }).length;
      o.body.appendChild(h('div', { class: 'note' }, [sv + ' of ' + a.length + ' solved']));
      var grid = h('div', { class: 'lvs' });
      a.forEach(function (n, k) {
        grid.appendChild(h('button', { class: 'd' + dOf(id, n) + (isDone(id, n) ? ' ok' : ''), onclick: function () { play(id, n, render); } }, [String(k + 1)]));
      });
      o.body.appendChild(grid);
    }
    render();
  }

  /* ---------- Letters (calendar) ---------- */
  /* Calendar: a real month. Day d of the game = start date + (d - 1). Prototype: "Next day" moves the date too.
     Two states: sent = filled, tap -> letter + stamps · not sent = plain, nothing to read (the letter is gone; its levels slept over in Games).
     Today -> the Today screen. No way from a day to its levels. */
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], calShift = 0;
  function dateOf(d) { var x = new Date(S.start); x.setDate(x.getDate() + d - 1); return x; }
  function dayOf(date) { return Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()) - new Date(S.start)) / 864e5) + 1; }
  function drawLetters(p) {
    var sent = 0; for (var k in S.env) if (S.env[k].sent) sent++;
    var now = dateOf(S.day), first = new Date(now.getFullYear(), now.getMonth() + calShift, 1), startM = dateOf(1);
    var canBack = first > new Date(startM.getFullYear(), startM.getMonth(), 1), canFwd = calShift < 0;
    p.appendChild(h('div', { class: 'sent' }, [h('b', null, [String(sent)]), h('span', null, [sent === 1 ? 'letter sent' : 'letters sent'])]));
    p.appendChild(h('div', { class: 'mon' }, [
      h('button', { class: 'ib', 'aria-label': 'Previous month', disabled: canBack ? null : 'disabled', html: Postie.icon('left'), onclick: function () { calShift--; draw(); } }),
      h('b', null, [MON[first.getMonth()] + ' ' + first.getFullYear()]),
      h('button', { class: 'ib', 'aria-label': 'Next month', disabled: canFwd ? null : 'disabled', html: Postie.icon('right'), onclick: function () { calShift++; draw(); } })]));
    var wk = h('div', { class: 'days wk' }); ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(function (c) { wk.appendChild(h('span', null, [c])); }); p.appendChild(wk);
    var days = h('div', { class: 'days' }), lead = (first.getDay() + 6) % 7, n = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    for (var i = 0; i < lead; i++) days.appendChild(h('span'));
    for (var m = 1; m <= n; m++) (function (m) {
      var d = dayOf(new Date(first.getFullYear(), first.getMonth(), m)), E = S.env['d' + d], cls = 'dd', tap = null;
      if (d < 1 || d > S.day) cls += ' no';
      else if (d === S.day) { cls += ' t' + (E && E.sent ? ' s' : ''); tap = function () { go(1, true); }; }
      else if (E && E.sent) { cls += ' s'; tap = function () { openDay(d); }; }
      else cls += ' miss';
      days.appendChild(h('button', { class: cls, disabled: tap ? null : 'disabled', onclick: tap }, [String(m)]));
    })(m);
    p.appendChild(days);
    p.appendChild(h('div', { class: 'legend' }, [h('span', null, [h('i', { class: 's' }), 'sent']), h('span', null, [h('i'), 'not sent'])]));
  }
  function openDay(d) {
    var E = S.env['d' + d], dt = dateOf(d), o = sheet(dt.getDate() + ' ' + MON[dt.getMonth()], 'Sent');
    o.body.appendChild(h('h2', null, ['Letter'])); o.body.appendChild(letterEl(E.letter));
    o.body.appendChild(h('h2', null, ['Your stamps']));
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
    var top = h('div', { class: 'top' }, [h('span', { style: 'width:44px' }), h('b', null, [(function () { var x = dateOf(S.day); return x.getDate() + ' ' + MON[x.getMonth()]; })()]), h('button', { class: 'tst', onclick: testMenu }, ['test'])]);
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
    b('Next day', function () { S.day++; calShift = 0; save(); pan = 1; o.close(); draw(); toast('A new envelope'); });
    b('Solve 3 puzzles of today', function () { var E = envelope(), k = 0; E.cards.forEach(function (c) { if (k < 3 && !isDone(c.id, c.n)) { markDone(c.id, c.n); k++; } }); o.close(); draw(); }, 'o');
    b('Reset everything', function () { if (!confirm('Reset all progress?')) return; S = fresh(); save(); pan = 1; o.close(); draw(); }, 'o');
  }
  window.addEventListener('resize', function () { if (pans) pans.scrollLeft = pan * pans.clientWidth; });

  /* load games (same loader as the gallery) */
  function load(src) { return new Promise(function (ok) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { ok(); }; document.body.appendChild(s); }); }
  var chain = Promise.resolve();
  POSTIE_GAMES.forEach(function (id) { ['levels', 'engine', 'view'].forEach(function (f) { chain = chain.then(function () { return load('games/' + id + '/' + f + '.js'); }); }); });
  chain.then(function () { Postie.games.sort(function (a, b) { return POSTIE_GAMES.indexOf(a.id) - POSTIE_GAMES.indexOf(b.id); }); draw(); });
})();
