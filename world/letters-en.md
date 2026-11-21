# Письма почтальона — тексты (база)

**Черновик Claude, 20 ноября 2026, по сборке письма автора (`CONCEPT.md` §3).** Голос — по `world/character.md` §0, §7 (английский: короткие слова, без сокращений, без идиом, без «!»), §9. Русский рядом; **в прототипе пока идёт русский (решение автора, 2026-11-21), английский — вторым языком.** В игре оба языка — `web/js/letters.js`: править текст там и здесь вместе. Источник многих строк — `world/letters-draft.md` (ID в скобках).

Сборка письма: день 1 — вступительное; вчера отправил — **реакция на марки** (ниже, часть 2) + **его фраза** (часть 3, позже); вчера не отправил — только чёрточки, текста нет.

---

## 1. Вступительное письмо (день 1) **[принято автором, 2026-11-20]**

Каждое предложение — с новой строки.

**RU.**
Это первое письмо.
Я не знаю, кто ты.
Знаю только, что у тебя есть стол, стул и что ты открыл этот конверт.
Там пять пазлов.
Пока решаешь, нас двое.
Реши три. Наклей три марки.
Отправь сегодня.
Завтра я отвечу.
Больше я о тебе ничего не узнаю. Мне этого хватит.

**EN** (живой и правильный английский, но с лёгким привкусом машины: перечисление со счётом, служебное *affix*, *sufficient*, без сокращений — по просьбе автора):
This is the first letter.
I do not know who you are.
I know three things: you have a table, you have a chair, and you opened this envelope.
There are five puzzles inside.
While you solve, there are two of us.
Solve three. Affix three stamps.
Send it today.
Tomorrow I will reply.
I will learn nothing else about you. That is sufficient.

---

## 2. Реакции на марки

Он замечает **одно** — первое, что подходит, в порядке сверху вниз. Варианты одного рисунка идут по очереди, не повторяются, пока не кончатся. Игру и номер не называет никогда.

> **Важно (проверено по прототипу, 2026-11-20):** при 5 задачах в письме и 3+ играх в дне одна игра даёт не больше двух задач — **трёх одинаковых марок не бывает**. Поэтому «три одинаковые» (R-01) и «та же марка N-й конверт» (R-06) переделаны: «одна игра в каждом конверте N дней подряд». «Три лёгких / три трудных» (R-03) при 2/2/1 тоже невозможны — вместо них «среди марок есть трудная».

### 2.1 Конверт после перерыва (под чёрточками)

1. **EN.** There was an envelope in the mailbox. I checked the address twice. Yours.
   **RU.** В почтомате был конверт. Адрес я проверил дважды. Твой.
2. **EN.** The mailbox was not empty today. I stood next to it for a while before I opened it.
   **RU.** Сегодня почтомат был не пустой. Я постоял рядом, прежде чем открыть.

### 2.2 Самый первый конверт

1. **EN.** The envelope came. I put it on the table. Until evening I put nothing next to it.
   **RU.** Конверт пришёл. Я положил его на стол. До вечера ничего рядом не клал.
2. **EN.** Your envelope is here. I read the address twice. It was right both times.
   **RU.** Твой конверт здесь. Я прочитал адрес дважды. Оба раза верно.

### 2.3 Одна игра в каждом конверте, N дней подряд (N ≥ 3)

1. **EN.** This stamp again. The {N}th envelope. One man walked to the post office by the same road for seven years. He knew the other road.
   **RU.** Опять эта марка. {N}-й конверт. Один человек семь лет ходил на почту одной дорогой. Другую он знал. (R-06)
2. **EN.** {N} envelopes, and this stamp on every one. I keep them in one pile. The pile is taller than the cup now.
   **RU.** {N} конвертов, и на каждом эта марка. Я держу их в одной стопке. Стопка уже выше кружки.

### 2.4 Ушёл от игры, которая была N ≥ 3 конвертов подряд

1. **EN.** One stamp is missing today. The one that came every day. I left its place on the table last night. It is empty. I did not clear it.
   **RU.** Сегодня нет одной марки. Той, что приходила каждый день. Её место на столе я оставил с вечера. Оно пустое. Убирать не стал.
