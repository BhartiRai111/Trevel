// Turns the originals in destination-photos/ into web-sized photos in public/photos/ and writes the credits.
//   node scripts/build-photos.mjs
// Inputs : scripts/photos.manifest.json (which photo is used where), destination-photos/photo_credits*.csv (author + licence per photo)
// Outputs: public/photos/<folder>/<name>.jpg (2000 px wide) and <name>-sm.jpg (900 px wide), lib/photoManifest.json
// A photo is only used if its credit row has an author and a licence. Originals are never changed.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'destination-photos'), OUT = path.join(ROOT, 'public', 'photos');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'photos.manifest.json'), 'utf8'));

function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift().map(h => h.replace(/^﻿/, ''));
  return rows.filter(r => r.length > 1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

// credits: by "<folder>/<file>"
const credits = new Map();
for (const f of fs.readdirSync(SRC).filter(f => /^photo_credits.*\.csv$/.test(f)))
  for (const r of parseCsv(fs.readFileSync(path.join(SRC, f), 'utf8')))
    if (r.downloaded_filename_or_status && !/^(ERROR|NOT FOUND)/.test(r.downloaded_filename_or_status)) credits.set(`${r.destination}/${r.downloaded_filename_or_status}`, r);

fs.rmSync(OUT, { recursive: true, force: true });
const result = {}; const creditList = []; let skipped = 0;
for (const m of manifest) {
  const c = credits.get(m.src);
  if (!c || !c.creator_or_attribution?.trim() && !/^(CC0|Public domain)/i.test(c?.license ?? '') || !c.license?.trim()) { console.log(`SKIP ${m.src}: no author/licence in the credits file`); skipped++; continue; }
  const dir = path.join(OUT, m.folder); fs.mkdirSync(dir, { recursive: true });
  let img = sharp(path.join(SRC, m.src)).rotate();
  const meta = await img.metadata();
  if (m.crop) {
    const top = Math.round(meta.height * ((m.crop.topPct ?? 0) / 100)), bottom = Math.round(meta.height * ((m.crop.bottomPct ?? 0) / 100));
    img = sharp(await img.toBuffer()).extract({ left: 0, top, width: meta.width, height: meta.height - top - bottom });
  }
  const buf = await img.toBuffer();
  const lg = `/photos/${m.folder}/${m.out}.jpg`, sm = `/photos/${m.folder}/${m.out}-sm.jpg`;
  const a = await sharp(buf).resize({ width: 2000, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(ROOT, 'public', lg));
  await sharp(buf).resize({ width: 900, withoutEnlargement: true }).jpeg({ quality: 76, mozjpeg: true }).toFile(path.join(ROOT, 'public', sm));
  const d = (result[m.dest] ??= { hero: '', gallery: [], items: {} });
  if (m.hero) d.hero = lg; else if (m.bg) d.gallery.push(lg);
  if (m.item) d.items[m.item] = lg;
  creditList.push({ dest: m.dest, folder: m.folder, path: lg, thumb: sm, width: a.width, height: a.height, alt: m.alt, place: c.attraction, title: c.commons_file_title.replace(/^File:/, ''), creator: c.creator_or_attribution || '(public domain)', license: c.license, licenseUrl: c.license_url, source: c.source_file_page, changes: m.crop ? 'Resized and cropped' : 'Resized' });
  console.log(`ok   ${m.src} -> ${lg} (${a.width}x${a.height}, ${(a.size / 1024) | 0} KB)`);
}
fs.writeFileSync(path.join(ROOT, 'lib', 'photoManifest.json'), JSON.stringify({ dest: result, credits: creditList }, null, 2) + '\n');
console.log(`\n${creditList.length} photos written, ${skipped} skipped. Manifest: lib/photoManifest.json`);
