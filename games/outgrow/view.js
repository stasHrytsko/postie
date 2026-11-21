/* Outgrow — screen. Gesture: tap a territory (any of its cells) to grow it one layer. No undo (stazzi author decision): Retry / header restart.
   Free cells show small marks of every territory that would take them on its next tap (stazzi: "future layer dots"); a button hides them. */
(function () {
  var CSS = '' +
    '.og-goals{display:flex;justify-content:center;flex-wrap:wrap;gap:6px 16px;margin:4px 0 2px;font:600 15px var(--font);font-variant-numeric:tabular-nums;color:var(--txt)}' +
    '.og-goal{display:inline-flex;align-items:center;gap:5px;min-height:26px}' +
    '.og-goal svg.pc{width:20px;height:20px;stroke:none}' +
    '.og-goal.done{color:var(--ink)}.og-goal.done svg.ic{width:16px;height:16px;stroke-width:2.4}' +
    '.og-goal.over{color:var(--bad)}' +
    '.og-board .cell{border-radius:var(--r8)}' +
    '.og-board .cell.t{cursor:pointer}' +
    '.og-board .cell.t svg.pc{width:58%;height:58%}' +
    '.og-marks{display:flex;gap:2px;pointer-events:none;width:100%;justify-content:center}' +
    '.og-marks svg.pc{width:30%;height:auto;aspect-ratio:1;stroke:none}' +
    '.og-board.nomarks .og-marks{display:none}' +
    '.og-board .cell.lost{background:var(--bad);border-color:var(--bad)}' +
    '.og-board.stranded .cell.free{opacity:.45}';
  function css() { if (document.getElementById('og-css')) return; var s = document.createElement('style'); s.id = 'og-css'; s.textContent = CSS; document.head.appendChild(s); }
  var KEY = 'postie:outgrow:marks';
  function getMarks() { try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; } }
  function setMarks(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} }

  Postie.tr({
    '<b>Tap a colour</b> and it grows <b>one layer</b>: into every free cell next to it (small marks show where). Each colour must end <b>exactly</b> at its number. Only walls and other colours stop growth — grow one colour to <b>fence in</b> another. Fill every free cell to win.':
      '<b>Нажми на цвет</b>, и он вырастет <b>на один слой</b>: займёт все свободные клетки рядом с собой (их отмечают маленькие значки). Каждый цвет должен закончить <b>ровно</b> на своём числе. Рост останавливают только стены и другие цвета — выращивай один цвет, чтобы <b>отрезать</b> другой. Заполни все свободные клетки.',
    'Hide marks': 'Скрыть значки',
    'Show marks': 'Показать значки',
    'Retry': 'Заново',
    'Moves': 'Ходы',
    'Nowhere free to grow.': 'Расти некуда: рядом нет свободных клеток.',
    'Every colour fits · {n} taps': 'Все цвета на месте · нажатий: {n}',
    'Too big: {x} grew past its number. Each colour must end exactly at its number.': 'Перебор: цвет «{x}» вырос больше своего числа. Каждый цвет должен закончить ровно на своём числе.',
    'Nowhere to grow: only finished colours touch the free cells.': 'Расти некуда: к свободным клеткам примыкают только готовые цвета.',
    'Apricot': 'красный', 'Blue': 'синий', 'Sage': 'зелёный', 'Butter': 'жёлтый', 'Sand': 'серый',
    'free': 'свободно', 'wall': 'стена'
  });

  Postie.register({
    id: 'outgrow', name: 'Outgrow',
    rules: '<b>Tap a colour</b> and it grows <b>one layer</b>: into every free cell next to it (small marks show where). Each colour must end <b>exactly</b> at its number. Only walls and other colours stop growth — grow one colour to <b>fence in</b> another. Fill every free cell to win.',
    mount: function (root, ctx) {
      css();
      var h = Postie.h, E = ctx.engine, L = ctx.level, s = E.fresh(L), busy = false, marks = getMarks();
      var seedAt = {}; s.grid.forEach(function (v, i) { if (v > 0) seedAt[v] = i; });
      var stat = h('div', { class: 'stat' }), goals = h('div', { class: 'og-goals' }), msg = h('div', { class: 'msg' });
      var gap = L.w >= 7 ? 4 : 6, cellMax = L.w >= 7 ? 46 : 64;
      var grid = h('div', { class: 'grid og-board' + (marks ? '' : ' nomarks'), style: 'grid-template-columns:repeat(' + L.w + ',1fr);gap:' + gap + 'px;max-width:' + (L.w * cellMax + (L.w - 1) * gap) + 'px' });
      var markBtn = Postie.btn(marks ? 'Hide marks' : 'Show marks', function () {
        marks = !marks; setMarks(marks); grid.classList.toggle('nomarks', !marks); markBtn.textContent = Postie.t(marks ? 'Hide marks' : 'Show marks');
      }, 'o s');
      var retry = Postie.btn('Retry', reset, 's'); retry.style.display = 'none';
      root.appendChild(stat); root.appendChild(goals); root.appendChild(grid); root.appendChild(msg);
      root.appendChild(h('div', { class: 'row' }, [retry, markBtn]));

      function reset() { s = E.fresh(L); busy = false; msg.textContent = ''; msg.className = 'msg'; retry.style.display = 'none'; draw(); }
      function P(k) { return Postie.PIECES[k - 1]; }
      var NAME = { apr: 'Apricot', blue: 'Blue', sage: 'Sage', butter: 'Butter', sand: 'Sand' };

      grid.addEventListener('click', function (e) {
        var c = Postie.cellAt(grid, e.clientX, e.clientY);
        if (!c || busy || s.status !== 'playing') return;
        var k = s.grid[c.i];
        if (k <= 0) return;
        var grown = E.grow(s, k);
        if (!grown) { shakeTerritory(k); msg.className = 'msg'; msg.textContent = Postie.t('Nowhere free to grow.'); return; }
        msg.textContent = ''; msg.className = 'msg';
        draw(grown);
        busy = true;
        setTimeout(function () { busy = false; after(); }, 200);
      });

      function shakeTerritory(k) { grid.querySelectorAll('.cell').forEach(function (el, i) { if (s.grid[i] === k) Postie.shake(el); }); }

      function after() {
        if (s.status === 'won') { ctx.win(Postie.t('Every colour fits · {n} taps', { n: s.moves })); return; }
        if (s.status !== 'failed') return;
        msg.className = 'msg bad';
        if (s.reason === 'overgrown') {
          msg.textContent = Postie.t('Too big: {x} grew past its number. Each colour must end exactly at its number.', { x: Postie.t(NAME[P(s.overgrown).k]) });
          grid.querySelectorAll('.cell').forEach(function (el, i) { if (s.grid[i] === s.overgrown) el.classList.add('lost'); });
        } else {
          msg.textContent = Postie.t('Nowhere to grow: only finished colours touch the free cells.');
          grid.classList.add('stranded');
        }
        retry.style.display = '';
      }

      function draw(grown) {
        stat.innerHTML = Postie.stat([['Moves', s.moves]]);
        goals.innerHTML = '';
        L.need.forEach(function (need, j) {
          var k = j + 1, n = E.sizeOf(s, k), pc = P(k);
          goals.appendChild(h('span', { class: 'og-goal' + (n === need ? ' done' : n > need ? ' over' : ''),
            html: Postie.shape(pc.s, pc.c) + '<span>' + n + '/' + need + '</span>' + (n === need ? Postie.icon('check') : '') }));
        });
        grid.innerHTML = ''; grid.classList.remove('stranded');
        s.grid.forEach(function (v, i) {
          var cls = 'cell', kids = [];
          if (v === -1) cls += ' wall';
          else if (v === 0) {
            cls += ' free';
            var rs = E.reachers(s, i);
            if (rs.length) kids.push(h('div', { class: 'og-marks', html: rs.map(function (k) { return Postie.shape(P(k).s, P(k).c); }).join('') }));
          } else {
            cls += ' t c-' + P(v).k;
            if (seedAt[v] === i) kids.push(h('span', { style: 'display:contents', html: Postie.shape(P(v).s, 'none') }));
          }
          grid.appendChild(h('div', { class: cls, 'data-i': i, 'aria-label': v > 0 ? NAME[P(v).k] : v === 0 ? 'free' : 'wall' }, kids));
        });
        if (grown && grid.animate && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
          var cells = grid.children;
          grown.forEach(function (g) {
            var el = cells[g.i], dr = Math.floor(g.from / s.w) - Math.floor(g.i / s.w), dc = g.from % s.w - g.i % s.w;
            el.animate([{ transform: 'translate(' + (dc * 33) + '%,' + (dr * 33) + '%) scale(.6)' }, { transform: 'none' }], { duration: 160, easing: 'cubic-bezier(.3,1.4,.6,1)' });
          });
        }
      }
      draw();
    }
  });
})();