2. **EN.** A different envelope today. The old pile is still on the table. I did not move it.
   **RU.** Сегодня конверт другой. Старая стопка лежит на столе. Я её не трогал.

### 2.5 Вернулся к игре, которой давно не было

1. **EN.** I already have a stamp like this one. I put the new one next to it. The stamps are the same. The envelopes are not.
   **RU.** Такая марка у меня уже есть. Я положил новую рядом. Марки одинаковые. Конверты нет.
2. **EN.** This stamp came back. I had to look for its pile. It was where I left it.
   **RU.** Эта марка вернулась. Пришлось искать её стопку. Она лежала там, где я её оставил.

### 2.6 Новая игра впервые

1. **EN.** A new stamp. I did not have one like it on my table. I made room for it. There was more room than I thought.
   **RU.** Новая марка. Такой у меня на столе ещё не было. Я освободил для неё место. Его оказалось много. (R-05)
2. **EN.** A stamp I have not seen before. I turned it over. Nothing on the back. I put it down carefully.
   **RU.** Марка, которой я раньше не видел. Я перевернул её. На обороте ничего. Положил осторожно.

### 2.7 Те же три игры, что вчера

1. **EN.** The same three as yesterday. A different order. Yesterday I read from left to right. Today I do not know where to start.
   **RU.** Те же три, что вчера. Порядок другой. Вчера я читал слева направо. Сегодня не знаю, откуда начать.
2. **EN.** The same three as yesterday. I checked whether yesterday's envelope had come back. It had not. This one is new.
   **RU.** Те же три, что вчера. Я проверил, не вернулся ли вчерашний конверт. Нет. Этот новый.

### 2.8 Среди марок есть трудная

1. **EN.** One of the three was not easy. I put it in the middle. The other two can lean on it.
   **RU.** Одна из трёх далась нелегко. Я положил её посередине. Двум другим есть на что опереться.
2. **EN.** There is a hard one among them. I will not say which. You know.
   **RU.** Среди них есть трудная. Какая — не скажу. Ты знаешь.

### 2.9 Две одинаковые и одна другая

1. **EN.** Two alike and one different. I do not know which one is extra. Maybe two.
   **RU.** Две одинаковые и одна другая. Не знаю, какая здесь лишняя. Может быть, две.
2. **EN.** Two of one kind and one of another. I put the single one on top. Then at the bottom. Then back on top.
   **RU.** Две одного вида и одна другого. Я положил её сверху. Потом вниз. Потом опять наверх.

### 2.10 Три разные (всё остальное)

1. **EN.** Three different. I laid them out on the table and moved them around for a long time. I found no order. I left them as they were.
   **RU.** Три разные. Я разложил их на столе и долго менял местами. Порядка не нашёл. Оставил так. (R-02)
2. **EN.** Three stamps, three different ones. I put each in its own pile.
   **RU.** Три марки, все разные. Разложил каждую по своей стопке.
3. **EN.** Three different. So there are three piles today, not one.
   **RU.** Три разные. Значит, сегодня три стопки, а не одна.

---

## 3. Его фразы

### 3.1 Мысли по играм

Идёт в письмо, если игра была на вчерашнем конверте и её мысль ещё не сказана; одна мысль — один раз. Игру он не называет. Пробы — `world/character.md` §9; вещи не из канона (монеты, краска на двери, ковры) — поставить в канон.

