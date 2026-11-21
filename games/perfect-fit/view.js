/* Perfect Fit — screen. Gestures: tap a number; tap or drag across builder squares to draw the piece (drag over drawn
   squares to erase them); drag the finished piece up onto the board. One Undo per attempt (as in stazzi).
   Piece sizes get Postie.PIECES slots (colour + shape) and always show their number: colour is never the only channel. */
(function () {
  var SLOT = { 2: 5, 3: 4, 4: 2, 5: 1, 6: 0, 7: 3 }; /* size -> Postie.PIECES index: 2 ink, 3 sand, 4 sage, 5 blue, 6 apricot, 7 butter */
  function P(size) { return Postie.PIECES[SLOT[size]]; }
  var WHY = { edge: 'Keep the whole piece on the board.', taken: 'That space is already filled.', clue: null,
    pair: 'Cover both dots with the same piece.', seam: 'Keep a different piece on each side of the seam.' };
  Postie.tr({
    '<b>Tap a number</b>, then draw a piece of that many touching squares in the small builder. <b>Drag it onto the board</b> — no turning. Use every number to fill the board. A number on the board needs a piece of that size; two dots go in one piece; a seam splits two pieces. One Undo per try.':
      '<b>Нажми на число</b> и нарисуй в маленьком конструкторе фигуру из стольких же клеток, соединённых сторонами. <b>Перетащи её на поле</b> — поворачивать нельзя. Используй все числа, чтобы заполнить поле. Число на поле требует фигуру такого же размера; две точки — внутри одной фигуры; шов разделяет две разные фигуры. Отменить ход можно один раз за попытку.',
    'Keep the whole piece on the board.': 'Фигура должна целиком лежать на поле.',
    'That space is already filled.': 'Это место уже занято.',
    'Cover both dots with the same piece.': 'Накрой обе точки одной фигурой.',
    'Keep a different piece on each side of the seam.': 'По разные стороны шва должны быть разные фигуры.',
    'This number needs a piece of its size.': 'Этому числу нужна фигура такого же размера.',
    'Doesn’t fit: use empty board cells.': 'Не помещается: клади фигуру на пустые клетки поля.',
    'Pick a number first': 'Сначала выбери число',
    'Pick a number': 'Выбери число',
    '<b>Drag your piece</b> onto the board': '<b>Перетащи фигуру</b> на поле',
    'Squares must touch along their sides': 'Клетки должны соприкасаться сторонами',
    'Draw <b>{n}</b> squares': 'Нарисуй фигуру из <b>{n}</b> клеток',
    '<b>Stuck:</b> the rest no longer fits.': '<b>Тупик:</b> оставшееся уже не помещается.',
    'Restart to try again.': 'Начни заново.',
    'Undo or restart.': 'Отмени ход или начни заново.',
    'Number {n}': 'Число {n}',
    'Clear': 'Очистить',
    'Undo': 'Отменить',
    'Pieces': 'Фигуры',
    'Filled': 'Заполнено',
    'Perfect fit · {n} piece': 'Всё впритык · фигур: {n}',
    'Perfect fit · {n} pieces': 'Всё впритык · фигур: {n}'
  });
  var css = '.pf-board{position:relative;margin:6px auto 4px;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '.pf-c{position:absolute;border-radius:var(--r8);border:1.5px solid var(--line);background:var(--card);box-sizing:border-box}' +
    '.pf-c.ok{background:color-mix(in srgb,var(--aim) 55%,var(--card));border-color:var(--ink)}' +
    '.pf-c.no{background:color-mix(in srgb,var(--bad) 22%,var(--card));border-color:var(--bad)}' +
    '.pf-c.stuck{border-color:var(--bad);background:color-mix(in srgb,var(--bad) 14%,var(--card))}' +
    '.pf-p{position:absolute;box-sizing:border-box;display:grid;place-items:center;color:#fff;font:800 15px var(--font)}' +
    '.pf-dot{position:absolute;border-radius:50%;background:var(--ink);pointer-events:none}.pf-dot.on{background:#fff;box-shadow:0 0 0 1.5px var(--txt)}' +
    '.pf-clue{position:absolute;display:grid;place-items:center;border-radius:50%;border:1.5px solid var(--txt);background:var(--card);color:var(--txt);font:800 13px var(--font);pointer-events:none}' +
    '.pf-seam{position:absolute;background:var(--txt);border-radius:3px;pointer-events:none}' +
    '.pf-tray{display:flex;gap:18px;justify-content:center;align-items:flex-start;margin-top:6px}' +
    '.pf-b{display:grid;grid-template-columns:repeat(4,36px);grid-auto-rows:36px;gap:4px;touch-action:none;user-select:none;-webkit-user-select:none;padding:6px;border-radius:var(--r12);border:1.5px dashed var(--line)}' +
    '.pf-b.off{opacity:.5}.pf-b .cell{border-radius:var(--r8);aspect-ratio:auto}.pf-b .cell.void{visibility:hidden}' +
    '.pf-b.ready{border:1.5px solid var(--ink)}' +
    '.pf-nums{display:grid;grid-template-columns:repeat(3,48px);gap:8px}' +
    '.pf-n{height:48px;border-radius:var(--r12);border:1.5px solid var(--line);background:var(--card);font:800 19px var(--font);color:var(--txt);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:2px;padding:0}' +
    '.pf-n svg.pc{width:15px;height:15px;stroke-width:2.4}.pf-n.on{border-color:var(--ink);box-shadow:0 0 0 1.5px var(--ink);transform:translateY(-3px)}.pf-n.used{opacity:.3}' +
    '.pf-ghost{position:fixed;left:0;top:0;pointer-events:none;z-index:5;opacity:.85}' +
    '.pf-msg b{color:var(--txt)}.pf-cnt{display:inline-block;margin-left:8px;font-weight:700;color:var(--mut)}.pf-cnt.full{color:var(--ink)}';
  Postie.register({
    id: 'perfect-fit', name: 'Perfect Fit',
    rules: '<b>Tap a number</b>, then draw a piece of that many touching squares in the small builder. <b>Drag it onto the board</b> — no turning. Use every number to fill the board. A number on the board needs a piece of that size; two dots go in one piece; a seam splits two pieces. One Undo per try.',
    mount: function (root, ctx) {
      if (!document.getElementById('pf-css')) document.head.appendChild(Postie.h('style', { id: 'pf-css', html: css }));
      var h = Postie.h, E = ctx.engine, L = ctx.level, s = E.fresh(L), prev = null, undoUsed = false;
      var sel = -1, built = [], note = '', gesture = null, drag = null;
      var rows = L.map.length, cols = Math.max.apply(null, L.map.map(function (r) { return r.length; }));
      var stat = h('div', { class: 'stat' }), board = h('div', { class: 'pf-board' }), msg = h('div', { class: 'msg pf-msg' });
      var bld = h('div', { class: 'pf-b' }), nums = h('div', { class: 'pf-nums' }), ctr = h('div', { class: 'row', style: 'margin:10px 0 0' });
      root.appendChild(stat); root.appendChild(board); root.appendChild(msg);
      root.appendChild(h('div', { class: 'pf-tray' }, [bld, h('div', null, [nums, ctr])]));
      var W = Math.min(root.clientWidth || 358, 420), S = Math.max(26, Math.min(48, Math.floor(W / cols), Math.floor(330 / rows))), G = 3;
      board.style.width = cols * S + 'px'; board.style.height = rows * S + 'px';

      function k(r, c) { return r + ',' + c; }
      function need() { return sel >= 0 ? s.nums[sel] : 0; }
      function ready() { return sel >= 0 && E.isPieceReady(built, need()); }
      function isOn(r, c) { return built.some(function (p) { return p[0] === r && p[1] === c; }); }

      /* ---- board ---- */
      var cellEl = {};
      function drawBoard(aim) {
        board.innerHTML = ''; cellEl = {};
        var owner = {}; s.placed.forEach(function (pl, n) { pl.cells.forEach(function (p) { owner[k(p[0], p[1])] = n; }); });
        for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
          if (s.board[r][c] === undefined || s.board[r][c] === -1) continue;
          var el = h('div', { class: 'pf-c', style: 'left:' + (c * S + G / 2) + 'px;top:' + (r * S + G / 2) + 'px;width:' + (S - G) + 'px;height:' + (S - G) + 'px' });
          if (s.status === 'failed' && s.board[r][c] === 0) el.classList.add('stuck');
          if (aim && aim.cells[k(r, c)]) el.classList.add(aim.ok ? 'ok' : 'no');
          cellEl[k(r, c)] = el; board.appendChild(el);
        }
        s.placed.forEach(function (pl, n) {
          var size = pl.cells.length, col = P(size).c, first = pl.cells.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; })[0];
          pl.cells.forEach(function (p) {
            var r = p[0], c = p[1], up = owner[k(r - 1, c)] === n, dn = owner[k(r + 1, c)] === n, lf = owner[k(r, c - 1)] === n, rt = owner[k(r, c + 1)] === n;
            var t = up ? 0 : G / 2, b = dn ? 0 : G / 2, l = lf ? 0 : G / 2, rr = rt ? 0 : G / 2, R = 7;
            var rad = [!up && !lf ? R : 0, !up && !rt ? R : 0, !dn && !rt ? R : 0, !dn && !lf ? R : 0].join('px ') + 'px';
            board.appendChild(h('div', { class: 'pf-p', style: 'left:' + (c * S + l) + 'px;top:' + (r * S + t) + 'px;width:' + (S - l - rr) + 'px;height:' + (S - t - b) + 'px;background:' + col + ';border-radius:' + rad +
              (size !== 2 ? ';color:var(--txt)' : '') }, [p === first ? String(size) : '']));   // the number is ink on every tone; white only on the ink piece
          });
        });
        (L.seams || []).forEach(function (q) {
          var vertical = q[0] === q[2], len = S * 0.72;
          var x = vertical ? Math.max(q[1], q[3]) * S - 2.5 : Math.min(q[1], q[3]) * S + (S - len) / 2, y = vertical ? q[0] * S + (S - len) / 2 : Math.max(q[0], q[2]) * S - 2.5;
          board.appendChild(h('div', { class: 'pf-seam', style: 'left:' + x + 'px;top:' + y + 'px;width:' + (vertical ? 5 : len) + 'px;height:' + (vertical ? len : 5) + 'px' }));
        });
        (L.pairs || []).forEach(function (q) {
          [[q[0], q[1]], [q[2], q[3]]].forEach(function (p) {
            var d = Math.round(S * 0.24), filled = s.board[p[0]][p[1]] > 0;
            board.appendChild(h('div', { class: 'pf-dot' + (filled ? ' on' : ''), style: 'width:' + d + 'px;height:' + d + 'px;left:' + (p[1] * S + (S - d) / 2) + 'px;top:' + (p[0] * S + (S - d) / 2) + 'px' }));
          });
        });
        (L.clues || []).forEach(function (q) {
          var d = Math.round(S * 0.58);
          board.appendChild(h('div', { class: 'pf-clue', style: 'width:' + d + 'px;height:' + d + 'px;left:' + (q[1] * S + (S - d) / 2) + 'px;top:' + (q[0] * S + (S - d) / 2) + 'px' }, [String(q[2])]));
        });
      }

      /* ---- tray ---- */
      var bcells = [];
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
        var open = !L.mask || L.mask[r][c] === '.';
        var el = h('div', { class: 'cell' + (open ? '' : ' void'), 'data-r': r, 'data-c': c });
        bcells.push(el); bld.appendChild(el);
      }
      function drawTray() {
        var n = need(), col = sel >= 0 ? P(n) : null, rd = ready();
        bld.classList.toggle('off', sel < 0 || s.status !== 'playing'); bld.classList.toggle('ready', rd);
        bcells.forEach(function (el) {
          var on = isOn(+el.dataset.r, +el.dataset.c);
          el.style.background = on ? col.c : ''; el.style.borderColor = on ? col.c : '';
          el.innerHTML = on ? Postie.shape(col.s, 'none') : '';
          var sv = el.querySelector('svg'); if (sv) { sv.style.stroke = col.k === 'ink' ? '#fff' : 'var(--txt)'; sv.style.strokeWidth = 2.2; }
        });
        nums.innerHTML = '';
        s.nums.forEach(function (v, i) {
          nums.appendChild(h('button', { class: 'pf-n' + (sel === i ? ' on' : '') + (s.used[i] ? ' used' : ''), 'data-n': i, 'aria-label': Postie.t('Number {n}', { n: v }), disabled: s.used[i] ? 'disabled' : null,
            onclick: function () { pick(i); }, html: '<span>' + v + '</span>' + Postie.shape(P(v).s, P(v).c) }));
        });
        ctr.innerHTML = '';
        ctr.appendChild(Postie.btn('Clear', function () { built = []; note = ''; drawTray(); }, 'o s'));
        var u = Postie.btn('Undo', undo, 'o s'); if (undoUsed || !prev) u.disabled = true; ctr.appendChild(u);
        var placedN = s.placed.length, total = s.nums.length;
        var filled = s.placed.reduce(function (a, p) { return a + p.cells.length; }, 0), all = s.nums.reduce(function (a, b) { return a + b; }, 0);
        stat.innerHTML = Postie.stat([['Pieces', placedN + ' / ' + total], ['Filled', filled + ' / ' + all], ['Undo', undoUsed ? 0 : 1]]);
        var cnt = sel >= 0 ? '<span class="pf-cnt' + (built.length === n ? ' full' : '') + '">' + built.length + '/' + n + '</span>' : '';
        msg.className = 'msg pf-msg' + (s.status === 'failed' ? ' bad' : '');
        msg.innerHTML = s.status === 'failed' ? Postie.t('<b>Stuck:</b> the rest no longer fits.') + ' ' + Postie.t(undoUsed ? 'Restart to try again.' : 'Undo or restart.')
          : note ? Postie.t(note) : sel < 0 ? Postie.t('Pick a number') : rd ? Postie.t('<b>Drag your piece</b> onto the board') + cnt
          : built.length === n ? Postie.t('Squares must touch along their sides') + cnt : Postie.t('Draw <b>{n}</b> squares', { n: n }) + cnt;
      }
      function pick(i) {
        if (s.status !== 'playing' || s.used[i]) return;
        if (sel === i) { sel = -1; built = []; }
        else { if (sel < 0 || s.nums[sel] !== s.nums[i]) built = []; sel = i; }
        note = ''; drawTray();
      }
      function toggle(r, c, erase) {
        if (erase) built = built.filter(function (p) { return p[0] !== r || p[1] !== c; });
        else if (!isOn(r, c) && built.length < need()) built.push([r, c]);
        note = '';
      }
      function undo() {
        if (undoUsed || !prev) return;
        s = prev; prev = null; undoUsed = true; sel = -1; built = []; note = ''; drawBoard(); drawTray();
      }

      /* ---- gestures on the builder: paint / erase / drag the ready piece ---- */
      function bcellAt(x, y) { var c = Postie.cellAt(bld, x, y); return c && !c.el.classList.contains('void') ? c : null; }
      bld.addEventListener('pointerdown', function (e) {
        if (s.status !== 'playing' || drag) return;
        var c = bcellAt(e.clientX, e.clientY);
        if (!c) return;
        if (sel < 0) { note = 'Pick a number first'; drawTray(); return; }
        var has = isOn(c.r, c.c), mode = ready() && has ? 'pending' : has ? 'erase' : 'paint';
        gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, r: c.r, c: c.c, el: c.el, mode: mode, seen: {} };
        gesture.seen[k(c.r, c.c)] = 1;
        try { bld.setPointerCapture(e.pointerId); } catch (x) {}
        e.preventDefault();
        if (mode !== 'pending') { toggle(c.r, c.c, mode === 'erase'); drawTray(); }
      });
      bld.addEventListener('pointermove', function (e) {
        var g = gesture; if (!g || e.pointerId !== g.id) return;
        if (g.mode === 'pending' && Math.hypot(e.clientX - g.x, e.clientY - g.y) >= 8) { g.mode = 'drag'; startDrag(g); }
        if (g.mode === 'drag') return moveDrag(e.clientX, e.clientY);
        if (g.mode === 'paint' || g.mode === 'erase') {
          var c = bcellAt(e.clientX, e.clientY);
          if (c && !g.seen[k(c.r, c.c)]) { g.seen[k(c.r, c.c)] = 1; toggle(c.r, c.c, g.mode === 'erase'); drawTray(); }
        }
      });
      bld.addEventListener('pointerup', function (e) { var g = gesture; if (!g || e.pointerId !== g.id) return; gesture = null; if (g.mode === 'drag') { moveDrag(e.clientX, e.clientY); drop(); } });
      bld.addEventListener('pointercancel', function () { gesture = null; if (drag) { drag.ghost.remove(); drag = null; drawBoard(); } });

      function startDrag(g) {
        var shape = E.normalize(built), r0 = Math.min.apply(null, built.map(function (p) { return p[0]; })), c0 = Math.min.apply(null, built.map(function (p) { return p[1]; }));
        var src = g.el.getBoundingClientRect(), fx = Math.max(0, Math.min(1, (g.x - src.left) / src.width)), fy = Math.max(0, Math.min(1, (g.y - src.top) / src.height));
        var col = P(need());
        var ghost = h('div', { class: 'pf-ghost' });
        shape.forEach(function (p) { ghost.appendChild(h('div', { style: 'position:absolute;left:' + (p[1] * S + G / 2) + 'px;top:' + (p[0] * S + G / 2) + 'px;width:' + (S - G) + 'px;height:' + (S - G) + 'px;border-radius:7px;background:' + col.c + ';box-shadow:0 0 0 1.5px var(--txt)' })); });
        document.body.appendChild(ghost);
        /* the piece rides above the finger (1.2 cells) so it stays visible */
        drag = { shape: shape, ax: ((g.c - c0) + fx) * S, ay: ((g.r - r0) + fy) * S, lift: S * 1.2, ghost: ghost, target: null, why: '' };
        board.style.setProperty('--aim', col.c);
      }
      function moveDrag(x, y) {
        if (!drag) return;
        var gx = x - drag.ax, gy = y - drag.lift - drag.ay;
        drag.ghost.style.transform = 'translate(' + gx + 'px,' + gy + 'px)';
        var b = board.getBoundingClientRect(), row = Math.round((gy - b.top) / S), col = Math.round((gx - b.left) / S);
        var cells = drag.shape.map(function (p) { return [p[0] + row, p[1] + col]; });
        var why = E.problem(s, cells), over = cells.some(function (p) { return s.board[p[0]] && s.board[p[0]][p[1]] !== undefined && s.board[p[0]][p[1]] !== -1; });
        drag.target = why === '' ? cells : null;
        drag.why = why === 'clue' ? 'This number needs a piece of its size.' : WHY[why] || '';
        var aim = { cells: {}, ok: why === '' };
        if (over) cells.forEach(function (p) { aim.cells[k(p[0], p[1])] = 1; });
        var sig = row + ':' + col; if (sig !== drag.sig) { drag.sig = sig; drawBoard(aim); }
      }
      function drop() {
        var d = drag; drag = null; if (!d) return; d.ghost.remove();
        if (d.target) {
          var before = E.clone(s);
          if (E.place(s, sel, d.target)) {
            prev = undoUsed ? null : before; sel = -1; built = []; note = '';
            drawBoard(); drawTray();
            if (E.won(s)) ctx.win(Postie.t(s.placed.length === 1 ? 'Perfect fit · {n} piece' : 'Perfect fit · {n} pieces', { n: s.placed.length }));
            else if (E.lost(s)) Postie.shake(board);
            return;
          }
        }
        note = d.why || 'Doesn’t fit: use empty board cells.'; drawBoard(); drawTray();
      }
      drawBoard(); drawTray();
    }
  });
})();
