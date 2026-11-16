/* Nest — screen. One finger: tap the picture to zoom in; tap a part to go inside it; drag a piece or part to move it (it snaps to the
   nearest free place, a shadow shows where); tap a tangram piece to turn it 90°. Zoom out works only when the part is in one piece. */
(function () {
  var CSS = '.nest-say{text-align:center;min-height:44px;color:var(--mut);font-size:15px;margin:2px 0 4px;display:flex;align-items:center;justify-content:center}' +
    '.nest-say.ok{color:var(--ink);font-weight:700}.nest-say.bad{color:var(--bad)}' +
    '.nest svg.bd{display:block;margin:0 auto;touch-action:none;user-select:none;-webkit-user-select:none;overflow:visible}' +
    '.nest .bg{fill:var(--card);stroke:var(--line);stroke-width:1.5px;vector-effect:non-scaling-stroke}' +
    '.nest .fr{fill:var(--sand)}.nest .fe{fill:none;stroke:var(--line);stroke-width:2px;stroke-dasharray:5 4;vector-effect:non-scaling-stroke;stroke-linecap:round}' +
    '.nest .fit .fr{fill:var(--sage);opacity:.35}.nest .fit .fe{stroke:var(--sage);stroke-width:3.5px;stroke-dasharray:none}' +
    '.nest .pc g.q path{vector-effect:non-scaling-stroke}' +
    '.nest .pc .ol{fill:none;stroke:var(--txt);stroke-width:1.6px;vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round}' +
    '.nest .pc.comp .ol{stroke-width:2.4px}' +
    '.nest .pc{cursor:pointer}.nest .pc.drag{opacity:.6}' +
    '.nest .aim{fill:var(--ink);opacity:.2}' +
    '.nest .sil{transition:transform .5s cubic-bezier(.45,0,.2,1)}';
  var LEAF = { S: 'apr', M: 'blue', L: 'sage', Sq: 'butter', P: 'ink' };
  var COMP = ['apr', 'blue', 'sage', 'butter'];
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  Postie.register({
    id: 'nest', name: 'Nest',
    rules: 'The dashed shadow is the picture\'s <b>outline</b>, and the picture doesn\'t fit it. <b>Tap the picture</b> to see its parts. <b>Tap a part</b> to go inside: <b>drag</b> its pieces to fill its own outline (<b>tap a piece</b> to turn it), then <b>Zoom out</b>. A part with a second sheet behind it has parts of its own. Fill the big outline exactly.',
    mount: function (root, ctx) {
      if (!document.getElementById('nest-css')) document.head.appendChild(Postie.h('style', { id: 'nest-css', html: CSS }));
      var h = Postie.h, E = ctx.engine, L = ctx.level, s = E.fresh(L), hist = [], over = false;
      var say = h('div', { class: 'nest-say' }), stat = h('div', { class: 'stat' }), wrap = h('div', { class: 'nest' });
      var svg = el('svg', { class: 'bd' }); wrap.appendChild(svg);
      var undoB = Postie.btn('Undo', undo, 'o s'), outB = Postie.btn('Zoom out', zoomOut, 's');
      root.appendChild(stat); root.appendChild(say); root.appendChild(wrap);
      root.appendChild(h('div', { class: 'row' }, [undoB, outB]));

      function poly(qs) { return qs.map(function (q) { var v = E.corners(q); return 'M' + v[0] + 'L' + v[1] + 'L' + v[2] + 'Z'; }).join(''); }
      function outline(qs) { return E.edges(qs).map(function (e) { return 'M' + e[0] + 'L' + e[1]; }).join(''); }
      /* one piece/part: flat colour, outer edge only; a part with work left inside gets a second sheet behind it */
      function piece(qs, colour, comp, stacked) {
        var g = el('g', { class: 'pc' + (comp ? ' comp' : '') });
        if (stacked) {
          var b = el('g', { transform: 'translate(.16 .16)' });
          b.appendChild(el('path', { d: poly(qs), style: 'fill:var(--line);stroke:var(--line);stroke-width:1px;vector-effect:non-scaling-stroke' }));
          b.appendChild(el('path', { class: 'ol', d: outline(qs) }));
          g.appendChild(b);
        }
        var q = el('g', { class: 'q' });
        q.appendChild(el('path', { d: poly(qs), style: 'fill:var(--' + colour + ');stroke:var(--' + colour + ');stroke-width:1px' }));
        g.appendChild(q);
        g.appendChild(el('path', { class: 'ol', d: outline(qs) }));
        return g;
      }

      var x, unit = 30, dragging = null;
      function sizeFor(x) {
        var aw = Math.min(root.clientWidth || 358, 420), ah = Math.max(300, Math.min(window.innerHeight - 330, 520));
        return Math.max(14, Math.floor(Math.min(aw / (x.cols + 0.4), ah / (x.rows + 0.4))));
      }
      function draw(anim) {
        x = E.cur(s); unit = sizeFor(x);
        var P = 0.2;
        svg.setAttribute('viewBox', (-P) + ' ' + (-P) + ' ' + (x.cols + 2 * P) + ' ' + (x.rows + 2 * P));
        svg.setAttribute('width', (x.cols + 2 * P) * unit); svg.setAttribute('height', (x.rows + 2 * P) * unit);
        svg.innerHTML = '';
        svg.appendChild(el('rect', { class: 'bg', x: -P, y: -P, width: x.cols + 2 * P, height: x.rows + 2 * P, rx: 0.5 }));
        var fit = x.opened && E.fitsFrame(x);
        var fr = el('g', { class: fit ? 'fit' : '' });
        fr.appendChild(el('path', { class: 'fr', d: poly(x.frame) })); fr.appendChild(el('path', { class: 'fe', d: outline(x.frame) }));
        svg.appendChild(fr);
        if (!x.opened) {
          var cells = E.boardCells(x), sil = piece(cells, 'apr', true, true);
          sil.setAttribute('data-sil', '1'); sil.classList.add('sil');
          sil.setAttribute('transform', 'translate(' + (x.cols / 2) + ' ' + (x.rows / 2) + ') scale(.86) translate(' + (-x.cols / 2) + ' ' + (-x.rows / 2) + ')');
          svg.appendChild(sil);
        } else {
          x.children.forEach(function (ch, i) {
            var g = ch.kind === 'leaf' ? piece(E.cellsOf(ch), LEAF[ch.type], false, false) : piece(E.cellsOf(ch), COMP[i % 4], true, !E.done(ch));
            g.setAttribute('data-i', i); g.setAttribute('aria-label', ch.kind === 'leaf' ? E.NAMES[ch.type] : ch.name);
            svg.appendChild(g);
          });
        }
        if (anim) Postie.pop(svg);
        /* text */
        var names = [L.name], y = s.root; s.path.forEach(function (i) { y = y.children[i]; names.push(y.name); });
        stat.innerHTML = '<span>' + names.join(' › ') + '</span>';
        undoB.disabled = !hist.length || over;
        outB.style.display = s.path.length ? '' : 'none'; outB.disabled = !E.canExit(s) || over;
        var nm = s.path.length ? x.name : L.name.toLowerCase(), t, cls = '';
        if (over) t = 'The ' + nm + ' fits its frame.';
        else if (!x.opened) t = 'Tap the ' + nm + ' to zoom in.';
        else if (s.path.length && !E.whole(x)) { t = 'The pieces of a part must touch each other.'; cls = 'bad'; }
        else if (s.path.length && fit) { t = 'The ' + nm + ' fits its outline. Zoom out.'; cls = 'ok'; }
        else if (x.children.some(function (ch) { return ch.kind === 'comp'; })) t = 'Fill the outline. Tap a part to go inside it.';
        else t = 'Fill the outline. Tap a piece to turn it.';
        say.textContent = t; say.className = 'nest-say ' + cls;
      }

      function snap() { return JSON.stringify({ root: s.root, path: s.path, moves: s.moves }); }
      function act(fn, anim) {
        var before = snap();
        if (!fn()) return false;
        hist.push(before); draw(anim); check(); return true;
      }
      function undo() { if (!hist.length || over) return; var o = JSON.parse(hist.pop()); s.root = o.root; s.path = o.path; s.moves = o.moves; draw(true); }
      function zoomOut() { if (over) return; act(function () { return E.exit(s); }, true); }
      function check() {
        if (over || !E.won(s)) return;
        var inside = s.path.length > 0; over = true; s.path = []; draw(inside);
        ctx.win('The ' + L.name.toLowerCase() + ' fits its frame · ' + s.moves + ' moves');
      }

      /* pointer: tap or drag, one finger */
      function toUnits(e) { var b = svg.getBoundingClientRect(), k = (x.cols + 0.4) / b.width; return { x: (e.clientX - b.left) * k - 0.2, y: (e.clientY - b.top) * k - 0.2 }; }
      svg.addEventListener('pointerdown', function (e) {
        if (over || dragging || !e.isPrimary) return;
        var g = e.target.closest && e.target.closest('g.pc'); if (!g) return;
        e.preventDefault();
        if (g.getAttribute('data-sil')) { act(function () { return E.open(s); }, false); return; }
        var i = +g.getAttribute('data-i'), n = x.children[i], p0 = toUnits(e);
        dragging = { i: i, n: n, g: g, p0: p0, sx: e.clientX, sy: e.clientY, moved: false, spot: null, lift: e.pointerType === 'touch' ? 1.4 : 0, id: e.pointerId };
        try { svg.setPointerCapture(e.pointerId); } catch (er) {}
      });
      svg.addEventListener('pointermove', function (e) {
        var d = dragging; if (!d || e.pointerId !== d.id) return;
        if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 8) return;
        if (!d.moved) { d.moved = true; d.g.classList.add('drag'); svg.appendChild(d.g); }
        var p = toUnits(e), dx = p.x - d.p0.x, dy = p.y - d.p0.y - d.lift;
        d.g.setAttribute('transform', 'translate(' + dx + ' ' + dy + ')');
        d.spot = E.nearestSpot(d.n, x, d.n.r + dy, d.n.c + dx, 2);
        var a = svg.querySelector('.aim'); if (a) a.remove();
        if (d.spot) { a = el('path', { class: 'aim', d: poly(E.cellsAt(d.n, d.spot.r, d.spot.c)) }); svg.insertBefore(a, svg.children[2] || null); }
      });
      function end(e, cancel) {
        var d = dragging; if (!d || e.pointerId !== d.id) return; dragging = null;
        try { svg.releasePointerCapture(e.pointerId); } catch (er) {}
        if (cancel) { draw(); return; }
        if (!d.moved) {
          if (d.n.kind === 'comp') act(function () { return E.enter(s, d.i); }, true);
          else if (!act(function () { return E.rotate(s, d.i); })) Postie.shake(svg);
          return;
        }
        if (!(d.spot && act(function () { return E.move(s, d.i, d.spot.r, d.spot.c); }))) draw();
      }
      svg.addEventListener('pointerup', function (e) { end(e, false); });
      svg.addEventListener('pointercancel', function (e) { end(e, true); });

      draw();
      var onR = function () { if (!dragging) draw(); }; window.addEventListener('resize', onR); ctx.cleanup(function () { window.removeEventListener('resize', onR); });
    }
  });
})();
