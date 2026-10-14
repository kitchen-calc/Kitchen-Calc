/* Конструктор изделий в 3D: отдельная сцена, где вы собираете шкаф, тумбу, стол, стеллаж — что угодно — из досок, брусков, ножек,
   дверец на петлях и ящиков. Готовое изделие добавляется в комнату одним предметом (дверцы и ящики открываются двойным щелчком)
   и сохраняется в «Мои изделия». Размеры — в сантиметрах, шаг до 1 мм. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ptAabb, ledStrips, LED_MODES } from '/static/js/shkaf-pro-core.js?v=33';
const $ = id => document.getElementById(id);
const r1 = v => Math.round(v * 10) / 10;
let host, renderer, scene, camera, controls, group, raf = 0, st = null, selI = -1, meshes = [], selBox = null, drag = null, alive = false, started = false, bound = false, hist = [], openAll = false;
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
const MATS = [['dsp', 'ЛДСП 16 мм'], ['ply', 'Фанера 12 мм'], ['mdf', 'МДФ крашеный']];
const KN = ['Доска / брусок', 'Цилиндр', 'Дверца (петли слева)', 'Дверца (петли справа)', 'Дверца (петли сверху)', 'Дверца (петли снизу)', 'Ящик (выдвигается)'];
const T = () => (st.mat === 'ply' ? 1.2 : 1.6);

/* ---- заготовки: деталь [вид, x, y, z, w, h, d, группа] ---- */
function tableP(W, D, H, tt, ls, inset) {
  const o = [[0, 0, H - tt, 0, W, tt, D, 0]], l = H - tt;
  [[inset, inset], [W - inset - ls, inset], [inset, D - inset - ls], [W - inset - ls, D - inset - ls]].forEach(p => o.push([0, p[0], 0, p[1], ls, l, ls, 0]));
  o.push([0, inset + ls, H - tt - 8, inset, W - 2 * inset - 2 * ls, 8, 1.6, 0], [0, inset + ls, H - tt - 8, D - inset - 1.6, W - 2 * inset - 2 * ls, 8, 1.6, 0]);
  return o;
}
function drawerP(x, y, z, w, h, d, t, g) {   // ящик: фасад + 2 боковины + задняя + дно, все выдвигаются вместе
  const o = [[6, x, y, z + d - t, w, h, t, g]], bh = Math.max(4, h - 4), bw = w - 2 * t - 1.6;
  o.push([6, x + 1, y + 2, z + 1, t, bh, d - t - 1, g], [6, x + w - t - 1, y + 2, z + 1, t, bh, d - t - 1, g], [6, x + 1 + t, y + 2, z + 1, bw - 0, bh, t, g], [6, x + 1 + t, y + 2, z + 1 + t, bw, .5, d - 3 * t, g]);
  return o;
}
function cabinetP(W, H, D, n, dn, dr, t) {   // корпус шкафа: бока, дно, крышка, спинка, полки, дверцы, ящики
  const o = [[0, 0, 0, 0, t, H, D, 0], [0, W - t, 0, 0, t, H, D, 0], [0, t, 0, 0, W - 2 * t, t, D, 0], [0, t, H - t, 0, W - 2 * t, t, D, 0], [0, t, t, 0, W - 2 * t, H - 2 * t, .3, 0]];
  const iw = W - 2 * t, drawersH = dr ? Math.min(H * .5, dr * 18) : 0, shelvesTop = H - t;
  for (let i = 1; i <= n; i++) o.push([0, t + .1, drawersH + t + (shelvesTop - drawersH - t) * i / (n + 1), 1, iw - .2, t, D - 2, 0]);
  let g = 1; for (let i = 0; i < dr; i++) { const dh = drawersH / dr; drawerP(t + .2, t + i * dh, 1, iw - .4, dh - .4, D - 2, t, g++).forEach(b => o.push(b)); }
  const dh0 = dr ? drawersH + t : t, dH = H - dh0 - t - .4;
  if (dn === 1) o.push([2, t + .2, dh0 + .2, D - t, iw - .4, dH, t, 0]);
  else if (dn >= 2) { const dw = (iw - .6) / 2; o.push([2, t + .2, dh0 + .2, D - t, dw, dH, t, 0], [3, t + .4 + dw, dh0 + .2, D - t, dw, dH, t, 0]); }
  return o;
}
const P = {
  cab: { ru: '🗄 Шкаф с полками и дверцами', f: t => cabinetP(80, 200, 50, 4, 2, 0, t) },
  chest: { ru: 'Комод с ящиками', f: t => cabinetP(90, 90, 45, 0, 0, 4, t) },
  low: { ru: 'Тумба: ящики + дверцы', f: t => cabinetP(100, 70, 45, 1, 2, 2, t) },
  table: { ru: '🪑 Стол обеденный', f: () => tableP(140, 80, 75, 2.8, 6, 5) },
  desk: { ru: 'Письменный стол', f: () => tableP(120, 60, 75, 2.8, 5, 4) },
  coffee: { ru: 'Журнальный столик', f: () => tableP(90, 50, 45, 2.8, 5, 4) },
  round: { ru: 'Круглый стол', f: () => [[0, 0, 72, 0, 100, 2.8, 100, 0].map((v, i) => i === 0 ? 1 : v), [1, 42, 3, 42, 16, 69, 16, 0], [1, 25, 0, 25, 50, 3, 50, 0]] },
  stool: { ru: 'Табурет', f: () => tableP(35, 35, 45, 2.8, 4, 2.5) },
  wall: { ru: 'Навесной шкаф', f: t => cabinetP(60, 70, 35, 1, 2, 0, t) },
  tv: { ru: 'ТВ-тумба', f: t => cabinetP(160, 45, 40, 0, 2, 2, t) },
  vitrine: { ru: 'Витрина со стеклом', f: t => cabinetP(70, 190, 40, 4, 2, 0, t).map(b => { const c = pad(b); if (c[0] === 2 || c[0] === 3) c[11] = 'glass'; return c; }) },
  shelf: { ru: 'Стеллаж 4 полки', f: t => cabinetP(80, 180, 30, 3, 0, 0, t).filter(b => b[6] !== .3 && !(b[5] === .3)) }
};
const pad = b => { const c = b.slice(); while (c.length < 12) c.push(0); return c; };
function fromObj(o) { return { id: o ? o.id : null, name: (o && o.name) || '', mat: (o && o.mat) || 'dsp', color: (o && o.color) || '', cat: (o && o.cat) || '', led: (o && o.led) | 0, pt: ((o && o.pt && o.pt.length) ? o.pt : P.cab.f(1.6)).map(pad) }; }
const snap = () => { hist.push(JSON.stringify(st.pt)); if (hist.length > 80) hist.shift(); };

