// Fills in author + licence for photos you saved from Wikimedia Commons without a credits row.
//
//   node scripts/commons-credits.mjs            # every folder in destination-photos/
//   node scripts/commons-credits.mjs agra jaipur
//
// Needs internet. For each image that is not yet in destination-photos/photo_credits*.csv it asks Wikimedia Commons
// who took it and under which licence (the file name must still be the original Commons name, with _ for spaces),
// and writes destination-photos/photo_credits_extra.csv in the same format as photo_credits.csv.
// Only CC0, public domain, CC BY and CC BY-SA photos are marked OK. Anything else is marked CHECK: do not use it on the site.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const UA = 'RoamoraPhotoCredits/1.0 (https://github.com/BhartiRai111/Trevel; photo licence check)';
const API = 'https://commons.wikimedia.org/w/api.php';
const OK_LICENSE = /^(CC0|Public domain|PD|CC BY(-SA)? \d(\.\d)?)/i;
const NONFREE = /(NC|ND)\b/i;

export const titleFromFile = f => 'File:' + f.replace(/\.[^.]+$/, m => m).replace(/_/g, ' ');
export const stripHtml = h => String(h ?? '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
export const csvCell = v => (/[",\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

/** One Commons API page -> one credits row (status OK / CHECK / NOT FOUND). */
export function rowFromPage(dest, file, page) {
  const title = titleFromFile(file), ii = page?.imageinfo?.[0], m = ii?.extmetadata;
  if (!page || page.missing !== undefined || !ii) return { dest, title, source: '', creator: '', license: '', licenseUrl: '', file, status: 'NOT FOUND' };
  const license = stripHtml(m.LicenseShortName?.value), creator = stripHtml(m.Artist?.value) || stripHtml(m.Credit?.value);
  const ok = OK_LICENSE.test(license) && !NONFREE.test(license) && (creator || /^(CC0|Public domain|PD)/i.test(license));
  return { dest, title: page.title, source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`, creator, license, licenseUrl: stripHtml(m.LicenseUrl?.value), file, status: ok ? 'OK' : 'CHECK' };
}

async function api(titles) {
  const url = `${API}?action=query&format=json&redirects=1&prop=imageinfo&iiprop=extmetadata&iiextmetadatafilter=Artist|Credit|LicenseShortName|LicenseUrl&titles=${encodeURIComponent(titles.join('|'))}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (r.status === 429 || r.status >= 500) { const wait = Number(r.headers.get('retry-after')) || 2 ** attempt * 2; console.log(`  Commons says slow down (${r.status}); waiting ${wait}s`); await new Promise(res => setTimeout(res, wait * 1000)); continue; }
    if (!r.ok) throw new Error(`Commons API ${r.status}`);
    return r.json();
  }
  throw new Error('Commons API kept refusing; try again in a few minutes');
}

async function main() {
  const root = path.resolve(import.meta.dirname, '..', 'destination-photos');
  const done = new Set();
  for (const f of fs.readdirSync(root).filter(f => /^photo_credits.*\.csv$/.test(f)))
    for (const line of fs.readFileSync(path.join(root, f), 'utf8').split('\n').slice(1)) { const c = line.split(','); const last = (c[c.length - 1] || '').trim(); if (last && !/^(ERROR|NOT FOUND)/.test(last)) done.add(`${c[0].replace(/^﻿/, '')}/${last}`); }
  const only = process.argv.slice(2);
  const todo = [];
  for (const d of fs.readdirSync(root, { withFileTypes: true }).filter(e => e.isDirectory() && (!only.length || only.includes(e.name))))
    for (const f of fs.readdirSync(path.join(root, d.name)).filter(f => /\.(jpe?g|png|webp)$/i.test(f) && !done.has(`${d.name}/${f}`))) todo.push({ dest: d.name, file: f });
  if (!todo.length) return console.log('Nothing to do: every photo already has a credits row.');
  console.log(`Looking up ${todo.length} photos on Wikimedia Commons...`);
  const rows = [];
  for (let i = 0; i < todo.length; i += 15) {
    const batch = todo.slice(i, i + 15), data = await api(batch.map(b => titleFromFile(b.file)));
    const norm = new Map(), pages = Object.values(data.query?.pages ?? {});
    for (const n of data.query?.normalized ?? []) norm.set(n.from, n.to);
    for (const r of data.query?.redirects ?? []) norm.set(r.from, r.to);
    for (const b of batch) {
      let t = titleFromFile(b.file); t = norm.get(t) ?? t; t = norm.get(t) ?? t;
      const page = pages.find(p => p.title === t) ?? pages.find(p => p.title.replace(/ /g, '_') === t.replace(/ /g, '_'));
      const row = rowFromPage(b.dest, b.file, page); rows.push(row);
      console.log(`${row.status.padEnd(9)} ${b.dest}/${b.file}  ${row.license}  ${row.creator.slice(0, 40)}`);
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  const out = path.join(root, 'photo_credits_extra.csv');
  const head = 'destination,attraction,commons_file_title,source_file_page,creator_or_attribution,license,license_url,downloaded_filename_or_status';
  // only OK rows go in the file the website reads; the rest are listed on screen for you to check by hand
  const good = rows.filter(r => r.status === 'OK');
  const prev = fs.existsSync(out) ? fs.readFileSync(out, 'utf8').replace(/^﻿/, '').trim().split('\n').slice(1) : [];
  fs.writeFileSync(out, [head, ...prev, ...good.map(r => [r.dest, '', r.title, r.source, r.creator, r.license, r.licenseUrl, r.file].map(csvCell).join(','))].join('\n') + '\n');
  console.log(`\n${good.length} photos have a free licence and were added to ${path.relative(process.cwd(), out)}.`);
  const bad = rows.filter(r => r.status !== 'OK');
  if (bad.length) console.log(`${bad.length} need a manual check (not found, or not a free licence). Do not use these on the site:\n` + bad.map(r => `  ${r.dest}/${r.file}: ${r.status} ${r.license}`).join('\n'));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch(e => { console.error('Failed:', e.message); process.exit(1); });
