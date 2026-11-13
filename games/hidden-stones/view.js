/* Hidden Stones — screen. One finger: tap an edge = shoot a ray; tap a cell = mark / unmark a stone;
   drag across cells = pencil line (your guess of a ray's path; dragging back along it erases the last step). */
(function () {
  var CSS = '.hs{position:relative;display:grid;width:100%;max-width:420px;aspect-ratio:1;margin:8px auto;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '.hs>div{margin:2px;display:grid;place-items:center;border-radius:var(--r8);position:relative}' +
    '.hs .cell{aspect-ratio:auto;font-size:0}' +
    '.hs .port{color:var(--mut)}.hs .port svg.ic{width:46%;height:46%}' +
    '.hs .res{position:relative;z-index:2;width:84%;height:84%;border-radius:50%;display:grid;place-items:center;font:700 16px var(--font);color:#fff;border:1.5px solid transparent}' +
    '.hs .res.cur{box-shadow:0 0 0 2.5px var(--txt)}' +
    '.hs .stone{width:62%;height:62%;border-radius:50%;background:var(--ink);display:grid;place-items:center;color:#fff;font:700 15px var(--font)}' +
    '.hs .guess{background:var(--card);border:2.5px solid var(--ink);color:var(--ink)}' +
    '.hs .miss{background:none;border:2.5px dashed var(--bad);color:var(--bad)}' +
    '.hs svg.pen{position:absolute;z-index:1;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}' +
    '.hs-key{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;font-size:13px;color:var(--mut);margin:4px 0 2px}' +
    '.hs-key span{display:inline-flex;align-items:center;gap:6px}.hs-key i{width:22px;height:22px;border-radius:50%;display:inline-grid;place-items:center;color:#fff;font:700 12px var(--font);font-style:normal}';

  function css() { if (document.getElementById('hs-css')) return; var st = document.createElement('style'); st.id = 'hs-css'; st.textContent = CSS; document.head.appendChild(st); }
  var KIND = { H: 'c-apr', R: 'c-blue', P: 'c-sage' };

  Postie.register({
    id: 'hidden-stones', name: 'Hidden Stones',
    rules: 'Stones are hidden in the grid. <b>Tap an edge</b> to shoot a ray in — you only see where it ends up: ' +
      '<b>✕</b> it hit a stone, <b>↩</b> it came back out where it went in, the <b>same number</b> on two edges — in at one, out at the other. ' +
      'A stone straight ahead stops a ray; a stone diagonally ahead turns it 90° away; a stone beside the entry sends it straight back. ' +
      '<b>Drag</b> across cells to sketch a path. <b>Tap a cell</b> to mark a stone, mark them all and press <b>Check</b>. Fewer shots is better.',
    mount: function (root, ctx) {
      css();
      var h = Postie.h, E = ctx.engine, L = ctx.level, n = L.n, s = E.fresh(L), lines = [], last = null, pen = null;
      var stat = h('div', { class: 'stat' }), msg = h('div', { class: 'msg' });
      var board = h('div', { class: 'hs', style: 'grid-template-columns:repeat(' + (n + 2) + ',1fr);grid-template-rows:repeat(' + (n + 2) + ',1fr)' });
      var key = h('div', { class: 'hs-key', html: '<span><i class="c-apr">✕</i>hit</span><span><i class="c-blue">↩</i>back</span><span><i class="c-sage">1</i>in / out</span>' });
      var erase = Postie.btn('Erase lines', function () { if (s.won) return; lines = []; draw(); }, 'o s');
      var undoLine = Postie.btn('Undo line', function () { if (s.won || !lines.length) return; lines.pop(); draw(); }, 'o s');
      var checkBtn = Postie.btn('Check', doCheck, 's');
      root.appendChild(stat); root.appendChild(board); root.appendChild(key); root.appendChild(msg);
      root.appendChild(h('div', { class: 'row' }, [undoLine, erase, checkBtn]));

      var svgNS = 'http://www.w3.org/2000/svg';
      function posOf(ev) {
        var b = board.getBoundingClientRect(), cs = b.width / (n + 2);
        return [Math.floor((ev.clientY - b.top) / cs) - 1, Math.floor((ev.clientX - b.left) / cs) - 1, cs];
      }
      function inGrid(r, c) { return r >= 0 && c >= 0 && r < n && c < n; }
      function onBoard(r, c) { return inGrid(r, c) || E.portOf(n, r, c) >= 0; }

      function shoot(p) {
        if (s.won) return;
        var had = !!s.shots[p], e = E.shoot(s, p); if (!e) return;
        last = e.from; msg.textContent = had ? '' : (e.kind === 'H' ? 'Hit: a stone is somewhere on that ray.' : e.kind === 'R' ? 'Back: the ray came out where it went in.' : 'Out at the other ' + e.label + '.');
        msg.className = 'msg'; draw();
      }
      function tapCell(i, el) {
        if (s.won) return;
        if (!E.toggle(s, i)) { Postie.shake(el); msg.className = 'msg'; msg.textContent = 'Only ' + L.k + ' stone' + (L.k > 1 ? 's' : '') + ' here — tap a mark to take it back.'; return; }
        msg.textContent = ''; draw(); Postie.pop(board.querySelector('[data-r="' + Math.floor(i / n) + '"][data-c="' + (i % n) + '"]'));
      }
      function doCheck() {
        if (s.won) return;
        var right = E.check(s); if (right < 0) return;
        if (!E.won(s)) {
          board.querySelectorAll('.guess').forEach(function (g) { Postie.shake(g); });
          msg.className = 'msg bad'; msg.textContent = 'Not yet: ' + right + ' of ' + L.k + ' ' + (right === 1 ? 'is' : 'are') + ' right. Shoot more rays.';
          return;
        }
        msg.className = 'msg'; msg.textContent = ''; draw();
        ctx.win('All stones found · ' + s.fired + ' shot' + (s.fired === 1 ? '' : 's'));
      }

      /* one finger: a tap (no movement) shoots / marks; a drag draws a pencil line, cell by cell, straight steps only */
      Postie.drag(board, {
        start: function (c, ev) { if (s.won) return false; var p = posOf(ev); if (!onBoard(p[0], p[1])) return false; pen = { pts: [[p[0], p[1]]], moved: false, x: ev.clientX, y: ev.clientY, cs: p[2], el: c.el }; },
        move: function (c, ev) {
          if (!pen) return;
          if (!pen.moved && Math.abs(ev.clientX - pen.x) + Math.abs(ev.clientY - pen.y) < pen.cs * 0.35) return;
          pen.moved = true;
          var p = posOf(ev), pts = pen.pts;
          for (var g = 0; g < 24; g++) {
            var lst = pts[pts.length - 1]; if (lst[0] === p[0] && lst[1] === p[1]) break;
            var st = Math.abs(p[0] - lst[0]) >= Math.abs(p[1] - lst[1]) ? [lst[0] + Math.sign(p[0] - lst[0]), lst[1]] : [lst[0], lst[1] + Math.sign(p[1] - lst[1])];
            if (!onBoard(st[0], st[1])) break;
            var prev = pts[pts.length - 2];
            if (prev && prev[0] === st[0] && prev[1] === st[1]) pts.pop(); else pts.push(st);
          }
          drawPen();
        },
        end: function () {
          var d = pen; pen = null; if (!d) return;
          if (!d.moved) { var r = d.pts[0][0], c = d.pts[0][1]; if (inGrid(r, c)) tapCell(r * n + c, d.el); else shoot(E.portOf(n, r, c)); return; }
          if (d.pts.length > 1) lines.push(d.pts);
          draw();
        },
        cancel: function () { pen = null; drawPen(); }
      });

      function drawPen() {
        var svg = board.querySelector('svg.pen'); if (!svg) return;
        var all = pen && pen.pts.length > 1 ? lines.concat([pen.pts]) : lines;
        svg.innerHTML = all.map(function (pts) {
          return '<path d="M' + pts.map(function (q) { return (q[1] + 1.5) + ',' + (q[0] + 1.5); }).join(' L') + '" fill="none" stroke="var(--mut)" stroke-width=".09" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray=".16 .13" opacity=".85"/>';
        }).join('');
      }
      function draw() {
        stat.innerHTML = Postie.stat([['Shots', s.fired], ['Stones', s.marks.length + ' / ' + L.k]]);
        checkBtn.disabled = s.won || s.marks.length !== L.k;
        erase.disabled = undoLine.disabled = s.won || !lines.length;
        board.innerHTML = '';
        var lastOut = last !== null && s.shots[last] && s.shots[last].kind === 'P' ? s.shots[last].res : -1;
        for (var r = -1; r <= n; r++) for (var c = -1; c <= n; c++) {
          if (inGrid(r, c)) {
            var i = r * n + c, isStone = L.stones.indexOf(i) >= 0, marked = s.marks.indexOf(i) >= 0, inner = null;
            if (s.won && isStone) inner = h('div', { class: 'stone' });
            else if (marked) inner = h('div', { class: 'stone guess', html: '?' });
            board.appendChild(h('div', { class: 'cell', 'data-r': r, 'data-c': c }, [inner]));
            continue;
          }
          var p = E.portOf(n, r, c);
          if (p < 0) { board.appendChild(h('div')); continue; }
          var e = s.shots[p], side = Math.floor(p / n);
          board.appendChild(h('div', { class: 'port', 'data-r': r, 'data-c': c, 'aria-label': 'Edge ' + (p + 1) },
            [e ? h('div', { class: 'res ' + KIND[e.kind] + (p === last || p === lastOut ? ' cur' : '') }, [String(e.label)])
               : h('span', { html: Postie.icon(['down', 'left', 'up', 'right'][side]) })]));
        }
        var svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('class', 'pen'); svg.setAttribute('viewBox', '0 0 ' + (n + 2) + ' ' + (n + 2));
        board.appendChild(svg); drawPen();
      }
      draw();
    }
  });
})();
