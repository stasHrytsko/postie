/* The Gap — screen. Gestures: swipe a square on the board (one finger), tap a flask. Undo steps back one move.
   While the finger is down a faint ghost shows where the square will stop (stazzi SPEC §4); the move happens on release. */
(function () {
  var D = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] };
  var CSS = '.tg-wrap{position:relative;margin:34px auto 44px;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '.tg-layer{position:absolute;inset:0}' +
    '.tg-layer>.cell{position:absolute;margin:0;border-radius:var(--r12)}' +
    '.tg-sq{position:absolute;left:0;top:0;padding:4px;will-change:transform}' +
    '.tg-sq>i{display:grid;place-items:center;width:100%;height:100%;border-radius:var(--r12);border:1.5px solid transparent}' +
    '.tg-sq svg.pc{width:54%;height:54%;stroke:#fff;stroke-width:2.2}' +
    '.tg-sq.ghost{opacity:.35;pointer-events:none}' +
    '.tg-frame{position:absolute;inset:-8px;pointer-events:none;overflow:visible}' +
    '.tg-wrap .badge{z-index:2;pointer-events:none;color:var(--txt)}' +
    '.tg-goals{display:flex;justify-content:center;gap:16px;margin:4px 0 0;font:600 15px var(--font);color:var(--mut);font-variant-numeric:tabular-nums}' +
    '.tg-goals span{display:flex;align-items:center;gap:6px}.tg-goals span.done{color:var(--ink)}' +
    '.tg-goals svg.pc{width:18px;height:18px;stroke:var(--txt);stroke-width:1.4}' +
    '.tg-goals svg.ic{width:16px;height:16px;stroke:var(--ink);stroke-width:2.4}' +
    '.tg-flasks{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin:8px 0 4px}' +
    '.tg-fl{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 8px 10px;border-radius:var(--r16);border:1.5px solid var(--line);background:var(--card);cursor:pointer;min-width:62px;transition:border-color .2s,box-shadow .2s}' +
    '.tg-fl .n{font:700 14px var(--font);color:var(--mut)}' +
    '.tg-fl .st{display:flex;flex-direction:column-reverse;gap:4px}' +
    '.tg-fl .sl{width:40px;height:40px;border-radius:var(--r8);border:1.5px dashed var(--line);display:grid;place-items:center}' +
    '.tg-fl .sl svg.pc{width:56%;height:56%;stroke:#fff;stroke-width:2.2}' +
    '.tg-fl.done{border-color:var(--sage);box-shadow:0 0 0 2px var(--sage)}.tg-fl.done .n{color:var(--ink)}' +
    '.tg-fl.aim{border-color:var(--blue);box-shadow:0 0 0 2px var(--blue)}';

  Postie.register({
    id: 'the-gap', name: 'The Gap',
    rules: '<b>Swipe a square</b>: it slides until it hits something. If it stops at a numbered gap while moving toward it, it drops into that flask. <b>Tap a flask</b> to take its top square back out (its gap cell must be free). Finish with the board empty and <b>each shape alone in one flask</b>.',
    mount: function (root, ctx) {
      if (!document.getElementById('tg-css')) document.head.appendChild(Postie.h('style', { id: 'tg-css', html: CSS }));
      var h = Postie.h, E = ctx.engine, L = ctx.level, s = E.fresh(L), W = s.w, H = s.h, hist = [], busy = false;
      var avail = Math.min((root.clientWidth || 358), 420) - 56, CS = Math.floor(Math.min(84, avail / W)), GAP = 4;
      var stat = h('div', { class: 'stat' }), goals = h('div', { class: 'tg-goals' }), msg = h('div', { class: 'msg' });
      var wrap = h('div', { class: 'tg-wrap', style: 'width:' + (W * CS) + 'px;height:' + (H * CS) + 'px' });
      var floor = h('div', { class: 'tg-layer' }), layer = h('div', { class: 'tg-layer' }), fl = h('div', { class: 'tg-flasks' });
      wrap.appendChild(floor); wrap.appendChild(layer);
      root.appendChild(stat); root.appendChild(goals); root.appendChild(wrap); root.appendChild(fl); root.appendChild(msg);
      var undoBtn = Postie.btn('Undo', undo, 'o s');
      root.appendChild(h('div', { class: 'row' }, [undoBtn]));

      function P(c) { return Postie.PIECES[c - 1]; }
      function xf(x, y) { return 'translate(' + (x * CS) + 'px,' + (y * CS) + 'px)'; }
      function sq(c, x, y, cls) {
        var p = P(c), t = h('div', { class: 'tg-sq' + (cls ? ' ' + cls : ''), 'data-r': y, 'data-c': x }, [h('i', { class: 'c-' + p.k, html: Postie.shape(p.s, 'none') })]);
        t.style.width = t.style.height = CS + 'px'; t.style.transform = xf(x, y);
        t.firstChild.style.background = p.c; t.firstChild.style.borderColor = p.c;
        return t;
      }
      /* floor and the boundary wall with its numbered gaps (UI kit: "Boundary wall (The Gap)") */
      for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
        var wall = E.at(s, x, y) < 0;
        floor.appendChild(h('div', { class: 'cell' + (wall ? ' wall' : ''), 'data-r': y, 'data-c': x, style: 'left:' + (x * CS + GAP) + 'px;top:' + (y * CS + GAP) + 'px;width:' + (CS - 2 * GAP) + 'px;height:' + (CS - 2 * GAP) + 'px' }));
      }
      (function frame() {
        var o = 8, segs = [], isExit = function (x, y, dx, dy) { return L.exits.some(function (e) { return e[0] === x && e[1] === y && e[2] === dx && e[3] === dy; }); };
        for (var x = 0; x < W; x++) { if (!isExit(x, 0, 0, -1)) segs.push([x, 0, x + 1, 0]); if (!isExit(x, H - 1, 0, 1)) segs.push([x, H, x + 1, H]); }
        for (var y = 0; y < H; y++) { if (!isExit(0, y, -1, 0)) segs.push([0, y, 0, y + 1]); if (!isExit(W - 1, y, 1, 0)) segs.push([W, y, W, y + 1]); }
        var off = function (v, n) { return v === 0 ? o - 4 : v === n ? n * CS + o + 4 : v * CS + o; };
        var d = segs.map(function (g) {
          var horiz = g[1] === g[3], x1 = off(g[0], W), x2 = off(g[2], W), y1 = off(g[1], H), y2 = off(g[3], H);
          /* shorten at a gap so the opening reads clearly */
          if (horiz) { if (g[0] > 0 && isGap(g[0] - 1, g[1], 'h')) x1 += 6; if (g[2] < W && isGap(g[2], g[1], 'h')) x2 -= 6; }
          else { if (g[1] > 0 && isGap(g[0], g[1] - 1, 'v')) y1 += 6; if (g[3] < H && isGap(g[0], g[3], 'v')) y2 -= 6; }
          return 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2;
        }).join('');
        function isGap(i, edge, kind) {
          return kind === 'h' ? (edge === 0 ? isExit(i, 0, 0, -1) : isExit(i, H - 1, 0, 1)) : (edge === 0 ? isExit(0, i, -1, 0) : isExit(W - 1, i, 1, 0));
        }
        wrap.appendChild(h('div', { class: 'tg-frame', html: '<svg width="' + (W * CS + 2 * o) + '" height="' + (H * CS + 2 * o) + '" style="overflow:visible"><path d="' + d + '" fill="none" stroke="var(--txt)" stroke-width="3.5" stroke-linecap="round"/></svg>' }));
        L.exits.forEach(function (e, i) {
          var cx = (e[0] + 0.5 + e[2] * 0.5) * CS + e[2] * 22, cy = (e[1] + 0.5 + e[3] * 0.5) * CS + e[3] * 22;
          wrap.appendChild(h('div', { class: 'badge', style: 'left:' + cx + 'px;top:' + cy + 'px' }, [String(i + 1)]));
        });
      })();

      var tiles = {};
      function build() {
        layer.innerHTML = ''; tiles = {};
        for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) { var c = E.at(s, x, y); if (c > 0) { tiles[x + ',' + y] = sq(c, x, y); layer.appendChild(tiles[x + ',' + y]); } }
        drawSide();
      }
      function drawSide() {
        stat.innerHTML = Postie.stat([['Moves', s.moves], ['Best', L.best]]);
        undoBtn.disabled = !hist.length;
        goals.innerHTML = '';
        E.goals(s, L).forEach(function (g) {
          goals.appendChild(h('span', { class: g.done ? 'done' : '', html: Postie.shape(P(g.color).s, P(g.color).c) + g.have + '/' + g.total + (g.done ? Postie.icon('check') : '') }));
        });
        fl.innerHTML = '';
        var gs = E.goals(s, L), full = {}; gs.forEach(function (g) { full[g.color] = g.total; });
        s.flasks.forEach(function (f, i) {
          var done = f.length && f.every(function (c) { return c === f[0]; }) && f.length === full[f[0]];
          var st = h('div', { class: 'st' });
          for (var k = 0; k < L.caps[i]; k++) {
            var c = f[k], p = c ? P(c) : null;
            st.appendChild(h('div', { class: 'sl', style: p ? 'border:1.5px solid ' + p.c + ';background:' + p.c : '', html: p ? Postie.shape(p.s, 'none') : '' }));
          }
          var b = h('button', { class: 'tg-fl' + (done ? ' done' : ''), 'aria-label': 'Flask ' + (i + 1), 'data-flask': i + 1, onclick: function () { tapFlask(i + 1, b); } }, [h('div', { class: 'n' }, [String(i + 1)]), st]);
          fl.appendChild(b);
        });
      }
      function undo() { if (busy || !hist.length) return; s = hist.pop(); msg.textContent = ''; build(); }

      function tapFlask(n, el) {
        if (busy) return;
        var prev = E.clone(s), m = E.tapFlask(s, n);
        if (!m) { Postie.shake(el); msg.textContent = s.flasks[n - 1].length ? 'Gap ' + n + ' is blocked: free its cell first.' : 'Flask ' + n + ' is empty.'; return; }
        hist.push(prev); msg.textContent = '';
        var e = L.exits[n - 1], t = sq(m.color, m.to[0], m.to[1]);
        tiles[m.to[0] + ',' + m.to[1]] = t; layer.appendChild(t);
        if (t.animate) t.animate([{ transform: xf(e[0] + e[2] * 0.9, e[1] + e[3] * 0.9), opacity: 0 }, { transform: xf(e[0], e[1]), opacity: 1 }], { duration: 220, easing: 'ease-out' });
        drawSide(); after();
      }

      var from = null, ghost = null, sx = 0, sy = 0;
      function dirOf(ev) { var dx = ev.clientX - sx, dy = ev.clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return null; return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); }
      function clearAim() { if (ghost) { ghost.remove(); ghost = null; } fl.querySelectorAll('.aim').forEach(function (b) { b.classList.remove('aim'); }); }
      Postie.drag(wrap, {
        start: function (cell, ev) { if (busy || !(E.at(s, cell.c, cell.r) > 0)) return false; from = cell; sx = ev.clientX; sy = ev.clientY; },
        move: function (cell, ev) {
          if (!from) return; clearAim();
          var d = dirOf(ev), m = d && E.planSwipe(s, from.c, from.r, d); if (!m) return;
          ghost = sq(m.color, m.to[0], m.to[1], 'ghost'); layer.appendChild(ghost);
          if (m.kind === 'in') { var b = fl.querySelector('[data-flask="' + m.flask + '"]'); if (b) b.classList.add('aim'); }
        },
        end: function (cell, ev) { var f = from; from = null; clearAim(); if (!f) return; var d = dirOf(ev); if (d) swipe(f.c, f.r, d); },
        cancel: function () { from = null; clearAim(); }
      });

      function swipe(x, y, dir) {
        var t = tiles[x + ',' + y], prev = E.clone(s), m = E.swipe(s, x, y, dir);
        if (!m) { Postie.shake(t); msg.textContent = 'That square can’t move that way.'; return; }
        hist.push(prev); msg.textContent = ''; busy = true;
        delete tiles[x + ',' + y];
        var dur = 60 + 70 * m.steps;
        if (m.kind === 'slide') {
          t.style.transition = 'transform ' + dur + 'ms cubic-bezier(.3,0,.25,1)'; t.style.transform = xf(m.to[0], m.to[1]);
          t.dataset.c = m.to[0]; t.dataset.r = m.to[1]; tiles[m.to[0] + ',' + m.to[1]] = t;
          setTimeout(function () { t.style.transition = ''; busy = false; drawSide(); after(); }, dur);
        } else {
          var d = D[dir], frames = [{ transform: xf(x, y), opacity: 1 }, { transform: xf(m.to[0], m.to[1]), opacity: 1, offset: m.steps ? 0.7 : 0.2 }, { transform: xf(m.to[0] + d[0] * 0.9, m.to[1] + d[1] * 0.9), opacity: 0 }];
          t.style.opacity = 0; t.style.pointerEvents = 'none';
          if (t.animate) t.animate(frames, { duration: dur + 160, easing: 'ease-in' });
          setTimeout(function () { t.remove(); busy = false; drawSide(); after(); }, dur + 160);
        }
      }
      function after() { if (E.won(s)) ctx.win('Sorted in ' + s.moves + ' moves (best ' + L.best + ')'); }

      build();
      ctx.cleanup(function () { busy = true; });
    }
  });
})();
