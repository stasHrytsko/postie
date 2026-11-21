/* Shadow Step — screen. Gestures: tap a card, tap a cell. */
(function () {
  Postie.tr({
    '<b>Tap a card, then a cell</b> to move the blue piece. Reach the crystal before the cards run out. After each move the <b>red piece makes the same move</b>, picking the cell closest to you. If red lands on you, you lose. Each card works once.':
      '<b>Нажми на карту, потом на клетку</b>, чтобы пойти синей фишкой. Доберись до кристалла, пока не кончились карты. После каждого твоего хода <b>красная фишка делает такой же ход</b> и выбирает клетку ближе к тебе. Если красная встанет на твою клетку — проигрыш. Каждая карта — на один ход.',
    'Step': 'Шаг',
    'Diagonal': 'Вкось',
    'Knight': 'Конь',
    'Line ≤3': 'Прямо ≤3',
    'Dash 2': 'Рывок 2',
    'Sideways': 'Вбок',
    'Up-down ≤2': 'Вверх-вниз ≤2',
    'This level: passing over the other piece on a line loses.': 'На этом уровне нельзя проходить через чужую фишку: пройдёшь — проиграешь.',
    'Pieces may pass over each other.': 'Фишки могут проходить друг через друга.',
    'Your hand': 'Твои карты',
    'Undo': 'Отменить',
    'Pick one of the outlined cells.': 'Выбери одну из выделенных клеток.',
    'Crystal reached': 'Кристалл твой',
    'Out of cards. Undo or restart.': 'Карты кончились. Отмени ход или начни заново.',
    'You passed over red. Undo or restart.': 'Через красную проходить нельзя. Отмени ход или начни заново.',
    'Red caught you. Undo or restart.': 'Красная тебя поймала. Отмени ход или начни заново.'
  });
  var NAMES = { step: 'Step', diag: 'Diagonal', knight: 'Knight', line3: 'Line ≤3', dash2: 'Dash 2', side: 'Sideways', ud2: 'Up-down ≤2' };
  Postie.register({
    id: 'shadow-step', name: 'Shadow Step',
    rules: '<b>Tap a card, then a cell</b> to move the blue piece. Reach the crystal before the cards run out. After each move the <b>red piece makes the same move</b>, picking the cell closest to you. If red lands on you, you lose. Each card works once.',
    mount: function (root, ctx) {
      var h = Postie.h, E = ctx.engine, L = ctx.level, s = E.fresh(L), sel = null, hist = [];
      var msg = h('div', { class: 'msg' }), note = h('div', { class: 'msg', style: 'font-size:14px;margin-top:0' }, [L.jump === 'B' ? 'This level: passing over the other piece on a line loses.' : 'Pieces may pass over each other.']);
      var grid = h('div', { class: 'grid', style: 'grid-template-columns:repeat(5,1fr);max-width:330px;gap:5px' }), hand = h('div', { class: 'chips', style: 'margin-top:4px' });
      root.appendChild(note); root.appendChild(grid); root.appendChild(h('div', { class: 'lbl', style: 'text-align:center' }, ['Your hand'])); root.appendChild(hand); root.appendChild(msg);
      root.appendChild(h('div', { class: 'row' }, [Postie.btn('Undo', function () { if (!hist.length) return; s = hist.pop(); sel = null; msg.textContent = ''; msg.className = 'msg'; draw(); }, 'o s')]));
      function piece(color, shape) { return h('div', { style: 'width:70%;height:70%;border-radius:50%;display:grid;place-items:center;background:' + color + ';box-shadow:0 0 0 2px var(--txt)', html: Postie.shape(shape, 'none') }); }
      function draw() {
        grid.innerHTML = ''; var can = sel ? E.dests(s, sel) : [];
        for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) (function (r, c) {
          var at = function (p) { return p[0] === r && p[1] === c; }, wall = L.board[r][c] === '#';
          var isB = at(s.blue), isR = at(s.red), isC = at(s.crystal), hit = can.some(at);
          var el = h('div', { class: 'cell' + (wall ? ' wall' : '') + (hit ? ' sel' : '') + (isC && !isB ? ' c-butter' : '') });
          if (isB) el.appendChild(piece('var(--blue)', 'o')); else if (isR) el.appendChild(piece('var(--apr)', 't')); else if (isC) el.innerHTML = Postie.shape('d', 'none');
          el.addEventListener('click', function () {
            if (!sel || s.status !== 'playing') return;
            var prev = JSON.parse(JSON.stringify(s)); prev.L = L;
            if (!E.play(s, sel, [r, c])) { Postie.shake(el); msg.textContent = Postie.t('Pick one of the outlined cells.'); return; }
            hist.push(prev); sel = null; msg.textContent = ''; draw();
            if (s.status === 'won') ctx.win(Postie.t('Crystal reached'));
            if (s.status === 'lost') { msg.className = 'msg bad'; msg.textContent = Postie.t(s.why === 'cards' ? 'Out of cards. Undo or restart.' : s.why === 'jumped' ? 'You passed over red. Undo or restart.' : 'Red caught you. Undo or restart.'); }
          });
          grid.appendChild(el);
        })(r, c);
        hand.innerHTML = '';
        L.hand.forEach(function (card) { var used = s.hand.indexOf(card) < 0; hand.appendChild(h('button', { class: 'chip' + (sel === card ? ' on' : '') + (used ? ' used' : ''), style: 'padding:0 8px;font-size:15px', onclick: function () { if (!used && s.status === 'playing') { sel = card; draw(); } } }, [NAMES[card]])); });
      }
      draw();
    }
  });
})();
