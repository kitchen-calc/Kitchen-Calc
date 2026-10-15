// Kitchen Calc Studio — 3D-редактор корпусной мебели.
// Всё в миллиметрах. Деталь — прямоугольная плита по осям: размеры w (X, ширина), h (Y, высота), d (Z, глубина),
// положение x, y, z — её левый-нижний-задний угол. Ось X — вдоль задней стены, Y — вверх от пола, Z — от стены к нам.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { HW_TYPES, HW_CATEGORIES, FIELDS as HW_FIELDS, newHardware, checkTarget, conflict, movingIds, steps as hwSteps, poseMatrix, visuals as hwVisuals, drillOps as hwDrillOps, describeHw, hardwareCount, hasAction, actionLabels, placeBetween } from './hardware.js';
import { moduleSVG, overviewSVG } from './drawings.js';
import { panelGeometry, describeOp, drawingSVG, frame, fromName, HOLE_PRESETS, CUT_PRESETS, HINGES, CORNER_SHAPES } from './machining.js';

// ---------------------------------------------------------------- справочники
const DEFAULT_MATERIALS = [
  { id: 'w16', name: 'ЛДСП Белый', color: '#f1f0eb', t: 16 },
  { id: 'grey16', name: 'ЛДСП Серый', color: '#b8b6b1', t: 16 },
  { id: 'sonoma16', name: 'ЛДСП Дуб сонома', color: '#cdb084', t: 16 },
  { id: 'walnut16', name: 'ЛДСП Элегантный орех', color: '#7b5637', t: 16 },
  { id: 'graphite16', name: 'ЛДСП Графит', color: '#4b4b4d', t: 16 },
  { id: 'cashmere18', name: 'ЛМДФ Кашемир', color: '#d8c9b4', t: 18 },
  { id: 'olive18', name: 'ЛМДФ Олива', color: '#8c8a6a', t: 18 },
  { id: 'acrylw18', name: 'Акрил Белый глянец', color: '#fbfbfa', t: 18 },
  { id: 'acrylb18', name: 'Акрил Светло-бежевый', color: '#e9dcc5', t: 18 },
  { id: 'hdf3', name: 'ХДФ Белый', color: '#ecebe6', t: 3 },
  { id: 'top38', name: 'Столешница Мрамор', color: '#dcd8d0', t: 38 },
];
const KINDS = {
  side: 'Боковина', bottom: 'Дно', top: 'Крыша', rail: 'Царга', shelf: 'Полка', partition: 'Перегородка',
  back: 'Задняя стенка', door: 'Фасад', drawerFront: 'Фасад ящика', drawer: 'Деталь ящика', plinth: 'Цоколь',
  countertop: 'Столешница', panel: 'Деталь',
};
const PRESETS = {
  lower: { label: 'Нижний кухонный', W: 600, H: 720, D: 560, plinth: 100, baseY: 0, topType: 'rails', shelves: 1, doors: 2, drawers: 0 },
  drawers: { label: 'Нижний с ящиками', W: 600, H: 720, D: 560, plinth: 100, baseY: 0, topType: 'rails', shelves: 0, doors: 0, drawers: 3 },
  upper: { label: 'Верхний кухонный', W: 600, H: 720, D: 300, plinth: 0, baseY: 1400, topType: 'solid', shelves: 2, doors: 2, drawers: 0 },
  tall: { label: 'Пенал', W: 600, H: 2100, D: 560, plinth: 100, baseY: 0, topType: 'solid', shelves: 4, doors: 1, drawers: 0 },
  wardrobe: { label: 'Шкаф', W: 1000, H: 2300, D: 580, plinth: 60, baseY: 0, topType: 'solid', shelves: 4, doors: 2, drawers: 0 },
  open: { label: 'Открытый стеллаж', W: 800, H: 1800, D: 350, plinth: 0, baseY: 0, topType: 'solid', shelves: 4, doors: 0, drawers: 0 },
};
const SHEET = { w: 2800, h: 2070 };
// Типы модулей: что это за изделие — видно в списке, свойствах и на чертежах
const KIND_NAMES = { cabinet: 'Шкаф', base: 'Тумба нижняя', wall: 'Шкаф навесной', tall: 'Пенал', drawers: 'Тумба с ящиками', wardrobe: 'Шкаф-купе / гардероб',
  rack: 'Стеллаж', shelf: 'Полка', chest: 'Комод', drawer: 'Ящик', nightstand: 'Тумба прикроватная', tv: 'ТВ-тумба', table: 'Стол', desk: 'Письменный стол',
  bed: 'Кровать', hall: 'Прихожая', kitchen: 'Кухня (набор)', island: 'Остров', bench: 'Скамья / пуф', other: 'Другое' };
const PRESET_KIND = { lower: 'base', drawers: 'drawers', upper: 'wall', tall: 'tall', wardrobe: 'wardrobe', open: 'rack' };  // стандартный лист ЛДСП, мм
const AUTOSAVE_KEY = 'kcs-autosave-v1';

// ---------------------------------------------------------------- проект и история
let P = newProject();
let filePath = null;
let dirty = false;
const sel = new Set();       // id выбранных деталей
let openGroup = 0;           // модуль, «внутри» которого выбираем отдельные детали (двойной клик)
const undoStack = [], redoStack = [];

function newProject() {
  return { app: 'kitchen-calc-studio', version: 1, name: 'Новый проект', room: { w: 3600, d: 3000, h: 2700 },
    materials: DEFAULT_MATERIALS.map(m => ({ ...m })), items: [], groups: [], hw: [], seq: 1 };
}
const nid = () => P.seq++;
const mat = id => P.materials.find(m => m.id === id) || P.materials[0];
const item = id => P.items.find(i => i.id === id);
const group = id => P.groups.find(g => g.id === id);
const selItems = () => P.items.filter(i => sel.has(i.id));
const groupItems = g => P.items.filter(i => i.g === g);

function snapshot() { return JSON.stringify({ name: P.name, room: P.room, materials: P.materials, items: P.items, groups: P.groups, hw: P.hw, seq: P.seq }); }
function restore(s) { Object.assign(P, JSON.parse(s)); }
function commit(fn) {
  undoStack.push(snapshot()); if (undoStack.length > 200) undoStack.shift();
  redoStack.length = 0;
  fn();
  afterChange();
}
function undo() {
  if (!undoStack.length) return status('Нечего отменять');
  redoStack.push(snapshot()); restore(undoStack.pop()); pruneSel(); afterChange();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot()); restore(redoStack.pop()); pruneSel(); afterChange();
}
function pruneSel() { for (const id of [...sel]) if (!item(id)) sel.delete(id); if (openGroup && !group(openGroup)) openGroup = 0; }
function afterChange() { P.groups = P.groups.filter(g => P.items.some(i => i.g === g.id)); P.hw = (P.hw || []).filter(h => item(h.target)); pruneSel(); rebuild(); refreshUI(); setDirty(true); autosave(); }

// ---------------------------------------------------------------- 3D-сцена
const vp = document.getElementById('viewport');
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); }
catch (err) {
  window.kcsFail('не удалось включить 3D (WebGL). Обновите драйвер видеокарты или перезагрузите компьютер.\n' + err.message);
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
vp.appendChild(renderer.domElement);
const labels = new CSS2DRenderer();
Object.assign(labels.domElement.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' });
vp.appendChild(labels.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#e7e3dc');
scene.add(new THREE.HemisphereLight(0xffffff, 0x8f877b, 1.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(2500, 5000, 4000); scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-3000, 2000, -1000); scene.add(fill);

const persp = new THREE.PerspectiveCamera(40, 1, 10, 200000);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -200000, 200000);
let camera = persp, viewMode = '3d';
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.addEventListener('change', requestRender);

const roomGroup = new THREE.Group(); scene.add(roomGroup);
const itemsGroup = new THREE.Group(); scene.add(itemsGroup);
const dimGroup = new THREE.Group(); scene.add(dimGroup);

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const edgeGeo = new THREE.EdgesGeometry(boxGeo);
const edgeMat = new THREE.LineBasicMaterial({ color: 0x3a342b });
const edgeSelMat = new THREE.LineBasicMaterial({ color: 0xd9850f });
const matCache = new Map();
function surface(color, selected) {
  const k = color + (selected ? '*' : '');
  if (!matCache.has(k)) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    if (selected) { m.emissive = new THREE.Color(0xd9850f); m.emissiveIntensity = 0.28; }
    matCache.set(k, m);
  }
  return matCache.get(k);
}

let renderQueued = false;
function requestRender() { if (!renderQueued) { renderQueued = true; requestAnimationFrame(render); } }
function render() { renderQueued = false; renderer.render(scene, camera); labels.render(scene, camera); }

function resize() {
  const w = vp.clientWidth, h = vp.clientHeight;
  renderer.setSize(w, h); labels.setSize(w, h);
  persp.aspect = w / h; persp.updateProjectionMatrix();
  const half = (ortho.top - ortho.bottom) / 2 || 1500;
  ortho.left = -half * w / h; ortho.right = half * w / h; ortho.top = half; ortho.bottom = -half; ortho.updateProjectionMatrix();
  requestRender();
}
new ResizeObserver(resize).observe(vp);

// Комната: пол с сеткой 100 мм и две стены (задняя и левая)
function buildRoom() {
  roomGroup.clear();
  const { w, d, h } = P.room;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color: 0xd3ccc0, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(w / 2, -0.5, d / 2); roomGroup.add(floor);
  const pts = [];
  for (let x = 0; x <= w; x += 100) pts.push(x, 0, 0, x, 0, d);
  for (let z = 0; z <= d; z += 100) pts.push(0, 0, z, w, 0, z);
  const gridGeo = new THREE.BufferGeometry(); gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  roomGroup.add(new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({ color: 0xb9b09f, transparent: true, opacity: 0.6 })));
  const walls = new THREE.Group(); walls.name = 'walls';
  const wm = new THREE.MeshStandardMaterial({ color: 0xf3f0ea, roughness: 1, side: THREE.DoubleSide });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wm); back.position.set(w / 2, h / 2, -0.5); walls.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wm); left.rotation.y = Math.PI / 2; left.position.set(-0.5, h / 2, d / 2); walls.add(left);
  walls.visible = document.getElementById('showRoom').checked;
  roomGroup.add(walls);
}

function rebuild() {
  itemsGroup.clear();
  for (const it of P.items) {
    const selected = sel.has(it.id);
    const machined = panelGeometry(it);  // деталь с отверстиями и вырезами — своя геометрия, иначе единичный бокс
    const mesh = new THREE.Mesh(machined ? machined.geo : boxGeo, surface(mat(it.mat).color, selected));
    if (!machined) mesh.scale.set(Math.max(it.w, 0.5), Math.max(it.h, 0.5), Math.max(it.d, 0.5));
    mesh.position.set(it.x + it.w / 2, it.y + it.h / 2, it.z + it.d / 2);
    mesh.userData.id = it.id;
    mesh.add(new THREE.LineSegments(machined ? machined.edges : edgeGeo, selected ? edgeSelMat : edgeMat));
    itemsGroup.add(mesh);
  }
  buildHardware();
  updateGizmo(); updateDims(); requestRender();
}

// ---------------------------------------------------------------- фурнитура: вид и действия (открыть / выдвинуть / поднять)
const hwGroup = new THREE.Group(); scene.add(hwGroup);
const hwState = new Map();          // id фурнитуры → { t: 0…1 сейчас, to: куда едем }
let moverByItem = new Map();        // id детали → фурнитура, которая её двигает
const hwOf = id => P.hw.filter(h => h.target === id);
const hwT = id => (hwState.get(id) || { t: 0 }).t;
function buildHardware() {
  hwGroup.clear();
  moverByItem = new Map();
  for (const hw of P.hw) for (const id of movingIds(hw, P.items)) if (!moverByItem.has(id)) moverByItem.set(id, hw);
  for (const hw of P.hw) {
    const it = item(hw.target); if (!it) continue;
    for (const v of hwVisuals(hw, it, P.items, hwOf(it.id))) {
      const o = v.obj;
      o.userData = { ...o.userData, hw: hw.id, mode: v.mode, factor: v.factor || 1, fixed: v.fixed, onPart: v.onPart, role: v.role };
      if (v.mode === 'attach' || v.mode === 'self') { o.updateMatrix(); o.userData.base = o.matrix.clone(); o.matrixAutoUpdate = false; }
      if (v.mode === 'light') o.material = o.material.clone();
      hwGroup.add(o);
    }
  }
  applyPoses();
}
const _M = new THREE.Matrix4(), _I = new THREE.Matrix4();
function itemPose(id, out) {
  const hw = moverByItem.get(id);
  if (!hw || !hwT(hw.id)) return null;
  return poseMatrix(hwSteps(hw, item(hw.target), P.items), hwT(hw.id), out);
}
function applyPoses() {
  for (const m of itemsGroup.children) {
    const M = itemPose(m.userData.id, _M);
    if (!M) { if (!m.matrixAutoUpdate) { m.matrixAutoUpdate = true; m.updateMatrix(); } continue; }
    m.updateMatrix(); m.matrix.premultiply(M); m.matrixAutoUpdate = false; m.matrixWorldNeedsUpdate = true;
  }
  for (const o of hwGroup.children) {
    const u = o.userData, hw = P.hw.find(h => h.id === u.hw); if (!hw) continue;
    if (u.mode === 'attach') {
      const M = itemPose(hw.target, _M) || _I.identity();
      o.matrix.copy(u.base).premultiply(M); o.matrixWorldNeedsUpdate = true;
    } else if (u.mode === 'self') {
      const M = poseMatrix(hwSteps(hw, item(hw.target), P.items), hwT(hw.id) * u.factor, _M);
      o.matrix.copy(u.base).premultiply(M); o.matrixWorldNeedsUpdate = true;
    } else if (u.mode === 'strut') {
      // газлифт: корпус закреплён в неподвижной точке, шток упирается в деталь и выдвигается при открывании
      const M = itemPose(hw.target, _M) || _I.identity();
      const q = u.onPart.clone().applyMatrix4(M), closedLen = u.fixed.distanceTo(u.onPart), dir = q.clone().sub(u.fixed).normalize();
      if (u.role === 'body') placeBetween(o, u.fixed, u.fixed.clone().addScaledVector(dir, closedLen * 0.62));
      else placeBetween(o, u.fixed.clone().addScaledVector(dir, closedLen * 0.5), q);
    } else if (u.mode === 'light') {
      const on = hwT(hw.id) > 0.5;
      o.material.emissive.setHex(on ? o.userData.color : 0x000000); o.material.emissiveIntensity = on ? 1.4 : 0;
    }
  }
  requestRender();
}
let animating = false;
function animateHw() {
  let busy = false;
  for (const st of hwState.values()) {
    if (st.t === st.to) continue;
    st.t = st.to > st.t ? Math.min(st.to, st.t + 1 / 40) : Math.max(st.to, st.t - 1 / 40);
    busy = true;
  }
  applyPoses();
  if (busy) requestAnimationFrame(animateHw); else animating = false;
}
function setHw(ids, to) {
  for (const id of ids) { const st = hwState.get(id) || { t: 0, to: 0 }; st.to = to; hwState.set(id, st); }
  if (!animating) { animating = true; requestAnimationFrame(animateHw); }
}
function toggleHw(ids) {
  ids = ids.filter(id => { const h = P.hw.find(x => x.id === id); return h && hasAction(h.type); });
  if (!ids.length) return status('Здесь нет фурнитуры с действием');
  const anyClosed = ids.some(id => (hwState.get(id) || { to: 0 }).to < 1);
  setHw(ids, anyClosed ? 1 : 0);
}
function closeAllHw() { for (const st of hwState.values()) { st.t = 0; st.to = 0; } applyPoses(); }

