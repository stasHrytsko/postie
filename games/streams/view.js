/* Streams — screen. One finger: put it on the end of a line (at an open fork — on the fork) and drag through cells.
   Dragging back along a line pulls it back one cell per cell and returns the move. Undo steps back one cell. */
(function () {
  var CSS = '.st{position:relative;width:100%;margin:10px auto;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '.st .grid{gap:0;margin:0}.st .cell{margin:2px;border-radius:var(--r8);font:700 15px var(--font)}' +
    '.st .cell.c-butter{color:var(--txt)}.st .cell.took{background:var(--card);border-color:var(--butter);color:var(--mut)}' +
    '.st svg.lines{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}' +
    '.st .st-lbl{font:700 .34px var(--font);fill:#fff;text-anchor:middle;dominant-baseline:central}' +
    '.st .st-dark{fill:var(--txt)}' +
    '.st-key{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;font-size:13px;color:var(--mut);margin:2px 0}';
  function css() { if (document.getElementById('st-css')) return; var e = document.createElement('style'); e.id = 'st-css'; e.textContent = CSS; document.head.appendChild(e); }
  /* line colours: trunk ink; branches 1..3 = Postie.PIECES 0..2 (apricot/triangle, blue/circle, sage/square) + their number */
  function colorOf(line) { return line === 0 ? 'var(--ink)' : 'var(--' + Postie.PIECES[line - 1].k + ')'; }

  Postie.register({
    id: 'streams', name: 'Streams',
    rules: '<b>Drag the line</b> from the dark dot through the cells. Cover <b>every cell</b> and end on the ring. ' +
      'Each new cell costs <b>1 move</b>; a <b>+N</b> cell gives N moves back. At the <b>fork</b> the line splits: pull each branch from its numbered arrow ' +
      'to the ring with the same number. All branches <b>share one pool of moves</b> — switch between them. Drag a line back to get moves back.',
    mount: function (root, ctx) {
      css();
      var h = Postie.h, E = ctx.engine, L = ctx.level, s = E.fresh(L), hist = [], grab = -1, blocked = -1, W = L.w, H = L.h;
      var stat = h('div', { class: 'stat' }), msg = h('div', { class: 'msg' });
      var wrap = h('div', { class: 'st', style: 'max-width:' + Math.min(400, W * 72) + 'px' });
      var grid = h('div', { class: 'grid', style: 'grid-template-columns:repeat(' + W + ',1fr)' });
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'lines'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      wrap.appendChild(grid); wrap.appendChild(svg);
      var undoBtn = Postie.btn('Undo', function () { if (!hist.length || s.won) return; s = hist.pop(); draw(); }, 'o s');
      root.appendChild(stat); root.appendChild(wrap); root.appendChild(msg);
      root.appendChild(h('div', { class: 'row' }, [undoBtn]));

      function idxAt(ev) {
        var b = grid.getBoundingClientRect();
        var c = Math.floor((ev.clientX - b.left) / (b.width / W)), r = Math.floor((ev.clientY - b.top) / (b.height / H));
        return [Math.max(0, Math.min(H - 1, r)), Math.max(0, Math.min(W - 1, c))];
      }
      function towards(from, to) {
        var dr = Math.floor(to / W) - Math.floor(from / W), dc = to % W - from % W;
        return Math.abs(dr) >= Math.abs(dc) ? from + Math.sign(dr) * W : from + Math.sign(dc);
      }
      function refuse(cell) {
        var el = grid.children[cell]; Postie.shake(el || wrap);
        if (s.energy < 1) { msg.className = 'msg bad'; msg.textContent = 'Out of moves — drag a line back to get some.'; }
      }
      Postie.drag(grid, {
        start: function (c) {
          if (s.won) return false;
          var i = c.r * W + c.c;
          if (!E.grabbable(L, s, i)) { msg.className = 'msg'; msg.textContent = 'Start from the end of a line.'; return false; }
          grab = i; blocked = -1; return true;
        },
        move: function (c, ev) {
          if (grab < 0) return;
          var p = idxAt(ev), target = p[0] * W + p[1], changed = false;
          for (var g = 0; g < 8 && grab !== target; g++) {
            var next = towards(grab, target);
            if (next === blocked) break;
            var prev = E.clone(s), out = E.move(L, s, grab, next);
            if (!out) { blocked = next; refuse(next); break; }
            hist.push(prev); blocked = -1; grab = next; changed = true;
            if (s.won) break;
          }
          if (changed) { draw(); if (s.won) { grab = -1; ctx.win('All ' + (W * H) + ' cells · ' + s.moves + ' moves (best ' + L.best + ')'); } }
        },
        end: function () { grab = -1; },
        cancel: function () { grab = -1; }
      });

      function cx(i) { return i % W + 0.5; } function cy(i) { return Math.floor(i / W) + 0.5; }
      function draw() {
        stat.innerHTML = Postie.stat([['Moves left', s.energy], ['Cells', E.covered(s) + ' / ' + (W * H)]]);
        undoBtn.disabled = !hist.length || s.won;
        if (s.energy > 0 || s.won) { if (msg.className === 'msg bad') msg.textContent = ''; msg.className = 'msg'; }
        else { msg.className = 'msg bad'; msg.textContent = 'Out of moves — drag a line back to get some.'; }
        var taken = {}; s.lines.forEach(function (l) { l.forEach(function (c) { taken[c] = 1; }); });
        grid.innerHTML = '';
        for (var i = 0; i < W * H; i++) {
          var x = E.dropAt(L, i);
          grid.appendChild(h('div', { class: 'cell' + (x ? (taken[i] ? ' took' : ' c-butter') : ''), 'data-r': Math.floor(i / W), 'data-c': i % W }, [x ? '+' + x : null]));
        }
        var o = [];
        /* finish rings: dashed ring with the branch number; filled when the branch is home */
        L.finish.forEach(function (f, k) {
          var line = L.fork === null ? 0 : k + 1, home = E.finished(L, s, line), col = colorOf(line);
          o.push('<circle cx="' + cx(f) + '" cy="' + cy(f) + '" r=".3" fill="' + (home ? col : 'var(--card)') + '" stroke="' + col + '" stroke-width=".07"' + (home ? '' : ' stroke-dasharray=".1 .07"') + '/>');
        });
        /* lines */
        s.lines.forEach(function (l, line) {
          var pts = line > 0 && l.length ? [L.fork].concat(l) : l;
          if (pts.length > 1) o.push('<polyline points="' + pts.map(function (c) { return cx(c) + ',' + cy(c); }).join(' ') + '" fill="none" stroke="' + colorOf(line) + '" stroke-width=".34" stroke-linecap="round" stroke-linejoin="round"/>');
        });
        /* start dot and fork node */
        o.push('<circle cx="' + cx(L.start) + '" cy="' + cy(L.start) + '" r=".24" fill="var(--ink)"/>');
        if (L.fork !== null) o.push('<rect x="' + (cx(L.fork) - .22) + '" y="' + (cy(L.fork) - .22) + '" width=".44" height=".44" rx=".08" transform="rotate(45 ' + cx(L.fork) + ' ' + cy(L.fork) + ')" fill="var(--ink)"/>');
        /* arrows: a numbered chip pointing from the fork into the branch's first cell (until the branch starts) */
        L.arrows.forEach(function (a, k) {
          var line = k + 1; if (s.lines[line].length) return;
          var dx = cx(a) - cx(L.fork), dy = cy(a) - cy(L.fork), ax = cx(a) - dx * .5, ay = cy(a) - dy * .5;
          var ang = Math.atan2(dy, dx) * 180 / Math.PI;
          o.push('<g transform="translate(' + ax + ' ' + ay + ') rotate(' + ang + ')"><path d="M.22 0 L-.12 -.2 L-.12 .2Z" fill="' + colorOf(line) + '" stroke="var(--txt)" stroke-width=".03" stroke-linejoin="round"/></g>');
          o.push('<circle cx="' + cx(a) + '" cy="' + cy(a) + '" r=".2" fill="' + colorOf(line) + '"/><text class="st-lbl" x="' + cx(a) + '" y="' + cy(a) + '">' + line + '</text>');
        });
        /* finish numbers (on top of lines) */
        L.finish.forEach(function (f, k) {
          if (L.fork === null) return;
          var home = E.finished(L, s, k + 1);
          o.push('<text class="st-lbl' + (home ? '' : ' st-dark') + '" x="' + cx(f) + '" y="' + cy(f) + '">' + (k + 1) + '</text>');
        });
        /* heads: tip of each started line, numbered for branches */
        s.lines.forEach(function (l, line) {
          if (!l.length || (line === 0 && l.length === 1) || (line > 0 && E.finished(L, s, line)) || (line === 0 && L.fork === null && E.finished(L, s, 0))) return;
          if (line === 0 && s.forked) return;
          var t = l[l.length - 1];
          o.push('<circle cx="' + cx(t) + '" cy="' + cy(t) + '" r=".24" fill="' + colorOf(line) + '" stroke="var(--card)" stroke-width=".06"/>');
          if (line > 0) o.push('<text class="st-lbl" x="' + cx(t) + '" y="' + cy(t) + '">' + line + '</text>');
        });
        svg.innerHTML = o.join('');
      }
      draw();
    }
  });
})();
