/* Knock Through — screen. Bare mechanic (author 2026-11-19): the order on top, the plan below, Undo. No areas in m², money, shop or boosts.
   Gesture (author 2026-11-19): tap a room — it turns green; tap a neighbouring room — the wall between them goes, they become one.
   Tap the green room again — no choice; tap a room that is not a neighbour — it becomes the choice. */
(function () {
  var CSS = '' +
    '.kt-order{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:4px 0 14px}' +
    '.kt-chip{min-width:38px;height:38px;padding:0 8px;border-radius:19px;border:2px solid var(--ink);display:grid;place-items:center;font:700 18px var(--font);color:var(--ink)}' +
    '.kt-chip.ok{background:var(--ink);color:var(--on)}' +
    '.kt-board{display:grid;margin:0 auto;touch-action:none;user-select:none;-webkit-user-select:none;background:var(--line);' +
    '--kt-room:#DBD2C7;--kt-wall:#091C47}' +
    '.kt-cell{aspect-ratio:1;background:var(--kt-room);box-sizing:border-box;border:0 solid var(--kt-wall);display:grid;place-items:center;font:700 20px var(--font);color:var(--ink)}' +
    '.kt-cell.big{color:var(--bad)}' +
    '.kt-cell.sel{background:var(--sage);color:#fff}';
  function css() { if (document.getElementById('kt-css')) return; var s = document.createElement('style'); s.id = 'kt-css'; s.textContent = CSS; document.head.appendChild(s); }
  Postie.tr({
    '<b>Tap a room, then a room next to it</b>: the wall goes, they become one and their numbers add up. Make the rooms match the <b>order</b> on top exactly.':
      '<b>Нажми на комнату, потом на соседнюю</b>: стена исчезнет, комнаты станут одной, а их числа сложатся. Сделай так, чтобы комнаты в точности совпали с <b>заказом</b> сверху.',
    '<b>Tap a room, then its neighbour</b>: the wall goes, their numbers add up.': '<b>Нажми на комнату, потом на соседнюю</b>: стена исчезнет, числа сложатся.',
    'Make the rooms match the <b>order</b> on top.': 'Сделай комнаты такими, как в <b>заказе</b> сверху.',
    'Undo': 'Отменить',
    'Done': 'Готово',
    'A room is bigger than any number in the order. Undo or restart.': 'Одна комната больше любого числа в заказе. Отмени ход или начни заново.',
    'No wall left that fits the order. Undo or restart.': 'Какую стену ни снеси, комната выйдет больше любого числа в заказе. Отмени ход или начни заново.',
    'room of {n}': 'комната размером {n}'
  });
  function norm(m) { return (m[2] * 100 + m[3] < m[0] * 100 + m[1]) ? [m[2], m[3], m[0], m[1]] : m; }

  Postie.register({
    id: 'knock-through', name: 'Knock Through',
    rules: '<b>Tap a room, then a room next to it</b>: the wall goes, they become one and their numbers add up. Make the rooms match the <b>order</b> on top exactly.',
    /* level 0: 2 + 1 and 2 + 1 make the order 3 · 3 */
    tutorial: { w: 3, h: 2, rows: ['aab', 'cdb'], order: [3, 3], solution: [[0, 0, 1, 0], [1, 1, 1, 2]] },
    demo: [
      { say: '<b>Tap a room, then its neighbour</b>: the wall goes, their numbers add up.', level: { w: 3, h: 1, rows: ['abb'], order: [3], solution: [[0, 0, 0, 1]] } },
      { say: 'Make the rooms match the <b>order</b> on top.', level: { w: 3, h: 2, rows: ['aab', 'cdb'], order: [3, 3], solution: [[0, 0, 1, 0], [1, 1, 1, 2]] } }
    ],
    gesture: function (root, m) {
      function mid(r, c) { var e = root.querySelector('.kt-cell[data-r="' + r + '"][data-c="' + c + '"]'); if (!e) return null; var b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }
      var a = mid(m[0], m[1]), b = mid(m[2], m[3]); if (!a || !b) return null;
      var first = root.querySelector('.kt-cell[data-r="' + m[0] + '"][data-c="' + m[1] + '"]');
      return first && first.classList.contains('sel') ? [b] : [[a], [b]];   // tap, then tap (only the second if the first room is already chosen)
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

      function say(t, bad) { msg.className = 'msg' + (bad ? ' bad' : ''); msg.textContent = Postie.t(t); }
      function snap() { return { cell: s.cell.slice(), size: s.size.slice(), knocks: s.knocks, status: s.status }; }
      function undo() { if (!hist.length || s.status === 'won') return; sel = null; var x = hist.pop(); s.cell = x.cell; s.size = x.size; s.knocks = x.knocks; s.status = x.status; say(''); draw(); if (ctx.back) ctx.back(); }

      /* tap, tap: the first tap picks a room, a tap on a neighbouring room knocks the wall between them */
      var sel = null;                                                    // [r, c] of the cell tapped in the chosen room
      function cellAt(x, y) {
        var b = board.getBoundingClientRect(), c = Math.floor((x - b.left) / (b.width / L.w)), r = Math.floor((y - b.top) / (b.height / L.h));
        return r < 0 || c < 0 || r >= L.h || c >= L.w ? null : [r, c];
      }
      function wallBetween(ra, rb) {                                     // a pair of neighbouring cells, one in each room
        for (var r = 0; r < L.h; r++) for (var c = 0; c < L.w; c++) {
          if (E.roomAt(s, r, c) !== ra) continue;
          var n = [[r, c + 1], [r + 1, c], [r, c - 1], [r - 1, c]];
          for (var k = 0; k < 4; k++) { var q = n[k]; if (q[0] >= 0 && q[1] >= 0 && q[0] < L.h && q[1] < L.w && E.roomAt(s, q[0], q[1]) === rb) return [r, c, q[0], q[1]]; }
        }
        return null;
      }
      /* report the move as the level's sample has it (any wall between the same two rooms), so the hand can follow */
      function asSample(ra, rb, m) {
        var sol = L.solution || [];
        for (var i = 0; i < sol.length; i++) {
          var x = E.roomAt(s, sol[i][0], sol[i][1]), y = E.roomAt(s, sol[i][2], sol[i][3]);
          if ((x === ra && y === rb) || (x === rb && y === ra)) return sol[i];
        }
        return norm(m);
      }
      board.addEventListener('pointerdown', function (e) {
        if (s.status !== 'playing') return;
        var c = cellAt(e.clientX, e.clientY); if (!c) return;
        e.preventDefault(); say('');
        var room = E.roomAt(s, c[0], c[1]);
        if (sel && E.roomAt(s, sel[0], sel[1]) === room) { sel = null; draw(); return; }
        if (!sel) { sel = c; draw(); return; }
        var ra = E.roomAt(s, sel[0], sel[1]), m = wallBetween(ra, room);
        if (!m) { sel = c; draw(); return; }                             // not a neighbour: pick this one instead
        var rep = asSample(ra, room, m);
        hist.push(snap());
        if (!E.knock(s, m[0], m[1], m[2], m[3])) { hist.pop(); return; }
        sel = null; draw(); if (ctx.moved) ctx.moved(rep);
        if (s.status === 'won') ctx.win(Postie.t('Done'));
        else if (s.status === 'failed') say(Math.max.apply(null, s.size) > s.max ? 'A room is bigger than any number in the order. Undo or restart.' : 'No wall left that fits the order. Undo or restart.', true);
      });

      function draw() {
        undoB.disabled = !hist.length || s.status === 'won';
        order.innerHTML = '';
        var hit = E.matched(s);
        s.order.forEach(function (n, k) { order.appendChild(h('div', { class: 'kt-chip' + (hit[k] ? ' ok' : '') }, [String(n)])); });
        board.innerHTML = '';
        var shown = {}, selRoom = sel ? E.roomAt(s, sel[0], sel[1]) : -1;
        for (var r = 0; r < L.h; r++) for (var c = 0; c < L.w; c++) {
          var id = E.roomAt(s, r, c), w = function (rr, cc) { return rr < 0 || cc < 0 || rr >= L.h || cc >= L.w || E.roomAt(s, rr, cc) !== id; };
          var bw = [w(r - 1, c) ? 3 : 0, w(r, c + 1) ? 3 : 0, w(r + 1, c) ? 3 : 0, w(r, c - 1) ? 3 : 0];
          var label = shown[id] ? '' : String(s.size[id]); shown[id] = 1;
          board.appendChild(h('div', { class: 'kt-cell' + (id === selRoom ? ' sel' : '') + (label && s.size[id] > s.max ? ' big' : ''), 'data-r': r, 'data-c': c,
            style: 'border-width:' + bw.map(function (x) { return x / 2 + 'px'; }).join(' '), 'aria-label': label ? Postie.t('room of {n}', { n: label }) : null }, label ? [label] : []));
        }
      }
      draw();
    }
  });
})();