// ---------------------------------------------------------------- габариты и размеры на экране
function bbox(list) {
  if (!list.length) return null;
  const b = { x0: Infinity, y0: Infinity, z0: Infinity, x1: -Infinity, y1: -Infinity, z1: -Infinity };
  for (const i of list) {
    b.x0 = Math.min(b.x0, i.x); b.y0 = Math.min(b.y0, i.y); b.z0 = Math.min(b.z0, i.z);
    b.x1 = Math.max(b.x1, i.x + i.w); b.y1 = Math.max(b.y1, i.y + i.h); b.z1 = Math.max(b.z1, i.z + i.d);
  }
  return b;
}
const r1 = v => Math.round(v * 10) / 10;
const fmt = v => String(r1(v)).replace('.', ',');

const dimLineMat = new THREE.LineBasicMaterial({ color: 0xd9850f, depthTest: false });
const dimLabels = ['w', 'h', 'd'].map(() => {
  const el = document.createElement('div'); el.className = 'dimlabel';
  const o = new CSS2DObject(el); scene.add(o); return o;
});
function updateDims() {
  dimGroup.clear();
  const list = sel.size ? selItems() : P.items;
  const b = bbox(list);
  const show = document.getElementById('showDims').checked && b;
  dimLabels.forEach(l => { l.visible = !!show; });
  if (!show) return requestRender();
  const o = 40;  // отступ размерной линии от изделия
  const seg = [
    [[b.x0, b.y0, b.z1 + o], [b.x1, b.y0, b.z1 + o]],   // ширина — снизу спереди
    [[b.x0 - o, b.y0, b.z1], [b.x0 - o, b.y1, b.z1]],   // высота — слева спереди
    [[b.x1 + o, b.y0, b.z0], [b.x1 + o, b.y0, b.z1]],   // глубина — снизу справа
  ];
  const pts = [];
  seg.forEach(([a, c]) => pts.push(new THREE.Vector3(...a), new THREE.Vector3(...c)));
  const line = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), dimLineMat);
  line.renderOrder = 10; dimGroup.add(line);
  const vals = [b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0];
  dimLabels.forEach((l, k) => {
    const [a, c] = seg[k];
    l.position.set((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2);
    l.element.textContent = fmt(vals[k]);
  });
  requestRender();
}

// ---------------------------------------------------------------- камера и виды
function sceneBox() {
  const b = bbox(P.items);
  return b || { x0: 0, y0: 0, z0: 0, x1: P.room.w, y1: Math.min(P.room.h, 2400), z1: Math.min(P.room.d, 1200) };
}
function setView(mode) {
  viewMode = mode;
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === mode));
  camera = mode === '3d' ? persp : ortho;
  orbit.object = camera;
  tc.camera = camera;
  orbit.enableRotate = mode === '3d';
  orbit.mouseButtons = mode === '3d'
    ? { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }
    : { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  fit();
}
function fit() {
  const b = sel.size ? bbox(selItems()) : sceneBox();
  const c = new THREE.Vector3((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2);
  const size = Math.max(b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0, 600);
  orbit.target.copy(c);
  if (viewMode === '3d') {
    const dist = size * 1.9;
    persp.position.set(c.x + dist * 0.55, c.y + dist * 0.45, c.z + dist * 0.95);
  } else {
    const far = 20000;
    if (viewMode === 'front') { ortho.position.set(c.x, c.y, c.z + far); ortho.up.set(0, 1, 0); }
    if (viewMode === 'top') { ortho.position.set(c.x, c.y + far, c.z + 0.001); ortho.up.set(0, 0, -1); }
    if (viewMode === 'left') { ortho.position.set(c.x - far, c.y, c.z); ortho.up.set(0, 1, 0); }
    const w = vp.clientWidth, h = vp.clientHeight, half = 1500;
    ortho.left = -half * w / h; ortho.right = half * w / h; ortho.top = half; ortho.bottom = -half;
    ortho.zoom = half / (size * 0.65);
    ortho.updateProjectionMatrix();
  }
  camera.lookAt(c);
  orbit.update();
  requestRender();
}

// ---------------------------------------------------------------- перемещение мышкой (стрелки) с шагом и магнитом
const pivot = new THREE.Object3D(); scene.add(pivot);
const tc = new TransformControls(camera, renderer.domElement);
tc.setMode('translate'); tc.setSize(0.85);
scene.add(tc.getHelper());
tc.addEventListener('change', requestRender);
let drag = null;
tc.addEventListener('dragging-changed', e => {
  orbit.enabled = !e.value;
  if (e.value) {
    closeAllHw();
    const list = selItems();
    drag = { snap: snapshot(), start: list.map(i => [i.id, i.x, i.y, i.z]), box: bbox(list), pivot: pivot.position.clone(), moved: false };
  } else if (drag) {
    if (drag.moved) { undoStack.push(drag.snap); redoStack.length = 0; afterChange(); }
    drag = null;
  }
});
tc.addEventListener('objectChange', () => {
  if (!drag) return;
  const b = drag.box, dp = pivot.position.clone().sub(drag.pivot);
  const mins = [b.x0, b.y0, b.z0], sizes = [b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0];
  let delta = [dp.x, dp.y, dp.z].map((v, a) => Math.abs(v) < 1e-6 ? 0 : snapAxis(a, mins[a] + v, sizes[a]) - mins[a]);
  const movers = drag.start.map(([id, x, y, z]) => ({ ...item(id), x, y, z }));
  const cm = clampMove(movers, delta, drag.exclude || (drag.exclude = clashedBefore(movers)));
  delta = cm.d;
  drag.hit = cm.hit;
  drag.moved = delta.some(v => v !== 0);
  for (const [id, x, y, z] of drag.start) {
    const it = item(id); it.x = x + delta[0]; it.y = y + delta[1]; it.z = z + delta[2];
  }
  pivot.position.copy(drag.pivot).add(new THREE.Vector3(...delta));
  for (const m of itemsGroup.children) {
    const it = item(m.userData.id);
    if (sel.has(it.id)) m.position.set(it.x + it.w / 2, it.y + it.h / 2, it.z + it.d / 2);
  }
  updateDims(); refreshInspectorValues();
  const nb = bbox(selItems());
  status(`X ${fmt(nb.x0)}   Y ${fmt(nb.y0)}   Z ${fmt(nb.z0)}` + (drag.hit ? `   · упёрлось в ${who(drag.hit)}` : ''));
});

function gridStep() { return +document.getElementById('gridStep').value || 10; }
function mmPerPixel() {
  const h = vp.clientHeight || 600;
  if (camera === ortho) return (ortho.top - ortho.bottom) / ortho.zoom / h;
  const dist = camera.position.distanceTo(pivot.position);
  return 2 * dist * Math.tan(THREE.MathUtils.degToRad(persp.fov / 2)) / h;
}
// Новое положение (левый край по оси a) с учётом магнита к граням других деталей и стенам, иначе — по шагу сетки
function snapAxis(a, min, size) {
  if (document.getElementById('magnet').checked) {
    const key = ['x', 'y', 'z'][a], dim = ['w', 'h', 'd'][a];
    const thr = mmPerPixel() * 12;
    const cands = [0, [P.room.w, P.room.h, P.room.d][a]];
    for (const it of P.items) if (!sel.has(it.id)) cands.push(it[key], it[key] + it[dim]);
    let best = null, bestDist = thr;
    for (const c of cands) {
      for (const [edge, off] of [[min, 0], [min + size, size]]) {
        const dd = Math.abs(c - edge);
        if (dd < bestDist) { bestDist = dd; best = c - off; }
      }
    }
    if (best !== null) return r1(best);
  }
  const s = gridStep();
  return Math.round(min / s) * s;
}

function updateGizmo() {
  if (measure) { tc.detach(); return; }
  const b = sel.size ? bbox(selItems()) : null;
  if (!b) { tc.detach(); return; }
  if (!drag) pivot.position.set((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2);
  if (tc.object !== pivot) tc.attach(pivot);
}

// ---------------------------------------------------------------- разметка: расстояния от точки под мышкой до краёв детали
let measure = null;      // { tool: 'hole' | 'cut', id, hit }
const measureGroup = new THREE.Group(); scene.add(measureGroup);
const measureLabel = (() => { const el = document.createElement('div'); el.className = 'mlabel'; const o = new CSS2DObject(el); o.center.set(-0.04, 1.08); o.visible = false; scene.add(o); return o; })();
const measureLineMat = new THREE.LineDashedMaterial({ color: 0x1f5fb4, dashSize: 6, gapSize: 4, depthTest: false });
const measureDotMat = new THREE.MeshBasicMaterial({ color: 0xd9770f, depthTest: false });
function startMeasure(tool) {
  const k = kindOfSelection();
  if (k.type !== 'item') return status('Сначала выберите одну деталь (двойной клик по детали внутри модуля)');
  closeAllHw();
  measure = { tool, id: k.it.id, hit: null };
  tc.detach();
  renderer.domElement.style.cursor = 'crosshair';
  status(`Разметка ${tool === 'hole' ? 'отверстия' : 'выреза'}: наведите на деталь — видны расстояния до краёв. Клик — поставить, Esc — выйти. Shift — по шагу ${gridStep()} мм.`);
  document.getElementById('vpHint').textContent = 'Разметка: клик по детали ставит ' + (tool === 'hole' ? 'отверстие' : 'угол выреза') + ' · Esc — выход';
}
function stopMeasure() {
  if (!measure) return;
  measure = null; measureGroup.clear(); measureLabel.visible = false;
  renderer.domElement.style.cursor = '';
  updateGizmo(); refreshUI(); requestRender();
}
// Точка на детали → сторона и координаты в мм (как в окне операции и на чертеже)
function measureAt(e, snap) {
  const it = item(measure.id); if (!it) return null;
  const mesh = itemsGroup.children.find(m => m.userData.id === it.id); if (!mesh) return null;
  const r = renderer.domElement.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const hit = ray.intersectObject(mesh, false)[0];
  if (!hit || !hit.face) return null;
  const fr = frame(it), n = hit.face.normal, ax = ['x', 'y', 'z'].reduce((a, c) => Math.abs(n[c]) > Math.abs(n[a]) ? c : a, 'x');
  const q = v => snap ? Math.round(v / gridStep()) * gridStep() : Math.round(v);
  const local = { x: hit.point.x - it.x, y: hit.point.y - it.y, z: hit.point.z - it.z };
  const clamp = (v, hi) => Math.min(hi, Math.max(0, v));
  if (ax === fr.N) return { it, fr, face: n[ax] > 0 ? 'A' : 'B', u: clamp(q(local[fr.U]), fr.SU), v: clamp(q(local[fr.V]), fr.SV) };
  if (ax === fr.U) return { it, fr, face: n[ax] > 0 ? 'U1' : 'U0', s: clamp(q(local[fr.V]), fr.SV), o: r1(clamp(local[fr.N], fr.T)) };
  return { it, fr, face: n[ax] > 0 ? 'V1' : 'V0', s: clamp(q(local[fr.U]), fr.SU), o: r1(clamp(local[fr.N], fr.T)) };
}
function showMeasure(m) {
  measureGroup.clear();
  if (!m) { measureLabel.visible = false; requestRender(); return; }
  const { it, fr } = m, N = fr.names;
  const world = (u, v, n) => { const o = { [fr.U]: u, [fr.V]: v, [fr.N]: n }; return new THREE.Vector3(it.x + o.x, it.y + o.y, it.z + o.z); };
  const segs = [];
  let p, text;
  if (m.face === 'A' || m.face === 'B') {
    const n = m.face === 'A' ? fr.T : 0;
    p = world(m.u, m.v, n);
    segs.push([world(0, m.v, n), p], [p, world(fr.SU, m.v, n)], [world(m.u, 0, n), p], [p, world(m.u, fr.SV, n)]);
    text = `<b>${N[m.face]}</b><br>${fromName(N.U0)}: <b>${fmt(m.u)}</b> · ${fromName(N.U1)}: <b>${fmt(fr.SU - m.u)}</b><br>${fromName(N.V0)}: <b>${fmt(m.v)}</b> · ${fromName(N.V1)}: <b>${fmt(fr.SV - m.v)}</b>`;
  } else {
    const alongU = m.face[0] === 'V', len = alongU ? fr.SU : fr.SV;
    const at = (s, o) => alongU ? world(s, m.face === 'V0' ? 0 : fr.SV, o) : world(m.face === 'U0' ? 0 : fr.SU, s, o);
    p = at(m.s, m.o);
    segs.push([at(0, m.o), p], [p, at(len, m.o)]);
    const a = alongU ? N.U0 : N.V0, b = alongU ? N.U1 : N.V1;
    text = `<b>${N[m.face]}</b><br>${fromName(a)}: <b>${fmt(m.s)}</b> · ${fromName(b)}: <b>${fmt(len - m.s)}</b><br>${fromName(N.B)}: <b>${fmt(m.o)}</b> (толщина ${fmt(fr.T)})`;
  }
  for (const [a, b] of segs) {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), measureLineMat);
    l.computeLineDistances(); l.renderOrder = 20; measureGroup.add(l);
  }
  const dot = new THREE.Mesh(new THREE.SphereGeometry(mmPerPixelAt(p) * 4, 12, 8), measureDotMat);
  dot.position.copy(p); dot.renderOrder = 21; measureGroup.add(dot);
  measureLabel.position.copy(p); measureLabel.element.innerHTML = text; measureLabel.visible = true;
  requestRender();
}
function mmPerPixelAt(p) {
  const h = vp.clientHeight || 600;
  if (camera === ortho) return (ortho.top - ortho.bottom) / ortho.zoom / h;
  return 2 * camera.position.distanceTo(p) * Math.tan(THREE.MathUtils.degToRad(persp.fov / 2)) / h;
}
renderer.domElement.addEventListener('pointermove', e => {
  if (!measure || e.buttons) return;
  measure.hit = measureAt(e, e.shiftKey);
  showMeasure(measure.hit);
});

