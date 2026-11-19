/* Postie Kit — shared shell for every game.
   Browser: loads first, defines window.Postie. Node (tests): require('web/kit/kit.js') returns the same object, DOM helpers unused.
   A game folder (games/<id>/) adds three scripts in this order:
     levels.js  -> Postie.addLevels('<id>', [ ...all levels... ])
     engine.js  -> Postie.engine('<id>', { ...pure rules, no DOM... })
     view.js    -> Postie.register({ id, name, rules, mount(root, ctx) })
   Contract details: games/README.md. */
var Postie = (typeof Postie !== 'undefined') ? Postie : (function () {
  var P = { games: [], engines: {}, levels: {} };
  P.addLevels = function (id, arr) { P.levels[id] = arr; return arr; };
  P.engine = function (id, e) { P.engines[id] = e; return e; };
  P.register = function (g) { g.engine = g.engine || P.engines[g.id]; g.levels = g.levels || P.levels[g.id] || []; P.games.push(g); return g; };

  /* Colours — the only ones games may use (Milk / Apricot / Sage). Colour is never the only channel: pair it with a shape. */
  P.C = { milk: '#F5EFE5', card: '#FCF7EC', ink: '#536342', txt: '#2F3A26', mut: '#7B8470', line: '#D8C6A9', sand: '#EDE5D4',
    apr: '#E8B093', sage: '#B1BA96', blue: '#AECAD1', butter: '#F1CA7D', bad: '#B0603A' };
  /* Palette slots for game pieces, in order: each comes with its own shape. */
  P.PIECES = [{ k: 'apr', c: '#E8B093', s: 't' }, { k: 'blue', c: '#AECAD1', s: 'o' }, { k: 'sage', c: '#B1BA96', s: 's' }, { k: 'butter', c: '#F1CA7D', s: 'd' }, { k: 'sand', c: '#D8C6A9', s: 'x' }, { k: 'ink', c: '#536342', s: 'p' }];

  if (typeof document === 'undefined') return P;

  /* element helper: h('div', {class, style, html, onclick, ...attrs}, [children]) */
  P.h = function (tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k]; if (v == null || v === false) continue;
      if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k === 'style') e.style.cssText = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
    }
    (kids || []).forEach(function (c) { if (c != null && c !== false) e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c); });
    return e;
  };

  /* line icons, 24px grid, stroke 1.6 */
  var I = {
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>', redo: '<path d="M20 12a8 8 0 11-3-6.2M20 4v5h-5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 115 0c0 1.8-2.5 2-2.5 4M12 17v.3"/>',
    hint: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>',
    envelope: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>', left: '<path d="M19 12H5M11 6l-6 6 6 6"/>', right: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  P.icon = function (n, cls) { return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (I[n] || '') + '</svg>'; };

  /* piece shapes: t triangle, o circle, s square, d diamond, x cross, p pentagon. Drawn white-free, ink outline. */
  var S = {
    o: '<circle cx="12" cy="12" r="7.5"/>', t: '<path d="M12 4.5l8 14H4z"/>', s: '<rect x="5" y="5" width="14" height="14" rx="3"/>',
    d: '<path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12z"/>', x: '<path d="M8 4h8v4h4v8h-4v4H8v-4H4V8h4z"/>', p: '<path d="M12 3.8l8.2 6-3.1 9.6H6.9L3.8 9.8z"/>'
  };
  P.shape = function (s, fill, cls) {
    return '<svg class="pc ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" style="fill:' + (fill || 'none') + '">' + (S[s] || S.s) + '</svg>';
  };

  P.shake = function (el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };
  P.pop = function (el) { if (!el) return; el.classList.remove('popin'); void el.offsetWidth; el.classList.add('popin'); };

  /* Gestures — the whole app uses only these three: tap, drag, swipe (one finger). */
  /* swipe(el, cb(dir)) : dir = up|down|left|right after >= 22px; a short touch calls onTap if given */
  P.swipe = function (el, cb, onTap) {
    var sx, sy, on = false;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; on = true; try { el.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
    el.addEventListener('pointerup', function (e) {
      if (!on) return; on = false; var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) { if (onTap) onTap(); return; }
      cb(Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    });
    el.addEventListener('pointercancel', function () { on = false; });
  };
  /* cellAt(container, x, y): nearest ancestor with data-r/data-c (or data-i) under the point */
  P.cellAt = function (box, x, y) {
    var e = document.elementFromPoint(x, y);
    while (e && e !== box && !(e.dataset && (e.dataset.r !== undefined || e.dataset.i !== undefined))) e = e.parentNode;
    if (!e || e === box || !e.dataset) return null;
    return e.dataset.i !== undefined ? { i: +e.dataset.i, el: e } : { r: +e.dataset.r, c: +e.dataset.c, el: e };
  };
  /* drag(box, {start(cell,ev) -> bool, move(cell,ev), end(cell,ev), cancel()}) over cells inside box */
  P.drag = function (box, o) {
    var on = false;
    box.style.touchAction = 'none';
    box.addEventListener('pointerdown', function (e) { var c = P.cellAt(box, e.clientX, e.clientY); if (!c) return; if (o.start && o.start(c, e) === false) return; on = true; try { box.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
    box.addEventListener('pointermove', function (e) { if (!on) return; var c = P.cellAt(box, e.clientX, e.clientY); if (o.move) o.move(c, e); });
    box.addEventListener('pointerup', function (e) { if (!on) return; on = false; var c = P.cellAt(box, e.clientX, e.clientY); if (o.end) o.end(c, e); });
    box.addEventListener('pointercancel', function () { if (!on) return; on = false; if (o.cancel) o.cancel(); });
  };

  /* small building blocks games share */
  /* The stat line shows only what the player needs to finish the level: goals and limits ("Blocks left", "Moves left", "Lines 2 / 5").
     Plain counters and records (moves made, best, undo count) are not part of the game's logic and are not shown (author decision, 2026-11-16). */
  var NOSTAT = { Best: 1, Undo: 1, Moves: 1, Taps: 1, Shots: 1, Swaps: 1, Move: 1 };
  P.stat = function (pairs) {
    return pairs.filter(function (p) { return !NOSTAT[p[0]] && !(p[0] === 'Pieces' && typeof p[1] === 'number'); })
      .map(function (p) { return '<span>' + p[0] + ' <b>' + p[1] + '</b></span>'; }).join('');
  };
  P.btn = function (label, onclick, kind) { return P.h('button', { class: 'btn ' + (kind || ''), onclick: onclick }, [label]); };

  /* The hand (author 2026-11-19, as in stazzi): a finger that shows a gesture — on level 0, on the level that brings a new move,
     and on the "?" card. Points are page coordinates (clientX/Y); 1 point = tap, 2+ = drag along them;
     a list of such gestures ([[p], [q]]) = one after another (tap, then tap).
       var hd = Postie.hand(host)        host: a positioned element the hand is drawn over (pointer-events: none)
       hd.show(points)                   loop the gesture until hide()
       hd.play(points, root) -> Promise  do the gesture once and drive real pointer events, so the game makes the move itself
                                         (root: the board, may be closed to the player's touches — the hand still reaches it)
       hd.hide()                         */
  var HAND = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 30V9.5a3 3 0 016 0V22m0-1.5a3 3 0 016 0V24m0-1a3 3 0 016 0v2.5m0-.5a3 3 0 016 0V35c0 6.6-5 11-11.5 11H28c-3.8 0-6.4-1.6-8.4-4.4l-6.3-9a3.1 3.1 0 014.9-3.8L19 30"/></svg>';
  var still = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  P.hand = function (host) {
    var el = P.h('div', { class: 'hand', html: HAND, 'aria-hidden': 'true' }), anim = null, timer = null, gen = 0;
    host.appendChild(el);
    function rel(pt) { var b = host.getBoundingClientRect(); return { x: pt.x - b.left, y: pt.y - b.top }; }
    function frames(pts) {
      var r = pts.map(rel), kf = [], first = r[0], last = r[r.length - 1];
      var at = function (q, s, o, off) { return { transform: 'translate(' + q.x + 'px,' + q.y + 'px) scale(' + s + ')', opacity: o, offset: off }; };
      kf.push(at({ x: first.x + 18, y: first.y + 26 }, 1, 0, 0));
      kf.push(at(first, 1, 1, 0.18)); kf.push(at(first, 0.86, 1, 0.26));
      if (r.length === 1) kf.push(at(first, 1, 1, 0.38));
      else r.slice(1).forEach(function (q, i) { kf.push(at(q, 0.86, 1, 0.26 + 0.5 * (i + 1) / (r.length - 1))); });
      kf.push(at(last, 1, 1, 0.84)); kf.push(at(last, 1, 0, 1));
      return kf;
    }
    function dur(pts) { return pts.length === 1 ? 1300 : 2100; }
    function hide() { gen++; clearTimeout(timer); if (anim) anim.cancel(); anim = null; el.style.opacity = 0; }
    function seq(pts) { return pts && pts.length && Array.isArray(pts[0]) ? pts : [pts]; }
    function show(pts) {
      hide(); if (!pts || !pts.length || still || !el.animate) return;
      var g = gen, list = seq(pts), i = 0;
      (function loop() {
        if (g !== gen) return;
        var one = list[i]; anim = el.animate(frames(one), { duration: dur(one), easing: 'ease-in-out' });
        anim.onfinish = function () { if (g !== gen) return; i = (i + 1) % list.length; timer = setTimeout(loop, i ? 120 : 450); };
      })();
    }
    /* once, and the game feels real pointer events at the hand's fingertip */
    function play(pts, root) {
      var list = seq(pts);
      if (list.length > 1) return list.reduce(function (p, one) { return p.then(function (ok) { return ok === false ? false : playOne(one, root); }); }, Promise.resolve(true));
      return playOne(list[0], root);
    }
    function playOne(pts, root) {
      hide(); var g = gen;
      return new Promise(function (done) {
        var d = still || !el.animate ? 400 : dur(pts), t0 = null, phase = 0, id = 77, tgt = null;
        function ev(type, pt) {
          var pe = root ? root.style.pointerEvents : null; if (root) root.style.pointerEvents = 'auto';
          var t = type === 'pointerdown' ? (tgt = document.elementFromPoint(pt.x, pt.y)) : tgt;
          if (root) root.style.pointerEvents = pe;
          if (!t) return;
          t.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: id, isPrimary: true, clientX: pt.x, clientY: pt.y, button: 0, buttons: type === 'pointerup' ? 0 : 1 }));
          if (type === 'pointerup') t.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: pt.x, clientY: pt.y }));
        }
        function pointAt(k) { if (pts.length === 1) return pts[0]; var s = Math.min(pts.length - 1, k * (pts.length - 1)), i = Math.floor(s), f = s - i, a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)]; return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }; }
        if (!still && el.animate) anim = el.animate(frames(pts), { duration: d, easing: 'ease-in-out' });
        function tick(ts) {
          if (g !== gen) return done(false);
          if (t0 === null) t0 = ts;
          var k = (ts - t0) / d;
          if (phase === 0 && k >= 0.26) { ev('pointerdown', pts[0]); phase = 1; }
          if (phase === 1 && pts.length > 1) ev('pointermove', pointAt(Math.min(1, (k - 0.26) / 0.5)));
          if (phase === 1 && k >= 0.78) { ev('pointerup', pts[pts.length - 1]); phase = 2; }
          if (k >= 1) { el.style.opacity = 0; return done(true); }
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }
    return { show: show, play: play, hide: hide, el: el };
  };
  return P;
})();
if (typeof module !== 'undefined') module.exports = Postie;
