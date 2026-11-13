/* Order of games in the gallery. Each id is a folder games/<id>/ with levels.js, engine.js, view.js, icon.svg. */
var POSTIE_GAMES = [
  'arrow-flip', 'perfect-fit', 'the-gap',
  'slide-out', 'tight-shelf', 'carpet-layers', 'outgrow', 'parcels',
  'streams', 'pair-up', 'hidden-stones', 'nest', 'recruit-ladder',
  'shadow-step', 'paint-ladder', 'one-each'
];
if (typeof module !== 'undefined') module.exports = POSTIE_GAMES;
