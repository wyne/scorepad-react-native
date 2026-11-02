#!/usr/bin/env node
/**
 * Render captioned App Store screenshots from raw simulator captures.
 *
 *   npm i --no-save playwright && npx playwright install chromium   # once
 *   node assets-stores/render.cjs
 *
 * Reads assets-stores/raw/*.png, writes assets-stores/apple/<slot>/NN-name.png.
 * Edit captions in SHOTS below; edit the look in template().
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = __dirname;
const RAW = path.join(ROOT, 'raw');
const OUT = path.join(ROOT, 'apple');

// Caption copy, shared across slots. `hi` marks which headline line is yellow.
const COPY = {
  board: {
    eyebrow: 'Swipe gesture',
    lines: ['Swipe up,', 'score instantly.'], hi: 1,
    sub: 'Swipe up to add, down to subtract.<br>Flick further to jump more at once.',
  },
  dial: {
    eyebrow: 'Dial',
    lines: ['Spin the dial,', 'set the score.'], hi: 0,
    sub: 'Roll up big totals in a single flick.<br>Perfect for Rummy, Cribbage, darts.',
  },
  history: {
    eyebrow: 'Round history',
    lines: ['Every round,', 'saved.'], hi: 1,
    sub: 'See each player, round by round,<br>sorted by total.',
  },
  points: {
    eyebrow: 'Point values',
    lines: ['Your game,', 'your points.'], hi: 1,
    sub: 'Choose what a swipe and a<br>hold-and-swipe add.',
  },
  games: {
    eyebrow: 'Game library',
    lines: ['Every game night,', 'one place.'], hi: 1,
    sub: 'Pick up any game right where<br>you left off.',
  },
  duoClosed: {
    eyebrow: 'iPhone Duo',
    lines: ['Closed?', 'Still scoring.'], hi: 1,
    sub: 'The full board fits the cover screen.',
  },
  duoOpen: {
    eyebrow: 'iPhone Duo',
    lines: ['Unfold for', 'a bigger board.'], hi: 1,
    sub: 'Big, readable tiles across the whole table.',
  },
  duoTent: {
    eyebrow: 'iPhone Duo',
    lines: ['Board and scores,', 'side by side.'], hi: 0,
    sub: 'The score sheet docks next to the board when it’s open.',
  },
  duoBook: {
    eyebrow: 'iPhone Duo',
    lines: ['Every round', 'at a glance.'], hi: 1,
    sub: 'Board on top, scores below.',
  },
};

// slot folder -> { size, frame, shots: [name, raw, copy] }
const IPHONE_SHOTS = [
  ['01-board', 'iphone-board-dark.png', 'board'],
  ['02-dial', 'iphone-dial.png', 'dial'],
  ['03-history', 'iphone-history.png', 'history'],
  ['04-point-values', 'iphone-point-values.png', 'points'],
  ['05-games', 'iphone-games.png', 'games'],
];
const SLOTS = {
  'iPhone 6.9': { size: [1320, 2868], frame: 'phone', shots: IPHONE_SHOTS },
  'iPhone 6.1': { size: [1206, 2622], frame: 'phone', shots: IPHONE_SHOTS },
  'iPhone Duo outer': {
    size: [1398, 2034], frame: 'cover',
    shots: [
      ['01-board', 'duo-cover.png', 'duoClosed'],
      ['02-dial', 'duo-cover-dial.png', 'dial'],
      ['03-history', 'duo-cover-history.png', 'history'],
    ],
  },
  'iPhone Duo inner (landscape)': {
    size: [2853, 2007], frame: 'wide',
    shots: [
      ['01-open', 'duo-open.png', 'duoOpen'],
      ['02-tent', 'duo-tent-landscape.png', 'duoTent'],
    ],
  },
  'iPhone Duo inner (portrait)': {
    size: [2007, 2853], frame: 'tall',
    shots: [['03-book', 'duo-book.png', 'duoBook']],
  },
};

// Device frame proportions, relative to canvas width.
const FRAMES = {
  phone: { width: 0.68, top: 0.335, radius: 0.13, bezel: 0.022, island: true },
  cover: { width: 0.64, top: 0.38, radius: 0.10, bezel: 0.020, island: false },
  wide: { width: 0.56, side: true, radius: 0.045, bezel: 0.008, island: false },
  tall: { width: 0.76, top: 0.31, radius: 0.06, bezel: 0.012, island: false },
};

function template([w, h], frameKind, img, c) {
  const f = FRAMES[frameKind];
  const u = (f.side ? w * 0.30 : Math.min(w, h)) / 100; // type scales with the text column
  const devW = w * f.width;
  const bez = w * f.bezel;
  const lines = c.lines
    .map((l, i) => `<span class="${i === c.hi ? 'hi' : ''}">${l}</span>`)
    .join('<br>');
  return `<!doctype html><html><head><style>
  :root { --yellow: #f6c945; }
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${w}px; height: ${h}px; overflow: hidden; }
  body {
    background:
      radial-gradient(ellipse ${w * 0.9}px ${h * 0.32}px at 50% 0%, rgba(246,201,69,0.30), rgba(246,201,69,0) 70%),
      linear-gradient(#17150f, #0c0c0c 55%);
    font-family: "SF Pro Display", -apple-system, "Inter", "Helvetica Neue", sans-serif;
    color: #fff; text-align: center; position: relative;
  }
  .text { position: absolute; left: 0; right: 0; top: ${h * 0.055}px; padding: 0 ${w * 0.05}px; }
  .side .text { right: auto; width: ${w * 0.34}px; left: ${w * 0.045}px; top: 50%; transform: translateY(-50%); text-align: left; padding: 0; }
  .eyebrow {
    color: var(--yellow); font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.14em; font-size: ${u * 2.6}px; opacity: 0.9;
  }
  .eyebrow::before { content: "— "; }
  h1 {
    font-weight: 900; font-size: ${u * 9.6}px; line-height: 1.08;
    letter-spacing: 0.005em; margin-top: ${u * 2.2}px;
  }
  h1 .hi { color: var(--yellow); }
  p { color: rgba(255,255,255,0.72); font-size: ${u * 3.6}px; line-height: 1.35; margin-top: ${u * 2.6}px; font-weight: 500; }
  .device {
    position: absolute; width: ${devW}px;
    ${f.side ? `right: ${w * 0.04}px; top: 50%; transform: translateY(-50%);` : `left: ${(w - devW) / 2}px; top: ${h * f.top}px;`}
    padding: ${bez}px; background: #050505; border-radius: ${devW * f.radius}px;
    box-shadow: 0 0 0 ${u * 0.35}px #2c2c2e, 0 ${u * 4}px ${u * 10}px rgba(0,0,0,0.6);
  }
  .device img { display: block; width: 100%; border-radius: ${(devW - 2 * bez) * f.radius * 0.92}px; }
  .island {
    position: absolute; left: 50%; transform: translateX(-50%);
    top: ${bez + devW * 0.028}px; width: ${devW * 0.27}px; height: ${devW * 0.078}px;
    background: #000; border-radius: 999px;
  }
  </style></head><body class="${f.side ? 'side' : ''}">
    <div class="text">
      <div class="eyebrow">${c.eyebrow}</div>
      <h1>${lines}</h1>
      <p>${c.sub}</p>
    </div>
    <div class="device"><img src="${img}">${f.island ? '<div class="island"></div>' : ''}</div>
  </body></html>`;
}

(async () => {
  const browser = await chromium.launch();
  for (const [slot, { size, frame, shots }] of Object.entries(SLOTS)) {
    const dir = path.join(OUT, slot);
    fs.mkdirSync(dir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
    for (const [name, raw, copyKey] of shots) {
      const img = 'data:image/png;base64,' + fs.readFileSync(path.join(RAW, raw)).toString('base64');
      await page.setContent(template(size, frame, img, COPY[copyKey]), { waitUntil: 'load' });
      // JPEG avoids the alpha channel App Store Connect rejects; quality 95 is visually lossless.
      await page.screenshot({ path: path.join(dir, `${name}.jpg`), type: 'jpeg', quality: 95 });
      console.log(`${slot}/${name}.jpg`);
    }
    await page.close();
  }
  await browser.close();
})();
