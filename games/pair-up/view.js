/* Pair Up — screen. One finger: drag from a cell to another = draw a rectangle with those corners (it replaces any it overlaps);
   tap a rectangle = remove it. Rectangles stay neutral until the whole board is covered; then right ones glow, wrong ones are dashed with "!". */
(function () {
  var CSS = '.pu{position:relative;width:100%;margin:10px auto;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '.pu .grid{gap:0;margin:0}.pu .cell{margin:2px;border-radius:var(--r8)}' +
    '.pu .cell.in{background:var(--sand);border-color:var(--sand)}.pu .cell.ok{background:var(--sage);border-color:var(--sage)}' +
    '.pu .dot{width:44%;height:44%;border-radius:50%}.pu .dot.b{background:var(--ink)}.pu .dot.w{background:var(--card);box-shadow:inset 0 0 0 2.5px var(--ink)}' +
    '.pu .dot.g{border-radius:3px;transform:rotate(45deg);width:36%;height:36%;background:var(--line);box-shadow:inset 0 0 0 2px var(--txt)}' +
    '.pu .rects{position:absolute;inset:0;pointer-events:none}' +
    '.pu .rect{position:absolute;border:2.5px solid var(--ink);border-radius:var(--r12)}' +
    '.pu .rect.good{border-color:var(--ink);box-shadow:0 0 0 3px var(--sage),0 0 14px var(--sage)}' +
    '.pu .rect.bad{border:2.5px dashed var(--bad)}' +
    '.pu .rect.frame{border:2.5px dashed var(--ink);background:none}' +
    '.pu .rect .bang{position:absolute;top:-10px;right:-10px;width:22px;height:22px;border-radius:50%;background:var(--bad);color:#fff;font:700 14px/22px var(--font);text-align:center}';
  function css() { if (document.getElementById('pu-css')) return; var st = document.createElement('style'); st.id = 'pu-css'; st.textContent = CSS; document.head.appendChild(st); }

  Postie.register({
    id: 'pair-up', name: 'Pair Up',
    rules: '<b>Drag</b> from one cell to another to draw a rectangle. Cover the whole board so that every rectangle holds ' +
      '<b>one dark dot and one light dot</b> (grey dots: <b>exactly two grey</b>). <b>Tap</b> a rectangle to remove it. ' +
      'Right and wrong show only when the board is covered.',
    mount: function (root, ctx) {
      css();
      var h = Postie.h, E = ctx.engine, L = ctx.level, s = E.fresh(L), hist = [], drag = null;
      var stat = h('div', { class: 'stat' }), msg = h('div', { class: 'msg' });
      var maxW = Math.min(400, L.w * 70);
      var wrap = h('div', { class: 'pu', style: 'max-width:' + maxW + 'px' });
      var grid = h('div', { class: 'grid', style: 'grid-template-columns:repeat(' + L.w + ',1fr)' });
      var layer = h('div', { class: 'rects' });
      wrap.appendChild(grid); wrap.appendChild(layer);
      var undoBtn = Postie.btn('Undo', function () { if (!hist.length || E.won(s)) return; s = hist.pop(); msg.textContent = ''; draw(); }, 'o s');
      root.appendChild(stat); root.appendChild(wrap); root.appendChild(msg);
      root.appendChild(h('div', { class: 'row' }, [undoBtn]));

      /* finger position -> nearest cell, clamped to the board (a finger off the board keeps the frame on the edge) */
      function at(ev) {
        var b = grid.getBoundingClientRect();
        var c = Math.floor((ev.clientX - b.left) / (b.width / L.w)), r = Math.floor((ev.clientY - b.top) / (b.height / L.h));
        return [Math.max(0, Math.min(L.h - 1, r)), Math.max(0, Math.min(L.w - 1, c))];
      }
      function commit(fn) {
        var prev = JSON.parse(JSON.stringify(s));
        if (!fn()) return false;
        hist.push(prev); return true;
      }
      Postie.drag(grid, {
        start: function (c) { if (E.won(s)) return false; drag = { a: [c.r, c.c], b: [c.r, c.c] }; drawFrame(); },
        move: function (c, ev) { if (!drag) return; var p = at(ev); if (p[0] !== drag.b[0] || p[1] !== drag.b[1]) { drag.b = p; drawFrame(); } },
        end: function (c, ev) {
          var d = drag; drag = null; if (!d) return; d.b = at(ev);
          if (d.a[0] === d.b[0] && d.a[1] === d.b[1]) { commit(function () { return E.remove(s, d.a[0], d.a[1]); }); draw(); return; }
          var p = E.rectOf(d.a[0], d.a[1], d.b[0], d.b[1]);
          commit(function () { return E.draw(s, p); });
          draw();
          var el = layer.querySelector('[data-k="' + p.join(',') + '"]'); if (el) Postie.pop(el);
          if (E.won(s)) ctx.win('Board covered · ' + s.moves + ' moves (best ' + L.best + ')');
        },
        cancel: function () { drag = null; drawFrame(); }
      });

      function box(p, cls) {
        var e = h('div', { class: 'rect ' + cls, 'data-k': p.join(','),
          style: 'left:calc(' + (p[1] / L.w * 100) + '% + 1px);top:calc(' + (p[0] / L.h * 100) + '% + 1px);' +
            'width:calc(' + ((p[3] - p[1] + 1) / L.w * 100) + '% - 2px);height:calc(' + ((p[2] - p[0] + 1) / L.h * 100) + '% - 2px)' });
        if (cls === 'bad') e.appendChild(h('span', { class: 'bang' }, ['!']));
        return e;
      }
      function drawFrame() {
        var f = layer.querySelector('.frame'); if (f) f.remove();
        if (drag && (drag.a[0] !== drag.b[0] || drag.a[1] !== drag.b[1])) layer.appendChild(box(E.rectOf(drag.a[0], drag.a[1], drag.b[0], drag.b[1]), 'frame'));
      }
      function draw() {
        var full = E.coveredAll(s), won = E.won(s);
        stat.innerHTML = Postie.stat([['Moves', s.moves], ['Best', L.best]]);
        undoBtn.disabled = !hist.length || won;
        var owner = []; s.rects.forEach(function (p, k) { for (var r = p[0]; r <= p[2]; r++) for (var c = p[1]; c <= p[3]; c++) owner[r * L.w + c] = k; });
        grid.innerHTML = '';
        for (var r = 0; r < L.h; r++) for (var c = 0; c < L.w; c++) {
          var i = r * L.w + c, d = s.dots[i], k = owner[i], cls = 'cell';
          if (k !== undefined) cls += full && E.isValid(s, s.rects[k]) ? ' ok' : ' in';
          grid.appendChild(h('div', { class: cls, 'data-r': r, 'data-c': c }, [d ? h('div', { class: 'dot ' + ['', 'b', 'w', 'g'][d] }) : null]));
        }
        layer.innerHTML = '';
        var bad = 0;
        s.rects.forEach(function (p) { var v = E.isValid(s, p); if (full && !v) bad++; layer.appendChild(box(p, full ? (v ? 'good' : 'bad') : '')); });
        drawFrame();
        msg.className = bad ? 'msg bad' : 'msg';
        msg.textContent = bad ? 'Board covered, but ' + bad + ' rectangle' + (bad > 1 ? 's are' : ' is') + ' wrong.' : '';
      }
      draw();
    }
  });
})();
