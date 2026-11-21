/* Postie — flat prototype of the whole loop. No art: logic first.
   Three screens by swipe: Letters (calendar) ← Today (letter) → Games.

   The letter (author 2026-11-20): 5 new levels a day — 2 easy, 2 medium, 1 hard; the first five days the hard one is medium.
   3 to send, 2 if you like; the unsolved burn with the letter. Difficulty is not shown anywhere; easier first.
   Gentle start: day 1 — three games; day 2 +1; day 3 +1; day 5 +1; then +1 every second day until all are in.
   A game gives only easy and medium on its first two days.
   Today: one thing in the middle with its state. First tap -> the note; later taps -> straight to the puzzles.
   Puzzles -> popup after every solved one (Next / To the envelope / Back to puzzles) ->
   the envelope: stick any 3 stamps in any order -> Send letter. Not sent today — the letter is gone tomorrow.
   His note (author 2026-11-20): day 1 — the opening letter; sent yesterday — a reaction to the stamps + one phrase of his;
   not sent yesterday — no words, only tally marks, one per missed day in a row; after a gap — the marks one last time, the answer under them.
   Texts — world/letters-en.md.
   Games is the catalogue (author 2026-11-20): paid; open to everyone for the first 14 days; levels reach it only after the letter is sent.
   Shapes: a circle is a puzzle, a square is a stamp.
   Every game runs in one frame: header (back, rules, restart), one message line, buttons at the bottom,
   the same "stuck" bar with Restart, the same rules card on the first visit.
   Everything is local (localStorage). "test" in the corner: next day, solve 3, buy / unbuy the catalogue, reset. */