// ---------------------------------------------------------------- выбор деталей мышкой
const ray = new THREE.Raycaster();
let down = null;
// Рамка: Ctrl + тянуть (или режим «⬚ Рамка»). Слева направо — детали целиком внутри, справа налево — всё, чего касается.
let boxMode = false, rect = null;
const rectEl = document.createElement('div'); rectEl.className = 'selrect'; rectEl.hidden = true; vp.appendChild(rectEl);
function setBoxMode(on) {
  boxMode = on; document.querySelector('[data-cmd="boxsel"]').classList.toggle('on', on);
  status(on ? 'Рамка: тяните мышью по сцене. Слева направо — детали целиком внутри, справа налево — всё, чего касается. Shift — добавить к выбранному.' : 'Рамка выключена');
}
const _v = new THREE.Vector3();
function screenBox(it) {
  const r = renderer.domElement.getBoundingClientRect(), mesh = itemsGroup.children.find(m => m.userData.id === it.id);
  const M = mesh && !mesh.matrixAutoUpdate ? mesh.matrix.clone().multiply(new THREE.Matrix4().compose(mesh.position, mesh.quaternion, mesh.scale).invert()) : null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const dx of [0, it.w]) for (const dy of [0, it.h]) for (const dz of [0, it.d]) {
    _v.set(it.x + dx, it.y + dy, it.z + dz); if (M) _v.applyMatrix4(M);
    _v.project(camera);
    const sx = r.left + (_v.x + 1) / 2 * r.width, sy = r.top + (1 - _v.y) / 2 * r.height;
    x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
  }
  return { x0, y0, x1, y1 };
}
renderer.domElement.addEventListener('pointerdown', e => {
  if (e.button === 0 && (boxMode || e.ctrlKey) && tc.axis === null && !measure) {
    rect = { x: e.clientX, y: e.clientY, ex: e.clientX, ey: e.clientY };
    orbit.enabled = false;
    renderer.domElement.setPointerCapture(e.pointerId);
  }
});
renderer.domElement.addEventListener('pointermove', e => {
  if (!rect) return;
  rect.ex = e.clientX; rect.ey = e.clientY;
  const r = vp.getBoundingClientRect(), lr = rect.ex >= rect.x;
  Object.assign(rectEl.style, { left: Math.min(rect.x, rect.ex) - r.left + 'px', top: Math.min(rect.y, rect.ey) - r.top + 'px', width: Math.abs(rect.ex - rect.x) + 'px', height: Math.abs(rect.ey - rect.y) + 'px' });
  rectEl.classList.toggle('cross', !lr); rectEl.hidden = false;
});
renderer.domElement.addEventListener('pointerup', e => {
  if (!rect) return;
  const R = { x0: Math.min(rect.x, rect.ex), y0: Math.min(rect.y, rect.ey), x1: Math.max(rect.x, rect.ex), y1: Math.max(rect.y, rect.ey) }, lr = rect.ex >= rect.x;
  rect = null; rectEl.hidden = true; orbit.enabled = true; down = null;
  if (R.x1 - R.x0 < 4 && R.y1 - R.y0 < 4) return;
  if (!e.shiftKey) sel.clear();
  let n = 0;
  for (const it of P.items) {
    const b = screenBox(it);
    const inside = b.x0 >= R.x0 && b.x1 <= R.x1 && b.y0 >= R.y0 && b.y1 <= R.y1;
    const touch = b.x1 >= R.x0 && b.x0 <= R.x1 && b.y1 >= R.y0 && b.y0 <= R.y1;
    if (lr ? inside : touch) { sel.add(it.id); n++; }
  }
  openGroup = 0;
  selectionChanged();
  status(n ? `Выделено деталей: ${sel.size}. «Объединить в модуль» (Ctrl+G) — сделать из них шкаф, полку и т. д.` : 'В рамку ничего не попало');
});
renderer.domElement.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, gizmo: tc.axis !== null, btn: e.button }; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!down || down.gizmo || down.btn !== 0 || drag) { down = null; return; }
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4;
  down = null;
  if (moved) return;
  if (measure) {
    const m = measureAt(e, e.shiftKey);
    if (!m) return;
    const edge = !(m.face === 'A' || m.face === 'B');
    if (measure.tool === 'cut' && edge) return status('Вырез ставится на пласть детали, не на торец');
    opDialog(measure.tool, -1, edge ? { face: m.face, s: m.s, o: m.o, depth: 30 } : { face: m.face, u: m.u, v: m.v });
    return;
  }
  const hit = pick(e);
  if (!hit) { if (!e.shiftKey) { sel.clear(); openGroup = 0; } }
  else {
    const it = item(hit);
    const ids = it.g && it.g !== openGroup ? groupItems(it.g).map(i => i.id) : [it.id];
    if (it.g !== openGroup) openGroup = 0;
    if (e.shiftKey) { const all = ids.every(id => sel.has(id)); ids.forEach(id => all ? sel.delete(id) : sel.add(id)); }
    else { sel.clear(); ids.forEach(id => sel.add(id)); }
  }
  selectionChanged();
});
renderer.domElement.addEventListener('dblclick', e => {
  const hit = pick(e);
  if (!hit) return;
  const it = item(hit);
  openGroup = it.g || 0;
  sel.clear(); sel.add(it.id);
  selectionChanged();
  if (it.g) status(`Модуль «${group(it.g).name}» открыт: выбирайте отдельные детали. Клик мимо — выйти.`);
});
function pick(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const hits = ray.intersectObjects(itemsGroup.children, false);
  return hits.length ? hits[0].object.userData.id : null;
}
function selectionChanged() { if (measure && !sel.has(measure.id)) stopMeasure(); rebuild(); refreshUI(); }

// ---------------------------------------------------------------- команды
// ---------------------------------------------------------------- пересечения: деталь не может войти в другую
// Касаться можно (зазор до 0,5 мм не считается). Пересечения, которые уже были до действия, не мешают — чтобы не «заклинить» проект.
const TOL = 0.5;
const noClash = () => document.getElementById('noClash').checked;
const ov = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0);
const boxOf = i => [i.x, i.y, i.z, i.x + i.w, i.y + i.h, i.z + i.d];
function hits(a, b) { const A = boxOf(a), B = boxOf(b); return ov(A[0], A[3], B[0], B[3]) > TOL && ov(A[1], A[4], B[1], B[4]) > TOL && ov(A[2], A[5], B[2], B[5]) > TOL; }
// Первая деталь, в которую входит одна из cands (exclude — свои детали и те, что уже пересекались)
function clash(cands, exclude) {
  for (const c of cands) for (const o of P.items) if (!exclude.has(o.id) && hits(c, o)) return o;
  return null;
}
function clashedBefore(list) {
  const out = new Set(list.map(i => i.id));
  for (const i of list) for (const o of P.items) if (!out.has(o.id) && hits(i, o)) out.add(o.id);
  return out;
}
// Сдвиг: детали едут, пока не упрутся в соседнюю, и встают вплотную
function clampMove(list, delta, exclude) {
  const d = delta.slice(); let hit = null;
  if (!noClash()) return { d, hit };
  for (let a = 0; a < 3; a++) {
    if (!d[a]) continue;
    for (const s0 of list) {
      const S = boxOf(s0).map((v, k) => v + (k % 3 < a ? d[k % 3] : 0));
      for (const o of P.items) {
        if (exclude.has(o.id)) continue;
        const O = boxOf(o);
        let side = true;
        for (let b = 0; b < 3; b++) if (b !== a && ov(S[b], S[b + 3], O[b], O[b + 3]) <= TOL) side = false;
        if (!side) continue;
        if (d[a] > 0 && O[a] >= S[a + 3] - TOL) { const lim = O[a] - S[a + 3]; if (lim < d[a]) { d[a] = Math.max(0, r1(lim)); hit = o; } }
        else if (d[a] < 0 && O[a + 3] <= S[a] + TOL) { const lim = O[a + 3] - S[a]; if (lim > d[a]) { d[a] = Math.min(0, r1(lim)); hit = o; } }
      }
    }
  }
  return { d, hit };
}
// Наибольший размер детали по оси key (до want), при котором она ни во что не входит
function maxSize(it, key, want) {
  if (!noClash() || want <= it[key]) return { v: want, hit: null };
  const ex = clashedBefore([it]);
  const test = v => clash([{ ...it, [key]: v }], ex);
  const first = test(want);
  if (!first) return { v: want, hit: null };
  let lo = it[key], hi = want;
  for (let n = 0; n < 30 && hi - lo > 0.05; n++) { const m = (lo + hi) / 2; if (test(m)) hi = m; else lo = m; }
  return { v: Math.max(it[key], r1(lo - TOL)), hit: first };   // допуск касания не отдаём в размер
}
const who = o => `«${label(o)}»${o.g && group(o.g) ? ` (${group(o.g).name})` : ''}`;

function addPanel(kind) {
  const m = mat('w16');
  const sizes = { 'panel-h': [600, m.t, 560], 'panel-v': [m.t, 720, 560], 'panel-f': [600, 720, m.t] }[kind];
  const b = sel.size ? bbox(selItems()) : null;
  const it = { id: nid(), name: '', kind: kind === 'panel-f' ? 'panel' : kind === 'panel-v' ? 'side' : 'shelf', mat: m.id,
    w: sizes[0], h: sizes[1], d: sizes[2], x: b ? b.x1 : freeX(0, sizes[1]), y: b ? b.y0 : 0, z: b ? b.z0 : 0, g: 0 };
  if (noClash() && clash([it], new Set())) it.x = freeX(it.y, it.h);
  commit(() => { P.items.push(it); sel.clear(); sel.add(it.id); openGroup = 0; });
  status('Деталь добавлена. Тяните стрелки или введите размеры справа.');
}
// Правый край уже стоящей мебели на этой высоте — чтобы новый модуль встал рядом, а не внутрь
function freeX(y, h) {
  let x = 0;
  for (const i of P.items) if (i.y < y + h && i.y + i.h > y) x = Math.max(x, i.x + i.w);
  return x;
}

function buildCabinet(p, ox, oy, oz, g) {
  const out = [], t = mat(p.mat).t, bt = p.back ? mat('hdf3').t : 0, ft = mat(p.facadeMat).t;
  const ROLES = { 'Боковина левая': 'sideL', 'Боковина правая': 'sideR', 'Дно': 'bottom', 'Крыша': 'top', 'Царга передняя': 'railF', 'Царга задняя': 'railB', 'Полка': 'shelf' };
  const add = (kind, name, x, y, z, w, h, d, m) => out.push({ id: nid(), kind, name, role: ROLES[name] || (kind === 'door' ? 'door' : ''), mat: m || p.mat, x, y, z, w: Math.max(w, 1), h: Math.max(h, 1), d: Math.max(d, 1), g, ops: [] });
  const W = p.W, H = p.H, D = p.D, y0 = oy + p.plinth, cz = oz + bt;
  add('side', 'Боковина левая', ox, y0, cz, t, H, D);
  add('side', 'Боковина правая', ox + W - t, y0, cz, t, H, D);
  add('bottom', 'Дно', ox + t, y0, cz, W - 2 * t, t, D);
  if (p.topType === 'rails') {
    add('rail', 'Царга передняя', ox + t, y0 + H - t, cz + D - 100, W - 2 * t, t, 100);
    add('rail', 'Царга задняя', ox + t, y0 + H - t, cz, W - 2 * t, t, 100);
  } else add('top', 'Крыша', ox + t, y0 + H - t, cz, W - 2 * t, t, D);
  if (p.back) add('back', 'Задняя стенка', ox + 2, y0 + 2, oz, W - 4, H - 4, bt, 'hdf3');
  const n = p.drawers > 0 ? 0 : p.shelves | 0;
  if (n > 0) {
    const inner = H - 2 * t, gap = (inner - n * t) / (n + 1);
    for (let i = 0; i < n; i++) add('shelf', 'Полка', ox + t, r1(y0 + t + gap * (i + 1) + t * i), cz, W - 2 * t, t, D - 20);
  }
  if (p.plinth > 0) add('plinth', 'Цоколь', ox, oy, cz + D - 60, W, p.plinth, t);
  const fz = cz + D;
  if (p.drawers > 0) {
    const k = p.drawers, fh = (H - 4 - (k - 1) * 3) / k;
    const wb = W - 2 * t - 26, db = Math.max(250, Math.floor((D - 30) / 50) * 50);
    for (let i = 0; i < k; i++) {
      const fy = r1(y0 + 2 + i * (fh + 3));
      const first = out.length;
      add('drawerFront', `Фасад ящика ${i + 1}`, ox + 2, fy, fz, W - 4, r1(fh), ft, p.facadeMat);
      const hb = Math.max(60, Math.round(fh - 60)), bx = ox + t + 13, by = fy + 20, bz = fz - db;
      add('drawer', `Ящик ${i + 1}: дно`, bx, by, bz, wb, 3, db, 'hdf3');
      add('drawer', `Ящик ${i + 1}: бок левый`, bx, by + 3, bz, t, hb, db);
      add('drawer', `Ящик ${i + 1}: бок правый`, bx + wb - t, by + 3, bz, t, hb, db);
      add('drawer', `Ящик ${i + 1}: передняя стенка`, bx + t, by + 3, bz + db - t, wb - 2 * t, hb, t);
      add('drawer', `Ящик ${i + 1}: задняя стенка`, bx + t, by + 3, bz, wb - 2 * t, hb, t);
      const link = `L${g}_${i + 1}`;
      out.slice(first).forEach(o => { o.link = link; });
      out[first].role = 'drawerFront';
    }
  } else if (p.doors > 0) {
    const k = p.doors, dw = (W - 4 - (k - 1) * 3) / k;
    for (let i = 0; i < k; i++) add('door', k > 1 ? `Фасад ${i + 1}` : 'Фасад', r1(ox + 2 + i * (dw + 3)), y0 + 2, fz, r1(dw), H - 4, ft, p.facadeMat);
  }
  if (p.drill !== false) drillCabinet(out, p, ['conf', 'shelf', 'hinge']);
  return out;
}

