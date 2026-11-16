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
  /* flat piece colours for game boards (shapes stay) */
  var FLAT = { apr: '#E8475F', blue: '#6C8CC4', sage: '#7BB58A', butter: '#FFCB5C', sand: '#B9B9C0', ink: '#1D1D1F' };
  Postie.PIECES.forEach(function (p) { p.c = FLAT[p.k] || p.c; });
  Postie.C.milk = Postie.C.card = '#FFFFFF'; Postie.C.ink = Postie.C.txt = '#1D1D1F'; Postie.C.line = '#DCDCE0'; Postie.C.sand = '#F1F1F3';
  Postie.C.apr = FLAT.apr; Postie.C.blue = FLAT.blue; Postie.C.sage = FLAT.sage; Postie.C.butter = FLAT.butter; Postie.C.bad = '#E8475F'; Postie.C.mut = '#8A8A90';

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
  function allowed(id, d, day) { var f = firstDay(id); return f <= day && (d < 3 || day >= f + 2); }   // first two days of a game: easy and medium only

  /* ---------- today's letter ---------- */
  function wave(r) {                                                     // 1..5 of each, 9 together
    for (;;) { var e = 1 + Math.floor(r() * 5), m = 1 + Math.floor(r() * 5), x = PER_DAY - e - m; if (x >= 1 && x <= 5) return [e, m, x]; }
  }
  /* next level of difficulty d that has not arrived yet: one candidate per game (its first such level), games used least today first */
  function nextLevel(d, used, r, day, only) {
    var c = [];
    Postie.games.forEach(function (g) {
      if (only && g.id !== only || !allowed(g.id, d, day)) return;
      for (var i = 0; i < g.levels.length; i++) if (got(g.id).indexOf(i + 1) < 0 && diff(g.levels[i]) === d) { c.push({ id: g.id, n: i + 1, d: d }); return; }
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
  function play(id, n, after, E) {                                       // E: today's letter, when the level is played from it
    var g = game(id), lv = g.levels[n - 1], cleanups = [], stage = h('div', { class: 'stage' }), say = h('div', { class: 'say' }), obs = null;
    function clean() { if (obs) obs.disconnect(); obs = null; cleanups.forEach(function (f) { try { f(); } catch (e) {} }); cleanups = []; }
    var o = sheet(g.name, 'Level ' + ord(id, n), { cls: 'play', onclose: function () { clean(); after && after(); },
      right: h('div', { style: 'display:flex' }, [
        h('button', { class: 'ib', 'aria-label': 'Rules', html: Postie.icon('help'), onclick: rules }),
        h('button', { class: 'ib', 'aria-label': 'Restart', html: Postie.icon('redo'), onclick: function () { mount(); } })]) });
    o.body.appendChild(stage); o.body.appendChild(say);
    function rules() {                                                   // the same card in every game
      var card = h('div', { class: 'pop' }, [h('div', { class: 'popbox left' }, [h('b', null, ['How to play']), h('div', { class: 'rtext', html: g.rules || '' }),
        big('Got it', function () { card.remove(); })])]);
      o.el.appendChild(card);
    }
    function mount() {
      say.innerHTML = ''; say.className = 'say';
      /* Fit the board into the screen: if the game is taller than the room it has, give it a narrower column and build it again.
         Boards size themselves from their width, so they shrink as a whole and all pointer maths stays in real pixels. */
      var inner, width = 0;
      for (var pass = 0; pass < 5; pass++) {
        clean(); stage.innerHTML = ''; o.foot.innerHTML = '';
        inner = h('div', { style: width ? 'max-width:' + width + 'px;margin:0 auto' : '' }); stage.appendChild(inner);
        g.mount(inner, { n: n, level: lv, engine: g.engine, cleanup: function (f) { cleanups.push(f); },
          win: function () { markDone(id, n); setTimeout(solvedPopup, 500); } });
        /* the game's own buttons go to one place — the bottom; its own "retry" and options are not part of the frame */
        Array.prototype.slice.call(inner.querySelectorAll('.row')).forEach(function (row) { o.foot.appendChild(row); });
        var room = stage.clientHeight, tall = stage.scrollHeight, w = inner.clientWidth;
        if (!room || tall <= room + 1 || w < 220) break;
        width = Math.max(200, Math.floor(w * Math.max(0.6, room / tall) - 4));
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
        if (/bad/.test(m.className)) { say.className = 'say bad'; say.appendChild(h('button', { onclick: function () { mount(); } }, ['Restart'])); }
      }
      obs = new MutationObserver(sync); obs.observe(inner, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] });
      obs.observe(o.foot, { subtree: true, childList: true });
      sync();
    }
    mount();
    if (!S.seen[id]) { S.seen[id] = 1; save(); rules(); }                // first time in this game
    /* after every solved puzzle */
    function solvedPopup() {
      var box = h('div', { class: 'popbox' }, [h('i', { class: 'okc', html: Postie.icon('check') }), h('b', null, ['Solved'])]), nxt = null;
      if (E && !E.sent) {                                                // from the letter: Next; from the 3rd also To the envelope; after the last only that
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
  function openDay(d) {
    var E = S.env['d' + d], o = sheet(dateStr(d), 'Sent');
    o.body.appendChild(h('h2', null, ['Letter'])); o.body.appendChild(letterEl(E.letter));
    o.body.appendChild(h('h2', null, ['Your stamps']));
    var slots = h('div', { class: 'slots' }); E.stuck.forEach(function (i) { slots.appendChild(stampEl(E.cards[i], 'on')); }); o.body.appendChild(slots);
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
    var top = h('div', { class: 'top' }, [h('span', { style: 'width:44px' }), h('b', null, [dateStr(S.day)]), h('button', { class: 'tst', onclick: testMenu }, ['test'])]);
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
    b('Next day', function () { S.day++; calShift = 0; save(); pan = 1; o.close(); draw(); });
    b('Solve 3 puzzles of today', function () { var E = envelope(), k = 0; E.opened = true; E.cards.forEach(function (c) { if (k < 3 && !isDone(c.id, c.n)) { markDone(c.id, c.n); k++; } }); save(); o.close(); draw(); }, 'o');
    b('Reset everything', function () { if (!confirm('Reset all progress?')) return; S = fresh(); save(); pan = 1; o.close(); draw(); }, 'o');
  }
  window.addEventListener('resize', function () { if (pans) pans.scrollLeft = pan * pans.clientWidth; });

  /* load games (order — web/games.js) */
  function load(src) { return new Promise(function (ok) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { ok(); }; document.body.appendChild(s); }); }
  var chain = Promise.resolve();
  POSTIE_GAMES.forEach(function (id) { ['levels', 'engine', 'view'].forEach(function (f) { chain = chain.then(function () { return load('games/' + id + '/' + f + '.js'); }); }); });
  chain.then(function () { Postie.games.sort(function (a, b) { return POSTIE_GAMES.indexOf(a.id) - POSTIE_GAMES.indexOf(b.id); }); draw(); });
})();
