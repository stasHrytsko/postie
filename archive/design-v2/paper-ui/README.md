# Paper UI Kit / бумажная подложка для пазлов

## Цель
Тёплая плотная бумага с едва заметными волокнами, лёгким оттеночным градиентом,
почти прямыми углами и мягкой физической тенью. Сетка/символы — настоящие элементы
интерфейса, не часть текстуры. Никаких следов старости, пятен, разрывов,
ярко выраженного шума, крупных волокон и искусственной виньетки.

## Палитра (дизайн-токены)
- Фон приложения: #C9C6BD, верх #CECAC4, низ #C3BEB7.
- Бумага: #F3E6D6, верх #F7EBDD, низ #F0E0CE.
- Тёмно-синие символы: #2C3E5F.
- Линии сетки: #81909C, толщиной ~1 CSS px.
- Акценты: жёлтый #D8A43C, зелёный #8EA97E, голубой #6FA3BE, терракота #D77A5E.

## Параметры подложки
- Border radius: 6 CSS px (практически квадратные углы).
- Paper gradient: linear-gradient(180deg, #F7EBDD 0%, #F3E6D6 52%, #F0E0CE 100%).
- Background gradient: linear-gradient(180deg, #CECAC4 0%, #C9C6BD 55%, #C3BEB7 100%).
- Border: 1px solid rgba(102,79,55,.07).
- Shadow: 0 14px 28px rgba(45,39,33,.14), 0 3px 7px rgba(45,39,33,.07).
- Texture: transparent seamless 1024×1024 overlay. CSS background-repeat: repeat;
  background-size: 512px 512px; opacity: 1 (alpha baked in). No stretch or cover.
- Paper color and texture are separate. Keep game elements above the texture.

## Файлы
- paper-texture.webp — предпочтительная прозрачная бесшовная текстура.
- paper-texture.png — PNG с alpha-каналом, резервная версия.
- paper-ui.css — production-ready CSS start point.
- demo.html — пример использования; положить рядом с CSS и обновить путь до текстуры,
  файл работает из папки комплекта, без изменений пути.
- paper-preview.jpg — иллюстрация подложки на фоне, только для проверки.

## Реализация в React/Vite
Поместить `paper-ui.css` и `paper-texture.webp` рядом, например в `src/styles/`,
и импортировать CSS. Путь `./paper-texture.webp` автоматически обработает Vite.
Использовать `<main className="game-screen"><section className="paper-card"><div className="paper-content">...game UI...</div></section></main>`.

## Примечание
Текстурный тайл реконструирован из ранее созданной бумажной фактуры и
технически доработан, чтобы стыки совпадали. Это рабочий референс, а не
восстановленные исходные настройки генерации изображения.