// Автоприсадка корпуса: конфирматы (боковины ↔ дно, крыша, царги), полкодержатели, петли с ответными планками.
// Отверстия помечены tag, чтобы петли можно было заменить, не трогая остальное.
function hingeCount(h, p) { return +p.hinge.count || (h <= 900 ? 2 : h <= 1600 ? 3 : h <= 2000 ? 4 : 5); }
function drillCabinet(parts, p, kinds) {
  const by = role => parts.filter(i => i.role === role);
  const L = by('sideL')[0], R = by('sideR')[0];
  if (!L || !R) return false;
  const t = L.w, D = L.d, y0 = L.y, cz = L.z;
  const push = (it, op) => { (it.ops = it.ops || []).push({ count: 1, step: 32, dir: 'u', ...op }); };
  const along = d => d <= 350 ? [50, d - 50] : [50, Math.round(d / 2), d - 50];
  if (kinds.includes('conf')) {
    for (const part of parts.filter(i => ['bottom', 'top', 'railF', 'railB'].includes(i.role))) {
      const v = r1(part.y - y0 + part.h / 2);
      for (const z of part.role.startsWith('rail') ? [part.d / 2] : along(part.d)) {
        const u = r1(part.z - cz + z);
        for (const side of [L, R]) push(side, { tag: 'conf', type: 'hole', face: 'A', u, v, dia: 5, depth: t, through: true });
        for (const face of ['U0', 'U1']) push(part, { tag: 'conf', type: 'hole', face, s: r1(z), o: r1(part.h / 2), dia: 7, depth: 50 });
      }
    }
  }
  if (kinds.includes('shelf')) {
    for (const sh of by('shelf')) {
      const v = r1(sh.y - y0 - 8);
      for (const z of [37, sh.d - 37]) {
        push(L, { tag: 'shelf', type: 'hole', face: 'A', u: r1(sh.z - cz + z), v, dia: 5, depth: 12 });
        push(R, { tag: 'shelf', type: 'hole', face: 'B', u: r1(sh.z - cz + z), v, dia: 5, depth: 12 });
      }
    }
  }
  if (kinds.includes('hinge') && p.hinge && p.hinge.type !== 'none') {
    const hg = HINGES.find(h => h.id === p.hinge.type) || HINGES[0];
    const doors = by('door').sort((a, b) => a.x - b.x);
    doors.forEach((door, i) => {
      const side = doors.length === 1 ? (p.hinge.side || 'L') : (i < doors.length / 2 ? 'L' : 'R');
      const n = hingeCount(door.h, p), off = Math.min(+p.hinge.off || 100, door.h / 2);
      const vs = n === 1 ? [door.h / 2] : Array.from({ length: n }, (_, k) => off + (door.h - 2 * off) * k / (n - 1));
      const cu = hg.C + hg.dia / 2, u = r1(side === 'L' ? cu : door.w - cu);
      const plate = side === 'L' ? (i === 0 ? L : null) : (i === doors.length - 1 ? R : null);
      for (const v of vs) {
        push(door, { tag: 'hinge', type: 'hole', face: 'B', u, v: r1(v), dia: hg.dia, depth: hg.depth });
        if (plate) push(plate, { tag: 'hinge', type: 'hole', face: side === 'L' ? 'A' : 'B', u: r1(D - 37), v: r1(door.y - y0 + v - 16), dia: 5, depth: 12, count: 2, step: 32, dir: 'v' });
      }
    });
  }
  return true;
}
// Фурнитура корпуса: петли на дверях (действие «открыть»), направляющие ящиков, ножки под цоколь.
// Отверстия под петли уже поставила автоприсадка, поэтому здесь drill: '0'.
function cabinetHardware(parts, p) {
  const out = [];
  const doors = parts.filter(i => i.role === 'door').sort((a, b) => a.x - b.x);
  const ht = p.hinge && p.hinge.type !== 'none' ? p.hinge : null;
  doors.forEach((d, i) => {
    const side = doors.length === 1 ? (p.hinge && p.hinge.side) || 'L' : (i < doors.length / 2 ? 'L' : 'R');
    const hw = newHardware('hinge', d.id, nid());
    Object.assign(hw, { side, model: ht ? (ht.type === 'mini' ? 'mini' : ht.type) : 'blum', off: (ht && ht.off) || 100, count: (ht && ht.count) || 0, drill: '0', auto: true });
    if (!p.hinge || p.hinge.type !== 'none') out.push(hw);
  });
  for (const f of parts.filter(i => i.role === 'drawerFront')) { const hw = newHardware('ballFull', f.id, nid()); hw.auto = true; out.push(hw); }
  const bottom = parts.find(i => i.role === 'bottom');
  if (bottom && p.plinth >= 60) { const hw = newHardware('legAdjust', bottom.id, nid()); Object.assign(hw, { height: p.plinth, auto: true }); out.push(hw); }
  return out;
}
// Заменить петли у готового корпуса (остальная обработка остаётся)
function applyHingesFromInspector() {
  const k = kindOfSelection(); if (k.type !== 'group' || !k.g.params) return;
  const q = key => insp.querySelector(`[data-k="${key}"]`);
  const hinge = { type: q('htype').value, side: q('hside').value, off: parseFloat(q('hoff').value) || 100, count: parseInt(q('hcount').value, 10) || 0 };
  if (!k.list.some(i => i.role === 'sideL')) return status('У этого модуля нет разметки деталей — нажмите «Перестроить корпус»');
  commit(() => {
    k.g.params = { ...k.g.params, hinge };
    k.list.forEach(i => { i.ops = (i.ops || []).filter(o => o.tag !== 'hinge'); });
    drillCabinet(k.list, k.g.params, ['hinge']);
    const doors = new Set(k.list.filter(i => i.role === 'door').map(i => i.id));
    P.hw = P.hw.filter(h => !(doors.has(h.target) && HW_TYPES[h.type].cat === 'hinges'));
    P.hw.push(...cabinetHardware(k.list, k.g.params).filter(h => h.type === 'hinge'));
  });
  status(hinge.type === 'none' ? 'Петли убраны' : 'Петли обновлены: ' + HINGES.find(h => h.id === hinge.type).name);
}

function deleteSel() {
  if (!sel.size) return;
  commit(() => { P.items = P.items.filter(i => !sel.has(i.id)); sel.clear(); });
  status('Удалено');
}
function duplicateSel() {
  const list = selItems(); if (!list.length) return;
  const b = bbox(list), dx = b.x1 - b.x0;
  const gmap = new Map(), links = new Map();
  let shift = dx;
  if (noClash()) {
    const moved = list.map(i => ({ ...i, x: i.x + dx }));
    if (clash(moved, new Set(list.map(i => i.id)))) shift = freeX(b.y0, b.y1 - b.y0) - b.x0;
  }
  commit(() => {
    sel.clear();
    for (const i of list) {
      let g = 0;
      if (i.g) {
        if (!gmap.has(i.g)) {
          const src = group(i.g), whole = groupItems(i.g).every(x => list.includes(x));
          if (whole) { const ng = { ...src, id: nid(), name: src.name }; P.groups.push(ng); gmap.set(i.g, ng.id); } else gmap.set(i.g, i.g);
        }
        g = gmap.get(i.g);
      }
      const c = { ...JSON.parse(JSON.stringify(i)), id: nid(), x: i.x + shift, g };
      if (c.link) { if (!links.has(c.link)) links.set(c.link, 'L' + nid()); c.link = links.get(c.link); }
      for (const h of hwOf(i.id)) {
        const nh = { ...JSON.parse(JSON.stringify(h)), id: nid(), target: c.id };
        c.ops = (c.ops || []).map(o => o.tag === 'hw' + h.id ? { ...o, tag: 'hw' + nh.id } : o);
        P.hw.push(nh);
      }
      P.items.push(c); sel.add(c.id);
    }
  });
  status('Копия поставлена справа');
}
function groupSel() {
  const list = selItems(); if (list.length < 2) return status('Выделите несколько деталей: рамкой (Ctrl + тянуть мышью) или Shift + клик');
  const b = bbox(list);
  openDialog(`Объединить ${list.length} деталей`, `
    <div class="grid3">${fld('Что это', 'gk', 'cabinet', { options: Object.entries(KIND_NAMES) })}${fld('Название', 'gn', '', { text: true })}</div>
    <div class="note">Габарит: ${fmt(b.x1 - b.x0)} × ${fmt(b.y1 - b.y0)} × ${fmt(b.z1 - b.z0)} мм. Детали из других модулей перейдут в новый.
    Тип виден в списке слева, в свойствах и на чертежах — по нему понятно, где шкаф, где полка, а где отдельная деталь.</div>`,
    '<button data-close>Отмена</button><button class="accent" id="grpOk">Объединить</button>');
  const body = document.getElementById('dlgBody');
  body.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') document.getElementById('grpOk').click(); };
  const q = k => body.querySelector(`[data-k="${k}"]`);
  const autoName = () => `${KIND_NAMES[q('gk').value]} ${P.groups.filter(g => g.kind === q('gk').value).length + 1}`;
  q('gn').placeholder = autoName();
  body.onchange = () => { q('gn').placeholder = autoName(); };
  document.getElementById('grpOk').onclick = () => {
    const kind = q('gk').value, name = q('gn').value.trim() || autoName();
    closeDialog();
    commit(() => { const g = { id: nid(), name, kind }; P.groups.push(g); list.forEach(i => { i.g = g.id; }); openGroup = 0; });
    status(`Объединено: ${name} (${KIND_NAMES[kind]})`);
  };
}
function ungroupSel() {
  const list = selItems(); if (!list.some(i => i.g)) return;
  commit(() => { list.forEach(i => { i.g = 0; }); openGroup = 0; });
}
function moveSel(dx, dy, dz) {
  if (!sel.size) return;
  const list = selItems();
  const { d, hit } = clampMove(list, [dx, dy, dz], clashedBefore(list));
  if (hit && d.every(v => v === 0)) { status(`Не помещается: мешает ${who(hit)}`); refreshInspector(); return; }
  commit(() => list.forEach(i => { i.x = r1(i.x + d[0]); i.y = r1(i.y + d[1]); i.z = r1(i.z + d[2]); }));
  if (hit) status(`Упёрлось в ${who(hit)} — поставлено вплотную`);
}
// Поворот на 90°: меняются местами размеры по двум осям, деталь поворачивается вокруг своего центра
function rotateSel(axis) {
  const list = selItems(); if (!list.length) return;
  if (list.some(i => i.ops && i.ops.length)) return status('Деталь с отверстиями и вырезами не поворачивается — обработка привязана к её сторонам');
  if (list.some(i => hwOf(i.id).length)) return status('Деталь с фурнитурой не поворачивается — сначала удалите фурнитуру');
  const b = bbox(list), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, cz = (b.z0 + b.z1) / 2;
  const ex = clashedBefore(list);
  const turn = (i) => {
    const mx = i.x + i.w / 2, my = i.y + i.h / 2, mz = i.z + i.d / 2;
    if (axis === 'y') { [i.w, i.d] = [i.d, i.w]; const nx = cx + (mz - cz), nz = cz - (mx - cx); i.x = r1(nx - i.w / 2); i.z = r1(nz - i.d / 2); }
    if (axis === 'z') { [i.w, i.h] = [i.h, i.w]; const nx = cx - (my - cy), ny = cy + (mx - cx); i.x = r1(nx - i.w / 2); i.y = r1(ny - i.h / 2); }
    if (axis === 'x') { [i.h, i.d] = [i.d, i.h]; const ny = cy - (mz - cz), nz = cz + (my - cy); i.y = r1(ny - i.h / 2); i.z = r1(nz - i.d / 2); }
  };
  const trial = list.map(i => { const c = { ...i }; turn(c); return c; });
  const hit = noClash() && clash(trial, ex);
  if (hit) return status(`Повернуть нельзя: после поворота войдёт в ${who(hit)}`);
  commit(() => list.forEach(turn));
}
// Смена материала: если толщина другая — меняем самый тонкий размер детали
function setMaterial(list, id) {
  const m = mat(id);
  list.forEach(i => {
    const old = mat(i.mat).t;
    i.mat = id;
    if (old !== m.t) { const k = ['w', 'h', 'd'].reduce((a, c) => i[c] < i[a] ? c : a, 'w'); if (Math.abs(i[k] - old) < 0.01) i[k] = m.t; }
  });
}