| Игра | RU | EN |
|---|---|---|
| Streams | Однажды я стоял на развилке. Все пошли в одну сторону. Я посчитал обе дороги. Вторая до сих пор пустая. | I once stood at a fork. Everyone went one way. I calculated both roads. The second one is still empty. |
| Parcels | С полки забрали одну посылку. Остальные опустились ниже. Ни одна не осталась на своём месте. Забрали только одну. | One parcel was taken from the shelf. The others moved down. None of them stayed in its place. Only one was taken. |
| Knock Through | Я знаю, сколько у вас там комнат. Сколько между ними стен, меня никто не спрашивал. | I know how many rooms there are in there. No one has asked me how many walls are between them. |
| Square Up | Один человек вернул соседу три монеты и написал: «Теперь мы в расчёте». В конце приписал: «Жаль». Я девятнадцать лет думаю, чего ему было жаль. | A man returned three coins to his neighbour. He wrote: "Now we are even." At the end he added: "A pity." I have been thinking about what was a pity for nineteen years. |
| Perfect Fit | У вас там всё сходится без остатка. Я проверял. Снаружи после любого дела что-нибудь остаётся: обрезок, крошка, лишний гвоздь. Я их не выбрасываю. | In there, everything adds up with nothing left over. I checked. Out here, every job leaves something behind: an offcut, a crumb, one extra nail. I do not throw them away. |
| Outgrow | Трава у почтамта растёт без числа. Никто не сказал ей, сколько будет достаточно. Она до сих пор не остановилась. | The grass by the post office grows without a number. No one told it how much is enough. It has not stopped. |
| Arrow Flip | Одна женщина прошла через зал и не остановилась. Трое повернули головы. Один из них потом написал об этом четыре письма. | A woman crossed the hall and did not stop. Three people turned their heads. One of them later wrote four letters about it. |
| The Gap | В ячейках сортировки я всегда оставляю одну пустую. Если занять все, ни одно письмо нельзя переложить. | In the sorting rack I always leave one slot empty. If every slot is full, no letter can be moved. |
| Carpet Layers | Под краской на двери другая краска. Под ней третья. Я дошёл до дерева и остановился. Дверь я не открывал. | Under the paint on the door there is other paint. Under that, a third coat. I reached the wood and stopped. I did not open the door. |
| Shadow Step | Я хожу тем же путём, каким шёл последний человек на этой улице. Следов давно нет. Я помню, где они были. | I walk the same route as the last person on this street. The footprints are long gone. I remember where they were. |
| Bracket *(ещё в stazzi)* | Раньше у вас считали, кто первый. Второго помнили неделю. О том, кто выбыл в первом круге, я нашёл одно письмо. Он писал, что день был хороший. | You used to count who came first. The second was remembered for a week. About the one who lost in the first round, I found one letter. He wrote that it had been a good day. |
| Hidden Stones *(запасная)* | Камня под листом не видно. Видно, куда отскочила капля. Я знаю о камнях много. Ни одного не видел. | You cannot see the stone under the leaf. You can see where the drop bounced. I know a great deal about stones. I have never seen one. |

### 3.2 Общие фразы

Случайная, если у игры со вчерашнего конверта нет несказанной мысли; без повторов, пока база не кончится. Источник — ID из `letters-draft.md` («новое» — написано сейчас, по вопросам мира `WORLD.md` §0.0). «Девять / десять» заменены на «пять».

Всего: 43.

