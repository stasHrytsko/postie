/* Tight Shelf — screen. Gesture: tap a cell. Look follows the Postie UI kit sheet (Game elements · Tight Shelf, Game previews).
   Colour of a piece is also shown by pips (blue 1, yellow 2, coral 3) — colour is never the only channel. */
(function () {
  var VAR = { B: 'blue', Y: 'butter', C: 'apr' }, PIPS = { B: 1, Y: 2, C: 3 }, NAME = { B: 'blue', Y: 'yellow', C: 'coral', o: 'circle', s: 'square', t: 'triangle' };
  var BODY = { o: '<circle cx="12" cy="12" r="8.6"/>', s: '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="3.8"/>', t: '<path d="M12 3.2L21.2 19.6H2.8z"/>' };
  function pips(n, y, fill) {
    var xs = n === 1 ? [12] : n === 2 ? [9.6, 14.4] : [7.8, 12, 16.2];
    return xs.map(function (x) { return '<circle cx="' + x + '" cy="' + y + '" r="1.55" fill="' + fill + '" stroke="none"/>'; }).join('');
  }
  /* a piece: the shape itself, filled with its colour, white pips for the colour */
  function pieceSvg(p) {
    return '<svg class="ts-pc" viewBox="0 0 24 24" aria-hidden="true"><g fill="var(--' + VAR[p[0]] + ')" stroke="var(--txt)" stroke-width="1.3" stroke-linejoin="round">' + BODY[p[1]] + '</g>' +
      pips(PIPS[p[0]], p[1] === 't' ? 15 : 12, '#fff') + '</svg>';
  }
  function ruleHtml(rule) {
    if (BODY[rule]) return '<svg class="ts-rule" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="var(--mut)" stroke-width="1.5" stroke-linejoin="round">' + BODY[rule] + '</g></svg>';
    if (VAR[rule]) return '<svg class="ts-rule" viewBox="0 0 24 24" aria-hidden="true">' + pips(PIPS[rule], 12, 'var(--mut)') + '</svg>';
    return '';
  }
  var css = '.ts-pc{width:84%;height:84%;display:block}.ts-rule{width:58%;height:58%;display:block}' +
    '.ts-q{display:flex;align-items:flex-end;justify-content:center;gap:22px;margin:4px 0 2px}' +
    '.ts-q .lb{font-size:12px;color:var(--mut);text-align:center;margin-top:4px;letter-spacing:.04em}' +
    '.ts-now{width:64px;height:64px;border-radius:var(--r12);border:1.5px solid var(--line);background:var(--card);display:grid;place-items:center}' +
    '.ts-next{display:flex;gap:6px}.ts-next div{width:42px;height:42px;display:grid;place-items:center;opacity:.9}' +
    '.ts-grid .cell{cursor:pointer}.ts-grid .cell.col{border-width:2.5px}' +
    '.ts-grid.dead .cell{cursor:default}';
  Postie.register({
    id: 'tight-shelf', name: 'Tight Shelf',
    rules: '<b>Tap an empty cell</b> for the piece shown under <b>Now</b>. A plain cell takes any piece, a cell with a shape takes that shape, a coloured cell takes that colour. Three in a row (any direction) of <b>one colour or one shape</b> clear. Clear <b>5 lines</b>. If the piece fits nowhere, the shelf is stuck.',
    mount: function (root, ctx) {
      if (!document.getElementById('ts-css')) document.head.appendChild(Postie.h('style', { id: 'ts-css', html: css }));
      var h = Postie.h, E = ctx.engine, L = ctx.level, s = E.fresh(L), n = s.n;
      var q = h('div', { class: 'ts-q' }), stat = h('div', { class: 'stat' }), msg = h('div', { class: 'msg' });
      var grid = h('div', { class: 'grid ts-grid', style: 'grid-template-columns:repeat(' + n + ',1fr);max-width:' + (n === 4 ? 320 : n === 5 ? 340 : 358) + 'px;gap:' + (n === 4 ? 8 : 6) + 'px' });
      root.appendChild(q); root.appendChild(stat); root.appendChild(grid); root.appendChild(msg);
      var cells = [];
      for (var i = 0; i < n * n; i++) (function (i) {
        var rule = s.rules[i], col = VAR[rule];
        var el = h('div', { class: 'cell' + (col ? ' col' : ''), 'data-i': i,
          style: col ? 'border-color:var(--' + col + ');background:color-mix(in srgb,var(--' + col + ') 22%,var(--card))' : '' });
        el.addEventListener('click', function () { tap(i, el); });
        cells.push(el); grid.appendChild(el);
      })(i);
      function label(p) { return NAME[p[0]] + ' ' + NAME[p[1]]; }
      function tap(i, el) {
        if (s.status !== 'playing') return;
        if (!E.move(s, i)) { Postie.shake(el); msg.className = 'msg'; msg.textContent = s.board[i] ? 'That cell is taken.' : 'That cell doesn’t take this piece.'; return; }
        msg.className = 'msg'; msg.textContent = '';
        draw();
        var last = s.last;
        if (last.lines) {
          last.cleared.forEach(function (k) { cells[k].animate([{ background: 'var(--sage)', transform: 'scale(.92)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' }); });
          Postie.pop(stat);
        } else Postie.pop(cells[i]);
        if (E.won(s)) ctx.win(s.lines + ' lines · ' + s.moves + ' pieces');
        else if (E.lost(s)) { grid.classList.add('dead'); msg.className = 'msg bad'; msg.textContent = 'No cell takes this ' + label(E.current(s)) + '. Restart to try again.'; Postie.shake(q.firstChild); }
      }
      function draw() {
        q.innerHTML = '';
        q.appendChild(h('div', null, [h('div', { class: 'ts-now', 'aria-label': 'Now: ' + label(s.queue[0]), html: pieceSvg(s.queue[0]) }), h('div', { class: 'lb' }, ['Now'])]));
        q.appendChild(h('div', null, [h('div', { class: 'ts-next', 'aria-label': 'Next: ' + s.queue.slice(1).map(label).join(', ') },
          s.queue.slice(1).map(function (p) { return h('div', { html: pieceSvg(p) }); })), h('div', { class: 'lb' }, ['Next'])]));
        stat.innerHTML = Postie.stat([['Lines', Math.min(s.lines, s.target) + ' / ' + s.target], ['Pieces', s.moves]]);
        cells.forEach(function (el, i) {
          var p = s.board[i];
          el.innerHTML = p ? pieceSvg(p) : ruleHtml(s.rules[i]);
          el.setAttribute('aria-label', p ? label(p) : s.rules[i] === '.' ? 'any piece' : NAME[s.rules[i]] + ' only');
        });
      }
      draw();
    }
  });
})();