// ---------------------------------------------------------------- левая панель: список модулей и деталей
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const label = i => i.name || KINDS[i.kind] || 'Деталь';
const dims = i => `${fmt(i.w)}×${fmt(i.h)}×${fmt(i.d)}`;
function refreshTree() {
  const el = document.getElementById('tree');
  if (!P.items.length) {
    el.innerHTML = '<div class="empty">Пусто. Нажмите <b>＋ Корпус</b>, чтобы собрать шкаф из деталей, или добавьте отдельную деталь.</div>';
    return;
  }
  let h = '';
  const node = (i, child) => `<div class="node ${child ? 'child' : ''} ${sel.has(i.id) ? 'sel' : ''}" data-item="${i.id}"><span class="sw" style="background:${mat(i.mat).color}"></span>${esc(label(i))}<span class="dim">${fmt(i.w)}×${fmt(i.h)}</span></div>`;
  for (const g of P.groups) {
    const list = groupItems(g.id), all = list.every(i => sel.has(i.id)), b = bbox(list);
    h += `<div class="node grp ${all ? 'sel' : ''}" data-group="${g.id}"><span>▸ ${esc(g.name)}</span><span class="dim">${fmt(b.x1 - b.x0)}×${fmt(b.y1 - b.y0)}</span>${g.kind ? `<span class="kind">${esc(KIND_NAMES[g.kind] || g.kind)}</span>` : ''}</div>`;
    if (openGroup === g.id || list.some(i => sel.has(i.id) && !all)) list.forEach(i => { h += node(i, true); });
  }
  P.items.filter(i => !i.g).forEach(i => { h += node(i, false); });
  el.innerHTML = h;
}
document.getElementById('tree').addEventListener('click', e => {
  const n = e.target.closest('.node'); if (!n) return;
  if (!e.shiftKey) sel.clear();
  if (n.dataset.group) { openGroup = 0; groupItems(+n.dataset.group).forEach(i => sel.add(i.id)); }
  else { const it = item(+n.dataset.item); openGroup = it.g || 0; sel.add(it.id); }
  selectionChanged();
});
document.getElementById('tree').addEventListener('dblclick', e => { if (e.target.closest('.node')) fit(); });

