/* Parcels — screen. Gesture: drag a frame from one cell to the opposite corner and let go (one finger). No undo (stazzi author decision):
   a dead end offers Retry (and the header restart). The rules text switches by the level's rule set ('numbers' / 'pairs'). */
(function () {
  var RULES = {
    numbers: '<b>Drag a frame</b> over the cubes around <b>one number</b>: it must hold exactly that many cubes (a 6 can be 1×6, 2×3, 3×2 or 6×1). The parcel ships and everything above it <b>falls</b>. Ship every cube.',
    pairs: '<b>New rules — pairs.</b> <b>Drag a frame</b> around exactly <b>one black and one white dot</b>; empty cells are fine, stones (dark tiles) are not. The framed cells vanish and everything above them <b>falls</b>, stones too. Clear every dot — stones stay.'
  };
  var CSS = '' +
    '.pc-board{position:relative;margin:12px auto;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '.pc-board .grid{margin:0}' +
    '.pc-board .cell{border-radius:var(--r8)}' +
    '.pc-board .cell.gap{background:transparent;border-style:dashed;opacity:.6}' +
    '.pc-board .cell.num{color:#fff;font:700 22px var(--font)}' +
    '.pc-dot{width:52%;height:52%;border-radius:50%;background:var(--ink)}' +
    '.pc-dot.w{background:var(--card);box-shadow:inset 0 0 0 3px var(--ink)}' +
    '.pc-frame{position:absolute;border:3px dashed var(--mut);border-radius:var(--r12);pointer-events:none;display:none}' +
    '.pc-frame.ok{border-style:solid;border-color:var(--ink)}' +
    '.pc-frame .badge{left:100%;top:0}' +
    '.pc-box{position:absolute;background:var(--butter);border:2px solid var(--txt);border-radius:var(--r12);pointer-events:none}';
  function css() { if (document.getElementById('pc-css')) return; var s = document.createElement('style'); s.id = 'pc-css'; s.textContent = CSS; document.head.appendChild(s); }
  var still = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  Postie.register({
    id: 'parcels', name: 'Parcels', rules: RULES.numbers,
    mount: function (root, ctx) {
      css();
      var h = Postie.h, E = ctx.engine, L = ctx.level, pairs = L.rules === 'pairs', s = E.fresh(L), busy = false;
      /* the shell shows one rules text per game: switch it to this level's rule set */
      var rb = root.parentNode && root.parentNode.querySelector('.rules');
      if (rb) {
        rb.innerHTML = RULES[L.rules];
        var seen = false; try { seen = localStorage.getItem('postie:rules:parcels:' + L.rules) === '1'; } catch (e) {}
        if (pairs && !seen) rb.style.display = '';
      }
      var stat = h('div', { class: 'stat' }), msg = h('div', { class: 'msg' });
      var gap = 5, cellMax = 58;
      var grid = h('div', { class: 'grid', style: 'grid-template-columns:repeat(' + L.w + ',1fr);gap:' + gap + 'px' });
      var fr = h('div', { class: 'pc-frame' }), badge = h('span', { class: 'badge' }); fr.appendChild(badge);
      var board = h('div', { class: 'pc-board', style: 'max-width:' + (L.w * cellMax + (L.w - 1) * gap) + 'px' }, [grid, fr]);
      var retry = Postie.btn('Retry', reset, 's'); retry.style.display = 'none';
      root.appendChild(stat); root.appendChild(board); root.appendChild(msg); root.appendChild(h('div', { class: 'row' }, [retry]));

      function reset() { s = E.fresh(L); busy = false; retry.style.display = 'none'; say(''); draw(); }
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
        if (pairs) n = (f[2] - f[0] + 1) * (f[3] - f[1] + 1);
        else for (var r = f[0]; r <= f[2]; r++) for (var c = f[1]; c <= f[3]; c++) if (s.g[r][c]) n++;
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
        if (err === 'no_number') return 'A parcel needs one number.';
        if (err === 'many_numbers') return 'Only one number per parcel.';
        if (err === 'wrong_size') {
          var num = 0; for (var r = f[0]; r <= f[2]; r++) for (var c = f[1]; c <= f[3]; c++) if (s.g[r][c].v > 0) num = s.g[r][c].v;
          return 'That frame holds ' + (f[2] - f[0] + 1) * (f[3] - f[1] + 1) + ' cubes — the number says ' + num + '.';
        }
        if (err === 'stone') return 'No stones inside a frame.';
        return 'A frame needs exactly one black and one white dot.';
      }

      function ship(f) {
        var err = E.check(s, f[0], f[1], f[2], f[3]);
        if (err) { Postie.shake(board); say(why(f, err)); return; }
        var box = h('div', { class: 'pc-box' }); place(box, f); board.appendChild(box);
        var res = E.frame(s, f[0], f[1], f[2], f[3]);
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
          if (s.status === 'won') ctx.win(pairs ? 'Every pair cleared' : 'All parcels shipped');
          else if (s.status === 'failed') {
            try { localStorage.setItem('postie:rules:parcels:' + L.rules, '1'); } catch (x) {}
            say(pairs ? 'Stuck: no pair can be framed any more.' : 'No parcels left: no frame fits. Some cubes stay behind.', true); retry.style.display = '';
          }
        }, still ? 60 : Math.max(280, 120 + fallMs));
        if (s.status === 'won') { try { localStorage.setItem('postie:rules:parcels:' + L.rules, '1'); } catch (x) {} }
      }

      function draw() {
        stat.innerHTML = Postie.stat([[pairs ? 'Pairs' : 'Parcels', s.shipped + ' / ' + s.total]]);
        grid.innerHTML = '';
        for (var r = 0; r < L.h; r++) for (var c = 0; c < L.w; c++) {
          var x = s.g[r][c], cls = 'cell', kids = [], lab = 'empty';
          if (pairs) {
            if (x && x.v === 'S') { cls += ' wall'; lab = 'stone'; }
            else if (x) { kids.push(h('span', { class: 'pc-dot' + (x.v === 'W' ? ' w' : '') })); lab = x.v === 'W' ? 'white dot' : 'black dot'; }
          } else if (!x) cls += ' gap';
          else if (x.v > 0) { cls += ' c-apr num'; kids.push(String(x.v)); lab = 'number ' + x.v; }
          else { cls += ' c-butter'; lab = 'cube'; }
          grid.appendChild(h('div', { class: cls, 'data-r': r, 'data-c': c, 'data-id': x ? x.id : null, 'aria-label': lab }, kids));
        }
      }
      draw();
    }
  });
})();
