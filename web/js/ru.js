/* Russian words of the shell (web/js/main.js). Game names stay in English (author 2026-11-21). Author 2026-11-21: the prototype speaks Russian
   until the polish is done; English stays (test > English). Keys are the English strings of the code — Postie.t in web/kit/kit.js.
   The words inside each game are in its own view.js; the letters — web/js/letters.js. */
Postie.tr({
  /* home */
  'Letters': 'Письма', 'Today': 'Сегодня', 'Games': 'Игры', 'test': 'тест',
  'Back': 'Назад', 'Rules': 'Правила', 'Restart': 'Заново', 'Close': 'Закрыть',
  'Light look': 'Светлая тема', 'Dark look': 'Тёмная тема',

  /* Today */
  'New letter': 'Новое письмо', 'Letter': 'Письмо', 'Tap to open': 'Нажми, чтобы открыть',
  '{n} of 3 solved': 'Решено {n} из 3', '{n} solved · stick 3 stamps': 'Решено {n} · наклей 3 марки', 'Ready to send': 'Можно отправлять',
  'Send it today. Tomorrow it is gone.': 'Отправь сегодня. Завтра его не будет.',
  'No letter': 'Письма нет', 'Sent. The next one comes tomorrow.': 'Отправлено. Следующее придёт завтра.',
  'Finish today’s puzzles →': 'Дорешать сегодняшние пазлы →', 'Unsolved puzzles burn with the letter tonight.': 'Нерешённые пазлы сгорят вместе с письмом сегодня ночью.',
  'mark': 'чёрточка', 'marks': 'чёрточки',

  /* the note and the puzzles */
  'Go to puzzles': 'К пазлам', 'Back to puzzles': 'Назад к пазлам',
  'Solve any 3 to send': 'Реши любые 3, чтобы отправить', 'Sent · finish if you like': 'Отправлено · можно дорешать',
  'Only {n} new levels left in stock — the level generator is not here yet.': 'Новых уровней в запасе осталось {n} — генератора уровней пока нет.',
  'To the envelope': 'К конверту',

  /* the envelope */
  'Stick 3 stamps': 'Наклей 3 марки', 'To: the postman': 'Кому: почтальону', 'Your stamps': 'Твои марки',
  'Only three stamps fit': 'Помещается только три марки',
  'Tap a stamp to stick it; tap it on the envelope to take it off.': 'Нажми на марку, чтобы наклеить; нажми на неё на конверте, чтобы снять.',
  'After you send: the other stamps burn, there are no more stamps today, and unsolved puzzles burn with the letter tonight.':
    'После отправки остальные марки сгорят, новых марок сегодня не будет, а нерешённые пазлы сгорят вместе с письмом ночью.',
  'Send letter': 'Отправить письмо', 'Stick {k} more': 'Наклей ещё {k}',

  /* a level */
  'Level {n}': 'Уровень {n}', 'Level 0 · how to play': 'Уровень 0 · как играть', 'How to play': 'Как играть', 'Got it': 'Понятно',
  'Solved': 'Решено', 'Now you know how {g} works.': 'Теперь ты знаешь, как устроена игра «{g}».', 'Play': 'Играть',
  'Level {n} of {m}': 'Уровень {n} из {m}', 'Next': 'Дальше', 'Back to levels': 'К уровням',
  '{n} of {m}': '{n} из {m}', '{k} more to send': 'ещё {k} до отправки', 'sent': 'отправлено', '{n} of {m} in {g}': '{n} из {m} в игре «{g}»',

  /* Games — the catalogue */
  'Empty for now': 'Пока пусто', 'Puzzles come here after you send the letter.': 'Пазлы появятся здесь, когда ты отправишь письмо.',
  'The catalog is open until {d}.': 'Каталог открыт до {d}.', 'The catalog is for playing more. The letter stays free.': 'Каталог — чтобы играть больше. Письмо остаётся бесплатным.',
  '{p}% solved': 'решено {p}%',
  'Every puzzle that came by mail is here. After that the catalog is paid. The letter and its five puzzles stay free forever.':
    'Здесь все пазлы, которые пришли по почте. Потом каталог станет платным. Письмо и его пять пазлов останутся бесплатными навсегда.',
  'The catalog is closed.': 'Каталог закрыт.',
  'The letter and its five puzzles are free forever. The catalog keeps every puzzle that came by mail, and more. It is for playing more.':
    'Письмо и его пять пазлов — бесплатно навсегда. В каталоге — все пазлы, что пришли по почте, и не только. Он — чтобы играть больше.',
  'Open the catalog': 'Открыть каталог',
  'The catalog': 'Каталог', 'Play more': 'Играть больше', 'Free forever': 'Бесплатно навсегда',
  'The letter, his words, five puzzles a day, the stamps, the envelope, the calendar.': 'Письмо, его слова, пять пазлов в день, марки, конверт, календарь.',
  'Every puzzle of every game that came by mail — solved, unsolved, burnt — and more.': 'Все пазлы всех игр, что пришли по почте, — решённые, нерешённые, сгоревшие — и не только.',
  '$1.99 a month': '$1.99 в месяц', '$14.99 a year': '$14.99 в год', '$24.99 forever': '$24.99 навсегда',

  /* Letters — the calendar */
  'letter sent': 'письмо отправлено', 'letters sent': 'письма отправлено', 'not sent': 'не отправлено', 'today': 'сегодня',
  'Previous month': 'Прошлый месяц', 'Next month': 'Следующий месяц',

  /* test */
  'Test': 'Тест', 'Prototype tools': 'Инструменты прототипа', 'All games and levels': 'Все игры и уровни', 'Next day': 'Следующий день',
  'Solve 3 puzzles of today': 'Решить 3 пазла дня', 'Buy the catalog': 'Купить каталог', 'Cancel the catalog purchase': 'Отменить покупку каталога',
  'Reset everything': 'Сбросить всё', 'Reset all progress?': 'Сбросить весь прогресс?',
  'All levels': 'Все уровни', '{g} games · {n} levels': 'Игр: {g} · уровней: {n}', 'In the game': 'В игре', 'Bench': 'Запасные', '{n} levels': 'Уровней: {n}'
});
