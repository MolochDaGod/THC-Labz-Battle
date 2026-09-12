/**
 * Bake Duelyst idle/breathing rects into shared/duelystIdleFrames.json
 * so the library can CSS-sprite the unit instead of showing the packed atlas.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const genPath = path.join(root, 'shared', 'codexPlaySets.generated.ts');
const outPath = path.join(root, 'shared', 'duelystIdleFrames.json');

const src = fs.readFileSync(genPath, 'utf8');
const ids = [...src.matchAll(/"duelystId": "([^"]+)"/g)].map((m) => m[1]);
const unique = [...new Set(ids)];
console.log('duelyst ids', unique.length);

function parsePlist(xml) {
  const sizeM = xml.match(/<key>size<\/key>\s*<string>\{(\d+),(\d+)\}<\/string>/);
  const sheetW = sizeM ? +sizeM[1] : 0;
  const sheetH = sizeM ? +sizeM[2] : 0;
  const re = /<key>([^<]+\.png)<\/key>[\s\S]*?<key>frame<\/key>\s*<string>\{\{(\d+),(\d+)\},\{(\d+),(\d+)\}\}<\/string>/g;
  const frames = [];
  let m;
  while ((m = re.exec(xml))) {
    frames.push({ name: m[1], x: +m[2], y: +m[3], w: +m[4], h: +m[5] });
  }
  const idle =
    frames.find((f) => /_breathing_000|_idle_000/i.test(f.name)) ||
    frames.find((f) => /breathing|idle/i.test(f.name)) ||
    frames[0];
  if (!idle) return null;
  return { x: idle.x, y: idle.y, w: idle.w, h: idle.h, sheetW: sheetW || idle.x + idle.w, sheetH: sheetH || idle.y + idle.h, frame: idle.name };
}

const out = {};
const conc = 8;
for (let i = 0; i < unique.length; i += conc) {
  const batch = unique.slice(i, i + conc);
  await Promise.all(
    batch.map(async (id) => {
      const url = `https://assets.grudge-studio.com/sprites/duelyst/plists/${id}.plist`;
      try {
        const r = await fetch(url);
        if (!r.ok) {
          console.warn('miss', id, r.status);
          return;
        }
        const parsed = parsePlist(await r.text());
        if (parsed) out[id] = parsed;
      } catch (e) {
        console.warn('err', id, e.message);
      }
    }),
  );
  process.stdout.write(`baked ${Object.keys(out).length}/${unique.length}\n`);
}

fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
console.log('wrote', outPath, Object.keys(out).length);
