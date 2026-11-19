/* Postie — flat prototype of the whole loop (author decisions 2026-11-16). No art: logic first.
   Three screens by swipe: Letters (calendar) ← Today (letter) → Games.

   The letter: 9 new levels a day — 1..5 easy, 1..5 medium, 1..5 hard. Difficulty is not shown anywhere;
   the puzzles simply lie from easier to harder.
   Gentle start: day 1 — three games; day 2 +1; day 3 +1; day 5 +1; then +1 every second day until all are in.
   The first five days bring only easy and medium levels (5 + 4); a game gives only easy and medium on its first two days.
   Today: one thing in the middle with its state. First tap -> the note; later taps -> straight to the puzzles.
   Puzzles 3 x 3 -> popup after every solved one (Next / To the envelope / Back to puzzles) ->
   the envelope: stick any 3 stamps in any order -> Send letter. Not sent today — the letter is gone tomorrow.
   Levels reach Games only after the letter is sent (or the next day).
   Shapes: a circle is a puzzle, a square is a stamp.
   Every game runs in one frame: header (back, rules, restart), one message line, buttons at the bottom,
   the same "stuck" bar with Restart, the same rules card on the first visit.
   Everything is local (localStorage). "test" in the corner: next day, solve 3, reset. */
(function () {
  var h = Postie.h, KEY = 'postie:flat:v2', PER_DAY = 9;
  /* The look (web/kit/flat.css, html[data-look]) is a set of tokens; boards take their piece colours from the same tokens. */
  var LOOK = document.documentElement.getAttribute('data-look') === 'night' ? 'night' : 'post';
  function applyLook() {
    document.documentElement.setAttribute('data-look', LOOK);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = LOOK === 'night' ? '#131926' : '#F5F0E6';
    var css = getComputedStyle(document.documentElement), tok = function (n) { return css.getPropertyValue('--' + n).trim(); };
    var F = { apr: tok('apr'), blue: tok('blue'), sage: tok('sage'), butter: tok('butter'), sand: tok('stone'), ink: tok('ink') };
    Postie.PIECES.forEach(function (p) { p.c = F[p.k] || p.c; });
    ['milk', 'card', 'ink', 'txt', 'line', 'sand', 'bad', 'mut'].forEach(function (k) { Postie.C[k] = tok(k); });
    Postie.C.apr = F.apr; Postie.C.blue = F.blue; Postie.C.sage = F.sage; Postie.C.butter = F.butter;
  }
  applyLook();
  /* light / dark: the button in the corner of the home screen; the choice is remembered, before it — the phone's own setting */
  function toggleLook() { LOOK = LOOK === 'night' ? 'post' : 'night'; try { localStorage.setItem('postie:look', LOOK); } catch (e) {} applyLook(); draw(); }
  var SUN = '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/></svg>';
  var MOON = '<svg class="ic" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 019.5 4a7 7 0 1010.5 10.5z"/></svg>';

  /* ---------- letters (voice drafts from world/letters-draft.md; Russian until the author writes the English ones) ---------- */
  var L = {
    first: 'Это первое письмо. Я не знаю, кто ты. Знаю только, что у тебя есть стол, полка и почтомат. Я буду приходить раз в день. В конверте девять пазлов — их здесь ещё понимают. Реши три, наклей три марки и отправь конверт обратно сегодня: завтра будет уже другое письмо. Остальное потом.',
    any: ['У каждого пазла один ответ. Я знаю все девять. Не знаю только, какие три выберешь ты.',
      'Я решаю такой пазл быстрее, чем ты моргнёшь. Поэтому я их не решаю. Я их ношу.',
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
  /* forks: what yesterday's envelope looked like -> the paragraph that answers it. The game never explains the link. */
  var R = {
    unsent: 'Вчера конверт не пришёл. Я проверил почтомат дважды: работает. Значит, день был твой, а не мой.',
    unsent2: 'Некоторые комнаты не открывают конверт. Я кладу следующий сверху. Не знаю, кто из нас прав.',
    same: 'Три одинаковые марки. На почте так клеили, когда письмо было важное: чтобы точно дошло. Дошло.',
    easy: 'Три лёгких. Лёгкое не значит быстрое. Суп тоже лёгкий. Его варят два часа.',
    hard: 'Три трудных. Я не спрашиваю зачем. Я положил их рядом и смотрел, как они молчат.',
    diff: 'Три разные. Я разложил их на столе и долго менял местами. Порядка не нашёл. Оставил так.'
  };

  /* ---------- state ---------- */
  var S, pan = 1;
  function today0() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(); }
  function fresh() { return { day: 1, env: {}, got: {}, done: {}, seen: {}, start: today0() }; }
  try { S = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { S = fresh(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function game(id) { return Postie.games.filter(function (g) { return g.id === id; })[0]; }
  function got(id) { return S.got[id] || (S.got[id] = []); }           // level numbers delivered by mail, in order of arrival
  function isDone(id, n) { return (S.done[id] || []).indexOf(n) >= 0; }
  function markDone(id, n) { var d = S.done[id] || (S.done[id] = []); if (d.indexOf(n) < 0) d.push(n); save(); }
  function rnd(seed) { return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }
  /* Games shows a level only once its letter has left: today's unsent levels live in the letter only */
  function shown(id) {
    var E = S.env['d' + S.day];
    if (!E || E.sent) return got(id);
    return got(id).filter(function (n) { return !E.cards.some(function (c) { return c.id === id && c.n === n; }); });
  }
  function ord(id, n) { return got(id).indexOf(n) + 1; }                // what the player sees: number by order of arrival
  function diff(lv) { return Math.max(1, Math.min(3, lv.difficulty || 2)); }

  /* ---------- dates ---------- */
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function dateOf(d) { var x = new Date(S.start); x.setDate(x.getDate() + d - 1); return x; }
  function dayOf(date) { return Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()) - new Date(S.start)) / 864e5) + 1; }
  function dateStr(d) { var x = dateOf(d); return x.getDate() + ' ' + MON[x.getMonth()]; }

  /* ---------- which games are in, and what they may give ---------- */
  /* the day a game first arrives, by its place in web/games.js: 1,1,1 · 2 · 3 · 5 · then every second day */
  function gameDay(k) { return k < 3 ? 1 : k === 3 ? 2 : k === 4 ? 3 : 5 + 2 * (k - 5); }
  function firstDay(id) { return gameDay(POSTIE_GAMES.indexOf(id)); }
  function allowed(id, d, day) { var f = firstDay(id); return POSTIE_GAMES.indexOf(id) >= 0 && f <= day && (d < 3 || day >= f + 2); }   // first two days of a game: easy and medium only

  /* ---------- today's letter ---------- */
  function wave(r) {                                                     // 1..5 of each, 9 together
    for (;;) { var e = 1 + Math.floor(r() * 5), m = 1 + Math.floor(r() * 5), x = PER_DAY - e - m; if (x >= 1 && x <= 5) return [e, m, x]; }
  }
  /* next level of difficulty d that has not arrived yet: one candidate per game (its first such level), games used least today first */
  function nextLevel(d, used, r, day, only) {
    var c = [];
    Postie.games.forEach(function (g) {
      if (only && g.id !== only || !allowed(g.id, d, day)) return;
      for (var i = 0; i < g.levels.length; i++) if (got(g.id).indexOf(i + 1) < 0 && diff(g.levels[i]) === d && (!g.levels[i].needs || got(g.id).indexOf(g.levels[i].needs) >= 0)) { c.push({ id: g.id, n: i + 1, d: d }); return; }
    });
    if (!c.length) return null;
    var least = Math.min.apply(null, c.map(function (x) { return used[x.id] || 0; }));
    c = c.filter(function (x) { return (used[x.id] || 0) === least; });
    return c[Math.floor(r() * c.length)];
  }
  var FALL = { 1: [1, 2, 3], 2: [2, 1, 3], 3: [3, 2, 1] };
  function envelope() {
    var key = 'd' + S.day; if (S.env[key]) return S.env[key];
    var day = S.day, r = rnd(day * 7919 + 13), w = day <= 5 ? [5, 4, 0] : wave(r), cards = [], used = {};   // the first five days: easy and medium only
    function add(d, only) {
      var x = null; FALL[d].forEach(function (dd) { x = x || nextLevel(dd, used, r, day, only); });
      if (!x) return;                                                    // stock is empty: the generator is not here yet
      used[x.id] = (used[x.id] || 0) + 1; got(x.id).push(x.n); cards.push(x);
    }
    var left = [w[0], w[1], w[2]];
    POSTIE_GAMES.forEach(function (id) { if (firstDay(id) === day && left[0] > 0) { add(1, id); left[0]--; } });   // a game that arrives today brings an easy level
    [1, 2, 3].forEach(function (d, k) { for (var i = 0; i < left[k]; i++) add(d); });
    cards.sort(function (a, b) { return a.d - b.d; });                   // easier first; nothing else tells the difficulty
    S.env[key] = { cards: cards, stuck: [], sent: false, opened: false, letter: letterFor(day) };
    save(); return S.env[key];
  }
  function letterFor(day) {
    if (day === 1) return { text: L.first, re: null };
    var r = rnd(day * 104729), y = S.env['d' + (day - 1)], re;
    if (!y || !y.sent) { var b = S.env['d' + (day - 2)]; re = (day > 2 && (!b || !b.sent)) ? R.unsent2 : R.unsent; }
    else {
      var st = y.stuck.map(function (i) { return y.cards[i]; });
      re = st.every(function (s) { return s.id === st[0].id; }) ? R.same
        : st.every(function (s) { return s.d === 1; }) ? R.easy
        : st.every(function (s) { return s.d >= 3; }) ? R.hard : R.diff;
    }
    return { text: L.any[Math.floor(r() * L.any.length)], re: re };
  }
  function solvedIdx(E) { var a = []; E.cards.forEach(function (c, i) { if (isDone(c.id, c.n)) a.push(i); }); return a; }

  /* ---------- small UI pieces ---------- */
  var root = document.getElementById('app');
  function toast(t) {                                                    // top of the screen, never over the buttons
    Array.prototype.slice.call(root.querySelectorAll('.toast')).forEach(function (x) { x.remove(); });
    var e = h('div', { class: 'toast' }, [t]); root.appendChild(e); setTimeout(function () { e.remove(); }, 1800);
  }
  function sheet(title, sub, opts) {
    opts = opts || {};
    var body = h('div', { class: 'body' }), t = h('div', { class: 't' }, [title, sub ? h('small', null, [sub]) : null]), foot = h('div', { class: 'foot' });
    var el = h('div', { class: 'sh ' + (opts.cls || '') }, [h('div', { class: 'bar2' }, [
      h('button', { class: 'ib', 'aria-label': 'Back', html: Postie.icon('back'), onclick: function () { close(); } }), t, opts.right || h('span', { style: 'width:44px' })]), body, foot]);
    function close() { el.remove(); if (opts.onclose) opts.onclose(); }
    root.appendChild(el); return { el: el, body: body, foot: foot, close: close };
  }
  function closeSheets() { Array.prototype.slice.call(root.querySelectorAll('.sh')).forEach(function (x) { x.remove(); }); }
  function big(t, f, cls) { return h('button', { class: 'big ' + (cls || ''), onclick: f }, [t]); }
  function letterEl(lt) { return h('div', { class: 'letter' }, [h('div', null, [lt.text]), lt.re ? h('div', { class: 're' }, [lt.re]) : null]); }
  /* a puzzle is a circle */
  function puzzleEl(c, ok, tap) { return h('button', { class: 'pzl' + (ok ? ' ok' : ''), onclick: tap }, [h('i', { html: ok ? Postie.icon('check') : '' }), h('b', null, [game(c.id).name + ' ' + ord(c.id, c.n)])]); }
  /* a stamp is a square: the game and the number of the level */
  function stampEl(c, cls, tap) { return h(tap ? 'button' : 'div', { class: 'stamp ' + (cls || ''), onclick: tap }, [h('b', null, [game(c.id).name]), h('small', null, [String(ord(c.id, c.n))])]); }

  /* ---------- one frame for every game ---------- */
  var NOSCALE = { 'carpet-layers': 1, 'perfect-fit': 1 };
  /* Level 0 (author 2026-11-19): the first time a game is opened, its teaching level comes first — the hand shows every move —
     then the level the player asked for. A game takes part when its view has `tutorial` (a level with a solution) and `gesture`. */
  function play(id, n, after, E, all) {                                  // E: today's letter, when the level is played from it; all: from test > All levels
    var g0 = game(id);
    if (n !== 0 && g0.tutorial && g0.gesture && !(S.tut || {})[id]) { play(id, 0, function () { if ((S.tut || {})[id]) play(id, n, after, E, all); else if (after) after(); }); return; }
    var g = g0, tut = n === 0, lv = tut ? g.tutorial : g.levels[n - 1], cleanups = [], stage = h('div', { class: 'stage' }), say = h('div', { class: 'say' }), obs = null;
    var guide = (tut || lv.teach) && g.gesture ? (tut ? lv.solution : lv.solution.slice(0, 1)) : null, gi = 0, hd = null, gt = null;
    function clean() { if (obs) obs.disconnect(); obs = null; cleanups.forEach(function (f) { try { f(); } catch (e) {} }); cleanups = []; }
    var o = sheet(g.name, tut ? 'Level 0 · how to play' : 'Level ' + (all ? n : ord(id, n)), { cls: 'play', onclose: function () { clean(); after && after(); },
      right: h('div', { style: 'display:flex' }, [
        h('button', { class: 'ib', 'aria-label': 'Rules', html: Postie.icon('help'), onclick: rules }),
        h('button', { class: 'ib', 'aria-label': 'Restart', html: Postie.icon('redo'), onclick: function () { remount(); } })]) });
    o.body.appendChild(stage); o.body.appendChild(say);
    function rules() {                                                   // the same card in every game; with a demo — the hand plays it
      if (hd) hd.hide();
      var close = function () { stop(); card.remove(); showGuide(); }, stop = function () {};
      var box = h('div', { class: 'popbox left' }, [h('b', null, ['How to play'])]);
      if (g.demo && g.gesture) { var d = demoEl(g); stop = d.stop; box.appendChild(d.el); } else box.appendChild(h('div', { class: 'rtext', html: g.rules || '' }));
      box.appendChild(big('Got it', close));
      var card = h('div', { class: 'pop' }, [box]);
      o.el.appendChild(card);
    }
    /* the hand on the board: shows the next move of the sample while the player follows it */
    function showGuide() {
      clearTimeout(gt); if (!guide || gi >= guide.length || o.el.querySelector('.pop')) { if (hd) hd.hide(); return; }
      gt = setTimeout(function () { if (!hd) hd = Postie.hand(o.el); var pts = g.gesture(stage, guide[gi], lv); if (pts) hd.show(pts); }, 350);
    }
    function back() { if (guide && gi > 0 && gi <= guide.length) { gi--; showGuide(); } }   // the game's Undo: the hand steps back too
    function moved(m) {
      if (!guide) return;
      if (gi < guide.length && JSON.stringify(m) === JSON.stringify(guide[gi])) gi++; else gi = guide.length;   // off the sample: the hand stops
      showGuide();
    }
    stage.addEventListener('pointerdown', function () { clearTimeout(gt); if (hd) hd.hide(); }, true);
    stage.addEventListener('pointerup', function () { setTimeout(function () { if (guide && gi < guide.length) showGuide(); }, 400); }, true);
    function mount() {
      say.innerHTML = ''; say.className = 'say';
      /* Fit the board into the screen: if the game is taller than the room it has, give it a narrower column and build it again.
         Boards size themselves from their width, so they shrink as a whole and all pointer maths stays in real pixels. */
      var inner, width = 0, prevTall = 0, helped = false;
      for (var pass = 0; pass < 6; pass++) {
        clean(); stage.innerHTML = ''; o.foot.innerHTML = '';
        inner = h('div', { style: 'width:100%;align-self:center' + (width > 0 ? ';max-width:' + width + 'px' : '') }); stage.appendChild(inner);
        g.mount(inner, { n: n, level: lv, engine: g.engine, cleanup: function (f) { cleanups.push(f); }, moved: moved, back: back,
          win: function () { if (hd) hd.hide(); if (tut) { S.tut = S.tut || {}; S.tut[id] = 1; S.seen[id] = 1; save(); } else if (all) markAll(id, n); else markDone(id, n); setTimeout(solvedPopup, 500); } });
        /* the game's own buttons go to one place — the bottom; its own "retry" and options are not part of the frame */
        Array.prototype.slice.call(inner.querySelectorAll('.row')).forEach(function (row) { o.foot.appendChild(row); });
        var room = stage.clientHeight, tall = stage.scrollHeight, w = inner.clientWidth;
        if (!room || tall <= room + 1) break;
        /* narrowing did not make it shorter (rows of fixed height): go back to the full width and scale instead */
        if (width > 0 && tall >= prevTall - 2) { if (helped) break; width = -1; continue; }
        if (width > 0) helped = true;
        if (width < 0 || w < 220) break;
        prevTall = tall; width = Math.max(200, Math.floor(w * Math.max(0.6, room / tall) - 4));
      }
      /* Still too tall (the board has fixed sizes): shrink the whole board as a picture. Not for games that drag pieces
         by pixel sizes of their own (their maths would be off) — those keep scrolling. */
      var room2 = stage.clientHeight, tall2 = stage.scrollHeight;
      if (room2 && tall2 > room2 + 1 && !NOSCALE[id]) {
        var k = Math.max(0.6, (room2 - 2) / tall2);
        inner.style.transformOrigin = 'top center'; inner.style.transform = 'scale(' + k + ')'; inner.style.marginBottom = -Math.ceil(tall2 * (1 - k)) + 'px';
      }
      /* the game's own message line is shown in one place; a "bad" message is the same stuck bar with Restart everywhere */
      function sync() {
        Array.prototype.slice.call(o.foot.querySelectorAll('button')).forEach(function (b) { if (/^(Retry|Hide marks|Show marks)$/.test(b.textContent)) b.style.display = 'none'; });
        var m = null; Array.prototype.slice.call(inner.querySelectorAll('.msg')).forEach(function (x) { if (x.textContent && (!m || /bad/.test(x.className))) m = x; });
        say.innerHTML = ''; say.className = 'say';
        if (!m) return;
        say.appendChild(h('span', null, [m.textContent]));
        if (/bad/.test(m.className)) { say.className = 'say bad'; say.appendChild(h('button', { onclick: function () { remount(); } }, ['Restart'])); }
      }
      obs = new MutationObserver(sync); obs.observe(inner, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] });
      obs.observe(o.foot, { subtree: true, childList: true });
      sync();
    }
    function remount() { gi = 0; mount(); showGuide(); }
    mount(); showGuide();
    if (!S.seen[id] && !g.tutorial) { S.seen[id] = 1; save(); rules(); } // first time in a game without level 0: the rules card
    /* after every solved puzzle */
    function solvedPopup() {
      var box = h('div', { class: 'popbox' }, [h('i', { class: 'okc', html: Postie.icon('check') }), h('b', null, ['Solved'])]), nxt = null;
      if (tut) {                                                         // level 0 done: on to the level the player opened
        box.appendChild(h('span', null, ['Now you know how ' + g.name + ' works.']));
        box.appendChild(big('Play', function () { o.close(); }));
      } else if (all) {                                                         // test > All levels: every level by its number in levels.js, no stamps, no letter
        nxt = n < g.levels.length ? n + 1 : null;
        box.appendChild(h('span', null, ['Level ' + n + ' of ' + g.levels.length]));
        if (nxt) box.appendChild(big('Next', function () { o.close(); play(id, nxt, after, null, true); }));
        box.appendChild(big('Back to levels', function () { o.close(); }, nxt ? 'ghost' : ''));
      } else if (E && !E.sent) {                                         // from the letter: Next; from the 3rd also To the envelope; after the last only that
        var sol = solvedIdx(E);
        E.cards.forEach(function (c, i) { if (!nxt && sol.indexOf(i) < 0) nxt = c; });
        box.appendChild(h('span', null, [sol.length + ' of ' + E.cards.length + (sol.length < 3 ? ' · ' + (3 - sol.length) + ' more to send' : '')]));
        if (sol.length >= 3) box.appendChild(big('To the envelope', function () { o.close(); openEnvelope(E); }));
        if (nxt) box.appendChild(big('Next', function () { o.close(); play(nxt.id, nxt.n, after, E); }, sol.length >= 3 ? 'o' : ''));
        if (nxt) box.appendChild(big('Back to puzzles', function () { o.close(); }, 'ghost'));
      } else {                                                           // from Games: next unsolved level of this game, no stamps
        var a = shown(id), rest = a.filter(function (m) { return !isDone(id, m); }), k = a.indexOf(n);
        nxt = rest.filter(function (m) { return a.indexOf(m) > k; })[0] || rest[0];
        box.appendChild(h('span', null, [(a.length - rest.length) + ' of ' + a.length + ' in ' + g.name]));
        if (nxt) box.appendChild(big('Next', function () { o.close(); play(id, nxt, after); }));
        box.appendChild(big('Back to levels', function () { o.close(); }, nxt ? 'ghost' : ''));
      }
      o.el.appendChild(h('div', { class: 'pop' }, [box]));
    }
  }

  /* "?" with a demo (author 2026-11-19): a small live board, the hand plays each step's sample by itself, one short line under it;
     steps loop. A game takes part with `demo: [{ say, level }]` (each level has a solution) and `gesture(root, move, level)`. */
  function demoEl(g) {
    var k = 0, alive = true, dots = h('div', { class: 'ddots' }), sayEl = h('div', { class: 'dsay' }), dstage = h('div', { class: 'dstage' });
    var el = h('div', { class: 'demo' }, [dstage, sayEl, dots]), hd = Postie.hand(el);
    g.demo.forEach(function () { dots.appendChild(h('i')); });
    function run() {
      if (!alive) return;
      var st = g.demo[k], i = 0;
      sayEl.innerHTML = st.say;
      Array.prototype.forEach.call(dots.children, function (d, j) { d.className = j === k ? 'on' : ''; });
      dstage.innerHTML = ''; var inner = h('div'); dstage.appendChild(inner);
      g.mount(inner, { n: 0, level: st.level, engine: g.engine, demo: true, cleanup: function () {}, moved: function () {}, win: function () {} });
      function next() {
        if (!alive) return;
        if (i >= st.level.solution.length) { setTimeout(function () { k = (k + 1) % g.demo.length; run(); }, 1400); return; }
        var pts = g.gesture(dstage, st.level.solution[i++], st.level);
        hd.play(pts, dstage).then(function () { setTimeout(next, 900); });
      }
      setTimeout(next, 800);
    }
    setTimeout(run, 60);
    return { el: el, stop: function () { alive = false; hd.hide(); } };
  }

  /* ---------- Today: one thing in the middle, with its state ---------- */
  function drawToday(p) {
    var E = envelope(), n = solvedIdx(E).length;
    p.classList.add('mid');
    if (E.sent) {
      p.appendChild(h('div', { class: 'nol' }, [h('div', { class: 'envi off' }), h('b', null, ['No letter']), h('span', null, ['Sent. The next one comes tomorrow.']),
        h('button', { class: 'lnk2', onclick: function () { go(2, true); } }, ['Today’s puzzles are in Games →'])]));
      return;
    }
    var state = !E.opened ? 'Tap to open' : n < 3 ? n + ' of 3 solved' : E.stuck.length < 3 ? n + ' solved · stick 3 stamps' : 'Ready to send';
    p.appendChild(h('button', { class: 'nol', onclick: function () { if (E.opened) openPuzzles(E); else openNote(E, true); } }, [
      h('div', { class: 'envi' }), h('b', null, [E.opened ? 'Letter' : 'New letter']), h('span', null, [state]),
      h('span', { class: 'fine' }, ['Send it today. Tomorrow it is gone.'])]));
  }
  /* the note: his letter; from here — to the puzzles */
  function openNote(E, first) {
    E.opened = true; save();
    var o = sheet(dateStr(S.day), 'Letter', { onclose: first ? draw : null });
    o.body.appendChild(letterEl(E.letter));
    o.foot.appendChild(big(first ? 'Go to puzzles' : 'Back to puzzles', function () { if (first) openPuzzles(E, o); else o.close(); }));
  }
  /* the puzzles: 3 x 3; after 3 solved — the way to the envelope */
  function openPuzzles(E, under) {
    var o = sheet(dateStr(S.day), 'Solve any 3 to send', { onclose: function () { if (under) under.el.remove(); draw(); },
      right: h('button', { class: 'ib txt', onclick: function () { openNote(E); } }, ['Letter']) });
    function render() {
      o.body.innerHTML = ''; o.foot.innerHTML = '';
      var sol = solvedIdx(E), grid = h('div', { class: 'grid3' });
      E.cards.forEach(function (c, i) { grid.appendChild(puzzleEl(c, sol.indexOf(i) >= 0, function () { play(c.id, c.n, render, E); })); });
      o.body.appendChild(grid);
      if (E.cards.length < PER_DAY) o.body.appendChild(h('div', { class: 'note' }, ['Only ' + E.cards.length + ' new levels left in stock — the level generator is not here yet.']));
      if (sol.length >= 3) o.foot.appendChild(big('To the envelope', function () { openEnvelope(E); }));
      else o.foot.appendChild(h('div', { class: 'note c' }, [sol.length + ' of 3 solved']));
    }
    render();
  }
  /* the envelope and the stamps: stick any 3 in any order. Back returns to the puzzles; what is stuck stays stuck. */
  function openEnvelope(E) {
    var o = sheet(dateStr(S.day), 'Stick 3 stamps');
    function render() {
      o.body.innerHTML = ''; o.foot.innerHTML = '';
      var sol = solvedIdx(E);
      E.stuck = E.stuck.filter(function (i) { return sol.indexOf(i) >= 0; });
      var slots = h('div', { class: 'slots' });
      for (var k = 0; k < 3; k++) (function (k) {
        var i = E.stuck[k];
        slots.appendChild(i == null ? h('div', { class: 'stamp empty' }) : stampEl(E.cards[i], 'on', function () { E.stuck.splice(k, 1); save(); render(); }));
      })(k);
      o.body.appendChild(h('div', { class: 'envbig' }, [slots, h('div', { class: 'to' }, ['To: the postman'])]));
      o.body.appendChild(h('h2', null, ['Your stamps']));
      var tray = h('div', { class: 'grid3' });
      sol.forEach(function (i) {
        var on = E.stuck.indexOf(i) >= 0;
        tray.appendChild(stampEl(E.cards[i], on ? 'used' : '', function () {
          if (on) E.stuck.splice(E.stuck.indexOf(i), 1); else if (E.stuck.length < 3) E.stuck.push(i); else return toast('Only three stamps fit');
          save(); render();
        }));
      });
      o.body.appendChild(tray);
      o.body.appendChild(h('div', { class: 'note' }, ['Tap a stamp to stick it; tap it on the envelope to take it off.']));
      o.body.appendChild(h('div', { class: 'note' }, ['After you send: the other stamps burn, there are no more stamps today, and today’s puzzles move to Games.']));
      o.foot.appendChild(h('button', { class: 'big', disabled: E.stuck.length === 3 ? null : 'disabled', onclick: function () { send(E); } }, [E.stuck.length === 3 ? 'Send letter' : 'Stick ' + (3 - E.stuck.length) + ' more']));
    }
    render();
  }
  function send(E) { E.sent = true; save(); closeSheets(); draw(); }

  /* ---------- Games: only what came by mail and has left with a letter ---------- */
  function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }
  function drawGames(p) {
    var here = Postie.games.filter(function (g) { return shown(g.id).length; }), total = 0, solved = 0, grid = h('div', { class: 'grid3' });
    if (!here.length) { p.classList.add('mid'); p.appendChild(h('div', { class: 'nol' }, [h('b', null, ['Empty for now']), h('span', null, ['Puzzles come here after you send the letter.'])])); return; }
    here.forEach(function (g) {
      var a = shown(g.id), sv = a.filter(function (n) { return isDone(g.id, n); }).length; total += a.length; solved += sv;
      grid.appendChild(h('button', { class: 'gm', onclick: function () { openGame(g.id); } }, [h('i', null, [pct(sv, a.length) + '%']), h('b', null, [g.name])]));
    });
    p.appendChild(h('h2', null, ['Games · ' + pct(solved, total) + '% solved']));
    p.appendChild(grid);
  }
  /* a game: its levels in order of arrival, numbered 1, 2, 3… */
  function openGame(id) {
    var g = game(id), o = sheet(g.name, '', { onclose: draw });
    function render() {
      o.body.innerHTML = '';
      var a = shown(id), sv = a.filter(function (n) { return isDone(id, n); }).length;
      o.el.querySelector('.t').innerHTML = ''; o.el.querySelector('.t').appendChild(document.createTextNode(g.name)); o.el.querySelector('.t').appendChild(h('small', null, [pct(sv, a.length) + '% solved']));
      var grid = h('div', { class: 'lvs' });
      a.forEach(function (n, k) { grid.appendChild(h('button', { class: isDone(id, n) ? 'ok' : '', onclick: function () { play(id, n, render); } }, [String(k + 1)])); });
      o.body.appendChild(grid);
    }
    render();
  }

  /* ---------- test > All levels: every game and every level there is, outside the daily loop (for the author) ---------- */
  function isAll(id, n) { return ((S.all || {})[id] || []).indexOf(n) >= 0; }
  function markAll(id, n) { S.all = S.all || {}; var d = S.all[id] || (S.all[id] = []); if (d.indexOf(n) < 0) d.push(n); save(); }
  function openAll() {
    var total = 0; Postie.games.forEach(function (g) { total += g.levels.length; });
    var o = sheet('All levels', Postie.games.length + ' games · ' + total + ' levels');
    [['In the game', POSTIE_GAMES], ['Bench', POSTIE_BENCH]].forEach(function (part) {   // the bench never comes in a letter
      var grid = h('div', { class: 'grid3' });
      Postie.games.forEach(function (g) {
        if (part[1].indexOf(g.id) < 0) return;
        var sv = g.levels.filter(function (l, i) { return isAll(g.id, i + 1); }).length;
        grid.appendChild(h('button', { class: 'gm', onclick: function () { openAllGame(g.id); } }, [h('i', null, [sv + ' / ' + g.levels.length]), h('b', null, [g.name])]));
      });
      o.body.appendChild(h('h2', null, [part[0]])); o.body.appendChild(grid);
    });
  }
  function openAllGame(id) {
    var g = game(id), o = sheet(g.name, g.levels.length + ' levels');
    function render() {
      o.body.innerHTML = '';
      var grid = h('div', { class: 'lvs' });
      if (g.tutorial) grid.appendChild(h('button', { class: (S.tut || {})[id] ? 'ok' : '', onclick: function () { play(id, 0, render, null, true); } }, ['0']));
      g.levels.forEach(function (l, i) { grid.appendChild(h('button', { class: isAll(id, i + 1) ? 'ok' : '', onclick: function () { play(id, i + 1, render, null, true); } }, [String(i + 1)])); });
      o.body.appendChild(grid);
    }
    render();
  }

  /* ---------- Letters (calendar): a real month; a day is sent or not sent ---------- */
  var calShift = 0;
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
      if (d < 1 || d > S.day) cls += ' no';                              // before the first day, or still ahead
      else if (d === S.day) { cls += ' t' + (E && E.sent ? ' s' : ''); tap = function () { go(1, true); }; }
      else if (E && E.sent) { cls += ' s'; tap = function () { openDay(d); }; }
      else cls += ' miss';                                               // not sent: the letter is gone
      days.appendChild(h('button', { class: cls, disabled: tap ? null : 'disabled', onclick: tap }, [String(m)]));
    })(m);
    p.appendChild(days);
    p.appendChild(h('div', { class: 'legend' }, [h('span', null, [h('i', { class: 's' }), 'sent']), h('span', null, [h('i', { class: 'm' }), 'not sent']), h('span', null, [h('i', { class: 't' }), 'today'])]));
  }
  /* a sent day: a popup over the calendar — his note and the envelope with the three stamps as they were stuck */
  function openDay(d) {
    var E = S.env['d' + d], slots = h('div', { class: 'slots' });
    E.stuck.forEach(function (i) { slots.appendChild(stampEl(E.cards[i], 'on')); });
    var card = h('div', { class: 'daycard', role: 'dialog', 'aria-label': dateStr(d) }, [
      h('div', { class: 'dhead' }, [h('b', null, [dateStr(d)]), h('button', { class: 'ib', 'aria-label': 'Close', html: Postie.icon('close'), onclick: close })]),
      h('div', { class: 'dbody' }, [letterEl(E.letter), h('div', { class: 'envbig' }, [slots, h('div', { class: 'to' }, ['To: the postman'])])])]);
    var veil = h('div', { class: 'veil', onclick: function (e) { if (e.target === veil) close(); } }, [card]);
    function close() { veil.remove(); }
    root.appendChild(veil);
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
    var top = h('div', { class: 'top' }, [h('button', { class: 'ib lk', 'aria-label': LOOK === 'night' ? 'Light look' : 'Dark look', html: LOOK === 'night' ? SUN : MOON, onclick: toggleLook }), h('b', null, [dateStr(S.day)]), h('button', { class: 'tst', onclick: testMenu }, ['test'])]);
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
    b('All games and levels', function () { o.close(); openAll(); }, 'o');
    b('Next day', function () { S.day++; calShift = 0; save(); pan = 1; o.close(); draw(); });
    b('Solve 3 puzzles of today', function () { var E = envelope(), k = 0; E.opened = true; E.cards.forEach(function (c) { if (k < 3 && !isDone(c.id, c.n)) { markDone(c.id, c.n); k++; } }); save(); o.close(); draw(); }, 'o');
    b('Reset everything', function () { if (!confirm('Reset all progress?')) return; S = fresh(); save(); pan = 1; o.close(); draw(); }, 'o');
  }
  window.addEventListener('resize', function () { if (pans) pans.scrollLeft = pan * pans.clientWidth; });

  /* load games (order — web/games.js) */
  function load(src) { return new Promise(function (ok) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { ok(); }; document.body.appendChild(s); }); }
  var chain = Promise.resolve();
  var ALL = POSTIE_GAMES.concat(POSTIE_BENCH);                         // the bench is loaded too: test > All games and levels
  ALL.forEach(function (id) { ['levels', 'engine', 'view'].forEach(function (f) { chain = chain.then(function () { return load('games/' + id + '/' + f + '.js'); }); }); });
  chain.then(function () { Postie.games.sort(function (a, b) { return ALL.indexOf(a.id) - ALL.indexOf(b.id); }); draw(); });
})();
