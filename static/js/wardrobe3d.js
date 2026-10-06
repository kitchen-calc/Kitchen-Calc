/* 3D-визуализация шкафов (/shkaf): шкаф-купе, гардеробная, прихожая. Three.js.
   Строится из модели калькулятора (M) и тех же секций, что на чертежах; цвет — из каталога (фото текстуры),
   фурнитура — из каталога kis.uz: раздвижные системы, петли, ручки, TIP-ON, подъёмники, ящики Blum, Cabio.
   API: createW3D(container, hooks) -> { update(st), setView(name), toggle(key), openAll(on), isOpen(key), select(sel), dispose() } */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const DEG = Math.PI / 180, T = 1.6, PL = 8;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const GARM = ['#e8d5c4', '#2f3b4f', '#9b2c2c', '#c7b299', '#44614a', '#f0efe9', '#6d4c41', '#d9a5b3', '#1f2937', '#b7c4cf', '#c58b3a', '#7b4b73'];

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
const FLOOR_TEX = () => canvasTex(1024, 1024, (g, w, h) => {
  const rows = 8, rh = h / rows;
  for (let r = 0; r < rows; r++) { let x = -(r % 3) * 140; while (x < w) { const L = 260 + ((r * 97 + x) % 180), base = 140 + ((r * 31 + x * 7) % 30);
    g.fillStyle = `rgb(${base + 40},${base + 4},${base - 40})`; g.fillRect(x, r * rh, L, rh);
    for (let k = 0; k < 12; k++) { g.strokeStyle = `rgba(90,55,25,${0.05 + (k % 3) * 0.03})`; g.beginPath(); const yy = r * rh + 6 + k * (rh - 12) / 12; g.moveTo(x, yy); g.bezierCurveTo(x + L * .3, yy + 3, x + L * .7, yy - 3, x + L, yy + 1); g.stroke(); }
    g.fillStyle = 'rgba(60,35,15,.35)'; g.fillRect(x, r * rh, 2, rh); x += L; } g.fillStyle = 'rgba(60,35,15,.45)'; g.fillRect(0, r * rh, w, 2); }
});
const SLAT_TEX = () => canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#8a6440'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { g.fillStyle = '#c9a273'; g.fillRect(x + 3, 0, 24, h); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x + 20, 0, 7, h); } });

function boxGeo(w, h, d, uv) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (uv) { const a = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; a.setXY(i, a.getX(i) * dims[f][0] / uv, a.getY(i) * dims[f][1] / uv); } }
  return g;
}
function mesh(geo, mat, shadow = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; return m; }
function box(p, w, h, d, mat, x, y, z, uv) { const m = mesh(boxGeo(Math.max(.05, w), Math.max(.05, h), Math.max(.05, d), uv), mat); m.position.set(x + w / 2, y + h / 2, z + d / 2); p.add(m); return m; }
function cyl(p, r, len, mat, x, y, z, axis, seg) { const m = mesh(new THREE.CylinderGeometry(r, r, len, seg || 16), mat); if (axis === 'x') m.rotation.z = Math.PI / 2; else if (axis === 'z') m.rotation.x = Math.PI / 2; m.position.set(x, y, z); p.add(m); return m; }