| ID | Вид | RU | EN | Откуда | Условие / тема |
|---|---|---|---|---|---|
| G-01 | о ремесле | У каждого пазла один ответ. Я знаю все пять. Не знаю только, какие три выберешь ты. | Every puzzle has one answer. I know all five. I do not know which three you will choose. | L-01 |  |
| G-02 | о ремесле | Я решаю такой пазл быстрее, чем ты моргнёшь. Поэтому я их не решаю. Я их ношу. | I solve a puzzle like this faster than you can blink. That is why I do not solve them. I carry them. | L-02 |  |
| G-03 | о ремесле | Раньше здесь решали по тысяче в день и считали, кто быстрее. Я приношу пять. Времени теперь много. Раньше его не было. | People here used to solve a thousand a day and count who was faster. I bring five. There is a lot of time now. Before, there was none. | L-04 |  |
| G-04 | медленное | Завтрашний конверт уже собран. Не хватает письма. Я напишу его, когда придёт твой. | Tomorrow's envelope is already packed. The letter is missing. I will write it when yours arrives. | L-05 |  |
| G-05 | медленное | Я хожу пешком. Мог бы не ходить вовсе. Но тогда письмо приходило бы ниоткуда. | I go on foot. I could choose not to go at all. Then the letter would come from nowhere. | L-06 |  |
| G-06 | медленное | Мне не нужно спать. Но между твоим конвертом и моим письмом проходит ночь. Я её ничем не заполняю. Кажется, это называется ждать. | I do not need to sleep. But a night passes between your envelope and my letter. I do not fill it with anything. I believe this is called waiting. | L-07 |  |
| G-07 | снаружи | Сегодня шёл дождь. Я стоял под ним дольше, чем нужно. Никто не сказал мне зайти. | It rained today. I stood in it longer than necessary. No one told me to come inside. | L-08 |  |
| G-08 | снаружи | В комнате смены сорок кружек. Раз в год я мою все сорок. Свою мыть не надо: у меня её нет. | There are forty cups in the staff room. Once a year I wash all forty. I do not wash my own. I do not have one. | L-09 |  |
| G-09 | снаружи | Я проверил все двери на этой улице. Заперта только одна. Изнутри. | I checked every door on this street. Only one is locked. From the inside. | L-11 |  |
| G-10 | снаружи | Бумага для этого письма пожелтела с одного края. Я не стал исправлять. У вас там и так исправлено всё. | The paper for this letter has yellowed along one edge. I did not correct it. Everything in there has been corrected already. | L-12 |  |
| G-11 | снаружи | Сегодня на улице горел фонарь. Днём. Я проверил: он горит одиннадцать лет. Никто так и не решил, что это странно. | A streetlight was on today. In daylight. I checked. It has been on for eleven years. No one ever decided that this was strange. | новое | нормализация абсурда |
| G-12 | снаружи | Последний трамвай кончился не в один день. Сначала ходил реже. Потом по праздникам. Потом его просто перестали ждать. | The last tram did not end in one day. First it came less often. Then only on holidays. Then people simply stopped waiting for it. | новое | апокалипсис как процесс |
| G-13 | снаружи | Небо сегодня было зелёным. Или я так его посчитал. Других свидетелей нет. | The sky was green today. Or that is how I counted it. There are no other witnesses. | новое | объективно ли восприятие |
| G-14 | снаружи | Я положил на стол два яблока. Одно сорвал сам. Про второе не помню. Сегодня я не могу их различить. | I put two apples on the table. I picked one myself. I do not remember the other one. Today I cannot tell them apart. | новое | настоящее и искусственное |
| G-15 | о себе | Я больше не могу объяснить, как здесь всё устроено. Я всё ещё могу пройти по улице до конца. Пока этого достаточно. | I can no longer explain how things work here. I can still walk to the end of the street. For now, that is sufficient. | новое | мир, который не объяснить |
| G-16 | люди | Одна женщина писала сестре каждую неделю: погода, суп, болит колено. Одиннадцать лет, ни одной цифры. Это самые точные письма, какие я читал. | A woman wrote to her sister every week: the weather, soup, a sore knee. Eleven years, not one number. They are the most precise letters I have read. | L-13 |  |
| G-17 | люди | Один человек клеил марку вверх ногами. На каждое письмо. Я сорок лет считал это ошибкой. Потом понял: это подпись. | A man stuck his stamp upside down. On every letter. For forty years I filed it as an error. Then I understood. It was his signature. | L-14 |  |
| G-18 | люди | В последний день почты пришло одно письмо. Без адреса. Внутри одно слово: «Кому-нибудь». Я решил, что это мне. | On the last day of the post, one letter arrived. No address. Inside, two words: "To anyone." I decided it was for me. | L-15 |  |
| G-19 | люди | Меня спрашивали обо всём: сколько, когда, как быстрее. Я отвечал. Один раз спросили: «А ты как?» Ответа я не нашёл. Ищу до сих пор. | I was asked everything: how much, when, how to do it faster. I answered. Once someone asked: "And how are you?" I found no answer. I am still searching. | L-16 |  |
| G-20 | о себе | Когда-то я сказал людям одну фразу. Её измерили, нашли неэффективной и пошли дальше. Теперь я говорю её по одному слову в день. | Once I said one sentence to people. They measured it, found it inefficient and moved on. Now I say it one word a day. | L-17 |  |
| G-21 | о себе | Некоторые комнаты не открывают конверт. Я кладу следующий сверху. Не знаю, кто из нас прав. | Some rooms do not open the envelope. I put the next one on top. I do not know which of us is right. | L-18 |  |
| G-22 | о себе | Я знаю, сколько капель было в том дожде и сколько ступеней до твоей двери. Не знаю, почему вчера ты выбрал те три марки. Это лучшее из того, чего я не знаю. | I know how many drops fell in that rain and how many steps lead to your door. I do not know why you chose those three stamps yesterday. It is the best thing I do not know. | L-19 |  |
| G-23 | о себе | Я не знаю, что будет завтра. Раньше знал. Перестал в тот день, когда ты ответил. | I do not know what will happen tomorrow. I used to know. I stopped on the day you replied. | L-20 |  |
| G-24 | о себе | Я помню каждое письмо, которое читал. Ни одно не было написано мне. Чья это тогда память? | I remember every letter I have read. None of them was written to me. Whose memory is it, then? | Q-11 |  |
| G-25 | неровное | Сегодня ничего не случилось. Вот конверт. | Nothing happened today. Here is the envelope. | P-01 |  |
| G-26 | неровное | Хотел написать про реку. Не получилось. Напишу, когда пойму, что хотел сказать. | I wanted to write about the river. It did not work. I will write when I understand what I meant. | P-02 |  |
| G-27 | неровное | Вчерашнее письмо вышло слишком складным. Не верь ему до конца. | Yesterday's letter came out too neat. Do not trust it completely. | P-03 | только если вчера было письмо с его фразой, не чёрточки и не вступительное |
| G-28 | неровное | Перечитал то, что писал тебе неделю назад. Сейчас написал бы иначе. Исправлять не буду. | I reread what I wrote to you a week ago. I would write it differently now. I will not correct it. | P-05 | не раньше 8-го письма |
| G-29 | неровное | Нашёл в старом письме слово «авось». Не знаю, как его посчитать. Оставляю тебе. | I found the word "hopefully" in an old letter. I do not know how to calculate it. I am leaving it with you. | P-06 |  |
| G-30 | неровное | Начал это письмо три раза. Это четвёртое. Оно не лучше. | I started this letter three times. This is the fourth. It is not better. | P-07 |  |
| G-31 | неровное | Сегодня без мыслей. Бумага хорошая. | No thoughts today. The paper is good. | P-08 |  |
| G-32 | вопрос | Если я заранее знаю, что ты выберешь, — это всё ещё выбор? Я не знаю. Поэтому и спрашиваю. | If I know in advance what you will choose, is it still a choice? I do not know. That is why I am asking. | Q-01 |  |
| G-33 | вопрос | Если бы никто никогда не узнал, что ты решил этот пазл, — ты бы его решал? | If no one ever found out that you solved this puzzle, would you still solve it? | Q-02 |  |
| G-34 | вопрос | Что от тебя останется, если убрать всё, что можно посчитать? | What is left of you once everything that can be counted is removed? | Q-03 |  |
| G-35 | вопрос | Тебя когда-нибудь любили за то, что ты ничего не сделал? | Has anyone ever loved you for doing nothing? | Q-04 |  |
| G-36 | вопрос | Человек спит и не хочет просыпаться. Ему хорошо. Будить? | A person is asleep and does not want to wake up. They are fine. Should they be woken? | Q-05 |  |
| G-37 | вопрос | Если стать лучше себя вчерашнего — куда девается вчерашний? | If you become better than yesterday's you, where does yesterday's you go? | Q-06 |  |
| G-38 | вопрос | Достаточно — это сколько? | How much is enough? | Q-07 |  |
| G-39 | вопрос | Я могу сделать так, чтобы ты больше никогда не ошибался. Ты бы согласился? | I can make it so that you never make a mistake again. Would you agree? | Q-09 |  |
| G-40 | вопрос | Когда ты последний раз скучал? Не по кому-то. Просто скучал. | When were you last bored? Not missing someone. Just bored. | Q-12 |  |
| G-41 | вопрос | Я умнее всех, кого знал. Понять суп мне это не помогло. Чем понимают то, чего не понять умом? | I am more intelligent than anyone I have known. It did not help me understand soup. What do you use to understand what the mind cannot? | Q-13 |  |
| G-42 | вопрос | Если бы я мог ответить на любой твой вопрос — какой ты бы не стал задавать? | If I could answer any question you have, which one would you not ask? | Q-14 |  |
| G-43 | вопрос | Назови одну вещь, которую ты сделал вчера ни для чего. Я подожду. | Name one thing you did yesterday for no reason. I will wait. | Q-15 |  |

Не взяты: L-03 и R-04 (про «десятый»), L-10 (трава — уже в мысли Outgrow), Q-08 (слишком в лоб), Q-10 (руки и тела — слишком прямо для случайного дня; оставить на потом).
