/* Postie shell: gallery (#/), level grid (#/<id>), level (#/<id>/<n>). Progress lives in localStorage on this device. */
(function () {
  var h = Postie.h, app = document.getElementById('app');
  var cleanups = [];
  function clean() { cleanups.forEach(function (f) { try { f(); } catch (e) {} }); cleanups = []; }

  /* progress: { gameId: [passed level numbers, 1-based] } */
  var done = {};
  try { done = JSON.parse(localStorage.getItem('postie:done') || '{}') || {}; } catch (e) {}
  Object.keys(done).forEach(function (k) { if (!Array.isArray(done[k])) delete done[k]; });
  function save() { try { localStorage.setItem('postie:done', JSON.stringify(done)); } catch (e) {} }
  function passed(g) { return (done[g.id] || []).filter(function (n) { return n <= total(g); }); }
  function total(g) { return g.levels.length || 1; }
  function nextLevel(g) { var p = passed(g); for (var n = 1; n <= total(g); n++) if (p.indexOf(n) < 0) return n; return total(g); }
  function pct(g) { return Math.round(passed(g).length / total(g) * 100); }

  function gallery() {
    clean(); app.innerHTML = '';
    var tiles = h('div', { class: 'tiles' });
    Postie.games.forEach(function (g) {
      var p = pct(g);
      tiles.appendChild(h('button', { class: 'tile', 'aria-label': g.name + ', ' + p + '% done', onclick: function () { location.hash = '#/' + g.id; } }, [
        h('div', { class: 'art' }, [h('img', { src: 'games/' + g.id + '/icon.svg', alt: '' })]),
        h('b', null, [g.name]),
        h('div', { class: 'pr' }, [h('i', { style: 'width:' + p + '%' }), h('span', null, [p + '%'])])
      ]));
    });
    app.appendChild(h('main', null, [
      h('h1', { class: 'gal-h' }, ['Games']),
      tiles,
      h('p', { class: 'msg', style: 'margin-top:26px' }, ['Preview build · progress is saved on this device.']),
      h('p', { class: 'msg' }, [h('a', { class: 'lnk', href: 'design.html' }, ['Design references']), ' · ', h('a', { class: 'lnk', href: 'app.html' }, ['Letter flow'])])
    ]));
  }

  function levelsPage(g) {
    clean(); app.innerHTML = '';
    var p = passed(g), cur = nextLevel(g), n = p.length, T = total(g);
    app.appendChild(h('header', null, [
      h('button', { class: 'ib', 'aria-label': 'All games', html: Postie.icon('back'), onclick: function () { location.hash = '#/'; } }),
      h('div', { class: 't' }, [h('h1', null, [g.name])]), h('span', { class: 'sp' })]));
    var grid = h('div', { class: 'lvgrid' });
    for (var i = 1; i <= T; i++) (function (i) {
      var isDone = p.indexOf(i) >= 0, isCur = !isDone && i === cur;
      grid.appendChild(h('button', { class: 'lv' + (isDone ? ' done' : isCur ? ' cur' : i > cur ? ' far' : ''), 'aria-label': 'Level ' + i,
        onclick: function () { location.hash = '#/' + g.id + '/' + i; },
        html: (isDone ? Postie.icon('check') : isCur ? Postie.icon('play') : '') + '<span>' + i + '</span>' }));
    })(i);
    app.appendChild(h('main', null, [
      h('div', { class: 'prog' }, [h('div', { class: 'bar' }, [h('i', { style: 'width:' + Math.round(n / T * 100) + '%' })]), h('b', null, [n + ' of ' + T])]),
      grid]));
    app.appendChild(h('div', { class: 'bottom' }, [h('button', { class: 'btn w', onclick: function () { location.hash = '#/' + g.id + '/' + cur; } }, ['Play · level ' + cur])]));
  }

  function play(g, lv) {
    clean(); app.innerHTML = '';
    var body = h('main'), rulesBox = h('div', { class: 'rules', html: g.rules || '' });
    var seen = false; try { seen = localStorage.getItem('postie:rules:' + g.id) === '1'; } catch (e) {}
    rulesBox.style.display = seen && lv > 1 ? 'none' : '';
    function mount() {
      clean(); body.innerHTML = '';
      if (g.rules) body.appendChild(rulesBox);
      var root = h('div', { class: 'stage' }); body.appendChild(root);
      g.mount(root, {
        n: lv, level: g.levels[lv - 1], engine: g.engine,
        win: function (text) {
          try { localStorage.setItem('postie:rules:' + g.id, '1'); } catch (e) {}
          var p = passed(g); if (p.indexOf(lv) < 0) { p.push(lv); done[g.id] = p; save(); }
          var hasNext = lv < total(g);
          setTimeout(function () {
            var ov = h('div', { class: 'ov' }, [h('div', { class: 'dlg' }, [
              h('div', { class: 'chk', html: Postie.icon('check') }), h('h2', null, ['Well done']), h('p', null, [text || 'Level ' + lv + ' solved']),
              hasNext ? h('button', { class: 'btn', onclick: function () { location.hash = '#/' + g.id + '/' + (lv + 1); } }, ['Next']) : null,
              h('button', { class: hasNext ? 'btn o' : 'btn', onclick: function () { location.hash = '#/' + g.id; } }, ['All levels']),
              h('button', { class: 'btn o', onclick: function () { ov.remove(); mount(); } }, ['Play again'])
            ])]);
            document.body.appendChild(ov);
          }, 380);
        },
        cleanup: function (f) { cleanups.push(f); }
      });
    }
    app.appendChild(h('header', null, [
      h('button', { class: 'ib', 'aria-label': 'Levels', html: Postie.icon('back'), onclick: function () { location.hash = '#/' + g.id; } }),
      h('div', { class: 't' }, [h('h1', null, ['Level ' + lv]), h('small', null, [g.name])]),
      h('button', { class: 'ib', 'aria-label': 'How to play', html: Postie.icon('help'), onclick: function () { rulesBox.style.display = rulesBox.style.display === 'none' ? '' : 'none'; } }),
      h('button', { class: 'ib', 'aria-label': 'Restart', html: Postie.icon('redo'), onclick: mount })
    ]));
    app.appendChild(body);
    mount();
  }

  function route() {
    document.querySelectorAll('.ov').forEach(function (o) { o.remove(); });
    var parts = (location.hash || '').replace(/^#\/?/, '').split('/'), id = parts[0], lv = parseInt(parts[1], 10);
    var g = Postie.games.filter(function (x) { return x.id === id; })[0];
    window.scrollTo(0, 0);
    if (!g) gallery(); else if (lv >= 1 && lv <= total(g)) play(g, lv); else levelsPage(g);
  }

  /* load every game folder in order: levels.js -> engine.js -> view.js */
  function load(src) { return new Promise(function (ok) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { console.warn('missing', src); ok(); }; document.body.appendChild(s); }); }
  var chain = Promise.resolve();
  POSTIE_GAMES.forEach(function (id) { ['levels', 'engine', 'view'].forEach(function (f) { chain = chain.then(function () { return load('games/' + id + '/' + f + '.js'); }); }); });
  chain.then(function () {
    Postie.games.sort(function (a, b) { return POSTIE_GAMES.indexOf(a.id) - POSTIE_GAMES.indexOf(b.id); });
    window.addEventListener('hashchange', route); route();
  });
})();
