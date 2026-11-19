/* Parcels — screen. Gesture: drag a frame from one cell to the opposite corner and let go (one finger). Undo takes back the last parcel
   (author 2026-11-19, roadmap step 14; stazzi had none); a dead end shows the stuck bar with Restart, and Undo still works there. One rules text for every level: numbers, dots, or both (author 2026-11-19). */
(function () {
  var RULES = '<b>Drag a frame</b> over cubes and let go. A parcel is either <b>one number</b> with exactly that many cubes (a 6 can be 1×6, 2×3, 3×2 or 6×1), or <b>one black and one white dot</b> with any cubes around them. The parcel ships and everything above it <b>falls</b>. Ship every cube.';
  /* own colours (author 2026-11-19: no mustard): plain cube — light kraft, number — blue, dots — ink and paper in both looks */
  var CSS = '' +
    '.pc-board{--pc-cube:#E4D9C3;--pc-edge:#D3C6AB;--pc-num:#4E7BAB;--pc-numtx:#FFFCF5;--pc-blk:#1E2A44;--pc-wht:#FFFCF5}' +
    'html[data-look=night] .pc-board{--pc-cube:#3A4764;--pc-edge:#4A5878;--pc-num:#7AA7E0;--pc-numtx:#131926;--pc-blk:#0E1420;--pc-wht:#ECE5D5}' +
    '.pc-board .cell.cube{background:var(--pc-cube);border-color:var(--pc-edge)}' +
    '.pc-board .cell.cube.num{background:var(--pc-num);border-color:var(--pc-num);color:var(--pc-numtx)}' +
    '.pc-board{position:relative;margin:12px auto;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '.pc-board .grid{margin:0}' +
    '.pc-board .cell{border-radius:var(--r8)}' +
    '.pc-board .cell.gap{background:transparent;border-style:dashed;opacity:.6}' +
    '.pc-board .cell.num{font:700 22px var(--font)}' +
    '.pc-dot{width:46%;height:46%;border-radius:50%;background:var(--pc-blk)}' +
    '.pc-dot.w{background:var(--pc-wht);box-shadow:inset 0 0 0 3px var(--pc-blk)}' +
    '.pc-frame{position:absolute;border:3px dashed var(--mut);border-radius:var(--r12);pointer-events:none;display:none}' +
    '.pc-frame.ok{border-style:solid;border-color:var(--ink)}' +
    '.pc-frame .badge{left:100%;top:0}' +
    '.pc-box{position:absolute;background:var(--pc-cube);border:2px solid var(--txt);border-radius:var(--r12);pointer-events:none}';
  function css() { if (document.getElementById('pc-css')) return; var s = document.createElement('style'); s.id = 'pc-css'; s.textContent = CSS; document.head.appendChild(s); }
  var still = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  Postie.register({
    id: 'parcels', name: 'Parcels', rules: RULES,
    /* level 0 (author 2026-11-19): ship the 4 first and watch the 2 fall, then the 2, then the 3 */
    tutorial: { w: 3, h: 3, rows: ['..2', '3..', '.4.'], solution: [[1, 1, 2, 2], [2, 1, 2, 2], [0, 0, 2, 0]] },
    /* "?": the hand plays these by itself */
    demo: [
      { say: 'Frame <b>one number</b> with exactly that many cubes. Everything above <b>falls</b>.', level: { w: 3, h: 3, rows: ['..2', '3..', '.4.'], solution: [[1, 1, 2, 2], [2, 1, 2, 2], [0, 0, 2, 0]] } },
      { say: 'Or frame <b>one black and one white dot</b> — any size.', level: { w: 3, h: 3, rows: ['B..', '..W', '3..'], solution: [[2, 0, 2, 2], [1, 0, 2, 2]] } },
      { say: 'Ship <b>every cube</b>.', level: { w: 4, h: 2, rows: ['W..B', '..4.'], solution: [[1, 0, 1, 3], [1, 0, 1, 3]] } }
    ],
    /* a move = a frame [r0, c0, r1, c1]; the gesture = drag from one corner cell to the other */
    gesture: function (root, f) {
      function mid(r, c) { var e = root.querySelector('.pc-board .cell[data-r="' + r + '"][data-c="' + c + '"]'); if (!e) return null; var b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }
      var a = mid(f[0], f[1]), b = mid(f[2], f[3]); return a && b ? [a, b] : null;
    },
    mount: function (root, ctx) {
      css();
      var h = Postie.h, E = ctx.engine, L = ctx.level, s = E.fresh(L), busy = false;
      var stat = h('div', { class: 'stat' }), msg = h('div', { class: 'msg' });
      var gap = 5, cellMax = L.w <= 4 ? 70 : 58;                 // small boards (level 0, the first levels) get bigger cubes
      var grid = h('div', { class: 'grid', style: 'grid-template-columns:repeat(' + L.w + ',1fr);gap:' + gap + 'px' });
      var fr = h('div', { class: 'pc-frame' }), badge = h('span', { class: 'badge' }); fr.appendChild(badge);
      var board = h('div', { class: 'pc-board', style: 'max-width:' + (L.w * cellMax + (L.w - 1) * gap) + 'px' }, [grid, fr]);
      var retry = Postie.btn('Retry', reset, 's'); retry.style.display = 'none';
      var hist = [], undoB = Postie.btn('Undo', undo, 'o s');
      root.appendChild(stat); root.appendChild(board); root.appendChild(msg); if (!ctx.demo) root.appendChild(h('div', { class: 'row' }, [undoB, retry]));

      function reset() { s = E.fresh(L); hist = []; busy = false; retry.style.display = 'none'; say(''); draw(); }
      function snap(x) { return { w: x.w, h: x.h, g: x.g.map(function (row) { return row.slice(); }), shipped: x.shipped, total: x.total, status: x.status }; }
      function undo() {
        if (busy || !hist.length || s.status === 'won') return;
        s = hist.pop(); retry.style.display = 'none'; say(''); draw();
        if (ctx.back) ctx.back();
      }
      function say(t, bad) { msg.className = 'msg' + (bad ? ' bad' : ''); msg.textContent = t; }

      /* geometry: cell under a point, clamped to the board edge (a finger off the board keeps the frame on the nearest edge cell) */
      function pitch() { var b = grid.getBoundingClientRect(); return { b: b, cw: (b.width + gap) / L.w, ch: (b.height + gap) / L.h }; }
      function cellAt(x, y, clamp) {
        var p = pitch(), c = Math.floor((x - p.b.left) / p.cw), r = Math.floor((y - p.b.top) / p.ch);
        if (!clamp && (r < 0 || c < 0 || r >= L.h || c >= L.w)) return null;
        return [Math.max(0, Math.min(L.h - 1, r)), Math.max(0, Math.min(L.w - 1, c))];
      }
      function place(el, f) {
        var p = pitch(), bb = board.getBoundingClientRect();
        el.style.left = (p.b.left - bb.left + f[1] * p.cw - 3) + 'px'; el.style.top = (p.b.top - bb.top + f[0] * p.ch - 3) + 'px';
        el.style.width = ((f[3] - f[1] + 1) * p.cw - gap + 6) + 'px'; el.style.height = ((f[2] - f[0] + 1) * p.ch - gap + 6) + 'px';
      }

      var a = null, b = null, pid = null;
      function cur() { return E.rect(a[0], a[1], b[0], b[1]); }
      function showFrame() {
        var f = cur(); place(fr, f); fr.style.display = 'block';
        fr.classList.toggle('ok', E.check(s, f[0], f[1], f[2], f[3]) === null);
        var n = 0;
        for (var r = f[0]; r <= f[2]; r++) for (var c = f[1]; c <= f[3]; c++) if (s.g[r][c]) n++;
        badge.textContent = n;
      }
      board.addEventListener('pointerdown', function (e) {
        if (pid !== null || busy || s.status !== 'playing') return;
        var c = cellAt(e.clientX, e.clientY, false); if (!c) return;
        pid = e.pointerId; a = c; b = c; try { board.setPointerCapture(pid); } catch (x) {}
        e.preventDefault(); say(''); showFrame();
      });
      board.addEventListener('pointermove', function (e) {
        if (e.pointerId !== pid) return;
        var c = cellAt(e.clientX, e.clientY, true); if (c[0] !== b[0] || c[1] !== b[1]) { b = c; showFrame(); }
      });
      board.addEventListener('pointerup', function (e) {
        if (e.pointerId !== pid) return;
        pid = null; b = cellAt(e.clientX, e.clientY, true); fr.style.display = 'none';
        var f = cur();
        if (f[0] === f[2] && f[1] === f[3]) return;               /* 1×1: just let go */
        ship(f);
      });
      board.addEventListener('pointercancel', function (e) { if (e.pointerId !== pid) return; pid = null; fr.style.display = 'none'; });

      function why(f, err) {
        if (err === 'gap') return 'Only cubes: a parcel has no empty cells.';
        if (err === 'mixed') return 'A number and dots never share a parcel.';
        if (err === 'empty') return 'A parcel needs one number, or one black and one white dot.';
        if (err === 'many_numbers') return 'Only one number per parcel.';
        if (err === 'wrong_size') {
          var num = 0; for (var r = f[0]; r <= f[2]; r++) for (var c = f[1]; c <= f[3]; c++) if (s.g[r][c].v > 0) num = s.g[r][c].v;
          return 'That frame holds ' + (f[2] - f[0] + 1) * (f[3] - f[1] + 1) + ' cubes — the number says ' + num + '.';
        }
        return 'Dots go in pairs: exactly one black and one white.';
      }

      function ship(f) {
        var err = E.check(s, f[0], f[1], f[2], f[3]);
        if (err) { Postie.shake(board); say(why(f, err)); return; }
        var box = h('div', { class: 'pc-box' }); place(box, f); board.appendChild(box);
        hist.push(snap(s));
        var res = E.frame(s, f[0], f[1], f[2], f[3]);
        if (ctx.moved) ctx.moved(f);
        busy = true;
        var p = pitch(), fallMs = 0;
        draw();
        if (!still && board.animate) {
          box.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-48px)', opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' });
          res.falls.forEach(function (fl) {
            var el = grid.querySelector('[data-id="' + fl.id + '"]'); if (!el) return;
            var d = fl.to - fl.from, ms = Math.min(80 * d, 320); fallMs = Math.max(fallMs, ms);
            el.animate([{ transform: 'translateY(' + (-d * p.ch) + 'px)' }, { transform: 'none' }], { duration: ms, delay: 120, easing: 'ease-in', fill: 'backwards' });
          });
        }
        setTimeout(function () {
          box.remove(); busy = false;
          if (s.status === 'won') ctx.win('All parcels shipped');
          else if (s.status === 'failed') { say('No frame fits. Undo or restart.', true); retry.style.display = ''; }
        }, still ? 60 : Math.max(280, 120 + fallMs));
      }

      function draw() {
        stat.innerHTML = Postie.stat([['Parcels', s.shipped + ' / ' + s.total]]);
        undoB.disabled = !hist.length || s.status === 'won';
        grid.innerHTML = '';
        for (var r = 0; r < L.h; r++) for (var c = 0; c < L.w; c++) {
          var x = s.g[r][c], cls = 'cell', kids = [], lab = 'empty';
          if (!x) cls += ' gap';
          else if (x.v === 'B' || x.v === 'W') { cls += ' cube'; kids.push(h('span', { class: 'pc-dot' + (x.v === 'W' ? ' w' : '') })); lab = x.v === 'W' ? 'cube with a white dot' : 'cube with a black dot'; }
          else if (x.v > 0) { cls += ' cube num'; kids.push(String(x.v)); lab = 'number ' + x.v; }
          else { cls += ' cube'; lab = 'cube'; }
          grid.appendChild(h('div', { class: cls, 'data-r': r, 'data-c': c, 'data-id': x ? x.id : null, 'aria-label': lab }, kids));
        }
      }
      draw();
    }
  });
})();
