/* Games of Postie (author decision 2026-11-19: 12 in the MVP, a mix with deduction at the core — CONCEPT.md §1).
   POSTIE_GAMES — the MVP games that are in games/, in the order they arrive in the letter: deduction first, move puzzles later.
   Not here yet: Knock Through and Bracket (in stazzi, to be ported). Pair Up lives inside Parcels (dots), its folder is in archive/games.
   POSTIE_BENCH — the bench: kept in games/, playable from test > All games and levels, never in the letter. */
var POSTIE_GAMES = [
  'streams', 'parcels', 'outgrow', 'perfect-fit', 'hidden-stones',
  'arrow-flip', 'slide-out', 'the-gap', 'carpet-layers', 'shadow-step'
];
var POSTIE_BENCH = ['tight-shelf', 'nest', 'one-each', 'recruit-ladder'];
if (typeof module !== 'undefined') module.exports = POSTIE_GAMES.concat(POSTIE_BENCH);