// ---------------------------------------------------------------- правая панель: свойства
const insp = document.getElementById('inspector');
function fld(labelText, key, value, opts = {}) {
  if (opts.options) {
    return `<label class="fld"><span>${labelText}</span><select data-k="${key}">${opts.options.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
  }
  return `<label class="fld"><span>${labelText}</span><input data-k="${key}" type="${opts.text ? 'text' : 'number'}" value="${esc(opts.text ? value : fmtIn(value))}" ${opts.ro ? 'readonly' : ''} step="any"></label>`;
}
const fmtIn = v => String(r1(v));
const matOptions = () => P.materials.map(m => [m.id, `${m.name} ${m.t} мм`]);
function kindOfSelection() {
  const list = selItems();
  if (!list.length) return { type: 'none' };
  if (list.length === 1) return { type: 'item', it: list[0] };
  const g = list[0].g;
  if (g && list.every(i => i.g === g) && groupItems(g).length === list.length) return { type: 'group', g: group(g), list };
  return { type: 'multi', list };
}
function refreshInspector() {
  const k = kindOfSelection();
  const title = document.getElementById('inspTitle');
  let h = '';
  if (k.type === 'none') {
    title.textContent = 'Проект';
    h += `<div class="sec"><b>Проект</b>${fld('Название', 'pname', P.name, { text: true })}
      <div class="row">${fld('Комната Ш', 'rw', P.room.w)}${fld('Глубина', 'rd', P.room.d)}${fld('Высота', 'rh', P.room.h)}</div></div>
      <div class="sec"><b>Как работать</b><div class="note">
      <b>＋ Корпус</b> — шкаф из деталей по размерам.<br>Клик — выбрать модуль, <b>двойной клик</b> — деталь внутри него.<br>
      Тяните цветные стрелки или вводите размеры справа.<br>
      <kbd>←</kbd><kbd>→</kbd> X, <kbd>↑</kbd><kbd>↓</kbd> высота, <kbd>PgUp</kbd><kbd>PgDn</kbd> глубина (с <kbd>Shift</kbd> — ×10)<br>
      <kbd>Ctrl+D</kbd> копия, <kbd>Del</kbd> удалить, <kbd>Ctrl+G</kbd> в модуль, <kbd>Ctrl+Z</kbd> отменить, <kbd>F</kbd> показать<br>
      Мышь: левая — вращать, правая — сдвигать вид, колесо — приблизить.</div></div>`;
  } else if (k.type === 'item') {
    const i = k.it;
    title.textContent = 'Деталь';
    h += `<div class="sec"><b>Деталь</b>${fld('Название', 'name', label(i), { text: true })}
      <div class="row2">${fld('Тип', 'kind', i.kind, { options: Object.entries(KINDS) })}${fld('Материал', 'mat', i.mat, { options: matOptions() })}</div></div>
      <div class="sec"><b>Размеры, мм</b><div class="row">${fld('Ширина (X)', 'w', i.w)}${fld('Высота (Y)', 'h', i.h)}${fld('Глубина (Z)', 'd', i.d)}</div></div>
      <div class="sec"><b>Положение, мм</b><div class="row">${fld('X слева', 'x', i.x)}${fld('Y от пола', 'y', i.y)}${fld('Z от стены', 'z', i.z)}</div></div>
      <div class="sec"><b>Обработка${(i.ops || []).length ? ` (${i.ops.length})` : ''}</b>
      ${(i.ops || []).map((o, k) => `<div class="op"><span>${k + 1}. ${esc(describeOp(o, i))}</span><button data-op-edit="${k}" title="Изменить">✎</button><button data-op-del="${k}" title="Удалить">✕</button></div>`).join('') || '<div class="note">Отверстий и вырезов нет.</div>'}
      <div class="btns"><button data-cmd="op-hole">＋ Отверстие</button><button data-cmd="op-cut">＋ Вырез / паз</button><button data-cmd="op-corner">＋ Срез / скругление угла</button></div>
      <div class="btns"><button data-cmd="measure-hole" title="Наведите мышь на деталь — видно расстояния до краёв, клик ставит отверстие">📏 Разметить отверстие</button><button data-cmd="measure-cut" title="Клик ставит левый нижний угол выреза">📏 Разметить вырез</button><button class="accent" data-cmd="drawing">Чертёж</button></div></div>
      <div class="sec"><b>Фурнитура${hwOf(i.id).length ? ` (${hwOf(i.id).length})` : ''}</b>
      ${hwOf(i.id).map(h => `<div class="op hwrow"><span>${esc(describeHw(h, i))}</span>${hasAction(h.type) ? `<button class="accent" data-hw-act="${h.id}">${actionLabels(h.type)[(hwState.get(h.id) || { to: 0 }).to > 0 ? 1 : 0]}</button>` : '<i></i>'}<button data-hw-edit="${h.id}" title="Изменить">✎</button><button data-hw-del="${h.id}" title="Удалить">✕</button></div>`).join('') || '<div class="note">Фурнитуры нет.</div>'}
      ${i.link ? `<div class="note">Двигается вместе со связанными деталями (${P.items.filter(x => x.link === i.link).length} шт.).</div>` : ''}
      <div class="btns"><button class="accent" data-cmd="hw">＋ Фурнитура</button></div></div>
      <div class="sec"><b>Действия</b><div class="btns"><button data-cmd="rot-y">⟲ Повернуть</button><button data-cmd="rot-z">⤾ Положить</button><button data-cmd="duplicate">Копия</button>
      ${i.g ? '<button data-cmd="ungroup">Вынуть из модуля</button>' : ''}<button class="danger" data-cmd="delete">Удалить</button></div></div>`;
  } else {
    const b = bbox(k.list);
    title.textContent = k.type === 'group' ? 'Модуль' : `Выбрано: ${k.list.length}`;
    if (k.type === 'group') h += `<div class="sec"><b>Модуль</b>${fld('Название', 'gname', k.g.name, { text: true })}${fld('Что это', 'gkind', k.g.kind || 'other', { options: Object.entries(KIND_NAMES) })}</div>`;
    h += `<div class="sec"><b>Габарит, мм</b><div class="row">${fld('Ширина', '-', b.x1 - b.x0, { ro: true })}${fld('Высота', '-', b.y1 - b.y0, { ro: true })}${fld('Глубина', '-', b.z1 - b.z0, { ro: true })}</div></div>
      <div class="sec"><b>Положение, мм</b><div class="row">${fld('X слева', 'bx', b.x0)}${fld('Y от пола', 'by', b.y0)}${fld('Z от стены', 'bz', b.z0)}</div></div>
      <div class="sec"><b>Материал</b><div class="row2">${fld('Корпус', 'mBody', '', { options: [['', '— не менять —'], ...matOptions()] })}${fld('Фасады', 'mFront', '', { options: [['', '— не менять —'], ...matOptions()] })}</div></div>`;
    if (k.type === 'group' && k.g.params) {
      const p = k.g.params;
      h += `<div class="sec"><b>Параметры корпуса</b><div class="row">${fld('Ширина', 'pW', p.W)}${fld('Высота', 'pH', p.H)}${fld('Глубина', 'pD', p.D)}</div>
        <div class="row">${fld('Полки', 'pshelves', p.shelves)}${fld('Двери', 'pdoors', p.doors)}${fld('Ящики', 'pdrawers', p.drawers)}</div>
        <div class="row2">${fld('Цоколь', 'pplinth', p.plinth)}${fld('Верх', 'ptopType', p.topType, { options: [['solid', 'Крыша'], ['rails', 'Царги']] })}</div>
        <div class="row2">${fld('Присадка', 'pdrill', p.drill === false ? '0' : '1', { options: [['1', 'Автоматически'], ['0', 'Без отверстий']] })}</div>
        <div class="btns"><button class="accent" data-cmd="rebuild-group">Перестроить корпус</button></div>
        <div class="note">Корпус соберётся заново по этим параметрам. Ручные правки деталей этого модуля пропадут.</div></div>`;
      if (p.doors > 0 && !(p.drawers > 0)) {
        const hp = p.hinge || { type: 'none', side: 'L', off: 100, count: 0 };
        h += `<div class="sec"><b>Петли</b>${fld('Тип петли', 'htype', hp.type, { options: HINGES.map(x => [x.id, x.name]) })}
          <div class="row">${fld('Сторона (1 дверь)', 'hside', hp.side || 'L', { options: [['L', 'слева'], ['R', 'справа']] })}${fld('От края, мм', 'hoff', hp.off || 100)}${fld('Кол-во (0 — авто)', 'hcount', hp.count || 0)}</div>
          <div class="btns"><button class="accent" data-cmd="apply-hinges">Применить петли</button></div>
          <div class="note">Меняются только петли и планки, остальная обработка остаётся. Авто: до 900 мм — 2 петли, до 1600 — 3, до 2000 — 4.</div></div>`;
      }
    }
    const hwHere = P.hw.filter(x => k.list.some(i => i.id === x.target));
    if (hwHere.length) {
      const cnt = new Map();
      hwHere.forEach(x => cnt.set(HW_TYPES[x.type].name, (cnt.get(HW_TYPES[x.type].name) || 0) + hardwareCount(x, item(x.target))));
      h += `<div class="sec"><b>Фурнитура</b><div class="note">${[...cnt].map(([n, c]) => `${esc(n)} — ${c} шт.`).join('<br>')}</div>
        ${hwHere.some(x => hasAction(x.type)) ? '<div class="btns"><button class="accent" data-cmd="hw-toggle-sel">▶ Открыть / закрыть</button></div>' : ''}</div>`;
    }
    h += `<div class="sec"><b>Двигать вместе</b><div class="note">Свяжите фасад ящика с его коробом — тогда направляющие выдвинут их вместе.</div>
      <div class="btns"><button data-cmd="link">🔗 Связать выбранные</button><button data-cmd="unlink">Разъединить</button></div></div>`;
    h += `<div class="sec"><b>Действия</b><div class="btns"><button data-cmd="rot-y">⟲ Повернуть</button><button data-cmd="duplicate">Копия</button>
      ${k.type === 'group' ? '<button class="accent" data-cmd="drawing-module">📐 Чертёж шкафа</button><button data-cmd="ungroup">Разгруппировать</button>' : '<button class="accent" data-cmd="group">Объединить в модуль…</button>'}
      <button class="danger" data-cmd="delete">Удалить</button></div></div>`;
  }
  insp.innerHTML = h;
}
// Во время перетаскивания обновляем только числа, не перерисовывая панель
function refreshInspectorValues() {
  const k = kindOfSelection();
  const set = (key, v) => { const el = insp.querySelector(`[data-k="${key}"]`); if (el && document.activeElement !== el) el.value = fmtIn(v); };
  if (k.type === 'item') { set('x', k.it.x); set('y', k.it.y); set('z', k.it.z); }
  else if (k.type !== 'none') { const b = bbox(k.list); set('bx', b.x0); set('by', b.y0); set('bz', b.z0); }
}
insp.addEventListener('change', e => {
  const key = e.target.dataset.k; if (!key || key === '-') return;
  const raw = e.target.value, v = parseFloat(String(raw).replace(',', '.'));
  const k = kindOfSelection();
  const num = () => { if (!isFinite(v)) { refreshInspector(); return false; } return true; };
  if (key === 'pname') return commit(() => { P.name = raw.trim() || 'Проект'; });
  if (['rw', 'rd', 'rh'].includes(key)) { if (!num() || v < 500) return refreshInspector(); return commit(() => { P.room[{ rw: 'w', rd: 'd', rh: 'h' }[key]] = v; buildRoom(); }); }
  if (k.type === 'item') {
    const i = k.it;
    if (key === 'name') return commit(() => { i.name = raw.trim(); });
    if (key === 'kind') return commit(() => { i.kind = raw; });
    if (key === 'mat') return commit(() => setMaterial([i], raw));
    if (!num()) return;
    if (['w', 'h', 'd'].includes(key) && v < 1) return refreshInspector();
    if (key === 'x') return moveSel(v - i.x, 0, 0);
    if (key === 'y') return moveSel(0, v - i.y, 0);
    if (key === 'z') return moveSel(0, 0, v - i.z);
    const ms = maxSize(i, key, r1(v));
    if (ms.hit && ms.v <= i[key]) { status(`Не помещается: мешает ${who(ms.hit)}. Максимум — ${fmt(i[key])} мм`); return refreshInspector(); }
    commit(() => { i[key] = r1(ms.v); });
    if (ms.hit) status(`Больше не помещается — мешает ${who(ms.hit)}. Поставлен максимум: ${fmt(ms.v)} мм`);
    return;
  }
  if (k.type === 'none') return;
  const b = bbox(k.list);
  if (key === 'gname') return commit(() => { k.g.name = raw.trim() || 'Модуль'; });
  if (key === 'gkind') return commit(() => { k.g.kind = raw; });
  if (key === 'mBody' && raw) return commit(() => setMaterial(k.list.filter(i => !['door', 'drawerFront', 'back'].includes(i.kind) && i.mat !== 'hdf3'), raw));
  if (key === 'mFront' && raw) return commit(() => setMaterial(k.list.filter(i => ['door', 'drawerFront'].includes(i.kind)), raw));
  if (key === 'bx' && num()) return moveSel(v - b.x0, 0, 0);
  if (key === 'by' && num()) return moveSel(0, v - b.y0, 0);
  if (key === 'bz' && num()) return moveSel(0, 0, v - b.z0);
});
insp.addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); e.stopPropagation(); });

function rebuildGroupFromInspector() {
  const k = kindOfSelection(); if (k.type !== 'group' || !k.g.params) return;
  const q = s => insp.querySelector(`[data-k="${s}"]`).value;
  const p = { ...k.g.params };
  for (const f of ['W', 'H', 'D', 'shelves', 'doors', 'drawers', 'plinth']) { const v = parseFloat(q('p' + f)); if (isFinite(v) && v >= 0) p[f] = v; }
  p.topType = q('ptopType');
  p.drill = q('pdrill') !== '0';
  if (p.W < 100 || p.H < 100 || p.D < 100) return status('Слишком маленький корпус');
  const b = bbox(k.list);
  if (noClash()) {
    const seq = P.seq, trial = buildCabinet(p, b.x0, b.y0, b.z0, k.g.id); P.seq = seq;
    const hit = clash(trial, clashedBefore(k.list));
    if (hit) return status(`Корпус ${p.W}×${p.H}×${p.D} не помещается: мешает ${who(hit)}. Освободите место или уменьшите размер.`);
  }
  commit(() => {
    P.items = P.items.filter(i => i.g !== k.g.id);
    k.g.params = p;
    const parts = buildCabinet(p, b.x0, b.y0, b.z0, k.g.id);
    P.items.push(...parts); sel.clear(); parts.forEach(i => sel.add(i.id));
    P.hw = P.hw.filter(h => item(h.target)); P.hw.push(...cabinetHardware(parts, p));
  });
  status('Корпус перестроен');
}

// ---------------------------------------------------------------- диалоги
const modal = document.getElementById('modal');
function openDialog(title, body, foot, wide) {
  document.getElementById('dlgTitle').textContent = title;
  const b = document.getElementById('dlgBody');
  b.oninput = b.onchange = b.onclick = b.onkeydown = null;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();  // иначе Esc ловит кнопка под окном
  b.innerHTML = body;
  document.getElementById('dlgFoot').innerHTML = foot;
  modal.querySelector('.dialog').classList.toggle('wide', !!wide);
  modal.hidden = false;
}
const closeDialog = () => { modal.hidden = true; };
modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-close]')) closeDialog(); });

function cabinetDialog() {
  const p = PRESETS.lower;
  openDialog('Корпус из деталей', `
    <div class="grid3">${fld('Тип', 'preset', 'lower', { options: Object.entries(PRESETS).map(([k, v]) => [k, v.label]) })}${fld('Название', 'cname', p.label, { text: true })}${fld('Материал корпуса', 'cmat', 'w16', { options: matOptions() })}</div>
    <div class="grid4">${fld('Ширина, мм', 'W', p.W)}${fld('Высота корпуса', 'H', p.H)}${fld('Глубина корпуса', 'D', p.D)}${fld('Цоколь / ножки', 'plinth', p.plinth)}</div>
    <div class="grid4">${fld('Полки', 'shelves', p.shelves)}${fld('Двери', 'doors', p.doors)}${fld('Ящики', 'drawers', p.drawers)}${fld('Низ корпуса от пола', 'baseY', p.baseY)}</div>
    <div class="grid3">${fld('Верх', 'topType', p.topType, { options: [['solid', 'Крыша'], ['rails', 'Царги 100 мм']] })}${fld('Задняя стенка', 'back', '1', { options: [['1', 'ХДФ 3 мм'], ['0', 'Без задней стенки']] })}${fld('Материал фасадов', 'fmat', 'acrylb18', { options: matOptions() })}</div>
    <div class="grid4">${fld('Присадка', 'drill', '1', { options: [['1', 'Автоматически'], ['0', 'Без отверстий']] })}${fld('Петли', 'htype', 'blum', { options: HINGES.map(h => [h.id, h.name]) })}${fld('Петли у одной двери', 'hside', 'L', { options: [['L', 'слева'], ['R', 'справа']] })}${fld('Петля от края двери, мм', 'hoff', 100)}</div>
    <div class="note">Корпус собирается из отдельных деталей: боковины, дно, крыша или царги, задняя стенка, полки, фасады, ящики (с боками, стенками и дном).
    Потом любую деталь можно выбрать двойным кликом и изменить. Если есть ящики — двери и полки не ставятся.<br>
    Автоприсадка: конфирматы Ø5 в боковинах и Ø7×50 в торцах дна, крыши и царг; полкодержатели Ø5×12; петли — чашка в фасаде и планка Ø5×12 в боковине (37 мм от переднего края).</div>`,
    '<button data-close>Отмена</button><button class="accent" id="cabOk">Добавить корпус</button>');
  const body = document.getElementById('dlgBody');
  const q = k => body.querySelector(`[data-k="${k}"]`);
  body.oninput = null; body.onclick = null;
  body.onchange = e => {
    if (e.target.dataset.k !== 'preset') return;
    const pr = PRESETS[q('preset').value];
    for (const k of ['W', 'H', 'D', 'plinth', 'shelves', 'doors', 'drawers', 'baseY']) q(k).value = pr[k];
    q('topType').value = pr.topType; q('cname').value = pr.label;
  };
  body.onkeydown = e => e.stopPropagation();
  document.getElementById('cabOk').onclick = () => {
    const n = k => Math.max(0, parseFloat(String(q(k).value).replace(',', '.')) || 0);
    const p2 = { W: n('W'), H: n('H'), D: n('D'), plinth: n('plinth'), shelves: Math.round(n('shelves')), doors: Math.min(6, Math.round(n('doors'))),
      drawers: Math.min(8, Math.round(n('drawers'))), topType: q('topType').value, back: q('back').value === '1', mat: q('cmat').value, facadeMat: q('fmat').value,
      drill: q('drill').value === '1', hinge: { type: q('htype').value, side: q('hside').value, off: n('hoff') || 100, count: 0 } };
    if (p2.W < 100 || p2.H < 100 || p2.D < 100) return alert('Ширина, высота и глубина — не меньше 100 мм');
    const baseY = n('baseY'), totalH = p2.plinth + p2.H;
    closeDialog();
    commit(() => {
      const g = { id: nid(), name: q('cname').value.trim() || 'Корпус', params: p2, kind: PRESET_KIND[q('preset').value] || 'cabinet' };
      P.groups.push(g);
      const parts = buildCabinet(p2, freeX(baseY, totalH), baseY, 0, g.id);
      P.items.push(...parts); sel.clear(); parts.forEach(i => sel.add(i.id)); openGroup = 0;
      P.hw.push(...cabinetHardware(parts, p2));
    });
    status(`Корпус добавлен: ${groupItems([...P.groups].pop().id).length} деталей. Двойной клик — выбрать отдельную деталь.`);
  };
}

// Спецификация: детали для распила (длина × ширина × толщина), площадь, листы, кромка
function specData() {
  const rows = new Map(), mats = new Map();
  for (const i of P.items) {
    const m = mat(i.mat);
    const s = [i.w, i.h, i.d].map(r1).sort((a, b) => b - a);
    const [L, Wd, T] = s;
    const key = [m.id, L, Wd, T, label(i), JSON.stringify(i.ops || [])].join('|');
    const r = rows.get(key) || { name: label(i), kind: KINDS[i.kind] || '', mat: m.name, L, W: Wd, T, n: 0, ops: (i.ops || []).length };
    r.n++; rows.set(key, r);
    const thin = ['w', 'h', 'd'].reduce((a, c) => i[c] < i[a] ? c : a, 'w');
    let edge = 0;
    if (['door', 'drawerFront'].includes(i.kind)) edge = 2 * (L + Wd);
    else if (i.kind === 'back' || m.id === 'hdf3') edge = 0;
    else if (i.kind === 'drawer') edge = L;
    else edge = thin === 'w' ? i.h : thin === 'h' ? i.w : 0;
    const t = mats.get(m.id) || { name: `${m.name} ${m.t} мм`, area: 0, n: 0, edge: 0, top: m.id === 'top38' };
    t.area += L * Wd / 1e6; t.n++; t.edge += edge / 1000; mats.set(m.id, t);
  }
  return { rows: [...rows.values()].sort((a, b) => a.mat.localeCompare(b.mat) || b.L - a.L), mats: [...mats.values()] };
}
function hwSpecTable() {
  if (!P.hw.length) return '';
  const cnt = new Map();
  for (const h of P.hw) { const it = item(h.target); if (!it) continue; const n = describeHw({ ...h, count: h.count }, it).split(' — ')[0]; cnt.set(n, (cnt.get(n) || 0) + hardwareCount(h, it)); }
  return `<table class="spec"><tr><th>Фурнитура</th><th class="n">Кол-во</th></tr>${[...cnt].map(([n, c]) => `<tr><td>${esc(n)}</td><td class="n">${c}</td></tr>`).join('')}</table>`;
}
function specDialog() {
  if (!P.items.length) return status('В проекте пока нет деталей');
  const { rows, mats } = specData();
  const sheet = SHEET.w * SHEET.h / 1e6;
  openDialog('Спецификация и раскрой', `
    <table class="spec"><tr><th>Материал</th><th class="n">Деталей</th><th class="n">Площадь, м²</th><th class="n">Листов ≈ (+15%)</th><th class="n">Кромка ≈, м</th></tr>
    ${mats.map(t => `<tr><td>${esc(t.name)}</td><td class="n">${t.n}</td><td class="n">${t.area.toFixed(2)}</td><td class="n">${t.top ? '—' : Math.ceil(t.area * 1.15 / sheet)}</td><td class="n">${t.edge.toFixed(1)}</td></tr>`).join('')}</table>
    <table class="spec"><tr><th>№</th><th>Деталь</th><th>Тип</th><th>Материал</th><th class="n">Длина</th><th class="n">Ширина</th><th class="n">Толщ.</th><th class="n">Обраб.</th><th class="n">Кол-во</th></tr>
    ${rows.map((r, k) => `<tr><td>${k + 1}</td><td>${esc(r.name)}</td><td>${esc(r.kind)}</td><td>${esc(r.mat)}</td><td class="n">${fmt(r.L)}</td><td class="n">${fmt(r.W)}</td><td class="n">${fmt(r.T)}</td><td class="n">${r.ops || ''}</td><td class="n">${r.n}</td></tr>`).join('')}</table>
    ${hwSpecTable()}
    <div class="note">Лист ${SHEET.w}×${SHEET.h} мм. Число листов — оценка по площади с запасом 15%; точный раскрой — на странице «Раскрой» сайта.
    Кромка считается по видимым торцам: передний торец корпусных деталей и все 4 торца фасадов.</div>`,
    '<button data-close>Закрыть</button><button class="accent" id="csvBtn">Сохранить в Excel (CSV)</button>', true);
  document.getElementById('csvBtn').onclick = () => {
    const lines = [['№', 'Деталь', 'Тип', 'Материал', 'Длина', 'Ширина', 'Толщина', 'Обработка', 'Кол-во'].join(';')];
    rows.forEach((r, k) => lines.push([k + 1, r.name, r.kind, r.mat, fmt(r.L), fmt(r.W), fmt(r.T), r.ops || '', r.n].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')));
    saveExport(P.name + ' — спецификация', 'csv', { text: '﻿' + lines.join('\r\n') });
  };
}

// ---------------------------------------------------------------- обработка: отверстия, вырезы, срезы углов
function defaultOp(type, fr) {
  const half = v => Math.round(v / 2);
  if (type === 'hole') return { type, face: 'A', u: half(fr.SU), v: half(fr.SV), s: half(fr.SV), o: r1(fr.T / 2), dia: 8, depth: 12, through: false, count: 1, step: 32, dir: 'u', preset: 'custom' };
  if (type === 'cut') return { type, face: 'A', u: 50, v: 50, cw: 100, ch: 60, r: 0, depth: 8, through: true, angle: 0, preset: 'custom' };
  return { type: 'corner', corner: 'RT', shape: 'chamfer', a: 100, b: 100 };
}
function opDialog(type, index = -1, init = null) {
  const k = kindOfSelection();
  if (k.type !== 'item') return status('Выберите одну деталь: двойной клик по детали внутри модуля');
  const it = k.it, fr = frame(it), N = fr.names;
  const old = index >= 0 ? it.ops[index] : null;
  if (old) type = old.type;
  const op = old ? JSON.parse(JSON.stringify(old)) : Object.assign(defaultOp(type, fr), init || {});
  const others = (it.ops || []).filter((_, j) => j !== index);
  const edge = () => op.type === 'hole' && !['A', 'B'].includes(op.face);
  const title = { hole: 'Отверстие', cut: 'Вырез / паз', corner: 'Срез угла' }[type];
  const chk = (key, text, on) => `<label class="fld chk"><input type="checkbox" data-k="${key}"${on ? ' checked' : ''}><span>${text}</span></label>`;
  function form() {
    let h = '';
    if (type === 'hole') {
      h += `<div class="grid3">${fld('Тип отверстия', 'preset', op.preset, { options: HOLE_PRESETS.map(p => [p.id, p.name]) })}
        ${fld('Где сверлить', 'face', op.face, { options: ['A', 'B', 'U0', 'U1', 'V0', 'V1'].map(f => [f, (f.length === 1 ? 'Пласть: ' : 'Торец: ') + N[f]]) })}
        ${fld('Диаметр Ø, мм', 'dia', op.dia)}</div>`;
      if (edge()) {
        const along = op.face[0] === 'U' ? fromName(N.V0) : fromName(N.U0);
        h += `<div class="grid3">${fld('Позиция ' + along, 's', op.s)}${fld('Отступ ' + fromName(N.B), 'o', op.o)}${fld('Глубина в торец', 'depth', op.depth)}</div>
          <div class="grid3">${fld('Количество', 'count', op.count)}${fld('Шаг, мм', 'step', op.step)}</div>`;
      } else {
        h += `<div class="grid4">${fld('X — ' + fromName(N.U0), 'u', op.u)}${fld('Y — ' + fromName(N.V0), 'v', op.v)}${fld('Глубина, мм', 'depth', op.depth)}${chk('through', 'Сквозное', op.through)}</div>
          <div class="grid3">${fld('Количество (ряд)', 'count', op.count)}${fld('Шаг, мм', 'step', op.step)}${fld('Ряд идёт', 'dir', op.dir, { options: [['u', 'вправо (по X)'], ['v', 'вверх (по Y)']] })}</div>`;
      }
    } else if (type === 'cut') {
      h += `<div class="grid3">${fld('Тип', 'preset', op.preset, { options: CUT_PRESETS.map(p => [p.id, p.name]) })}${fld('Сторона', 'face', op.face, { options: [['A', N.A], ['B', N.B]] })}${fld('Поворот, °', 'angle', op.angle)}</div>
        <div class="grid4">${fld('X угла — ' + fromName(N.U0), 'u', op.u)}${fld('Y угла — ' + fromName(N.V0), 'v', op.v)}${fld('Ширина (по X)', 'cw', op.cw)}${fld('Высота (по Y)', 'ch', op.ch)}</div>
        <div class="grid4">${fld('Радиус углов, мм', 'r', op.r || 0)}${fld('Глубина, мм', 'depth', op.depth)}${chk('through', 'Насквозь', op.through)}</div>`;
    } else {
      const round = op.shape && op.shape !== 'chamfer';
      h += `<div class="grid4">${fld('Угол', 'corner', op.corner, { options: [['LB', 'Левый нижний'], ['LT', 'Левый верхний'], ['RB', 'Правый нижний'], ['RT', 'Правый верхний']] })}${fld('Форма', 'shape', op.shape || 'chamfer', { options: CORNER_SHAPES })}
        ${round ? fld('Радиус R, мм', 'a', op.a) : fld('Срез по X, мм', 'a', op.a) + fld('Срез по Y, мм', 'b', op.b)}</div>`;
    }
    h += `<div class="note">${type === 'corner' ? 'Угол срезается по прямой насквозь (скос).' : 'Кликните по чертежу, чтобы поставить ' + (type === 'cut' ? 'левый нижний угол выреза' : 'отверстие') + '. Координаты — от левого нижнего угла чертежа.'}</div>
      <div class="op-preview" id="opPreview"></div>`;
    document.getElementById('dlgBody').innerHTML = h;
    preview();
  }
  let map = null;
  function preview() {
    const d = drawingSVG(it, { ops: [...others, op], hl: others.length, width: 700, height: 440 });
    map = d.map;
    document.getElementById('opPreview').innerHTML = d.svg;
  }
  function read() {
    const body = document.getElementById('dlgBody');
    body.querySelectorAll('[data-k]').forEach(el => {
      const key = el.dataset.k;
      if (el.type === 'checkbox') op[key] = el.checked;
      else if (el.tagName === 'SELECT') op[key] = el.value;
      else { const v = parseFloat(String(el.value).replace(',', '.')); if (isFinite(v)) op[key] = v; }
    });
  }
  openDialog(`${title}: ${label(it)}`, '', `<button data-close>Отмена</button><button class="accent" id="opOk">${old ? 'Сохранить' : 'Добавить'}</button>`, true);
  form();
  const body = document.getElementById('dlgBody');
  body.onkeydown = e => e.stopPropagation();
  body.oninput = () => { read(); preview(); };
  body.onchange = e => {
    const key = e.target.dataset.k;
    if (key === 'preset') {
      const pr = (type === 'hole' ? HOLE_PRESETS : CUT_PRESETS).find(p => p.id === e.target.value);
      Object.assign(op, { dia: pr.dia ?? op.dia, depth: pr.depth || op.depth, through: !!pr.through, count: pr.count || 1, step: pr.step || op.step });
      if (type === 'cut') Object.assign(op, { cw: pr.cw, ch: pr.ch || fr.SV, r: pr.r || 0, depth: pr.depth || op.depth });
      if (type === 'cut' && pr.groove) Object.assign(op, { u: 10, v: 0, ch: fr.SV, angle: 0 });
      if (pr.edge && !edge()) op.face = 'U0';
      if (!pr.edge && edge()) op.face = 'A';
      form();
    } else if (key === 'face' || key === 'shape') form();
  };
  body.onclick = e => {
    const svgEl = e.target.closest('#opPreview svg');
    if (!svgEl || !map || type === 'corner') return;
    // точка клика в координатах чертежа (учитывает масштаб и поля, если чертёж вписан в окно)
    const pt = svgEl.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const sp = pt.matrixTransform(svgEl.getScreenCTM().inverse());
    const clamp = (x, hi) => Math.min(hi, Math.max(0, x));  // клик мимо детали — ставим на её край
    const u = clamp(Math.round((sp.x - map.x0) / map.s), map.SU), v = clamp(Math.round(map.SV - (sp.y - map.y0) / map.s), map.SV);
    if (edge()) op.s = op.face[0] === 'U' ? v : u; else { op.u = u; op.v = v; }
    form();
  };
  document.getElementById('opOk').onclick = () => {
    read();
    if (type === 'hole' && (!(op.dia > 0) || (!op.through && !(op.depth > 0)))) return alert('Укажите диаметр и глубину отверстия');
    if (type === 'cut' && (!(op.cw > 0) || !(op.ch > 0) || (!op.through && !(op.depth > 0)))) return alert('Укажите размеры и глубину выреза');
    if (type === 'corner' && (!(op.a > 0) || (op.shape === 'chamfer' && !(op.b > 0)))) return alert('Укажите размеры среза');
    if (type === 'corner' && op.shape !== 'chamfer') op.b = op.a;
    if (op.type === 'hole' && !edge() && op.through) op.depth = fr.T;
    closeDialog();
    const saved = JSON.parse(JSON.stringify(op));
    commit(() => { it.ops = it.ops || []; if (index >= 0) it.ops[index] = saved; else it.ops.push(saved); });
    status(`${title} ${old ? 'изменено' : 'добавлено'}: ${describeOp(op, it)}`);
  };
}
insp.addEventListener('click', e => {
  const ha = e.target.closest('[data-hw-act]'), he = e.target.closest('[data-hw-edit]'), hd = e.target.closest('[data-hw-del]');
  if (ha) { toggleHw([+ha.dataset.hwAct]); setTimeout(refreshInspector, 50); return; }
  if (he) { const hw = P.hw.find(h => h.id === +he.dataset.hwEdit); if (hw) hwForm(item(hw.target), hw, false); return; }
  if (hd) { hwDelete(+hd.dataset.hwDel); return; }
  const ed = e.target.closest('[data-op-edit]'), del = e.target.closest('[data-op-del]');
  const k = kindOfSelection(); if (k.type !== 'item') return;
  if (ed) opDialog(null, +ed.dataset.opEdit);
  if (del) commit(() => { k.it.ops.splice(+del.dataset.opDel, 1); });
});

// ---------------------------------------------------------------- фурнитура: каталог и настройки
function hwSync(hw, it) {   // отверстия под фурнитуру: убрать старые этой фурнитуры, поставить новые
  it.ops = (it.ops || []).filter(o => o.tag !== 'hw' + hw.id);
  it.ops.push(...hwDrillOps(hw, it, hwOf(it.id).filter(h => h.id !== hw.id)));
}
function hwCatalog(cat) {
  const k = kindOfSelection();
  if (k.type !== 'item') return status('Выберите одну деталь (двойной клик по детали в модуле), чтобы поставить на неё фурнитуру');
  const it = k.it;
  cat = cat || 'hinges';
  const tabs = HW_CATEGORIES.map(([id, name]) => `<button class="${id === cat ? 'on' : ''}" data-hwcat="${id}">${esc(name)}</button>`).join('');
  const cards = Object.values(HW_TYPES).filter(t => t.cat === cat).map(t => {
    const why = checkTarget(t.id, it);
    return `<div class="hwcard${why ? ' off' : ''}"><div><b>${esc(t.name)}</b>${t.motion ? `<span class="tag">${t.motion === 'light' ? 'свет' : 'есть действие'}</span>` : ''}<div class="note">${esc(t.desc)}</div>${why ? `<div class="warn">${esc(why)}</div>` : ''}</div>
      <button class="accent" data-hwadd="${t.id}"${why ? ' disabled' : ''}>Поставить</button></div>`;
  }).join('');
  openDialog(`Фурнитура: ${label(it)}`, `<div class="hwtabs">${tabs}</div><div class="hwlist">${cards}</div>`, '<button data-close>Закрыть</button>', true);
  const body = document.getElementById('dlgBody');
  body.onclick = e => {
    const c = e.target.closest('[data-hwcat]'); if (c) return hwCatalog(c.dataset.hwcat);
    const a = e.target.closest('[data-hwadd]'); if (a && !a.disabled) hwForm(it, newHardware(a.dataset.hwadd, it.id, 0), true);
  };
}
function hwForm(it, hw, isNew) {
  const t = HW_TYPES[hw.type];
  const fieldsHtml = t.fields.map(k => {
    const fd = HW_FIELDS[k];
    return fd.num ? fld(fd.label, k, hw[k] ?? fd.def) : fld(fd.label, k, hw[k] ?? fd.def, { options: fd.options });
  }).join('');
  openDialog(`${t.name}: ${label(it)}`, `<div class="note">${esc(t.desc)}</div><div class="grid3">${fieldsHtml || '<div class="note">Настроек нет.</div>'}</div><div class="warn" id="hwWarn"></div>`,
    `<button data-close>Отмена</button><button class="accent" id="hwOk">${isNew ? 'Поставить' : 'Сохранить'}</button>`);
  const body = document.getElementById('dlgBody');
  body.onkeydown = e => e.stopPropagation();
  document.getElementById('hwOk').onclick = () => {
    const nh = { ...hw };
    body.querySelectorAll('[data-k]').forEach(el => { const fd = HW_FIELDS[el.dataset.k]; nh[el.dataset.k] = fd.num ? (parseFloat(String(el.value).replace(',', '.')) || 0) : el.value; });
    const why = checkTarget(nh.type, it) || conflict(nh, hwOf(it.id).filter(h => h.id !== hw.id));
    if (why) { document.getElementById('hwWarn').textContent = why; return; }
    closeDialog();
    commit(() => {
      if (isNew) { nh.id = nid(); P.hw.push(nh); } else { const i = P.hw.findIndex(h => h.id === hw.id); P.hw[i] = nh; delete nh.auto; }
      hwSync(nh, it);
    });
    status(`${isNew ? 'Поставлено' : 'Изменено'}: ${describeHw(nh, it)}`);
  };
}
function hwDelete(id) {
  const hw = P.hw.find(h => h.id === id); if (!hw) return;
  commit(() => {
    const it = item(hw.target);
    if (it) it.ops = (it.ops || []).filter(o => o.tag !== 'hw' + id);
    P.hw = P.hw.filter(h => h.id !== id); hwState.delete(id);
  });
}
function linkSel(on) {
  const list = selItems(); if (list.length < (on ? 2 : 1)) return status('Выберите несколько деталей (Shift + клик), которые должны двигаться вместе — например, фасад и короб ящика');
  const id = 'L' + nid();
  commit(() => list.forEach(i => { if (on) i.link = id; else delete i.link; }));
  status(on ? 'Детали связаны: двигаются вместе с фурнитурой' : 'Связь снята');
}

// Чертежи: по одной детали на лист, с размерами, координатами обработки и таблицей операций
function partSheet(it) {
  const fr = frame(it), g = it.g ? group(it.g) : null;
  const ops = (it.ops || []).map((o, k) => `<tr><td>${k + 1}</td><td>${esc(describeOp(o, it))}</td></tr>`).join('');
  return `<section class="sheet"><div class="sheet-head"><b>${esc(label(it))}</b><span>${g ? esc(g.name) + ' · ' : ''}${esc(mat(it.mat).name)} ${fmt(mat(it.mat).t)} мм · ${fmt(fr.SU)} × ${fmt(fr.SV)} × ${fmt(fr.T)} мм</span></div>
    ${drawingSVG(it).svg}${ops ? `<table class="spec"><tr><th>№</th><th>Обработка</th></tr>${ops}</table>` : '<div class="note">Без обработки.</div>'}</section>`;
}
const colorOf = i => mat(i.mat).color;
// Шкаф: три вида, список деталей и фурнитуры
function moduleSheet(g, k) {
  const list = groupItems(g.id), b = bbox(list);
  const rows = new Map();
  for (const i of list) {
    const m = mat(i.mat), [L, W, T] = [i.w, i.h, i.d].map(r1).sort((a, c) => c - a);
    const key = [label(i), m.id, L, W, T, (i.ops || []).length].join('|');
    const r = rows.get(key) || { name: label(i), mat: `${m.name} ${m.t}`, L, W, T, ops: (i.ops || []).length, n: 0 };
    r.n++; rows.set(key, r);
  }
  const hw = new Map();
  for (const h of P.hw) { const it = item(h.target); if (it && it.g === g.id) { const n = HW_TYPES[h.type].name; hw.set(n, (hw.get(n) || 0) + hardwareCount(h, it)); } }
  return `<section class="sheet"><div class="sheet-head"><b>${k ? k + '. ' : ''}${esc(g.name)}${g.kind ? ` <i class="kind">${esc(KIND_NAMES[g.kind] || g.kind)}</i>` : ''}</b><span>Габарит ${fmt(b.x1 - b.x0)} × ${fmt(b.y1 - b.y0)} × ${fmt(b.z1 - b.z0)} мм · деталей: ${list.length}</span></div>
    ${moduleSVG(list, { colorOf })}
    <table class="spec"><tr><th>Деталь</th><th>Материал</th><th class="n">Длина</th><th class="n">Ширина</th><th class="n">Толщ.</th><th class="n">Обраб.</th><th class="n">Кол-во</th></tr>
    ${[...rows.values()].sort((a, c) => c.L - a.L).map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.mat)}</td><td class="n">${fmt(r.L)}</td><td class="n">${fmt(r.W)}</td><td class="n">${fmt(r.T)}</td><td class="n">${r.ops || ''}</td><td class="n">${r.n}</td></tr>`).join('')}</table>
    ${hw.size ? `<table class="spec"><tr><th>Фурнитура</th><th class="n">Кол-во</th></tr>${[...hw].map(([n, c]) => `<tr><td>${esc(n)}</td><td class="n">${c}</td></tr>`).join('')}</table>` : ''}</section>`;
}
function overviewSheet() {
  const ov = overviewSVG(P.items, P.groups, { colorOf });
  const b = bbox(P.items);
  const mods = ov.order.map((id, k) => { const g = group(id), l = groupItems(id), mb = bbox(l); return `<tr><td>${k + 1}</td><td>${esc(g.name)}</td><td>${esc(KIND_NAMES[g.kind] || '')}</td><td class="n">${fmt(mb.x1 - mb.x0)} × ${fmt(mb.y1 - mb.y0)} × ${fmt(mb.z1 - mb.z0)}</td><td class="n">${l.length}</td></tr>`; }).join('');
  const loose = P.items.filter(i => !i.g).length;
  return `<section class="sheet"><div class="sheet-head"><b>Общий вид: ${esc(P.name)}</b><span>Габарит ${fmt(b.x1 - b.x0)} × ${fmt(b.y1 - b.y0)} × ${fmt(b.z1 - b.z0)} мм · шкафов: ${ov.order.length} · деталей: ${P.items.length}</span></div>
    ${ov.svg}<table class="spec"><tr><th>№</th><th>Шкаф / модуль</th><th>Тип</th><th class="n">Ш × В × Г, мм</th><th class="n">Деталей</th></tr>${mods}
    ${loose ? `<tr><td></td><td>Отдельные детали</td><td></td><td></td><td class="n">${loose}</td></tr>` : ''}</table>${hwSpecTable()}</section>`;
}
// Комплект чертежей: scope 'all' — общий вид, каждый шкаф со своими деталями, отдельные детали;
// группа — шкаф и его детали; список деталей — только детали
function drawingDialog(list, scope) {
  let sheets = [], title;
  if (scope === 'all') {
    if (!P.items.length) return status('В проекте пока нет деталей');
    const ov = overviewSVG(P.items, P.groups, {}).order;
    sheets.push(overviewSheet());
    ov.forEach((id, k) => { sheets.push(moduleSheet(group(id), k + 1)); groupItems(id).forEach(i => sheets.push(partSheet(i))); });
    P.items.filter(i => !i.g).forEach(i => sheets.push(partSheet(i)));
    title = `Чертежи проекта (${sheets.length} листов)`;
  } else if (scope && scope.group) {
    sheets.push(moduleSheet(scope.group, 0));
    groupItems(scope.group.id).forEach(i => sheets.push(partSheet(i)));
    title = `Чертёж шкафа: ${scope.group.name}`;
  } else {
    if (!list.length) return status('Выберите деталь или модуль');
    [...list].sort((a, b) => (b.ops || []).length - (a.ops || []).length).forEach(i => sheets.push(partSheet(i)));
    title = list.length > 1 ? `Чертежи деталей (${list.length})` : `Чертёж: ${label(list[0])}`;
  }
  const one = !scope && list.length === 1;
  openDialog(title, sheets.join(''), `<button data-close>Закрыть</button>${one ? '<button id="svgBtn">Сохранить SVG</button>' : ''}<button class="accent" id="printBtn">Печать / PDF</button>`, true);
  document.getElementById('printBtn').onclick = () => {
    const pa = document.getElementById('printArea');
    pa.innerHTML = document.getElementById('dlgBody').innerHTML;
    document.body.classList.add('printing');
    window.print();
    setTimeout(() => { document.body.classList.remove('printing'); pa.innerHTML = ''; }, 300);
  };
  const sb = document.getElementById('svgBtn');
  if (sb) sb.onclick = () => saveExport(`${P.name} — ${label(list[0])}`, 'svg', { text: drawingSVG(list[0]).svg });
}
function drawingsCommand() {
  const k = kindOfSelection();
  if (k.type === 'group') return drawingDialog(k.list, { group: k.g });
  if (k.type === 'item' || k.type === 'multi') return drawingDialog(k.list || [k.it]);
  return drawingDialog([], 'all');
}

