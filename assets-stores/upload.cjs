#!/usr/bin/env node
/**
 * Upload the rendered screenshots in assets-stores/apple/ to App Store Connect.
 *
 *   ASC_KEY_ID=... ASC_ISSUER_ID=... ASC_KEY_PATH=~/AuthKey_XXXX.p8 \
 *     node assets-stores/upload.cjs [--dry-run] [--locale en-US] [--version 3.7.0] [--slot "iPad 13"] [--no-duo]
 *
 * For each slot it replaces every screenshot in that display type's set on the
 * editable App Store version (the one in "Prepare for Submission"), uploading
 * the files in filename order. Other locales and display types are untouched.
 *
 * API key: App Store Connect > Users and Access > Integrations > App Store Connect API
 * (role App Manager or higher). Never commit the .p8; it is gitignored. In CI, pass the
 * file's contents as ASC_KEY_P8 instead of ASC_KEY_PATH (see .github/workflows/store-screenshots.yml).
 */
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BUNDLE_ID = 'com.wyne.scorepad';
const API = 'https://api.appstoreconnect.apple.com';
const OUT = path.join(__dirname, 'apple');

// Slot folder(s) -> screenshotDisplayType. Folders sharing a type go into one
// set, in the order listed here. APP_IPHONE_DUO is not in Apple's published
// OpenAPI spec yet (accepted by the live API per third-party reports); pass
// --no-duo if Apple rejects it.
const SETS = [
  { type: 'APP_IPHONE_67', folders: ['iPhone 6.9'] },
  { type: 'APP_IPHONE_61', folders: ['iPhone 6.1'] },
  { type: 'APP_IPAD_PRO_3GEN_129', folders: ['iPad 13'] },
  {
    type: 'APP_IPHONE_DUO', duo: true,
    folders: ['iPhone Duo outer', 'iPhone Duo inner (landscape)', 'iPhone Duo inner (portrait)'],
  },
];

const EDITABLE = new Set([
  'PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY',
]);

function parseArgs(argv) {
  const a = { dryRun: false, locale: 'en-US', version: null, slots: [], duo: true };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--dry-run') a.dryRun = true;
    else if (k === '--no-duo') a.duo = false;
    else if (k === '--locale') a.locale = argv[++i];
    else if (k === '--version') a.version = argv[++i];
    else if (k === '--slot') a.slots.push(argv[++i]);
    else throw new Error(`Unknown argument: ${k}`);
  }
  return a;
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function token() {
  const { ASC_KEY_ID: kid, ASC_ISSUER_ID: iss, ASC_KEY_PATH: keyPath, ASC_KEY_P8: keyText } = process.env;
  if (!kid || !iss || !(keyPath || keyText)) {
    throw new Error('Set ASC_KEY_ID, ASC_ISSUER_ID and either ASC_KEY_PATH (.p8 file) or ASC_KEY_P8 (its contents).');
  }
  const key = keyText || fs.readFileSync(keyPath.replace(/^~/, os.homedir()), 'utf8');
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'ES256', kid, typ: 'JWT' }));
  const body = b64url(JSON.stringify({ iss, iat: now, exp: now + 15 * 60, aud: 'appstoreconnect-v1' }));
  const sig = crypto.sign('sha256', Buffer.from(`${head}.${body}`), { key, dsaEncoding: 'ieee-p1363' });
  return `${head}.${body}.${b64url(sig)}`;
}

