/* 3D-часть элементов стен (общая для шкафа и кухни); логика и данные — в room-open-core.js */
import * as THREE from 'three';
import { roomEdges, openCenter, OPEN_KINDS, OPEN_COLORS, OPEN_INFO, OPEN_TINTS, ROOM_FINISH } from '/static/js/room-open-core.js?v=10';
export * from '/static/js/room-open-core.js?v=10';
/* ---- текстуры фартука и стеновых панелей: рисуем на canvas по виду (кладка, мозаика, мрамор, рейка…) ---- */
function rngSeed(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const shade = (hex, k) => { const n = parseInt(String(hex).slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k))); return `rgb(${f(n >> 16 & 255)},${f(n >> 8 & 255)},${f(n & 255)})`; };
function panelMat(THREE, inf, base, W, H, id) {
  const R = rngSeed(hashStr(id)), cv = document.createElement('canvas'), p = inf.pat, tw = inf.tw || 10, th = inf.th || 10, grout = inf.grout || shade(base, -.3);
  const mk = (w, h) => { cv.width = w; cv.height = h; return cv.getContext('2d'); };
  let c, rep = [1, 1];
  if (p === 'grid') {
    const cw = 128, ch = Math.max(32, Math.round(128 * th / tw)); c = mk(cw, ch); c.fillStyle = grout; c.fillRect(0, 0, cw, ch); c.fillStyle = base; c.fillRect(2, 2, cw - 4, ch - 4);
    const g = c.createLinearGradient(0, 0, cw, ch); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(0,0,0,.08)'); c.fillStyle = g; c.fillRect(2, 2, cw - 4, ch - 4); rep = [W / tw, H / th];
  } else if (p === 'brick') {
    const cw = 256, ch = Math.max(48, Math.round(256 * th / tw)), hh = ch / 2, tl = (x, y) => { c.fillStyle = shade(base, (R() - .5) * .1); c.fillRect(x, y, cw / 2 - 4, hh - 4); };
    c = mk(cw, ch); c.fillStyle = grout; c.fillRect(0, 0, cw, ch); tl(2, 2); tl(cw / 2 + 2, 2); tl(-cw / 4 + 2, hh + 2); tl(cw / 4 + 2, hh + 2); tl(3 * cw / 4 + 2, hh + 2); rep = [W / (2 * tw), H / (2 * th)];
  } else if (p === 'mosaic') {
    c = mk(128, 128); c.fillStyle = grout; c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.fillStyle = shade(base, (R() - .5) * .28); c.fillRect(i * 32 + 2, j * 32 + 2, 28, 28); } rep = [W / (4 * tw), H / (4 * th)];
  } else if (p === 'hex') {
    const r = 32; c = mk(96, 111); c.fillStyle = grout; c.fillRect(0, 0, 96, 111);
    const hx = (cx, cy) => { c.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; c.lineTo(cx + (r - 2.5) * Math.cos(a), cy + (r - 2.5) * Math.sin(a)); } c.closePath(); c.fillStyle = shade(base, (R() - .5) * .08); c.fill(); };
    [[0, 0], [48, 55.4], [96, 0], [0, 110.8], [96, 110.8]].forEach(q => hx(q[0], q[1])); rep = [W / (1.5 * tw), H / (1.732 * tw)];
  } else if (p === 'diamond') {
    c = mk(128, 128); c.fillStyle = grout; c.fillRect(0, 0, 128, 128);
    const d = (cx, cy) => { c.beginPath(); c.moveTo(cx, cy - 61); c.lineTo(cx + 61, cy); c.lineTo(cx, cy + 61); c.lineTo(cx - 61, cy); c.closePath(); c.fillStyle = shade(base, (R() - .5) * .08); c.fill(); };
    d(64, 64); d(0, 0); d(128, 0); d(0, 128); d(128, 128); rep = [W / tw, H / tw];
  } else if (p === 'herring') {
    const cw = 192, s = 40, pw = 32; c = mk(cw, s * 4); c.fillStyle = grout; c.fillRect(0, 0, cw, s * 4);
    for (let k = -6; k < 12; k++) { const y = k * s; c.beginPath(); c.moveTo(0, y); c.lineTo(cw / 2, y + cw / 2); c.lineTo(cw, y); c.lineTo(cw, y + pw); c.lineTo(cw / 2, y + cw / 2 + pw); c.lineTo(0, y + pw); c.closePath(); c.fillStyle = shade(base, (R() - .5) * .12); c.fill(); c.strokeStyle = grout; c.lineWidth = 1.5; c.stroke(); }
    rep = [W / th, H / (th * s * 4 / cw)];
  } else if (p === 'slab') {
    c = mk(1024, 512); c.fillStyle = base; c.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 1800; i++) { c.fillStyle = shade(base, (R() - .5) * .08); c.fillRect(R() * 1024, R() * 512, 2 + R() * 3, 2 + R() * 3); }
    c.strokeStyle = inf.veins || shade(base, -.3);
    if (inf.fin) {   // мрамор: тонкие извилистые жилы, идущие наискосок, и редкие широкие прожилки
      for (let i = 0; i < 46; i++) { c.globalAlpha = .08 + R() * .4; c.lineWidth = i % 9 === 0 ? 1.8 + R() * 2.2 : .35 + R() * 1.1; c.beginPath(); let x = R() * 1100 - 40, y = -10; c.moveTo(x, y); while (y < 520) { x += (R() - .35) * 70; y += 30 + R() * 50; c.lineTo(x, y); } c.stroke(); }
    } else for (let i = 0; i < 14; i++) { c.globalAlpha = .12 + R() * .35; c.lineWidth = .6 + R() * 3; c.beginPath(); const y0 = R() * 512; c.moveTo(-10, y0); c.bezierCurveTo(300 + R() * 200, y0 + (R() - .5) * 260, 600 + R() * 200, y0 + (R() - .5) * 260, 1034, y0 + (R() - .5) * 300); c.stroke(); }
    c.globalAlpha = 1; if (inf.fin) rep = [W / 240, H / 120];
  } else if (p === 'parquet') {   // доски вразбежку: ширина tw, длина th
    const cw = 256, rows = 4, rh = 256 / rows; c = mk(cw, 256); c.fillStyle = shade(base, -.45); c.fillRect(0, 0, cw, 256);
    for (let r = 0; r < rows; r++) { let x = -((r * 91) % 256); while (x < cw) { const L = 256; c.fillStyle = shade(base, (R() - .5) * .22); c.fillRect(x + 1, r * rh + 1, L - 2, rh - 2);
      for (let k = 0; k < 7; k++) { c.strokeStyle = shade(base, -.25); c.globalAlpha = .1 + R() * .12; c.lineWidth = .6 + R(); const yy = r * rh + 4 + R() * (rh - 8); c.beginPath(); c.moveTo(x, yy); c.bezierCurveTo(x + 70, yy + 3 * (R() - .5), x + 170, yy - 3 * (R() - .5), x + L, yy); c.stroke(); } c.globalAlpha = 1; x += L; } }
    rep = [W / th, H / (rows * tw)];
  } else if (p === 'stripe') {
    c = mk(128, 8); c.fillStyle = base; c.fillRect(0, 0, 128, 8); c.fillStyle = inf.col2 || shade(base, -.1); c.fillRect(0, 0, 64, 8); rep = [W / (2 * tw), 1];
  } else if (p === 'checker') {
    c = mk(128, 128); c.fillStyle = base; c.fillRect(0, 0, 128, 128); c.fillStyle = inf.col2 || shade(base, -.6); c.fillRect(0, 0, 64, 64); c.fillRect(64, 64, 64, 64);
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2; c.strokeRect(0, 0, 128, 128); c.beginPath(); c.moveTo(64, 0); c.lineTo(64, 128); c.moveTo(0, 64); c.lineTo(128, 64); c.stroke(); rep = [W / (2 * tw), H / (2 * (inf.th || tw))];
  } else if (p === 'geo') {
    c = mk(128, 128); c.fillStyle = base; c.fillRect(0, 0, 128, 128); c.strokeStyle = inf.col2 || shade(base, -.3); c.lineWidth = 3;
    c.beginPath(); c.moveTo(64, 6); c.lineTo(122, 64); c.lineTo(64, 122); c.lineTo(6, 64); c.closePath(); c.stroke(); c.beginPath(); c.arc(64, 64, 22, 0, 7); c.stroke();
    c.fillStyle = inf.col2 || shade(base, -.3); [[0, 0], [128, 0], [0, 128], [128, 128]].forEach(q => { c.beginPath(); c.arc(q[0], q[1], 14, 0, 7); c.fill(); }); rep = [W / tw, H / (th || tw)];
  } else if (p === 'damask') {
    c = mk(128, 128); c.fillStyle = base; c.fillRect(0, 0, 128, 128); c.fillStyle = inf.col2 || shade(base, -.2);
    const pet = (cx, cy, s) => { for (let k = 0; k < 4; k++) { c.save(); c.translate(cx, cy); c.rotate(k * Math.PI / 2); c.beginPath(); c.ellipse(0, -s * .55, s * .3, s * .6, 0, 0, 7); c.fill(); c.restore(); } c.beginPath(); c.arc(cx, cy, s * .2, 0, 7); c.fill(); };
    pet(64, 64, 34); pet(0, 0, 22); pet(128, 0, 22); pet(0, 128, 22); pet(128, 128, 22); c.globalAlpha = .6; c.fillStyle = base; c.beginPath(); c.arc(64, 64, 8, 0, 7); c.fill(); c.globalAlpha = 1; rep = [W / tw, H / (th || tw)];
  } else if (p === 'linen') {
    c = mk(128, 128); c.fillStyle = base; c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 520; i++) { c.fillStyle = R() > .5 ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.09)'; if (R() > .5) c.fillRect(0, R() * 128, 128, .6); else c.fillRect(R() * 128, 0, .6, 128); } rep = [W / 60, H / 60];
  } else if (p === 'terrazzo') {
    c = mk(256, 256); c.fillStyle = base; c.fillRect(0, 0, 256, 256); const cols = ['#9a8f82', '#c9b48a', '#6d7073', '#b06a4f', '#f4f1ea', '#4a5a6a'];
    for (let i = 0; i < 160; i++) { c.fillStyle = cols[(R() * cols.length) | 0]; c.beginPath(); const x = R() * 256, y = R() * 256, r0 = 1.5 + R() * 4; c.moveTo(x, y - r0); c.lineTo(x + r0 * (1 + R() * .5), y + r0 * .3); c.lineTo(x - r0 * .4, y + r0 * (.8 + R() * .5)); c.closePath(); c.fill(); } rep = [W / 120, H / 120];
  } else if (p === 'flat') {
    c = mk(64, 256); const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, shade(base, .1)); g.addColorStop(.5, base); g.addColorStop(1, shade(base, -.06)); c.fillStyle = g; c.fillRect(0, 0, 64, 256);
  } else if (p === 'wood') {
    c = mk(256, 256); c.fillStyle = base; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 90; i++) { c.fillStyle = shade(base, (R() - .5) * .22); c.globalAlpha = .35; c.fillRect(R() * 256, 0, .6 + R() * 2, 256); } c.globalAlpha = 1;
    c.fillStyle = shade(base, -.35); [64, 128, 192, 0].forEach(x => c.fillRect(x, 0, 1.5, 256)); rep = [W / (4 * tw), H / 60];
  } else if (p === 'brushed') {
    c = mk(256, 256); c.fillStyle = base; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 700; i++) { c.fillStyle = R() > .5 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.10)'; c.fillRect(0, R() * 256, 256, .5 + R()); } rep = [W / 60, H / 60];
  } else if (p === 'ribbed') {
    c = mk(64, 16); const g = c.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, shade(base, -.32)); g.addColorStop(.3, shade(base, .12)); g.addColorStop(.7, base); g.addColorStop(1, shade(base, -.38)); c.fillStyle = g; c.fillRect(0, 0, 64, 16); rep = [W / tw, 1];
  } else if (p === 'frame') {
    const cw = 256, ch = Math.round(256 * th / tw); c = mk(cw, ch); c.fillStyle = base; c.fillRect(0, 0, cw, ch);
    c.strokeStyle = 'rgba(0,0,0,.38)'; c.lineWidth = 4; c.strokeRect(22, 22, cw - 44, ch - 44); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3; c.strokeRect(27, 27, cw - 54, ch - 54); rep = [W / tw, H / th];
  } else if (p === 'wave') {
    c = mk(128, 8); for (let x = 0; x < 128; x++) { c.fillStyle = shade(base, Math.sin(x / 128 * Math.PI * 2) * .2); c.fillRect(x, 0, 1.2, 8); } rep = [W / tw, 1];
  } else if (p === 'slats') {
    c = mk(64, 16); c.fillStyle = shade(base, -.78); c.fillRect(0, 0, 64, 16);
    for (let x = 0; x < 52; x++) { c.fillStyle = shade(base, (R() - .5) * .14 + (x < 4 || x > 48 ? -.12 : 0)); c.fillRect(x, 0, 1.2, 16); } rep = [W / tw, 1];
  } else if (p === 'soft') {
    c = mk(128, 128); c.fillStyle = base; c.fillRect(0, 0, 128, 128);
    const g = c.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(0,0,0,.2)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    c.strokeStyle = shade(base, -.4); c.lineWidth = 3; c.beginPath(); c.moveTo(0, 64); c.lineTo(64, 0); c.lineTo(128, 64); c.lineTo(64, 128); c.closePath(); c.stroke();
    c.fillStyle = shade(base, -.45); [[0, 0], [128, 0], [0, 128], [128, 128], [64, 64]].forEach(q => { c.beginPath(); c.arc(q[0], q[1], 6, 0, 7); c.fill(); }); rep = [W / tw, H / th];
  } else {   // зеркало
    c = mk(64, 256); const g = c.createLinearGradient(0, 0, 64, 256); g.addColorStop(0, '#f4f9fb'); g.addColorStop(.5, '#c9d9e0'); g.addColorStop(1, '#eef5f8'); c.fillStyle = g; c.fillRect(0, 0, 64, 256);
  }
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; if (inf.uvCm) tex.repeat.set(rep[0], rep[1]); else tex.repeat.set(Math.max(.2, rep[0]), Math.max(.2, rep[1])); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: inf.gloss != null ? inf.gloss : .5, metalness: inf.metal || 0, envMapIntensity: p === 'mirror' || p === 'flat' ? 1.2 : .7 });
}
/* материал пола или стены по каталогу отделки; uvCm — UV в сантиметрах (многоугольный пол), иначе 0..1 по размеру W×H */
export function finishMat(kind, id, tint, W, H, uvCm) {
  const inf = ROOM_FINISH[kind] && ROOM_FINISH[kind][id]; if (!inf) return null;
  const base = /^#[0-9a-f]{6}$/i.test(tint || '') ? tint : inf.col, g = inf.gloss != null ? inf.gloss : .5;
  if (inf.pat === 'flat') return new THREE.MeshStandardMaterial({ color: base, roughness: g });
  if (inf.pat === 'mirror') return new THREE.MeshStandardMaterial({ color: base, roughness: .05, metalness: .85, envMapIntensity: 1.3 });
  return panelMat(THREE, Object.assign({ fin: 1, uvCm: !!uvCm }, inf), base, uvCm ? 1 : Math.max(10, W), uvCm ? 1 : Math.max(10, H), kind + id + (tint || ''));
}
/* ---- 3D ---- */
export function buildOpenings(parent, opens, P, ctx) {
  // ctx: { mat(hex, opts), glass(), picks[], meta(i), edgeMat? } → возвращает карту id → группа
  const E = roomEdges(P), groups = new Map(), DEG = Math.PI / 180;
  const box = (g, w, h, d, m, x, y, z, pick, i) => { const me = new THREE.Mesh(new THREE.BoxGeometry(Math.max(.05, w), Math.max(.05, h), Math.max(.05, d)), m); me.position.set(x + w / 2, y + h / 2, z + d / 2); me.castShadow = me.receiveShadow = true; if (pick) { me.userData.sel = ctx.meta(i); ctx.picks.push(me); } g.add(me); return me; };
  const white = ctx.mat('#f4f4f2', { roughness: .5 }), dark = ctx.mat('#4a4a4a', { roughness: .6 }), wood = ctx.mat('#8b5a33', { roughness: .55 }), chrome = ctx.mat('#c9ccd0', { roughness: .25, metalness: .8 }), beige = ctx.mat('#e6dfd2', { roughness: .9 });
  opens.forEach((o, i) => {
    const c = openCenter(o, E); if (!c) return; const e = c.e, g = new THREE.Group(), w = o.w, h = o.h;
    g.position.set(c.x + e.nx * ((o.kind === 'apron' || o.kind === 'wpanel') ? 0 : .1), o.y, c.z + e.nz * ((o.kind === 'apron' || o.kind === 'wpanel') ? 0 : .1)); g.rotation.y = Math.atan2(e.nx, e.nz); parent.add(g); groups.set(o.id, g);
    const bx = (bw, bh, bd, m, x, y, z, pk) => box(g, bw, bh, bd, m, x, y, z, pk !== false, i);
    const k = o.kind;
    const cols = OPEN_COLORS[k] || [], cc = cols[Math.max(0, Math.min(cols.length - 1, o.c | 0))], fm = cc ? ctx.mat(cc[0], { roughness: .5 }) : white, v = o.v;
    const arcTop = (cx, cy, r, tube, mat, z, depth) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 28, Math.PI), mat); m.position.set(cx, cy, z + depth / 2); m.castShadow = true; m.userData.sel = ctx.meta(i); ctx.picks.push(m); g.add(m); };
    const disc = (cx, cy, r, mat, z, half) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 36, 0, half ? Math.PI : Math.PI * 2), mat); m.position.set(cx, cy, z); g.add(m); };
    if (k === 'door' || k === 'balcony') {
      const f = 4;
      if (v === 'arch') {   // арка: проёма без полотна
        const pr = w / 2; bx(f, h - pr + f, 3.2, fm, -w / 2 - f, 0, 0); bx(f, h - pr + f, 3.2, fm, w / 2, 0, 0); arcTop(0, h - pr, pr + f / 2, f / 2, fm, 0, 3.2);
      } else {
        bx(f, h + f, 3.2, fm, -w / 2 - f, 0, 0); bx(f, h + f, 3.2, fm, w / 2, 0, 0); bx(w + 2 * f, f, 3.2, fm, -w / 2 - f, h, 0);
        if (v === 'sliding') {   // раздвижная: полотно перед стеной на направляющей
          bx(w * 1.1, 3, 3, chrome, -w / 2 - w * .05, h + f, 3.2); bx(w * .62, h - .4, 3.4, fm, -w / 2 + w * .5, .2, 3.4); bx(1.6, 12, 2.2, chrome, -w / 2 + w * .5 + 4, h * .5 - 6, 6.8);
        } else if (v === 'double') {
          const lw = (w - .9) / 2; bx(lw, h - .4, 3.6, k === 'balcony' ? ctx.glass() : fm, -w / 2 + .3, .2, .6); bx(lw, h - .4, 3.6, k === 'balcony' ? ctx.glass() : fm, .3, .2, .6);
          bx(1.4, 12, 2.6, chrome, -4, h * .5 - 6, 4); bx(1.4, 12, 2.6, chrome, 2.6, h * .5 - 6, 4);
        } else if (v === 'entry') {
          bx(w - .6, h - .4, 4.6, ctx.mat('#8a8f94', { roughness: .35, metalness: .7 }), -w / 2 + .3, .2, .6); bx(2, 2, 1, chrome, w * .1, h * .72, 5.2); bx(2.4, 14, 2.6, chrome, w / 2 - 8, h * .5 - 7, 5.2);
        } else if (v === 'glass') {
          bx(w - .6, h - .4, 3.6, fm, -w / 2 + .3, .2, .6); bx(w * .5, h * .55, .8, ctx.glass(), -w / 4, h * .3, 4.1, false); bx(1.6, 12, 2.6, chrome, w / 2 - 6, h * .5 - 6, 4);
        } else if (v === 'panel') {
          bx(w - .6, h - .4, 3.6, fm, -w / 2 + .3, .2, .6); const dk = ctx.mat('#000000', { roughness: .8, transparent: true, opacity: .14 });
          [[.1, .06, .8, .36], [.1, .46, .8, .46]].forEach(r => bx(w * r[2], h * r[3], .5, dk, -w / 2 + w * r[0], h * r[1], 4.1, false)); bx(1.6, 12, 2.6, chrome, w / 2 - 6, h * .5 - 6, 4);
        } else {
          bx(w - .6, h - .4, 3.6, k === 'balcony' ? ctx.glass() : fm, -w / 2 + .3, .2, .6);
          if (k === 'balcony') { bx(w - .6, 3, 3.8, fm, -w / 2 + .3, h * .45, .5); bx(3, h - .4, 3.8, fm, -1.5, .2, .5); }
          bx(1.6, 12, 2.6, chrome, w / 2 - 6, h * .5 - 6, 4);
        }
      }
    } else if (k === 'window') {
      const f = 4.5, ns = Math.max(1, o.n | 0 || 1), handles = v !== 'fixed';
      if (v === 'round') {
        const r = Math.min(w, h) / 2; const m = new THREE.Mesh(new THREE.TorusGeometry(r - 2, 2.4, 10, 40), fm); m.position.set(0, h / 2, 2.5); m.castShadow = true; m.userData.sel = ctx.meta(i); ctx.picks.push(m); g.add(m); disc(0, h / 2, r - 2, ctx.glass(), 2.2, false);
        bx(r * 2 - 4, 3, 3, fm, -r + 2, h / 2 - 1.5, 1); bx(3, r * 2 - 4, 3, fm, -1.5, h / 2 - r + 2, 1);
      } else if (v === 'arch') {
        const pr = w / 2, hr = h - pr; bx(f, hr, 5, fm, -w / 2, 0, 0); bx(f, hr, 5, fm, w / 2 - f, 0, 0); bx(w - 2 * f, f, 5, fm, -w / 2 + f, 0, 0);
        arcTop(0, hr, pr - f / 2, f / 2 + .4, fm, 0, 5); bx(w - 2 * f, hr - f, .6, ctx.glass(), -w / 2 + f, f, 2, false); disc(0, hr, pr - f, ctx.glass(), 2, true);
        for (let j = 1; j < ns; j++) bx(3.4, hr - f + pr * .7, 4, fm, -w / 2 + j * w / ns - 1.7, f, .5);
        bx(w + 10, 2.4, 11, fm, -w / 2 - 5, -2.4, 0);
      } else {
        bx(f, h, 5, fm, -w / 2, 0, 0); bx(f, h, 5, fm, w / 2 - f, 0, 0); bx(w - 2 * f, f, 5, fm, -w / 2 + f, 0, 0); bx(w - 2 * f, f, 5, fm, -w / 2 + f, h - f, 0);
        bx(w - 2 * f, h - 2 * f, .6, ctx.glass(), -w / 2 + f, f, 2, false);
        const tr = v === 'transom' ? Math.min(40, h * .25) : 0, hb = h - 2 * f - tr;   // высота створок под фрамугой
        if (tr) bx(w - 2 * f, 3.6, 4.5, fm, -w / 2 + f, f + hb - 1.8, .5);
        for (let j = 1; j < ns; j++) bx(3.4, hb, 4, fm, -w / 2 + j * w / ns - 1.7, f, .5);
        if (handles) for (let j = 0; j < ns; j++) bx(1.6, 10, 3, chrome, -w / 2 + (j + .5) * w / ns + (ns > 1 ? 4 : 0), f + hb * .5 - 5, 5.5);
        if (v !== 'pano') bx(w + 10, 2.4, 11, fm, -w / 2 - 5, -2.4, 0);
      }
    } else if (k === 'socket' || k === 'socket2') {
      bx(w, h, 1.4, white, -w / 2, 0, 0); const n = k === 'socket2' ? 2 : 1;
      for (let j = 0; j < n; j++) { const cx = (j - (n - 1) / 2) * 7; bx(4.6, 4.6, .4, ctx.mat('#e9e9e6', { roughness: .4 }), cx - 2.3, h / 2 - 2.3, 1.4, false); bx(.7, .7, .3, dark, cx - 1.3, h / 2 - .35, 1.8, false); bx(.7, .7, .3, dark, cx + .6, h / 2 - .35, 1.8, false); }
    } else if (k === 'switch') {
      bx(w, h, 1.2, white, -w / 2, 0, 0); bx(w - 2.6, h - 2.6, .6, ctx.mat('#ededea', { roughness: .4 }), -w / 2 + 1.3, 1.3, 1.2, false);
    } else if (k === 'radiator') {
      const n = Math.max(3, Math.round(w / 8)); bx(w, 3, 9, white, -w / 2, 0, 0); bx(w, 3, 9, white, -w / 2, h - 3, 0);
      for (let j = 0; j < n; j++) bx(w / n - 1, h - 6, 8, white, -w / 2 + j * w / n + .5, 3, .5, j === 0);
    } else if (k === 'vent') {
      bx(w, h, 1, white, -w / 2, 0, 0); for (let j = 0; j < 4; j++) bx(w - 3, .8, .5, dark, -w / 2 + 1.5, 2.5 + j * (h - 5) / 3.4, 1, false);
    } else if (k === 'pipe') {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, h, 18), white); m.position.set(0, h / 2, w / 2 + .5); m.castShadow = true; m.userData.sel = ctx.meta(i); ctx.picks.push(m); g.add(m);
    } else if (k === 'column') {
      bx(w, h, o.d || 40, beige, -w / 2, 0, -.1);
    } else if (k === 'apron' || k === 'wpanel') {   // сидит на стене: тыльная сторона вплотную к стене, толщина регулируется
      const inf = (OPEN_INFO[k] || {})[o.v] || Object.values(OPEN_INFO[k])[0], tint = (OPEN_TINTS[o.c | 0] || [''])[0], bs = tint || inf.col;
      bx(w, h, Math.max(.2, o.d || (k === 'apron' ? .6 : 1.8)), panelMat(THREE, inf, bs, w, h, o.id + '|' + o.v + '|' + bs), -w / 2, 0, 0);
    }
  });
  return groups;
}

/* луч мыши → ближайшая стена: { wall, off (до центра элемента), y } или null */
export function pickWall(ray, P, H) {
  const E = roomEdges(P); let best = null;
  E.forEach(e => {
    const den = ray.direction.x * e.nx + ray.direction.z * e.nz; if (Math.abs(den) < 1e-6) return;
    const t = ((e.a[0] - ray.origin.x) * e.nx + (e.a[1] - ray.origin.z) * e.nz) / den; if (t <= 0) return;
    const x = ray.origin.x + ray.direction.x * t, z = ray.origin.z + ray.direction.z * t, y = ray.origin.y + ray.direction.y * t;
    const s = (x - e.a[0]) * e.ex + (z - e.a[1]) * e.ez; if (s < -2 || s > e.L + 2 || y < -2 || y > H + 2) return;
    if (!best || t < best.t) best = { t, wall: e.i, s, y };
  });
  return best;
}