// ---------------------------------------------------------------- файлы
const desktop = typeof window.kc === 'object';
function setDirty(v) { dirty = v; if (desktop) window.kc.setDirty(v); updateTitle(); }
function updateTitle() {
  const t = `${dirty ? '• ' : ''}${P.name}${filePath ? ' — ' + filePath.split(/[\\/]/).pop() : ''} — Kitchen Calc Studio`;
  document.title = t; if (desktop) window.kc.setTitle(t);
}
function loadProject(text, path) {
  let d;
  try { d = JSON.parse(text); } catch (e) { return alert('Файл повреждён или это не проект Kitchen Calc'); }
  if (!d || !Array.isArray(d.items)) return alert('Это не проект Kitchen Calc Studio');
  P = Object.assign(newProject(), d);
  if (!Array.isArray(P.hw)) P.hw = [];
  hwState.clear();
  for (const m of DEFAULT_MATERIALS) if (!P.materials.some(x => x.id === m.id)) P.materials.push({ ...m });
  P.seq = Math.max(P.seq || 1, ...P.items.map(i => i.id + 1), ...P.groups.map(g => g.id + 1));
  filePath = path || null;
  sel.clear(); openGroup = 0; undoStack.length = 0; redoStack.length = 0;
  buildRoom(); rebuild(); refreshUI(); setDirty(false); fit();
  status(path ? 'Открыт: ' + path : 'Проект загружен');
}
async function openFile() {
  if (dirty && !confirm('Текущий проект не сохранён. Открыть другой?')) return;
  if (desktop) { const r = await window.kc.open(); if (r) loadProject(r.data, r.path); }
  else document.getElementById('fileInput').click();
}
document.getElementById('fileInput').addEventListener('change', async e => {
  const f = e.target.files[0]; if (f) loadProject(await f.text(), f.name); e.target.value = '';
});
async function saveFile(saveAs) {
  const data = JSON.stringify(P, null, 1);
  if (desktop) {
    const p = await window.kc.save({ data, path: filePath, saveAs, name: P.name });
    if (!p) return;
    filePath = p;
  } else downloadBlob(new Blob([data], { type: 'application/json' }), P.name + '.kcp');
  setDirty(false); status('Сохранено');
}
async function saveExport(name, ext, payload) {
  if (desktop) { const p = await window.kc.exportFile({ name, ext, ...payload }); if (p) status('Сохранено: ' + p); return; }
  const blob = payload.base64 != null ? await (await fetch('data:image/png;base64,' + payload.base64)).blob() : new Blob([payload.text], { type: ext === 'svg' ? 'image/svg+xml' : 'text/csv' });
  downloadBlob(blob, name + '.' + ext);
}
function downloadBlob(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function newFile() {
  if (dirty && !confirm('Текущий проект не сохранён. Начать новый?')) return;
  P = newProject(); filePath = null; sel.clear(); openGroup = 0; undoStack.length = 0; redoStack.length = 0;
  buildRoom(); rebuild(); refreshUI(); setDirty(false); setView('3d');
}
function screenshot() {
  const helper = tc.getHelper(), vis = helper.visible;
  helper.visible = false; dimGroup.visible = false;
  renderer.render(scene, camera);
  const data = renderer.domElement.toDataURL('image/png').split(',')[1];
  helper.visible = vis; dimGroup.visible = true; requestRender();
  saveExport(P.name, 'png', { base64: data });
}
let autosaveTimer = 0;
function autosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => { try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ path: filePath, project: P })); } catch (e) { /* нет места — не страшно */ } }, 400);
}

