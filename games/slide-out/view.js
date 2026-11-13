/* Slide Out — screen. Gesture: swipe a tile (drag from a tile and release ≥18px away; the longer axis wins). Undo steps back one swipe. */
Postie.register({
  id: 'slide-out', name: 'Slide Out',
  rules: '<b>Swipe a tile</b> into an empty cell next to it. A tile that reaches the edge cell of a <b>waiting goal</b> of its colour and shape slides out. ' +
    'Every swipe takes <b>1</b> from each waiting goal — serve each one before its number reaches 0. Spare tiles may stay on the board.',
  mount: function (root, ctx) {
    var h = Postie.h, E = ctx.engine, L = ctx.level, N = E.N, s = E.fresh(L), hist = [], last = null;
    if (!document.getElementById('so-css')) document.head.appendChild(h('style', { id: 'so-css', html:
      '.so-goals{display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap;margin:4px 0 2px}' +
      '.so-g{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;border:1.5px solid var(--line);background:var(--sand)}' +
      '.so-g svg{width:70%;height:70%}.so-g.done{background:var(--card);border-color:var(--sage);color:var(--ink)}.so-g.done svg.ic{stroke-width:2.6}' +
      '.so-wrap{position:relative;max-width:330px;margin:10px auto 6px;padding:40px}' +
      '.so-wrap .grid{margin:0;gap:5px}' +
      '.so-goal{position:absolute;width:40px;height:40px;transform:translate(-50%,-50%);border-radius:50%;display:grid;place-items:center;pointer-events:none;transition:transform .15s}' +
      '.so-goal svg.pc{width:64%;height:64%;stroke:#fff;stroke-width:2.2}' +
      '.so-goal b{position:absolute;right:-7px;top:-7px;min-width:24px;height:24px;border-radius:12px;background:var(--card);border:1.5px solid var(--txt);font:700 14px/21px var(--font);text-align:center;padding:0 4px;color:var(--txt)}' +
      '.so-goal.low b{border-color:var(--bad);color:var(--bad);box-shadow:0 0 0 2px var(--bad)}' +
      '.so-exit{box-shadow:inset 0 0 0 3px var(--gc)}' +
      '.so-wrap .cell{touch-action:none}.so-wrap .cell.lift{transform:scale(1.06)}' +
      '.so-out{animation:so-out .35s ease-out}@keyframes so-out{0%{background:var(--gc)}100%{background:var(--card)}}' +
      '@media (prefers-reduced-motion:reduce){.so-out{animation:none}}' }));
    var stat = h('div', { class: 'stat' }), goalsRow = h('div', { class: 'so-goals', 'aria-label': 'Goals in order' }), msg = h('div', { class: 'msg' });
    var wrap = h('div', { class: 'so-wrap' }), grid = h('div', { class: 'grid', style: 'grid-template-columns:repeat(' + N + ',1fr)' });
    var undoBtn = Postie.btn('Undo', undo, 'o s');
    wrap.appendChild(grid);
    [stat, goalsRow, wrap, msg, h('div', { class: 'row' }, [undoBtn])].forEach(function (e) { root.appendChild(e); });
    function P(col) { return Postie.PIECES[col - 1]; }
    function undo() { if (!hist.length) return; s = hist.pop(); last = null; msg.className = 'msg'; msg.textContent = ''; draw(); }
    var DIR = { left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0] };
    function swipe(i, dir, cell) {
      if (s.status !== 'playing') return;
      var prev = JSON.parse(JSON.stringify(s)), servedBefore = s.served;
      if (!E.move(s, i, dir)) { Postie.shake(cell); msg.className = 'msg'; msg.textContent = 'Tiles move only into an empty cell next to them.'; return; }
      hist.push(prev); msg.className = 'msg'; msg.textContent = '';
      var j = E.target(i, dir);
      last = { to: j, out: s.served > servedBefore ? prev.goals.filter(function (g, k) { return g.status === 'waiting' && s.goals[k].status === 'served'; }) : [] };
      draw();
      if (s.status === 'won') ctx.win('All ' + L.goals.length + ' goals served in ' + s.moves + ' moves');
      else if (s.status === 'failed') { msg.className = 'msg bad'; msg.textContent = 'A goal ran out of moves. Undo the last swipe or restart.'; }
    }
    var from = null;
    Postie.drag(grid, {
      start: function (c, e) { if (s.status !== 'playing' || !s.cells[c.i]) return false; from = { i: c.i, el: c.el, x: e.clientX, y: e.clientY }; c.el.classList.add('lift'); },
      end: function (c, e) {
        var f = from; from = null; if (!f) return; f.el.classList.remove('lift');
        var dx = e.clientX - f.x, dy = e.clientY - f.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return; /* a tap does nothing (stazzi §4) */
        swipe(f.i, Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'), f.el);
      },
      cancel: function () { if (from) from.el.classList.remove('lift'); from = null; }
    });
    function draw() {
      var left = L.goals.length - s.served;
      stat.innerHTML = Postie.stat([['Moves', s.moves], ['Goals left', left]]);
      undoBtn.disabled = !hist.length;
      goalsRow.innerHTML = '';
      s.goals.forEach(function (g) {
        var p = P(g.color);
        goalsRow.appendChild(g.status === 'served' ? h('span', { class: 'so-g done', html: Postie.icon('check') })
          : g.status === 'queued' ? h('span', { class: 'so-g', title: 'Comes later' })
          : h('span', { class: 'so-g c-' + p.k, style: 'background:var(--' + p.k + ');border-color:var(--' + p.k + ')', html: Postie.shape(p.s, 'none') }));
      });
      grid.innerHTML = ''; wrap.querySelectorAll('.so-goal').forEach(function (e) { e.remove(); });
      var exits = {};
      s.goals.forEach(function (g) { if (g.status === 'waiting' || g.status === 'left') exits[g.cell] = g; });
      s.cells.forEach(function (v, i) {
        var p = v ? P(v) : null, g = exits[i];
        var cell = h('div', { class: 'cell' + (p ? ' c-' + p.k : '') + (g ? ' so-exit' : ''), 'data-i': i, html: p ? Postie.shape(p.s, 'none') : '' });
        if (g) cell.style.setProperty('--gc', 'var(--' + (g.status === 'left' ? 'bad' : P(g.color).k) + ')');
        if (last && last.out.some(function (o) { return o.cell === i; })) { cell.style.setProperty('--gc', 'var(--' + P(last.out[0].color).k + ')'); cell.classList.add('so-out'); }
        else if (last && i === last.to) Postie.pop(cell);
        grid.appendChild(cell);
      });
      s.goals.forEach(function (g) {
        if (g.status !== 'waiting' && g.status !== 'left') return;
        var r = Math.floor(g.cell / N) + .5, c = g.cell % N + .5, p = P(g.color);
        if (g.side === 'bottom') r = N + .62; if (g.side === 'top') r = -.62; if (g.side === 'left') c = -.62; if (g.side === 'right') c = N + .62;
        wrap.appendChild(h('div', { class: 'so-goal c-' + p.k + (g.countdown <= 2 ? ' low' : ''), 'aria-label': 'Goal, ' + g.countdown + ' moves left',
          style: 'left:calc(40px + (100% - 80px) * ' + (c / N) + ');top:calc(40px + (100% - 80px) * ' + (r / N) + ')' + (g.status === 'left' ? ';opacity:.4' : ''),
          html: Postie.shape(p.s, 'none') + '<b>' + Math.max(0, g.countdown) + '</b>' }));
      });
    }
    draw();
  }
});
