/* 3D-визуализация кухни (Three.js). Строится из той же модели, что и чертежи: раскладка по стенам, размеры в см,
   цвета и текстуры из каталога, фурнитура из каталога kis.uz (петли, ручки, TIP-ON, подъёмники, ящики, угловые механизмы).
   API: createK3D(container, hooks) -> { update(state), setView(name), toggle(key), openAll(on), select(key), dispose() }
   hooks.onSelect({tier,id}|null), hooks.onDouble(key) */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const DEG = Math.PI / 180;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/* ---------- процедурные текстуры ---------- */
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  return t;
}
const FLOOR_TEX = () => canvasTex(1024, 1024, (g, w, h) => {
  const rows = 8, rh = h / rows;
  for (let r = 0; r < rows; r++) {
    let x = -(r % 3) * 140;
    while (x < w) {
      const L = 260 + ((r * 97 + x) % 180), base = 150 + ((r * 31 + x * 7) % 30);
      g.fillStyle = `rgb(${base + 45},${base + 8},${base - 40})`; g.fillRect(x, r * rh, L, rh);
      for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(90,55,25,${0.05 + (k % 3) * 0.03})`; g.lineWidth = 1 + (k % 2); const yy = r * rh + 6 + k * (rh - 12) / 14; g.beginPath(); g.moveTo(x, yy); g.bezierCurveTo(x + L * .3, yy + 3, x + L * .7, yy - 3, x + L, yy + 1); g.stroke(); }
      g.fillStyle = 'rgba(60,35,15,.35)'; g.fillRect(x, r * rh, 2, rh); x += L;
    }
    g.fillStyle = 'rgba(60,35,15,.45)'; g.fillRect(0, r * rh, w, 2);
  }
});
const TILE_TEX = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#d9d4cc'; g.fillRect(0, 0, w, h);
  const n = 2, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const gr = g.createLinearGradient(i * s, j * s, i * s + s, j * s + s); gr.addColorStop(0, '#fbfaf7'); gr.addColorStop(1, '#efebe4');
    g.fillStyle = gr; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
  }
});
const NOISE_TEX = (hex) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = hex; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const a = Math.random() * .08; g.fillStyle = Math.random() > .5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
  for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); g.moveTo(Math.random() * w, 0); g.bezierCurveTo(Math.random() * w, h * .3, Math.random() * w, h * .7, Math.random() * w, h); g.stroke(); }
});

/* ---------- геометрия ---------- */
function boxGeo(w, h, d, uv) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (uv) {   // UV в сантиметрах: текстура не растягивается на больших деталях
    const a = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; a.setXY(i, a.getX(i) * dims[f][0] / uv, a.getY(i) * dims[f][1] / uv); }
  }
  return g;
}
function mesh(geo, mat, shadow = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; return m; }
/* коробка с левым-нижним-задним углом в (x,y,z) */
function box(parent, w, h, d, mat, x, y, z, uv) {
  const m = mesh(boxGeo(Math.max(.05, w), Math.max(.05, h), Math.max(.05, d), uv), mat);
  m.position.set(x + w / 2, y + h / 2, z + d / 2); parent.add(m); return m;
}
function cyl(parent, r, len, mat, x, y, z, axis) {
  const m = mesh(new THREE.CylinderGeometry(r, r, len, 16), mat);
  if (axis === 'x') m.rotation.z = Math.PI / 2; else if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.position.set(x, y, z); parent.add(m); return m;
}

export function createK3D(container, hooks = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;border-radius:inherit';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#ece6dc');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(38, 1, 2, 6000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = 88 * DEG; controls.minDistance = 90; controls.maxDistance = 1400;
  controls.screenSpacePanning = true;

  const hemi = new THREE.HemisphereLight('#fff8ee', '#b9a07a', 0.55); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3df', 2.2); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6; sun.shadow.radius = 5;
  scene.add(sun); scene.add(sun.target);

  const tex = { floor: FLOOR_TEX(), tile: TILE_TEX() };
  const loader = new THREE.TextureLoader();
  const texCache = {};
  // фото цвета из каталога: берём чистую середину (без подписей и логотипа), края зеркалим — шов не виден
  const loadTex = url => {
    if (!url) return null;
    if (texCache[url]) return texCache[url];
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = 8;
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => { const sz = Math.min(img.width, img.height), cw = sz * .44; c.getContext('2d').drawImage(img, (img.width - cw) / 2, (img.height - cw) / 2, cw, cw, 0, 0, 512, 512); t.needsUpdate = true; invalidate(); };
    img.src = url;
    texCache[url] = t; return t;
  };

  let root = new THREE.Group(); scene.add(root);
  let anims = [], pick = [], state = null, firstFrame = true, selBox = null;
  const openAmt = new Map();     // key -> текущая доля открытия (0..1)
  const openTarget = new Map();  // key -> цель
  let needs = true;
  const invalidate = () => { needs = true; };
  controls.addEventListener('change', invalidate);

  /* ---------- материалы ---------- */
  function matsFor(st) {
    const colorMat = (c, rough) => {
      const t = loadTex(c && c.img);
      return new THREE.MeshStandardMaterial({ color: t ? '#ffffff' : (c && c.hex) || '#f2f2f2', map: t || null, roughness: rough, metalness: 0, envMapIntensity: .7 });
    };
    return {
      facade: colorMat(st.colors.facade, .42),
      body: colorMat(st.colors.body, .6),
      top: new THREE.MeshStandardMaterial({ map: NOISE_TEX((st.colors.top && st.colors.top.hex) || '#cbb89a'), roughness: .32, metalness: 0, envMapIntensity: .9 }),
      plinth: new THREE.MeshStandardMaterial({ color: '#2d2b29', roughness: .7 }),
      wall: new THREE.MeshStandardMaterial({ color: '#efe8dc', roughness: .95 }),
      floor: new THREE.MeshStandardMaterial({ map: tex.floor, roughness: .62, envMapIntensity: .5 }),
      tile: new THREE.MeshStandardMaterial({ map: tex.tile, roughness: .25, envMapIntensity: .9 }),
      steel: new THREE.MeshStandardMaterial({ color: '#c9ced3', roughness: .25, metalness: .9 }),
      chrome: new THREE.MeshStandardMaterial({ color: '#e8ecef', roughness: .12, metalness: 1 }),
      gold: new THREE.MeshStandardMaterial({ color: '#d4a64a', roughness: .22, metalness: 1 }),
      black: new THREE.MeshStandardMaterial({ color: '#141516', roughness: .18, metalness: .2 }),
      glassBlack: new THREE.MeshPhysicalMaterial({ color: '#0e0f11', roughness: .06, metalness: .1, clearcoat: 1 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#cfe6f2', roughness: .05, transmission: .85, transparent: true, opacity: .45, thickness: .4 }),
      inner: new THREE.MeshStandardMaterial({ color: '#efefec', roughness: .7 }),
      led: new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffe29a', emissiveIntensity: 2.2 }),
      fridge: new THREE.MeshStandardMaterial({ color: '#d9dde0', roughness: .3, metalness: .6 })
    };
  }

  /* ---------- ручки по фурнитуре ---------- */
  function handleSpec(st) {
    const h = st.hw.handle || 'tier';
    if (h === 'handle_eco') return { len: 9.6, r: .5, mat: 'chrome', std: 2.6 };
    if (h === 'handle_std') return { len: 16, r: .6, mat: 'gold', std: 2.8 };
    if (h === 'handle_design') return { len: 32, r: .55, mat: 'gold', std: 3.2 };
    return { len: 12.8, r: .55, mat: 'steel', std: 2.6 };
  }
  // ручка на фасаде: vertical — вдоль высоты; (x,y) центр на передней плоскости z
  function addHandle(parent, M, st, x, y, z, vertical, open) {
    if (open === 'push') { const d = mesh(new THREE.CylinderGeometry(.5, .5, .3, 12), M.chrome); d.rotation.x = Math.PI / 2; d.position.set(x, y, z + .15); parent.add(d); return; }
    if (open === 'gola') return;
    const H = handleSpec(st), m = M[H.mat];
    const bar = mesh(new THREE.CylinderGeometry(H.r, H.r, H.len, 14), m);
    if (!vertical) bar.rotation.z = Math.PI / 2;
    bar.position.set(x, y, z + H.std); parent.add(bar);
    [-1, 1].forEach(s => { const p = mesh(new THREE.CylinderGeometry(H.r * .8, H.r * .8, H.std, 10), m); p.rotation.x = Math.PI / 2; if (vertical) p.position.set(x, y + s * (H.len / 2 - 1.2), z + H.std / 2); else p.position.set(x + s * (H.len / 2 - 1.2), y, z + H.std / 2); parent.add(p); });
  }

  /* ---------- углы открывания по фурнитуре ---------- */
  function hingeAngle(st) { return ({ tier: 105, std_soft: 110, std: 110, eco: 100, black: 110, inset: 107, wide155: 155, wide170: 170, frame: 95, glass: 94 })[st.hw.hinge] || 105; }

  /* ---------- корпус (каркас) шкафа ---------- */
  function carcass(g, M, w, h, d, y0, shelves, opts = {}) {
    const t = 1.6, led = opts.led | 0;
    if (led > 0) {   // подсветка: сначала под крышкой, потом под полками сверху вниз; под лентой — тёплое свечение
      const glow = M.ledGlow || (M.ledGlow = new THREE.MeshBasicMaterial({ color: '#ffcf6e', transparent: true, opacity: .22, depthWrite: false }));
      const strip = y => { box(g, w - 2 * t - 2, .7, 1.2, M.led, t + 1, y, d - 7); const gl = new THREE.Mesh(boxGeo(w - 2 * t - 1, 9, d - 8), glow); gl.position.set(w / 2, y - 4.6, (d - 8) / 2 + 1); g.add(gl); };
      strip(y0 + h - t - .8);
      for (let k = (shelves | 0), n = 1; k >= 1 && n < led; k--, n++) strip(y0 + h * k / ((shelves | 0) + 1) - .8);
    }
    box(g, t, h, d - 2, M.body, 0, y0, 0, 60); box(g, t, h, d - 2, M.body, w - t, y0, 0, 60);
    box(g, w - 2 * t, t, d - 2, M.body, t, y0, 0, 60);
    if (opts.top !== false) box(g, w - 2 * t, t, d - 2, M.body, t, y0 + h - t, 0, 60);
    box(g, w - 2 * t, h - 2 * t, .4, M.inner, t, y0 + t, 0);
    for (let k = 1; k <= (shelves | 0); k++) box(g, w - 2 * t - .4, 1.6, d - 6, M.body, t + .2, y0 + h * k / ((shelves | 0) + 1), 1, 60);
  }

  /* ---------- фасады ---------- */
  const GAP = .3, FT = 1.8;
  function door(g, M, st, key, x, y, w, h, z, hingeSide, open, tier, glass) {
    // pivot на ребре петли; дверь — внутри
    const pv = new THREE.Group(); pv.position.set(hingeSide === 'L' ? x : x + w, y, z); g.add(pv);
    const dx = hingeSide === 'L' ? 0 : -w;
    if (glass) {
      const fr = 2.2;
      box(pv, w, fr, FT, M.facade, dx, 0, 0); box(pv, w, fr, FT, M.facade, dx, h - fr, 0);
      box(pv, fr, h - 2 * fr, FT, M.facade, dx, fr, 0); box(pv, fr, h - 2 * fr, FT, M.facade, dx + w - fr, fr, 0);
      box(pv, w - 2 * fr, h - 2 * fr, .5, M.glass, dx + fr, fr, .6);
    } else box(pv, w, h, FT, M.facade, dx, 0, 0, 60);
    const hx = hingeSide === 'L' ? dx + w - 3.2 : dx + 3.2, hy = tier === 'lower' ? h - 7 - handleSpec(st).len / 2 : 7 + handleSpec(st).len / 2;
    addHandle(pv, M, st, hx, Math.max(handleSpec(st).len / 2 + 2, Math.min(h - handleSpec(st).len / 2 - 2, hy)), FT, true, open);
    const ang = (open === 'push' && st.hw.tipon !== 'tier' ? hingeAngle(st) : hingeAngle(st)) * DEG;
    anims.push({ key, apply: f => { pv.rotation.y = (hingeSide === 'L' ? -1 : 1) * ang * f; } });
    return pv;
  }
  function drawer(g, M, st, key, x, y, w, h, z, d, open, sysKey, idx) {
    const grp = new THREE.Group(); g.add(grp);
    box(grp, w, h, FT, M.facade, x, y, z, 60);
    addHandle(grp, M, st, x + w / 2, y + h - Math.min(5, h / 3), z + FT, false, open);
    // короб ящика: боковины по системе
    const vis = (st.drawerVis && st.drawerVis[sysKey]) || { h: 9, col: '#9aa0a6' };
    const bh = vis.hidden ? Math.min(h - 4, 12) : Math.min(h - 3, Math.max(6, vis.h)), bw = w - 6, bd = d - 8;
    const sideMat = vis.hidden ? M.body : new THREE.MeshStandardMaterial({ color: vis.col, roughness: .35, metalness: .7 });
    const st0 = vis.slim ? .9 : 1.5;
    box(grp, st0, bh, bd, sideMat, x + 3, y + 2, z - bd);
    box(grp, st0, bh, bd, sideMat, x + w - 3 - st0, y + 2, z - bd);
    box(grp, bw - 2 * st0, bh, 1.2, sideMat, x + 3 + st0, y + 2, z - bd);
    box(grp, bw, 1.2, bd, M.inner, x + 3, y + 1.6, z - bd);
    for (let r = 0; r < (vis.rail | 0); r++) [0, 1].forEach(s => cyl(grp, .55, bd, M.chrome, x + 3 + st0 / 2 + s * (bw - st0), y + 2 + bh + 2 + r * 3.2, z - bd / 2, 'z'));
    anims.push({ key, apply: f => { grp.position.z = f * (d - 12) * (0.92 - idx * 0.06); } });
    return grp;
  }
  function lift(g, M, st, key, x, y, w, h, z, open, kind) {
    const k = kind === 'tier' ? 'hk_top' : kind;
    const top = new THREE.Group(); top.position.set(x, y + h, z); g.add(top);
    if (k === 'hf' || k === 'hf_top') {
      const h2 = h / 2;
      box(top, w, h2 - GAP / 2, FT, M.facade, 0, -h2 + GAP / 2, 0, 60);
      const mid = new THREE.Group(); mid.position.set(0, -h2, 0); top.add(mid);
      box(mid, w, h2 - GAP / 2, FT, M.facade, 0, -h2 + GAP / 2, 0, 60);
      addHandle(mid, M, st, w / 2, -h2 + 5, FT, false, open);
      anims.push({ key, apply: f => { top.rotation.x = -82 * DEG * f; mid.rotation.x = 164 * DEG * f; } });
    } else if (k === 'hl') {
      box(top, w, h, FT, M.facade, 0, -h, 0, 60); addHandle(top, M, st, w / 2, -h + 5, FT, false, open);
      anims.push({ key, apply: f => { top.position.y = y + h + f * (h + 4); } });
    } else {
      box(top, w, h, FT, M.facade, 0, -h, 0, 60); addHandle(top, M, st, w / 2, -h + 5, FT, false, open);
      const a = k === 'hs' ? 165 : 92;
      anims.push({ key, apply: f => { top.rotation.x = -a * DEG * f; } });
    }
  }
  function dropDoor(g, M, key, x, y, w, h, z, mat, handleMat, a) {
    const pv = new THREE.Group(); pv.position.set(x, y, z); g.add(pv);
    box(pv, w, h, FT, mat, 0, 0, 0, 60);
    if (handleMat) cyl(pv, .7, w * .7, handleMat, w / 2, h - 4, FT + 2.6, 'x');
    anims.push({ key, apply: f => { pv.rotation.x = (a || 88) * DEG * f; } });
    return pv;
  }

  /* ---------- нижний модуль ---------- */
  function lowerModule(g, M, st, s, w, key) {
    const D = st.LD, PL = st.PL, H = st.BOX - PL, open = s.openType || 'handles', zf = D - FT;
    const kind = s.kind || 'door';
    box(g, w - 4, PL, D - 6, M.plinth, 2, 0, 2);
    if (kind === 'washer') {
      box(g, w - .6, H - .4, D - 2, new THREE.MeshStandardMaterial({ color: '#f2f3f4', roughness: .35 }), .3, PL, 0);
      const ring = mesh(new THREE.TorusGeometry(Math.min(w, H) * .26, 1.6, 12, 40), M.chrome); ring.position.set(w / 2, PL + H * .48, D + .4); g.add(ring);
      const port = mesh(new THREE.CircleGeometry(Math.min(w, H) * .25, 40), M.glassBlack); port.position.set(w / 2, PL + H * .48, D + .3); g.add(port);
      return;
    }
    carcass(g, M, w, H, D, PL, kind === 'cargo' ? 0 : s.shelves | 0, { led: s.led | 0 });
    if (s.mwTop) microwaveTop(g, M, st, w);
    if (kind === 'cargo') { cargoModule(g, M, st, s, w, key, H, D, PL, zf, open); return; }
    if (kind === 'corner' && s._blind) { cornerModule(g, M, st, s, w, key, H, D, PL, zf, open); if (open === 'gola') box(g, w, 2.6, 2, M.black, 0, PL + H - 3, D - 4.5); return; }
    if (kind === 'oven') {
      const ovH = H * .7;
      dropDoor(g, M, key, GAP, PL + H - ovH, w - 2 * GAP, ovH - GAP, zf, M.glassBlack, M.chrome);
      drawer(g, M, st, key + ':d0', GAP, PL + GAP, w - 2 * GAP, H - ovH - 2 * GAP, zf, D, open, st.dsysOf(s, 0), 0);
      return;
    }
    if (kind === 'dishwasher') { dropDoor(g, M, key, GAP, PL + GAP, w - 2 * GAP, H - 2 * GAP, zf, M.facade, null, 75); box(g, w - 2, 4, 1, M.black, 1, PL + H - 5, D - 4); return; }
    const nd = s.drawers | 0;
    if (nd > 0) {
      const hh = (H - GAP * (nd + 1)) / nd;
      for (let i = 0; i < nd; i++) {
        const dg = drawer(g, M, st, key, GAP, PL + GAP + (nd - 1 - i) * (hh + GAP), w - 2 * GAP, hh, zf, D, open, st.dsysOf(s, i), i);
        if (i < (s.led | 0)) box(dg, w - 10, .5, 1, M.led, 5, PL + GAP + (nd - 1 - i) * (hh + GAP) + hh - 3.5, zf - 4);   // подсветка в ящике
      }
    } else if (twoDoors(s, w)) {
      const dw = (w - 3 * GAP) / 2;
      door(g, M, st, key, GAP, PL + GAP, dw, H - 2 * GAP, zf, 'L', open, 'lower');
      door(g, M, st, key, 2 * GAP + dw, PL + GAP, dw, H - 2 * GAP, zf, 'R', open, 'lower');
    } else door(g, M, st, key, GAP, PL + GAP, w - 2 * GAP, H - 2 * GAP, zf, s.hinge === 'R' ? 'R' : 'L', open, 'lower');
    if (open === 'gola') box(g, w, 2.6, 2, M.black, 0, PL + H - 3, D - 4.5);
  }

  function twoDoors(s, w) { return s.dn ? s.dn === 2 : w >= 45; }
  // микроволновка на столешнице над шкафом
  function microwaveTop(g, M, st, w) {
    const y = st.BOX + st.CT, mw = Math.min(48, w - 6), x = (w - mw) / 2;
    box(g, mw, 27, 34, new THREE.MeshStandardMaterial({ color: '#2b2e33', roughness: .4, metalness: .3 }), x, y, 8);
    box(g, mw * .62, 20, .4, M.glassBlack, x + 3, y + 3.5, 42);
    box(g, mw * .22, 20, .4, new THREE.MeshStandardMaterial({ color: '#3a3f46', roughness: .3, metalness: .5 }), x + mw * .72, y + 3.5, 42);
  }
  /* ---------- карго / бутылочница: выдвижная корзина во всю высоту ---------- */
  function cargoModule(g, M, st, s, w, key, H, D, PL, zf, open) {
    const grp = new THREE.Group(); g.add(grp);
    box(grp, w - 2 * GAP, H - 2 * GAP, FT, M.facade, GAP, PL + GAP, zf, 60);
    addHandle(grp, M, st, w / 2, PL + H - Math.min(6, H / 8), zf + FT, false, open);
    const wire = new THREE.MeshStandardMaterial({ color: '#cfd4d8', roughness: .28, metalness: .9 });
    const bw = w - 5, bd = D - 10, x0 = 2.5, z1 = zf - .4, z0 = z1 - bd, bottle = s.cg === 'bottle';
    [x0 + .6, x0 + bw - .6].forEach(x => cyl(grp, .55, H - 6, wire, x, PL + H / 2, z1 - .8, null));   // стойки рамы
    const lv = bottle ? [PL + 6, PL + H * .52] : [PL + 6, PL + H * .38, PL + H * .7];
    lv.forEach(y => {
      box(grp, bw, .5, bd, wire, x0, y, z0);
      [x0 + .3, x0 + bw - .3].forEach(x => { cyl(grp, .3, bd, wire, x, y + 5, z0 + bd / 2, 'z'); cyl(grp, .3, bd, wire, x, y + 10, z0 + bd / 2, 'z'); });
      [z0 + .3, z1 - 1].forEach(z => cyl(grp, .3, bw, wire, x0 + bw / 2, y + 7, z, 'x'));
      if (bottle) {   // бутылки стоят в ячейках
        const glass = new THREE.MeshPhysicalMaterial({ color: '#1f5a3a', roughness: .08, metalness: .1, clearcoat: 1, transparent: true, opacity: .92 });
        const n = Math.max(1, Math.floor(bd / 9.5));
        for (let i = 0; i < n; i++) { const z = z0 + 5 + i * (bd - 10) / Math.max(1, n - 1); cyl(grp, Math.min(3.6, bw / 2 - 1), 22, glass, x0 + bw / 2, y + 11.5, z, null); cyl(grp, 1.1, 8, glass, x0 + bw / 2, y + 26.5, z, null); }
      }
    });
    anims.push({ key, apply: f => { grp.position.z = f * (D - 10); } });
  }
  /* ---------- угловой шкаф: глухая часть у угла, дверь — на свободной части ---------- */
  function cornerModule(g, M, st, s, w, key, H, D, PL, zf, open) {
    const blindL = s._blind === 'L', bl = Math.min(D, w - 25), dw = w - bl, x0 = blindL ? bl : 0;
    box(g, bl - GAP, H - 2 * GAP, FT, M.facade, blindL ? GAP : dw + GAP, PL + GAP, zf - D * 0, 60);   // глухая панель (уходит за соседний ряд)
    if (dw >= 45) {
      const d2 = (dw - 3 * GAP) / 2;
      door(g, M, st, key, x0 + GAP, PL + GAP, d2, H - 2 * GAP, zf, 'L', open, 'lower');
      door(g, M, st, key, x0 + 2 * GAP + d2, PL + GAP, d2, H - 2 * GAP, zf, 'R', open, 'lower');
    } else door(g, M, st, key, x0 + GAP, PL + GAP, dw - 2 * GAP, H - 2 * GAP, zf, blindL ? 'R' : 'L', open, 'lower');
    const ck = st.hw.corner;
    if (ck && ck !== 'none') {   // угловой механизм: полки-корзины выезжают и уходят от угла
      const bask = new THREE.Group(); g.add(bask);
      const wire = new THREE.MeshStandardMaterial({ color: '#cfd4d8', roughness: .3, metalness: .9 });
      const bwid = Math.max(25, w * .62), bx = blindL ? w - bwid - 3 : 3;
      [0, 1].forEach(l => { const y = PL + 10 + l * H * .42; box(bask, bwid, .7, D * .62, wire, bx, y, D * .16); box(bask, bwid, 6, .5, wire, bx, y, D * .78); box(bask, .5, 6, D * .62, wire, bx, y, D * .16); box(bask, .5, 6, D * .62, wire, bx + bwid, y, D * .16); });
      anims.push({ key, apply: f => { bask.position.z = f * D * .6; bask.position.x = f * (blindL ? 10 : -10); } });
    }
  }

  /* ---------- верхний модуль ---------- */
  function upperModule(g, M, st, s, w, key, y0, h) {
    const D = st.UD, open = s.openType || 'handles', zf = D - FT, kind = s.kind || 'door';
    if (kind === 'open') { carcass(g, M, w, h, D, y0, Math.max(2, s.shelves | 0), { led: s.led | 0 }); return; }
    carcass(g, M, w, h, D, y0, s.shelves | 0, { led: s.led | 0 });
    if (kind === 'hood') {   // вытяжка под шкафом
      box(g, w - 4, 7, D + 8, M.steel, 2, y0 - 7, 0); box(g, w - 10, .4, D, M.black, 5, y0 - 7.2, 4);
    }
    if ((s.gasLifts | 0) > 0) {
      const n = Math.min(2, s.gasLifts | 0), hh = (h - GAP * (n + 1)) / n;
      for (let i = 0; i < n; i++) lift(g, M, st, n > 1 ? key + ':l' + i : key, GAP, y0 + GAP + (n - 1 - i) * (hh + GAP), w - 2 * GAP, hh, zf, open, st.hw.lift || 'tier');
      return;
    }
    const glass = kind === 'glass';
    if (twoDoors(s, w)) {
      const dw = (w - 3 * GAP) / 2;
      door(g, M, st, key, GAP, y0 + GAP, dw, h - 2 * GAP, zf, 'L', open, 'upper', glass);
      door(g, M, st, key, 2 * GAP + dw, y0 + GAP, dw, h - 2 * GAP, zf, 'R', open, 'upper', glass);
    } else door(g, M, st, key, GAP, y0 + GAP, w - 2 * GAP, h - 2 * GAP, zf, s.hinge === 'R' ? 'R' : 'L', open, 'upper', glass);
  }

  /* ---------- высокий модуль: холодильник / пенал ---------- */
  function tallModule(g, M, st, s, w, key) {
    const D = st.LD, top = st.TT, open = s.openType || 'handles', zf = D - FT, PL = st.PL;
    if (s.kind === 'fridge' && s.fr !== 'built') {
      const fh = st.FRIDGE_H;
      box(g, w - 1, fh, D + 4, M.fridge, .5, 0, 0);
      box(g, w - 1.4, .5, 1, M.black, .7, fh * .62, D + 4);
      cyl(g, .9, 30, M.chrome, 4, fh * .78, D + 7, null); cyl(g, .9, 50, M.chrome, 4, fh * .33, D + 7, null);
      if (top - fh > 15) { carcass(g, M, w, top - fh - 2, D, fh + 2, 0); door(g, M, st, key, GAP, fh + 2 + GAP, w - 2 * GAP, top - fh - 2 - 2 * GAP, zf, 'L', open, 'upper'); }
      return;
    }
    box(g, w - 4, PL, D - 6, M.plinth, 2, 0, 2);
    carcass(g, M, w, top - PL, D, PL, 0, { led: Math.min(1, s.led | 0) });
    for (let k = 1; k < (s.led | 0); k++) box(g, w - 6, .5, 1, M.led, 3, PL + (top - PL) * k / (s.led | 0) - .6, D - 7);   // подсветка по высоте пенала
    if (s.kind === 'fridge') {
      const y1 = PL + 178, split = PL + 178 * .34;
      door(g, M, st, key, GAP, PL + GAP, w - 2 * GAP, split - PL - GAP, zf, 'L', open, 'lower');
      door(g, M, st, key, GAP, split + GAP, w - 2 * GAP, y1 - split - GAP, zf, 'L', open, 'upper');
      if (top - y1 > 8) door(g, M, st, key, GAP, y1 + GAP, w - 2 * GAP, top - y1 - 2 * GAP, zf, 'L', open, 'upper');
      return;
    }
    let di = 0;
    (st.towerBands(s.tw || 'storage', top) || []).forEach(bd => {
      const a = bd.y0 === 10 ? PL : bd.y0, b = bd.y1, hh = b - a - 2 * GAP;
      if (bd.ty === 'door') door(g, M, st, key, GAP, a + GAP, w - 2 * GAP, hh, zf, s.hinge === 'R' ? 'R' : 'L', open, b > 150 ? 'upper' : 'lower');
      else if (bd.ty === 'drawer') { drawer(g, M, st, key, GAP, a + GAP, w - 2 * GAP, hh, zf, D, open, st.dsysOf(s, di), di); di++; }
      else {
        box(g, w - 2 * GAP, b - a - GAP, FT, M.glassBlack, GAP, a + GAP / 2, zf);
        box(g, w * .7, (b - a) * .5, .3, new THREE.MeshStandardMaterial({ color: '#2d3338', roughness: .2 }), w * .15, a + (b - a) * .2, zf + FT);
        cyl(g, .7, w * .75, M.chrome, w / 2, b - 4, zf + FT + 2.2, 'x');
      }
    });
  }

  /* ---------- размещение по стенам ---------- */
  function placeGroup(wall, u0, u1, st, depthBack) {
    const g = new THREE.Group();
    if (wall === 'main') g.position.set(u0, 0, 0);
    else if (st.type === 'parallel') { g.position.set(u1, 0, st.ZOPP); g.rotation.y = Math.PI; }   // ряд напротив смотрит на основной
    else if (wall === 'left') { g.position.set(0, 0, st.LD + u1); g.rotation.y = 90 * DEG; }
    else { g.position.set(st.W, 0, st.LD + u0); g.rotation.y = -90 * DEG; }
    return g;
  }

  function countertops(M, st) {
    const CT = st.CT, D = st.LD + 2;
    ['main', 'left', 'right'].forEach(wall => {
      const run = st.runs[wall]; if (!run || !run.lower.length) return;
      let seg = null; const segs = [];
      run.lower.forEach(r => {
        const tall = r.sec.kind === 'fridge' || r.sec.kind === 'tower';
        if (tall) { if (seg) segs.push(seg); seg = null; return; }
        if (seg && Math.abs(seg.u1 - r.u0) < .5) seg.u1 = r.u1; else { if (seg) segs.push(seg); seg = { u0: r.u0, u1: r.u1, items: [] }; }
        if (r.sec.kind === 'sink' || r.sec.kind === 'hob') seg.items.push(r);
      });
      if (seg) segs.push(seg);
      segs.forEach(sg => {
        const g = placeGroup(wall, sg.u0, sg.u1, st);
        const L = sg.u1 - sg.u0;
        box(g, L, CT, D, M.top, 0, st.BOX, 0, 80);
        // фартук-плитка на стене
        if (wall === 'main' || true) box(g, L, st.UB - st.BOX - CT, .6, M.tile, 0, st.BOX + CT, -.6, 30);
        sg.items.forEach(r => {
          const cx = (r.u0 + r.u1) / 2 - sg.u0, w = r.u1 - r.u0;
          if (r.sec.kind === 'hob') {
            const hw = Math.min(58, w - 4);
            box(g, hw, .5, 51, M.glassBlack, cx - hw / 2, st.BOX + CT, 6);
            [[-.25, -.22], [.25, -.22], [-.25, .22], [.25, .22]].forEach(([a, b], i) => { const ring = mesh(new THREE.TorusGeometry(i % 3 ? 7 : 9, .25, 6, 40), new THREE.MeshStandardMaterial({ color: '#5a5f66', roughness: .4 })); ring.rotation.x = Math.PI / 2; ring.position.set(cx + a * hw, st.BOX + CT + .55, 31.5 + b * 51); g.add(ring); });
          } else {
            const sw = Math.min(50, w - 8);
            box(g, sw, .35, 42, M.steel, cx - sw / 2, st.BOX + CT, 9);
            box(g, sw - 6, .4, 36, new THREE.MeshStandardMaterial({ color: '#8e959b', roughness: .3, metalness: .8 }), cx - sw / 2 + 3, st.BOX + CT + .05, 12);
            // смеситель
            const fx = cx, fz = 6;
            cyl(g, 1.3, 2, M.chrome, fx, st.BOX + CT + 1, fz, null);
            cyl(g, .9, 26, M.chrome, fx, st.BOX + CT + 14, fz, null);
            const arc = mesh(new THREE.TorusGeometry(7, .9, 10, 24, Math.PI), M.chrome); arc.rotation.y = Math.PI / 2; arc.position.set(fx, st.BOX + CT + 27, fz + 7); g.add(arc);
          }
        });
        root.add(g);
      });
    });
  }

  function room(M, st, bounds) {
    const pad = 90, x0 = -pad, x1 = st.W + pad, zMax = bounds.zMax + 220, H = st.roomH;
    const fl = mesh(new THREE.PlaneGeometry(x1 - x0, zMax + 40), M.floor, false); fl.rotation.x = -Math.PI / 2; fl.position.set((x0 + x1) / 2, 0, zMax / 2 - 20); fl.receiveShadow = true;
    M.floor.map.repeat.set((x1 - x0) / 160, (zMax + 40) / 160); root.add(fl);
    const back = mesh(new THREE.PlaneGeometry(x1 - x0, H), M.wall, false); back.position.set((x0 + x1) / 2, H / 2, -.8); root.add(back);
    const rm = st.room || {}, hasL = rm.left != null ? rm.left > 0 : (st.type === 'l-shape' || st.type === 'u-shape'), hasR = rm.right != null ? rm.right > 0 : st.type === 'u-shape';
    if (st.type === 'parallel') {   // стена за противоположным рядом
      const ow = mesh(new THREE.PlaneGeometry(x1 - x0, H), M.wall, false); ow.rotation.y = Math.PI; ow.position.set((x0 + x1) / 2, H / 2, st.ZOPP + .8); root.add(ow);
      box(root, x1 - x0, 7, 1.4, M.inner, x0, 0, st.ZOPP - .8);
    }
    const lz = hasL && rm.left ? Math.max(rm.left, 80) : zMax, rz = hasR && rm.right ? Math.max(rm.right, 80) : zMax;
    if (hasL) { const lw = mesh(new THREE.PlaneGeometry(lz, H), M.wall, false); lw.rotation.y = Math.PI / 2; lw.position.set(-.8, H / 2, lz / 2); root.add(lw); }
    if (hasR) { const rw = mesh(new THREE.PlaneGeometry(rz, H), M.wall, false); rw.rotation.y = -Math.PI / 2; rw.position.set(st.W + .8, H / 2, rz / 2); root.add(rw); }
    if (st.room) {   // граница комнаты на полу: шкафы за неё не выходят
      const edge = new THREE.MeshBasicMaterial({ color: '#c8952f', transparent: true, opacity: .55 });
      box(root, st.W, .3, 1.2, edge, 0, .2, -.2);
      if (!hasR) box(root, 1.2, 140, 1.2, edge, st.W - .6, 0, -.6);
      if (!hasL) box(root, 1.2, 140, 1.2, edge, -.6, 0, -.6);
    }
    // плинтус
    box(root, x1 - x0, 7, 1.4, M.inner, x0, 0, -.6);
  }

  function island(M, st, bounds) {
    if (!st.island) return null;
    const L = st.island.L, Wd = st.island.W, z0 = bounds.depthMax + 100, x0 = st.W / 2 - L / 2;
    const g = new THREE.Group(); g.position.set(x0, 0, z0); root.add(g);
    box(g, L - 4, st.PL, Wd - 8, M.plinth, 2, 0, 4);
    box(g, L, st.BOX - st.PL, Wd - 4, M.facade, 0, st.PL, 2, 60);
    box(g, L + 4, st.CT, Wd + 4, M.top, -2, st.BOX, 0, 80);
    const n = Math.max(1, Math.round(L / 60));
    for (let k = 1; k < n; k++) box(g, .3, st.BOX - st.PL - 2, .2, M.black, k * L / n, st.PL + 1, Wd - 2);
    // стулья
    const nS = Math.min(st.decor.stools || 0, Math.max(1, Math.floor(L / 42)));
    for (let i = 0; i < nS; i++) {
      const sx = (i + .5) * L / nS;
      const seat = mesh(new THREE.CylinderGeometry(17, 17, 6, 28), new THREE.MeshStandardMaterial({ color: '#b8956a', roughness: .6 })); seat.position.set(sx, 72, Wd + 30); g.add(seat);
      cyl(g, 1.4, 70, M.black, sx, 36, Wd + 30, null);
      const ring = mesh(new THREE.TorusGeometry(12, .9, 8, 30), M.black); ring.rotation.x = Math.PI / 2; ring.position.set(sx, 30, Wd + 30); g.add(ring);
    }
    return { z1: z0 + Wd };
  }

  function lamps(M, st, bounds) {
    const n = st.decor.lamps || 0; if (!n) return;
    const isl = st.island ? { x0: st.W / 2 - st.island.L / 2, L: st.island.L, z: bounds.depthMax + 100 + st.island.W / 2 } : null;
    for (let i = 0; i < n; i++) {
      const x = isl ? isl.x0 + (i + .5) * isl.L / n : (i + .5) * st.W / n, z = isl ? isl.z : 85, y = isl ? 165 : 185;
      cyl(root, .3, st.roomH - y - 20, M.black, x, (st.roomH + y + 20) / 2, z, null);
      const shade = mesh(new THREE.CylinderGeometry(5, 9, 22, 24, 1, true), M.black); shade.position.set(x, y + 11, z); root.add(shade);
      const bulb = mesh(new THREE.SphereGeometry(3, 16, 12), M.led, false); bulb.position.set(x, y + 2, z); root.add(bulb);
      const pl = new THREE.PointLight('#ffd89a', 900, 260, 2); pl.position.set(x, y, z); root.add(pl);
    }
  }

  function plant(M, x, z, s) {
    const pot = mesh(new THREE.CylinderGeometry(9 * s, 7 * s, 18 * s, 20), new THREE.MeshStandardMaterial({ color: '#8b6b4f', roughness: .8 })); pot.position.set(x, 9 * s, z); root.add(pot);
    const leafM = new THREE.MeshStandardMaterial({ color: '#4f8a55', roughness: .7 });
    for (let i = 0; i < 9; i++) { const l = mesh(new THREE.SphereGeometry(7 * s, 10, 8), leafM); l.scale.set(.5, 1.6, .25); l.position.set(x + Math.cos(i * 1.3) * 5 * s, 26 * s + (i % 3) * 5 * s, z + Math.sin(i * 1.3) * 5 * s); l.rotation.set(Math.cos(i) * .5, i, Math.sin(i) * .5); root.add(l); }
  }

  // фурнитура конкретного шкафа поверх общей
  function stFor(st, s) { if (!st.hwOf) return st; return Object.assign({}, st, { hw: Object.assign({}, st.hw, st.hwOf(s)) }); }

  /* ---------- сборка сцены ---------- */
  function build(st) {
    scene.remove(root); root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    root = new THREE.Group(); scene.add(root);
    anims = []; pick = []; selBox = null;
    const M = matsFor(st);
    st.drawerVis = st.drawerVis || {};
    st.ZOPP = 2 * st.LD + (st.aisle || 120);
    let depthMax = st.LD;
    if (st.type === 'parallel') depthMax = st.ZOPP;
    else ['left', 'right'].forEach(w => { const r = st.runs[w]; if (r && r.lower.length) depthMax = Math.max(depthMax, st.LD + r.totalLower); });
    const bounds = { depthMax, zMax: depthMax + (st.island ? 100 + st.island.W + 60 : 60) };

    const lowMain = st.runs.main.lower, cornerKit = st.type === 'l-shape' || st.type === 'u-shape';
    const blindOf = (wall, r) => {
      if (r.sec.kind !== 'corner' || !cornerKit || wall !== 'main') return null;
      if (r === lowMain[0] && st.runs.left.lower.length) return 'L';
      if (st.type === 'u-shape' && r === lowMain[lowMain.length - 1] && st.runs.right.lower.length) return 'R';
      return null;
    };
    ['main', 'left', 'right'].forEach(wall => {
      const run = st.runs[wall]; if (!run) return;
      run.lower.forEach(r => {
        const g = placeGroup(wall, r.u0, r.u1, st), w = r.u1 - r.u0, key = 'lower:' + r.sec.id, sst = stFor(st, r.sec);
        g.userData.mod = { tier: 'lower', id: r.sec.id, w, h: (r.sec.kind === 'fridge' || r.sec.kind === 'tower') ? st.TT : st.BOX, d: st.LD, y0: 0 };
        g.userData.place = { wall, u0: r.u0, u1: r.u1 };
        const bl = blindOf(wall, r);
        if (r.sec.kind === 'fridge' || r.sec.kind === 'tower') tallModule(g, M, sst, r.sec, w, key); else lowerModule(g, M, sst, bl ? Object.assign({}, r.sec, { _blind: bl }) : r.sec, w, key);
        root.add(g); pick.push(g);
      });
      if (st.hasUpper) run.upper.forEach(r => {
        const w = r.u1 - r.u0, key = 'upper:' + r.sec.id;
        const g = placeGroup(wall, r.u0, r.u1, st);
        const ub = st.BOX + st.CT + (r.sec.ug != null ? +r.sec.ug : st.UGAP);   // низ шкафа: столешница + своя высота
        g.userData.mod = { tier: 'upper', id: r.sec.id, w, h: st.UH * st.tiers, d: st.UD, y0: ub };
        g.userData.place = { wall, u0: r.u0, u1: r.u1 };
        const sst = stFor(st, r.sec);
        upperModule(g, M, sst, r.sec, w, key, ub, st.UH);
        if (st.tiers === 2) upperModule(g, M, sst, Object.assign({}, r.sec, { kind: 'door', gasLifts: 0, dn: 0, led: 0 }), w, key + ':t2', ub + st.UH, st.UH);
        if (st.led && st.led.level && st.led.work) box(g, w - 6, .6, 1.4, M.led, 3, ub - .7, st.UD - 6);
        root.add(g); pick.push(g);
      });
    });
    // угловое соединение верхних шкафов: вставка-корпус закрывает дыру между рядами (верх мельче низа), фасад — в линию с боковым рядом
    if (st.hasUpper && cornerKit) {
      const mu = st.runs.main.upper, HH = st.UH * st.tiers;
      const join = (right) => {
        const su = st.runs[right ? 'right' : 'left'].upper;
        if (!mu.length || !su.some(r => r.u0 < 1)) return;
        if (right ? Math.abs(mu[mu.length - 1].u1 - st.W) > 1 : mu[0].u0 > 1) return;
        const g = new THREE.Group(); root.add(g);
        const xa = right ? st.W - st.UD : 0;
        box(g, st.UD, HH, st.LD - st.UD, M.body, xa, st.UB, st.UD, 60);
        box(g, FT, HH - .6, st.LD - st.UD - .3, M.facade, right ? st.W - st.UD - FT : st.UD, st.UB + .3, st.UD + .3, 60);
        if (st.led && st.led.level && st.led.work) box(g, 1.4, .6, st.LD - st.UD - 4, M.led, right ? xa + 3 : st.UD - 6, st.UB - .7, st.UD + 2);
      };
      join(false); if (st.type === 'u-shape') join(true);
    }
    countertops(M, st);
    room(M, st, bounds);
    island(M, st, bounds);
    lamps(M, st, bounds);
    if (st.decor.plant) plant(M, Math.max(15, (st.runs.main.totalLower || st.W) - 18), 18, .9);
    if (st.decor.fplant && st.type !== 'u-shape') plant(M, st.W + 40, 40, 1.6);
    // свет и тени по размеру кухни
    const cx = st.W / 2, span = Math.max(st.W, bounds.zMax) + 200;
    sun.position.set(cx - span * .35, st.roomH + 260, bounds.zMax + span * .55); sun.target.position.set(cx, 60, depthMax / 2);
    const sc = sun.shadow.camera; sc.left = -span * .7; sc.right = span * .7; sc.top = span * .7; sc.bottom = -span * .7; sc.near = 10; sc.far = span * 3; sc.updateProjectionMatrix();
    // применить текущие доли открытия
    anims.forEach(a => a.apply(ease(openAmt.get(a.key) || 0)));
    highlight();
    if (firstFrame) { setView('angle'); firstFrame = false; }
    invalidate();
  }

  /* ---------- выделение ---------- */
  function highlight() {
    if (selBox) { root.remove(selBox); selBox = null; }
    const sel = state && state.selected; if (!sel) return;
    const g = pick.find(p => p.userData.mod.tier === sel.tier && p.userData.mod.id === sel.id); if (!g) return;
    const m = g.userData.mod;
    const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(m.w + 1.2, m.h + 1.2, m.d + 1.2));
    selBox = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#e9b44c' }));
    selBox.position.set(m.w / 2, m.y0 + m.h / 2, m.d / 2);
    selBox.position.applyEuler(g.rotation); selBox.position.add(g.position); selBox.rotation.copy(g.rotation);
    root.add(selBox);
  }

  /* ---------- камера ---------- */
  function center() {
    const st = state; if (!st) return new THREE.Vector3();
    if (st.type === 'parallel') return new THREE.Vector3(st.W / 2, 95, (2 * st.LD + (st.aisle || 120)) / 2);
    let depthMax = st.LD; ['left', 'right'].forEach(w => { const r = st.runs[w]; if (r && r.lower.length) depthMax = Math.max(depthMax, st.LD + r.totalLower); });
    return new THREE.Vector3(st.W / 2, 105, Math.min(depthMax, 160) / 2 + (st.island ? 60 : 0));
  }
  function setView(name) {
    if (!state) return;
    const c = center(), st = state, span = Math.max(st.W, 260);
    const dist = span * 1.25 + (st.island ? 140 : 60);
    if (name === 'front') camera.position.set(c.x, 150, c.z + dist);
    else if (name === 'top') camera.position.set(c.x, dist * 1.05 + 150, c.z + 1);
    else if (name === 'left') camera.position.set(c.x + dist * .9, 170, c.z + dist * .7);
    else if (st.type === 'parallel') camera.position.set(c.x + dist * 1.05, 330, c.z + dist * .22);   // I I: смотрим вдоль прохода
    else if (st.type === 'l-shape') camera.position.set(c.x + dist * .55, 200, c.z + dist * 1.0);   // Г: смотрим справа, чтобы видеть угол
    else if (st.type === 'u-shape') camera.position.set(c.x + dist * .15, 230, c.z + dist * 1.15);
    else camera.position.set(c.x - dist * .55, 190, c.z + dist * .95);
    controls.target.copy(c); controls.update(); invalidate();
  }

  /* ---------- взаимодействие ---------- */
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let downAt = null;
  function hit(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects(pick, true);
    for (const h of hits) { let o = h.object; while (o && !o.userData.mod) o = o.parent; if (o) return o.userData.mod; }
    return null;
  }
  // перетаскивание: выбранный шкаф тянется мышью/пальцем по полу, место показывает золотая рамка
  let drag = null;
  const plane = new THREE.Plane(), hitP = new THREE.Vector3();
  function wallU(p) {
    const st = state, LD = st.LD;
    if (st.type === 'parallel') return { wall: p.z > st.ZOPP / 2 ? 'right' : 'main', u: p.x };
    if (st.type === 'l-shape' || st.type === 'u-shape') {
      if (p.x < LD + 25 && p.z > LD + 5) return { wall: 'left', u: p.z - LD };
      if (st.type === 'u-shape' && p.x > st.W - LD - 25 && p.z > LD + 5) return { wall: 'right', u: p.z - LD };
    }
    return { wall: 'main', u: p.x };
  }
  function ghostAt(m, wall, u) {
    if (!selBox) return;
    const g = placeGroup(wall, u - m.w / 2, u + m.w / 2, state);
    selBox.position.set(m.w / 2, m.y0 + m.h / 2, m.d / 2).applyEuler(g.rotation).add(g.position); selBox.rotation.copy(g.rotation);
    invalidate();
  }
  let moveMode = false;
  function setMoveMode(on) { moveMode = !!on; controls.enableRotate = !moveMode; if (moveMode) setView('top'); invalidate(); }
  renderer.domElement.addEventListener('pointerdown', e => {
    downAt = [e.clientX, e.clientY]; drag = null;
    if (!hooks.onMove) return;
    let sel = state && state.selected;
    const m = hit(e); if (!m) return;
    if (moveMode && (!sel || m.tier !== sel.tier || m.id !== sel.id)) { if (hooks.onSelect) hooks.onSelect({ tier: m.tier, id: m.id }); sel = state && state.selected; }
    if (!sel || m.tier !== sel.tier || m.id !== sel.id) return;
    drag = { m, moved: false, to: null }; controls.enabled = false;
    try { renderer.domElement.setPointerCapture(e.pointerId); } catch (er) {}
  });
  renderer.domElement.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 6) return;
    drag.moved = true;
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    plane.set(new THREE.Vector3(0, 1, 0), -(drag.m.tier === 'upper' ? state.UB : 0));
    if (!ray.ray.intersectPlane(plane, hitP)) return;
    drag.to = wallU(hitP); ghostAt(drag.m, drag.to.wall, drag.to.u);
  });
  renderer.domElement.addEventListener('pointerup', e => {
    if (drag) {
      const d = drag; drag = null; controls.enabled = true;
      if (d.moved) { if (d.to) hooks.onMove({ tier: d.m.tier, id: d.m.id }, d.to.wall, d.to.u); else highlight(); return; }
    }
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
    const m = hit(e);
    if (hooks.onSelect) hooks.onSelect(m ? { tier: m.tier, id: m.id } : null);
  });
  renderer.domElement.addEventListener('dblclick', e => { const m = hit(e); if (m) toggle(m.tier + ':' + m.id); });

  function keysOf(key) { return anims.filter(a => a.key === key || a.key.startsWith(key + ':')).map(a => a.key); }
  function toggle(key) {
    const ks = [...new Set(keysOf(key))]; if (!ks.length) return;
    const on = !(openTarget.get(ks[0]) > .5);
    ks.forEach(k => openTarget.set(k, on ? 1 : 0)); invalidate();
  }
  function openAll(on) { [...new Set(anims.map(a => a.key))].forEach(k => openTarget.set(k, on ? 1 : 0)); invalidate(); }
  function isOpen(key) { const ks = keysOf(key); return ks.length > 0 && openTarget.get(ks[0]) > .5; }

  /* ---------- цикл ---------- */
  let last = performance.now(), raf = 0, alive = true;
  function loop(now) {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    let moving = false;
    openTarget.forEach((tg, k) => {
      const cur = openAmt.get(k) || 0;
      if (Math.abs(cur - tg) > .001) { const nv = cur + Math.sign(tg - cur) * Math.min(Math.abs(tg - cur), dt / .9); openAmt.set(k, nv); moving = true; }
    });
    if (moving) anims.forEach(a => a.apply(ease(openAmt.get(a.key) || 0)));
    const damp = controls.update();
    if (moving || needs || damp) { renderer.render(scene, camera); needs = false; }
  }
  raf = requestAnimationFrame(loop);

  const ro = new ResizeObserver(() => {
    const w = container.clientWidth || 600, h = container.clientHeight || 400;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); invalidate();
  });
  ro.observe(container);

  return {
    update(st) { state = st; build(st); },
    setView, toggle, openAll, isOpen, setMoveMode, isMoveMode: () => moveMode,
    select(sel) { if (state) { state.selected = sel; highlight(); invalidate(); } },
    snapshot() { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); },
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); container.removeChild(renderer.domElement); }
  };
}
