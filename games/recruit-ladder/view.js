/* Recruit Ladder — screen. Gestures: swipe a recruit sideways to swap it with a neighbour, or tap the ⇄ slot between two lanes;
   tap Go to climb one row. Undo first clears the chosen swap, then takes back the last step. */
(function () {
  var CSS = '.rl{position:relative;margin:6px auto 0;user-select:none;-webkit-user-select:none}' +
    '.rl .ln{position:absolute;width:2px;background:var(--line);border-radius:1px}' +
    '.rl .goal{position:absolute;height:52px;border-radius:var(--r12);background:var(--card);border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;gap:3px;flex-wrap:wrap;padding:3px}' +
    '.rl .goal.ok{border-color:var(--sage);box-shadow:0 0 0 2px var(--sage)}.rl .goal.no{border-color:var(--bad)}' +
    '.rl .goal .res{position:absolute;top:-10px;right:-8px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--card);border:1.5px solid var(--txt)}' +
    '.rl .goal .res svg.ic{width:14px;height:14px;stroke-width:2.4}' +
    '.rl .sc{position:absolute;border-radius:var(--r8);display:grid;place-items:center;transition:opacity .25s}' +
    '.rl .sc svg.pc{width:62%;height:62%;stroke:#fff;stroke-width:2.2}' +
    '.rl .sc.past{opacity:.4}' +
    '.rl .mini{width:18px;height:18px;border-radius:5px;display:grid;place-items:center;flex:none}.rl .mini svg.pc{width:72%;height:72%;stroke:#fff;stroke-width:2.6}' +
    '.rl .goal .mini{width:24px;height:24px;border-radius:6px}' +
    '.rl .mini.empty{border:1.5px dashed var(--line);background:none}' +
    '.rl .rung{position:absolute;height:6px;border-radius:3px;background:var(--ink)}' +
    '.rl .rung.pend{background:var(--apr)}' +
    '.rl .slot{position:absolute;width:32px;height:32px;border-radius:50%;border:1.5px solid var(--line);background:var(--card);color:var(--mut);display:grid;place-items:center;cursor:pointer;padding:0;z-index:3}' +
    '.rl .slot svg.ic{width:18px;height:18px}.rl .slot.on{border-color:var(--apr);background:var(--apr);color:#fff}' +
    '.rl .rec{position:absolute;height:40px;border-radius:var(--r12);background:var(--card);border:2px solid var(--txt);box-shadow:0 3px 0 var(--txt);display:flex;align-items:center;justify-content:center;gap:3px;z-index:2;touch-action:none;cursor:grab;' +
    'transition:left .32s cubic-bezier(.3,.8,.3,1),top .36s cubic-bezier(.3,1.25,.4,1)}' +
    '.rl .rec.sel{border-color:var(--apr);box-shadow:0 3px 0 var(--apr)}' +
    '@media (prefers-reduced-motion:reduce){.rl .rec{transition:none}}';
  var NAMES = ['Dojo', 'Range', 'Bastion', 'Temple'];
  function tile(cls, k, size) {
    var P = Postie.PIECES[k];
    return Postie.h('div', { class: cls, title: NAMES[k], style: 'background:' + P.c + (size ? ';width:' + size + 'px;height:' + size + 'px' : ''), html: Postie.shape(P.s, 'none', '') });
  }

  Postie.register({
    id: 'recruit-ladder', name: 'Recruit Ladder',
    rules: '<b>Swipe a recruit</b> sideways (or tap <b>⇄</b> between lanes) to swap two neighbours, then press <b>Go</b>: everyone climbs one row and learns the school they land on. A recruit remembers only its <b>last 3 different schools</b>. After 7 rows, each recruit must know <b>every school its lane asks for</b> at the top.',
    mount: function (root, ctx) {
      if (!document.getElementById('rl-css')) document.head.appendChild(Postie.h('style', { id: 'rl-css', html: CSS }));
      var h = Postie.h, E = ctx.engine, L = ctx.level, s = E.fresh(L), hist = [];
      var stat = h('div', { class: 'stat' }), msg = h('div', { class: 'msg' }), board = h('div', { class: 'rl' });
      var undoB = Postie.btn('Undo', undo, 'o s'), goB = Postie.btn('Go', go, 's');
      goB.innerHTML = 'Go ' + Postie.icon('up'); goB.querySelector('svg').style.cssText = 'width:18px;height:18px;vertical-align:-3px;stroke-width:2.2';
      root.appendChild(stat); root.appendChild(board); root.appendChild(msg);
      root.appendChild(h('div', { class: 'row' }, [undoB, goB]));

      var W, col, GOAL = 52, TOP = 74, RH = 60, START = 70, H, TOK = 0;   /* roomy rows: 60 px between schools */
      function cx(l) { return col * l + col / 2; }
      function cy(r) { return r < 0 ? TOP + 7 * RH + START / 2 - 4 : TOP + (6 - r) * RH + RH / 2; } /* r = -1: start row */
      function edge(r) { return TOP + (7 - r) * RH; } /* boundary just below row r (between r-1 and r) */

      /* recruit tokens are persistent so they glide when they swap or climb */
      var recs = [0, 1, 2, 3].map(function (id) {
        var el = h('div', { class: 'rec', 'data-rec': id, 'aria-label': 'Recruit ' + (id + 1) });
        var sx = 0, sy = 0, on = false;
        el.addEventListener('pointerdown', function (e) { if (E.done(s)) return; on = true; sx = e.clientX; sy = e.clientY; try { el.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
        el.addEventListener('pointerup', function (e) {
          if (!on) return; on = false; var dx = e.clientX - sx, dy = e.clientY - sy;
          if (Math.abs(dx) < 22 || Math.abs(dx) < Math.abs(dy)) return;
          swipe(id, dx > 0 ? 1 : -1, el);
        });
        el.addEventListener('pointercancel', function () { on = false; });
        return el;
      });

      function snap() { return JSON.parse(JSON.stringify({ at: s.at, mem: s.mem, row: s.row, pend: s.pend, rungs: s.rungs, swaps: s.swaps })); }
      function restore(o) { for (var k in o) s[k] = o[k]; }
      function choose(k, el) {
        if (E.done(s)) return;
        if (k < 0 || k > 2) { Postie.shake(el); msg.className = 'msg'; msg.textContent = 'No neighbour on that side.'; return; }
        hist.push(snap()); E.swap(s, k); msg.textContent = ''; draw();
      }
      /* swipe on a recruit shown on lane dl: a recruit of the chosen pair can only swipe back (cancel); any other picks a new pair */
      function swipe(id, dir, el) {
        var shown = E.lanes(s), dl = shown.indexOf(id), base = s.at.indexOf(id);
        if (s.pend >= 0 && (base === s.pend || base === s.pend + 1)) {
          if (base - dl === dir) { choose(s.pend, el); return; }
          Postie.shake(el); return;
        }
        choose(dir > 0 ? base : base - 1, el);
      }
      function go() {
        if (E.done(s)) return;
        hist.push(snap()); E.step(s); msg.textContent = ''; draw();
        if (E.done(s)) {
          var w = E.lanesWon(s), n = w.filter(Boolean).length;
          if (E.won(s)) ctx.win('Every lane trained in ' + s.swaps + ' swaps · best ' + L.best);
          else { msg.className = 'msg bad'; msg.textContent = n + ' of 4 lanes matched. Undo the last step, or start again.'; }
        }
      }
      function undo() {
        if (!hist.length) return;
        if (s.pend >= 0) { s.pend = -1; hist.pop(); } else restore(hist.pop());
        msg.className = 'msg'; msg.textContent = ''; draw();
      }

      function layout() {
        W = Math.min(root.clientWidth || 358, 460); col = W / 4; H = TOP + 7 * RH + START;   /* lanes use the full width */
        TOK = Math.max(62, Math.min(col - 22, 66));   /* a recruit holds three marks */
        board.style.width = W + 'px'; board.style.height = H + 'px';
      }
      function draw() {
        layout();
        stat.innerHTML = Postie.stat([['Row', Math.min(s.row, 7) + ' / 7'], ['Swaps', s.swaps + (s.pend >= 0 ? '+1' : '')], ['Best', L.best]]);
        undoB.disabled = !hist.length; goB.disabled = E.done(s);
        Array.prototype.slice.call(board.children).forEach(function (c) { if (!c.classList.contains('rec')) c.remove(); });
        var fin = E.done(s) ? E.lanesWon(s) : null;
        for (var l = 0; l < 4; l++) {
          board.appendChild(h('div', { class: 'ln', style: 'left:' + (cx(l) - 1) + 'px;top:' + (TOP - 8) + 'px;height:' + (7 * RH + 8 + START / 2) + 'px' }));
          var g = h('div', { class: 'goal' + (fin ? (fin[l] ? ' ok' : ' no') : ''), style: 'left:' + (col * l + 8) + 'px;top:0;width:' + (col - 16) + 'px' },
            E.need(L, l).map(function (k) { return tile('mini', k); }));
          if (fin) g.appendChild(h('span', { class: 'res', html: Postie.icon(fin[l] ? 'check' : 'close') }));
          board.appendChild(g);
          for (var r = 0; r < 7; r++) {
            var k = E.school(L, r, l); if (k === null) continue;
            var t = tile('sc', k, 30);
            t.style.left = (cx(l) - 15) + 'px'; t.style.top = (cy(r) - 15) + 'px';
            if (r < s.row - 1) t.classList.add('past');
            board.appendChild(t);
          }
        }
        /* rungs already climbed, the chosen one, and tap slots for the next step */
        s.rungs.forEach(function (k, r) { if (k >= 0) board.appendChild(h('div', { class: 'rung', style: 'left:' + cx(k) + 'px;width:' + col + 'px;top:' + (edge(r) - 3) + 'px' })); });
        if (!E.done(s)) {
          var y = edge(s.row);
          if (s.pend >= 0) board.appendChild(h('div', { class: 'rung pend', style: 'left:' + cx(s.pend) + 'px;width:' + col + 'px;top:' + (y - 3) + 'px' }));
          [0, 1, 2].forEach(function (k) {
            board.appendChild(h('button', { class: 'slot' + (s.pend === k ? ' on' : ''), 'aria-label': 'Swap lanes ' + (k + 1) + ' and ' + (k + 2), 'data-slot': k,
              style: 'left:' + (col * (k + 1) - 16) + 'px;top:' + (y - 16) + 'px', html: '<svg class="ic" viewBox="0 0 24 24"><path d="M4 9h15M15 5l4 4-4 4M20 15H5M9 11l-4 4 4 4"/></svg>',
              onclick: function () { choose(k, this); } }));
          });
        }
        var shown = E.lanes(s), rowY = cy(s.row - 1);
        recs.forEach(function (el, id) {
          if (!el.parentNode) board.appendChild(el);
          var l = shown.indexOf(id), mem = s.mem[id];
          el.style.width = TOK + 'px'; el.style.left = (cx(l) - TOK / 2) + 'px'; el.style.top = (rowY - 20) + 'px';
          el.classList.toggle('sel', s.pend >= 0 && (s.at.indexOf(id) === s.pend || s.at.indexOf(id) === s.pend + 1));
          el.innerHTML = '';
          for (var i = 0; i < 3; i++) el.appendChild(i < mem.length ? tile('mini', mem[i]) : h('div', { class: 'mini empty' }));
        });
        if (!msg.textContent) { msg.className = 'msg'; msg.textContent = s.row === 0 && s.pend < 0 ? 'Swipe a recruit to swap, or just press Go.' : ''; }
      }
      draw();
      var onR = function () { draw(); }; window.addEventListener('resize', onR); ctx.cleanup(function () { window.removeEventListener('resize', onR); });
    }
  });
})();
