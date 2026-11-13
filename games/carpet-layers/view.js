/* Carpet Layers — screen. Gestures: drag a strip from the tray onto the board; tap a strip on the board to take it back (the top one in that cell). */
Postie.register({
  id: 'carpet-layers', name: 'Carpet Layers',
  rules: 'Copy the <b>pattern</b> exactly — position matters. <b>Drag a strip</b> from below onto the board: the strip you lay last is on top and hides what is under it, ' +
    'so lay the hidden parts first. <b>Tap a strip</b> on the board to take it back. You win when every strip is down and the board matches the pattern.',
  mount: function (root, ctx) {
    var h = Postie.h, E = ctx.engine, L = ctx.level, n = L.size, s = E.fresh(L);
    if (!document.getElementById('cl-css')) document.head.appendChild(h('style', { id: 'cl-css', html:
      '.cl-top{display:flex;align-items:center;justify-content:center;gap:22px;margin:2px 0 4px}' +
      '.cl-top .stat{flex-direction:column;gap:2px;margin:0;align-items:flex-start}' +
      '.cl-pat{display:grid;border:1.5px solid var(--txt);border-radius:6px;overflow:hidden;background:var(--sand)}' +
      '.cl-pat i,.cl-cell{display:grid;place-items:center;background:var(--sand);box-shadow:inset 0 0 0 .5px var(--line)}' +
      '.cl-pat svg.pc,.cl-seg svg.pc{width:62%;height:62%;stroke:#fff;stroke-width:2.2}' +
      '.cl-board{position:relative;margin:10px auto 14px;border:1.5px solid var(--txt);border-radius:6px;box-sizing:content-box;touch-action:none;user-select:none;-webkit-user-select:none}' +
      '.cl-grid{display:grid;width:100%;height:100%;border-radius:5px;overflow:hidden}' +
      '.cl-strip{position:absolute;display:flex;border-radius:6px;overflow:hidden;pointer-events:none;box-shadow:0 0 0 1.5px var(--card),0 2px 3px rgba(47,58,38,.35)}' +
      '.cl-strip.v{flex-direction:column}' +
      '.cl-seg{flex:1;display:grid;place-items:center;position:relative}' +
      '.cl-glass .cl-seg{background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.42) 0 3px,transparent 3px 9px)}' +
      '.cl-pin{position:absolute;left:4px;top:4px;width:11px;height:11px;border-radius:50%;background:var(--card);border:2px solid var(--ink)}' +
      '.cl-prev{position:absolute;border:2.5px dashed var(--ink);border-radius:6px;pointer-events:none}' +
      '.cl-tray{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:12px 14px;min-height:60px;padding:6px 0 4px;touch-action:none;user-select:none;-webkit-user-select:none}' +
      '.cl-tray .cl-strip{position:relative;pointer-events:auto;cursor:grab}' +
      '.cl-ghost{position:fixed;z-index:20;pointer-events:none;box-shadow:0 0 0 1.5px var(--card),0 8px 16px rgba(47,58,38,.3)}' +
      '.cl-hint{font-size:14px}' }));
    var avail = Math.min(root.clientWidth || 358, 448) - 4;
    var cs = Math.min(56, Math.floor(avail / n)), ts = Math.min(cs, 34), pm = n <= 5 ? 20 : n <= 6 ? 18 : 17;
    function P(v) { return Postie.PIECES[v - 1]; }
    /* a strip element: colours per cell (shown), own size per cell */
    function stripEl(st, shown, size, extra) {
      var e = h('div', { class: 'cl-strip ' + (st.d === 'v' ? 'v' : 'h') + (st.clear ? ' cl-glass' : '') + (extra || ''),
        style: 'width:' + (st.d === 'h' ? st.c.length * size : size) + 'px;height:' + (st.d === 'v' ? st.c.length * size : size) + 'px' });
      shown.forEach(function (v) { var p = P(v); e.appendChild(h('div', { class: 'cl-seg c-' + p.k, style: 'background-color:var(--' + p.k + ')', html: Postie.shape(p.s, 'none') })); });
      return e;
    }
    function own(st) { return st.c.split('').map(Number); }

    var stat = h('div', { class: 'stat' }), pat = h('div', { class: 'cl-pat', 'aria-label': 'Pattern', style: 'grid-template-columns:repeat(' + n + ',' + pm + 'px)' });
    E.pattern(L).forEach(function (v) { var p = v ? P(v) : null; pat.appendChild(h('i', { class: p ? 'c-' + p.k : '', style: 'width:' + pm + 'px;height:' + pm + 'px' + (p ? ';background:var(--' + p.k + ')' : ''), html: p ? Postie.shape(p.s, 'none') : '' })); });
    var board = h('div', { class: 'cl-board', style: 'width:' + n * cs + 'px;height:' + n * cs + 'px' });
    var grid = h('div', { class: 'cl-grid', style: 'grid-template-columns:repeat(' + n + ',1fr)' });
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) grid.appendChild(h('div', { class: 'cl-cell', 'data-r': r, 'data-c': c }));
    board.appendChild(grid);
    var layer = h('div', { style: 'position:absolute;inset:0;pointer-events:none' }); board.appendChild(layer);
    var tray = h('div', { class: 'cl-tray', 'aria-label': 'Strips' });
    var msg = h('div', { class: 'msg' }), hint = h('div', { class: 'msg cl-hint' });
    var hints = [];
    if (ctx.n === 1) hints.push('Drag a strip from below onto the board.');
    if (ctx.n === 2) hints.push('One strip is already down, but under the wrong one. Tap it to take it back.');
    if ((L.start || []).some(function (p) { return p[3]; })) hints.push('Strips with a pin are nailed down: they stay at the bottom.');
    if (L.strips.some(function (st) { return st.clear; })) hints.push('Striped strips are glass: blue over butter, or butter over blue, shows sage.');
    hint.textContent = hints.join(' ');
    root.appendChild(h('div', { class: 'cl-top' }, [h('div', null, [h('div', { class: 'lbl', style: 'margin:0 0 4px;text-align:center' }, ['Pattern']), pat]), stat]));
    [board, tray, msg, hint].forEach(function (e) { root.appendChild(e); });

    function after() {
      draw();
      if (E.won(s)) { msg.className = 'msg'; msg.textContent = ''; ctx.win('Pattern matched in ' + s.moves + ' moves (best ' + L.best + ')'); return; }
      if (E.stuck(L, s)) {
        msg.className = 'msg bad';
        msg.textContent = E.shiftedMatch(L, s) ? 'The picture is right, but in the wrong place — it must sit exactly where the pattern shows it.'
          : 'Every strip is down, but the board does not match the pattern. Tap a strip to take it back.';
      } else { msg.className = 'msg'; msg.textContent = ''; }
    }
    function draw() {
      stat.innerHTML = Postie.stat([['Moves', s.moves]]) + Postie.stat([['Best', L.best]]);
      layer.innerHTML = '';
      E.layers(L, s).forEach(function (ly) {
        var st = L.strips[ly.p.id], e = stripEl(st, ly.shown, cs);
        e.style.left = ly.p.c * cs + 'px'; e.style.top = ly.p.r * cs + 'px';
        if (ly.p.pinned) e.appendChild(h('span', { class: 'cl-pin', 'aria-label': 'Pinned' }));
        layer.appendChild(e);
      });
      tray.innerHTML = '';
      L.strips.forEach(function (st, i) {
        if (E.isPlaced(s, i)) return;
        var e = stripEl(st, own(st), ts); e.setAttribute('data-i', i); tray.appendChild(e);
      });
      if (!tray.children.length) tray.appendChild(h('span', { class: 'msg', style: 'margin:0' }, ['All strips are down.']));
    }

    /* drag from tray: ghost at board size; on touch it rides 1.2 cells above the finger so the finger does not hide it */
    var drag = null, prev = h('div', { class: 'cl-prev' });
    function place(e) {
      var g = drag, x = e.clientX - g.ox, y = e.clientY - g.oy - g.lift;
      g.ghost.style.left = x + 'px'; g.ghost.style.top = y + 'px';
      var b = board.getBoundingClientRect(), bx = b.left + 1.5, by = b.top + 1.5;
      var col = Math.round((x - bx) / cs), row = Math.round((y - by) / cs), st = L.strips[g.i];
      var cx = x + g.w / 2, cy = y + g.h / 2, near = cx > b.left - cs / 2 && cx < b.right + cs / 2 && cy > b.top - cs / 2 && cy < b.bottom + cs / 2;
      g.at = near ? [row, col] : null;
      if (near && E.fits(L, st, row, col)) {
        prev.style.cssText = 'left:' + (col * cs) + 'px;top:' + (row * cs) + 'px;width:' + g.w + 'px;height:' + g.h + 'px';
        if (!prev.parentNode) board.appendChild(prev);
      } else if (prev.parentNode) prev.remove();
    }
    Postie.drag(tray, {
      start: function (c, e) {
        if (s.status !== 'playing') return false;
        var st = L.strips[c.i], rect = c.el.getBoundingClientRect(), k = cs / ts;
        var ghost = stripEl(st, own(st), cs, ' cl-ghost');
        var w = (st.d === 'h' ? st.c.length : 1) * cs, hh = (st.d === 'v' ? st.c.length : 1) * cs;
        drag = { i: c.i, el: c.el, ghost: ghost, w: w, h: hh, ox: (e.clientX - rect.left) * k, oy: (e.clientY - rect.top) * k, lift: e.pointerType === 'touch' ? cs * 1.2 : 0, at: null };
        c.el.style.opacity = '.25'; document.body.appendChild(ghost); place(e);
      },
      move: function (c, e) { if (drag) place(e); },
      end: function (c, e) {
        if (!drag) return; place(e);
        var g = drag; drag = null; g.ghost.remove(); if (prev.parentNode) prev.remove(); g.el.style.opacity = '';
        if (!g.at) return;
        if (!E.drop(L, s, g.i, g.at[0], g.at[1])) { Postie.shake(g.el); msg.className = 'msg'; msg.textContent = 'The whole strip must fit on the board.'; return; }
        after();
      },
      cancel: function () { if (!drag) return; drag.ghost.remove(); drag.el.style.opacity = ''; if (prev.parentNode) prev.remove(); drag = null; }
    });
    ctx.cleanup(function () { if (drag) drag.ghost.remove(); });

    /* tap on the board: take back the top strip in that cell (pinned strips shake) */
    var tap = null;
    Postie.drag(board, {
      start: function (c) { if (s.status !== 'playing' || c.r === undefined) return false; tap = c; },
      end: function (c) {
        var t = tap; tap = null; if (!t || !c || c.r !== t.r || c.c !== t.c) return;
        var top = E.topAt(L, s, c.r, c.c); if (!top) return;
        if (top.pinned) { Postie.shake(board); msg.className = 'msg'; msg.textContent = 'This strip is pinned down.'; return; }
        E.removeAt(L, s, c.r, c.c); after();
      },
      cancel: function () { tap = null; }
    });
    draw();
  }
});
