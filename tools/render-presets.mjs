// Картинки готовых вариантов калькулятора: static/home/kc-<render>[-b][-640].webp (3D из самого калькулятора).
// Камеры берутся из PRESETS (поле cam: a — главный кадр, b — второй ракурс). После перерисовки поднять KC_REN_V в templates/index.html.
//   node tools/render-presets.mjs                 — все варианты с render
//   node tools/render-presets.mjs deepgreen ...   — только эти
// Нужно: запущенный сайт (KC_URL, по умолчанию http://127.0.0.1:8000), Playwright с Chromium, Python 3 с Pillow.
// Без интернета: KC_THREE_DIR — папка пакета three@0.160.0 (npm pack three@0.160.0), запросы к CDN отдаются из неё.
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
import fs from 'fs'; import os from 'os'; import path from 'path';

const URL0 = process.env.KC_URL || 'http://127.0.0.1:8000', THREE_DIR = process.env.KC_THREE_DIR || '';
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'static', 'home');
const W = 2560, H = 1600, only = process.argv.slice(2), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kc-render-'));

const b = await chromium.launch({ executablePath: process.env.KC_CHROMIUM || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1400, height: 900 } });
pg.on('pageerror', e => console.error('page error:', e.message));
if (THREE_DIR) await pg.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\//, r => {
  const f = path.join(THREE_DIR, r.request().url().split('three@0.160.0/')[1].split('?')[0]);
  return fs.existsSync(f) ? r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(f) }) : r.fulfill({ status: 404 });
});
await pg.goto(URL0 + '/calc', { waitUntil: 'domcontentloaded' });
await pg.waitForTimeout(3000);
await pg.evaluate(() => setRenderMode('3d'));
await pg.waitForFunction(() => typeof K3 !== 'undefined' && K3, null, { timeout: 60000 });
const list = await pg.evaluate(() => PRESETS.filter(p => p.render && p.cam).map(p => ({ id: p.id, render: p.render, cam: p.cam })));
const pngs = [];
for (const p of list.filter(p => !only.length || only.includes(p.id))) {
  await pg.evaluate(id => applyPreset(id), p.id);
  await pg.waitForTimeout(2500);   // фото декоров каталога догружаются
  for (const [k, suf] of [['a', ''], ['b', '-b']]) {
    const c = p.cam[k]; if (!c) continue;
    await pg.evaluate(c => { K3.setLight(true); K3.setCamera(c.pos, c.target, c.fov); }, c);
    await pg.waitForTimeout(800);
    const url = await pg.evaluate(([w, h]) => K3.snapshotHQ(w, h, { ceiling: true }), [W, H]);
    const f = path.join(tmp, `kc-${p.render}${suf}.png`); fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); pngs.push(f);
    console.log(p.id, k, '→', path.basename(f));
  }
}
await b.close();
// PNG 2560×1600 → webp 1280×800 (большая) и 640×400 (карточка)
execFileSync('python3', ['-c', `
import sys, os
from PIL import Image, ImageFilter
out = sys.argv[1]
for f in sys.argv[2:]:
    im = Image.open(f).convert('RGB'); n = os.path.basename(f)[:-4]
    im.resize((1280, 800), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=2)).save(os.path.join(out, n + '.webp'), 'WEBP', quality=82, method=6)
    im.resize((640, 400), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=0.8, percent=35, threshold=2)).save(os.path.join(out, n + '-640.webp'), 'WEBP', quality=80, method=6)
`, OUT, ...pngs], { stdio: 'inherit' });
fs.rmSync(tmp, { recursive: true, force: true });
console.log('готово:', pngs.length, 'кадров в', OUT, '— не забудьте поднять KC_REN_V');