let jwt;
async function api(method, url, body) {
  const res = await fetch(url.startsWith('http') ? url : API + url, {
    method,
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status}\n${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

function filesFor(set) {
  return set.folders.flatMap((folder) => {
    const dir = path.join(OUT, folder);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort().map((f) => path.join(dir, f));
  });
}

async function findLocalization({ locale, version }) {
  const apps = await api('GET', `/v1/apps?filter[bundleId]=${BUNDLE_ID}`);
  const app = apps.data[0];
  if (!app) throw new Error(`No app with bundle id ${BUNDLE_ID}`);
  const versions = await api('GET', `/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=20`);
  const v = versions.data.find((d) =>
    version ? d.attributes.versionString === version : EDITABLE.has(d.attributes.appStoreState));
  if (!v) throw new Error(version ? `Version ${version} not found` : 'No editable App Store version; create one in App Store Connect first.');
  if (!EDITABLE.has(v.attributes.appStoreState)) throw new Error(`Version ${v.attributes.versionString} is ${v.attributes.appStoreState} and can't be edited.`);
  const locs = await api('GET', `/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations?limit=50`);
  const loc = locs.data.find((d) => d.attributes.locale === locale);
  if (!loc) throw new Error(`Locale ${locale} not on version ${v.attributes.versionString}`);
  return { loc, versionString: v.attributes.versionString };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// App Store Connect processes each image after the commit PATCH; wait until it
// is COMPLETE so a rejected image fails the run instead of leaving a gap.
async function waitForDelivery(id, file, timeoutMs = 10 * 60 * 1000) {
  const start = Date.now();
  for (;;) {
    const res = await api('GET', `/v1/appScreenshots/${id}?fields[appScreenshots]=assetDeliveryState`);
    const st = res.data.attributes.assetDeliveryState || {};
    if (st.state === 'COMPLETE') return;
    if (st.state === 'FAILED') {
      const why = (st.errors || []).map((e) => `${e.code}: ${e.description}`).join('; ') || 'no details';
      throw new Error(`App Store Connect rejected ${file}: ${why}`);
    }
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for ${file} (state ${st.state})`);
    await sleep(Number(process.env.ASC_POLL_MS) || 3000);
  }
}

async function uploadSet(locId, type, files) {
  const sets = await api('GET', `/v1/appStoreVersionLocalizations/${locId}/appScreenshotSets?filter[screenshotDisplayType]=${type}`);
  let set = sets.data[0];
  if (!set) {
    set = (await api('POST', '/v1/appScreenshotSets', {
      data: {
        type: 'appScreenshotSets', attributes: { screenshotDisplayType: type },
        relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: locId } } },
      },
    })).data;
  }
  const existing = await api('GET', `/v1/appScreenshotSets/${set.id}/appScreenshots?limit=50`);
  for (const s of existing.data) await api('DELETE', `/v1/appScreenshots/${s.id}`);

  const ids = [];
  for (const file of files) {
    const buf = fs.readFileSync(file);
    const shot = (await api('POST', '/v1/appScreenshots', {
      data: {
        type: 'appScreenshots', attributes: { fileName: path.basename(file), fileSize: buf.length },
        relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: set.id } } },
      },
    })).data;
    for (const op of shot.attributes.uploadOperations) {
      const headers = Object.fromEntries(op.requestHeaders.map((h) => [h.name, h.value]));
      const res = await fetch(op.url, { method: op.method, headers, body: buf.subarray(op.offset, op.offset + op.length) });
      if (!res.ok) throw new Error(`Upload of ${file} failed: ${res.status}`);
    }
    await api('PATCH', `/v1/appScreenshots/${shot.id}`, {
      data: {
        type: 'appScreenshots', id: shot.id,
        attributes: { uploaded: true, sourceFileChecksum: crypto.createHash('md5').update(buf).digest('hex') },
      },
    });
    ids.push(shot.id);
    console.log(`  ${path.relative(OUT, file)} uploaded`);
  }
  for (const [i, id] of ids.entries()) {
    await waitForDelivery(id, path.relative(OUT, files[i]));
    console.log(`  ${path.relative(OUT, files[i])} processed`);
  }
  await api('PATCH', `/v1/appScreenshotSets/${set.id}/relationships/appScreenshots`, {
    data: ids.map((id) => ({ type: 'appScreenshots', id })),
  });
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const plan = SETS
    .filter((s) => args.duo || !s.duo)
    // A set is replaced as a whole, so --slot picks every folder of a matching set.
    .filter((s) => !args.slots.length || s.folders.some((f) => args.slots.includes(f)))
    .map((s) => ({ ...s, files: filesFor(s) }))
    .filter((s) => s.files.length);

  for (const s of plan) {
    console.log(`${s.type}: ${s.files.length} file(s)`);
    if (args.dryRun) s.files.forEach((f) => console.log(`  ${path.relative(OUT, f)}`));
  }
  if (args.dryRun) return;

  jwt = token();
  const { loc, versionString } = await findLocalization(args);
  console.log(`Uploading to ${versionString} (${args.locale})`);
  for (const s of plan) {
    console.log(`${s.type}`);
    await uploadSet(loc.id, s.type, s.files);
  }
  console.log('Done. Every screenshot finished processing.');
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
