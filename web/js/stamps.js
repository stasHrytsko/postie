/* The stamps of the album (Games), by the author's mock-up of 2026-11-21: every game has its own colour and an emblem.
   bg — the field of the stamp, ink — its drawing and letters; a paper stamp has bg = paper and a coloured ink.
   Emblems are line drawings in the spirit of an engraving, drawn with currentColor (the ink); viewBox 0 0 100 100
   (Outgrow, the wide one — 0 0 300 100). The illustrated stamps will replace them later. */
var POSTIE_STAMPS = (function () {
  var PAPER = '#F1E6CF', RED = '#9A302A', GREEN = '#2E5A2E';
  function lines(n, f) { var s = ''; for (var i = 0; i < n; i++) s += f(i - (n - 1) / 2); return s; }
  var E = {
    streams: '<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
      lines(7, function (k) { return '<path d="M' + (46 + k * 1.7) + ' 100C' + (46 + k * 1.7) + ' 72 ' + (34 + k * 2) + ' 56 ' + (14 + k * 2.6) + ' 8"/>'; }) +
      lines(7, function (k) { return '<path d="M' + (54 + k * 1.7) + ' 100C' + (54 + k * 1.7) + ' 72 ' + (66 + k * 2) + ' 56 ' + (86 + k * 2.6) + ' 8"/>'; }) + '</g>',
    parcels: '<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round">' +
      '<path d="M14 46L52 32 88 46 50 60Z"/><path d="M14 46V74L50 90V60M88 46V74L50 90"/>' +
      '<path d="M33 39L69 53M31 53L69 39" stroke-width="4"/><path d="M69 53V81M31 53V81" stroke-width="4" opacity=".9"/>' +
      lines(5, function (k) { return '<path d="M' + (20 + (k + 2) * 5) + ' ' + (54 + (k + 2) * 2.2) + 'V' + (77 + (k + 2) * 2.2) + '" stroke-width=".9" opacity=".55"/>'; }) +
      '<path d="M50 46C38 30 30 34 34 42 37 47 46 47 50 46ZM50 46C62 30 70 34 66 42 63 47 54 47 50 46Z" stroke-width="2.4"/><path d="M50 46l-6 12M50 46l8 11" stroke-width="2"/></g>',
    'knock-through': '<g fill="currentColor">' +
      [[-62, 40], [-42, 54], [-26, 66], [-12, 77], [0, 88]].map(function (d) {
        return '<g transform="rotate(' + d[0] + ' ' + d[1] + ' 86)"><rect x="' + (d[1] - 5) + '" y="44" width="10" height="42" rx="1"/></g>'; }).join('') +
      '</g><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 58l7 3M8 48l6 7M16 42l2 9"/></g>',
    'square-up': '<g fill="none" stroke="currentColor" stroke-width="8"><rect x="12" y="16" width="46" height="46"/><rect x="42" y="38" width="46" height="46"/></g>',
    outgrow: (function () {
      function sprout(x, s) {
        return '<g transform="translate(' + x + ' 88) scale(' + s + ')">' +
          '<path d="M0 0C0-14 1-26 0-40" fill="none" stroke="currentColor" stroke-width="3"/>' +
          '<path d="M0-30C-8-46-30-48-40-38-28-26-10-24 0-30Z"/><path d="M0-40C8-60 34-64 46-52 32-36 10-34 0-40Z"/>' +
          '<path d="M-26 2C-14-5 14-5 26 2Z" opacity=".75"/></g>';
      }
      return '<g fill="currentColor">' + sprout(55, .55) + sprout(145, .78) + sprout(240, 1.05) + '</g>';
    })(),
    nest: '<g fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="miter">' +
      [1, .7, .42, .16].map(function (s) { var h = 74 * s, w = 84 * s; return '<path d="M50 ' + (60 - h * .62) + 'L' + (50 + w / 2) + ' ' + (60 + h * .38) + 'H' + (50 - w / 2) + 'Z"/>'; }).join('') + '</g>',
    'perfect-fit': '<g fill="currentColor"><path d="M6 76V60H22V46H44V60H34V76Z"/><path d="M38 76V64H48V50H64V36H94V50H80V64H66V76Z"/></g>' +
      '<g stroke="currentColor" stroke-width=".8" opacity=".45">' + lines(8, function (k) { return '<path d="M' + (50 + k * 11) + ' 30l-30 50"/>'; }) + '</g>',
    'arrow-flip': '<g fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="butt"><path d="M20 50C22 28 46 20 66 28"/><path d="M80 50C78 72 54 80 34 72"/></g>' +
      '<g fill="currentColor"><path d="M58 12L88 32 58 46Z"/><path d="M42 88L12 68 42 54Z"/></g>',
    'the-gap': '<g fill="currentColor"><rect x="32" y="18" width="36" height="22"/><path d="M6 52H40V64H60V52H94V76H6Z"/></g>' +
      '<g stroke="currentColor" stroke-width=".8" opacity=".4">' + lines(6, function (k) { return '<path d="M' + (50 + k * 14) + ' 14v66"/>'; }) + '</g>',
    'carpet-layers': '<g fill="currentColor">' + [-20, 0, 20].map(function (dy, i) {
      return '<path opacity="' + (1 - i * .2) + '" transform="translate(0 ' + dy + ')" d="M6 58C24 40 40 64 58 50 72 40 84 40 96 44V56C84 52 72 54 60 62 42 76 24 52 6 70Z"/>'; }).join('') + '</g>',
    'shadow-step': '<path d="M50 18L74 42 50 66 26 42Z" fill="currentColor"/><g stroke="currentColor" stroke-width="1" opacity=".55">' +
      lines(9, function (k) { return '<path d="M' + (62 + k * 2.6) + ' ' + (54 + k * 2.6) + 'l' + (24 - Math.abs(k) * .6) + ' 16"/>'; }) + '</g>',
    'tight-shelf': '<g fill="currentColor"><rect x="6" y="26" width="88" height="4"/><rect x="6" y="76" width="88" height="4"/>' +
      '<circle cx="24" cy="62" r="13"/><rect x="42" y="49" width="26" height="26"/><path d="M71 75L84 49 97 75Z"/></g>',
    bracket: '<g fill="none" stroke="currentColor" stroke-width="3"><path d="M8 18H30V42H8M30 30H50V70H30M8 58H30V82H8M50 50H72"/></g>'
  };
  function S(bg, ink, frame) { return { bg: bg, ink: ink, frame: frame || ink }; }
  var C = {
    streams: S('#1F4A8C', PAPER, 'rgba(241,230,207,.8)'), parcels: S(PAPER, RED), 'knock-through': S('#A8781F', PAPER, 'rgba(241,230,207,.8)'),
    'square-up': S('#24503A', PAPER, 'rgba(241,230,207,.8)'), outgrow: S(PAPER, GREEN), nest: S(PAPER, RED),
    'perfect-fit': S('#1F4A8C', PAPER, 'rgba(241,230,207,.8)'), 'arrow-flip': S(PAPER, RED), 'the-gap': S('#1E5A50', PAPER, 'rgba(241,230,207,.8)'),
    'carpet-layers': S('#8E2A26', PAPER, 'rgba(241,230,207,.8)'), 'shadow-step': S('#4A2F5E', PAPER, 'rgba(241,230,207,.8)'),
    'tight-shelf': S('#A57A1E', PAPER, 'rgba(241,230,207,.8)'), bracket: S(PAPER, '#1F4A8C')
  };
  /* each drawing's own frame, tight around it, so it fills the stamp */
  var V = { streams: '4 4 92 96', parcels: '10 26 82 66', 'knock-through': '0 40 98 50', 'square-up': '8 12 84 76', outgrow: '25 14 270 80',
    nest: '6 12 88 78', 'perfect-fit': '4 28 92 52', 'arrow-flip': '8 8 84 84', 'the-gap': '4 16 92 62', 'carpet-layers': '4 18 94 74',
    'shadow-step': '22 14 78 72', 'tight-shelf': '4 24 94 58', bracket: '6 16 68 68' };
  var out = {};
  Object.keys(E).forEach(function (id) { out[id] = C[id]; out[id].svg = '<svg class="em" viewBox="' + V[id] + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + E[id] + '</svg>'; });
  out.paper = PAPER;
  return out;
})();