/* ---- сцена ---- */
function matOf() {
  const c = st.cat && window.KCCAT && window.KCCAT.find(st.cat), m = new THREE.MeshStandardMaterial({ color: c ? c.hex : (st.color || (st.mat === 'ply' ? '#d8bd8a' : '#e3d9c4')), roughness: .55, metalness: 0 });
  if (c && c.img) window.KCCAT.tex(c.img, cv => { const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.MirroredRepeatWrapping; tx.anisotropy = 8; m.map = tx; m.color.set('#ffffff'); m.needsUpdate = true; draw(); });
  return m;
}
const pcCache = {};
function catMat(id) {   // материал детали из каталога цветов
  if (pcCache[id]) return pcCache[id]; const c = window.KCCAT && window.KCCAT.find(id); if (!c) return null;
  const m = pcCache[id] = new THREE.MeshStandardMaterial({ color: c.hex, roughness: .55, metalness: 0 });
  if (c.img) window.KCCAT.tex(c.img, cv => { const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.MirroredRepeatWrapping; tx.anisotropy = 8; m.map = tx; m.color.set('#ffffff'); m.needsUpdate = true; draw(); });
  return m;
}
/* стекло, зеркало и свет — общие материалы сцены */
const DEG = Math.PI / 180;
const glassMat = new THREE.MeshPhysicalMaterial({ color: '#bfe3ec', transparent: true, opacity: .38, roughness: .05, metalness: 0, depthWrite: false }), mirrorMat = new THREE.MeshStandardMaterial({ color: '#eef5f9', roughness: .05, metalness: .85 }), ledMat = new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffe29a', emissiveIntensity: 2.2 });
let anims = [];
const openT = new Map(), openAmt = new Map();   // ключ детали / ящика → цель и текущая доля открытия (плавно)
/* ящик — это группа досок с одним номером: двигать, копировать и удалять его надо целиком */
const gidx = i => { const b = st.pt[i]; if (!b) return []; if (b[0] === 6 && b[7]) return st.pt.map((q, k) => (q[0] === 6 && q[7] === b[7]) ? k : -1).filter(k => k >= 0); return [i]; };
const nextG = () => Math.max(0, ...st.pt.map(b => b[7] || 0)) + 1;
const disposeTree = o => { o.traverse(c => { if (c.geometry) c.geometry.dispose(); }); };
function rebuild() {
  if (!group) return; while (group.children.length) { const c = group.children.pop(); disposeTree(c); }
  meshes = []; anims = []; const mat = matOf(), dmat = mat.clone(), rmat = mat.clone(); dmat.color = dmat.color.clone().multiplyScalar(.92); rmat.color = rmat.color.clone().multiplyScalar(.85);
  const G6 = {};
  st.pt.forEach((b, i) => {
    const k = b[0], w = Math.max(.05, b[4]), h = Math.max(.05, b[5]), d = Math.max(.05, b[6]), geo = k === 1 ? new THREE.CylinderGeometry(w / 2, w / 2, h, 28) : new THREE.BoxGeometry(w, h, d);
    const pm = b[11] === 'glass' ? glassMat : (b[11] === 'mirror' ? mirrorMat : ((b[11] && catMat(b[11])) || (k >= 2 && k <= 5 ? dmat : (k === 6 ? rmat : mat))));
    const m = new THREE.Mesh(geo, pm); m.userData.i = i; m.castShadow = b[11] !== 'glass'; m.receiveShadow = true;
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: .28 })));
    if (k >= 2 && k <= 5) {   // дверца на петлях: поворот вокруг оси петель, как в комнате
      const pv = new THREE.Group(); group.add(pv); pv.add(m);
      if (k === 2) { pv.position.set(b[1], b[2], b[3] + d); m.position.set(w / 2, h / 2, -d / 2); anims.push({ key: 'p' + i, f: f => { pv.rotation.y = -105 * DEG * f; } }); }
      else if (k === 3) { pv.position.set(b[1] + w, b[2], b[3] + d); m.position.set(-w / 2, h / 2, -d / 2); anims.push({ key: 'p' + i, f: f => { pv.rotation.y = 105 * DEG * f; } }); }
      else if (k === 4) { pv.position.set(b[1], b[2] + h, b[3] + d); m.position.set(w / 2, -h / 2, -d / 2); anims.push({ key: 'p' + i, f: f => { pv.rotation.x = -100 * DEG * f; } }); }
      else { pv.position.set(b[1], b[2], b[3] + d); m.position.set(w / 2, h / 2, -d / 2); anims.push({ key: 'p' + i, f: f => { pv.rotation.x = 95 * DEG * f; } }); }
    } else if (k === 6 && b[7]) {   // ящик: все доски группы выезжают вместе
      let G = G6[b[7]]; if (!G) { G = G6[b[7]] = { g: new THREE.Group(), dmax: 0 }; group.add(G.g); }
      G.dmax = Math.max(G.dmax, d); m.position.set(b[1] + w / 2, b[2] + h / 2, b[3] + d / 2); G.g.add(m);
    } else {
      m.position.set(b[1] + w / 2, b[2] + h / 2, b[3] + d / 2); m.rotation.order = 'YXZ'; m.rotation.set((b[9] || 0) * DEG, (b[8] || 0) * DEG, (b[10] || 0) * DEG); group.add(m);
    }
    meshes.push(m);
  });
  Object.keys(G6).forEach(gi => { const G = G6[gi]; anims.push({ key: 'g' + gi, f: f => { G.g.position.z = f * G.dmax * .8; } }); });
  ledStrips({ kind: 'parts', led: st.led, pt: st.pt }).forEach(s => { const lm = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), ledMat); lm.position.set(s.x + s.w / 2, s.y + s.h / 2, s.z + s.d / 2); group.add(lm); });
  anims.forEach(a => a.f(openAmt.get(a.key) || 0));
  hl();
}
function updSel() {
  const m = meshes[selI]; if (!selBox || !m) return; m.updateWorldMatrix(true, false);
  const wp = new THREE.Vector3(), wq = new THREE.Quaternion(); m.getWorldPosition(wp); m.getWorldQuaternion(wq); selBox.position.copy(wp); selBox.quaternion.copy(wq);
}
function hl() {
  if (selBox) { scene.remove(selBox); selBox = null; }
  const m = meshes[selI]; if (!m) { draw(); return; }
  const p = m.geometry.parameters, g = m.geometry.type === 'CylinderGeometry' ? new THREE.CylinderGeometry(p.radiusTop + .3, p.radiusTop + .3, p.height + .6, 28) : new THREE.BoxGeometry(p.width + .6, p.height + .6, p.depth + .6);
  selBox = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0xe0a21a })); scene.add(selBox); updSel(); draw();
}
function draw() { if (renderer && scene) renderer.render(scene, camera); }
function openToggle(key) { openT.set(key, (openT.get(key) || 0) > .5 ? 0 : 1); }
function openAllToggle() { const on = !anims.some(a => (openT.get(a.key) || 0) > .5); anims.forEach(a => openT.set(a.key, on ? 1 : 0)); }
const isOpenAny = () => anims.some(a => (openT.get(a.key) || 0) > .5);
function loop() {
  if (!alive) return; controls.update(); let busy = false;
  anims.forEach(a => { const t = openT.get(a.key) || 0, c = openAmt.get(a.key) || 0; if (Math.abs(t - c) > .002) { const nx = c + (t - c) * .2; openAmt.set(a.key, nx); a.f(nx); busy = true; } else if (c !== t) { openAmt.set(a.key, t); a.f(t); busy = true; } });
  if (busy) updSel(); renderer.render(scene, camera); raf = requestAnimationFrame(loop);
}
function size() { if (!host || !renderer) return; const w = host.clientWidth || 600, h = host.clientHeight || 420; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); draw(); }
function bbox() {
  if (!st.pt.length) return { x0: 0, y0: 0, z0: 0, x1: 0, y1: 0, z1: 0 };
  const A = st.pt.map(ptAabb);
  return { x0: Math.min(...A.map(v => v[0])), y0: Math.min(...A.map(v => v[1])), z0: Math.min(...A.map(v => v[2])), x1: Math.max(...A.map(v => v[3])), y1: Math.max(...A.map(v => v[4])), z1: Math.max(...A.map(v => v[5])) };
}
function frame() { const b = bbox(), cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, cy = (b.y0 + b.y1) / 2, s = Math.max(b.x1 - b.x0, b.z1 - b.z0, b.y1 - b.y0, 60); controls.target.set(cx, cy, cz); camera.position.set(cx + s * .9, cy + s * .6, cz + s * 1.7); controls.update(); draw(); }
function init3d() {
  host = $('p3Cv'); if (!host || started) return; started = true;
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.shadowMap.enabled = true; renderer.setClearColor('#f1ebe0');
  host.appendChild(renderer.domElement); renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:none';
  scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(40, 1.5, 1, 4000);
  scene.add(new THREE.HemisphereLight('#ffffff', '#b8a98c', 1.0)); const sun = new THREE.DirectionalLight('#ffffff', 1.6); sun.position.set(180, 300, 260); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = -300; sc.right = 300; sc.top = 300; sc.bottom = -300; sc.far = 1000; scene.add(sun);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshStandardMaterial({ color: '#dccdb0', roughness: .8 })); fl.rotation.x = -Math.PI / 2; fl.position.set(100, -.05, 100); fl.receiveShadow = true; scene.add(fl);
  const gr = new THREE.GridHelper(800, 80, 0x9a8c70, 0xc5b89d); gr.position.set(100, 0, 100); scene.add(gr);
  group = new THREE.Group(); scene.add(group);
  controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = false; controls.maxPolarAngle = 1.55; controls.addEventListener('change', draw);
  const plane = new THREE.Plane(), hp = new THREE.Vector3();
  const rf = e => { const r = renderer.domElement.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camera); };
  let down = null;
  renderer.domElement.addEventListener('pointerdown', e => {
    rf(e); down = [e.clientX, e.clientY]; const h = ray.intersectObjects(meshes, false)[0]; if (!h) return;
    selI = h.object.userData.i; hl(); ui();
    plane.set(new THREE.Vector3(0, 1, 0), -h.point.y);
    if (ray.ray.intersectPlane(plane, hp)) { drag = { y: h.point.y, p0: hp.clone(), snaps: false, idx: gidx(selI), orig: st.pt.map(q => [q[1], q[3]]) }; controls.enabled = false; renderer.domElement.setPointerCapture(e.pointerId); }
  });
  renderer.domElement.addEventListener('pointermove', e => {
    if (!drag) return; rf(e); plane.set(new THREE.Vector3(0, 1, 0), -drag.y); if (!ray.ray.intersectPlane(plane, hp)) return;
    if (!drag.snaps) { snap(); drag.snaps = true; }
    const dx = hp.x - drag.p0.x, dz = hp.z - drag.p0.z;
    drag.idx.forEach(i => { const b = st.pt[i]; b[1] = r1(drag.orig[i][0] + dx); b[3] = r1(drag.orig[i][1] + dz); });
    rebuild();
  });
  const end = e => {
    const moved = drag && drag.snaps; if (drag) { drag = null; controls.enabled = true; ui(); }
    if (e && e.type === 'pointerup' && down && !moved && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 4) { rf(e); if (!ray.intersectObjects(meshes, false)[0] && selI >= 0) { selI = -1; hl(); ui(); } }
    down = null;
  };
  renderer.domElement.addEventListener('pointerup', end); renderer.domElement.addEventListener('pointercancel', end);
  renderer.domElement.addEventListener('dblclick', e => {   // двойной щелчок: открыть / закрыть дверцу или ящик (по пустому месту — всё)
    rf(e); const h = ray.intersectObjects(meshes, false)[0];
    if (!h) { openAllToggle(); ui(); return; } const bb = st.pt[h.object.userData.i]; if (!bb) return;
    if (bb[0] >= 2 && bb[0] <= 5) openToggle('p' + h.object.userData.i); else if (bb[0] === 6 && bb[7]) openToggle('g' + bb[7]); else openAllToggle(); ui();
  });
  new ResizeObserver(size).observe(host);
}
/* ---- интерфейс ---- */
const num = (id, v, step, lab) => `<label class="p3f">${lab}<span class="stp"><button type="button" data-st="${id}:${-step}">−</button><input type="number" step="any" id="${id}" value="${r1(v)}"><button type="button" data-st="${id}:${step}">+</button></span></label>`;
const inp = (id, v, w, lab) => `${lab} <input type="number" id="${id}" value="${v}" style="width:${w || 58}px">`;
function ui() {
  const e = $('p3Ui'); if (!e) return; const b = selI >= 0 ? st.pt[selI] : null, bb = bbox(), isC = b && b[0] === 1;
  let h = `<div class="shr"><b>Готовые изделия:</b> ${Object.keys(P).map(k => `<button type="button" data-pre="${k}">${P[k].ru}</button>`).join('')}<button type="button" data-act="clear">Очистить</button><button type="button" data-act="undo">↶ Отменить</button></div>`;
  h += `<div class="shr"><b>Шкаф по размерам:</b> ${inp('wcW', 80, 56, 'Ш')} ${inp('wcH', 200, 56, 'В')} ${inp('wcD', 50, 52, 'Г')} ${inp('wcN', 4, 44, 'полок')} ${inp('wcDn', 2, 44, 'дверей')} ${inp('wcDr', 0, 44, 'ящиков')} <button type="button" class="go" data-act="wiz">Собрать шкаф</button></div>`;
  h += `<div class="shr"><b>Добавить деталь:</b> <button type="button" data-add="h">▬ Горизонтальная доска</button><button type="button" data-add="vx">▮ Вертикальная (вдоль X)</button><button type="button" data-add="vz">▮ Вертикальная (вдоль Z)</button><button type="button" data-add="sq">▪ Ножка квадратная</button><button type="button" data-add="cyl">● Ножка круглая</button><button type="button" data-add="bar">▭ Брусок / царга</button></div>`;
  h += `<div class="shr"><b>Дверцы и ящики:</b> <button type="button" data-add="d2">🚪 Дверца (петли слева)</button><button type="button" data-add="d3">🚪 Дверца (петли справа)</button><button type="button" data-add="d4">🚪 Откидная вверх</button><button type="button" data-add="d5">🚪 Откидная вниз</button><button type="button" data-add="dr">🗃 Ящик</button><button type="button" data-act="open">${isOpenAny() ? '↤ Закрыть всё' : '↔ Показать открытыми'}</button></div>`;
  h += `<div class="note">Нажмите деталь в 3D — она выбирается; потяните — переедет по полу (ящик едет целиком). Колесо / правая кнопка — камера. Все размеры можно вписать (шаг 0,1 см = 1 мм). В комнате дверцы и ящики откроются двойным щелчком.</div>`;
  h += `<div class="shr">Деталей: <b>${st.pt.length}</b> · габарит <b>${Math.round((bb.x1 - bb.x0) * 10)}×${Math.round((bb.z1 - bb.z0) * 10)}×${Math.round((bb.y1 - bb.y0) * 10)}</b> мм (Ш×Г×В)</div>`;
  if (b) {
    h += `<div class="shr"><b>Деталь ${selI + 1}:</b> <select id="pK">${KN.map((n, i) => `<option value="${i}" ${b[0] === i ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div class="p3g">${num('pX', b[1], .1, 'X (слева), см')}${num('pZ', b[3], .1, 'Z (вглубь), см')}${num('pY', b[2], .1, 'Y (от пола), см')}${num('pW', b[4], .1, isC ? 'Диаметр, см' : 'Ширина X, см')}${num('pH', b[5], .1, 'Высота, см')}${isC ? '' : num('pD', b[6], .1, 'Глубина Z, см')}</div>`;
    if (b[0] <= 1) h += `<div class="shr"><b>Поворот, °:</b></div><div class="p3g">${num('pRY', b[8] || 0, 5, 'По горизонтали (вокруг вертикали)')}${num('pRX', b[9] || 0, 5, 'По вертикали: наклон вперёд / назад')}${num('pRZ', b[10] || 0, 5, 'По вертикали: наклон влево / вправо')}</div><div class="shr"><button type="button" data-rot="8:-90">↺ 90° гор.</button><button type="button" data-rot="8:90">↻ 90° гор.</button><button type="button" data-rot="8:-45">↺ 45°</button><button type="button" data-rot="8:45">↻ 45°</button><button type="button" data-rot="9:90">⤴ 90° верт.</button><button type="button" data-rot="all:0">Сбросить поворот</button></div>`;
    if (b[0] >= 2 && b[0] <= 5) h += `<div class="shr"><button type="button" data-act="fit">⤢ Подогнать дверцу под корпус</button></div>`;
    h += `<div class="shr"><b>Материал детали:</b> <button type="button" class="${b[11] === 'glass' ? 'on' : ''}" data-act="pglass">🪟 Стекло</button><button type="button" class="${b[11] === 'mirror' ? 'on' : ''}" data-act="pmirror">🪞 Зеркало</button></div>`;
    h += `<div class="shr"><b>Цвет детали:</b> <button type="button" data-act="pcat">🎨 ${b[11] && window.KCCAT ? window.KCCAT.name(b[11]) : 'как у изделия'}</button>${b[11] ? '<button type="button" data-act="pcatx">✕</button>' : ''}<button type="button" data-act="pcatall">Всем деталям этот цвет</button></div>`;
    h += `<div class="shr"><button type="button" data-n="-1,0">◀ 1 см</button><button type="button" data-n="1,0">1 см ▶</button><button type="button" data-n="0,-1">▲ 1 см</button><button type="button" data-n="0,1">▼ 1 см</button><button type="button" data-act="mx">⇋ Копия зеркально слева-направо</button><button type="button" data-act="mz">⇵ Копия зеркально вперёд-назад</button><button type="button" data-act="dup">⧉ Копия</button><button type="button" data-act="del">🗑 Удалить</button></div>`;
  }
  h += `<div class="shr"><b>Подсветка:</b> <select id="p3Led">${LED_MODES.map(([k, n]) => `<option value="${k}" ${(st.led | 0) === k ? 'selected' : ''}>${n}</option>`).join('')}</select><span class="hint"> светодиодная лента 12 В — попадает в спецификацию и цену</span></div>`;
  h += `<div class="shr">Материал <select id="p3Mat">${MATS.map(([k, n]) => `<option value="${k}" ${st.mat === k ? 'selected' : ''}>${n}</option>`).join('')}</select> Цвет <input type="color" id="p3Col" value="${st.color || '#d8bd8a'}"><button type="button" data-act="cat">🎨 ${st.cat && window.KCCAT ? window.KCCAT.name(st.cat) : 'Из каталога'}</button>${st.cat || st.color ? '<button type="button" data-act="nocol">✕</button>' : ''}</div>`;
  h += `<div class="shr"><input type="text" id="p3Name" placeholder="Название (например «Шкаф 80×200»)" value="${String(st.name || '').replace(/"/g, '&quot;')}" style="min-width:220px"><button type="button" class="go" data-act="apply">${st.id ? '💾 Сохранить изменения в комнате' : '➕ Добавить в комнату'}</button><button type="button" data-act="save">💾 В мои изделия</button>${st.id ? '<button type="button" data-act="new">Это новое изделие</button>' : ''}</div>`;
  e.innerHTML = h;
}
function payload() {
  const bb = bbox(), pt = st.pt.map(b => [b[0], r1(b[1] - bb.x0), r1(b[2] - bb.y0), r1(b[3] - bb.z0), r1(b[4]), r1(b[5]), r1(b[6]), b[7] || 0, b[8] || 0, b[9] || 0, b[10] || 0, b[11] || 0]);
  return { kind: 'parts', pt, w: r1(bb.x1 - bb.x0), d: r1(bb.z1 - bb.z0), h: r1(bb.y1 - bb.y0), y: r1(bb.y0), mat: st.mat, color: st.color, cat: st.cat || undefined, led: st.led | 0, n: 0, dn: 0, back: false, handles: true, fill: 'dsp' };
}
const msg = t => { const m = $('p3Msg'); if (m) { m.textContent = t; setTimeout(() => { if (m.textContent === t) m.textContent = ''; }, 3500); } };
function addPart(kind) {
  snap(); const t = T(), bb = bbox(), has = st.pt.length, x = has ? r1(bb.x0) : 0, z = has ? r1(bb.z0) : 0, y = 0, fz = has ? r1(bb.z1 - t) : 0;
  if (kind === 'dr') { const g = Math.max(0, ...st.pt.map(b => b[7] || 0)) + 1; drawerP(has ? r1(bb.x0 + t + .2) : 0, has ? r1(bb.y0 + t) : 0, has ? 1 : 0, 50, 15, 45, t, g).forEach(b => st.pt.push(b)); selI = st.pt.length - 5; rebuild(); ui(); return; }
  const P0 = { h: [0, x, y, z, 60, t, 40, 0], vx: [0, x, y, z, 40, 60, t, 0], vz: [0, x, y, z, t, 60, 40, 0], sq: [0, x, y, z, 6, 70, 6, 0], cyl: [1, x, y, z, 6, 70, 6, 0], bar: [0, x, y, z, 60, 8, t, 0], d2: [2, x, y, fz, 40, 70, t, 0], d3: [3, x, y, fz, 40, 70, t, 0], d4: [4, x, y, fz, 60, 40, t, 0], d5: [5, x, y, fz, 60, 40, t, 0] }[kind];
  if ((kind === 'd2' || kind === 'd3') && has > 4) {   // дверца по размеру корпуса: на правую/левую половину проёма
    const iw = bb.x1 - bb.x0 - 2 * t, dw = r1(iw / 2 - .3); P0[4] = dw; P0[5] = r1(bb.y1 - bb.y0 - 2 * t - .4); P0[1] = kind === 'd2' ? r1(bb.x0 + t + .2) : r1(bb.x1 - t - .2 - dw); P0[2] = r1(bb.y0 + t + .2); P0[3] = r1(bb.z1 - t);
  }
  st.pt.push(P0); selI = st.pt.length - 1; rebuild(); ui();
}
function fitDoor(i) {   // «Подогнать дверцу»: на весь проём корпуса (если рядом ещё одна дверца — на половину)
  const b = st.pt[i], t = T(), rest = st.pt.filter((q, k) => k !== i && !(q[0] >= 2 && q[0] <= 6)), bb = rest.length ? (() => { const A = rest.map(ptAabb); return { x0: Math.min(...A.map(v => v[0])), x1: Math.max(...A.map(v => v[3])), y0: Math.min(...A.map(v => v[1])), y1: Math.max(...A.map(v => v[4])), z1: Math.max(...A.map(v => v[5])) }; })() : null;
  if (!bb) { msg('Подгонять не под что: сначала добавьте корпус'); return; } snap();
  const iw = bb.x1 - bb.x0 - 2 * t, two = st.pt.some((q, k) => k !== i && q[0] >= 2 && q[0] <= 3), dw = r1(two ? iw / 2 - .3 : iw - .4);
  b[4] = dw; b[5] = r1(bb.y1 - bb.y0 - 2 * t - .4); b[2] = r1(bb.y0 + t + .2); b[3] = r1(bb.z1 - t);
  b[1] = b[0] === 3 ? r1(bb.x1 - t - .2 - dw) : r1(bb.x0 + t + .2); rebuild(); ui();
}
function bind() {
  if (bound) return; const root = $('p3Box'); if (!root) return; bound = true;
  root.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.pre) { snap(); st.pt = P[b.dataset.pre].f(T()).map(pad); selI = -1; rebuild(); frame(); ui(); return; }
    if (b.dataset.add) { addPart(b.dataset.add); return; }
    if (b.dataset.st) { const [id, d] = b.dataset.st.split(':'), el = $(id); if (el) { el.value = r1(parseFloat(el.value || 0) + parseFloat(d)); el.dispatchEvent(new Event('change', { bubbles: true })); } return; }
    if (b.dataset.rot && selI >= 0) { snap(); const [k, d] = b.dataset.rot.split(':'), p = st.pt[selI]; if (k === 'all') { p[8] = p[9] = p[10] = 0; } else p[+k] = r1((((p[+k] || 0) + +d) % 360 + 540) % 360 - 180); rebuild(); ui(); return; }
    if (b.dataset.n && selI >= 0) { snap(); const [dx, dz] = b.dataset.n.split(',').map(Number); gidx(selI).forEach(i => { const p = st.pt[i]; p[1] = r1(p[1] + dx); p[3] = r1(p[3] + dz); }); rebuild(); ui(); return; }
    const a = b.dataset.act, p = selI >= 0 ? st.pt[selI] : null;
    if (a === 'clear') { snap(); st.pt = []; selI = -1; rebuild(); ui(); }
    else if (a === 'undo') { if (hist.length) { st.pt = JSON.parse(hist.pop()); selI = -1; rebuild(); ui(); } }
    else if (a === 'open') { openAllToggle(); ui(); }
    else if (a === 'fit' && p && p[0] >= 2 && p[0] <= 5) fitDoor(selI);
    else if (a === 'wiz') { const g = id => parseFloat($(id).value) || 0; snap(); st.pt = cabinetP(Math.max(20, g('wcW')), Math.max(20, g('wcH')), Math.max(15, g('wcD')), Math.max(0, Math.round(g('wcN'))), Math.max(0, Math.min(2, Math.round(g('wcDn')))), Math.max(0, Math.min(8, Math.round(g('wcDr')))), T()); selI = -1; rebuild(); frame(); ui(); }
    else if (a === 'del' && p) { snap(); gidx(selI).sort((x, y) => y - x).forEach(i => st.pt.splice(i, 1)); selI = -1; rebuild(); ui(); }
    else if (a === 'dup' && p) { snap(); const ids = gidx(selI), ng = (p[0] === 6 && p[7]) ? nextG() : 0, first = st.pt.length; ids.forEach(i => st.pt.push(st.pt[i].map((v, k) => (k === 1 || k === 3 ? r1(v + 5) : (k === 7 ? (ng || 0) : v))))); selI = first; rebuild(); ui(); }
    else if (a === 'mx' && p) { snap(); const bb = bbox(), ids = gidx(selI), ng = (p[0] === 6 && p[7]) ? nextG() : 0, first = st.pt.length; ids.forEach(j => { const q = st.pt[j]; st.pt.push(q.map((v, i) => (i === 1 ? r1(bb.x0 + bb.x1 - q[1] - q[4]) : (i === 7 ? (ng || 0) : (i === 8 || i === 10 ? -(v || 0) : (i === 0 && (q[0] === 2 || q[0] === 3) ? (q[0] === 2 ? 3 : 2) : v)))))); }); selI = first; rebuild(); ui(); }
    else if (a === 'mz' && p) { snap(); const bb = bbox(), ids = gidx(selI), ng = (p[0] === 6 && p[7]) ? nextG() : 0, first = st.pt.length; ids.forEach(j => { const q = st.pt[j]; st.pt.push(q.map((v, i) => (i === 3 ? r1(bb.z0 + bb.z1 - q[3] - q[6]) : (i === 7 ? (ng || 0) : (i === 8 || i === 9 ? -(v || 0) : v))))); }); selI = first; rebuild(); ui(); }
    else if ((a === 'pglass' || a === 'pmirror') && p) { snap(); const v = a === 'pglass' ? 'glass' : 'mirror'; p[11] = p[11] === v ? 0 : v; rebuild(); ui(); }
    else if (a === 'cat') { if (window.KCCAT) window.KCCAT.pick(st.cat || '', id => { st.cat = id || ''; rebuild(); ui(); }); }
    else if (a === 'pcat' && p) { if (window.KCCAT) window.KCCAT.pick(p[11] || '', id => { snap(); p[11] = id || 0; rebuild(); ui(); }); }
    else if (a === 'pcatx' && p) { snap(); p[11] = 0; rebuild(); ui(); }
    else if (a === 'pcatall' && p) { snap(); st.pt.forEach(q => { q[11] = p[11] || 0; }); rebuild(); ui(); }
    else if (a === 'nocol') { st.cat = ''; st.color = ''; rebuild(); ui(); }
    else if (a === 'new') { st.id = null; ui(); }
    else if (a === 'apply') { if (!st.pt.length) return; if (window.PRO && window.PRO.shapeApply) { window.PRO.shapeApply(payload(), st.id); msg('✔ Готово — изделие стоит в комнате'); if ($('p3Box').classList.contains('p3full')) { setFull(false); const t = $('p3dBox') || $('k3dBox'); if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150); } } }
    else if (a === 'save') { if (!st.pt.length || !window.SHAPE) return; const nm = (st.name || '').trim() || 'Изделие'; st.name = window.SHAPE.libAdd(Object.assign(payload(), { id: null }), nm); ui(); msg('✔ Сохранено в «Мои изделия»'); }
  });
  root.addEventListener('change', ev => {
    const t = ev.target, v = parseFloat(String(t.value).replace(',', '.')), p = selI >= 0 ? st.pt[selI] : null;
    if (t.id === 'pK' && p) { snap(); p[0] = +t.value; rebuild(); ui(); return; }
    if (p && /^pR[XYZ]$/.test(t.id) && isFinite(v)) { snap(); p[{ pRY: 8, pRX: 9, pRZ: 10 }[t.id]] = r1(Math.max(-360, Math.min(360, v))); rebuild(); ui(); return; }
    if (p && /^p[XZYWHD]$/.test(t.id) && isFinite(v)) { snap(); const k = { pX: 1, pY: 2, pZ: 3, pW: 4, pH: 5, pD: 6 }[t.id]; if (k <= 3) { const dl = r1(v) - p[k]; gidx(selI).forEach(i => { st.pt[i][k] = r1(st.pt[i][k] + dl); }); } else { p[k] = r1(Math.max(.1, v)); if (p[0] === 1 && k === 4) p[6] = p[4]; } rebuild(); ui(); return; }
    if (t.id === 'p3Led') { st.led = +t.value | 0; rebuild(); ui(); return; }
    if (t.id === 'p3Mat') { st.mat = t.value; rebuild(); } else if (t.id === 'p3Col') { st.color = t.value; st.cat = ''; rebuild(); } else if (t.id === 'p3Name') st.name = t.value;
  });
}
function start() { if (alive) return; alive = true; if (!scene) init3d(); size(); rebuild(); frame(); loop(); }
function setFull(on) {
  const b = $('p3Box'); if (!b) return; b.classList.toggle('p3full', !!on); const bt = $('p3FullBtn'); if (bt) bt.textContent = on ? '✕ Свернуть' : '⛶ На весь экран';
  document.body.style.overflow = on ? 'hidden' : ''; setTimeout(() => { size(); draw(); }, 60); if (on) setTimeout(() => { size(); frame(); }, 120);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('p3Box') && $('p3Box').classList.contains('p3full')) setFull(false); });
window.PART3D = {
  dbg() { return { n: st.pt.length, pt: JSON.parse(JSON.stringify(st.pt)), sel: selI, anims: anims.map(a => a.key), amt: [...openAmt.entries()], tgt: [...openT.entries()], strips: ledStrips({ kind: 'parts', led: st.led, pt: st.pt }).length, meshes: meshes.length, payload: payload() }; },
  sel(i) { selI = i; hl(); ui(); },
  toggleFull() { const b = $('p3Box'); if (!b) return; if (b.style.display === 'none') b.style.display = ''; bind(); start(); setFull(!b.classList.contains('p3full')); },
  show() { const b = $('p3Box'); if (!b) return; bind(); start(); ui(); },
  open(o) {
    st = fromObj(o); selI = -1; hist = []; const b = $('p3Box'); if (!b) return; b.style.display = '';
    bind(); start(); rebuild(); frame(); ui(); setFull(true);
  }
};
st = fromObj(null);
if ($('p3Box')) { bind(); ui(); if ($('p3Box').style.display !== 'none') start(); }
