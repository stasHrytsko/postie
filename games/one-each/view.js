/* One Each — screen. Gestures: drag a marble to a free neighbour (tap works when exactly one neighbour is free). */
Postie.register({
  id: 'one-each', name: 'One Each',
  rules: '<b>Drag a marble</b> into a free cell next to it. Arrange them so <b>no colour repeats in any row or column</b>. Marbles that still clash are outlined.',
  mount: function (root, ctx) {
    var h = Postie.h, E = ctx.engine, L = ctx.level, s = E.fresh(L), hist = [];
    var stat = h('div', { class: 'stat' }), msg = h('div', { class: 'msg' });
    var grid = h('div', { class: 'grid', style: 'grid-template-columns:repeat(' + L.n + ',1fr);max-width:' + (L.n * 90) + 'px;gap:8px' });
    root.appendChild(stat); root.appendChild(grid); root.appendChild(msg);
    root.appendChild(h('div', { class: 'row' }, [Postie.btn('Undo', function () { if (!hist.length) return; s = hist.pop(); msg.textContent = ''; draw(); }, 'o s')]));
    function go(i, j, cell) {
      var prev = JSON.parse(JSON.stringify(s));
      if (!E.move(s, i, j)) { Postie.shake(cell); msg.textContent = 'Only into a free cell next to it.'; return; }
      hist.push(prev); msg.textContent = ''; draw();
      if (E.won(s)) ctx.win('No repeats — ' + s.moves + ' moves (best ' + L.best + ')');
    }
    var from = null;
    Postie.drag(grid, {
      start: function (c) { if (!s.cells[c.i]) return false; from = c; c.el.classList.add('sel'); },
      end: function (c) {
        var f = from; from = null; f.el.classList.remove('sel');
        if (!c || c.i === f.i) { var em = E.freeNeighbours(s, f.i); if (em.length === 1) go(f.i, em[0], f.el); else { Postie.shake(f.el); msg.textContent = em.length ? 'Drag it to the free cell you want.' : 'No free cell next to it.'; } return; }
        go(f.i, c.i, f.el);
      },
      cancel: function () { if (from) from.el.classList.remove('sel'); from = null; }
    });
    function draw() {
      stat.innerHTML = Postie.stat([['Moves', s.moves], ['Best', L.best]]);
      grid.innerHTML = ''; var bad = E.conflicts(s);
      s.cells.forEach(function (v, i) {
        var P = Postie.PIECES[v - 1];
        grid.appendChild(h('div', { class: 'cell', 'data-i': i }, [v ? h('div', {
          style: 'width:80%;height:80%;border-radius:50%;display:grid;place-items:center;background:' + P.c + ';box-shadow:0 0 0 ' + (bad[i] ? '3px var(--bad)' : '1.5px var(--txt)'),
          html: Postie.shape(P.s, 'none', '') }) : null]));
      });
      grid.querySelectorAll('svg.pc').forEach(function (e) { e.style.stroke = '#fff'; e.style.strokeWidth = 2; });
    }
    draw();
  }
});