// ---------------------------------------------------------------- кнопки и клавиши
const COMMANDS = {
  new: newFile, open: openFile, save: () => saveFile(false), cabinet: cabinetDialog,
  'panel-h': () => addPanel('panel-h'), 'panel-v': () => addPanel('panel-v'), 'panel-f': () => addPanel('panel-f'),
  undo, redo, duplicate: duplicateSel, delete: deleteSel, group: groupSel, ungroup: ungroupSel, 'apply-hinges': applyHingesFromInspector,
  'rot-y': () => rotateSel('y'), 'rot-z': () => rotateSel('z'), 'rebuild-group': rebuildGroupFromInspector,
  fit, spec: specDialog, shot: screenshot, drawing: () => drawingDialog(selItems()), drawings: drawingsCommand, 'drawing-module': drawingsCommand,
  'op-hole': () => opDialog('hole'), 'op-cut': () => opDialog('cut'), 'op-corner': () => opDialog('corner'),
  hw: () => hwCatalog(), link: () => linkSel(true), unlink: () => linkSel(false), boxsel: () => setBoxMode(!boxMode),
  'hw-toggle-sel': () => { const ids = selItems().map(i => i.id); toggleHw(P.hw.filter(h => ids.includes(h.target)).map(h => h.id)); },
  'hw-toggle-all': () => toggleHw(P.hw.map(h => h.id)),
  'measure-hole': () => startMeasure('hole'), 'measure-cut': () => startMeasure('cut'),
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cmd]'); if (b && COMMANDS[b.dataset.cmd]) { COMMANDS[b.dataset.cmd](); return; }
  const v = e.target.closest('[data-view]'); if (v) setView(v.dataset.view);
});
document.addEventListener('keydown', e => {
  if (!modal.hidden) { if (e.key === 'Escape') closeDialog(); return; }
  if (e.target.matches('input, select')) return;
  const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase(), step = gridStep() * (e.shiftKey ? 10 : 1);
  const map = {
    z: () => (e.shiftKey ? redo() : undo()), y: redo, d: duplicateSel, s: () => saveFile(e.shiftKey), o: openFile, n: newFile,
    g: () => (e.shiftKey ? ungroupSel() : groupSel()),
  };
  if (ctrl && map[k]) { e.preventDefault(); map[k](); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSel(); }
  else if (e.key === 'Escape') { if (measure) stopMeasure(); else { sel.clear(); openGroup = 0; selectionChanged(); } }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); moveSel(-step, 0, 0); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); moveSel(step, 0, 0); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(0, step, 0); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(0, -step, 0); }
  else if (e.key === 'PageUp') { e.preventDefault(); moveSel(0, 0, -step); }
  else if (e.key === 'PageDown') { e.preventDefault(); moveSel(0, 0, step); }
  else if (k === 'f') fit();
});
document.getElementById('showDims').addEventListener('change', updateDims);
document.getElementById('showRoom').addEventListener('change', buildRoom);
document.getElementById('showRoom').addEventListener('change', requestRender);

let statusTimer = 0;
function status(t) {
  const el = document.getElementById('statusText'); el.textContent = t;
  clearTimeout(statusTimer); statusTimer = setTimeout(() => { el.textContent = `Деталей: ${P.items.length}`; }, 6000);
}
function refreshUI() {
  refreshTree(); refreshInspector();
  document.querySelector('[data-cmd="undo"]').disabled = !undoStack.length;
  document.querySelector('[data-cmd="redo"]').disabled = !redoStack.length;
  document.getElementById('vpHint').textContent = measure
    ? 'Разметка: клик по детали ставит ' + (measure.tool === 'hole' ? 'отверстие' : 'угол выреза') + ' · Shift — по шагу · Esc — выход'
    : sel.size
    ? 'Тяните стрелки, чтобы двигать · двойной клик — деталь внутри модуля · Del — удалить'
    : 'Левая кнопка — вращать · правая — сдвигать · колесо — приблизить · клик — выбрать · Ctrl + тянуть — рамка';
  updateTitle();
}

// ---------------------------------------------------------------- запуск
async function start() {
  resize();
  let loaded = false;
  if (desktop) {
    const f = await window.kc.initialFile();
    if (f) { loadProject(f.data, f.path); loaded = true; }
  }
  if (!loaded) {
    try {
      const a = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || 'null');
      if (a && a.project && a.project.items && a.project.items.length) {
        loadProject(JSON.stringify(a.project), a.path); setDirty(true);
        status('Восстановлен последний проект (автосохранение)'); loaded = true;
      }
    } catch (e) { /* повреждённое автосохранение — начинаем с нуля */ }
  }
  if (!loaded) { buildRoom(); rebuild(); refreshUI(); updateTitle(); setView('3d'); }
  else setView('3d');
}
start();
window.__kcs = { get P() { return P; }, sel, COMMANDS, setView, get camera() { return camera; }, pivot, renderer, select: ids => { sel.clear(); ids.forEach(i => sel.add(i)); openGroup = 0; selectionChanged(); },
  hwSetT: (ids, t) => { ids.forEach(id => hwState.set(id, { t, to: t })); applyPoses(); }, meshOf: id => itemsGroup.children.find(m => m.userData.id === id), hwGroup };  // для автотестов
