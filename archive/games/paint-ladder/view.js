/* Paint Ladder — screen. Gestures: tap a gap between chips to swap them (optional), tap Forward. */
(function () {
  var CL = { A: 'c-apr', B: 'c-blue', S: 'c-sage', Y: 'c-butter' }, SH = { A: 't', B: 'o', S: 's', Y: 'd' }, VAR = { A: 'apr', B: 'blue', S: 'sage', Y: 'butter' };
  Postie.register({
    id: 'paint-ladder', name: 'Paint Ladder',
    rules: '<b>Before each move</b> you may swap two neighbouring chips: tap the gap between them. Then tap <b>Forward</b>: every chip climbs one row and takes the colour of the paint it lands on. After the last row each lane must match the goal on top.',
    mount: function (root, ctx) {
      var h = Postie.h, E = ctx.engine, L = ctx.level, M = E.moves(L), s = E.fresh(L), hist = [], pick = null;
      var stat = h('div', { class: 'stat' }), msg = h('div', { class: 'msg' }), board = h('div', { class: 'board', style: 'max-width:300px' }), ctr = h('div', { class: 'row' });
      root.appendChild(stat); root.appendChild(board); root.appendChild(ctr); root.appendChild(msg);
      function chip(c) { return h('div', { class: 'cell ' + CL[c], style: 'aspect-ratio:1.6', html: Postie.shape(SH[c], 'none') }); }
      function row(cells, label) { var g = h('div', { class: 'grid', style: 'grid-template-columns:repeat(4,1fr);gap:5px;margin:5px 0' }); cells.forEach(function (x) { g.appendChild(x); }); return label ? h('div', null, [h('div', { class: 'lbl', style: 'text-align:center;margin:6px 0 2px' }, [label]), g]) : g; }
      function swaps() {
        return [0, 1, 2].map(function (i) {
          return h('button', { 'aria-label': 'Swap lanes ' + (i + 1) + ' and ' + (i + 2), onclick: function () { pick = pick === i ? null : i; draw(); },
            style: 'position:absolute;top:50%;left:' + ((i + 1) * 25) + '%;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:17px;border:1.5px solid var(--ink);background:' + (pick === i ? 'var(--ink)' : 'var(--card)') + ';color:' + (pick === i ? '#fff' : 'var(--ink)') + ';font:700 15px var(--font);cursor:pointer' }, ['⇄']);
        });
      }
      function paintCell(x) {
        if (x === '.') return h('div', { class: 'cell', style: 'aspect-ratio:1.6;background:transparent' });
        return h('div', { class: 'cell', style: 'aspect-ratio:1.6;border-style:dashed;background:color-mix(in srgb,var(--' + VAR[x] + ') 35%,var(--card))', html: Postie.shape(SH[x], 'none').replace('class="pc ', 'style="width:34%;height:auto;fill:none;stroke:var(--' + VAR[x] + ');stroke-width:2.4" class="pc ') });
      }
      function draw() {
        stat.innerHTML = Postie.stat([['Move', Math.min(s.row + 1, M) + ' / ' + M], ['Swaps', s.swaps]]);
        board.innerHTML = '';
        board.appendChild(row(L.goal.split('').map(chip), 'Goal'));
        board.appendChild(h('div', { style: 'height:6px' }));
        for (var r = M; r >= 0; r--) {
          var cells = s.row === r ? s.chips.map(chip) : r === 0 ? [0, 1, 2, 3].map(function () { return paintCell('.'); }) : L.paint[r - 1].split('').map(paintCell);
          var g = row(cells);
          if (s.row === r && r < M) { var wrap = h('div', { style: 'position:relative' }, [g]); swaps().forEach(function (b) { wrap.appendChild(b); }); g = wrap; }
          board.appendChild(g);
        }
        ctr.innerHTML = '';
        ctr.appendChild(Postie.btn('Undo', function () { if (!hist.length) return; var x = hist.pop(); s = x[0]; pick = x[1]; msg.textContent = ''; msg.className = 'msg'; draw(); }, 'o s'));
        if (s.row < M) ctr.appendChild(Postie.btn(pick === null ? 'Forward' : 'Swap ' + (pick + 1) + '↔' + (pick + 2) + ' · Forward', forward, 's'));
      }
      function forward() {
        var n = E.step(L, s, pick); if (!n) return;
        hist.push([s, pick]); s = n; pick = null; draw();
        if (E.done(L, s)) { if (E.won(L, s)) ctx.win('Every lane matches · ' + s.swaps + ' swaps'); else { msg.className = 'msg bad'; msg.textContent = 'Not a match. Undo a few moves or restart.'; } }
      }
      draw();
    }
  });
})();
