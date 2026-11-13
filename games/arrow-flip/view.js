/* Arrow Flip — screen. Gesture: tap a block (one finger). Undo steps back one tap.
   Tiles are absolutely placed over the board so a tap can animate: the mover slides along its path (and fades off the edge),
   every block it brushes turns its whole tile 90° clockwise as it passes (stazzi decision 2026-11-10). */
(function () {
  var COLOR = { '^': 'apr', '<': 'blue', '>': 'sage', 'v': 'butter' }; /* as in the UI kit sheet, "Game elements" */
  var ANGLE = { '^': 0, '>': 90, 'v': 180, '<': 270 };
  var ANCHOR = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2.2"/><path d="M12 7.2V20M8 10.5h8M5 13.5a7 7 0 0014 0"/></svg>';
  var CSS = '.af-board{position:relative;margin:14px auto 8px;aspect-ratio:1;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '.af-layer{position:absolute;inset:0;display:grid;gap:0}' +
    '.af-layer>.cell{margin:3px;border-radius:var(--r12)}' +
    '.af-mark{display:grid;place-items:center;color:var(--line)}.af-mark svg.ic{width:52%;height:52%;stroke-width:1.8}' +
    '.af-tile{position:absolute;left:0;top:0;padding:3px;will-change:transform}' +
    '.af-tile>i{display:grid;place-items:center;width:100%;height:100%;border-radius:var(--r12);border:1.5px solid transparent;transition:background-color .32s,border-color .32s,box-shadow .2s}' +
    '.af-tile>i svg.ic{width:58%;height:58%;stroke:#fff;stroke-width:2.4}' +
    '.af-tile.lit>i{box-shadow:0 0 0 3px var(--card),0 0 0 5px var(--ink)}' +
    '.af-badge{position:absolute;left:0;top:0;display:grid;place-items:end;padding:7px;pointer-events:none;transition:opacity .2s}' +
    '.af-badge svg.ic{width:34%;height:34%;stroke:#fff;stroke-width:2.2}.af-badge.empty{place-items:center}.af-badge.empty svg.ic{width:50%;height:50%;stroke:var(--line)}' +
    '.af-legend{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;font-size:14px;color:var(--mut);margin:2px 0 4px}' +
    '.af-legend span{display:flex;align-items:center;gap:6px}.af-legend i{width:22px;height:22px;border-radius:6px;display:grid;place-items:center;border:1.5px solid var(--line);background:var(--card);color:var(--mut)}' +
    '.af-legend i svg.ic{width:16px;height:16px;stroke-width:2}.af-legend i.st{background:var(--ink);border-color:var(--ink)}';

  Postie.register({
    id: 'arrow-flip', name: 'Arrow Flip',
    rules: '<b>Tap a block</b>: it slides where its arrow points, until the next block or off the board. <b>Every block it brushes past turns 90° clockwise.</b> Send every block off the board.',
    mount: function (root, ctx) {
      if (!document.getElementById('af-css')) document.head.appendChild(Postie.h('style', { id: 'af-css', html: CSS }));
      var h = Postie.h, E = ctx.engine, L = ctx.level, s = E.fresh(L), N = s.size, hist = [], busy = false, pending = null, dead = false;
      var pct = 100 / N, tiles = {}, angle = {};
      var stat = h('div', { class: 'stat' }), msg = h('div', { class: 'msg' });
      var board = h('div', { class: 'af-board', style: 'max-width:' + (N === 4 ? 340 : 358) + 'px' });
      var cells = h('div', { class: 'af-layer', style: 'grid-template-columns:repeat(' + N + ',1fr)' }), layer = h('div', { class: 'af-layer' }), marks = h('div', { class: 'af-layer', style: 'pointer-events:none' });
      board.appendChild(cells); board.appendChild(layer); board.appendChild(marks);
      root.appendChild(stat); root.appendChild(board);
      var legend = legendEl(); if (legend) root.appendChild(legend);
      root.appendChild(msg);
      var undoBtn = Postie.btn('Undo', undo, 'o s');
      root.appendChild(h('div', { class: 'row' }, [undoBtn]));

      function has(list, r, c) { return (list || []).some(function (p) { return p[0] === r && p[1] === c; }); }
      function legendEl() {
        var items = [];
        if (s.stones.length) items.push(h('span', null, [h('i', { class: 'st' }), 'Stone: never moves']));
        if (s.spinners.length) items.push(h('span', null, [h('i', { html: Postie.icon('redo') }), 'Turns a block passing over it']));
        if (s.anchors.length) items.push(h('span', null, [h('i', { html: ANCHOR }), 'A block here never turns']));
        return items.length ? h('div', { class: 'af-legend' }, items) : null;
      }
      /* static floor: empty cells, stones, spinner and anchor marks */
      for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
        var stone = has(s.stones, r, c);
        cells.appendChild(h('div', { class: 'cell' + (stone ? ' wall' : ''), 'data-r': r, 'data-c': c }));
      }
      function place(el, r, c) { el.style.width = el.style.height = pct + '%'; el.style.transform = 'translate(' + (c * 100) + '%,' + (r * 100) + '%)'; }
      function tileXf(r, c, a) { return 'translate(' + (c * 100) + '%,' + (r * 100) + '%) rotate(' + a + 'deg)'; }
      function paint(t, d) { var i = t.firstChild; i.className = 'c-' + COLOR[d]; i.style.background = 'var(--' + COLOR[d] + ')'; i.style.borderColor = 'var(--' + COLOR[d] + ')'; t.setAttribute('aria-label', { '^': 'up', '>': 'right', 'v': 'down', '<': 'left' }[d] + ' block'); }
      function build() {
        layer.innerHTML = ''; tiles = {}; angle = {};
        s.blocks.forEach(function (b) {
          var t = h('div', { class: 'af-tile', 'data-r': b.r, 'data-c': b.c, role: 'button' }, [h('i', { html: Postie.icon('up') })]);
          t.style.width = t.style.height = pct + '%';
          angle[b.id] = ANGLE[b.d]; t.style.transform = tileXf(b.r, b.c, angle[b.id]); paint(t, b.d);
          tiles[b.id] = t; layer.appendChild(t);
        });
        drawMarks(); drawStat();
      }
      function drawMarks() {
        marks.innerHTML = '';
        s.spinners.concat(s.anchors).forEach(function (p) {
          var isSpin = has(s.spinners, p[0], p[1]), on = !!E.blockAt(s, p[0], p[1]);
          var m = h('div', { class: 'af-badge' + (on ? '' : ' empty'), html: isSpin ? Postie.icon('redo') : ANCHOR });
          place(m, p[0], p[1]); marks.appendChild(m);
        });
      }
      function drawStat() {
        stat.innerHTML = Postie.stat([['Taps', s.moves], ['Blocks left', s.blocks.length], ['Best', L.best]]);
        undoBtn.disabled = !hist.length;
      }
      function undo() {
        if (busy || !hist.length) return;
        pending = null; s = hist.pop(); msg.textContent = ''; msg.className = 'msg'; build();
      }

      Postie.drag(board, {
        start: function (cell) { if (!busy && !E.blockAt(s, cell.r, cell.c)) return false; },
        end: function (cell) { if (cell) tapCell(cell.r, cell.c); }
      });

      function tapCell(r, c) {
        if (busy) { pending = [r, c]; return; } /* a tap during a move runs right after it (as in stazzi) */
        var b = E.blockAt(s, r, c); if (!b) return;
        var prev = E.clone(s), p = E.plan(s, b.id), t = tiles[b.id];
        if (!p) {
          Postie.shake(t); msg.className = 'msg'; msg.textContent = 'Blocked: that block has nowhere to go.';
          var d = { '^': [-1, 0], '>': [0, 1], 'v': [1, 0], '<': [0, -1] }[b.d], nb = E.blockAt(s, r + d[0], c + d[1]);
          if (nb && tiles[nb.id]) { tiles[nb.id].classList.add('lit'); setTimeout(function () { if (tiles[nb.id]) tiles[nb.id].classList.remove('lit'); }, 300); }
          return;
        }
        hist.push(prev); msg.textContent = ''; msg.className = 'msg';
        E.tap(s, b.id);
        animate(p, b.id, t);
      }

      function animate(p, id, t) {
        busy = true;
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var STEP = reduce ? 0 : 70, a = angle[id], frames = [], n = p.path.length - 1;
        p.path.forEach(function (q, i) { if (p.turns.indexOf(i) >= 0 && i > 0) { frames.push({ transform: tileXf(q[0], q[1], a) }); a += 90; } frames.push({ transform: tileXf(q[0], q[1], a) }); });
        var travel = Math.max(1, n) * STEP;
        if (p.exited) {
          var last = p.path[n], dd = { '^': [-1, 0], '>': [0, 1], 'v': [1, 0], '<': [0, -1] }[p.endDir];
          frames.forEach(function (f) { f.opacity = 1; });
          frames.push({ transform: tileXf(last[0] + dd[0] * 1.4, last[1] + dd[1] * 1.4, a), opacity: 0 });
          travel += STEP * 2;
        }
        if (frames.length === 1) frames.unshift({ transform: frames[0].transform });
        angle[id] = a;
        if (!p.exited) { t.style.transform = tileXf(p.to[0], p.to[1], a); t.dataset.r = p.to[0]; t.dataset.c = p.to[1]; paint(t, p.endDir); }
        else { t.style.opacity = 0; t.style.pointerEvents = 'none'; }
        if (STEP && t.animate) t.animate(frames, { duration: travel, easing: 'cubic-bezier(.4,0,.5,1)' });
        /* brushed blocks turn as the mover passes them */
        p.touched.forEach(function (tc) {
          var o = tiles[tc.id]; if (!o) return;
          angle[tc.id] += 90;
          var b = null; s.blocks.forEach(function (x) { if (x.id === tc.id) b = x; });
          var delay = reduce ? 0 : Math.round(travel * (n ? tc.at / n : 0));
          setTimeout(function () {
            o.style.transition = reduce ? '' : 'transform .32s cubic-bezier(.3,1.4,.5,1)';
            o.style.transform = tileXf(b.r, b.c, angle[tc.id]); paint(o, b.d);
          }, delay);
        });
        setTimeout(function () {
          if (p.exited) { t.remove(); delete tiles[id]; }
          layer.querySelectorAll('.af-tile').forEach(function (o) { o.style.transition = ''; });
          if (dead) return;
          busy = false; drawMarks(); drawStat();
          if (E.won(s)) ctx.win('Cleared in ' + s.moves + ' taps (best ' + L.best + ')');
          else if (E.stuck(s)) { msg.className = 'msg bad'; msg.textContent = 'No block can move. Undo or restart.'; }
          else if (pending) { var q = pending; pending = null; tapCell(q[0], q[1]); }
        }, (reduce ? 0 : travel + 340));
        drawStat();
      }

      build();
      ctx.cleanup(function () { busy = dead = true; });
    }
  });
})();
