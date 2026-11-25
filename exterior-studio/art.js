// Each activity plate occupies a 440 × 116 local coordinate system.
// These object studies disappear as soon as the corresponding photograph is placed.
function activityArt(floor, side, palette) {
  const { ink, main, pale, accent } = palette;
  const paper = tint('#fff6df',pale,.24);
  const honey = tint('#ffcc68',accent,.48);
  const mint = tint('#b9dfcf',pale,.48);
  const coral = tint('#f58e73',main,.32);

  function shape(d, fill, outline = 0) {
    return '<path d="' + d + '" fill="' + fill + '"' +
      (outline ? ' stroke="' + ink + '" stroke-width="' + outline + '"' : '') + '/>';
  }
  function line(d, color = ink, width = 2) {
    return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + width + '"/>';
  }
  function oval(cx, cy, rx, ry, fill, outline = 0) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry +
      '" fill="' + fill + '"' + (outline ? ' stroke="' + ink + '" stroke-width="' + outline + '"' : '') + '/>';
  }
  function group(transform, body) {
    return '<g transform="' + transform + '">' + body + '</g>';
  }
  function keyboard() {
    const separators = Array.from({length: 13}, (_, i) =>
      line('M' + (16 + i * 12) + ' 25v30', ink, 1.2)).join('');
    const sharps = [1, 2, 4, 5, 6, 8, 9, 11, 12, 13].map(i =>
      shape('M' + (1 + i * 12) + ' 24h7v18h-7z', ink)).join('');
    return group('translate(104 34) rotate(-10 92 26)',
      shape('M1 3l177-2 4 5v55l-7 4H1l-4-6z', ink) +
      shape('M0 0h175l4 4v52H0z', main, 2.3) +
      shape('M5 24h168v29H5z', paper, 1.4) + separators + sharps +
      line('M8 7v10m4-10v10m4-10v10m4-10v10m4-10v10m4-10v10', pale, 1.3) +
      shape('M64 6h39v12H64z', ink) + line('M69 13h8l3-3 3 4 3-2h11', mint, 1.5) +
      oval(122, 12, 4, 4, honey, 1.2) + oval(135, 12, 4, 4, paper, 1.2) +
      line('M153 8h16m-16 4h16m-16 4h16', ink, 1.2)) +
      group('translate(292 18) rotate(13 11 20)',
        shape('M1 1l30-7v27c0 5-5 8-10 8-4 0-6-2-6-5s5-7 11-7V2L6 7v23c0 4-5 7-10 7-4 0-6-2-6-5s5-7 11-7z', ink)) +
      group('translate(75 78) rotate(-16)', shape('M0-15l3 10 11 2-10 4-2 10-4-9-10-2 10-4z', accent, 1.3));
  }
  function paint() {
    const island = 'M3 39C6 17 35-2 78 0c26 1 54 14 54 29 0 14-12 20-23 19-9-1-15 2-15 9 0 8-9 13-24 13C38 70-2 60 3 39z';
    return group('translate(103 25) rotate(-11 71 35)',
      group('translate(4 6)', shape(island, ink)) + shape(island, paper, 2.4) +
      oval(93, 34, 9, 6, pale, 2) + oval(28, 30, 9, 6, main, 1.5) +
      oval(53, 16, 10, 6, coral, 1.5) + oval(80, 12, 9, 5, honey, 1.5) +
      oval(108, 19, 8, 5, mint, 1.5) + line('M18 46q17 13 41 14', ink, 1.4)) +
      group('translate(203 86) rotate(-27)',
        shape('M0-3Q-7 0 0 3l87 1 3-9z', honey, 1.8) +
        shape('M83-5l20-2 1 11-20 1z', paper, 1.6) +
        shape('M102-7q15-10 31-11-6 4-7 10-7 14-23 13z', main, 1.8) +
        line('M108-2q9-3 15-9m-38 8 1 5m4-6 1 5', ink, 1.2)) +
      group('translate(220 95) rotate(-41)',
        shape('M0-2Q-5 0 0 2l99 2v-8z', coral, 1.7) +
        shape('M94-4l18-2v9l-18 1z', paper, 1.5) +
        shape('M111-6q15-9 28-7-9 4-10 10-7 6-17 6z', ink));
  }
  function basketball() {
    return line('M66 108l78-30 65 24 77-32m-168 17 46 18m77-17c-11-5-12-13 4-18', paper, 2) +
      group('translate(97 14) rotate(-5 38 25)',
        shape('M4 7l85-5v40L4 50z', ink) + shape('M1 1l84-5v40L1 44z', mint, 2) +
        shape('M30 16l28-2v15l-28 2z', paper, 1.7) +
        shape('M27 30l35-2-11 25-12 1z', paper, 1.5) +
        line('M30 32l15 18 13-20m-24 9 12-10 11 13m-21-1 12 11', ink, 1.2) +
        oval(44, 30, 19, 3, coral, 2)) +
      group('translate(245 59) rotate(-22)',
        oval(4, 5, 43, 43, ink) + oval(0, 0, 43, 43, coral, 2.3) +
        shape('M-37 21C-8 46 28 27 41 3c-2 17-11 29-24 36-21 11-42 0-54-18z', main) +
        line('M-43 0h86M0-42v84m-27-75q44 28 1 66m51-66q-36 30-1 66', ink, 2.2) +
        line('M-25-20q4-8 14-11', paper, 2.7)) +
      line('M302 43l18-6m-15 18 25-3m-16 14 13 1', ink, 1.7);
  }
  function blocks() {
    function block(x, y, w, h, depth, face) {
      return group('translate(' + x + ' ' + y + ')',
        shape('M0 0l' + depth + ' -' + depth/2 + 'h' + w + 'l-' + depth + ' ' + depth/2 + 'z', paper, 1.9) +
        shape('M0 0h' + w + 'v' + h + 'H0z', face, 1.9) +
        shape('M' + w + ' 0l' + depth + ' -' + depth/2 + 'v' + h + 'l-' + depth + ' ' + depth/2 + 'z', main, 1.9));
    }
    return group('translate(8 1) rotate(-4 214 63)',
      block(116, 61, 36, 34, 17, mint) + block(204, 61, 36, 34, 17, coral) +
      block(116, 36, 124, 25, 17, honey) +
      shape('M155 35l24-29 25 29z', coral, 2) +
      shape('M179 6l15-6 26 28-16 7z', accent, 1.9) +
      group('rotate(12 272 79)',block(259, 64, 34, 29, 15, mint)) +
      line('M121 74l11-6m-11 12 18-10m69 9 12-7m-12 13 17-10', ink, 1.1)) +
      line('M84 45l9 4m-4-17 9 9m174-16 7-8m-2 15 11-4', ink, 1.8);
  }
  function microscope() {
    return group('translate(127 2) rotate(5 63 60)',
      shape('M14 99l94-3 9 9-7 4-108 2-4-5z', ink) +
      shape('M18 94l88-3 9 10-6 4-108 1z', mint, 2) +
      shape('M61 34q37-14 48 13c11 28-7 44-25 48l-15-10c24-8 35-18 29-32-4-10-14-11-24-4z', paper, 2.4) +
      shape('M83 79q15 5 13 16l-23 1-10-14z', main, 1.9) +
      shape('M23 64l58 2-2 7-59-1z', ink) +
      shape('M35 61l25 1-5 4-25-1z', paper, 1.3) +
      shape('M44 44l9 5-6 12-7-4zm9 4 7 1-1 11-7-1z', mint, 1.6) +
      shape('M40 43l11-12 21 4-8 15-12 2z', ink) +
      group('translate(61 30) rotate(34)',
        shape('M-9-24h19V8H-9z', main, 2) + shape('M-5-34H6v12H-5z', paper, 1.8) +
        shape('M-8-37H9v5H-8z', ink) + line('M-5-18v16', pale, 2)) +
      oval(79, 43, 10, 10, honey, 2.3) + oval(79, 43, 4, 4, paper, 1.2) +
      shape('M33 85l11-9 12 5-9 9z', honey, 1.8)) +
      group('translate(251 64) rotate(-21)',
        shape('M3-37h8v7H9v46c0 8-13 8-13 0v-46h-2v-7z', paper, 2) +
        shape('M-3-7Q3-11 8-6v22c0 6-11 6-11 0z', mint, 1.2) +
        line('M2-24h5m-5 7h5M1 2h4', ink, 1.2)) +
      group('translate(280 67) rotate(9)',
        shape('M-4-12h13v3H7v10l12 20q2 5-3 5h-28q-4 0-2-5L-1 1V-9h-3z', paper, 1.8) +
        shape('M-5 12q6-3 14 1l7 12h-29z', coral, 1.3)) +
      oval(270, 39, 2.5, 2.5, honey, 1.1);
  }
  function relay() {
    return line('M56 106c66-9 84-25 105-58S206 5 250 2m-171 111c49-6 76-25 95-54s49-48 96-52m-158 110c44-7 62-25 84-57s48-42 94-46', paper, 2.3) +
      group('translate(153 85) rotate(-26)',
        shape('M1-6h98q8 6 0 12H1q-7-5 0-12z', ink) +
        shape('M-2-10h98q8 6 0 12H-2q-7-5 0-12z', honey, 2.1) +
        line('M6-8v7m5-7v7m5-7v7m52-6h23', ink, 1.4)) +
      group('translate(198 93) rotate(-34)',
        shape('M0-7h96q7 6 0 12H0q-7-5 0-12z', coral, 2.1) +
        line('M8-4v6m5-6v6m5-6v6m50-5h22', ink, 1.4)) +
      group('translate(282 52) rotate(4 20 24)',
        shape('M-4 41l29-6 22 3v6l-30 5-21-3z', ink) +
        shape('M5 39l11-32 6-1 12 32-13 4z', main, 2) +
        shape('M11 22l16-2 3 9-22 3z', paper, 1.3)) +
      line('M111 59l18-11m-10 19 18-10m-6 18 11-6', ink, 1.8);
  }
  function campus() {
    return group('translate(105 7)',
      shape('M1 52l76-9 11 6-2 43-85 7z', paper, 2) +
      shape('M1 52l-5-4 83-10 10 5z', honey, 1.9) +
      shape('M81 22l24-8 33 8v72l-56 3z', paper, 2.1) +
      shape('M105 14l33 8v72l-33-2z', mint, 1.7) +
      shape('M139 45l66-6 11 5v44l-77 6z', paper, 2) +
      shape('M138 45l-3-5 72-8 12 7z', honey, 1.8) +
      shape('M93 96V77q0-8 9-9 6-1 6 7v19z', ink) +
      [0,1].map(row => [0,1,2,3].map(i =>
        shape('M' + (8+i*17) + ' ' + (58+row*14-i*2) + 'l10-1v7l-10 1z', main) +
        shape('M' + (146+i*15) + ' ' + (50+row*14-i) + 'l9-1v7l-9 1z', main)).join('')).join('') +
      line('M86 36l13-4m-13 11 13-4m13-5 17 5m-17 3 17 5m-17 4 17 5', ink, 2) +
      line('M104 13V-4', ink, 2.2) + shape('M105-4q9-6 22 0-9 0-13 6l-9-2z', coral, 1.5) +
      line('M2 99l210-9', ink, 2)) +
      line('M278 12q34 17 72 1', ink, 1.4) +
      shape('M284 15l10 3-6 7z', honey, 1.2) + shape('M302 19l9 1-4 8z', coral, 1.2) + shape('M320 20l10-2-3 9z', mint, 1.2);
  }
  function exhibition() {
    return group('translate(103 9) rotate(-6 76 52)',
      line('M20 35L9 98m114-62 12 64m-62-62 4 57', ink, 4) +
      shape('M4 9l135 3v67L4 77z', ink) +
      shape('M0 4l135 3v66L0 71z', paper, 2.3) +
      shape('M9 11l64 1v52H9z', mint, 1.4) +
      oval(53, 27, 8, 8, honey) +
      shape('M10 58l21-30 20 30 11-14 10 16v4H10z', main) +
      shape('M10 60l22-16 10 11 8-4 22 10v3H10z', ink) +
      shape('M81 15l45 1v19H81z', pale, 1.2) +
      line('M86 30l9-8 9 6 9-9 7 3', ink, 1.5) +
      shape('M82 43l17-1v17H82z', honey, 1.1) +
      line('M104 45l18 1m-18 6 14 1m-14 5 17 1', ink, 1.2) +
      shape('M14 7l13 1-2 5-13-1zm99 2 14 1 2 5-15-1z', coral)) +
      group('translate(255 18) rotate(5 23 38)',
        shape('M5 58l35 1 7 7-48 2z', mint, 1.8) +
        shape('M-1 68l48-2v16l-48 3z', paper, 1.8) +
        shape('M3 55l7-26 12 15 14-30 5 42z', honey, 2) +
        shape('M10 29l12 15-3 13-16-2z', coral, 1.5) +
        shape('M22 44l14-30-4 43-13 0z', main, 1.5)) +
      line('M303 41l9-5m-13-1 4-7m3 20 10-1', ink, 1.7);
  }
  const plates = [[keyboard, paint], [basketball, blocks], [microscope, relay], [campus, exhibition]];
  return '<g stroke-linejoin="round" stroke-linecap="round">' + plates[floor][side]() + '</g>';
}