(function () {
  var h = Postie.h, T = Postie.t, KEY = 'postie:flat:v3', PER_DAY = 5, TRIAL = 14;
  /* Language (author 2026-11-21): Russian until the polish is done, English stays — test > language. Words of the shell: web/js/ru.js */
  var LANG = 'ru'; try { LANG = localStorage.getItem('postie:lang') || 'ru'; } catch (e) {}
  function applyLang() { Postie.lang = LANG; document.documentElement.lang = LANG; }
  applyLang();
  function gname(g) { return T(g.name); }
  /* The look (web/kit/flat.css) is a set of tokens; boards take their piece colours from the same tokens. One look, light (author 2026-11-21). */
  (function () {
    var css = getComputedStyle(document.documentElement), tok = function (n) { return css.getPropertyValue('--' + n).trim(); };
    var F = { apr: tok('apr'), blue: tok('blue'), sage: tok('sage'), butter: tok('butter'), sand: tok('stone'), ink: tok('ink') };
    Postie.PIECES.forEach(function (p) { p.c = F[p.k] || p.c; });
    ['milk', 'card', 'ink', 'txt', 'line', 'sand', 'bad', 'mut'].forEach(function (k) { Postie.C[k] = tok(k); });
    Postie.C.apr = F.apr; Postie.C.blue = F.blue; Postie.C.sage = F.sage; Postie.C.butter = F.butter;
  })();

  /* ---------- letters: web/js/letters.js (world/letters-en.md) — both languages, stored by index ---------- */
  var L = POSTIE_LETTERS;
  function say(x) { return x ? (Postie.lang === 'ru' ? x.ru : x.en) : ''; }
  /* G conditions: when a phrase may come */
  var COND = {
    neatYesterday: function (day) { var y = (S.env['d' + (day - 1)] || {}).letter; return !!y && !y.tally && (y.text || y.g != null || y.by) && day - 1 > 1; },   // yesterday had a phrase of his
    weekOld: function (day) { return day >= 8; }
  };
  function nth(n) { var t = n % 100, e = n % 10; return n + (t >= 11 && t <= 13 ? 'th' : e === 1 ? 'st' : e === 2 ? 'nd' : e === 3 ? 'rd' : 'th'); }

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
  var MON_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];   // "20 ноября"
  var MONTH_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  function dateStr(d) { var x = dateOf(d); return x.getDate() + ' ' + (Postie.lang === 'ru' ? MON_RU : MON)[x.getMonth()]; }
  function monthStr(x) { return (Postie.lang === 'ru' ? MONTH_RU : MON)[x.getMonth()] + ' ' + x.getFullYear(); }

  /* ---------- which games are in, and what they may give ---------- */
  /* the day a game first arrives, by its place in web/games.js: 1,1,1 · 2 · 3 · 5 · then every second day */
  function gameDay(k) { return k < 3 ? 1 : k === 3 ? 2 : k === 4 ? 3 : 5 + 2 * (k - 5); }
  function firstDay(id) { return gameDay(POSTIE_GAMES.indexOf(id)); }
  function allowed(id, d, day) { var f = firstDay(id); return POSTIE_GAMES.indexOf(id) >= 0 && f <= day && (d < 3 || day >= f + 2); }   // first two days of a game: easy and medium only

  /* ---------- today's letter ---------- */
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
    var day = S.day, r = rnd(day * 7919 + 13), w = day <= 5 ? [2, 3, 0] : [2, 2, 1], cards = [], used = {};   // 2 easy, 2 medium, 1 hard; the first five days the hard one is medium
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
  function sentOn(d) { return d >= 1 && !!(S.env['d' + d] || {}).sent; }
  function gamesOn(d) { var e = S.env['d' + d]; return e && e.sent ? e.stuck.map(function (i) { return e.cards[i].id; }) : []; }
  function missedBefore(d) { var k = 0; while (d - k >= 1 && !sentOn(d - k)) k++; return k; }   // days in a row not sent, ending at d
  function pick(kind) { S.rv = S.rv || {}; var k = S.rv[kind] || 0; S.rv[kind] = k + 1; return { k: kind, i: k % L.R[kind].length }; }
  /* his note for a day (author 2026-11-20): day 1 — the opening letter; not sent yesterday — only tally marks;
     sent yesterday — a reaction to the stamps and one phrase; after a gap — the marks one last time, the answer under them.
     Stored as indices ({ first }, { tally, re: {k, i, n}, by | g }), so it reads in the language that is on. */
  function letterFor(day) {
    if (day === 1) return { first: 1 };
    if (!sentOn(day - 1)) return { tally: missedBefore(day - 1) };
    var gap = day - 2 >= 1 ? missedBefore(day - 2) : 0, r = rnd(day * 104729);
    var re = gap ? pick('back') : reply(day), out = { tally: gap || 0, re: re };
    S.said = S.said || {}; S.saidG = S.saidG || [];
    var gs = gamesOn(day - 1).filter(function (id, k, a) { return a.indexOf(id) === k && L.BY[id] && !S.said[id]; });
    if (gs.length) { var g = gs[Math.floor(r() * gs.length)]; S.said[g] = 1; out.by = g; return out; }
    var ok = function (k) { var c = L.G[k].if; return !c || COND[c](day); }, free = [];
    L.G.forEach(function (x, k) { if (S.saidG.indexOf(k) < 0 && ok(k)) free.push(k); });
    if (!free.length) { S.saidG = []; L.G.forEach(function (x, k) { if (ok(k)) free.push(k); }); }   // the base ran out: round two
    var k = free[Math.floor(r() * free.length)]; S.saidG.push(k); out.g = k;
    return out;
  }
  /* the reaction to yesterday's envelope: the first that fits (letters-en.md §2) */
  function reply(day) {
    var y = S.env['d' + (day - 1)], st = y.stuck.map(function (i) { return y.cards[i]; }), ids = st.map(function (s) { return s.id; });
    var uniq = ids.filter(function (x, k) { return ids.indexOf(x) === k; }), seen = {}, any = false;
    for (var d = 1; d < day - 1; d++) if (sentOn(d)) { any = true; gamesOn(d).forEach(function (id) { seen[id] = 1; }); }
    if (!any) return pick('first');
    function run(id, from) { var k = 0; while (sentOn(from - k) && gamesOn(from - k).indexOf(id) >= 0) k++; return k; }   // envelopes in a row with this game, ending at from
    var best = 0; uniq.forEach(function (id) { best = Math.max(best, run(id, day - 1)); });
    if (best >= 3) { var x = pick('streak'); x.n = best; return x; }
    if (gamesOn(day - 2).some(function (id) { return uniq.indexOf(id) < 0 && run(id, day - 2) >= 3; })) return pick('left');
    function recent(id) { for (var d = day - 2, k = 0; d >= 1 && k < 5; d--) if (sentOn(d)) { if (gamesOn(d).indexOf(id) >= 0) return true; k++; } return false; }
    if (uniq.some(function (id) { return seen[id] && !recent(id); })) return pick('returned');
    if (uniq.some(function (id) { return !seen[id]; })) return pick('fresh');
    var prev = gamesOn(day - 2);
    if (uniq.length === 3 && prev.length && uniq.every(function (id) { return prev.indexOf(id) >= 0; }) && prev.every(function (id) { return uniq.indexOf(id) >= 0; })) return pick('same3');
    if (st.some(function (c) { return c.d >= 3; })) return pick('hard');
    if (uniq.length === 2) return pick('two');
    return pick('diff');
  }
  /* the words of a stored letter, in the language that is on (older saves kept the English text itself) */
  function reText(re) {
    if (!re || typeof re === 'string') return re || '';
    var n = re.n || 0;
    return say(L.R[re.k][re.i]).replace('{N}', nth(n)).replace('{n}', String(n)).replace('{env}', Postie.plural(n, 'конверт', 'конверта', 'конвертов'));
  }
  function phrase(lt) { return lt.first ? say(L.first) : lt.by ? say(L.BY[lt.by]) : lt.g != null ? say(L.G[lt.g]) : lt.text || ''; }
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
  /* tally marks: one per missed day in a row, the fifth crosses four */
  function tallyEl(n) {
    var box = h('div', { class: 'tally', 'aria-label': n + ' ' + Postie.plural(n, T('mark'), T('marks'), 'чёрточек') });
    for (var g = 0; g < n; g += 5) {
      var k = Math.min(5, n - g), w = 12 * Math.min(4, k) + 6, svg = '<svg viewBox="0 0 ' + (k === 5 ? 60 : w) + ' 44" width="' + (k === 5 ? 60 : w) + '" height="44">';
      for (var i = 0; i < Math.min(4, k); i++) svg += '<path d="M' + (10 + 12 * i) + ' ' + (5 + (i % 2)) + 'L' + (11 + 12 * i + (i % 2)) + ' 39"/>';
      if (k === 5) svg += '<path d="M2 12L58 32"/>';
      box.appendChild(h('span', { html: svg + '</svg>' }));
    }
    return box;
  }
  function letterEl(lt) {                                                // the marks, then the phrase about yesterday's envelope, then his own
    var re = reText(lt.re), tx = phrase(lt);
    return h('div', { class: 'letter' }, [lt.tally ? tallyEl(lt.tally) : null, re ? h('div', { class: 're' }, [re]) : null, tx ? h('div', { class: 'tx' }, [tx]) : null]);
  }
  /* a puzzle is a circle */
  function puzzleEl(c, ok, tap) { return h('button', { class: 'pzl' + (ok ? ' ok' : ''), onclick: tap }, [h('i', { html: ok ? Postie.icon('check') : '' }), h('b', null, [gname(game(c.id)) + ' ' + ord(c.id, c.n)])]); }
  /* a stamp is a square: the game and the number of the level */
  function stampEl(c, cls, tap) { return h(tap ? 'button' : 'div', { class: 'stamp ' + (cls || ''), onclick: tap }, [h('b', null, [gname(game(c.id))]), h('small', null, [String(ord(c.id, c.n))])]); }

  /* ---------- one frame for every game ---------- */
  var NOSCALE = { 'carpet-layers': 1, 'perfect-fit': 1 };
  /* Level 0 (author 2026-11-19): the first time a game is opened, its teaching level comes first — the hand shows every move —
     then the level the player asked for. A game takes part when its view has `tutorial` (a level with a solution) and `gesture`. */
  function play(id, n, after, E, all) {                                  // E: today's letter, when the level is played from it; all: from test > All levels
    var g0 = game(id);
    if (n !== 0 && g0.tutorial && g0.gesture && !(S.tut || {})[id]) { play(id, 0, function () { if ((S.tut || {})[id]) play(id, n, after, E, all); else if (after) after(); }); return; }
    var g = g0, tut = n === 0, lv = tut ? g.tutorial : g.levels[n - 1], cleanups = [], stage = h('div', { class: 'stage' }), say = h('div', { class: 'say' }), obs = null;
    var guide = (tut || lv.teach) && g.gesture ? (tut ? lv.solution : lv.solution.slice(0, typeof lv.teach === 'number' ? lv.teach : 1)) : null, gi = 0, hd = null, gt = null;   // teach: true = the first move, N = the first N
    function clean() { if (obs) obs.disconnect(); obs = null; cleanups.forEach(function (f) { try { f(); } catch (e) {} }); cleanups = []; }
    var o = sheet(gname(g), tut ? 'Level 0 · how to play' : T('Level {n}', { n: all ? n : ord(id, n) }), { cls: 'play', onclose: function () { clean(); after && after(); },
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
        Array.prototype.slice.call(o.foot.querySelectorAll('button')).forEach(function (b) { if (['Retry', 'Hide marks', 'Show marks'].some(function (x) { return b.textContent === x || b.textContent === T(x); })) b.style.display = 'none'; });
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
        box.appendChild(h('span', null, [T('Now you know how {g} works.', { g: gname(g) })]));
        box.appendChild(big('Play', function () { o.close(); }));
      } else if (all) {                                                         // test > All levels: every level by its number in levels.js, no stamps, no letter
        nxt = n < g.levels.length ? n + 1 : null;
        box.appendChild(h('span', null, [T('Level {n} of {m}', { n: n, m: g.levels.length })]));
        if (nxt) box.appendChild(big('Next', function () { o.close(); play(id, nxt, after, null, true); }));
        box.appendChild(big('Back to levels', function () { o.close(); }, nxt ? 'ghost' : ''));
      } else if (E && !E.sent) {                                         // from the letter: Next; from the 3rd also To the envelope; after the last only that
        var sol = solvedIdx(E);
        E.cards.forEach(function (c, i) { if (!nxt && sol.indexOf(i) < 0) nxt = c; });
        box.appendChild(h('span', null, [T('{n} of {m}', { n: sol.length, m: E.cards.length }) + (sol.length < 3 ? ' · ' + T('{k} more to send', { k: 3 - sol.length }) : '')]));
        if (sol.length >= 3) box.appendChild(big('To the envelope', function () { o.close(); openEnvelope(E); }));
        if (nxt) box.appendChild(big('Next', function () { o.close(); play(nxt.id, nxt.n, after, E); }, sol.length >= 3 ? 'o' : ''));
        if (nxt) box.appendChild(big('Back to puzzles', function () { o.close(); }, 'ghost'));
      } else if (E && E.sent) {                                          // a sent letter: finish the rest, no stamps
        var sol2 = solvedIdx(E); E.cards.forEach(function (c, i) { if (!nxt && sol2.indexOf(i) < 0) nxt = c; });
        box.appendChild(h('span', null, [T('{n} of {m}', { n: sol2.length, m: E.cards.length }) + ' · ' + T('sent')]));
        if (nxt) box.appendChild(big('Next', function () { o.close(); play(nxt.id, nxt.n, after, E); }));
        box.appendChild(big('Back to puzzles', function () { o.close(); }, nxt ? 'ghost' : ''));
      } else {                                                           // from Games: next unsolved level of this game, no stamps
        var a = shown(id), rest = a.filter(function (m) { return !isDone(id, m); }), k = a.indexOf(n);
        nxt = rest.filter(function (m) { return a.indexOf(m) > k; })[0] || rest[0];
        box.appendChild(h('span', null, [T('{n} of {m} in {g}', { n: a.length - rest.length, m: a.length, g: gname(g) })]));
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
      sayEl.innerHTML = T(st.say);
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
      var left = E.cards.length - n;
      p.appendChild(h('div', { class: 'nol' }, [h('div', { class: 'envi off' }), h('b', null, ['No letter']), h('span', null, ['Sent. The next one comes tomorrow.']),
        left ? h('button', { class: 'lnk2', onclick: function () { openPuzzles(E); } }, ['Finish today’s puzzles →']) : null,
        left ? h('span', { class: 'fine' }, ['Unsolved puzzles burn with the letter tonight.']) : null]));
      return;
    }
    var state = !E.opened ? 'Tap to open' : n < 3 ? T('{n} of 3 solved', { n: n }) : E.stuck.length < 3 ? T('{n} solved · stick 3 stamps', { n: n }) : 'Ready to send';
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
    var o = sheet(dateStr(S.day), E.sent ? 'Sent · finish if you like' : 'Solve any 3 to send', { onclose: function () { if (under) under.el.remove(); draw(); },
      right: h('button', { class: 'ib txt', onclick: function () { openNote(E); } }, ['Letter']) });
    function render() {
      o.body.innerHTML = ''; o.foot.innerHTML = '';
      var sol = solvedIdx(E), grid = h('div', { class: 'grid3' });
      E.cards.forEach(function (c, i) { grid.appendChild(puzzleEl(c, sol.indexOf(i) >= 0, function () { play(c.id, c.n, render, E); })); });
      o.body.appendChild(grid);
      if (E.cards.length < PER_DAY) o.body.appendChild(h('div', { class: 'note' }, [T('Only {n} new levels left in stock — the level generator is not here yet.', { n: E.cards.length })]));
      if (E.sent) return;
      if (sol.length >= 3) o.foot.appendChild(big('To the envelope', function () { openEnvelope(E); }));
      else o.foot.appendChild(h('div', { class: 'note c' }, [T('{n} of 3 solved', { n: sol.length })]));
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
      o.body.appendChild(h('div', { class: 'note' }, ['After you send: the other stamps burn, there are no more stamps today, and unsolved puzzles burn with the letter tonight.']));
      o.foot.appendChild(h('button', { class: 'big', disabled: E.stuck.length === 3 ? null : 'disabled', onclick: function () { send(E); } }, [E.stuck.length === 3 ? 'Send letter' : T('Stick {k} more', { k: 3 - E.stuck.length })]));
    }
    render();
  }
  function send(E) { E.sent = true; save(); closeSheets(); draw(); }

  /* ---------- Games: only what came by mail and has left with a letter ---------- */
  function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }
  /* the catalogue (author 2026-11-20): paid; open to everyone for the first 14 days; the letter and its puzzles stay free forever */
  function trial() { return S.day <= TRIAL; }
  function catOpen() { return S.paid || trial(); }
  /* The album (author 2026-11-21, by the author's mock-up): the games lie as stamps of different sizes on a grid of 13 square cells
     across; a cell between stamps. [game, column, row, width, height] in cells, 0-based. Every game has its place, colour and emblem
     (web/js/stamps.js). A game that has not come by mail — an empty place, no name. */
  var ALBUM = [['streams', 0, 0, 6, 8], ['parcels', 7, 0, 6, 6], ['knock-through', 0, 9, 6, 6], ['square-up', 7, 7, 6, 8],
    ['outgrow', 0, 16, 13, 4], ['nest', 0, 21, 4, 6], ['perfect-fit', 5, 21, 8, 5], ['arrow-flip', 0, 28, 5, 5], ['the-gap', 6, 27, 7, 5],
    ['carpet-layers', 0, 34, 7, 8], ['shadow-step', 8, 33, 5, 5], ['tight-shelf', 8, 39, 5, 5]];
  function drawGames(p) {
    var total = 0, solved = 0, any = false, open = catOpen(), album = h('div', { class: 'album' });
    ALBUM.forEach(function (sl) {
      var g = game(sl[0]), a = g ? shown(g.id) : [], at = 'grid-area:' + (sl[2] + 1) + ' / ' + (sl[1] + 1) + ' / span ' + sl[4] + ' / span ' + sl[3];
      if (!a.length) { album.appendChild(h('div', { class: 'slot', style: at }, [h('div', { class: 'stamp empty' })])); return; }
      var sv = a.filter(function (n) { return isDone(g.id, n); }).length, st = POSTIE_STAMPS[g.id] || POSTIE_STAMPS.bracket; total += a.length; solved += sv; any = true;
      album.appendChild(h('div', { class: 'slot' + (open ? '' : ' lock'), style: at }, [
        h('button', { class: 'stamp gs', 'aria-label': gname(g), onclick: function () { if (open) openGame(g.id); else paywall(); } }, [
          h('div', { class: 'sp', style: '--bg:' + st.bg + ';--ink:' + st.ink + ';--frame:' + st.frame }, [
            h('b', null, [gname(g)]), h('i', { class: 'rl' }), h('span', { class: 'emb', html: st.svg }), h('small', null, [open ? pct(sv, a.length) + '%' : '—'])])])]));
    });
    p.appendChild(h('h2', null, [T('Games') + (open && any ? ' · ' + T('{p}% solved', { p: pct(solved, total) }) : '')]));
    if (!any) p.appendChild(h('div', { class: 'cat' }, [h('b', null, ['Empty for now']), h('span', null, ['Puzzles come here after you send the letter.'])]));
    if (!S.paid) p.appendChild(h('div', { class: 'cat' }, trial()
      ? [h('b', null, [T('The catalog is open until {d}.', { d: dateStr(TRIAL) })]), h('span', null, ['Every puzzle that came by mail is here. After that the catalog is paid. The letter and its five puzzles stay free forever.'])]
      : [h('b', null, ['The catalog is closed.']), h('span', null, ['The letter and its five puzzles are free forever. The catalog keeps every puzzle that came by mail, and more. It is for playing more.']),
         h('button', { class: 'big', onclick: paywall }, ['Open the catalog'])]));
    p.appendChild(h('div', { class: 'albw' }, [album]));
  }
  /* the paywall: subscription or lifetime; in the prototype a tap simply opens the catalogue */
  function paywall() {
    var o = sheet('The catalog', 'Play more');
    o.body.appendChild(h('div', { class: 'cat' }, [h('b', null, ['Free forever']), h('span', null, ['The letter, his words, five puzzles a day, the stamps, the envelope, the calendar.'])]));
    o.body.appendChild(h('div', { class: 'cat' }, [h('b', null, ['The catalog']), h('span', null, ['Every puzzle of every game that came by mail — solved, unsolved, burnt — and more.'])]));
    ['$1.99 a month', '$14.99 a year', '$24.99 forever'].forEach(function (x, k) {
      o.foot.appendChild(big(x, function () { S.paid = true; save(); o.close(); draw(); }, k ? 'o' : ''));
    });
  }
  /* a game: its levels in order of arrival, numbered 1, 2, 3… */
  function openGame(id) {
    var g = game(id), o = sheet(gname(g), '', { onclose: draw });
    function render() {
      o.body.innerHTML = '';
      var a = shown(id), sv = a.filter(function (n) { return isDone(id, n); }).length;
      o.el.querySelector('.t').innerHTML = ''; o.el.querySelector('.t').appendChild(document.createTextNode(gname(g))); o.el.querySelector('.t').appendChild(h('small', null, [T('{p}% solved', { p: pct(sv, a.length) })]));
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
    var o = sheet('All levels', T('{g} games · {n} levels', { g: Postie.games.length, n: total }));
    [['In the game', POSTIE_GAMES], ['Bench', POSTIE_BENCH]].forEach(function (part) {   // the bench never comes in a letter
      var grid = h('div', { class: 'grid3' });
      Postie.games.forEach(function (g) {
        if (part[1].indexOf(g.id) < 0) return;
        var sv = g.levels.filter(function (l, i) { return isAll(g.id, i + 1); }).length;
        grid.appendChild(h('button', { class: 'gm', onclick: function () { openAllGame(g.id); } }, [h('i', null, [sv + ' / ' + g.levels.length]), h('b', null, [gname(g)])]));
      });
      o.body.appendChild(h('h2', null, [part[0]])); o.body.appendChild(grid);
    });
  }
  function openAllGame(id) {
    var g = game(id), o = sheet(gname(g), T('{n} levels', { n: g.levels.length }));
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
    p.appendChild(h('div', { class: 'sent' }, [h('b', null, [String(sent)]), h('span', null, [Postie.plural(sent, T('letter sent'), T('letters sent'), 'писем отправлено')])]));
    p.appendChild(h('div', { class: 'mon' }, [
      h('button', { class: 'ib', 'aria-label': 'Previous month', disabled: canBack ? null : 'disabled', html: Postie.icon('left'), onclick: function () { calShift--; draw(); } }),
      h('b', null, [monthStr(first)]),
      h('button', { class: 'ib', 'aria-label': 'Next month', disabled: canFwd ? null : 'disabled', html: Postie.icon('right'), onclick: function () { calShift++; draw(); } })]));
    var wk = h('div', { class: 'days wk' }); (Postie.lang === 'ru' ? ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S']).forEach(function (c) { wk.appendChild(h('span', null, [c])); }); p.appendChild(wk);
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
    b('All games and levels', function () { o.close(); openAll(); }, 'o');
    b(Postie.lang === 'ru' ? 'English' : 'Русский', function () { LANG = Postie.lang === 'ru' ? 'en' : 'ru'; try { localStorage.setItem('postie:lang', LANG); } catch (e) {} applyLang(); o.close(); draw(); }, 'o');
    b('Next day', function () { S.day++; calShift = 0; save(); pan = 1; o.close(); draw(); });
    b('Solve 3 puzzles of today', function () { var E = envelope(), k = 0; E.opened = true; E.cards.forEach(function (c) { if (k < 3 && !isDone(c.id, c.n)) { markDone(c.id, c.n); k++; } }); save(); o.close(); draw(); }, 'o');
    b(S.paid ? 'Cancel the catalog purchase' : 'Buy the catalog', function () { S.paid = !S.paid; save(); o.close(); draw(); }, 'o');
    b('Reset everything', function () { if (!confirm(T('Reset all progress?'))) return; S = fresh(); save(); pan = 1; o.close(); draw(); }, 'o');
  }
  window.addEventListener('resize', function () { if (pans) pans.scrollLeft = pan * pans.clientWidth; });

  /* load games (order — web/games.js) */
  function load(src) { return new Promise(function (ok) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { ok(); }; document.body.appendChild(s); }); }
  var chain = Promise.resolve();
  var ALL = POSTIE_GAMES.concat(POSTIE_BENCH);                         // the bench is loaded too: test > All games and levels
  ALL.forEach(function (id) { ['levels', 'engine', 'view'].forEach(function (f) { chain = chain.then(function () { return load('games/' + id + '/' + f + '.js'); }); }); });
  chain.then(function () { Postie.games.sort(function (a, b) { return ALL.indexOf(a.id) - ALL.indexOf(b.id); }); draw(); });
})();
