/* Square Up — screen. Gestures: tap a person — give (1 coin to each neighbour); press and hold — take (1 coin from each).
   The hold fills a ring and fires at HOLD ms while the finger is still down; let go earlier — it is a give (stazzi author decision 2026-11-19).
   Exactly `limit` taps per try, no undo: a missed try leaves the end position and the shell's Restart plate. */
(function () {
  var HOLD = 420;
  var CSS = '' +
    '.su-board{position:relative;width:100%;margin:6px auto 0;container-type:inline-size;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '.su-board svg.su-lines{position:absolute;inset:0;width:100%;height:100%;overflow:visible}' +
    '.su-board svg.su-lines line{stroke:var(--line);stroke-width:3;stroke-linecap:round;vector-effect:non-scaling-stroke}' +
    '.su-p{position:absolute;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;display:grid;place-items:center;cursor:pointer;-webkit-touch-callout:none}' +
    '.su-p b{font-weight:700;color:var(--on);font-variant-numeric:tabular-nums;pointer-events:none;position:relative}' +
    '.su-p.neg{background:var(--apr)}.su-p.zero{background:var(--sage)}.su-p.pos{background:var(--blue)}' +
    '.su-p.press{transform:translate(-50%,-50%) scale(.92);transition:transform .12s}' +
    '.su-ring{position:absolute;inset:-7px;border-radius:50%;pointer-events:none;background:conic-gradient(var(--butter) calc(var(--p,0) * 360deg),transparent 0);' +
      '-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px))}' +
    '.su-coin{position:absolute;width:3.2cqw;aspect-ratio:1;border-radius:50%;background:var(--butter);box-shadow:0 0 0 1.5px var(--ink);transform:translate(-50%,-50%);pointer-events:none}' +
    '.su-dots{display:flex;justify-content:center;gap:7px;margin:4px 0 2px;min-height:14px}' +
    '.su-dots i{width:12px;height:12px;border-radius:50%;border:2px solid var(--ink);box-sizing:border-box}' +
    '.su-dots i.used{background:var(--ink)}' +
    '.su-board.won .su-p{box-shadow:0 0 0 4px var(--sage)}' +
    '.su-bump{animation:su-bump .22s ease-out}@keyframes su-bump{50%{transform:translate(-50%,-50%) scale(1.12)}}';
  Postie.tr({
    '<b>Tap</b> a person: they <b>give</b> 1 coin to each neighbour on a line. <b>Press and hold</b>: they <b>take</b> 1 coin from each. Get <b>everyone to exactly 0</b> in the taps you have (dots). No undo; going below 0 on the way is fine.':
      '<b>Нажми</b> на человека: он <b>отдаёт</b> по 1 монете каждому соседу по линии. <b>Нажми и держи</b>: он <b>забирает</b> по 1 монете у каждого. Сведи <b>всех ровно к 0</b> за те нажатия, что есть (точки). Отмены нет; уходить ниже 0 по дороге можно.',
    '<b>Tap</b>: give 1 coin to each neighbour.': '<b>Нажми</b>: человек отдаёт по 1 монете каждому соседу.',
    '<b>Press and hold</b>: take 1 coin from each neighbour.': '<b>Нажми и держи</b>: человек забирает по 1 монете у каждого соседа.',
    'Get <b>everyone to 0</b> in the taps you have.': 'Сведи <b>всех к 0</b> за те нажатия, что есть.',
    'Taps': 'Нажатия',
    'Everyone at 0 · {n} taps': 'У всех 0 · нажатий: {n}',
    'Not everyone is at 0. Look at the numbers, then try again.': 'Не у всех 0. Посмотри на числа и попробуй снова.',
    'Person {n}: {c} coins': 'Человек {n}, монет: {c}'
  });
  function css() { if (document.getElementById('su-css')) return; var s = document.createElement('style'); s.id = 'su-css'; s.textContent = CSS; document.head.appendChild(s); }
  var still = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function label(v) { return v < 0 ? '−' + (-v) : String(v); }

  Postie.register({
    id: 'square-up', name: 'Square Up',
    rules: '<b>Tap</b> a person: they <b>give</b> 1 coin to each neighbour on a line. <b>Press and hold</b>: they <b>take</b> 1 coin from each. ' +
      'Get <b>everyone to exactly 0</b> in the taps you have (dots). No undo; going below 0 on the way is fine.',
    /* level 0: five in a line, give twice */
    tutorial: { pts: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], edges: [[0, 1], [1, 2], [2, 3], [3, 4]], coins: [-1, 2, -2, 2, -1], limit: 2, solution: [[1, 1], [3, 1]] },
    demo: [
      { say: '<b>Tap</b>: give 1 coin to each neighbour.', level: { pts: [[0, 0], [1, 0], [2, 0]], edges: [[0, 1], [1, 2]], coins: [-1, 2, -1], limit: 1, solution: [[1, 1]] } },
      { say: '<b>Press and hold</b>: take 1 coin from each neighbour.', level: { pts: [[0, 0], [1, 0], [2, 0]], edges: [[0, 1], [1, 2]], coins: [1, -2, 1], limit: 1, solution: [[1, -1]] } },
      { say: 'Get <b>everyone to 0</b> in the taps you have.', level: { pts: [[0, 0], [1, 0], [2, 0], [3, 0]], edges: [[0, 1], [1, 2], [2, 3]], coins: [1, -3, 3, -1], limit: 2, solution: [[1, -1], [2, 1]] } }
    ],
    /* a move = [person, +1 give | -1 take]; give = tap, take = press and hold */
    gesture: function (root, m) {
      var e = root.querySelector('.su-p[data-v="' + m[0] + '"]'); if (!e) return null;
      var b = e.getBoundingClientRect(), p = { x: b.left + b.width / 2, y: b.top + b.height * 0.6 };
      if (m[1] < 0) p.hold = true;
      return [p];
    },
    mount: function (root, ctx) {
      css();
      var h = Postie.h, E = ctx.engine, L = ctx.level, s = E.fresh(L), busy = false, hold = null;
      /* fit the people into the board: board units = points' box + padding; positions in % so the board scales as a whole */
      var xs = L.pts.map(function (p) { return p[0]; }), ys = L.pts.map(function (p) { return p[1]; });
      var x0 = Math.min.apply(null, xs), y0 = Math.min.apply(null, ys), pad = 0.62;
      var W = Math.max.apply(null, xs) - x0 + 2 * pad, H = Math.max.apply(null, ys) - y0 + 2 * pad, D = 0.8;   // D: a person's size in units
      var px = function (v) { return (L.pts[v][0] - x0 + pad) / W * 100; }, py = function (v) { return (L.pts[v][1] - y0 + pad) / H * 100; };
      var maxW = Math.round(76 * W / D);                                             // a person is at most 76px across
      var board = h('div', { class: 'su-board', style: 'max-width:' + maxW + 'px;aspect-ratio:' + W + '/' + H });
      board.innerHTML = '<svg class="su-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
        L.edges.map(function (e) { return '<line x1="' + px(e[0]) + '" y1="' + py(e[0]) + '" x2="' + px(e[1]) + '" y2="' + py(e[1]) + '"/>'; }).join('') + '</svg>';
      var size = D / W * 100;
      var nodes = L.pts.map(function (_, v) {
        var el = h('div', { class: 'su-p', 'data-v': v, role: 'button',
          style: 'left:' + px(v) + '%;top:' + py(v) + '%;width:' + size + '%;font-size:' + (size * 0.4) + 'cqw' }, [h('b')]);
        el.addEventListener('pointerdown', function (e) { e.preventDefault(); down(v, e); });
        el.addEventListener('pointerup', function () { up(v); });
        el.addEventListener('pointercancel', cancelHold);
        el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        board.appendChild(el); return el;
      });
      var dots = h('div', { class: 'su-dots', 'aria-label': 'Taps' }), msg = h('div', { class: 'msg' });
      root.appendChild(dots); root.appendChild(board); root.appendChild(msg);
      if (ctx.cleanup) ctx.cleanup(cancelHold);

      function down(v, e) {
        if (busy || s.status !== 'playing') return;
        cancelHold();
        try { nodes[v].setPointerCapture(e.pointerId); } catch (x) {}
        var el = nodes[v], ring = el.querySelector('.su-ring') || el.appendChild(h('div', { class: 'su-ring' }));
        el.classList.add('press');
        var t0 = performance.now();
        hold = { v: v, raf: requestAnimationFrame(function fr(now) {
          if (!hold || !el.isConnected) return;
          var k = Math.min(1, (now - t0) / HOLD); ring.style.setProperty('--p', k);
          if (k >= 1) { cancelHold(); go(v, -1); return; }
          hold.raf = requestAnimationFrame(fr);
        }) };
      }
      function up(v) { if (!hold || hold.v !== v) return; cancelHold(); go(v, 1); }
      function cancelHold() {
        if (!hold) return; cancelAnimationFrame(hold.raf);
        var el = nodes[hold.v]; el.classList.remove('press'); var r = el.querySelector('.su-ring'); if (r) r.style.setProperty('--p', 0);
        hold = null;
      }

      function go(v, sign) {
        if (busy || !E.tap(s, v, sign)) return;
        if (ctx.moved) ctx.moved([v, sign]);
        if (navigator.vibrate) try { navigator.vibrate(10); } catch (x) {}
        busy = true; drawDots();
        var T = still ? 0 : 320;
        /* coins fly along every line: give — from v to the neighbours, take — from the neighbours to v */
        if (T && board.animate) s.nb[v].forEach(function (j) {
          var a = sign > 0 ? v : j, b = sign > 0 ? j : v, c = h('div', { class: 'su-coin' });
          board.appendChild(c);
          var an = c.animate([{ left: px(a) + '%', top: py(a) + '%' }, { left: px(b) + '%', top: py(b) + '%' }], { duration: T, easing: 'ease-in-out', fill: 'forwards' });
          an.onfinish = function () { c.remove(); };
        });
        setTimeout(function () {
          busy = false; draw();
          if (!still) [v].concat(s.nb[v]).forEach(function (j) { var q = nodes[j]; q.classList.remove('su-bump'); void q.offsetWidth; q.classList.add('su-bump'); });
          if (s.status === 'won') { board.classList.add('won'); ctx.win(Postie.t('Everyone at 0 · {n} taps', { n: s.taps })); }
          else if (s.status === 'failed') { msg.className = 'msg bad'; msg.textContent = Postie.t('Not everyone is at 0. Look at the numbers, then try again.'); Postie.shake(board); }
        }, T + 40);
      }

      function drawDots() {
        dots.innerHTML = '';
        for (var k = 0; k < s.limit; k++) dots.appendChild(h('i', { class: k < s.taps ? 'used' : '' }));
      }
      function draw() {
        nodes.forEach(function (el, v) {
          var c = s.coins[v];
          el.className = 'su-p ' + (c < 0 ? 'neg' : c === 0 ? 'zero' : 'pos');
          el.firstChild.textContent = label(c);
          el.setAttribute('aria-label', Postie.t('Person {n}: {c} coins', { n: v + 1, c: label(c) }));
        });
        drawDots();
      }
      draw();
    }
  });
})();
