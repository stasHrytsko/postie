/* Streams — screen. One finger: put it on the end of a line (at an open fork — on the fork) and drag through cells.
   Dragging back along a line pulls it back one cell per cell and returns the move. Undo steps back one cell. */
(function () {
  var CSS = '.st{position:relative;width:100%;margin:10px auto;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '.st .grid{gap:0;margin:0}.st .cell{margin:2px;border-radius:var(--r8);font:700 15px var(--font)}' +
    '.st .cell.c-butter{color:var(--txt)}.st .cell.took{background:var(--card);border-color:var(--butter);color:var(--mut)}' +
    '.st svg.lines{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}' +
    '.st .st-lbl{font:700 .34px var(--font);fill:#fff;text-anchor:middle;dominant-baseline:central}' +
    '.st .st-dark{fill:var(--txt)}' +
    '.st .st-drop{font:700 .2px var(--font);fill:var(--ink);text-anchor:middle;dominant-baseline:central}' +
    '.st-key{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;font-size:13px;color:var(--mut);margin:2px 0}';
  function css() { if (document.getElementById('st-css')) return; var e = document.createElement('style'); e.id = 'st-css'; e.textContent = CSS; document.head.appendChild(e); }
  /* line colours: trunk ink; branches 1..3 = Postie.PIECES 0..2 (apricot/triangle, blue/circle, sage/square) + their number */
  function colorOf(line) { return line === 0 ? 'var(--ink)' : 'var(--' + Postie.PIECES[line - 1].k + ')'; }

  Postie.register({
    id: 'streams', name: 'Streams',
    rules: '<b>Drag the line</b> from the dark dot to the <b>fork</b>: it splits. Lead each branch to the ring with its number, through <b>every cell</b>. ' +
      'Later levels have a pool of moves: each cell costs 1, a <b>+N</b> cell gives N back. Drag a line back to undo it.',
    /* level 0 (author 2026-11-19: the fork from the very first level): trunk into the fork, then each branch to its ring */
    tutorial: { w: 3, h: 3, start: 0, fork: 4, arrows: [3, 5], finish: [8, 2], drops: [], energy: null, solution: [[0, 1], [0, 4], [1, 3], [1, 6], [1, 7], [1, 8], [2, 5], [2, 2]] },
    demo: [
      { say: 'Drag the line to the <b>fork</b>: it splits. Lead each branch to its ring, through <b>every cell</b>.', level: { w: 3, h: 3, start: 0, fork: 4, arrows: [3, 5], finish: [8, 2], drops: [], energy: null, solution: [[0, 1], [0, 4], [1, 3], [1, 6], [1, 7], [1, 8], [2, 5], [2, 2]] } },
      { say: 'Later: each cell costs a move, <b>+N</b> gives moves back.', level: { w: 3, h: 3, start: 0, fork: 4, arrows: [3, 5], finish: [8, 2], drops: [[6, 3]], energy: 5, solution: [[0, 1], [0, 4], [1, 3], [1, 6], [1, 7], [1, 8], [2, 5], [2, 2]] } }
    ],
    /* a move = [line, cell]; the gesture = drag from the line's tip (its cell before this one in the sample, the start or the fork) */
    gesture: function (root, m, L) {
      var sol = L.solution, i = 0;
      for (; i < sol.length; i++) if (sol[i][0] === m[0] && sol[i][1] === m[1]) break;
      var tip = m[0] === 0 ? L.start : L.fork;
      for (var j = 0; j < i; j++) if (sol[j][0] === m[0]) tip = sol[j][1];
      function mid(cell) { var e = root.querySelector('.st .cell[data-r="' + Math.floor(cell / L.w) + '"][data-c="' + (cell % L.w) + '"]'); if (!e) return null; var b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }
      var a = mid(tip), b = mid(m[1]); return a && b ? [a, b] : null;
    },
    mount: function (root, ctx) {
      css();
      var h = Postie.h, E = ctx.engine, L = ctx.level, s = E.fresh(L), hist = [], grab = -1, blocked = -1, W = L.w, H = L.h;
      var stat = h('div', { class: 'stat' }), msg = h('div', { class: 'msg' });
      var wrap = h('div', { class: 'st', style: 'max-width:' + Math.min(400, W * 72) + 'px' });
      var grid = h('div', { class: 'grid', style: 'grid-template-columns:repeat(' + W + ',1fr)' });
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'lines'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      wrap.appendChild(grid); wrap.appendChild(svg);
      var undoBtn = Postie.btn('Undo', function () { if (!hist.length || s.won) return; s = hist.pop(); draw(); if (ctx.back) ctx.back(); }, 'o s');
      var pool = s.energy !== null;
      root.appendChild(stat); root.appendChild(wrap); root.appendChild(msg);
      if (!ctx.demo) root.appendChild(h('div', { class: 'row' }, [undoBtn]));

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
        if (pool && s.energy < 1) { msg.className = 'msg bad'; msg.textContent = 'Out of moves — drag a line back to get some.'; }
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
            if (out.kind === 'step') { if (ctx.moved) ctx.moved([out.line, next]); } else if (ctx.back) ctx.back();
            if (s.won) break;
          }
          if (changed) { draw(); if (s.won) { grab = -1; ctx.win('Done'); } }
        },
        end: function () { grab = -1; },
        cancel: function () { grab = -1; }
      });

      function cx(i) { return i % W + 0.5; } function cy(i) { return Math.floor(i / W) + 0.5; }
      function draw() {
        stat.innerHTML = pool ? Postie.stat([['Moves left', s.energy]]) : '';      // no pool — nothing to count
        undoBtn.disabled = !hist.length || s.won;
        if (!pool || s.energy > 0 || s.won) { if (msg.className === 'msg bad') msg.textContent = ''; msg.className = 'msg'; }
        else { msg.className = 'msg bad'; msg.textContent = 'Out of moves — drag a line back to get some.'; }
        var taken = {}; s.lines.forEach(function (l) { l.forEach(function (c) { taken[c] = 1; }); });
        grid.innerHTML = '';
        for (var i = 0; i < W * H; i++) {
          var x = E.dropAt(L, i);
          grid.appendChild(h('div', { class: 'cell', 'data-r': Math.floor(i / W), 'data-c': i % W }));
        }
        var o = [];
        /* drops (designed 2026-11-19): a small water drop outline with +N, not a coloured tile — quiet until you need it; gone once taken */
        L.drops.forEach(function (d) {
          var c = d[0], X = cx(c), Y = cy(c) - .04, gone = taken[c]; if (gone) return;   // taken: the line covers it, nothing to show
          o.push('<g opacity="' + (gone ? .28 : 1) + '"><path d="M' + X + ' ' + (Y - .3) + ' C' + (X + .05) + ' ' + (Y - .2) + ' ' + (X + .22) + ' ' + (Y - .02) + ' ' + (X + .22) + ' ' + (Y + .1) +
            ' A.22 .22 0 0 1 ' + (X - .22) + ' ' + (Y + .1) + ' C' + (X - .22) + ' ' + (Y - .02) + ' ' + (X - .05) + ' ' + (Y - .2) + ' ' + X + ' ' + (Y - .3) + 'Z" fill="none" stroke="var(--ink)" stroke-width=".05" stroke-linejoin="round"/>' +
            '<text x="' + X + '" y="' + (Y + .1) + '" class="st-drop">+' + d[1] + '</text></g>');
        });
        /* Simple look (author 2026-11-19): no numbers, no arrow chips. A finish is a circle in its branch's colour (a ring until the branch
           is home, then filled); the fork is a diamond cut into halves — each half in a branch's colour points where that branch goes. */
        L.finish.forEach(function (f, k) {
          var line = L.fork === null ? 0 : k + 1, home = E.finished(L, s, line), col = colorOf(line);
          o.push('<circle cx="' + cx(f) + '" cy="' + cy(f) + '" r=".26" fill="' + (home ? col : 'none') + '" stroke="' + col + '" stroke-width=".1"/>');
        });
        s.lines.forEach(function (l, line) {
          var pts = line > 0 && l.length ? [L.fork].concat(l) : l;
          if (pts.length > 1) o.push('<polyline points="' + pts.map(function (c) { return cx(c) + ',' + cy(c); }).join(' ') + '" fill="none" stroke="' + colorOf(line) + '" stroke-width=".34" stroke-linecap="round" stroke-linejoin="round"/>');
        });
        o.push('<circle cx="' + cx(L.start) + '" cy="' + cy(L.start) + '" r=".24" fill="var(--ink)"/>');
        if (L.fork !== null) {
          /* the fork (designed 2026-11-19): short stubs in the branches' colours, drawn in the same stroke as the lines, start where each
             branch will go — the split reads as part of the line, not as a separate sign. Faint until the trunk arrives; a small junction
             dot on top. A branch that has started grows out of its stub. */
          var fx = cx(L.fork), fy = cy(L.fork), on = s.forked;
          L.arrows.forEach(function (a, k) {
            if (s.lines[k + 1].length) return;
            var dx = cx(a) - fx, dy = cy(a) - fy;
            o.push('<line x1="' + fx + '" y1="' + fy + '" x2="' + (fx + dx * .42) + '" y2="' + (fy + dy * .42) + '" stroke="' + colorOf(k + 1) + '" stroke-width=".34" stroke-linecap="round" opacity="' + (on ? 1 : .45) + '"/>');
          });
          o.push('<circle cx="' + fx + '" cy="' + fy + '" r=".15" fill="var(--card)" stroke="var(--ink)" stroke-width=".07"/>');
        }
        /* heads: the tip of each line that is still going, in its colour */
        s.lines.forEach(function (l, line) {
          if (!l.length || (line === 0 && l.length === 1) || (line > 0 && E.finished(L, s, line)) || (line === 0 && L.fork === null && E.finished(L, s, 0))) return;
          if (line === 0 && s.forked) return;
          var t = l[l.length - 1];
          o.push('<circle cx="' + cx(t) + '" cy="' + cy(t) + '" r=".2" fill="' + colorOf(line) + '" stroke="var(--card)" stroke-width=".06"/>');
        });
        svg.innerHTML = o.join('');
      }
      draw();
    }
  });
})();
