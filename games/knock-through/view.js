/* Knock Through — screen. Bare mechanic (author 2026-11-19): the order on top, the plan below, Undo. No areas in m², money, shop or boosts.
   Gesture: swipe from a room across a wall into its neighbour — the wall goes, the rooms become one (one finger). */
(function () {
  var CSS = '' +
    '.kt-order{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:4px 0 14px}' +
    '.kt-chip{min-width:38px;height:38px;padding:0 8px;border-radius:19px;border:2px solid var(--ink);display:grid;place-items:center;font:700 18px var(--font);color:var(--ink)}' +
    '.kt-chip.ok{background:var(--ink);color:var(--on)}' +
    '.kt-board{display:grid;margin:0 auto;touch-action:none;user-select:none;-webkit-user-select:none;background:var(--line);' +
    '--kt-room:#E4D9C3;--kt-wall:#1E2A44}' +
    'html[data-look=night] .kt-board{--kt-room:#3A4764;--kt-wall:#ECE5D5}' +
    '.kt-cell{aspect-ratio:1;background:var(--kt-room);box-sizing:border-box;border:0 solid var(--kt-wall);display:grid;place-items:center;font:700 20px var(--font);color:var(--ink)}' +
    '.kt-cell.big{color:var(--bad)}';
  function css() { if (document.getElementById('kt-css')) return; var s = document.createElement('style'); s.id = 'kt-css'; s.textContent = CSS; document.head.appendChild(s); }
  function norm(m) { return (m[2] * 100 + m[3] < m[0] * 100 + m[1]) ? [m[2], m[3], m[0], m[1]] : m; }

  Postie.register({
    id: 'knock-through', name: 'Knock Through',
    rules: '<b>Swipe across a wall</b>: the two rooms become one and their numbers add up. Make the rooms match the <b>order</b> on top exactly.',
    /* level 0: 2 + 1 and 2 + 1 make the order 3 · 3 */
    tutorial: { w: 3, h: 2, rows: ['aab', 'cdb'], order: [3, 3], solution: [[0, 0, 1, 0], [1, 1, 1, 2]] },
    demo: [
      { say: '<b>Swipe across a wall</b>: two rooms become one, their numbers add up.', level: { w: 3, h: 1, rows: ['abb'], order: [3], solution: [[0, 0, 0, 1]] } },
      { say: 'Make the rooms match the <b>order</b> on top.', level: { w: 3, h: 2, rows: ['aab', 'cdb'], order: [3, 3], solution: [[0, 0, 1, 0], [1, 1, 1, 2]] } }
    ],
    gesture: function (root, m) {
      function mid(r, c) { var e = root.querySelector('.kt-cell[data-r="' + r + '"][data-c="' + c + '"]'); if (!e) return null; var b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }
      var a = mid(m[0], m[1]), b = mid(m[2], m[3]); return a && b ? [a, b] : null;
    },
    mount: function (root, ctx) {
      css();
      var h = Postie.h, E = ctx.engine, L = ctx.level, s = E.fresh(L), hist = [];
      var order = h('div', { class: 'kt-order' }), msg = h('div', { class: 'msg' });
      var cellPx = Math.min(64, Math.floor(340 / L.w));
      var board = h('div', { class: 'kt-board', style: 'grid-template-columns:repeat(' + L.w + ',1fr);max-width:' + (L.w * cellPx) + 'px' });
      var undoB = Postie.btn('Undo', undo, 'o s');
      root.appendChild(order); root.appendChild(board); root.appendChild(msg);
      if (!ctx.demo) root.appendChild(h('div', { class: 'row' }, [undoB]));

      function say(t, bad) { msg.className = 'msg' + (bad ? ' bad' : ''); msg.textContent = t; }
      function snap() { return { cell: s.cell.slice(), size: s.size.slice(), knocks: s.knocks, status: s.status }; }
      function undo() { if (!hist.length || s.status === 'won') return; var x = hist.pop(); s.cell = x.cell; s.size = x.size; s.knocks = x.knocks; s.status = x.status; say(''); draw(); if (ctx.back) ctx.back(); }

      /* the swipe: from a cell into a neighbouring cell of another room */
      var pid = null, from = null;
      function cellAt(x, y) {
        var b = board.getBoundingClientRect(), c = Math.floor((x - b.left) / (b.width / L.w)), r = Math.floor((y - b.top) / (b.height / L.h));
        return r < 0 || c < 0 || r >= L.h || c >= L.w ? null : [r, c];
      }
      board.addEventListener('pointerdown', function (e) {
        if (pid !== null || s.status !== 'playing') return;
        var c = cellAt(e.clientX, e.clientY); if (!c) return;
        pid = e.pointerId; from = c; try { board.setPointerCapture(pid); } catch (x) {} e.preventDefault(); say('');
      });
      board.addEventListener('pointermove', function (e) {
        if (e.pointerId !== pid) return;
        var c = cellAt(e.clientX, e.clientY); if (!c || (c[0] === from[0] && c[1] === from[1])) return;
        if (Math.abs(c[0] - from[0]) + Math.abs(c[1] - from[1]) !== 1) { from = c; return; }
        if (E.roomAt(s, c[0], c[1]) === E.roomAt(s, from[0], from[1])) { from = c; return; }
        var m = [from[0], from[1], c[0], c[1]]; pid = null;
        hist.push(snap());
        if (!E.knock(s, m[0], m[1], m[2], m[3])) { hist.pop(); return; }
        draw(); if (ctx.moved) ctx.moved(norm(m));
        if (s.status === 'won') ctx.win('Done');
        else if (s.status === 'failed') say(Math.max.apply(null, s.size) > s.max ? 'A room is bigger than any number in the order. Undo or restart.' : 'No wall left that fits the order. Undo or restart.', true);
      });
      function end(e) { if (e.pointerId === pid) pid = null; }
      board.addEventListener('pointerup', end); board.addEventListener('pointercancel', end);

      function draw() {
        undoB.disabled = !hist.length || s.status === 'won';
        order.innerHTML = '';
        var hit = E.matched(s);
        s.order.forEach(function (n, k) { order.appendChild(h('div', { class: 'kt-chip' + (hit[k] ? ' ok' : '') }, [String(n)])); });
        board.innerHTML = '';
        var shown = {};
        for (var r = 0; r < L.h; r++) for (var c = 0; c < L.w; c++) {
          var id = E.roomAt(s, r, c), w = function (rr, cc) { return rr < 0 || cc < 0 || rr >= L.h || cc >= L.w || E.roomAt(s, rr, cc) !== id; };
          var bw = [w(r - 1, c) ? 3 : 0, w(r, c + 1) ? 3 : 0, w(r + 1, c) ? 3 : 0, w(r, c - 1) ? 3 : 0];
          var label = shown[id] ? '' : String(s.size[id]); shown[id] = 1;
          board.appendChild(h('div', { class: 'kt-cell' + (label && s.size[id] > s.max ? ' big' : ''), 'data-r': r, 'data-c': c,
            style: 'border-width:' + bw.map(function (x) { return x / 2 + 'px'; }).join(' '), 'aria-label': label ? 'room of ' + label : null }, label ? [label] : []));
        }
      }
      draw();
    }
  });
})();
