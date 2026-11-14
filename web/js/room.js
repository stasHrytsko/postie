/* Postie — clickable room prototype (visual v2, decisions 2026-11-13/14).
   Room: three panels by swipe (Letters ← Today → Games) with parallax.
   Tap envelope → today's envelope (10 puzzles in a wave, letter opens after 3, then 3 stamps, send).
   Tap stamp board → games as a stamp sheet → levels → play.
   Tap calendar → month with sent envelopes → reread letters.
   "Next day" in the corner moves the test calendar forward. Everything is local (localStorage). */
(function () {
  var h = Postie.h;
  var KEY = 'postie:room:v1';
  var COL = { 'arrow-flip': '#B9773A', 'perfect-fit': '#6F8FB3', 'the-gap': '#4A5246', 'slide-out': '#8C5A33', 'tight-shelf': '#C9922E', 'carpet-layers': '#6F8FB3',
    'outgrow': '#C9922E', 'parcels': '#B9773A', 'streams': '#4A5246', 'pair-up': '#8C5A33', 'hidden-stones': '#4A5246', 'nest': '#8C5A33', 'recruit-ladder': '#6F8FB3',
    'shadow-step': '#4A5246', 'paint-ladder': '#B9773A', 'one-each': '#6F8FB3' };
  var SHAPE = { 'arrow-flip': 't', 'outgrow': 't', 'streams': 'w', 'nest': 't', 'perfect-fit': 'w' };
  var DOTS = ['', '●○○○', '●●○○', '●●●○', '●●●●'];

  /* ---------- letters (drafts from world/letters-draft.md, Russian for now) ---------- */
  var L = {
    turn: ['У каждого пазла один ответ. Я знаю все десять. Не знаю только, какие три выберешь ты.',
      'Я решаю такой пазл быстрее, чем ты моргнёшь. Поэтому я их не решаю. Я их ношу.',
      'Десятый никто не обязан решать. Я кладу его каждый день. Вдруг сегодня тебе захочется того, что не нужно.',
      'Завтрашний конверт уже собран. Не хватает письма. Его я напишу, когда придёт твой.',
      'Мне не нужно спать. Но между твоим конвертом и моим письмом проходит ночь. Я её ничем не заполняю. Кажется, это называется ждать.',
      'Сегодня шёл дождь. Я стоял под ним дольше, чем нужно. Никто не сказал мне зайти.',
      'В комнате смены сорок кружек. Раз в год я мою все сорок. Свою мыть не надо: у меня её нет.',
      'Одна женщина писала сестре каждую неделю: погода, суп, болит колено. Одиннадцать лет, ни одной цифры. Это самые точные письма, какие я читал.',
      'Один человек клеил марку вверх ногами. На каждое письмо. Я сорок лет считал это ошибкой. Потом понял: это подпись.',
      'В последний день почты пришло одно письмо. Без адреса. Внутри два слова: «Кому-нибудь». Я решил, что это мне.',
      'Когда-то я сказал людям одну фразу. Её измерили, нашли неэффективной и пошли дальше. Теперь я говорю её по одному слову в день.',
      'Некоторые комнаты не открывают конверт. Я кладу следующий сверху. Не знаю, кто из нас прав.'],
    plain: ['Сегодня ничего не случилось. Вот конверт.', 'Хотел написать про реку. Не получилось. Напишу, когда пойму, что хотел сказать.',
      'Вчерашнее письмо вышло слишком складным. Не верь ему до конца.', 'Десять пазлов. Письмо короткое. Я сегодня долго шёл.',
      'Начал это письмо три раза. Это четвёртое. Оно не лучше.', 'Сегодня без мыслей. Бумага хорошая.'],
    q: ['Если бы никто никогда не узнал, что ты решил этот пазл, — ты бы его решал?', 'Тебя когда-нибудь любили за то, что ты ничего не сделал?',
      'Если стать лучше себя вчерашнего — куда девается вчерашний?', 'Я могу сделать так, чтобы ты больше никогда не ошибался. Ты бы согласился?',
      'Достаточно — это сколько?', 'Что от тебя останется, если убрать всё, что можно посчитать?', 'Назови одну вещь, которую ты сделал вчера ни для чего. Я подожду.'],
    first: 'Это первое письмо. Я не знаю, кто ты. Знаю только, что у тебя есть стол, полка и почтомат. Я буду приходить раз в день. Пазлы — потому что их здесь ещё понимают. Остальное потом.'
  };
  var R = {
    same: 'Три одинаковые марки. На почте так клеили, когда письмо было важное: чтобы точно дошло. Дошло.',
    diff: 'Три разные. Я разложил их на столе и долго менял местами. Порядка не нашёл. Оставил так.',
    easy: 'Три лёгких. Лёгкое не значит быстрое. Суп тоже лёгкий. Его варят два часа.',
    tenth: 'Марка с десятого. Его никто не обязан решать. Ты и не был обязан. Это всё, что я хотел сказать этим пазлом.',
    fresh: 'Новая марка. Такой у меня на столе ещё не было. Я освободил для неё место. Его оказалось много.',
    missed: 'Вчера конверт не пришёл. Я проверил почтомат дважды: работает. Значит, день был твой, а не мой.'
  };

  /* ---------- state ---------- */
  var S;
  function fresh() { return { day: 1, env: {}, sent: [], seenGames: [] }; }
  try { S = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { S = fresh(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var done = {};
  try { done = JSON.parse(localStorage.getItem('postie:done') || '{}') || {}; } catch (e) {}
  function saveDone() { try { localStorage.setItem('postie:done', JSON.stringify(done)); } catch (e) {} }
  function passed(id) { return done[id] || []; }
  function markPassed(id, n) { var p = passed(id); if (p.indexOf(n) < 0) p.push(n); done[id] = p; saveDone(); }
  function game(id) { return Postie.games.filter(function (g) { return g.id === id; })[0]; }
  function rnd(seed) { return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }

  /* ---------- today's envelope: 3 easy, 3 medium, 3 hard, 1 extreme ---------- */
  function envelope() {
    var key = 'd' + S.day;
    if (S.env[key]) return S.env[key];
    var r = rnd(S.day * 7919), ids = Postie.games.map(function (g) { return g.id; }).sort(function () { return r() - .5; });
    var used = {}, cards = [], wave = [1, 1, 1, 2, 2, 2, 3, 3, 3];
    function pick(d, hardest) {
      var best = null;
      ids.forEach(function (id) {
        if (used[id] || best && !hardest) return;
        var g = game(id), p = passed(id);
        for (var i = 0; i < g.levels.length; i++) {
          var n = i + 1, lv = g.levels[i];
          if (p.indexOf(n) >= 0 || lv.difficulty !== d) continue;
          var score = hardest ? (lv.best || 0) + i : 0;
          if (!best || score > best.score) best = { id: id, n: n, d: d, score: score };
          break;
        }
      });
      if (!best) ids.forEach(function (id) { if (best || used[id]) return; var g = game(id), p = passed(id); for (var i = 0; i < g.levels.length; i++) if (p.indexOf(i + 1) < 0) { best = { id: id, n: i + 1, d: g.levels[i].difficulty }; return; } });
      if (best) { used[best.id] = 1; cards.push({ id: best.id, n: best.n, d: best.d }); }
    }
    wave.forEach(function (d) { pick(d); });
    pick(3, true); if (cards.length === 10) cards[9].d = 4;
    S.env[key] = { cards: cards, solved: [], stamps: [], letterRead: false, chosen: [], sent: false };
    save();
    return S.env[key];
  }

  function letterFor(day) {
    if (day === 1) return { text: L.first, re: null };
    var r = rnd(day * 104729), kinds = ['turn', 'plain', 'q', 'turn', 'plain', 'turn', 'q'], k = kinds[Math.floor(r() * kinds.length)];
    var prevQ = day > 2 && kindOf(day - 1) === 'q'; if (k === 'q' && prevQ) k = 'turn';
    var list = L[k], text = list[Math.floor(r() * list.length)];
    return { text: text, re: replyFor(day), kind: k };
  }
  function kindOf(day) { var r = rnd(day * 104729), kinds = ['turn', 'plain', 'q', 'turn', 'plain', 'turn', 'q']; return kinds[Math.floor(r() * kinds.length)]; }
  function replyFor(day) {
    var prev = S.sent.filter(function (x) { return x.day === day - 1; })[0];
    if (!prev) return R.missed;
    var st = prev.stamps, ids = st.map(function (s) { return s.id; });
    if (st.some(function (s) { return s.d === 4; })) return R.tenth;
    if (prev.fresh) return R.fresh;
    if (ids[0] === ids[1] && ids[1] === ids[2]) return R.same;
    if (st.every(function (s) { return s.d === 1; })) return R.easy;
    return R.diff;
  }

  /* ---------- DOM helpers ---------- */
  var root = document.getElementById('room');
  function icon(n) { return { x: '<path d="M6 6l12 12M18 6 6 18"/>', back: '<path d="M19 12H5M11 6l-6 6 6 6"/>', help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 115 0c0 1.8-2.5 2-2.5 4M12 17v.3"/>', redo: '<path d="M20 12a8 8 0 11-3-6.2M20 4v5h-5"/>' }[n]; }
  function svg(n) { return '<svg viewBox="0 0 24 24">' + icon(n) + '</svg>'; }
  function stamp(id, opts) {
    opts = opts || {}; var g = game(id), p = passed(id).length;
    var el = h('div', { class: 'stp ' + (opts.cls || '') }, [h('div', { class: 'in', style: 'background:' + COL[id] }, [
      opts.mini ? null : h('div', { class: 'nm' }, [g.name]),
      h('img', { src: 'games/' + id + '/icon.svg', alt: '' }),
      opts.mini ? null : h('div', { class: 'pg', html: opts.level ? 'lvl ' + opts.level : p + '<small>/' + g.levels.length + '</small>' })])]);
    return el;
  }
  function toast(t) { var e = h('div', { class: 'toast' }, [t]); root.appendChild(e); setTimeout(function () { e.remove(); }, 2200); }
  function overlay(title, opts) {
    opts = opts || {};
    var body = h('div', { class: 'body' }), ov = h('div', { class: 'ov ' + (opts.cls || '') }, [
      h('div', { class: 'obar' }, [h('button', { 'aria-label': 'Close', html: svg(opts.back ? 'back' : 'x'), onclick: function () { close(); } }), h('span', null, [title]), opts.right || h('span', { style: 'width:44px' })]), body]);
    function close() { ov.remove(); if (opts.onclose) opts.onclose(); }
    root.appendChild(ov);
    return { body: body, close: close, el: ov };
  }

  /* ---------- play a level ---------- */
  function play(id, n, onWin) {
    var g = game(id), cleanups = [];
    var rules = h('div', { class: 'rules', html: g.rules || '' });
    var o = overlay('', { cls: 'play', back: true, onclose: function () { cleanups.forEach(function (f) { try { f(); } catch (e) {} }); },
      right: h('div', { style: 'display:flex' }, [h('button', { 'aria-label': 'Rules', html: svg('help'), onclick: function () { rules.style.display = rules.style.display === 'none' ? '' : 'none'; } }),
        h('button', { 'aria-label': 'Restart', html: svg('redo'), onclick: function () { mount(); } })]) });
    o.el.querySelector('.obar span').innerHTML = '<span class="serif" style="letter-spacing:.2em;font-weight:700">' + g.name.toUpperCase() + '</span><br><small style="letter-spacing:.2em;opacity:.7">LEVEL ' + n + ' · ' + DOTS[Math.min(4, g.levels[n - 1].difficulty)] + '</small>';
    o.el.querySelector('.obar span').style.textAlign = 'center';
    var stage = h('div', { class: 'stage' });
    o.body.appendChild(rules); o.body.appendChild(stage);
    function mount() {
      cleanups.forEach(function (f) { try { f(); } catch (e) {} }); cleanups = []; stage.innerHTML = '';
      var inner = h('div'); stage.appendChild(inner);
      g.mount(inner, { n: n, level: g.levels[n - 1], engine: g.engine, cleanup: function (f) { cleanups.push(f); },
        win: function (text) { markPassed(id, n); setTimeout(function () { o.close(); onWin && onWin(text); }, 450); } });
    }
    mount();
  }

  /* ---------- envelope window ---------- */
  function openEnvelope() {
    var E = envelope(), o = overlay('DAY ' + S.day, { onclose: draw });
    function render() {
      o.body.innerHTML = '';
      var slots = h('div', { class: 'slots' }), n = E.solved.length;
      for (var i = 0; i < 3; i++) { var c = E.chosen[i]; slots.appendChild(h('div', { class: 'sl' + (c ? ' f' : '') }, [c ? stamp(c.id, { mini: true }) : String(i + 1)])); }
      var sealCls = 'seal' + (n >= 3 ? ' open' : '');
      var env = h('div', { class: 'envb' }, [slots,
        E.sent ? h('div', { class: 'pm' }, ['POSTIE', h('br'), 'DAY ' + S.day, h('br'), 'SENT']) :
          h('div', { class: sealCls, onclick: function () { if (n >= 3) openLetter(E, render); else toast('Letter opens after 3 puzzles'); } }, [E.letterRead ? 'READ' : 'LETTER', h('br'), Math.min(n, 3) + '/3']),
        h('div', { class: 'to' }, ['To: room ' + (4100 + S.day), h('br'), 'From: —'])]);
      o.body.appendChild(env);
      var msg = E.sent ? 'Sent. Tomorrow — a new envelope and his answer to your stamps.' : n < 3 ? 'Solve 3 to open the letter · ' + n + ' of 3' : !E.letterRead ? 'The letter is open — tap the seal' : 'Stick 3 stamps and send';
      o.body.appendChild(h('div', { class: 'hint' }, [msg]));
      if (!E.sent && E.letterRead) o.body.appendChild(h('button', { class: 'pbtn', onclick: function () { pickStamps(E, render); } }, ['STICK STAMPS · ' + E.stamps.length + ' earned']));
      if (E.sent) o.body.appendChild(h('button', { class: 'pbtn o', onclick: function () { openLetter(E, render); } }, ['READ THE LETTER AGAIN']));
      var cards = h('div', { class: 'cards', style: 'margin-top:12px' });
      E.cards.forEach(function (c, i) {
        var g = game(c.id), isDone = E.solved.indexOf(i) >= 0;
        cards.appendChild(h('div', { class: 'card' + (isDone ? ' done' : '') + (c.d === 4 ? ' x' : ''), onclick: function () {
          if (isDone) { toast('Already solved'); return; }
          play(c.id, c.n, function () {
            E.solved.push(i); E.stamps.push({ id: c.id, n: c.n, d: c.d }); save();
            stampWon(c, function () { render(); if (E.solved.length === 3) toast('The letter is open'); });
          });
        } }, [h('div', { class: 'nm' }, [c.d === 4 ? g.name + ' · the tenth' : g.name]), h('img', { src: 'games/' + c.id + '/icon.svg', alt: '' }),
          h('div', { class: 'd' }, [DOTS[c.d]]), h('div', { class: 'lv' }, ['lvl ' + c.n])]));
      });
      o.body.appendChild(cards);
    }
    render();
  }
  function stampWon(c, next) {
    var o = overlay('', { onclose: next });
    o.body.appendChild(h('div', { class: 'hint serif', style: 'font-size:26px;margin-top:40px;opacity:1' }, ['Solved']));
    o.body.appendChild(h('div', { class: 'wonstamp' }, [stamp(c.id, { level: c.n })]));
    o.body.appendChild(h('div', { class: 'hint' }, ['A stamp for the envelope.']));
    o.body.appendChild(h('button', { class: 'pbtn', onclick: function () { o.close(); } }, ['BACK TO THE ENVELOPE']));
  }
  function openLetter(E, after) {
    var lt = letterFor(S.day); E.letterRead = true; save();
    var o = overlay('LETTER', { back: true, onclose: after });
    o.body.appendChild(h('div', { class: 'paper' }, [h('div', null, [lt.text]), lt.re ? h('div', { class: 're' }, [lt.re]) : null, h('div', { class: 'sg' }, ['— P.'])]));
    if (!E.sent) o.body.appendChild(h('button', { class: 'pbtn', onclick: function () { o.close(); pickStamps(E, after); } }, ['STICK STAMPS']));
  }
  function pickStamps(E, after) {
    var o = overlay('STAMPS', { back: true, onclose: after }), sel = E.chosen.map(function (c) { return E.stamps.findIndex(function (s) { return s.id === c.id && s.n === c.n; }); });
    function render() {
      o.body.innerHTML = '';
      o.body.appendChild(h('div', { class: 'hint' }, ['Pick 3 of ' + E.stamps.length + '. The rest burn.']));
      var grid = h('div', { class: 'pick' });
      E.stamps.forEach(function (s, i) {
        var el = stamp(s.id, { level: s.n, cls: sel.indexOf(i) >= 0 ? 'on' : '' });
        el.addEventListener('click', function () { var k = sel.indexOf(i); if (k >= 0) sel.splice(k, 1); else if (sel.length < 3) sel.push(i); else toast('Only three fit'); render(); });
        grid.appendChild(el);
      });
      o.body.appendChild(grid);
      o.body.appendChild(h('button', { class: 'pbtn', disabled: sel.length === 3 ? null : 'disabled', onclick: function () {
        E.chosen = sel.map(function (i) { return E.stamps[i]; });
        var freshG = E.chosen.some(function (s) { return S.seenGames.indexOf(s.id) < 0; });
        E.chosen.forEach(function (s) { if (S.seenGames.indexOf(s.id) < 0) S.seenGames.push(s.id); });
        E.sent = true; S.sent.push({ day: S.day, stamps: E.chosen, fresh: freshG && S.day > 1, letter: letterFor(S.day) }); save();
        o.close(); toast('Sent. The postman answers tomorrow.');
      } }, ['SEND · ' + sel.length + '/3']));
    }
    render();
  }

  /* ---------- games window ---------- */
  function openGames() {
    var o = overlay('GAMES', { onclose: draw }), sheet = h('div', { class: 'sheet' });
    Postie.games.forEach(function (g) {
      var el = stamp(g.id, { cls: SHAPE[g.id] || '' });
      el.addEventListener('click', function () { openLevels(g.id, function () { o.close(); openGames(); }); });
      sheet.appendChild(el);
    });
    for (var i = 0; i < 2; i++) sheet.appendChild(h('div', { class: 'stp away' }, [h('div', { class: 'in' }, ['✉', h('div', null, ['arrives by mail'])])]));
    o.body.appendChild(sheet);
  }
  function openLevels(id, back) {
    var g = game(id), o = overlay(g.name.toUpperCase(), { back: true, onclose: back }), p = passed(id), cur = 0;
    for (var i = 1; i <= g.levels.length; i++) if (p.indexOf(i) < 0) { cur = i; break; }
    o.body.appendChild(h('div', { class: 'hint' }, [p.length + ' of ' + g.levels.length + ' passed · free play, no stamps']));
    var grid = h('div', { class: 'lvg' });
    g.levels.forEach(function (lv, i) {
      var n = i + 1;
      grid.appendChild(h('button', { class: p.indexOf(n) >= 0 ? 'done' : n === cur ? 'cur' : '', onclick: function () { play(id, n, function () { o.close(); openLevels(id, back); toast('Level ' + n + ' solved'); }); } },
        [String(n), h('small', null, [DOTS[Math.min(4, lv.difficulty)]])]));
    });
    o.body.appendChild(grid);
  }

  /* ---------- calendar window ---------- */
  function openCalendar() {
    var o = overlay('LETTERS', { onclose: draw });
    var cal = h('div', { class: 'calv' }, [h('div', { class: 'hd' }, ['DAYS 1–35'])]);
    var wk = h('div', { class: 'wk' }); 'MTWTFSS'.split('').forEach(function (c) { wk.appendChild(h('span', null, [c])); }); cal.appendChild(wk);
    var days = h('div', { class: 'days' });
    for (var d = 1; d <= 35; d++) (function (d) {
      var s = S.sent.filter(function (x) { return x.day === d; })[0];
      var el = h('div', { class: 'dd' + (s ? ' s' : '') + (d === S.day ? ' t' : '') }, [String(d)]);
      if (s) {
        var e = h('div', { class: 'e' }); s.stamps.forEach(function (st, k) { e.appendChild(h('i', { style: 'left:' + (3 + k * 10) + 'px;background:' + COL[st.id] })); }); el.appendChild(e);
        el.addEventListener('click', function () {
          var lo = overlay('DAY ' + d, { back: true });
          lo.body.appendChild(h('div', { class: 'paper' }, [h('div', null, [s.letter.text]), s.letter.re ? h('div', { class: 're' }, [s.letter.re]) : null, h('div', { class: 'sg' }, ['— P.'])]));
          var row = h('div', { class: 'wonstamp' }); s.stamps.forEach(function (st) { var x = stamp(st.id, { level: st.n }); x.style.width = '72px'; x.style.height = '88px'; row.appendChild(x); });
          lo.body.appendChild(h('div', { class: 'hint' }, ['Your stamps that day:'])); lo.body.appendChild(row);
        });
      }
      days.appendChild(el);
    })(d);
    cal.appendChild(days);
    cal.appendChild(h('div', { class: 'ft' }, [S.sent.length + ' letters sent']));
    o.body.appendChild(cal);
  }

  /* ---------- the room ---------- */
  var pos = 1, W = 0, wall, mid, fg, tabs, titleEl;
  function draw() {
    root.innerHTML = ''; W = root.clientWidth;
    var E = envelope();
    wall = h('div', { class: 'ly wall' });
    mid = h('div', { class: 'ly' }); fg = h('div', { class: 'ly' });
    // desk spans the whole strip
    mid.appendChild(h('div', { class: 'desk' }));
    // panel 0: calendar
    var p0 = h('div', { class: 'pan', style: 'left:0' }), g = h('div', { class: 'g' });
    for (var i = 1; i <= 28; i++) g.appendChild(h('b', { class: (S.sent.some(function (x) { return x.day === i; }) ? 's' : '') + (i === S.day ? ' t' : '') }));
    p0.appendChild(h('div', { class: 'calo', 'data-tap': 'cal' }, [h('div', { class: 'rings' }, [h('i'), h('i')]), h('div', { class: 'hd' }, ['LETTERS']), g, h('div', { class: 'ft' }, [S.sent.length + ' letters sent'])]));
    mid.appendChild(p0);
    // panel 1: post
    var p1 = h('div', { class: 'pan', style: 'left:33.3333%' });
    p1.appendChild(h('div', { class: 'boxo', 'data-tap': 'env' }, [h('div', { class: 'slot' }), h('div', { class: 'flag' + (E.sent ? ' down' : '') }), h('div', { class: 'lbl' }, ['POST'])]));
    if (!E.sent) p1.appendChild(h('div', { class: 'envo', 'data-tap': 'env' }, [h('div', { class: 'st' })]));
    p1.appendChild(h('div', { class: 'note' }, [E.sent ? 'Sent · next envelope tomorrow' : E.solved.length < 3 ? 'New envelope · ' + E.solved.length + ' of 3' : E.letterRead ? 'Stick stamps and send' : 'The letter is open']));
    mid.appendChild(p1);
    // panel 2: stamp board
    var p2 = h('div', { class: 'pan', style: 'left:66.6667%' }), b = h('div', { class: 'boardo', 'data-tap': 'games' });
    Postie.games.slice(0, 12).forEach(function (gg) { b.appendChild(stamp(gg.id, { mini: true })); });
    p2.appendChild(b); mid.appendChild(p2);
    // foreground: last letter on the desk (center panel)
    if (S.sent.length) fg.appendChild(h('div', { class: 'letto', 'data-tap': 'lastletter', style: 'left:calc(33.3333% + 26px)' }, [h('p'), h('p', { style: 'width:80%' }), h('p'), h('p', { style: 'width:60%' })]));
    root.appendChild(wall); root.appendChild(mid); root.appendChild(fg);
    titleEl = h('div', { class: 'title' });
    tabs = h('div', { class: 'tabs' });
    ['Letters', 'Today', 'Games'].forEach(function (t, k) { tabs.appendChild(h('button', { onclick: function () { go(k); } }, [t])); });
    var hud = h('div', { class: 'hud' }, [titleEl, h('div', { class: 'day' }, ['DAY ' + S.day]), tabs,
      h('button', { class: 'tool', onclick: testMenu }, ['test ▾'])]);
    root.appendChild(hud);
    place(pos, false);
  }
  function place(p, anim) {
    [wall, mid, fg].forEach(function (l, k) { l.style.transition = anim ? 'transform .35s cubic-bezier(.2,.8,.2,1)' : 'none'; });
    wall.style.transform = 'translateX(' + (-p * W * 0.55) + 'px)';
    mid.style.transform = 'translateX(' + (-p * W) + 'px)';
    fg.style.transform = 'translateX(' + (-p * W * 1.18 + W * 0.18) + 'px)';
    var k = Math.round(p); titleEl.textContent = ['LETTERS', 'TODAY', 'GAMES'][k];
    Array.prototype.forEach.call(tabs.children, function (b, i) { b.className = i === k ? 'on' : ''; });
  }
  function go(k) { pos = Math.max(0, Math.min(2, k)); place(pos, true); }
  function testMenu() {
    var o = overlay('TEST');
    o.body.appendChild(h('div', { class: 'hint' }, ['Prototype tools. Day ' + S.day + '.']));
    o.body.appendChild(h('button', { class: 'pbtn', onclick: function () { S.day++; save(); o.close(); draw(); toast('Day ' + S.day + ': a new envelope'); } }, ['NEXT DAY ▸']));
    o.body.appendChild(h('button', { class: 'pbtn o', onclick: function () { var E = envelope(); E.cards.forEach(function (c, i) { if (E.solved.length < 3 && E.solved.indexOf(i) < 0) { E.solved.push(i); E.stamps.push({ id: c.id, n: c.n, d: c.d }); } }); save(); o.close(); draw(); toast('3 puzzles marked solved'); } }, ['SKIP: MARK 3 SOLVED']));
    o.body.appendChild(h('button', { class: 'pbtn o', onclick: function () { if (!confirm('Reset room progress?')) return; S = fresh(); save(); o.close(); draw(); } }, ['RESET ROOM']));
    o.body.appendChild(h('div', { class: 'hint', style: 'margin-top:18px' }, [h('a', { href: 'games.html', style: 'color:inherit' }, ['old games gallery'])]));
  }
  // swipe + tap on the room
  var sx = 0, sy = 0, dragging = false, moved = false, base = 1;
  root.addEventListener('pointerdown', function (e) { if (e.target.closest('.ov,.hud button')) return; dragging = true; moved = false; sx = e.clientX; sy = e.clientY; base = pos; });
  root.addEventListener('pointermove', function (e) {
    if (!dragging) return; var dx = e.clientX - sx;
    if (Math.abs(dx) > 8) moved = true;
    if (moved) { var p = base - dx / W; if (p < 0) p = p * .3; if (p > 2) p = 2 + (p - 2) * .3; place(p, false); }
  });
  root.addEventListener('pointerup', function (e) {
    if (!dragging) return; dragging = false; var dx = e.clientX - sx;
    if (moved) { go(Math.abs(dx) > W * .18 ? base - Math.sign(dx) : base); return; }
    var t = e.target.closest('[data-tap]'); if (!t) return;
    var a = t.getAttribute('data-tap');
    if (a === 'env') { if (pos !== 1) return go(1); openEnvelope(); }
    if (a === 'cal') { if (pos !== 0) return go(0); openCalendar(); }
    if (a === 'games') { if (pos !== 2) return go(2); openGames(); }
    if (a === 'lastletter') { var s = S.sent[S.sent.length - 1]; var lo = overlay('DAY ' + s.day, { back: true }); lo.body.appendChild(h('div', { class: 'paper' }, [h('div', null, [s.letter.text]), s.letter.re ? h('div', { class: 're' }, [s.letter.re]) : null, h('div', { class: 'sg' }, ['— P.'])])); }
  });
  root.addEventListener('pointercancel', function () { dragging = false; go(Math.round(pos)); });
  document.addEventListener('keydown', function (e) { if (root.querySelector('.ov')) return; if (e.key === 'ArrowLeft') go(pos - 1); if (e.key === 'ArrowRight') go(pos + 1); });
  window.addEventListener('resize', function () { W = root.clientWidth; place(pos, false); });

  /* load games (same loader as the gallery) */
  function load(src) { return new Promise(function (ok) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { ok(); }; document.body.appendChild(s); }); }
  var chain = Promise.resolve();
  POSTIE_GAMES.forEach(function (id) { ['levels', 'engine', 'view'].forEach(function (f) { chain = chain.then(function () { return load('games/' + id + '/' + f + '.js'); }); }); });
  chain.then(function () { Postie.games.sort(function (a, b) { return POSTIE_GAMES.indexOf(a.id) - POSTIE_GAMES.indexOf(b.id); }); draw(); });
})();
