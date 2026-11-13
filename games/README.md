# Игры

Папка под каждую игру Postie (решение автора, 2026-11-02). **С 2026-11-13 в папке игры лежит всё: документы, все уровни, движок, экран, иконка и тест.** Сайт (`web/`) берёт игры прямо отсюда (`web/games` — ссылка на эту папку). В Unity код уйдёт в `unity/Assets/PocketPuzzle/Games/<Game>/` (`TECH-UNITY.md` §5); уровни отсюда — источник для экспорта в JSON.

Игры с витрины stazzi в статусе Ready (больше 10 уровней) перенесены сюда целиком со всеми уровнями (решение автора, 2026-11-13). Движки переписаны на чистый JS без кита stazzi, экраны — на ките Postie (`web/kit/`). Правила stazzi к Postie не относятся.

| Папка | Игра | Откуда | Уровней |
|---|---|---|---|
| `arrow-flip/` | Arrow Flip | stazzi `apps/casual/arrow-flip` | [после порта] |
| `perfect-fit/` | Perfect Fit | stazzi `apps/casual/perfect-fit` | [после порта] |
| `the-gap/` | The Gap | stazzi `apps/casual/the-gap` | [после порта] |
| `slide-out/` | Slide Out | stazzi `apps/casual/slide-out` | [после порта] |
| `tight-shelf/` | Tight Shelf | stazzi `apps/casual/tight-shelf` | [после порта] |
| `carpet-layers/` | Carpet Layers | stazzi `apps/casual/carpet-layers` | [после порта] |
| `outgrow/` | Outgrow | stazzi `apps/casual/outgrow` | [после порта] |
| `parcels/` | Parcels (+ правила бывшей Cave In) | stazzi `apps/casual/parcels` + postie | [после порта] |
| `streams/` | Streams | stazzi `apps/casual/rusla` | [после порта] |
| `pair-up/` | Pair Up | stazzi `apps/casual/pairs` | [после порта] |
| `hidden-stones/` | Hidden Stones | stazzi `apps/casual/hidden-stones` | [после порта] |
| `nest/` | Nest | stazzi `apps/casual/nested-tangram` | [после порта] |
| `recruit-ladder/` | Recruit Ladder | stazzi `apps/midcore/recruit-ladder` | [после порта] |
| `shadow-step/` | Shadow Step | только postie (в stazzi — прототип) | 2 |
| `paint-ladder/` | Paint Ladder | только postie | 1 |
| `one-each/` | One Each | только postie | 1 |

Порядок в галерее — `web/games.js`.

## Что лежит в папке игры

| Файл | Что это |
|---|---|
| `README.md` | Карточка игры: правила, что на экране, уровни и как считается сложность, отличия от stazzi, открытые вопросы. |
| `IDEA.md` | Идея из stazzi (история решений). |
| `levels.js` | **Все уровни**: `Postie.addLevels('<id>', [ ... ])`. У каждого уровня — данные поля, `difficulty` (1 лёгкий · 2 средний · 3 трудный — для волны в письме), где есть — `best` (минимум ходов) и `solution` (решение, которое проверяет тест). Формат описан комментарием в начале файла. |
| `engine.js` | Чистые правила, без DOM: `Postie.engine('<id>', { fresh(level), ...ходы..., won(state) })`. Загружается и в браузере, и в Node. |
| `view.js` | Экран: `Postie.register({ id, name, rules, mount(root, ctx) })`. `ctx`: `level` (объект уровня), `n` (номер с 1), `engine`, `win(text)`, `cleanup(fn)`. Шапку (назад, Level N, правила, заново), экран уровней и «Well done» рисует оболочка. |
| `icon.svg` | Иконка для галереи: 120×120, скругление 26, мини-поле игры в цветах кита. |
| `test.js` | `module.exports = (engine, levels, check) => { ... }` — прогоняет решение **каждого** уровня через движок. Все игры: `node tests/run.js`, одна: `node tests/run.js <id>`. |
| `tools/` | Солвер и генератор (по желанию), если нужны для уровней. |

## Общие правила для всех игр

- **Кит Postie** (`web/kit/kit.css`, `web/kit/kit.js`): цвета только из токенов (Milk, Ink, Apricot, Sage, Blue, Butter, Line), фишки — `Postie.PIECES` (у каждого цвета своя форма: цвет не единственный канал), иконки — `Postie.icon`, формы — `Postie.shape`.
- **Один палец, не больше трёх жестов на всё приложение:** тап, перетаскивание, свайп (`Postie.swipe`, `Postie.drag`). Ни мультитача, ни долгого нажатия, ни двойного тапа.
- **Таймеров нет нигде** (решение автора, 2026-11-03). Где в stazzi был отсчёт времени — убран; счётчики, если нужны, считают ходы.
- Решение для теста есть у каждого уровня; уровни не выдумываем — только из stazzi (или из солвера, если в stazzi уровни генерируются).
- Игра не подсказывает проигрыш заранее; исход не зависит от случайности.
- Язык интерфейса — английский; документы — по-русски.
