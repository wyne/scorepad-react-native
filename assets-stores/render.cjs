#!/usr/bin/env node
/**
 * Render captioned App Store screenshots from raw simulator captures.
 *
 *   npm i --no-save playwright && npx playwright install chromium   # once
 *   node assets-stores/render.cjs
 *
 * Reads assets-stores/raw/*.png, writes <store>/<slot>/NN-name.jpg (apple/ or google/).
 * Edit captions in SHOTS below; edit the look in template().
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = __dirname;
const RAW = path.join(ROOT, 'raw');

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
const IPAD_SHOTS = [
  ['01-board', 'ipad-board.png', 'board'],
  ['02-dial', 'ipad-dial.png', 'dial'],
  ['03-history', 'ipad-history.png', 'history'],
  ['04-point-values', 'ipad-point-values.png', 'points'],
  ['05-games', 'ipad-games.png', 'games'],
];
const ANDROID_SHOTS = (prefix) => [
  ['01-board', `${prefix}-board.png`, 'board'],
  ['02-dial', `${prefix}-dial.png`, 'dial'],
  ['03-history', `${prefix}-history.png`, 'history'],
  ['04-point-values', `${prefix}-point-values.png`, 'points'],
  ['05-games', `${prefix}-games.png`, 'games'],
];
const SLOTS = {
  // Google Play: 9:16, so the long side stays within 2x the short side.
  'phone': { store: 'google', size: [1080, 1920], frame: 'android', shots: ANDROID_SHOTS('android') },
  'tablet': { store: 'google', size: [1440, 2560], frame: 'tablet', shots: ANDROID_SHOTS('android-tablet') },
  'iPad 13': { size: [2064, 2752], frame: 'tablet', shots: IPAD_SHOTS },
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

// Device frames. Width, top and bezel are fractions of the canvas.
// Stacked frames run off the bottom edge by `crop` of their own height, so the
// cut is always deliberate; `top` is the highest the frame may start and
// `width` the widest it may be. Side frames sit fully inside, centred.
const FRAMES = {
  phone: { width: 0.68, top: 0.335, crop: 0.16, radius: 0.13, bezel: 0.022, island: true },
  cover: { width: 0.64, top: 0.38, crop: 0.16, radius: 0.10, bezel: 0.020, island: false },
  wide: { width: 0.56, side: true, radius: 0.045, bezel: 0.008, island: false },
  android: { width: 0.62, top: 0.36, crop: 0.16, radius: 0.10, bezel: 0.020, island: false, punch: true, type: 0.9 },
  tablet: { width: 0.74, top: 0.36, crop: 0.12, radius: 0.045, bezel: 0.018, island: false, type: 0.8 },
  tall: { width: 0.76, top: 0.31, crop: 0.16, radius: 0.06, bezel: 0.012, island: false },
};

// Pixel size of a PNG, read from its IHDR chunk.
function pngSize(buf) {
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

function layout([w, h], f, [iw, ih]) {
  const bez = w * f.bezel;
  if (f.side) return { devW: w * f.width, bez, top: null };
  // Height that puts the bottom `crop` of the frame below the canvas edge.
  let devH = (h - h * f.top) / (1 - f.crop);
  let devW = (devH - 2 * bez) * (iw / ih) + 2 * bez;
  if (devW > w * f.width) {
    devW = w * f.width;
    devH = (devW - 2 * bez) * (ih / iw) + 2 * bez;
  }
  return { devW, bez, top: h - devH * (1 - f.crop) };
}

function template([w, h], frameKind, img, imgSize, c) {
  const f = FRAMES[frameKind];
  const u = (f.side ? w * 0.30 : Math.min(w, h)) * (f.type || 1) / 100; // type scales with the text column
  const { devW, bez, top } = layout([w, h], f, imgSize);
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
    ${f.side ? `right: ${w * 0.04}px; top: 50%; transform: translateY(-50%);` : `left: ${(w - devW) / 2}px; top: ${top}px;`}
    padding: ${bez}px; background: #050505; border-radius: ${devW * f.radius}px;
    box-shadow: 0 0 0 ${u * 0.35}px #2c2c2e, 0 ${u * 4}px ${u * 10}px rgba(0,0,0,0.6);
  }
  .device img { display: block; width: 100%; border-radius: ${(devW - 2 * bez) * f.radius * 0.92}px; }
  .punch {
    position: absolute; left: 50%; transform: translateX(-50%);
    top: ${bez + devW * 0.03}px; width: ${devW * 0.035}px; height: ${devW * 0.035}px;
    background: #000; border-radius: 999px;
  }
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
    <div class="device"><img src="${img}">${f.island ? '<div class="island"></div>' : ''}${f.punch ? '<div class="punch"></div>' : ''}</div>
  </body></html>`;
}

(async () => {
  // Fail before rendering anything, so a missing capture never leaves an old
  // apple/<slot>/<name>.jpg in place looking freshly rendered.
  const missing = [...new Set(Object.values(SLOTS).flatMap((s) => s.shots.map(([, raw]) => raw)))]
    .filter((raw) => !fs.existsSync(path.join(RAW, raw)));
  if (missing.length) {
    console.error(`Missing raw captures:\n${missing.map((r) => `  raw/${r}`).join('\n')}`);
    process.exit(1);
  }
  const browser = await chromium.launch();
  for (const [slot, { store = 'apple', size, frame, shots }] of Object.entries(SLOTS)) {
    const dir = path.join(ROOT, store, slot);
    fs.mkdirSync(dir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
    for (const [name, raw, copyKey] of shots) {
      const buf = fs.readFileSync(path.join(RAW, raw));
      const img = 'data:image/png;base64,' + buf.toString('base64');
      await page.setContent(template(size, frame, img, pngSize(buf), COPY[copyKey]), { waitUntil: 'load' });
      // JPEG avoids the alpha channel App Store Connect rejects; quality 95 is visually lossless.
      await page.screenshot({ path: path.join(dir, `${name}.jpg`), type: 'jpeg', quality: 95 });
      console.log(`${store}/${slot}/${name}.jpg`);
    }
    await page.close();
  }
  await browser.close();
})();