export function createW3D(container, hooks = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;border-radius:inherit';
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#ece6dc');
  const pmrem = new THREE.PMREMGenerator(renderer);
  // светлая «комната» для отражений: в зеркалах видны стены, пол и окно, а не тёмная студия
  const envScene = (() => {
    const sc = new THREE.Scene(), mk = (c, w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: c, side: THREE.BackSide })); m.position.set(x, y, z); sc.add(m); };
    mk('#efe6d8', 20, 10, 20, 0, 4, 0);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ color: '#b48f60' })); fl.rotation.x = -Math.PI / 2; fl.position.y = -0.9; sc.add(fl);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' })); win.position.set(0, 3, 9.9); win.rotation.y = Math.PI; sc.add(win);
    const lamp = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ color: '#fffaf0' })); lamp.position.set(0, 8.9, 0); lamp.rotation.x = Math.PI / 2; sc.add(lamp);
    return sc;
  })();
  scene.environment = pmrem.fromScene(envScene, 0.02).texture;
  const camera = new THREE.PerspectiveCamera(38, 1, 2, 6000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.maxPolarAngle = 88 * DEG; controls.minDistance = 80; controls.maxDistance = 1400; controls.screenSpacePanning = true;
  scene.add(new THREE.HemisphereLight('#fff8ee', '#b9a07a', .55));
  const sun = new THREE.DirectionalLight('#fff3df', 2.1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .6; sun.shadow.radius = 5; scene.add(sun); scene.add(sun.target);
  const tex = { floor: FLOOR_TEX(), slat: SLAT_TEX() };
  const texCache = {};
  const loadTex = url => {   // середина фото из каталога, без подписей
    if (!url) return null; if (texCache[url]) return texCache[url];
    const c = document.createElement('canvas'); c.width = c.height = 512; const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = 8;
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => { const sz = Math.min(img.width, img.height), cw = sz * .44; c.getContext('2d').drawImage(img, (img.width - cw) / 2, (img.height - cw) / 2, cw, cw, 0, 0, 512, 512); t.needsUpdate = true; needs = true; };
    img.src = url; texCache[url] = t; return t;
  };
  let root = new THREE.Group(); scene.add(root);
  let anims = [], pick = [], state = null, first = true, selBox = null, bounds = { w: 200, d: 60, h: 240 }, slideDoors = [], hideDoors = false;
  const openAmt = new Map(), openTarget = new Map();
  let needs = true; const invalidate = () => { needs = true; };
  controls.addEventListener('change', invalidate);

  function mats(st) {
    const c = st.colors.body, t = loadTex(c && c.img);
    return {
      body: new THREE.MeshStandardMaterial({ color: t ? '#ffffff' : (c && c.hex) || '#f2f1ee', map: t || null, roughness: .5, envMapIntensity: .7 }),
      inner: new THREE.MeshStandardMaterial({ color: '#efece6', roughness: .7 }),
      mirror: new THREE.MeshStandardMaterial({ color: '#dfe8ec', roughness: .04, metalness: 1, envMapIntensity: 1.15 }),
      sand: new THREE.MeshStandardMaterial({ color: '#dfe6e9', roughness: .35, metalness: .7 }),
      laco: new THREE.MeshPhysicalMaterial({ color: st.colors.laco || '#2a2d31', roughness: .08, clearcoat: 1, clearcoatRoughness: .05 }),
      alu: new THREE.MeshStandardMaterial({ color: '#b9bec2', roughness: .3, metalness: .9 }),
      aluDark: new THREE.MeshStandardMaterial({ color: '#3a3d41', roughness: .35, metalness: .8 }),
      chrome: new THREE.MeshStandardMaterial({ color: '#e8ecef', roughness: .12, metalness: 1 }),
      gold: new THREE.MeshStandardMaterial({ color: '#d4a64a', roughness: .22, metalness: 1 }),
      plinth: new THREE.MeshStandardMaterial({ color: '#2d2b29', roughness: .7 }),
      wall: new THREE.MeshStandardMaterial({ color: '#efe8dc', roughness: .95 }),
      floor: new THREE.MeshStandardMaterial({ map: tex.floor, roughness: .62, envMapIntensity: .5 }),
      slat: new THREE.MeshStandardMaterial({ map: tex.slat, roughness: .7 }),
      niche: new THREE.MeshStandardMaterial({ color: '#ece3d3', roughness: .9 }),
      led: new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffe29a', emissiveIntensity: 2.2 }),
      leather: new THREE.MeshStandardMaterial({ color: '#6b4630', roughness: .55 }),
      cushion: new THREE.MeshStandardMaterial({ color: ['#b07d12', '#7f9b6a', '#47556b'][st.m.tier] || '#b07d12', roughness: .9 }),
      wire: new THREE.MeshStandardMaterial({ color: '#cfd4d8', roughness: .3, metalness: .9 }),
      shoe: ['#2f3b4f', '#8b4a3a', '#d8cfc0', '#2b2b2b', '#b07d12'].map(c2 => new THREE.MeshStandardMaterial({ color: c2, roughness: .6 }))
    };
  }
  const garmMat = {}; const gm = c => garmMat[c] || (garmMat[c] = new THREE.MeshStandardMaterial({ color: c, roughness: .85 }));

  /* ---------- ручки ---------- */
  function handleSpec(st) { const h = st.hw.open || 'tier'; if (h === 'handle_eco') return { len: 9.6, mat: 'chrome' }; if (h === 'handle_std') return { len: 16, mat: 'gold' }; if (h === 'handle_design') return { len: 32, mat: 'gold' }; if (/^tipon/.test(h)) return null; return { len: 12.8, mat: 'chrome' }; }
  function addHandle(p, M, st, x, y, z, vertical) {
    const H = handleSpec(st);
    if (!H) { const d = mesh(new THREE.CylinderGeometry(.5, .5, .3, 12), M.chrome); d.rotation.x = Math.PI / 2; d.position.set(x, y, z + .15); p.add(d); return; }
    const bar = mesh(new THREE.CylinderGeometry(.55, .55, H.len, 14), M[H.mat]); if (!vertical) bar.rotation.z = Math.PI / 2; bar.position.set(x, y, z + 2.8); p.add(bar);
    [-1, 1].forEach(s => { const q = mesh(new THREE.CylinderGeometry(.45, .45, 2.8, 10), M[H.mat]); q.rotation.x = Math.PI / 2; if (vertical) q.position.set(x, y + s * (H.len / 2 - 1.2), z + 1.4); else q.position.set(x + s * (H.len / 2 - 1.2), y, z + 1.4); p.add(q); });
  }
  const hingeAngle = st => ({ tier: 105, std_soft: 110, std: 110, eco: 100, black: 110, inset: 107, wide155: 155, wide170: 170, frame: 95, glass: 94 })[st.hw.hinge] || 105;

  /* ---------- распашная дверь / подъёмник ---------- */
  function swingDoor(p, M, st, key, x, y, w, h, z, side, mat) {
    const pv = new THREE.Group(); pv.position.set(side === 'L' ? x : x + w, y, z); p.add(pv);
    const dx = side === 'L' ? 0 : -w;
    box(pv, w, h, 1.8, mat || M.body, dx, 0, 0, 60);
    addHandle(pv, M, st, side === 'L' ? dx + w - 3.4 : dx + 3.4, Math.min(h - 10, Math.max(12, h * .5)), 1.8, true);
    const a = hingeAngle(st) * DEG; anims.push({ key, apply: f => { pv.rotation.y = (side === 'L' ? -1 : 1) * a * f; } });
  }
  function liftDoor(p, M, st, key, x, y, w, h, z) {
    const k = st.hw.lift || 'hinge';
    if (k === 'hinge') { swingDoor(p, M, st, key, x, y, w, h, z, (key.length % 2) ? 'L' : 'R'); return; }
    const top = new THREE.Group(); top.position.set(x, y + h, z); p.add(top);
    if (k === 'hf' || k === 'hf_top') {
      const h2 = h / 2; box(top, w, h2 - .15, 1.8, M.body, 0, -h2 + .15, 0, 60);
      const mid = new THREE.Group(); mid.position.set(0, -h2, 0); top.add(mid); box(mid, w, h2 - .15, 1.8, M.body, 0, -h2 + .15, 0, 60);
      anims.push({ key, apply: f => { top.rotation.x = -82 * DEG * f; mid.rotation.x = 164 * DEG * f; } });
    } else if (k === 'hl') { box(top, w, h, 1.8, M.body, 0, -h, 0, 60); anims.push({ key, apply: f => { top.position.y = y + h + f * (h + 4); } }); }
    else { box(top, w, h, 1.8, M.body, 0, -h, 0, 60); const a = k === 'hs' ? 165 : 92; anims.push({ key, apply: f => { top.rotation.x = -a * DEG * f; } }); }
    addHandle(top, M, st, w / 2, -h + 4, 1.8, false);
  }

  /* ---------- одежда, полки, наполнение секции ---------- */
  function garments(p, x0, x1, yTop, drop, seed, z0, depth) {
    const n = Math.max(2, Math.floor((x1 - x0) / 5.5));
    for (let i = 0; i < n; i++) {
      const x = x0 + 2.5 + i * (x1 - x0 - 5) / (n - 1), c = GARM[(seed * 7 + i * 5) % GARM.length], len = drop * (.75 + ((seed + i * 3) % 5) * .06);
      const hg = mesh(new THREE.TorusGeometry(2.2, .25, 6, 16, Math.PI), new THREE.MeshStandardMaterial({ color: '#8a6f4e', roughness: .6 })); hg.position.set(x, yTop - 2.5, z0 + depth / 2); hg.rotation.y = Math.PI / 2; p.add(hg);
      box(p, 1.6, len, depth * .78, gm(c), x - .8, yTop - 4 - len, z0 + depth * .11);
    }
  }
  function drawerBox(p, M, st, key, x, y, w, h, z, depth, sysKey, idx, frontMat) {
    const grp = new THREE.Group(); p.add(grp);
    box(grp, w, h, 1.8, frontMat || M.body, x, y, z, 60);
    addHandle(grp, M, st, x + w / 2, y + h - Math.min(5, h / 3), z + 1.8, false);
    const vis = (st.drawerVis && st.drawerVis[sysKey]) || { h: 9, col: '#9aa0a6' };
    const bh = vis.hidden ? Math.min(h - 4, 12) : Math.min(h - 3, Math.max(6, vis.h)), bw = w - 4, bd = depth - 6, s0 = vis.slim ? .9 : 1.5;
    const sm = vis.hidden ? M.inner : new THREE.MeshStandardMaterial({ color: vis.col, roughness: .35, metalness: .7 });
    box(grp, s0, bh, bd, sm, x + 2, y + 2, z - bd); box(grp, s0, bh, bd, sm, x + w - 2 - s0, y + 2, z - bd);
    box(grp, bw - 2 * s0, bh, 1.2, sm, x + 2 + s0, y + 2, z - bd); box(grp, bw, 1.2, bd, M.inner, x + 2, y + 1.6, z - bd);
    for (let r = 0; r < (vis.rail | 0); r++) [0, 1].forEach(s => cyl(grp, .5, bd, M.chrome, x + 2 + s0 / 2 + s * (bw - s0), y + 2 + bh + 2 + r * 3, z - bd / 2, 'z'));
    anims.push({ key, apply: f => { grp.position.z = f * (depth - 10) * (.9 - idx * .05); } });
  }
  // секция: x0..x1, пол y0, верх y1, глубина D (перед на z=D)
  function section(p, M, st, gi, sec, x0, x1, y0, y1, D, front) {
    const ix0 = x0 + T / 2, ix1 = x1 - T / 2, iw = ix1 - ix0, key = 'sec:' + gi;
    let floor = y0 + .2;
    const dsys = i => (sec.dsys && sec.dsys[i] && sec.dsys[i] !== 'tier' && st.drawerVis[sec.dsys[i]]) ? sec.dsys[i] : st.dsysDefault;
    for (let k = 0; k < Math.min(sec.drawers | 0, 6); k++) { drawerBox(p, M, st, key, ix0 + .2, floor + .3, iw - .4, 17.2, front - 1.8, front - 2, dsys(k), k); floor += 18; }
    (sec.xt || []).forEach((kx, j) => {
      if (kx === 'basket') {
        const grp = new THREE.Group(); p.add(grp); const hh = 24;
        box(grp, iw - 3, 1, front - 10, M.wire, ix0 + 1.5, floor + .5, 2); [0, 1].forEach(s => box(grp, .5, hh, front - 10, M.wire, ix0 + 1.5 + s * (iw - 3.5), floor + .5, 2)); box(grp, iw - 3, hh, .5, M.wire, ix0 + 1.5, floor + .5, front - 8.5);
        anims.push({ key, apply: f => { grp.position.z = f * (front - 14); } }); floor += hh + 2;
      } else if (kx === 'leather' || kx === 'access' || kx === 'shoe_box') {
        drawerBox(p, M, st, key, ix0 + .2, floor + .3, iw - .4, kx === 'shoe_box' ? 20 : 17, front - 1.8, front - 2, dsys(9), 2, kx === 'shoe_box' ? M.body : M.leather); floor += kx === 'shoe_box' ? 21 : 18;
      } else if (kx === 'shoe_rot') {
        const grp = new THREE.Group(); grp.position.set((ix0 + ix1) / 2, floor, front / 2); p.add(grp); const hh = Math.min(70, (y1 - y0) * .32), r = Math.min(iw / 2 - 2, front / 2 - 3);
        cyl(grp, .8, hh, M.chrome, 0, hh / 2, 0, null);
        for (let lv = 0; lv < 3; lv++) { const disc = mesh(new THREE.CylinderGeometry(r, r, .6, 28), M.inner); disc.position.y = 3 + lv * hh / 3; grp.add(disc); for (let s = 0; s < 4; s++) { const sh = mesh(boxGeo(9, 4, 4), M.shoe[(s + lv) % 5]); sh.position.set(Math.cos(s * 1.57) * r * .6, 5 + lv * hh / 3, Math.sin(s * 1.57) * r * .6); sh.rotation.y = -s * 1.57; grp.add(sh); } }
        anims.push({ key, apply: f => { grp.rotation.y = f * Math.PI; } }); floor += hh + 2;
      } else if (kx === 'trouser') {
        const grp = new THREE.Group(); p.add(grp); const yy = y1 - 60;
        box(grp, 1.2, 46, front - 12, M.chrome, ix1 - 3, yy, 3);
        for (let t2 = 0; t2 < 5; t2++) box(grp, .8, 24, 2.2, gm(['#2f3b4f', '#3a3d41', '#7a5638', '#a9adb0', '#1c1d1f'][t2]), ix1 - 5, yy + 20 - 22 + t2 * .1, 5 + t2 * (front - 18) / 5);
        anims.push({ key, apply: f => { grp.position.z = f * (front - 16); } });
      }
    });
    for (let k = 0; k < Math.min(sec.shoes | 0, 4); k++) {
      const sh = mesh(boxGeo(iw - .4, 1.4, front - 12), M.inner); sh.position.set((ix0 + ix1) / 2, floor + 2, (front - 12) / 2 + 2); sh.rotation.x = 12 * DEG; p.add(sh);
      for (let sx = ix0 + 3, jj = 0; sx + 10 < ix1; sx += 12, jj++) box(p, 9, 4, 22, M.shoe[(gi + k + jj) % 5], sx, floor + 3, 6);
      floor += 15;
    }
    let hangBottom = y1;
    if ((sec.pant | 0) > 0) {
      const grp = new THREE.Group(); p.add(grp);
      cyl(grp, .7, iw - 2, M.chrome, (ix0 + ix1) / 2, y1 - 12, front / 2 - 4, 'x');
      garments(grp, ix0 + 1, ix1 - 1, y1 - 12, 70, gi + 3, 4, front - 14);
      [ix0 + 2, ix1 - 2].forEach(xx => box(grp, .6, 10, .6, M.chrome, xx, y1 - 12, front / 2 - 4));
      anims.push({ key, apply: f => { grp.position.y = -f * 32; grp.position.z = f * 6; } });
      hangBottom = y1 - 96;
    } else if ((sec.rods | 0) >= 2 && y1 - y0 > 190) {
      cyl(p, .7, iw, M.chrome, (ix0 + ix1) / 2, y1 - 9, front / 2 - 4, 'x'); garments(p, ix0 + 1, ix1 - 1, y1 - 9, 78, gi, 4, front - 14);
      cyl(p, .7, iw, M.chrome, (ix0 + ix1) / 2, y1 - 107, front / 2 - 4, 'x'); garments(p, ix0 + 1, ix1 - 1, y1 - 107, 70, gi + 4, 4, front - 14);
      hangBottom = y1 - 183;
    } else if ((sec.rods | 0) >= 1) {
      const drop = Math.min(130, y1 - floor - 40);
      cyl(p, .7, iw, M.chrome, (ix0 + ix1) / 2, y1 - 9, front / 2 - 4, 'x'); garments(p, ix0 + 1, ix1 - 1, y1 - 9, Math.max(40, drop), gi + 2, 4, front - 14);
      hangBottom = y1 - 9 - Math.max(40, drop) - 6;
    }
    const hasHang = (sec.pant | 0) || (sec.rods | 0);
    const ns = Math.max(sec.shelves | 0, (!hasHang && !(sec.drawers | 0) && !(sec.shoes | 0)) ? 3 : 0);
    const fb = floor + 3, ft = Math.max(fb + 12, hangBottom - 2);
    for (let k = 1; k <= ns; k++) {
      const yy = fb + (ft - fb) * k / (ns + 1);
      box(p, iw - .2, T, front - 4, M.body, ix0 + .1, yy, 1, 60);
      const item = (gi + k) % 3;
      if (item === 0) for (let f2 = 0; f2 < 3; f2++) box(p, Math.min(24, iw * .4), 3.2, front * .5, gm(GARM[(gi + k + f2) % GARM.length]), ix0 + 3, yy + T + f2 * 3.3, 4);
      else if (item === 1) box(p, Math.min(28, iw * .45), Math.min(16, (ft - fb) / (ns + 1) - 4), front * .55, gm(['#c7b299', '#b7c4cf', '#d9a5b3'][k % 3]), ix0 + 3, yy + T, 4);
      else box(p, Math.min(20, iw * .35), 12, front * .4, gm(['#8b4a3a', '#2f3b4f', '#b07d12'][k % 3]), ix1 - Math.min(20, iw * .35) - 3, yy + T, 5);
    }
    if (st.m.led) { box(p, .8, y1 - y0 - 4, 1.2, M.led, ix0 + .2, y0 + 2, front - 6); box(p, .8, y1 - y0 - 4, 1.2, M.led, ix1 - 1, y0 + 2, front - 6); }
    // невидимый объём для выбора секции
    const hb = new THREE.Mesh(boxGeo(x1 - x0, y1 - y0, D), new THREE.MeshBasicMaterial({ visible: false })); hb.position.set((x0 + x1) / 2, (y0 + y1) / 2, D / 2); hb.userData.sel = { kind: 'sec', i: gi }; p.add(hb); if (gi < 100) pick.push(hb);
  }

  /* ---------- раздвижные двери ---------- */
  function slideDoor(p, M, st, key, x, y, w, h, z, fill, dir) {
    const g = new THREE.Group(); p.add(g);
    const thin = st.hw.sys === 'ps40', fr = thin ? 1 : 2.4, frameM = thin ? M.aluDark : M.alu;
    const panel = f => f === 'laco' ? M.laco : (f === 'dsp' ? M.body : (f === 'sand' ? M.sand : M.mirror));
    if (fill === 'combo') { box(g, w / 2 - fr, h - 2 * fr, 1, M.body, x + fr, y + fr, z + .4, 60); box(g, w / 2 - fr, h - 2 * fr, 1, M.mirror, x + w / 2, y + fr, z + .4); box(g, .8, h, 1.6, frameM, x + w / 2 - .4, y, z); }
    else box(g, w - 2 * fr, h - 2 * fr, 1, panel(fill), x + fr, y + fr, z + .4, 60);
    if (fill === 'sand') for (let k = 0; k < 7; k++) { const lf = mesh(new THREE.CircleGeometry(w * .07, 18), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .6, transparent: true, opacity: .55 })); lf.scale.set(1, .35, 1); lf.position.set(x + w * .5 + Math.sin(k) * w * .12, y + h * (.15 + k * .11), z + 1.5); lf.rotation.z = (k % 2 ? 1 : -1) * .5; g.add(lf); }
    box(g, w, fr, 2, frameM, x, y, z); box(g, w, fr, 2, frameM, x, y + h - fr, z);
    box(g, fr, h, 2, frameM, x, y, z); box(g, fr, h, 2, frameM, x + w - fr, y, z);
    g.userData.slideKey = key; slideDoors.push(g);
    anims.push({ key, apply: f => { g.position.x = dir * f * (w - 3); } });
  }

  /* ---------- корпус ---------- */
  function shell(p, M, W, H, D, opts = {}) {
    box(p, T, H, D, M.body, 0, 0, 0, 60); box(p, T, H, D, M.body, W - T, 0, 0, 60);
    if (opts.top !== false) box(p, W - 2 * T, T, D, M.body, T, H - T, 0, 60);
    box(p, W - 2 * T, T, D - 2, M.body, T, PL, 0, 60);
    box(p, W - 4, PL, D - 6, M.plinth, 2, 0, 2);
    box(p, W - 2 * T, H - PL - T, .4, M.inner, T, PL, 0);
  }

  /* ---------- шкаф-купе ---------- */
  function buildKupe(M, st) {
    const m = st.m, W = m.W, Ht = m.H, ha = m.antresol || 0, Hb = Ht - ha, D = m.D, n = m.doors, front = D - 9;
    const g = new THREE.Group(); root.add(g);
    shell(g, M, W, Ht, D);
    if (ha) box(g, W - 2 * T, T, D, M.body, T, Hb, 0, 60);
    const ws = st.widths[0], xs = []; let acc = 0; ws.forEach(v => { xs.push(acc); acc += v; });
    for (let i = 1; i < n; i++) box(g, T, Hb - PL - T, front, M.body, xs[i] - T / 2, PL + T, 0, 60);
    for (let i = 0; i < n; i++) section(g, M, st, i, st.plan[i], xs[i] + (i ? T / 2 : T), xs[i] + ws[i] - (i < n - 1 ? T / 2 : T), PL + T, Hb - (ha ? T : T), front, front);
    // направляющие и двери
    box(g, W, 2.2, 8, M.alu, 0, Hb - 2.2 - (ha ? 0 : T), D - 8); box(g, W, 1.2, 8, M.alu, 0, PL, D - 8);
    const dw = (W + (n - 1) * 3) / n;
    for (let i = 0; i < n; i++) slideDoor(g, M, st, 'sec:' + i, i * (dw - 3), PL + 1.2, dw, Hb - PL - 3.6 - (ha ? 0 : T), i % 2 ? D - 5 : D - 2.4, m.fills[i] || 'dsp', i < n - 1 ? 1 : -1);
    if (ha) {
      const dn = Math.max(2, Math.ceil(W / 60)), aw = (W - 2 * T) / dn;
      for (let k = 0; k < dn; k++) liftDoor(g, M, st, 'ant:' + k, T + k * aw + .15, Hb + T + .15, aw - .3, ha - 2 * T - .3, D);
      const hb = new THREE.Mesh(boxGeo(W, ha, D), new THREE.MeshBasicMaterial({ visible: false })); hb.position.set(W / 2, Hb + ha / 2, D / 2); hb.userData.sel = { kind: 'ant' }; g.add(hb); pick.push(hb);
    }
    bounds = { w: W, d: D, h: Ht, x0: 0, x1: W, zMax: D + 200 };
  }

  /* ---------- гардеробная (открытая система по стенам) ---------- */
  function wallGroup(wi, u0, st) {
    const g = new THREE.Group(), walls = st.walls, D = st.m.D, A = walls[0];
    if (st.m.shape === 'line' || wi === 0) g.position.set(u0, 0, 0);
    else if (wi === 1) { g.position.set(0, 0, D + u0); g.rotation.y = 90 * DEG; }   // стена Б — слева
    else { g.position.set(A, 0, D + u0); g.rotation.y = -90 * DEG; }                 // стена В — справа
    return g;
  }
  function buildWardrobe(M, st) {
    const m = st.m, H = m.H, D = m.D, walls = st.walls;
    let gi = 0;
    walls.forEach((Lw, wi) => {
      const ws = st.widths[wi], n = ws.length, run = new THREE.Group(); root.add(run);
      let acc = 0;
      for (let i = 0; i < n; i++) {
        const w = ws[i], g = wallGroup(wi, wi === 1 ? acc + w : acc, st);
        // стойки, верх, низ секции
        box(g, T, H, D, M.body, 0, 0, 0, 60); if (i === n - 1) box(g, T, H, D, M.body, w - T, 0, 0, 60);
        box(g, w, T, D, M.body, 0, H - T, 0, 60); box(g, w, PL, D - 4, M.plinth, 0, 0, 2); box(g, w, T, D, M.body, 0, PL, 0, 60);
        section(g, M, st, gi, st.plan[gi], T, w - (i === n - 1 ? T : 0), PL + T, H - T, D, D);
        root.add(g); acc += w; gi++;
      }
    });
    if (m.mirror.on) {
      const mw = m.mirror.W, mh = Math.min(m.mirror.H, H - 10);
      const mg = new THREE.Group(); root.add(mg);
      if (m.shape === 'U') { mg.position.set(walls[0], 0, D + (walls[2] || 0) + 30 + mw); mg.rotation.y = -90 * DEG; }   // П: на правой стене, перед шкафом
      else mg.position.set(walls[0] + 25, 0, 0);
      box(mg, mw + 3, mh + 3, 1.2, M.aluDark, -1.5, 30 - 1.5, 0); box(mg, mw, mh, .6, M.mirror, 0, 30, 1.2);
      if (m.mirror.type === 'led') box(mg, mw + 4, .8, 1, M.led, -2, 30 + mh + 2, 1.2);
    }
    const A = walls[0], wB = walls[1] || 0, wC = walls[2] || 0;
    const extra = m.mirror.on && m.shape !== 'U' ? m.mirror.W + 40 : 0;
    bounds = { w: A + extra, d: Math.max(D, wB + D, wC + D), h: H, x0: 0, x1: A + extra, zMax: Math.max(D, wB + D, wC + D + (m.mirror.on && m.shape === 'U' ? m.mirror.W + 40 : 0)) + 160 };
  }

  /* ---------- прихожая ---------- */
  function hallWardrobe(M, st, g, key, W, H, D, doors, kind, mirrorDoor) {
    shell(g, M, W, H, D);
    const ns = kind === 'sliding' ? doors : Math.max(1, Math.round(W / 50)), sw = (W - 2 * T) / ns;
    for (let i = 1; i < ns; i++) box(g, T, H - PL - 2 * T, D - (kind === 'sliding' ? 9 : 2), M.body, T + i * sw - T / 2, PL + T, 0, 60);
    for (let i = 0; i < ns; i++) section(g, M, st, 100 + i + (key.length * 10), { rods: i === 0 ? 1 : (i === 1 ? 2 : 0), shelves: i === 0 ? 1 : 3, drawers: i === ns - 1 && ns > 1 ? 2 : 0, shoes: 0, pant: 0 }, T + i * sw + .4, T + (i + 1) * sw - .4, PL + T, H - T, D - (kind === 'sliding' ? 9 : 2), D - (kind === 'sliding' ? 9 : 2));
    if (kind === 'sliding') {
      const dw = (W + (doors - 1) * 3) / doors;
      box(g, W, 2, 8, M.alu, 0, H - T - 2, D - 8); box(g, W, 1.2, 8, M.alu, 0, PL, D - 8);
      for (let i = 0; i < doors; i++) slideDoor(g, M, st, key, i * (dw - 3), PL + 1.2, dw, H - PL - 4, i % 2 ? D - 5 : D - 2.4, mirrorDoor && i === doors - 1 ? 'mirror' : 'dsp', i < doors - 1 ? 1 : -1);
    } else {
      const dw = (W - (doors + 1) * .3) / doors;
      for (let i = 0; i < doors; i++) swingDoor(g, M, st, key, .3 + i * (dw + .3), PL + .3, dw, H - PL - .6, D, (i % 2 === 0) ? 'L' : 'R', mirrorDoor && i === doors - 1 ? M.mirror : null);
    }
    const hb = new THREE.Mesh(boxGeo(W, H, D), new THREE.MeshBasicMaterial({ visible: false })); hb.position.set(W / 2, H / 2, D / 2); hb.userData.sel = { kind: 'door', key }; g.add(hb); pick.push(hb);
  }
  function antresol(M, st, g, W, ha, D, y) {
    box(g, T, ha, D, M.body, 0, y, 0, 60); box(g, T, ha, D, M.body, W - T, y, 0, 60); box(g, W, T, D, M.body, 0, y + ha - T, 0, 60); box(g, W, T, D, M.body, 0, y, 0, 60);
    const dn = Math.max(2, Math.ceil(W / 60)), aw = (W - 2 * T) / dn;
    for (let k = 0; k < dn; k++) liftDoor(g, M, st, 'ant:' + k, T + k * aw + .15, y + T + .15, aw - .3, ha - 2 * T - .3, D);
    const hb = new THREE.Mesh(boxGeo(W, ha, D), new THREE.MeshBasicMaterial({ visible: false })); hb.position.set(W / 2, y + ha / 2, D / 2); hb.userData.sel = { kind: 'ant' }; g.add(hb); pick.push(hb);
  }
  function hangHooks(M, g, x0, w, y, D) { box(g, w - 8, 4, 1.4, M.body, x0 + 4, y - 4, 0, 60); for (let hx = x0 + 10, i = 0; hx < x0 + w - 6; hx += 14, i++) { cyl(g, .4, 5, M.chrome, hx, y - 2, 2.5, 'z'); if (i % 2 === 0) box(g, 14, 58 + (i % 3) * 8, 6, gm(GARM[(i * 3 + 1) % GARM.length]), hx - 7, y - 62 - (i % 3) * 8, 3); } }
  function bench(M, g, x0, w, D, cushion) {
    box(g, w, 4, D, M.body, x0, 41, 0, 60); box(g, 3, 41, D - 4, M.body, x0 + 2, 0, 2, 60); box(g, 3, 41, D - 4, M.body, x0 + w - 5, 0, 2, 60);
    if (cushion) { const c = mesh(boxGeo(w - 2, 7, D - 4), M.cushion); c.position.set(x0 + w / 2, 48.5, D / 2); g.add(c); }
  }
  function buildHall(M, st) {
    const m = st.m, h = m.hall, col = M.body;
    const g = new THREE.Group(); root.add(g);
    if (h.shape === 'line') {
      let x = 0; const GAP = 6;
      (st.hallItems || []).forEach(it => {
        const ig = new THREE.Group(); ig.position.set(x, 0, 0); g.add(ig);
        if (it.k === 'w') {
          const w = h.wardrobe; hallWardrobe(M, st, ig, 'w1', w.W, w.H, w.D, w.doors, w.kind, w.mirrorDoor);
          if (h.antresol.on) antresol(M, st, ig, Math.min(h.antresol.W, w.W), h.antresol.H, w.D, w.H);
        } else if (it.k === 'h') {
          if (it.hang) { const hw = h.hanger.W, hx = (it.w - hw) / 2; box(ig, hw, 118, 1.8, col, hx, 87, 0, 60); box(ig, hw + 4, 2, 28, col, hx - 2, 205, 0, 60); hangHooks(M, ig, hx, hw, 195, 2); }
          if (it.bench) bench(M, ig, (it.w - h.bench.W) / 2, h.bench.W, 38, h.bench.cushion);
        } else {
          const Hs = it.shoe ? 20 * h.shoe.tiers + 10 : 0;
          if (it.shoe) {
            const sw = h.shoe.W, sx = (it.w - sw) / 2, sg = new THREE.Group(); sg.position.set(sx, 0, 0); ig.add(sg);
            shell(sg, M, sw, Hs, 26);
            for (let k = 0; k < h.shoe.tiers; k++) {
              const pv = new THREE.Group(); pv.position.set(0, PL + k * 20 + 18.5, 26); sg.add(pv);
              box(pv, sw - .6, 18.5, 1.8, col, .3, -18.5, 0, 60); addHandle(pv, M, st, sw / 2, -4, 1.8, false);
              anims.push({ key: 'shoe', apply: f => { pv.rotation.x = 0; pv.position.z = 26; pv.rotation.x = f * 28 * DEG; } });
            }
            const hb = new THREE.Mesh(boxGeo(sw, Hs, 26), new THREE.MeshBasicMaterial({ visible: false })); hb.position.set(sw / 2, Hs / 2, 13); hb.userData.sel = { kind: 'door', key: 'shoe' }; sg.add(hb); pick.push(hb);
          }
          if (it.mir) { const mw = m.mirror.W, mh = m.mirror.H, mx = (it.w - mw) / 2, my = Hs + 12; box(ig, mw + 3, mh + 3, 1.2, M.aluDark, mx - 1.5, my - 1.5, 0); box(ig, mw, mh, .6, M.mirror, mx, my, 1.2); }
        }
        x += it.w + GAP;
      });
      bounds = { w: Math.max(80, x - GAP), d: 60, h: 250, x0: 0, x1: Math.max(80, x - GAP), zMax: 220 };
      return;
    }
    // Г / П: шкафы вокруг ниши
    const U = h.shape === 'U', right = (h.side || 'right') === 'right', H = h.wardrobe.H, ha = h.antresol.on ? h.antresol.H : 0;
    const Hn = H - ha, Hw = U ? H - ha : H, Wn = h.niche.W, W1 = h.wardrobe.W, W2 = U ? h.wardrobe2.W : 0, D = h.wardrobe.D;
    let x1 = null, xN, x2 = null;
    if (U) { x1 = 0; xN = W1; x2 = W1 + Wn; } else if (right) { xN = 0; x1 = Wn; } else { x1 = 0; xN = W1; }
    if (x1 != null && h.wardrobe.on) { const wg = new THREE.Group(); wg.position.x = x1; g.add(wg); hallWardrobe(M, st, wg, 'w1', W1, Hw, D, h.wardrobe.doors, h.wardrobe.kind, h.wardrobe.mirrorDoor); }
    if (U && h.wardrobe.on) { const wg = new THREE.Group(); wg.position.x = x2; g.add(wg); hallWardrobe(M, st, wg, 'w2', W2, Hw, D, h.wardrobe2.doors, h.wardrobe.kind, false); }
    // ниша
    const ng = new THREE.Group(); ng.position.x = xN; g.add(ng);
    box(ng, Wn, Hn, 1.2, h.niche.slats ? M.slat : M.niche, 0, 0, 0, h.niche.slats ? 40 : 0);
    if (h.niche.slats) M.slat.map.repeat.set(1, 1);
    if (h.bench.on) bench(M, ng, 2, Wn - 4, 38, h.bench.cushion);
    if (h.shoe.on) for (let k = 0; k < Math.min(h.shoe.tiers, h.bench.on ? 2 : 6); k++) { const yy = 2 + k * 20; box(ng, Wn - 4, 1.8, 28, col, 2, yy, 1.2, 60); for (let sx = 6, j = 0; sx + 10 < Wn - 4; sx += 13, j++) box(ng, 9, 4.5, 22, M.shoe[(k + j) % 5], sx, yy + 1.8, 4); }
    if (h.hanger.on) hangHooks(M, ng, 2, Wn - 4, Hn - 28, 1.2);
    if (m.mirror.on) { const mw = Math.min(m.mirror.W, Wn - 14), mh = Math.max(30, Math.min(m.mirror.H, Hn - 130)), mx = (Wn - mw) / 2, my = h.bench.on ? 62 : 30; box(ng, mw + 3, mh + 3, 1, M.aluDark, mx - 1.5, my - 1.5, 1.2); box(ng, mw, mh, .5, M.mirror, mx, my, 2.2); }
    if (m.led) box(ng, Wn - 4, .8, 1.4, M.led, 2, Hn - 2, 30);
    if (ha) { const ag = new THREE.Group(); ag.position.x = U ? 0 : xN; g.add(ag); antresol(M, st, ag, U ? W1 + Wn + W2 : Wn, ha, Math.max(38, D * .85), H - ha); }
    const tot = W1 + Wn + W2;
    bounds = { w: tot, d: D, h: H, x0: 0, x1: tot, zMax: 220 };
  }

  /* ---------- комната ---------- */
  function room(M) {
    const pad = 110, x0 = bounds.x0 - pad, x1 = bounds.x1 + pad, zMax = bounds.zMax + 60, Hroom = Math.max(bounds.h + 30, 270);
    const fl = mesh(new THREE.PlaneGeometry(x1 - x0, zMax + 40), M.floor, false); fl.rotation.x = -Math.PI / 2; fl.position.set((x0 + x1) / 2, 0, zMax / 2 - 20); M.floor.map.repeat.set((x1 - x0) / 160, (zMax + 40) / 160); root.add(fl);
    const back = mesh(new THREE.PlaneGeometry(x1 - x0, Hroom), M.wall, false); back.position.set((x0 + x1) / 2, Hroom / 2, -.8); root.add(back);
    const st = state, wd = st.type === 'wardrobe' && st.m.shape !== 'line';
    if (wd) { const lw = mesh(new THREE.PlaneGeometry(zMax, Hroom), M.wall, false); lw.rotation.y = Math.PI / 2; lw.position.set(-.8, Hroom / 2, zMax / 2); root.add(lw); }
    if (st.type === 'wardrobe' && st.m.shape === 'U') { const rw = mesh(new THREE.PlaneGeometry(zMax, Hroom), M.wall, false); rw.rotation.y = -Math.PI / 2; rw.position.set(st.walls[0] + .8, Hroom / 2, zMax / 2); root.add(rw); }
    box(root, x1 - x0, 7, 1.4, M.niche, x0, 0, -.6);
  }

  function build(st) {
    scene.remove(root); root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    root = new THREE.Group(); scene.add(root); anims = []; pick = []; selBox = null; slideDoors = [];
    const M = mats(st);
    if (st.type === 'kupe') buildKupe(M, st); else if (st.type === 'wardrobe') buildWardrobe(M, st); else buildHall(M, st);
    room(M);
    const cx = (bounds.x0 + bounds.x1) / 2, span = Math.max(bounds.w, bounds.d, 200) + 220;
    sun.position.set(cx - span * .35, bounds.h + 280, bounds.zMax + span * .55); sun.target.position.set(cx, 80, bounds.d / 2);
    const sc = sun.shadow.camera; sc.left = -span * .7; sc.right = span * .7; sc.top = span * .7; sc.bottom = -span * .7; sc.near = 10; sc.far = span * 3; sc.updateProjectionMatrix();
    anims.forEach(a => a.apply(ease(openAmt.get(a.key) || 0)));
    slideDoors.forEach(g => { g.visible = !hideDoors; });
    highlight();
    if (first) { setView('angle'); first = false; }
    invalidate();
  }
  function highlight() {
    if (selBox) { root.remove(selBox); selBox = null; }
    const sel = state && state.selected; if (!sel) return;
    const hb = pick.find(p => p.userData.sel && p.userData.sel.kind === sel.kind && (sel.kind !== 'sec' || p.userData.sel.i === sel.i) && (sel.kind !== 'door' || p.userData.sel.key === sel.key)); if (!hb) return;
    hb.updateWorldMatrix(true, false);
    const geo = new THREE.EdgesGeometry(hb.geometry);
    selBox = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#e9b44c' }));
    selBox.applyMatrix4(hb.matrixWorld); root.add(selBox);
  }
  function setView(name) {
    const cx = (bounds.x0 + bounds.x1) / 2, c = new THREE.Vector3(cx, Math.min(130, bounds.h / 2), bounds.d / 2);
    const dist = Math.max(bounds.w * 1.05, bounds.h * 1.25) * 1.25 + 90;
    if (name === 'front') camera.position.set(cx, 140, c.z + dist);
    else if (name === 'top') camera.position.set(cx, dist * 1.5 + 200, c.z + 1);
    else if (state && state.type === 'wardrobe' && state.m.shape !== 'line') camera.position.set(cx + dist * .35, 190, c.z + dist * 1.1);
    else camera.position.set(cx - dist * .45, 175, c.z + dist * .95);
    controls.target.copy(c); controls.update(); invalidate();
  }

  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let downAt = null;
  function hit(ev) {
    const r = renderer.domElement.getBoundingClientRect(); ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera); const hs = ray.intersectObjects(pick, false); return hs.length ? hs[0].object.userData.sel : null;
  }
  renderer.domElement.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', e => { if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return; if (hooks.onSelect) hooks.onSelect(hit(e)); });
  renderer.domElement.addEventListener('dblclick', e => { const s = hit(e); if (s) toggle(keyOf(s)); });
  const keyOf = s => s.kind === 'sec' ? 'sec:' + s.i : (s.kind === 'ant' ? 'ant' : s.key);
  function keysOf(key) { return [...new Set(anims.filter(a => a.key === key || a.key.startsWith(key + ':')).map(a => a.key))]; }
  function toggle(key) { const ks = keysOf(key); if (!ks.length) return; const on = !(openTarget.get(ks[0]) > .5); ks.forEach(k => openTarget.set(k, on ? 1 : 0)); invalidate(); }
  function openAll(on) {
    // у купе нельзя открыть все двери сразу: двери убираем, чтобы было видно всё наполнение, а ящики и антресоль открываем
    hideDoors = !!on && slideDoors.length > 0;
    slideDoors.forEach(g => { g.visible = !hideDoors; openTarget.set(g.userData.slideKey, 0); });
    const slideKeys = new Set(slideDoors.map(g => g.userData.slideKey));
    [...new Set(anims.map(a => a.key))].forEach(k => { if (!slideKeys.has(k) || !on) openTarget.set(k, on ? 1 : 0); });
    // ящики в секциях купе открываются по тем же ключам, что и двери: открыть их отдельно
    if (on) anims.forEach(a => { if (slideKeys.has(a.key)) openTarget.set(a.key, 1); });
    invalidate();
  }
  function isOpen(key) { const ks = keysOf(key); return ks.length > 0 && openTarget.get(ks[0]) > .5; }

  let last = performance.now(), raf = 0, alive = true;
  function loop(now) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - last) / 1000); last = now; let moving = false;
    openTarget.forEach((tg, k) => { const cur = openAmt.get(k) || 0; if (Math.abs(cur - tg) > .001) { openAmt.set(k, cur + Math.sign(tg - cur) * Math.min(Math.abs(tg - cur), dt / .9)); moving = true; } });
    if (moving) anims.forEach(a => a.apply(ease(openAmt.get(a.key) || 0)));
    const damp = controls.update();
    if (moving || needs || damp) { renderer.render(scene, camera); needs = false; }
  }
  raf = requestAnimationFrame(loop);
  const ro = new ResizeObserver(() => { const w = container.clientWidth || 600, h = container.clientHeight || 400; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); invalidate(); });
  ro.observe(container);
  let lastType = null;
  return {
    update(st) { if (st.type !== lastType) { first = true; lastType = st.type; } state = st; build(st); },
    setView, toggle, openAll, isOpen, keyOf,
    select(sel) { if (state) { state.selected = sel; highlight(); invalidate(); } },
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); container.removeChild(renderer.domElement); }
  };
}
