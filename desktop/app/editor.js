// Kitchen Calc Studio — 3D-редактор корпусной мебели.
// Всё в миллиметрах. Деталь — прямоугольная плита по осям: размеры w (X, ширина), h (Y, высота), d (Z, глубина),
// положение x, y, z — её левый-нижний-задний угол. Ось X — вдоль задней стены, Y — вверх от пола, Z — от стены к нам.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { HW_TYPES, HW_CATEGORIES, FIELDS as HW_FIELDS, newHardware, checkTarget, conflict, movingIds, motionKey, steps as hwSteps, poseMatrix, visuals as hwVisuals, drillOps as hwDrillOps, describeHw, hardwareCount, hasAction, actionLabels, placeBetween, plateOps, hingeSpots, slideMount, baseNeeded, baseHint, findBase, snapDelta } from './hardware.js';
import { moduleSVG, overviewSVG, isoModuleSVG } from './drawings.js';
import { MILLS, MILL_CATS, millDefaults } from './mill.js';
import { createRuler } from './ruler.js';
import { createPeople } from './people.js';
import { APP_CATS, MOUNTS, APPLIANCES, appBox, appInfo, FINISHES, finishColor, CUSTOM_OPEN, buildAppliance, hasMotion, poseAppliance, appIcon, appSheetSVG, frontReach, grabPoint } from './appliances.js';
import { DECOR, DECORS, TABS, texture as decorTexture, thumb as decorThumb, surfaceParams, sheetLayout, applySheetUV, onTextureUpdate } from './materials.js';
import { normRoom, buildRoom3D, roomObstacles, roomSVG, ROOM_PRESETS, OPENING_TYPES, wallsToPts, ptsToWalls, checkPts, checkOpening, tidyPts, wallLen } from './room.js';
import { panelGeometry, describeOp, drawingSVG, frame, thinAxis, bevelLen, fromName, HOLE_PRESETS, CUT_PRESETS, HINGES, CORNER_SHAPES } from './machining.js';

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
  bed: 'Кровать', hall: 'Прихожая', kitchen: 'Кухня (набор)', island: 'Остров', bench: 'Скамья / пуф', decor: 'Декор / предмет интерьера', other: 'Другое' };
const PRESET_KIND = { lower: 'base', drawers: 'drawers', upper: 'wall', tall: 'tall', wardrobe: 'wardrobe', open: 'rack' };  // стандартный лист ЛДСП, мм
const AUTOSAVE_KEY = 'kcs-autosave-v1';
const GROUP_MODES = [
  { id: 'assembly', icon: '🧩', name: 'Сборка', note: 'Клик выбирает целиком, двойной клик — отдельную деталь. Двери, ящики и фурнитура работают каждая сама. Можно разобрать.' },
  { id: 'solid', icon: '■', name: 'Один предмет', note: 'Монолит: детали не разделяются и не двигаются по отдельности — выбирается и переносится только целиком. Для интерьера: декор, готовая мебель, сантехника. Можно разобрать.' },
];

// ---------------------------------------------------------------- проект и история
let P = newProject();
let filePath = null;
let dirty = false;
const sel = new Set();       // id выбранных деталей
let openGroup = 0;           // модуль, «внутри» которого выбираем отдельные детали (двойной клик)
const undoStack = [], redoStack = [];

function newProject() {
  return { app: 'kitchen-calc-studio', version: 1, name: 'Новый проект', room: normRoom({ w: 3600, d: 3000, h: 2700 }),
    materials: DEFAULT_MATERIALS.map(m => ({ ...m })), items: [], groups: [], hw: [], measures: [], seq: 1 };
}
const nid = () => P.seq++;
const mat = id => P.materials.find(m => m.id === id) || P.materials[0];
const item = id => P.items.find(i => i.id === id);
const group = id => P.groups.find(g => g.id === id);
const selItems = () => P.items.filter(i => sel.has(i.id));
const groupItems = g => P.items.filter(i => i.g === g);
// Модуль-«предмет» (монолит): детали не разделяются — выбирается только целиком, фурнитура внутри не двигается
const solid = id => { const it = item(id), g = it && it.g && group(it.g); return !!(g && g.mode === 'solid'); };

function snapshot() { return JSON.stringify({ name: P.name, room: P.room, materials: P.materials, items: P.items, groups: P.groups, hw: P.hw, measures: P.measures || [], seq: P.seq }); }
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
function afterChange() {
  P.groups = P.groups.filter(g => P.items.some(i => i.g === g.id)); P.hw = (P.hw || []).filter(h => item(h.target)); for (const h of P.hw) if (h.base && !item(h.base)) h.base = null;
  const gone = o => /^app\d+$/.test(o.tag || '') && !isApp(item(+o.tag.slice(3)));   // вырез под технику, которой больше нет
  for (const x of P.items) if (x.ops && x.ops.some(gone)) x.ops = x.ops.filter(o => !gone(o));
  pruneSel(); rebuild(); refreshUI(); setDirty(true); autosave();
}

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
const hemi = new THREE.HemisphereLight(0xffffff, 0x8f877b, 1.9); scene.add(hemi);
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
// Декор с текстурой листа: один материал на декор (выделение — свой, с подсветкой)
function decorSurface(d, selected) {
  const k = 'd:' + d.id + (selected ? '*' : '');
  if (!matCache.has(k)) {
    const m = new THREE.MeshStandardMaterial({ map: decorTexture(d.id, 'sheet'), ...surfaceParams(d), polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    if (selected) { m.emissive = new THREE.Color(0xd9850f); m.emissiveIntensity = 0.28; }
    matCache.set(k, m);
  }
  return matCache.get(k);
}
const decorOfItem = it => { const m = mat(it.mat); return m.decor && DECOR[m.decor] ? DECOR[m.decor] : null; };
onTextureUpdate(() => requestRender());
// Геометрия детали с UV по месту на листе раскроя (кэш: размеры, обработка, место)
const uvGeoCache = new Map();
function sheetGeometry(it, machined, place) {
  const key = `${it.w}|${it.h}|${it.d}|${machined ? JSON.stringify(it.ops) : ''}|${place.k},${place.x},${place.y},${place.along}`;
  if (!uvGeoCache.has(key)) {
    if (uvGeoCache.size > 1500) uvGeoCache.clear();
    uvGeoCache.set(key, applySheetUV(machined ? machined.geo.clone() : new THREE.BoxGeometry(Math.max(it.w, 0.5), Math.max(it.h, 0.5), Math.max(it.d, 0.5)), it, place));
  }
  return uvGeoCache.get(key);
}
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
function render() { renderQueued = false; updateWallVisibility(); renderer.render(scene, camera); labels.render(scene, camera); }

function resize() {
  const w = vp.clientWidth, h = vp.clientHeight;
  renderer.setSize(w, h); labels.setSize(w, h);
  persp.aspect = w / h; persp.updateProjectionMatrix();
  const half = (ortho.top - ortho.bottom) / 2 || 1500;
  ortho.left = -half * w / h; ortho.right = half * w / h; ortho.top = half; ortho.bottom = -half; ortho.updateProjectionMatrix();
  requestRender();
}
new ResizeObserver(resize).observe(vp);

// Комната: пол по контуру с сеткой 100 мм, стены с окнами и дверями, колонны (room.js)
let roomKey = '', roomWalls = null;
function buildRoom() {
  roomGroup.clear();
  P.room = normRoom(P.room);
  roomKey = JSON.stringify(P.room);
  const R = P.room;
  const g = buildRoom3D(R, { floorMat: R.floor && DECOR[R.floor] ? roomSurface(R.floor, 'floor', 0) : null,
    wallMatOf: i => { const id = i === 'col' ? R.wall : (R.wallMats[i] || R.wall); return id && DECOR[id] ? (i === 'col' ? surface(DECOR[id].hex, false) : roomSurface(id, 'wall', i)) : null; } });
  roomWalls = g.getObjectByName('walls');
  roomGroup.add(g);
  requestRender();
}
// Покрытие пола или стены: текстура на 6 м, у каждой стены — свой участок рисунка
function roomSurface(id, purpose, i) {
  const k = `r:${id}:${purpose}:${i}`;
  if (!matCache.has(k)) {
    const d = DECOR[id], base = decorTexture(id, purpose), t = base.clone();
    t.offset.set((i * 0.37) % 1, (i * 0.21) % 1);
    matCache.set(k, new THREE.MeshStandardMaterial({ map: t, ...surfaceParams(d), side: THREE.FrontSide }));
  }
  return matCache.get(k);
}
// Стены между камерой и комнатой прячутся — видно, что внутри (как в разрезе)
const _cv = new THREE.Vector3();
function updateWallVisibility() {
  if (!roomWalls) return;
  const on = document.getElementById('showRoom').checked;
  roomWalls.visible = on;
  for (const w of roomWalls.children) {
    if (!w.userData.normal) continue;
    w.visible = _cv.copy(camera.position).sub(w.userData.mid).dot(w.userData.normal) <= 0;
  }
}
// Мебель не заходит в стены и колонны
let obstCache = { key: '', list: [] };
function obstacles() {
  if (obstCache.key !== roomKey) obstCache = { key: roomKey, list: roomObstacles(P.room) };
  return obstCache.list;
}
const solidsAll = () => P.items.concat(obstacles());

function rebuild() {
  if (JSON.stringify(P.room) !== roomKey) buildRoom();
  itemsGroup.clear();
  const layout = sheetLayout(P.items.filter(i => !isApp(i)), thinAxis, it => { const d = decorOfItem(it); return d && d.id; });   // где деталь на листе — тот кусок рисунка и берёт
  for (const it of P.items) {
    const selected = sel.has(it.id);
    if (isApp(it)) { itemsGroup.add(appMesh(it, selected)); continue; }
    const machined = panelGeometry(it);  // деталь с отверстиями и вырезами — своя геометрия, иначе единичный бокс
    const d = decorOfItem(it), place = d && layout.get(it.id);
    const mesh = place ? new THREE.Mesh(sheetGeometry(it, machined, place), decorSurface(d, selected))
      : new THREE.Mesh(machined ? machined.geo : boxGeo, surface(mat(it.mat).color, selected));
    if (!machined && !place) mesh.scale.set(Math.max(it.w, 0.5), Math.max(it.h, 0.5), Math.max(it.d, 0.5));
    mesh.position.set(it.x + it.w / 2, it.y + it.h / 2, it.z + it.d / 2);
    mesh.userData.id = it.id;
    const edges = new THREE.LineSegments(machined ? machined.edges : edgeGeo, selected ? edgeSelMat : edgeMat);
    if (!machined && place) edges.scale.set(Math.max(it.w, 0.5), Math.max(it.h, 0.5), Math.max(it.d, 0.5));
    mesh.add(edges);
    itemsGroup.add(mesh);
  }
  for (const id of [...appModels.keys()]) if (!isApp(item(id))) appModels.delete(id);
  buildHardware();
  updateGizmo(); updateDims(); requestRender();
}

// ---------------------------------------------------------------- фурнитура: вид и действия (открыть / выдвинуть / поднять)
const hwGroup = new THREE.Group(); scene.add(hwGroup);
const hwState = new Map();          // id фурнитуры → { t: 0…1 сейчас, to: куда едем }
let moverByItem = new Map();        // id детали → список фурнитуры, которая её двигает (по очереди)
const hwOf = id => P.hw.filter(h => h.target === id);
const hwT = id => (hwState.get(id) || { t: 0 }).t;
const fastMat = { screw: new THREE.MeshStandardMaterial({ color: 0xa3a8af, metalness: 0.35, roughness: 0.4 }), head: new THREE.MeshStandardMaterial({ color: 0xc3c7cc, metalness: 0.35, roughness: 0.35 }) };
// Точка и направление «внутрь детали» для отверстия обработки — в мировых координатах
function holeWorld(it, o, off = 0) {
  const fr = frame(it), put = (u, v, n) => { const q = { [fr.U]: u, [fr.V]: v, [fr.N]: n }; return new THREE.Vector3(it.x + q.x, it.y + q.y, it.z + q.z); };
  const unit = k => new THREE.Vector3(k === 'x' ? 1 : 0, k === 'y' ? 1 : 0, k === 'z' ? 1 : 0);
  if (o.face === 'A' || o.face === 'B') {
    const u = o.u + (o.dir === 'v' ? 0 : off), v = o.v + (o.dir === 'v' ? off : 0);
    return o.face === 'A' ? { p: put(u, v, fr.T), dir: unit(fr.N).negate() } : { p: put(u, v, 0), dir: unit(fr.N) };
  }
  const sv = o.s + off;
  if (o.face === 'U0') return { p: put(0, sv, o.o), dir: unit(fr.U) };
  if (o.face === 'U1') return { p: put(fr.SU, sv, o.o), dir: unit(fr.U).negate() };
  if (o.face === 'V0') return { p: put(sv, 0, o.o), dir: unit(fr.V) };
  return { p: put(sv, fr.SV, o.o), dir: unit(fr.V).negate() };
}
function rod(r, a, b, m) { const g = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 12), m); placeBetween(g, a, b); return g; }
function buildFasteners() {
  if (!document.getElementById('showFast').checked) return;
  for (const it of P.items) for (const o of it.ops || []) {
    const n = Math.max(1, o.count | 0);
    for (let k = 0; k < n; k++) {
      const { p, dir } = holeWorld(it, o, k * (+o.step || 0));
      if (o.tag === 'conf' && o.face.length === 2) {          // конфирмат: из торца дна/крыши через боковину
        const head = p.clone().addScaledVector(dir, -16 - 1);
        hwGroup.add(rod(3.5, head, p.clone().addScaledVector(dir, 48), fastMat.screw));
        const h = rod(5, head.clone().addScaledVector(dir, -1.5), head.clone().addScaledVector(dir, 0.5), fastMat.head); hwGroup.add(h);
      } else if (o.tag === 'shelf') {                           // полкодержатель: штырёк + полочка
        hwGroup.add(rod(2.5, p.clone().addScaledVector(dir, 10), p.clone().addScaledVector(dir, -8), fastMat.screw));
        const tab = rod(4, p.clone().addScaledVector(dir, -2), p.clone().addScaledVector(dir, -9), fastMat.head); tab.position.y += 3; hwGroup.add(tab);
      }
    }
  }
}
function buildHardware() {
  hwGroup.clear();
  buildFasteners();
  moverByItem = new Map();
  for (const hw of P.hw) if (!solid(hw.target)) for (const id of movingIds(hw, P.items)) { if (!moverByItem.has(id)) moverByItem.set(id, []); moverByItem.get(id).push(hw); }
  for (const hw of P.hw) {
    const it = item(hw.target); if (!it) continue;
    for (const v of hwVisuals(hw, it, P.items, hwOf(it.id))) {
      const o = v.obj;
      o.userData = { ...o.userData, hw: hw.id, mode: v.mode, factor: v.factor || 1, fixed: v.fixed, onPart: v.onPart, role: v.role };
      if (v.mode !== 'strut') { o.updateMatrix(); o.userData.base = o.matrix.clone(); o.matrixAutoUpdate = false; }
      if (v.mode === 'light') o.material = o.material.clone();
      hwGroup.add(o);
    }
  }
  applyPoses();
}
const _M = new THREE.Matrix4(), _I = new THREE.Matrix4(), _L = new THREE.Matrix4();
// Чем деталь держится: фурнитура, которая её двигает, иначе любая фурнитура на ней со стороной Б
const moves = (hw, id) => (moverByItem.get(id) || []).includes(hw);
function holderOf(id) { const ms = moverByItem.get(id) || []; return ms.find(h => h.base) || ms[0] || P.hw.find(h => h.target === id && h.base); }
// Положение детали с учётом цепочки: сначала двигается её сторона Б (корпус, дверь…), потом её собственная фурнитура.
// Например, дверца на двери: открыли большую дверь — маленькая едет с ней и открывается относительно неё.
function itemPose(id, out, seen = new Set()) {
  const hw = holderOf(id);
  if (!hw || seen.has(id)) return null;
  seen.add(id);
  const parent = hw.base ? itemPose(hw.base, new THREE.Matrix4(), seen) : null;
  let local = null;   // все механизмы детали по очереди: сначала первый поставленный, потом следующий
  const seen2 = new Set();   // пара одинаковых механизмов (две направляющие, две петли) двигает деталь один раз
  for (const h of moverByItem.get(id) || []) if (hwT(h.id)) { const key = motionKey(h) || h.type; if (seen2.has(key)) continue; seen2.add(key); const M = poseMatrix(hwSteps(h, item(h.target), P.items), hwT(h.id), new THREE.Matrix4()); local = local ? local.premultiply(M) : M; }
  if (!parent && !local) return null;
  out.identity();
  if (local) out.copy(local);
  if (parent) out.premultiply(parent);
  return out;
}
const poseOf = id => (id ? itemPose(id, new THREE.Matrix4()) : null) || _I.identity();
function applyPoses() {
  for (const m of itemsGroup.children) {
    const M = itemPose(m.userData.id, _M);
    if (!M) { if (!m.matrixAutoUpdate) { m.matrixAutoUpdate = true; m.updateMatrix(); } continue; }
    m.updateMatrix(); m.matrix.premultiply(M); m.matrixAutoUpdate = false; m.matrixWorldNeedsUpdate = true;
  }
  for (const o of hwGroup.children) {
    const u = o.userData; if (!u.hw) continue;
    const hw = P.hw.find(h => h.id === u.hw); if (!hw) continue;
    const ref = hw.base || (moves(hw, hw.target) ? 0 : hw.target);   // на чём держится сторона Б
    if (u.mode === 'attach') {                     // сторона А: едет вместе с деталью
      o.matrix.copy(u.base).premultiply(poseOf(hw.target)); o.matrixWorldNeedsUpdate = true;
    } else if (u.mode === 'static') {              // сторона Б (планка, корпус механизма): держится за свою деталь
      o.matrix.copy(u.base).premultiply(poseOf(ref)); o.matrixWorldNeedsUpdate = true;
    } else if (u.mode === 'self') {
      const M = poseMatrix(hwSteps(hw, item(hw.target), P.items), hwT(hw.id) * u.factor, new THREE.Matrix4()).premultiply(poseOf(ref));
      o.matrix.copy(u.base).premultiply(M); o.matrixWorldNeedsUpdate = true;
    } else if (u.mode === 'strut') {
      // газлифт: корпус закреплён на стороне Б, шток упирается в деталь и выдвигается при открывании
      const M = poseOf(hw.target), B = poseOf(ref);
      const fx = u.fixed.clone().applyMatrix4(B), q = u.onPart.clone().applyMatrix4(M), closedLen = u.fixed.distanceTo(u.onPart), dir = q.clone().sub(fx).normalize();
      if (u.role === 'body') placeBetween(o, fx, fx.clone().addScaledVector(dir, closedLen * 0.62));
      else placeBetween(o, fx.clone().addScaledVector(dir, closedLen * 0.5), q);
    } else if (u.mode === 'light') {
      const on = hwT(hw.id) > 0.5;
      o.material.emissive.setHex(on ? o.userData.color : 0x000000); o.material.emissiveIntensity = on ? 1.4 : 0;
    }
  }
  for (const [id, c] of appModels) poseAppliance(c.model, appT(id));   // двери и крышки техники
  requestRender();
}
let animating = false;
function animateHw() {
  let busy = false;
  for (const st of [...hwState.values(), ...appState.values()]) {
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
  const all = ids.length;
  ids = ids.filter(id => { const h = P.hw.find(x => x.id === id); return h && hasAction(h.type) && !solid(h.target); });
  if (!ids.length) return status(all && P.hw.some(h => solid(h.target)) ? 'Это монолит («один предмет»): части не двигаются. В свойствах модуля выберите «Как объединено: Сборка»' : 'Здесь нет фурнитуры с действием');
  const to = ids.some(id => (hwState.get(id) || { to: 0 }).to < 1) ? 1 : 0;
  if (peopleOn()) return people.operate(hwOps(ids, to));   // открывает человек: подходит, берётся за ручку, тянет
  setHw(ids, to);
}
// ---------------------------------------------------------------- люди и свет (people.js, sounds.js): человек открывает руками, соседка ругается
const people = createPeople({ scene, render: requestRender, room: () => P.room, camera: () => camera, target: () => orbit.target });
const peopleOn = () => document.getElementById('showPeople').checked;
// Где ручка у детали, которую двигает фурнитура (в закрытом положении): у двери — край напротив петель,
// у ящика — посередине сверху, у подъёмника — снизу; по высоте — где удобно взяться
function handleOf(h, it) {
  const t = HW_TYPES[h.type], z = it.z + it.d + 15, side = h.side || 'L';
  const hy = it.y + it.h <= 1000 ? it.y + it.h - 70 : it.y >= 1300 ? it.y + 70 : Math.min(Math.max(1050, it.y + 120), it.y + it.h - 120);
  const at = (x, y) => new THREE.Vector3(x, y, z);
  if (t.cat === 'slides' || t.motion === 'self' || h.type === 'tableSlide') return at(it.x + it.w / 2, it.y + it.h - 45);
  if (t.cat === 'lifts') return h.type === 'flapStay' || h.dir === 'down' ? at(it.x + it.w / 2, it.y + it.h - 50) : at(it.x + it.w / 2, it.y + 50);
  if (t.cat === 'sliding' && h.type !== 'foldingDoor') return at(h.slideDir === 'R' ? it.x + 60 : it.x + it.w - 60, hy);
  if (side === 'T' || h.type === 'wallBed') return at(it.x + it.w / 2, side === 'T' ? it.y + 50 : it.y + it.h - 50);
  if (side === 'B') return at(it.x + it.w / 2, it.y + it.h - 50);
  return at(side === 'L' ? it.x + it.w - 45 : it.x + 45, hy);
}
const soundOf = h => { const t = HW_TYPES[h.type]; return t.motion === 'light' ? 'switch' : t.cat === 'slides' || t.motion === 'self' || h.type === 'tableSlide' ? 'drawer' : t.cat === 'lifts' ? 'lift' : t.cat === 'sliding' && h.type !== 'foldingDoor' ? 'slideDoor' : 'door'; };
// Что делает человек: по одной операции на деталь (пара петель или направляющих — одна), за самую переднюю деталь (фасад ящика)
function hwOps(ids, to) {
  const groups = new Map();
  for (const id of ids) {
    const h = P.hw.find(x => x.id === id), it = h && item(h.target); if (!it) continue;
    const front = [it, ...movingIds(h, P.items).map(item).filter(Boolean)].reduce((a, b) => (b.z + b.d > a.z + a.d ? b : a));
    if (!groups.has(front.id)) groups.set(front.id, { h, front, ids: [] });
    groups.get(front.id).ids.push(id);
  }
  return [...groups.values()].map(({ h, front, ids: gi }) => {
    const p0 = handleOf(h, front);
    return {
      at: () => p0.clone().applyMatrix4(poseOf(front.id)),
      front: () => new THREE.Vector3(0, 0, 1).transformDirection(poseOf(front.id)),
      start: () => { setHw(gi, to); refreshSoon(); },
      done: () => gi.every(id => { const st = hwState.get(id); return !st || st.t === to; }),
      sound: { kind: soundOf(h), seed: front.id, closing: to === 0 },
    };
  });
}
function appOp(id, to) {
  const c = appModels.get(id), it = item(id), g = c && grabPoint(c.model, it.spec);
  if (!g) return { at: () => new THREE.Vector3(it.x + it.w / 2, it.y + it.h * 0.6, it.z + it.d), front: () => null, start: () => setApp([id], to), done: () => true, sound: { kind: 'door', seed: id, closing: to === 0 } };
  const world = () => { g.part.updateWorldMatrix(true, false); return g.part.matrixWorld; };
  return {
    at: () => g.point.clone().applyMatrix4(world()),
    front: () => new THREE.Vector3(0, 0, 1).transformDirection(world()),
    start: () => { setApp([id], to); refreshSoon(); },
    done: () => { const st = appState.get(id); return !st || st.t === to; },
    sound: { kind: g.sound, seed: id, closing: to === 0 },
  };
}
// кнопки «Открыть / Закрыть» в свойствах — по новому состоянию, когда человек потянул
const refreshSoon = () => setTimeout(() => { refreshInspector(); if (!modal.hidden && dlgIsPart) renderPartEditor(); }, 60);
let lightOn = true;
function toggleLight() {
  lightOn = !lightOn;
  hemi.intensity = lightOn ? 1.9 : 0.16; sun.intensity = lightOn ? 1.5 : 0.04; fill.intensity = lightOn ? 0.5 : 0;
  scene.background.set(lightOn ? '#e7e3dc' : '#14161b');
  const b = document.getElementById('lightBtn'); b.classList.toggle('off', !lightOn); b.textContent = lightOn ? '💡 Свет' : '🌑 Свет выкл.';
  people.light(lightOn);
  status(lightOn ? 'Свет включён' : 'Свет выключен');
  requestRender();
}
function closeAllHw() { for (const st of hwState.values()) { st.t = 0; st.to = 0; } applyPoses(); }

// ---------------------------------------------------------------- техника: холодильники, плиты, духовки, чайники… (каталог и 3D — appliances.js)
// В проекте техника — элемент kind: 'appliance': полное описание модели в spec (проект не зависит от правок каталога),
// цвет корпуса finish, поворот rot — четверти оборота вокруг вертикали (лицом к нам, вправо, к стене, влево).
// x, y, z, w, h, d — коробка по осям, как у деталей: в неё не заходит мебель, по ней выбирают мышью и меряют линейкой.
const isApp = i => !!i && i.kind === 'appliance';
const panels = () => P.items.filter(i => !isApp(i));
const appState = new Map();          // id техники → { t, to }: насколько открыта (как у фурнитуры)
const appT = id => (appState.get(id) || { t: 0 }).t;
const appModels = new Map();         // id → { key, model, motion }: 3D-модель строится один раз
const hitMat = new THREE.MeshBasicMaterial({ visible: false });
const appSelMat = new THREE.LineBasicMaterial({ color: 0xd9850f });
const hitGeos = new Map();
const catName = c => (APP_CATS.find(x => x[0] === c) || [0, 'Своя техника'])[1];
// Коробка после поворота: размеры по осям и где в ней начало модели
function appGeom(spec, rot) {
  const b = appBox(spec), r = (((rot | 0) % 4) + 4) % 4, c = [1, 0, -1, 0][r], s = [0, 1, 0, -1][r];
  const xs = [], zs = [];
  for (const x of [b.ox, b.ox + b.w]) for (const z of [b.oz, b.oz + b.d]) { xs.push(x * c + z * s); zs.push(-x * s + z * c); }
  const ax0 = Math.min(...xs), az0 = Math.min(...zs);
  return { w: r1(Math.max(...xs) - ax0), h: r1(b.h), d: r1(Math.max(...zs) - az0), ax0, oy: b.oy, az0, r };
}
function appMesh(it, selected) {
  const G = appGeom(it.spec, it.rot), k = `${it.w}|${it.h}|${it.d}`;
  if (!hitGeos.has(k)) { if (hitGeos.size > 200) hitGeos.clear(); hitGeos.set(k, new THREE.BoxGeometry(Math.max(it.w, 1), Math.max(it.h, 1), Math.max(it.d, 1))); }
  const mesh = new THREE.Mesh(hitGeos.get(k), hitMat);   // невидимая коробка: по ней выбираем мышью и меряем линейкой
  mesh.position.set(it.x + it.w / 2, it.y + it.h / 2, it.z + it.d / 2);
  mesh.userData.id = it.id;
  const key = JSON.stringify([it.spec, it.finish || '']);
  let c = appModels.get(it.id);
  if (!c || c.key !== key) { const model = buildAppliance(it.spec, it.finish); c = { key, model, motion: hasMotion(model) }; appModels.set(it.id, c); }
  c.model.rotation.set(0, G.r * Math.PI / 2, 0);
  c.model.position.set(-it.w / 2 - G.ax0, -it.h / 2 - G.oy, -it.d / 2 - G.az0);
  mesh.add(c.model);
  poseAppliance(c.model, appT(it.id));
  if (selected) { const e = new THREE.LineSegments(edgeGeo, appSelMat); e.scale.set(Math.max(it.w, 1), Math.max(it.h, 1), Math.max(it.d, 1)); mesh.add(e); }
  return mesh;
}
function setApp(ids, to) {
  for (const id of ids) { const st = appState.get(id) || { t: 0, to: 0 }; st.to = to; appState.set(id, st); }
  if (!animating) { animating = true; requestAnimationFrame(animateHw); }
}
// Открыть / закрыть фурнитуру и технику вместе: что-то закрыто — открываем всё, иначе закрываем
function toggleMotion(hwIds, appIds) {
  const apps = appIds.filter(id => appModels.get(id)?.motion && !solid(id));
  if (!apps.length) return toggleHw(hwIds);
  const hws = hwIds.filter(id => { const h = P.hw.find(x => x.id === id); return h && hasAction(h.type) && !solid(h.target); });
  const to = [...hws.map(id => hwState.get(id)), ...apps.map(id => appState.get(id))].some(st => !st || st.to < 1) ? 1 : 0;
  if (peopleOn()) return people.operate([...hwOps(hws, to), ...apps.map(id => appOp(id, to)).filter(Boolean)]);
  if (hws.length) setHw(hws, to);
  setApp(apps, to);
}

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
    const list = attachedClosure(selItems());
    drag = { snap: snapshot(), start: list.map(i => [i.id, i.x, i.y, i.z]), box: bbox(selItems()), pivot: pivot.position.clone(), moved: false };
  } else if (drag) {
    if (drag.moved) {
      const off = detachFar(new Set(drag.start.map(s => s[0])));
      undoStack.push(drag.snap); redoStack.length = 0; afterChange();
      if (off.length) status(`Отсоединилось: ${off.map(h => describeHw(h, item(h.target))).join('; ')}`);
    }
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
  const movedIds = new Set(drag.start.map(s => s[0]));
  for (const m of itemsGroup.children) {
    const it = item(m.userData.id);
    if (movedIds.has(it.id)) m.position.set(it.x + it.w / 2, it.y + it.h / 2, it.z + it.d / 2);
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
    for (const o of obstacles()) cands.push(o[key], o[key] + o[dim]);
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
  if (measure || (bucket.open && bucket.decor) || ruler.on) { tc.detach(); requestRender(); return; }
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
  if (isApp(k.it)) return status(APP_NO_OPS);
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
// ---------------------------------------------------------------- линейка
const _sv = new THREE.Vector3();
const ruler = createRuler({
  scene, vp, P: () => P, item, label: i => label(i), commit: f => commit(f), status: t => status(t), render: requestRender,
  raycast(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    const shown = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
    return ray.intersectObjects([...itemsGroup.children, ...roomGroup.children], true).find(h => h.object.isMesh && shown(h.object) && (h.object.userData.id || h.object.userData.surface)) || null;
  },
  toScreen(v) { const r = renderer.domElement.getBoundingClientRect(); _sv.copy(v).project(camera); return new THREE.Vector2((_sv.x + 1) / 2 * r.width, (1 - _sv.y) / 2 * r.height); },
  viewDir() { return camera.getWorldDirection(new THREE.Vector3()).negate(); },
});
renderer.domElement.addEventListener('pointermove', e => { if (ruler.on && !e.buttons) ruler.move(e); });
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
  if (e.button === 0 && (boxMode || e.ctrlKey) && tc.axis === null && !measure && !ruler.on) {
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
  for (const it of P.items) if (sel.has(it.id) && solid(it.id)) groupItems(it.g).forEach(x => sel.add(x.id));   // монолит — только целиком
  openGroup = 0;
  selectionChanged();
  status(n ? `Выделено деталей: ${sel.size}. «Объединить в модуль» (Ctrl+G) — сделать из них шкаф, полку и т. д.` : 'В рамку ничего не попало');
});
renderer.domElement.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, gizmo: !!tc.object && tc.axis !== null, btn: e.button }; });
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
  if (ruler.on) return ruler.click(e);
  if (basePick) { if (hit) finishBasePick(hit); else { basePick = null; status('Присоединение отменено'); } return; }
  if (bucket.open && bucket.decor) return bucketClick(e);
  if (!hit) { if (!e.shiftKey) { sel.clear(); openGroup = 0; } }
  else {
    const it = item(hit);
    const ids = it.g && (it.g !== openGroup || solid(it.id)) ? groupItems(it.g).map(i => i.id) : [it.id];
    if (it.g !== openGroup) openGroup = 0;
    if (e.shiftKey) { const all = ids.every(id => sel.has(id)); ids.forEach(id => all ? sel.delete(id) : sel.add(id)); }
    else { sel.clear(); ids.forEach(id => sel.add(id)); }
  }
  selectionChanged();
});
renderer.domElement.addEventListener('dblclick', e => {
  if (ruler.on) return ruler.dblclick();
  const hit = pick(e);
  if (!hit) return;
  const it = item(hit);
  if (solid(it.id)) { sel.clear(); groupItems(it.g).forEach(i => sel.add(i.id)); openGroup = 0; selectionChanged(); return status(`«${group(it.g).name}» — один предмет: детали не разделяются. Чтобы менять отдельные детали — в свойствах «Как объединено: Сборка» или «Разобрать»`); }
  if ((sel.size === 1 && sel.has(it.id)) || (!it.g && openGroup === 0)) return partEditor(it.id);   // уже выбрана — открываем окно детали
  openGroup = it.g || 0;
  sel.clear(); sel.add(it.id);
  selectionChanged();
  if (it.g) status(`Модуль «${group(it.g).name}» открыт: выбирайте отдельные детали. Двойной клик по детали ещё раз — окно детали. Клик мимо — выйти.`);
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
  for (const c of cands) for (const o of solidsAll()) if (!exclude.has(o.id) && hits(c, o)) return o;
  return null;
}
function clashedBefore(list) {
  const out = new Set(list.map(i => i.id));
  for (const i of list) for (const o of solidsAll()) if (!out.has(o.id) && hits(i, o)) out.add(o.id);
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
      for (const o of solidsAll()) {
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
  // Срез боковин под углом (мансарда, лестница, скошенный угол): угол боковины срезается по линии «длина по глубине + градусы»
  const sc = p.sideCut;
  if (sc && sc.where && sc.where !== 'none' && sc.a > 0 && sc.deg > 0 && sc.deg < 89) {
    const b = r1(sc.a * Math.tan(sc.deg * Math.PI / 180));
    out.filter(o => o.role === 'sideL' || o.role === 'sideR').forEach(o => { o.ops.push({ type: 'corner', corner: sc.where, shape: 'angle', a: Math.min(sc.a, o.d), deg: sc.deg, b: Math.min(b, o.h), tag: 'sidecut' }); });
  }
  return out;
}
const SIDE_CUTS = [['none', 'без среза'], ['RT', 'спереди сверху'], ['RB', 'спереди снизу'], ['LT', 'сзади сверху (мансарда)'], ['LB', 'сзади снизу']];

// Автоприсадка корпуса: конфирматы (боковины ↔ дно, крыша, царги), полкодержатели, петли с ответными планками.
// Отверстия помечены tag, чтобы петли можно было заменить, не трогая остальное.
function hingeCount(h, p) { return +p.hinge.count || (h <= 900 ? 2 : h <= 1600 ? 3 : h <= 2000 ? 4 : 5); }
function drillCabinet(parts, p, kinds) {
  const by = role => parts.filter(i => i.role === role);
  const L = by('sideL')[0], R = by('sideR')[0];
  if (!L || !R) return false;
  const t = L.w, D = L.d, y0 = L.y, cz = L.z;
  const push = (it, op) => { (it.ops = it.ops || []).push({ count: 1, step: 32, dir: 'u', ...op }); };
  const nConf = +p.confCount || 0;   // 0 — авто: 2 при глубине до 350 мм, иначе 3
  const along = d => { const n = nConf || (d <= 350 ? 2 : 3); return n === 1 ? [Math.round(d / 2)] : Array.from({ length: n }, (_, k) => Math.round(50 + (d - 100) * k / (n - 1))); };
  const pin = +p.pinOff || 37;
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
      for (const z of [pin, sh.d - pin]) {
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
// Ставит фурнитуру корпуса. Отверстия петель (чашки + планки на боковинах) переходят к самим петлям:
// удалили или заменили петлю — пропали и её отверстия. Детали корпуса уже должны быть в P.items.
function attachCabinetHardware(parts, p, onlyHinges) {
  const hws = cabinetHardware(parts, p).filter(h => !onlyHinges || HW_TYPES[h.type].cat === 'hinges');
  P.hw.push(...hws);
  // вторая сторона: петли — к боковинам, шины — к боковинам рядом с коробом (детали корпуса уже стоят вплотную)
  for (const h of hws) if (baseNeeded(h.type)) { const f = findBase(h, item(h.target), P.items, 4); h.base = f ? f.part.id : null; }
  const hinges = hws.filter(h => HW_TYPES[h.type].cat === 'hinges');
  if (hinges.length && p.drill !== false) {
    parts.forEach(i => { i.ops = (i.ops || []).filter(o => o.tag !== 'hinge'); });
    hinges.forEach(h => { h.drill = '1'; h.plate = '1'; hwSync(h, item(h.target)); });
  }
  if (p.drill !== false) hws.filter(h => HW_TYPES[h.type].cat !== 'hinges').forEach(h => hwSync(h, item(h.target)));   // направляющие: отверстия на боковинах корпуса
}
// Заменить петли у готового корпуса (остальная обработка остаётся)
function applyHingesFromInspector() {
  const k = kindOfSelection(); if (k.type !== 'group' || !k.g.params) return;
  const q = key => insp.querySelector(`[data-k="${key}"]`);
  const hinge = { type: q('htype').value, side: q('hside').value, off: parseFloat(q('hoff').value) || 100, count: parseInt(q('hcount').value, 10) || 0 };
  if (!k.list.some(i => i.role === 'sideL')) return status('У этого модуля нет разметки деталей — нажмите «Перестроить корпус»');
  commit(() => {
    k.g.params = { ...k.g.params, hinge };
    const doors = new Set(k.list.filter(i => i.role === 'door').map(i => i.id));
    const old = P.hw.filter(h => doors.has(h.target) && HW_TYPES[h.type].cat === 'hinges').map(h => 'hw' + h.id);
    k.list.forEach(i => { i.ops = (i.ops || []).filter(o => o.tag !== 'hinge' && !old.includes(o.tag)); });
    P.hw = P.hw.filter(h => !(doors.has(h.target) && HW_TYPES[h.type].cat === 'hinges'));
    attachCabinetHardware(k.list, k.g.params, true);
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
  const idMap = new Map(), baseFix = [];
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
        if (nh.base) baseFix.push(nh);
        c.ops = (c.ops || []).map(o => o.tag === 'hw' + h.id ? { ...o, tag: 'hw' + nh.id } : o);
        P.hw.push(nh);
      }
      P.items.push(c); sel.add(c.id); idMap.set(i.id, c.id);
    }
    // сторона Б копии: к скопированной детали, если её тоже скопировали, иначе свободна
    for (const h of baseFix) h.base = idMap.get(h.base) || null;
  });
  status('Копия поставлена справа');
}
function groupSel() {
  const list = selItems(); if (list.length < 2) return status('Выделите несколько деталей: рамкой (Ctrl + тянуть мышью) или Shift + клик');
  const b = bbox(list);
  openDialog(`Объединить ${list.length} деталей`, `
    <div class="grid3">${fld('Что это', 'gk', 'cabinet', { options: Object.entries(KIND_NAMES) })}${fld('Название', 'gn', '', { text: true })}</div>
    <div class="modes">${GROUP_MODES.map((m, k) => `<label class="modecard"><input type="radio" name="gmode" value="${m.id}"${k ? '' : ' checked'}><b>${m.icon} ${m.name}</b><span>${esc(m.note)}</span></label>`).join('')}</div>
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
    const mode = (body.querySelector('[name="gmode"]:checked') || {}).value === 'solid' ? 'solid' : 'assembly';
    closeDialog();
    commit(() => { const g = { id: nid(), name, kind, mode }; P.groups.push(g); list.forEach(i => { i.g = g.id; }); openGroup = 0; });
    status(`Объединено: ${name} (${KIND_NAMES[kind]}, ${mode === 'solid' ? 'один предмет' : 'сборка'})`);
  };
}
function ungroupSel() {
  const list = selItems(); if (!list.some(i => i.g)) return;
  commit(() => { list.forEach(i => { i.g = 0; }); openGroup = 0; });
}
// Двигаем деталь — с ней едет всё, что к ней присоединено стороной Б (дверь на петлях к боковине, ящик к шинам…)
function attachedClosure(list) {
  const ids = new Set(list.map(i => i.id));
  for (let grew = true; grew;) {
    grew = false;
    for (const h of P.hw) {
      if (!h.base || !ids.has(h.base) || ids.has(h.target)) continue;
      for (const id of [h.target, ...movingIds(h, P.items)]) if (!ids.has(id) && item(id)) { ids.add(id); grew = true; }
    }
  }
  return P.items.filter(i => ids.has(i.id));
}
// После перемещения: фурнитура, у которой сторона Б осталась далеко, отсоединяется (как петля, вынутая из планки)
function detachFar(movedIds) {
  const off = [];
  for (const h of P.hw) {
    if (!h.base || movedIds.has(h.target) === movedIds.has(h.base)) continue;
    const it = item(h.target), b = item(h.base);
    if (it && b && !findBase(h, it, P.items, 40, b)) { h.base = null; off.push(h); }
  }
  return off;
}
function moveSel(dx, dy, dz) {
  if (!sel.size) return;
  const list = attachedClosure(selItems());
  const { d, hit } = clampMove(list, [dx, dy, dz], clashedBefore(list));
  if (hit && d.every(v => v === 0)) { status(`Не помещается: мешает ${who(hit)}`); refreshInspector(); return; }
  let off = [];
  commit(() => { list.forEach(i => { i.x = r1(i.x + d[0]); i.y = r1(i.y + d[1]); i.z = r1(i.z + d[2]); }); off = detachFar(new Set(list.map(i => i.id))); });
  if (hit) status(`Упёрлось в ${who(hit)} — поставлено вплотную`);
  else if (off.length) status(`Отсоединилось: ${off.map(h => describeHw(h, item(h.target))).join('; ')} — сторона Б осталась на месте`);
  else if (list.length > sel.size) status(`Вместе с выбранным переехали присоединённые детали: ${list.length - sel.size} шт.`);
}
// Поворот на 90°: меняются местами размеры по двум осям, деталь поворачивается вокруг своего центра
function rotateSel(axis) {
  const list = selItems(); if (!list.length) return;
  if (axis !== 'y' && list.some(isApp)) return status('Технику можно только поворачивать вокруг вертикали — «⟲ Повернуть»');
  if (list.some(i => i.ops && i.ops.length)) return status('Деталь с отверстиями и вырезами не поворачивается — обработка привязана к её сторонам');
  if (list.some(i => hwOf(i.id).length)) return status('Деталь с фурнитурой не поворачивается — сначала удалите фурнитуру');
  const b = bbox(list), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, cz = (b.z0 + b.z1) / 2;
  const ex = clashedBefore(list);
  const turn = (i) => {
    const mx = i.x + i.w / 2, my = i.y + i.h / 2, mz = i.z + i.d / 2;
    if (axis === 'y') { [i.w, i.d] = [i.d, i.w]; const nx = cx + (mz - cz), nz = cz - (mx - cx); i.x = r1(nx - i.w / 2); i.z = r1(nz - i.d / 2); }
    if (axis === 'z') { [i.w, i.h] = [i.h, i.w]; const nx = cx - (my - cy), ny = cy + (mx - cx); i.x = r1(nx - i.w / 2); i.y = r1(ny - i.h / 2); }
    if (axis === 'x') { [i.h, i.d] = [i.d, i.h]; const ny = cy - (mz - cz), nz = cz + (my - cy); i.y = r1(ny - i.h / 2); i.z = r1(nz - i.d / 2); }
    if (isApp(i)) i.rot = ((i.rot | 0) + 1) % 4;   // техника поворачивается вместе с моделью: лицом вправо, к стене, влево
  };
  const trial = list.map(i => { const c = { ...i }; turn(c); return c; });
  const hit = noClash() && clash(trial, ex);
  if (hit) return status(`Повернуть нельзя: после поворота войдёт в ${who(hit)}`);
  commit(() => list.forEach(turn));
}
// Смена материала: если толщина другая — меняем самый тонкий размер детали
function setMaterial(list, id) {
  const m = mat(id);
  list.filter(i => !isApp(i)).forEach(i => {
    const old = mat(i.mat).t;
    i.mat = id;
    if (old !== m.t) { const k = ['w', 'h', 'd'].reduce((a, c) => i[c] < i[a] ? c : a, 'w'); if (Math.abs(i[k] - old) < 0.01) i[k] = m.t; }
  });
}

// ---------------------------------------------------------------- заливка (как в Paint): выбрать декор и кликать детали, пол, стены
const bucket = { open: false, decor: null, tab: 'ldsp', sub: '', q: '' };
const palEl = document.createElement('div'); palEl.className = 'palette'; palEl.hidden = true; vp.appendChild(palEl);
const tabOf = id => DECOR[id] && (DECOR[id].tab === 'floor' || DECOR[id].tab === 'wall' ? DECOR[id].tab : 'body');
function openPalette(tab) {
  bucket.open = true; if (tab) { bucket.tab = tab; bucket.sub = ''; }
  palEl.hidden = false; vp.classList.toggle('bucket', !!bucket.decor); drawPalette();
}
function closePalette() { bucket.open = false; palEl.hidden = true; vp.classList.remove('bucket'); updateGizmo(); }
function drawPalette() {
  const list = DECORS.filter(d => bucket.q ? (d.name + ' ' + d.sub + ' ' + (d.mat || '')).toLowerCase().includes(bucket.q) : d.tab === bucket.tab && (!bucket.sub || d.sub === bucket.sub));
  const subs = [...new Set(DECORS.filter(d => d.tab === bucket.tab).map(d => d.sub))];
  const cur = bucket.decor && DECOR[bucket.decor], where = cur && tabOf(cur.id);
  const hint = !cur ? 'Выберите цвет или покрытие, потом кликайте по деталям, полу или стенам.'
    : where === 'floor' ? 'Кликните по полу — покрытие ляжет на весь пол.'
    : where === 'wall' ? 'Кликните по стене — покрасится только она. <kbd>Shift</kbd> + клик — все стены.'
    : 'Кликните деталь — она окрасится. <kbd>Shift</kbd> + клик — все детали модуля того же цвета (заливка).';
  palEl.innerHTML = `<div class="pal-head"><b>🪣 Материалы и заливка</b><span class="grow"></span><span class="note">${DECORS.length} шт.</span><button data-pclose title="Закрыть (Esc)">×</button></div>
    <div class="pal-tabs">${TABS.map(([id, n]) => `<button class="${id === bucket.tab && !bucket.q ? 'on' : ''}" data-ptab="${id}">${n}</button>`).join('')}</div>
    ${bucket.q ? '' : `<div class="pal-subs">${subs.length > 1 ? ['', ...subs].map(sb => `<button class="${sb === bucket.sub ? 'on' : ''}" data-psub="${esc(sb)}">${esc(sb || 'Все')}</button>`).join('') : ''}</div>`}
    <input class="pal-q" type="search" placeholder="Поиск: дуб, RAL 7016, мрамор…" value="${esc(bucket.q)}">
    <div class="pal-cur">${cur ? `<img class="${cur.img ? 'ph' : ''}" src="${decorThumb(cur.id)}" alt=""><div><b>${esc(cur.name)}</b><div class="note">${esc(cur.mat || (cur.tab === 'floor' ? 'Пол' : 'Стены'))} · ${esc(cur.sub)}</div></div>${where === 'body' ? '<button class="accent" data-papply>К выбранным</button>' : ''}` : '<div class="note">Цвет не выбран</div>'}</div>
    <div class="note">${hint}</div>
    <div class="pal-grid">${list.map(d => `<button class="psw${d.id === bucket.decor ? ' on' : ''}" data-decor="${d.id}" title="${esc(d.name)}"><img loading="lazy" class="${d.img ? 'ph' : ''}" src="${decorThumb(d.id)}" alt=""><span>${esc(d.name)}</span></button>`).join('') || '<div class="note">Ничего не найдено</div>'}</div>`;
  vp.classList.toggle('bucket', !!cur);
  updateGizmo();
}
palEl.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  const d = t.dataset;
  if ('pclose' in d) return closePalette();
  if (d.ptab) { bucket.tab = d.ptab; bucket.sub = ''; bucket.q = ''; }
  else if (d.psub !== undefined) bucket.sub = d.psub;
  else if (d.decor) bucket.decor = d.decor;
  else if ('papply' in d) { const list = selItems().filter(i => !isApp(i)); if (!list.length) return status('Сначала выберите детали'); paintItems(list, bucket.decor); }
  drawPalette();
});
palEl.addEventListener('input', e => { if (!e.target.classList.contains('pal-q')) return; bucket.q = e.target.value.trim().toLowerCase(); const pos = e.target.selectionStart; drawPalette(); const q = palEl.querySelector('.pal-q'); q.focus(); q.setSelectionRange(pos, pos); });
palEl.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') closePalette(); });
palEl.addEventListener('pointerdown', e => e.stopPropagation());
// Материал проекта для декора той же толщины, что у детали (толщина детали не меняется)
function decorMaterial(id, t) {
  let m = P.materials.find(x => x.decor === id && x.t === t);
  if (!m) { const d = DECOR[id]; m = { id: `d_${id}_${t}`, name: `${d.mat || ''} ${d.name}`.trim(), color: d.hex, t, decor: id }; P.materials.push(m); }
  return m.id;
}
function paintItems(list, id) {
  commit(() => list.forEach(i => { i.mat = decorMaterial(id, mat(i.mat).t); }));
  status(`${DECOR[id].name}: ${list.length === 1 ? label(list[0]) : list.length + ' дет.'}`);
}
// Клик кистью: что под мышкой — деталь, пол, стена (видимые)
function bucketClick(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const shown = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
  const hit = ray.intersectObjects([...itemsGroup.children, ...roomGroup.children], true).find(h => shown(h.object) && (h.object.userData.id || h.object.userData.surface));
  if (!hit) return status('Мимо: кликните по детали, полу или стене');
  const o = hit.object.userData, id = bucket.decor, where = tabOf(id), d = DECOR[id];
  if (o.id) {
    if (where !== 'body') return status(`«${d.name}» — покрытие для ${where === 'floor' ? 'пола' : 'стен'}. Для деталей выберите вкладку ЛДСП, ЛМДФ, акрил…`);
    const it = item(o.id);
    if (isApp(it)) return status('Это техника: цвет корпуса (белый, нержавейка, чёрный…) — в её свойствах справа');
    let list = [it];
    if (e.shiftKey && it.g) list = groupItems(it.g).filter(x => x.mat === it.mat && !isApp(x));   // заливка: весь модуль того же цвета
    if (solid(it.id) && !e.shiftKey) list = groupItems(it.g).filter(x => x.mat === it.mat && !isApp(x));
    return paintItems(list, id);
  }
  if (o.surface === 'floor') {
    if (where !== 'floor') return status('Это пол: выберите покрытие на вкладке «Пол»');
    commit(() => { P.room.floor = id; });
    return status('Пол: ' + d.name);
  }
  if (o.surface === 'wall' || o.surface === 'column') {
    if (where !== 'wall') return status('Это стена: выберите покрытие на вкладке «Стены»');
    commit(() => { if (e.shiftKey || o.surface === 'column') { P.room.wall = id; P.room.wallMats = {}; } else P.room.wallMats = { ...P.room.wallMats, [o.wall]: id }; });
    return status(e.shiftKey || o.surface === 'column' ? 'Все стены: ' + d.name : `Стена ${o.wall + 1}: ${d.name}`);
  }
}

// ---------------------------------------------------------------- левая панель: список модулей и деталей
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const label = i => i.name || (isApp(i) ? i.spec.name : KINDS[i.kind]) || 'Деталь';
const dims = i => `${fmt(i.w)}×${fmt(i.h)}×${fmt(i.d)}`;
function refreshTree() {
  const el = document.getElementById('tree');
  if (!P.items.length) {
    el.innerHTML = '<div class="empty">Пусто. Нажмите <b>＋ Корпус</b>, чтобы собрать шкаф из деталей, или добавьте отдельную деталь.</div>';
    return;
  }
  let h = '';
  const node = (i, child) => `<div class="node ${child ? 'child' : ''} ${sel.has(i.id) ? 'sel' : ''}" data-item="${i.id}"><span class="sw" style="background:${isApp(i) ? finishColor(i.finish) : mat(i.mat).color}"></span>${isApp(i) ? '🔌 ' : ''}${esc(label(i))}<span class="dim">${fmt(i.w)}×${fmt(i.h)}</span></div>`;
  for (const g of P.groups) {
    const list = groupItems(g.id), all = list.every(i => sel.has(i.id)), b = bbox(list);
    h += `<div class="node grp ${all ? 'sel' : ''}" data-group="${g.id}"><span>${g.mode === 'solid' ? '■' : '▸'} ${esc(g.name)}</span><span class="dim">${fmt(b.x1 - b.x0)}×${fmt(b.y1 - b.y0)}</span>${g.kind ? `<span class="kind">${esc(KIND_NAMES[g.kind] || g.kind)}${g.mode === 'solid' ? ' · один предмет' : ' · сборка'}</span>` : ''}</div>`;
    if (g.mode !== 'solid' && (openGroup === g.id || list.some(i => sel.has(i.id)))) list.forEach(i => { h += node(i, true); });   // выбран модуль — видны его детали, клик выбирает одну (из модуля она не выходит)
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
// Всё о детали: свойства, размеры, обработка, фурнитура — общее для правой панели и окна детали
function itemPanel(i) {
  return `<div class="sec"><b>Деталь</b>${fld('Название', 'name', label(i), { text: true })}
      <div class="row2">${fld('Тип', 'kind', i.kind, { options: Object.entries(KINDS) })}${fld('Материал', 'mat', i.mat, { options: matOptions() })}</div>
      <div class="btns"><button data-cmd="paint" title="Каталог декоров: кликните цвет, потом деталь">🪣 Цвет из каталога (${DECORS.length})</button></div></div>
      <div class="sec"><b>Размеры, мм</b><div class="row">${fld('Ширина (X)', 'w', i.w)}${fld('Высота (Y)', 'h', i.h)}${fld('Глубина (Z)', 'd', i.d)}</div></div>
      <div class="sec"><b>Положение, мм</b><div class="row">${fld('X слева', 'x', i.x)}${fld('Y от пола', 'y', i.y)}${fld('Z от стены', 'z', i.z)}</div></div>
      <div class="sec"><b>Обработка${(i.ops || []).length ? ` (${i.ops.length})` : ''}</b>
      ${(i.ops || []).map((o, k) => `<div class="op"><span>${k + 1}. ${esc(describeOp(o, i))}</span><button data-op-edit="${k}" title="Изменить">✎</button><button data-op-del="${k}" title="Удалить">✕</button></div>`).join('') || '<div class="note">Отверстий и вырезов нет.</div>'}
      <div class="btns"><button data-cmd="op-hole">＋ Отверстие</button><button data-cmd="op-cut">＋ Вырез / паз</button><button data-cmd="op-corner">＋ Срез / скругление угла</button><button data-cmd="op-shape" title="Любая форма: точки, острые или скруглённые углы, плавная кривая">＋ Вырез по точкам</button><button data-cmd="op-bevel" title="Торец под углом через толщину, например 45° «на ус»">＋ Скос кромки под углом</button><button class="accent" data-cmd="op-mill" title="Готовые фрезеровки: ручки, соединения, пазы, декор, вырезы под технику">⚙ Фрезеровка…</button></div>
      <div class="btns"><button data-cmd="measure-hole" title="Наведите мышь на деталь — видно расстояния до краёв, клик ставит отверстие">📏 Разметить отверстие</button><button data-cmd="measure-cut" title="Клик ставит левый нижний угол выреза">📏 Разметить вырез</button><button class="accent" data-cmd="drawing">Чертёж</button></div></div>
      <div class="sec"><b>Фурнитура${hwOf(i.id).length ? ` (${hwOf(i.id).length})` : ''}</b>
      ${hwOf(i.id).map(h => `<div class="op hwrow"><span>${esc(describeHw(h, i))}${baseNeeded(h.type) ? (h.base && item(h.base) ? `<br><small class="base">🔗 сторона Б — ${esc(who(item(h.base)))}</small>` : '<br><small class="warn">⚠ вторая сторона свободна</small>') : ''}</span>${hasAction(h.type) ? `<button class="accent" data-hw-act="${h.id}">${actionLabels(h.type)[(hwState.get(h.id) || { to: 0 }).to > 0 ? 1 : 0]}</button>` : '<i></i>'}<button data-hw-edit="${h.id}" title="Изменить">✎</button><button data-hw-place="${h.id}" title="Где стоит — окно с видом детали">📍</button><button data-hw-del="${h.id}" title="Удалить">✕</button>${baseNeeded(h.type) ? `<button data-hw-base="${h.id}" title="Присоединить вторую сторону к другой детали (магнит)">🧲</button>` : ''}</div>`).join('') || '<div class="note">Фурнитуры нет.</div>'}
      ${i.link ? `<div class="note">Двигается вместе со связанными деталями (${P.items.filter(x => x.link === i.link).length} шт.).</div>` : ''}
      <div class="btns"><button class="accent" data-cmd="hw">＋ Фурнитура</button></div></div>`;
}
function refreshInspector() {
  const k = kindOfSelection();
  const title = document.getElementById('inspTitle');
  let h = '';
  if (k.type === 'none') {
    title.textContent = 'Проект';
    h += `<div class="sec"><b>Проект</b>${fld('Название', 'pname', P.name, { text: true })}
      <div class="note">Комната: ${P.room.pts.length} ${P.room.pts.length > 4 ? 'стен' : 'стены'}, ${fmt(P.room.w / 10)} × ${fmt(P.room.d / 10)} см, высота ${fmt(P.room.h / 10)} см${P.room.openings.length ? `, проёмов: ${P.room.openings.length}` : ''}${P.room.columns.length ? `, колонн: ${P.room.columns.length}` : ''}</div>
      <div class="btns"><button class="accent" data-cmd="room">🏠 Комната: стены, окна, двери, колонны…</button></div></div>
      <div class="sec"><b>Как работать</b><div class="note">
      <b>＋ Корпус</b> — шкаф из деталей по размерам.<br>Клик — выбрать модуль, <b>двойной клик</b> — деталь внутри него.<br>
      Тяните цветные стрелки или вводите размеры справа.<br>
      <kbd>←</kbd><kbd>→</kbd> X, <kbd>↑</kbd><kbd>↓</kbd> высота, <kbd>PgUp</kbd><kbd>PgDn</kbd> глубина (с <kbd>Shift</kbd> — ×10)<br>
      <kbd>Ctrl+D</kbd> копия, <kbd>Del</kbd> удалить, <kbd>Ctrl+G</kbd> в модуль, <kbd>Ctrl+Z</kbd> отменить, <kbd>F</kbd> показать<br>
      Мышь: левая — вращать, правая — сдвигать вид, колесо — приблизить.</div></div>`;
  } else if (k.type === 'item' && isApp(k.it)) {
    title.textContent = 'Техника';
    h += `<div class="btns"><button class="accent" data-cmd="part-edit" title="Всё о технике в одном окне: чертёж, ниша, как открывается (или двойной клик, Enter)">✎ Окно техники</button></div>${appPanel(k.it)}${appActions(k.it, false)}`;
  } else if (k.type === 'item') {
    const i = k.it;
    title.textContent = 'Деталь';
    h += `<div class="btns"><button class="accent" data-cmd="part-edit" title="Всё о детали в одном окне (или двойной клик по выбранной детали, Enter)">✎ Изменить в окне</button></div>${itemPanel(i)}
      <div class="sec"><b>Действия</b><div class="btns"><button data-cmd="rot-y">⟲ Повернуть</button><button data-cmd="rot-z">⤾ Положить</button><button data-cmd="duplicate">Копия</button>
      ${i.g ? '<button data-cmd="ungroup">Вынуть из модуля</button>' : ''}<button class="danger" data-cmd="delete">Удалить</button></div></div>`;
  } else {
    const b = bbox(k.list);
    title.textContent = k.type === 'group' ? 'Модуль' : `Выбрано: ${k.list.length}`;
    if (k.type === 'group') h += `<div class="sec"><b>Модуль</b>${fld('Название', 'gname', k.g.name, { text: true })}${fld('Что это', 'gkind', k.g.kind || 'other', { options: Object.entries(KIND_NAMES) })}
      ${fld('Как объединено', 'gmode', k.g.mode === 'solid' ? 'solid' : 'assembly', { options: GROUP_MODES.map(m => [m.id, m.name]) })}
      <div class="note">${esc(GROUP_MODES.find(m => m.id === (k.g.mode === 'solid' ? 'solid' : 'assembly')).note)}</div></div>`;
    h += `<div class="sec"><b>Габарит, мм</b><div class="row">${fld('Ширина', '-', b.x1 - b.x0, { ro: true })}${fld('Высота', '-', b.y1 - b.y0, { ro: true })}${fld('Глубина', '-', b.z1 - b.z0, { ro: true })}</div></div>
      <div class="sec"><b>Положение, мм</b><div class="row">${fld('X слева', 'bx', b.x0)}${fld('Y от пола', 'by', b.y0)}${fld('Z от стены', 'bz', b.z0)}</div></div>
      <div class="sec"><b>Материал</b><div class="row2">${fld('Корпус', 'mBody', '', { options: [['', '— не менять —'], ...matOptions()] })}${fld('Фасады', 'mFront', '', { options: [['', '— не менять —'], ...matOptions()] })}</div></div>`;
    if (k.type === 'group' && k.g.params) {
      const p = k.g.params;
      h += `<div class="sec"><b>Параметры корпуса</b><div class="row">${fld('Ширина', 'pW', p.W)}${fld('Высота', 'pH', p.H)}${fld('Глубина', 'pD', p.D)}</div>
        <div class="row">${fld('Полки', 'pshelves', p.shelves)}${fld('Двери', 'pdoors', p.doors)}${fld('Ящики', 'pdrawers', p.drawers)}</div>
        <div class="row2">${fld('Цоколь', 'pplinth', p.plinth)}${fld('Верх', 'ptopType', p.topType, { options: [['solid', 'Крыша'], ['rails', 'Царги']] })}</div>
        <div class="row">${fld('Срез боковин', 'pscw', (p.sideCut || {}).where || 'none', { options: SIDE_CUTS })}${fld('Длина, мм', 'psca', (p.sideCut || {}).a || 200)}${fld('Угол, °', 'pscd', (p.sideCut || {}).deg || 45)}</div>
        <div class="row">${fld('Присадка', 'pdrill', p.drill === false ? '0' : '1', { options: [['1', 'Автоматически'], ['0', 'Без отверстий']] })}${fld('Конфирматов', 'pconfCount', String(p.confCount || 0), { options: [['0', 'авто'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']] })}${fld('Полкодерж. от края', 'ppinOff', p.pinOff || 37)}</div>
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
        ${hwHere.map(x => `<div class="op hwrow"><span>${esc(describeHw(x, item(x.target)))}<br><small class="base">на «${esc(label(item(x.target)))}»${x.base && item(x.base) ? ` · Б — ${esc(label(item(x.base)))}` : ''}</small></span>${hasAction(x.type) ? `<button class="accent" data-hw-act="${x.id}">${actionLabels(x.type)[(hwState.get(x.id) || { to: 0 }).to > 0 ? 1 : 0]}</button>` : '<i></i>'}<button data-hw-edit="${x.id}" title="Изменить">✎</button><button data-hw-place="${x.id}" title="Где стоит">📍</button><button data-hw-del="${x.id}" title="Удалить">✕</button></div>`).join('')}
        <div class="btns">${hwHere.some(x => hasAction(x.type)) ? '<button class="accent" data-cmd="hw-toggle-sel">▶ Открыть / закрыть всё</button>' : ''}<button data-cmd="hw">＋ Фурнитура</button></div></div>`;
    } else h += `<div class="sec"><b>Фурнитура</b><div class="note">Фурнитуры нет.</div><div class="btns"><button class="accent" data-cmd="hw">＋ Фурнитура</button></div></div>`;
    const appsHere = k.list.filter(isApp);
    if (appsHere.length) h += `<div class="sec"><b>Техника: ${appsHere.length} шт.</b><div class="note">${appsHere.map(a => '🔌 ' + esc(label(a))).join('<br>')}</div>${appsHere.some(a => appModels.get(a.id)?.motion) ? '<div class="btns"><button class="accent" data-cmd="hw-toggle-sel">▶ Открыть / закрыть</button></div>' : ''}</div>`;
    h += `<div class="sec"><b>Ящик: фасад + короб</b><div class="note">Только для ящиков: свяжите фасад ящика с его коробом — направляющие выдвинут их вместе.
      Это не объединение в шкаф (для этого — «Объединить в модуль»). Двери, подъёмники и купе всегда двигают только свой фасад.</div>
      <div class="btns"><button data-cmd="link">🔗 Ездят вместе</button><button data-cmd="unlink">Разъединить</button></div></div>`;
    h += `<div class="sec"><b>Действия</b><div class="btns"><button data-cmd="rot-y">⟲ Повернуть</button><button data-cmd="duplicate">Копия</button>
      ${k.type === 'group' ? '<button class="accent" data-cmd="drawing-module">📐 Чертёж шкафа</button><button data-cmd="ungroup" title="Модуль исчезнет, детали станут отдельными">Разобрать</button>' : '<button class="accent" data-cmd="group">Объединить в модуль…</button>'}
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
insp.addEventListener('change', e => inspChange(e));
function inspChange(e) {
  const key = e.target.dataset.k; if (!key || key === '-') return;
  const raw = e.target.value, v = parseFloat(String(raw).replace(',', '.'));
  const k = kindOfSelection();
  const num = () => { if (!isFinite(v)) { refreshInspector(); return false; } return true; };
  if (key === 'pname') return commit(() => { P.name = raw.trim() || 'Проект'; });
  if (k.type === 'item') {
    const i = k.it;
    if (key === 'name') return commit(() => { i.name = raw.trim(); });
    if (isApp(i)) return appChange(i, key, raw, v);
    if (key === 'kind') return commit(() => { i.kind = raw; });
    if (key === 'mat') return commit(() => setMaterial([i], raw));
    if (!num()) return;
    if (['w', 'h', 'd'].includes(key) && v < 1) return refreshInspector();
    if (key === 'x') return moveSel(v - i.x, 0, 0);
    if (key === 'y') return moveSel(0, v - i.y, 0);
    if (key === 'z') return moveSel(0, 0, v - i.z);
    const ms = maxSize(i, key, r1(v));
    if (ms.hit && ms.v <= i[key]) { status(`Не помещается: мешает ${who(ms.hit)}. Максимум — ${fmt(i[key])} мм`); return refreshInspector(); }
    commit(() => { i[key] = r1(ms.v); hwOf(i.id).forEach(h => { if (h.drill !== '0' || HW_TYPES[h.type].cat === 'hinges') hwSync(h, i); }); });   // отверстия фурнитуры — по новому размеру
    if (ms.hit) status(`Больше не помещается — мешает ${who(ms.hit)}. Поставлен максимум: ${fmt(ms.v)} мм`);
    return;
  }
  if (k.type === 'none') return;
  const b = bbox(k.list);
  if (key === 'gname') return commit(() => { k.g.name = raw.trim() || 'Модуль'; });
  if (key === 'gkind') return commit(() => { k.g.kind = raw; });
  if (key === 'gmode') { commit(() => { k.g.mode = raw === 'solid' ? 'solid' : 'assembly'; openGroup = 0; if (raw === 'solid') for (const h of P.hw) if (k.list.some(i => i.id === h.target)) hwState.delete(h.id); }); return status(raw === 'solid' ? 'Теперь это один предмет: детали не разделяются' : 'Теперь это сборка: детали работают отдельно, клик выбирает целиком'); }
  if (key === 'mBody' && raw) return commit(() => setMaterial(k.list.filter(i => !['door', 'drawerFront', 'back'].includes(i.kind) && i.mat !== 'hdf3'), raw));
  if (key === 'mFront' && raw) return commit(() => setMaterial(k.list.filter(i => ['door', 'drawerFront'].includes(i.kind)), raw));
  if (key === 'bx' && num()) return moveSel(v - b.x0, 0, 0);
  if (key === 'by' && num()) return moveSel(0, v - b.y0, 0);
  if (key === 'bz' && num()) return moveSel(0, 0, v - b.z0);
}
insp.addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); e.stopPropagation(); });

function rebuildGroupFromInspector() {
  const k = kindOfSelection(); if (k.type !== 'group' || !k.g.params) return;
  const q = s => insp.querySelector(`[data-k="${s}"]`).value;
  const p = { ...k.g.params };
  for (const f of ['W', 'H', 'D', 'shelves', 'doors', 'drawers', 'plinth', 'confCount', 'pinOff']) { const v = parseFloat(q('p' + f)); if (isFinite(v) && v >= 0) p[f] = v; }
  p.topType = q('ptopType');
  p.sideCut = { where: q('pscw'), a: parseFloat(q('psca')) || 0, deg: parseFloat(q('pscd')) || 0 };
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
    P.hw = P.hw.filter(h => item(h.target)); attachCabinetHardware(parts, p);
  });
  status('Корпус перестроен');
}

// ---------------------------------------------------------------- диалоги
const modal = document.getElementById('modal');
function openDialog(title, body, foot, wide) {
  dlgIsPart = false;
  document.getElementById('dlgTitle').textContent = title;
  const b = document.getElementById('dlgBody');
  b.oninput = b.onchange = b.onclick = b.onkeydown = null;
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();  // иначе Esc ловит кнопка под окном
  b.innerHTML = body;
  document.getElementById('dlgFoot').innerHTML = foot;
  modal.querySelector('.dialog').classList.toggle('wide', !!wide);
  modal.querySelector('.dialog').classList.remove('xwide');
  document.getElementById('dlgFoot').onclick = null;
  modal.hidden = false;
}
// Окно детали — «домашнее»: окна, открытые из него (отверстие, вырез, фурнитура…), после закрытия возвращают в него
let dlgIsPart = false, partEditorId = 0;
const closeDialog = () => {
  modal.hidden = true;
  if (!dlgIsPart && partEditorId && item(partEditorId)) setTimeout(() => { if (modal.hidden) partEditor(partEditorId); }, 0);
  else partEditorId = 0;
};
modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-close]')) closeDialog(); });

// Комната до мебели: готовая форма, стены по длинам и поворотам или нарисовать мышью; потом высота, проёмы, колонны.
// В окне всё в сантиметрах, в проекте — в мм.
function roomDialog(first) {
  const R = JSON.parse(JSON.stringify(normRoom(P.room)));
  let tab = first ? 'preset' : 'walls', draft = [], cursor = null, err = '';
  const cm = v => String(Math.round(v / 10 * 10) / 10).replace('.', ',');
  const mmOf = v => Math.round(parseFloat(String(v).replace(',', '.')) * 10);
  const tabs = [['preset', 'Готовые'], ['walls', 'По стенам: длины и повороты'], ['draw', 'Нарисовать']];
  const DRAW_BOX = [-600, -600, 8000, 6000];
  openDialog(first ? 'Сначала — комната' : 'Комната', '<div id="roomUI"></div>',
    `${first ? '<button data-close>Пропустить</button>' : '<button data-close>Отмена</button>'}<button class="accent" id="roomOk">Готово</button>`, true);
  const ui = document.getElementById('roomUI'), body = document.getElementById('dlgBody');
  const preview = () => tab === 'draw'
    ? roomSVG(R, { width: 620, height: 440, draft, cursor, box: DRAW_BOX })
    : roomSVG(R, { width: 620, height: 440 });
  const table = (head, rows, add) => `<table class="spec rtab"><tr>${head.map(h => `<th>${h}</th>`).join('')}<th></th></tr>${rows.join('')}</table><div class="btns">${add}</div>`;
  const inp = (k, v, w = 70) => `<input class="rin" data-r="${k}" value="${v}" style="width:${w}px">`;
  const sel = (k, v, opts) => `<select data-r="${k}">${opts.map(([a, b]) => `<option value="${a}"${String(a) === String(v) ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select>`;
  function draw() {
    normRoom(R);
    const n = R.pts.length;
    let left = '';
    if (tab === 'preset') {
      left = `<div class="note">Выберите похожую форму — потом её можно уточнить на вкладке «По стенам».</div><div class="rpresets">${ROOM_PRESETS.map(p => `<button class="rpreset" data-preset="${p.id}">${roomSVG(normRoom({ pts: p.pts, openings: p.openings, columns: p.columns, h: R.h }), { width: 200, height: 140, labels: false })}<b>${esc(p.name)}</b><span>${esc(p.note)}</span></button>`).join('')}</div>`;
    } else if (tab === 'walls') {
      const ws = ptsToWalls(R.pts);
      left = `<div class="note">Стена 1 — задняя, идёт слева направо. После каждой стены — поворот: <b>+90</b> вправо (внутрь комнаты), <b>−90</b> влево, можно 45, 135 и любой угол. Последняя стена замыкает комнату сама.</div>
        ${table(['№', 'Длина, см', 'Поворот, °'], ws.map((w, i) => `<tr><td>${i + 1}</td><td>${inp('len' + i, cm(w.len))}</td><td>${inp('turn' + i, String(w.turn).replace('.', ','))}</td><td>${ws.length > 2 ? `<button data-wdel="${i}">✕</button>` : ''}</td></tr>`).concat(`<tr><td>${n}</td><td colspan="3" class="note">замыкает: ${cm(wallLen(R.pts, n - 1))} см</td></tr>`),
        '<button data-wadd>＋ Стена</button>')}
        <div class="note">Меняете одну длину — замыкающая стена встанет наискосок. Для обычной прямоугольной комнаты проще так:</div>
        <div class="btns">${inp('rw', cm(R.w), 70)} × ${inp('rd', cm(R.d), 70)} см <button data-rect>Прямоугольник</button></div>`;
    } else {
      left = `<div class="note">Кликайте углы комнаты по порядку, начиная с левого дальнего. Сетка — 10 см, углы — шагом 15° (с <kbd>Shift</kbd> — точно по мыши, 1 см). Клик по первой (оранжевой) точке замыкает комнату. Потом длины можно поправить цифрами.</div>
        <div class="btns"><button data-dundo>↶ Убрать точку</button><button data-dclear>Заново</button></div><div class="note">Точек: ${draft.length}${draft.length && cursor ? ` · следующая стена ${cm(Math.hypot(cursor[0] - draft[draft.length - 1][0], cursor[1] - draft[draft.length - 1][1]))} см` : ''}</div>`;
    }
    const ops = R.openings.map((o, k) => `<tr><td>${sel('ow' + k, o.wall, R.pts.map((_, i) => [i, 'Стена ' + (i + 1)]))}</td><td>${sel('ot' + k, o.type, Object.entries(OPENING_TYPES).map(([a, b]) => [a, b.name]))}</td><td>${inp('oo' + k, cm(o.off), 60)}</td><td>${inp('ox' + k, cm(o.w), 60)}</td><td>${inp('oh' + k, cm(o.h), 60)}</td><td>${inp('os' + k, cm(o.sill), 60)}</td><td><button data-odel="${k}">✕</button></td></tr>`);
    const cols = R.columns.map((c, k) => `<tr><td>${inp('cx' + k, cm(c.x), 60)}</td><td>${inp('cz' + k, cm(c.z), 60)}</td><td>${inp('cw' + k, cm(c.w), 60)}</td><td>${inp('cd' + k, cm(c.d), 60)}</td><td>${inp('ch' + k, cm(c.h), 60)}</td><td><button data-cdel="${k}">✕</button></td></tr>`);
    ui.innerHTML = `<div class="hwtabs">${tabs.map(([id, name]) => `<button class="${id === tab ? 'on' : ''}" data-rtab="${id}">${name}</button>`).join('')}</div>
      <div class="roomgrid"><div class="roomleft">${left}</div><div class="roomprev${tab === 'draw' ? ' drawing' : ''}">${preview()}</div></div>
      <div class="grid4"><label class="fld"><span>Высота стен, см</span>${inp('h', cm(R.h), 90)}</label><label class="fld"><span>Толщина стен, см</span>${inp('t', cm(R.t), 90)}</label></div>
      <div class="sec2"><b>Проёмы: двери, окна</b><div class="note">«От начала» — от начала стены по стрелке на плане.</div>
        ${table(['Стена', 'Что', 'От начала, см', 'Ширина', 'Высота', 'Низ от пола'], ops, '<button data-oadd="door">＋ Дверь</button><button data-oadd="window">＋ Окно</button><button data-oadd="balcony">＋ Балконный блок</button><button data-oadd="arch">＋ Проём</button>')}</div>
      <div class="sec2"><b>Колонны, короба, выступы</b><div class="note">X — от левой стены, Z — от задней, см. Высота 0 — до потолка. Мебель в колонны и стены не заходит.</div>
        ${table(['X', 'Z', 'Ширина', 'Глубина', 'Высота'], cols, '<button data-cadd>＋ Колонна</button>')}</div>
      <div class="warn" id="roomErr">${esc(err)}</div>`;
  }
  // клик по рисунку → мм на плане
  function svgPoint(e) {
    const svg = ui.querySelector('.roomprev svg'); if (!svg) return null;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM().inverse()), s = +svg.dataset.s;
    let x = q.x / s + +svg.dataset.x0, z = q.y / s + +svg.dataset.z0;
    if (!draft.length) return e.shiftKey ? [Math.round(x / 10) * 10, Math.round(z / 10) * 10] : [Math.round(x / 100) * 100, Math.round(z / 100) * 100];
    const p = draft[draft.length - 1];
    if (draft.length >= 3 && Math.hypot(x - draft[0][0], z - draft[0][1]) < 150) return draft[0];
    if (e.shiftKey) return [Math.round(x / 10) * 10, Math.round(z / 10) * 10];
    const a = Math.round(Math.atan2(z - p[1], x - p[0]) / (Math.PI / 12)) * (Math.PI / 12), L = Math.round(Math.hypot(x - p[0], z - p[1]) / 100) * 100;
    return [Math.round(p[0] + Math.cos(a) * L), Math.round(p[1] + Math.sin(a) * L)];
  }
  ui.onmousemove = e => {
    if (tab !== 'draw' || !e.target.closest('.roomprev')) return;
    cursor = svgPoint(e);
    ui.querySelector('.roomprev').innerHTML = preview();
  };
  ui.onclick = e => {
    const t = e.target.closest('button,[data-rtab]');
    if (tab === 'draw' && e.target.closest('.roomprev')) {
      const p = svgPoint(e); if (!p) return;
      if (draft.length >= 3 && p === draft[0]) {
        const pts = tidyPts(draft), why = checkPts(pts);
        if (why) { err = why; return draw(); }
        R.pts = pts; R.openings = []; R.columns = R.columns.filter(c => c.x < Math.max(...pts.map(q => q[0])));
        draft = []; cursor = null; tab = 'walls'; err = ''; return draw();
      }
      if (!draft.length || p[0] !== draft[draft.length - 1][0] || p[1] !== draft[draft.length - 1][1]) draft.push(p);
      return draw();
    }
    if (!t) return;
    const d = t.dataset;
    if (d.rtab) { tab = d.rtab; err = ''; draft = []; cursor = null; }
    else if (d.preset) { const p = ROOM_PRESETS.find(x => x.id === d.preset); Object.assign(R, JSON.parse(JSON.stringify({ pts: p.pts, openings: p.openings || [], columns: p.columns || [] }))); normRoom(R); tab = 'walls'; }
    else if ('wadd' in d) { const ws = ptsToWalls(R.pts); ws.push({ len: 1000, turn: 90 }); const pts = wallsToPts(ws), why = checkPts(pts); if (why) err = 'Новую стену некуда поставить: ' + why; else { R.pts = pts; err = ''; } }
    else if ('rect' in d) { const w = mmOf(ui.querySelector('[data-r="rw"]').value), dd = mmOf(ui.querySelector('[data-r="rd"]').value); if (w >= 1000 && dd >= 1000) { R.pts = [[0, 0], [w, 0], [w, dd], [0, dd]]; R.openings = R.openings.filter(o => o.wall < 4); err = ''; } else err = 'Стороны — не меньше 100 см'; }
    else if (d.wdel) { const ws = ptsToWalls(R.pts); ws.splice(+d.wdel, 1); const pts = wallsToPts(ws), why = checkPts(pts); if (why) err = why; else { R.pts = pts; R.openings = R.openings.filter(o => o.wall < pts.length); err = ''; } }
    else if ('dundo' in d) draft.pop();
    else if ('dclear' in d) draft = [];
    else if (d.oadd) { const T = OPENING_TYPES[d.oadd], L = wallLen(R.pts, 0); R.openings.push({ wall: 0, type: d.oadd, off: Math.max(0, Math.round((L - T.w) / 2)), w: T.w, h: T.h, sill: T.sill }); }
    else if (d.odel) R.openings.splice(+d.odel, 1);
    else if ('cadd' in d) R.columns.push({ x: 0, z: 0, w: 400, d: 400, h: 0 });
    else if (d.cdel) R.columns.splice(+d.cdel, 1);
    else return;
    draw();
  };
  ui.onchange = e => {
    const k = e.target.dataset.r; if (!k || k === 'rw' || k === 'rd') return;
    const v = e.target.value, n = mmOf(v), m = k.match(/^([a-z]+)(\d+)$/);
    err = '';
    if (k === 'h') { if (n >= 1800) R.h = n; else err = 'Высота стен — не меньше 180 см'; }
    else if (k === 't') { if (n >= 50 && n <= 1000) R.t = n; else err = 'Толщина стен — от 5 до 100 см'; }
    else if (m && (m[1] === 'len' || m[1] === 'turn')) {
      const ws = ptsToWalls(R.pts), i = +m[2];
      if (m[1] === 'len') ws[i].len = n; else ws[i].turn = parseFloat(v.replace(',', '.')) || 0;
      const pts = wallsToPts(ws), why = checkPts(pts);
      if (why) err = why; else R.pts = pts;
    } else if (m) {
      const i = +m[2], o = R.openings[i], c = R.columns[i];
      const map = { ow: () => { o.wall = +v; }, ot: () => { const T = OPENING_TYPES[v]; Object.assign(o, { type: v, w: T.w, h: T.h, sill: T.sill }); }, oo: () => { o.off = n; }, ox: () => { o.w = n; }, oh: () => { o.h = n; }, os: () => { o.sill = n; },
        cx: () => { c.x = n; }, cz: () => { c.z = n; }, cw: () => { c.w = n; }, cd: () => { c.d = n; }, ch: () => { c.h = n; } };
      if (map[m[1]] && isFinite(n)) map[m[1]]();
      if (o && m[1][0] === 'o') err = checkOpening(R, o);
    }
    draw();
  };
  body.onkeydown = e => e.stopPropagation();
  document.getElementById('roomOk').onclick = () => {
    const why = checkPts(R.pts) || R.openings.map(o => checkOpening(R, o)).find(Boolean) || '';
    if (why) { err = why; return draw(); }
    closeDialog();
    commit(() => { P.room = normRoom(R); buildRoom(); });
    fit();
    status(`Комната: ${R.pts.length} стен, ${cm(R.w)} × ${cm(R.d)} см, высота ${cm(R.h)} см. Теперь — мебель: ＋ Корпус`);
  };
  draw();
}
function cabinetDialog() {
  const p = PRESETS.lower;
  openDialog('Корпус из деталей', `
    <div class="grid3">${fld('Тип', 'preset', 'lower', { options: Object.entries(PRESETS).map(([k, v]) => [k, v.label]) })}${fld('Название', 'cname', p.label, { text: true })}${fld('Материал корпуса', 'cmat', 'w16', { options: matOptions() })}</div>
    <div class="grid4">${fld('Ширина, мм', 'W', p.W)}${fld('Высота корпуса', 'H', p.H)}${fld('Глубина корпуса', 'D', p.D)}${fld('Цоколь / ножки', 'plinth', p.plinth)}</div>
    <div class="grid4">${fld('Полки', 'shelves', p.shelves)}${fld('Двери', 'doors', p.doors)}${fld('Ящики', 'drawers', p.drawers)}${fld('Низ корпуса от пола', 'baseY', p.baseY)}</div>
    <div class="grid3">${fld('Верх', 'topType', p.topType, { options: [['solid', 'Крыша'], ['rails', 'Царги 100 мм']] })}${fld('Задняя стенка', 'back', '1', { options: [['1', 'ХДФ 3 мм'], ['0', 'Без задней стенки']] })}${fld('Материал фасадов', 'fmat', 'acrylb18', { options: matOptions() })}</div>
    <div class="grid4">${fld('Срез боковин под углом', 'scw', 'none', { options: SIDE_CUTS })}${fld('Длина среза по глубине, мм', 'sca', 200)}${fld('Угол к верху/низу, °', 'scd', 45)}</div>
    <div class="grid4">${fld('Конфирматов на соединение', 'confCount', '0', { options: [['0', 'авто (2–3 по глубине)'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']] })}${fld('Полкодержатели от края, мм', 'pinOff', 37)}</div>
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
      drill: q('drill').value === '1', confCount: +q('confCount').value || 0, pinOff: n('pinOff') || 37, hinge: { type: q('htype').value, side: q('hside').value, off: n('hoff') || 100, count: 0 }, sideCut: { where: q('scw').value, a: n('sca'), deg: n('scd') } };
    if (p2.W < 100 || p2.H < 100 || p2.D < 100) return alert('Ширина, высота и глубина — не меньше 100 мм');
    const baseY = n('baseY'), totalH = p2.plinth + p2.H;
    closeDialog();
    commit(() => {
      const g = { id: nid(), name: q('cname').value.trim() || 'Корпус', params: p2, kind: PRESET_KIND[q('preset').value] || 'cabinet' };
      P.groups.push(g);
      const parts = buildCabinet(p2, freeX(baseY, totalH), baseY, 0, g.id);
      P.items.push(...parts); sel.clear(); parts.forEach(i => sel.add(i.id)); openGroup = 0;
      attachCabinetHardware(parts, p2);
    });
    status(`Корпус добавлен: ${groupItems([...P.groups].pop().id).length} деталей. Двойной клик — выбрать отдельную деталь.`);
  };
}

// Спецификация: детали для распила (длина × ширина × толщина), площадь, листы, кромка
function specData() {
  const rows = new Map(), mats = new Map();
  for (const i of panels()) {
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
    ${hwSpecTable()}${appSpecTable()}
    <div class="note">Лист ${SHEET.w}×${SHEET.h} мм. Число листов — оценка по площади с запасом 15%; точный раскрой — на странице «Раскрой» сайта.
    Кромка считается по видимым торцам: передний торец корпусных деталей и все 4 торца фасадов.</div>`,
    '<button data-close>Закрыть</button><button class="accent" id="csvBtn">Сохранить в Excel (CSV)</button>', true);
  document.getElementById('csvBtn').onclick = () => {
    const lines = [['№', 'Деталь', 'Тип', 'Материал', 'Длина', 'Ширина', 'Толщина', 'Обработка', 'Кол-во'].join(';')];
    rows.forEach((r, k) => lines.push([k + 1, r.name, r.kind, r.mat, fmt(r.L), fmt(r.W), fmt(r.T), r.ops || '', r.n].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')));
    const apps = appRows();
    if (apps.length) { lines.push('', ['№', 'Техника', 'Раздел', 'Как ставится', 'Ширина', 'Высота', 'Глубина', 'Ниша / вырез', 'Кол-во'].join(';')); apps.forEach((r, k) => lines.push([k + 1, r.name, catName(r.e.cat), MOUNTS[r.e.mount] || '', fmt(r.e.w), fmt(r.e.h), fmt(r.e.d), appNiche(r.e), r.n].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))); }
    saveExport(P.name + ' — спецификация', 'csv', { text: '﻿' + lines.join('\r\n') });
  };
}

// ---------------------------------------------------------------- обработка: отверстия, вырезы, срезы углов
function defaultOp(type, fr) {
  const half = v => Math.round(v / 2);
  if (type === 'hole') return { type, face: 'A', u: half(fr.SU), v: half(fr.SV), s: half(fr.SV), o: r1(fr.T / 2), dia: 8, depth: 12, through: false, count: 1, step: 32, dir: 'u', preset: 'custom' };
  if (type === 'cut') return { type, face: 'A', u: 50, v: 50, cw: 100, ch: 60, r: 0, depth: 8, through: true, angle: 0, preset: 'custom' };
  if (type === 'bevel') return { type, edge: 'U1', side: 'A', deg: 45 };
  return { type: 'corner', corner: 'RT', shape: 'chamfer', a: 100, b: 100, deg: 30 };
}
function opDialog(type, index = -1, init = null) {
  const k0 = kindOfSelection();
  if (k0.type === 'item' && index >= 0 && !isApp(k0.it) && k0.it.ops[index].type === 'shape') return shapeDialog(index);
  const k = k0;
  if (k.type !== 'item') return status('Выберите одну деталь: двойной клик по детали внутри модуля');
  if (isApp(k.it)) return status(APP_NO_OPS);
  const it = k.it, fr = frame(it), N = fr.names;
  const old = index >= 0 ? it.ops[index] : null;
  if (old) type = old.type;
  const op = old ? JSON.parse(JSON.stringify(old)) : Object.assign(defaultOp(type, fr), init || {});
  const others = (it.ops || []).filter((_, j) => j !== index);
  const edge = () => op.type === 'hole' && !['A', 'B'].includes(op.face);
  const title = { hole: 'Отверстие', cut: 'Вырез / паз', corner: 'Срез угла', bevel: 'Скос кромки под углом' }[type];
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
    } else if (type === 'bevel') {
      h += `<div class="grid4">${fld('Какой торец', 'edge', op.edge, { options: ['U0', 'U1', 'V0', 'V1'].map(f => [f, N[f]]) })}${fld('Со стороны', 'side', op.side, { options: [['A', N.A], ['B', N.B]] })}${fld('Угол, °', 'deg', op.deg)}</div>
        <div class="note">Торец срезается наклонно через всю толщину: 45° — для соединения «на ус» (два торца под 45° дают прямой угол). Съём по пласти — ${fmt(bevelLen(op, fr.T))} мм.</div>`;
    } else {
      const sh = op.shape || 'chamfer', round = sh === 'round' || sh === 'cove';
      h += `<div class="grid4">${fld('Угол', 'corner', op.corner, { options: [['LB', 'Левый нижний'], ['LT', 'Левый верхний'], ['RB', 'Правый нижний'], ['RT', 'Правый верхний']] })}${fld('Форма', 'shape', sh, { options: CORNER_SHAPES })}
        ${round ? fld('Радиус R, мм', 'a', op.a) : sh === 'angle' ? fld('Длина среза по X, мм', 'a', op.a) + fld('Угол к краю по X, °', 'deg', op.deg || 30) : fld('Срез по X, мм', 'a', op.a) + fld('Срез по Y, мм', 'b', op.b)}</div>
        ${sh === 'angle' ? `<div class="note">По Y срежется ${fmt(Math.round(op.a * Math.tan((op.deg || 30) * Math.PI / 180) * 10) / 10)} мм.</div>` : ''}`;
    }
    h += `<div class="note">${type === 'bevel' ? '' : type === 'corner' ? 'Угол срезается по прямой насквозь (скос).' : 'Кликните по чертежу, чтобы поставить ' + (type === 'cut' ? 'левый нижний угол выреза' : 'отверстие') + '. Координаты — от левого нижнего угла чертежа.'}</div>
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
  body.oninput = () => { read(); if (op.type === 'corner' && op.shape === 'angle') op.b = Math.round(op.a * Math.tan((op.deg || 30) * Math.PI / 180) * 10) / 10; preview(); };
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
    } else if (key === 'face' || key === 'shape' || key === 'deg' || key === 'a') form();
  };
  body.onclick = e => {
    const svgEl = e.target.closest('#opPreview svg');
    if (!svgEl || !map || type === 'corner' || type === 'bevel') return;
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
    if (type === 'corner' && op.shape === 'angle') { if (!(op.deg > 0 && op.deg < 89)) return alert('Угол — от 1 до 89°'); op.b = Math.round(op.a * Math.tan(op.deg * Math.PI / 180) * 10) / 10; }
    else if (type === 'corner' && op.shape !== 'chamfer') op.b = op.a;
    if (type === 'bevel' && !(op.deg >= 1 && op.deg <= 80)) return alert('Угол скоса — от 1 до 80°');
    if (op.type === 'hole' && !edge() && op.through) op.depth = fr.T;
    closeDialog();
    const saved = JSON.parse(JSON.stringify(op));
    commit(() => { it.ops = it.ops || []; if (index >= 0) it.ops[index] = saved; else it.ops.push(saved); });
    status(`${title} ${old ? 'изменено' : 'добавлено'}: ${describeOp(op, it)}`);
  };
}
// Фрезеровки: выбрать шаблон, задать размеры — на чертеже сразу видно, что получится
function millDialog(cat = 'handles', id = '') {
  const k = kindOfSelection();
  if (k.type !== 'item') return status('Выберите одну деталь: двойной клик по детали внутри модуля');
  if (isApp(k.it)) return status(APP_NO_OPS);
  const it = k.it, fr = frame(it), N = fr.names;
  let m = MILLS.find(x => x.id === id) || MILLS.find(x => x.cat === cat), p = millDefaults(m);
  openDialog(`Фрезеровка: ${label(it)}`, `<div class="hwtabs" id="mlTabs"></div><div class="millgrid"><div class="mill-list" id="mlList"></div><div><div id="mlForm"></div><div class="op-preview" id="mlPrev"></div></div></div>`,
    `<button data-close>Отмена</button><button class="accent" id="mlOk">Добавить фрезеровку</button>`, true);
  const body = document.getElementById('dlgBody');
  const ops = () => { try { return m.gen(fr, p).map(o => ({ ...o, mill: m.name })); } catch (e) { return []; } };
  function draw() {
    document.getElementById('mlTabs').innerHTML = MILL_CATS.map(([c, nm]) => `<button class="${c === m.cat ? 'on' : ''}" data-mcat="${c}">${nm}</button>`).join('');
    document.getElementById('mlList').innerHTML = MILLS.filter(x => x.cat === m.cat).map(x => `<button class="mill-item${x === m ? ' on' : ''}" data-mill="${x.id}"><b>${esc(x.name)}</b><span>${esc(x.desc)}</span></button>`).join('');
    document.getElementById('mlForm').innerHTML = `<div class="grid4">${m.params.map(q => q.edge ? fld(q.label, q.k, p[q.k], { options: ['U0', 'U1', 'V0', 'V1'].map(e => [e, N[e]]) }) : q.face ? fld(q.label, q.k, p[q.k], { options: [['A', N.A], ['B', N.B]] }) : fld(q.label, q.k, p[q.k])).join('')}</div>`;
    preview();
  }
  function preview() {
    const list = ops(), base = it.ops || [];
    document.getElementById('mlPrev').innerHTML = drawingSVG(it, { ops: [...base, ...list], hl: base.length, width: 700, height: 440 }).svg;
  }
  body.onclick = e => {
    const c = e.target.closest('[data-mcat]'), x = e.target.closest('[data-mill]');
    if (c) { m = MILLS.find(y => y.cat === c.dataset.mcat); p = millDefaults(m); draw(); }
    if (x) { m = MILLS.find(y => y.id === x.dataset.mill); p = millDefaults(m); draw(); }
  };
  const read = () => body.querySelectorAll('#mlForm [data-k]').forEach(el => { const q = m.params.find(y => y.k === el.dataset.k); p[q.k] = q.edge || q.face ? el.value : (parseFloat(String(el.value).replace(',', '.')) || 0); });
  body.oninput = () => { read(); preview(); };
  body.onchange = () => { read(); preview(); };
  body.onkeydown = e => e.stopPropagation();
  document.getElementById('mlOk').onclick = () => {
    read();
    const list = ops();
    if (!list.length) return alert('Проверьте размеры: фрезеровка не получилась');
    closeDialog();
    commit(() => { it.ops = it.ops || []; it.ops.push(...JSON.parse(JSON.stringify(list))); });
    status(`Фрезеровка «${m.name}»: добавлено операций — ${list.length}`);
  };
  draw();
}
// Вырез по точкам: клик по чертежу — новая точка, точки тянутся мышью; у каждой — радиус (0 — острый угол)
const SHAPE_TEMPLATES = [
  ['', 'Свой (ставьте точки кликами)'], ['tri', 'Треугольник'], ['trap', 'Трапеция'], ['hex', 'Шестиугольник'], ['arch', 'Арка'], ['oval', 'Овал (плавный)'],
  ['wave', 'Волна по краю (плавная)'], ['star', 'Звезда'], ['round', 'Прямоугольник, скругления R30'],
];
function shapeTemplate(id, fr) {
  const cu = fr.SU / 2, cv = fr.SV / 2, w = Math.min(fr.SU, fr.SV) * 0.35, R = (k, n, rad, ph = Math.PI / 2) => [r1(cu + rad * Math.cos(ph + 2 * Math.PI * k / n)), r1(cv + rad * Math.sin(ph + 2 * Math.PI * k / n)), 0];
  switch (id) {
    case 'tri': return { pts: [0, 1, 2].map(k => R(k, 3, w)) };
    case 'trap': return { pts: [[cu - w, cv - w * 0.6, 0], [cu + w, cv - w * 0.6, 0], [cu + w * 0.5, cv + w * 0.6, 0], [cu - w * 0.5, cv + w * 0.6, 0]].map(p => p.map(r1)) };
    case 'hex': return { pts: [0, 1, 2, 3, 4, 5].map(k => R(k, 6, w, 0)) };
    case 'arch': return { pts: [[cu - w, cv - w, 0], [cu + w, cv - w, 0], [cu + w, cv + w * 0.2, w], [cu - w, cv + w * 0.2, w]].map(p => p.map(r1)) };
    case 'oval': return { pts: [R(0, 4, w), [r1(cu - w * 1.4), r1(cv), 0], R(2, 4, w), [r1(cu + w * 1.4), r1(cv), 0]], smooth: true };
    case 'wave': { const n = 7, pts = []; for (let k = 0; k <= n; k++) pts.push([r1(fr.SU * k / n), r1(fr.SV - 40 - (k % 2 ? 40 : 0)), k && k < n ? 30 : 0]); pts.push([fr.SU + 20, fr.SV + 20, 0], [-20, fr.SV + 20, 0]); return { pts, smooth: false, waveTop: true }; }
    case 'star': return { pts: Array.from({ length: 10 }, (_, k) => R(k, 10, k % 2 ? w * 0.45 : w)) };
    case 'round': return { pts: [[cu - w, cv - w * 0.6, 30], [cu + w, cv - w * 0.6, 30], [cu + w, cv + w * 0.6, 30], [cu - w, cv + w * 0.6, 30]].map(p => p.map(r1)) };
    default: return { pts: [] };
  }
}
function shapeDialog(index = -1) {
  const k = kindOfSelection();
  if (k.type !== 'item') return status('Выберите одну деталь: двойной клик по детали внутри модуля');
  if (isApp(k.it)) return status(APP_NO_OPS);
  const it = k.it, fr = frame(it), N = fr.names;
  const old = index >= 0 ? it.ops[index] : null;
  const op = old ? JSON.parse(JSON.stringify(old)) : { type: 'shape', face: 'A', pts: [], smooth: false, through: true, depth: 8 };
  const others = (it.ops || []).filter((_, j) => j !== index);
  let cur = op.pts.length - 1, map = null, drag = null;
  openDialog(`Вырез по точкам: ${label(it)}`, `<div class="shapegrid"><div class="op-preview" id="shPrev"></div><div id="shSide"></div></div>`,
    `<button data-close>Отмена</button><button class="accent" id="shOk">${old ? 'Сохранить' : 'Вырезать'}</button>`, true);
  const body = document.getElementById('dlgBody'), prev = document.getElementById('shPrev'), side = document.getElementById('shSide');
  const chk = (key, text, on) => `<label class="fld chk"><input type="checkbox" data-s="${key}"${on ? ' checked' : ''}><span>${text}</span></label>`;
  const inp = (key, v) => `<input class="rin" data-s="${key}" value="${fmtIn(v)}" style="width:66px">`;
  function draw() {
    const d = drawingSVG(it, { ops: op.pts.length >= 3 ? [...others, op] : others, hl: others.length, width: 720, height: 500 });
    map = d.map;
    const X = u => map.x0 + u * map.s, Y = v => map.y0 + (map.SV - v) * map.s;
    let g = '';
    if (op.pts.length && op.pts.length < 3) g += `<polyline points="${op.pts.map(p => `${X(p[0])},${Y(p[1])}`).join(' ')}" fill="none" stroke="#1f5fb4" stroke-width="2" stroke-dasharray="5 4"/>`;
    op.pts.forEach((p, i) => { g += `<g class="shpt" data-i="${i}" style="cursor:move"><circle cx="${X(p[0])}" cy="${Y(p[1])}" r="${i === cur ? 8 : 6}" fill="${i === cur ? '#d9770f' : '#fff'}" stroke="#d9770f" stroke-width="2"/><text x="${X(p[0]) + 9}" y="${Y(p[1]) - 9}" font-size="11" fill="#d9770f" font-weight="700">${i + 1}${p[2] > 0 ? ' R' + fmt(p[2]) : ''}</text></g>`; });
    prev.innerHTML = d.svg.replace('</svg>', g + '</svg>');
    side.innerHTML = `<div class="grid2">${fld('Шаблон', 'tpl', '', { options: SHAPE_TEMPLATES })}${fld('Сторона', 'face', op.face, { options: [['A', N.A], ['B', N.B]] })}</div>
      <div class="btns">${chk('through', 'Насквозь', op.through)}${op.through ? '' : `<label class="fld"><span>Глубина, мм</span>${inp('depth', op.depth)}</label>`}${chk('smooth', 'Плавная кривая через все точки', op.smooth)}</div>
      <div class="note">Клик по чертежу — новая точка${op.pts.length ? ' после выбранной (оранжевой)' : ''}. Точки тяните мышью, <kbd>Shift</kbd> — по сетке 10 мм. Радиус у точки: 0 — острый угол, больше — скруглённый.</div>
      <table class="spec rtab"><tr><th>№</th><th>X</th><th>Y</th><th>Радиус</th><th></th></tr>${op.pts.map((p, i) => `<tr class="${i === cur ? 'cur' : ''}" data-row="${i}"><td>${i + 1}</td><td>${inp('u' + i, p[0])}</td><td>${inp('v' + i, p[1])}</td><td>${inp('r' + i, p[2] || 0)}</td><td><button data-del="${i}">✕</button></td></tr>`).join('')}</table>
      <div class="btns"><button data-allr="0">Все углы острые</button><button data-allr="20">Все R20</button><button data-allr="50">Все R50</button><button data-clear>Очистить</button></div>
      <div class="warn" id="shWarn"></div>`;
  }
  const toFace = e => { const svg = prev.querySelector('svg'), pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const q = pt.matrixTransform(svg.getScreenCTM().inverse()); const sn = e.shiftKey ? 10 : 1; return [Math.round((q.x - map.x0) / map.s / sn) * sn, Math.round((map.SV - (q.y - map.y0) / map.s) / sn) * sn]; };
  prev.onpointerdown = e => {
    e.preventDefault();
    const h = e.target.closest('.shpt');
    if (h) { cur = +h.dataset.i; drag = cur; prev.setPointerCapture(e.pointerId); return draw(); }
    const [u, v] = toFace(e);
    op.pts.splice(cur + 1, 0, [u, v, 0]); cur++;
    draw();
  };
  prev.onpointermove = e => { if (drag === null) return; const [u, v] = toFace(e); op.pts[drag][0] = u; op.pts[drag][1] = v; draw(); };
  prev.onpointerup = () => { drag = null; };
  side.onclick = e => {
    const t = e.target.closest('button,[data-row]'); if (!t) return;
    if (t.dataset.del !== undefined) { op.pts.splice(+t.dataset.del, 1); cur = Math.min(cur, op.pts.length - 1); }
    else if (t.dataset.allr !== undefined) { op.smooth = false; op.pts.forEach(p => { p[2] = +t.dataset.allr; }); }
    else if ('clear' in t.dataset) { op.pts = []; cur = -1; }
    else if (t.dataset.row !== undefined && e.target.tagName !== 'INPUT') cur = +t.dataset.row;
    else return;
    draw();
  };
  side.onchange = e => {
    const kk = e.target.dataset.s || e.target.dataset.k; if (!kk) return;
    const val = parseFloat(String(e.target.value).replace(',', '.'));
    if (kk === 'tpl') { if (e.target.value) { const t = shapeTemplate(e.target.value, fr); op.pts = t.pts; op.smooth = !!t.smooth; cur = op.pts.length - 1; } }
    else if (kk === 'face') op.face = e.target.value;
    else if (kk === 'through' || kk === 'smooth') op[kk] = e.target.checked;
    else if (kk === 'depth') { if (val > 0) op.depth = val; }
    else { const m = kk.match(/^([uvr])(\d+)$/); if (m && isFinite(val)) op.pts[+m[2]][{ u: 0, v: 1, r: 2 }[m[1]]] = Math.max(m[1] === 'r' ? 0 : -1e9, val); }
    draw();
  };
  body.onkeydown = e => { e.stopPropagation(); if ((e.key === 'Delete' || e.key === 'Backspace') && e.target.tagName !== 'INPUT' && cur >= 0) { op.pts.splice(cur, 1); cur = Math.min(cur, op.pts.length - 1); draw(); } };
  document.getElementById('shOk').onclick = () => {
    if (op.pts.length < 3) { document.getElementById('shWarn').textContent = 'Нужно хотя бы 3 точки'; return; }
    if (!op.through && !(op.depth > 0)) { document.getElementById('shWarn').textContent = 'Укажите глубину'; return; }
    closeDialog();
    const saved = JSON.parse(JSON.stringify(op));
    commit(() => { it.ops = it.ops || []; if (index >= 0) it.ops[index] = saved; else it.ops.push(saved); });
    status(`Вырез ${old ? 'изменён' : 'сделан'}: ${describeOp(saved, it)}`);
  };
  draw();
}
insp.addEventListener('click', e => inspClick(e));
function inspClick(e) {
  const ha = e.target.closest('[data-hw-act]'), he = e.target.closest('[data-hw-edit]'), hd = e.target.closest('[data-hw-del]');
  if (ha) { toggleHw([+ha.dataset.hwAct]); setTimeout(refreshInspector, 50); return; }
  if (he) { const hw = P.hw.find(h => h.id === +he.dataset.hwEdit); if (hw) hwForm(item(hw.target), hw, false); return; }
  if (hd) { hwDelete(+hd.dataset.hwDel); return; }
  const hp = e.target.closest('[data-hw-place]');
  if (hp) { const hw = P.hw.find(h => h.id === +hp.dataset.hwPlace); if (hw) hwPlace(item(hw.target), hw, false); return; }
  const hb = e.target.closest('[data-hw-base]');
  if (hb) { startBasePick(+hb.dataset.hwBase); return; }
  const ed = e.target.closest('[data-op-edit]'), del = e.target.closest('[data-op-del]');
  const k = kindOfSelection(); if (k.type !== 'item') return;
  if (ed) opDialog(null, +ed.dataset.opEdit);
  if (del) commit(() => { k.it.ops.splice(+del.dataset.opDel, 1); });
}

// ---------------------------------------------------------------- фурнитура: каталог и настройки
// Отверстия под фурнитуру: убрать старые этой фурнитуры (на фасаде и на боковине), поставить новые
function hwSync(hw, it) {
  for (const x of P.items) if (x.ops) x.ops = x.ops.filter(o => o.tag !== 'hw' + hw.id);
  it.ops = it.ops || [];
  it.ops.push(...hwDrillOps(hw, it, hwOf(it.id).filter(h => h.id !== hw.id), P.items));
  for (const { id, op } of plateOps(hw, it, P.items)) { const side = item(id); side.ops = side.ops || []; side.ops.push(op); }
}
// Каталог фурнитуры: для одной детали — сразу на неё; для модуля (шкафа, ящика) или нескольких деталей —
// после выбора фурнитуры спрашиваем, на какую из деталей её поставить
function hwCatalog(cat) {
  const k = kindOfSelection();
  if (k.type === 'none') return status('Выберите деталь или модуль (шкаф, ящик), куда ставить фурнитуру');
  if (k.type === 'item' && isApp(k.it)) return status('На технику фурнитура не ставится — выберите деталь мебели');
  const one = k.type === 'item' ? k.it : null, list = one ? [one] : k.list.filter(i => !isApp(i));
  if (!list.length) return status('Выбрана только техника — выберите деталь мебели');
  cat = cat || (one && thinAxis(one) === 'x' ? 'slides' : 'hinges');
  const tabs = HW_CATEGORIES.map(([id, name]) => `<button class="${id === cat ? 'on' : ''}" data-hwcat="${id}">${esc(name)}</button>`).join('');
  const cards = Object.values(HW_TYPES).filter(t => t.cat === cat).map(t => {
    const ok = list.filter(i => !checkTarget(t.id, i));
    const why = one ? checkTarget(t.id, one) : ok.length ? '' : 'В этом модуле нет подходящей детали: ' + checkTarget(t.id, list[0]);
    return `<div class="hwcard${why ? ' off' : ''}"><div><b>${esc(t.name)}</b>${t.motion ? `<span class="tag">${t.motion === 'light' ? 'свет' : 'есть действие'}</span>` : ''}<div class="note">${esc(t.desc)}</div>${why ? `<div class="warn">${esc(why)}</div>` : ''}</div>
      <button class="accent" data-hwadd="${t.id}"${why ? ' disabled' : ''}>${one ? 'Поставить' : 'Выбрать деталь…'}</button></div>`;
  }).join('');
  const title = one ? label(one) : k.type === 'group' ? k.g.name : `${list.length} дет.`;
  openDialog(`Фурнитура: ${title}`, `<div class="hwtabs">${tabs}</div><div class="hwlist">${cards}</div>`, '<button data-close>Закрыть</button>', true);
  const body = document.getElementById('dlgBody');
  body.onclick = e => {
    const c = e.target.closest('[data-hwcat]'); if (c) return hwCatalog(c.dataset.hwcat);
    const a = e.target.closest('[data-hwadd]'); if (!a || a.disabled) return;
    if (one) return hwForm(one, newHardware(a.dataset.hwadd, one.id, 0), true);
    hwPickTarget(a.dataset.hwadd, list.filter(i => !checkTarget(a.dataset.hwadd, i)), cat);
  };
}
// На какую деталь модуля ставить: подходящие по типу, сначала самые вероятные (для направляющих — боковины ящиков)
function hwPickTarget(type, cands, cat) {
  const t = HW_TYPES[type];
  const score = i => (t.cat === 'slides' ? (thinAxis(i) === 'x' && !['sideL', 'sideR'].includes(i.role) ? 0 : thinAxis(i) === 'x' ? 2 : 1)
    : t.cat === 'hinges' || t.target === 'front' ? (['door', 'drawerFront'].includes(i.role || i.kind) ? 0 : 1) : 0) - (hwOf(i.id).length ? 0 : 0.1);
  cands = [...cands].sort((a, b) => score(a) - score(b) || a.y - b.y || a.x - b.x);
  openDialog(`${t.name}: на какую деталь?`, `<div class="note">Выберите деталь — фурнитура встанет на неё. ${t.cat === 'slides' ? 'Направляющие ставьте на боковину ящика: внешняя шина сама найдёт боковину корпуса (зазор 13 мм), а в следующем окне можно сразу поставить пару.' : ''} Наведите на строку — деталь подсветится.</div>
    <div class="picklist">${cands.map(i => `<button class="pick" data-pick="${i.id}"><b>${esc(label(i))}</b><span>${dims(i)} мм · X ${fmt(i.x)}, Y ${fmt(i.y)}, Z ${fmt(i.z)}${hwOf(i.id).length ? ` · уже есть: ${hwOf(i.id).map(h => esc(HW_TYPES[h.type].name)).join(', ')}` : ''}</span></button>`).join('')}</div>`,
    '<button data-back>← Назад</button><button data-close>Отмена</button>', true);
  const body = document.getElementById('dlgBody'), keep = new Set(sel);
  const hl = id => { sel.clear(); if (id) sel.add(id); else keep.forEach(x => sel.add(x)); rebuild(); };
  body.onmouseover = e => { const b = e.target.closest('[data-pick]'); if (b) hl(+b.dataset.pick); };
  body.onmouseleave = () => hl(0);
  body.onclick = e => { const b = e.target.closest('[data-pick]'); if (!b) return; hl(0); hwForm(item(+b.dataset.pick), newHardware(type, +b.dataset.pick, 0), true); };
  document.getElementById('dlgFoot').onclick = e => { if (e.target.closest('[data-back]')) { hl(0); hwCatalog(cat); } };
}
function hwForm(it, hw, isNew) {
  const t = HW_TYPES[hw.type];
  const fieldsHtml = t.fields.map(k => {
    const fd = HW_FIELDS[k];
    return fd.num ? fld(fd.label, k, hw[k] ?? fd.def) : fd.text ? fld(fd.label, k, hw[k] ?? fd.def, { text: true }) : fld(fd.label, k, hw[k] ?? fd.def, { options: fd.options });
  }).join('');
  openDialog(`${t.name}: ${label(it)}`, `<div class="note">${esc(t.desc)}</div><div class="grid3">${fieldsHtml || '<div class="note">Настроек нет.</div>'}</div><div class="warn" id="hwWarn"></div>`,
    `<button data-close>Отмена</button><button class="accent" id="hwOk">${isNew ? 'Поставить' : 'Сохранить'}</button>`);
  const body = document.getElementById('dlgBody');
  body.onkeydown = e => e.stopPropagation();
  document.getElementById('hwOk').onclick = () => {
    const nh = { ...hw };
    body.querySelectorAll('[data-k]').forEach(el => { const fd = HW_FIELDS[el.dataset.k]; nh[el.dataset.k] = fd.num ? (parseFloat(String(el.value).replace(',', '.')) || 0) : el.value; });
    const why = checkTarget(nh.type, it);
    if (why) { document.getElementById('hwWarn').textContent = why; return; }
    if (isNew && HW_TYPES[nh.type].cat === 'slides' && slideMount(it) !== 'front') return hwPlace(it, nh, true);   // направляющие — сразу в окно расположения
    const others = hwOf(it.id).filter(h => h.id !== hw.id), cl = hwClash(nh, it, others);
    if (cl) return hwPlace(it, nh, isNew, `Здесь уже стоит «${HW_TYPES[cl.type].name}» — выберите свободное место`);
    closeDialog();
    let msg = '';
    commit(() => {
      if (isNew) { nh.id = nid(); P.hw.push(nh); } else { const i = P.hw.findIndex(h => h.id === hw.id); P.hw[i] = nh; delete nh.auto; }
      if (baseNeeded(nh.type) && (isNew || !nh.base || nh.side !== hw.side)) msg = attachBase(nh, it, null);
      hwSync(nh, it);
    });
    status(`${isNew ? 'Поставлено' : 'Изменено'}: ${describeHw(nh, it)}${msg ? ' · ' + msg : ''}`);
  };
}
// Сторона Б: ищем деталь «магнитом» (или берём указанную) и придвигаем к ней деталь А вплотную.
// Возвращает текст для строки состояния.
function attachBase(hw, it, only) {
  const f = findBase(hw, it, P.items, only ? 1000 : 40, only);
  if (!f) { if (!only) hw.base = null; return only ? `к «${label(only)}» не подходит: ${baseHint(hw.type)}` : `вторая сторона свободна — нажмите 🧲 и выберите деталь (${baseHint(hw.type)})`; }
  hw.base = f.part.id;
  let moved = '';
  if (f.gap > 0.5) {
    const d = snapDelta(hw, it, f.part);
    const lone = HW_TYPES[hw.type].cat === 'slides' && slideMount(it) !== 'front' && movingIds(hw, P.items).length <= 1;
    if (lone && d.some(v => v)) {   // ящик не объединён — двигать одну боковину нельзя, только подсказываем
      const b = f.part, raw = b.x + b.w / 2 > it.x + it.w / 2 ? b.x - (it.x + it.w) : it.x - (b.x + b.w);
      return `вторая сторона — к ${who(b)}; зазор ${fmt(raw)} мм, а нужно 13 — объедините ящик и нажмите 🧲, он встанет сам`;
    }
    if (d.some(v => v)) {
      for (const x of attachedClosure([it, ...movingIds(hw, P.items).map(item).filter(Boolean)])) { x.x = r1(x.x + d[0]); x.y = r1(x.y + d[1]); x.z = r1(x.z + d[2]); }
      moved = `, притянуто на ${fmt(f.gap)} мм`;
    }
  }
  return `вторая сторона — к ${who(f.part)}${moved}`;
}
let basePick = null;   // { hw } — ждём клик по детали для стороны Б
function startBasePick(id) {
  const hw = P.hw.find(h => h.id === id); if (!hw) return;
  basePick = { hw: id };
  status(`🧲 Кликните деталь, к которой крепится вторая сторона: ${baseHint(hw.type)}. Esc — отмена`);
}
function finishBasePick(partId) {
  const hw = P.hw.find(h => h.id === basePick.hw); basePick = null;
  if (!hw) return;
  const it = item(hw.target), b = item(partId);
  if (!b || b.id === it.id) return status('Нужна другая деталь');
  let msg = '';
  commit(() => { msg = attachBase(hw, it, b); hwSync(hw, it); });
  status(msg[0] === 'к' ? 'Не присоединено: ' + msg : 'Присоединено: ' + msg);
}
// ---------------------------------------------------------------- где стоит фурнитура: окно с видом детали, перетаскивание, проверка наложений
// Объём фурнитуры (в закрытом положении) — набор коробок; две фурнитуры на детали не должны входить друг в друга
function hwBoxes(hw, it) {
  return hwVisuals(hw, it, P.items, hwOf(it.id).filter(h => h.id !== hw.id)).map(v => { v.obj.updateMatrixWorld(true); return new THREE.Box3().setFromObject(v.obj).expandByScalar(-0.6); }).filter(b => !b.isEmpty());
}
function hwClash(hw, it, others) {
  const mine = hwBoxes(hw, it);
  for (const o of others) for (const b of hwBoxes(o, it)) if (mine.some(a => a.intersectsBox(b))) return o;
  return null;
}
function hwPlace(it, hw0, isNew, warn = '') {
  const hw = { ...hw0 }, fr = frame(it), others = hwOf(it.id).filter(h => h.id !== hw.id);
  const t = HW_TYPES[hw.type], hinge = t.cat === 'hinges', along = hw.side === 'L' || hw.side === 'R' ? 'v' : 'u';
  const slide = t.cat === 'slides' && slideMount(it) !== 'front', twin = slide && isNew && slideMount(it) === 'side' ? slideTwin(it) : null;
  const org = { x: it.x, y: it.y, z: it.z };
  const W = 640, H = 430, m = 60, s = Math.min((W - 2 * m) / fr.SU, (H - 2 * m) / fr.SV);
  const X = u => m + u * s, Y = v => H - m - v * s;
  // проекция коробок на пласть детали (вид со стороны A)
  const rects = (h) => hwBoxes(h, it).map(b => ({ u0: b.min[fr.U] - org[fr.U], u1: b.max[fr.U] - org[fr.U], v0: b.min[fr.V] - org[fr.V], v1: b.max[fr.V] - org[fr.V] }));
  openDialog(`Где стоит: ${t.name}`, `<div class="note">Тяните фурнитуру мышью или вводите сдвиг. Стрелки — по 1 мм, с <kbd>Shift</kbd> — по 10 мм.${hinge ? ' Каждую петлю можно тянуть отдельно вдоль кромки.' : ''} Серым — другая фурнитура этой детали.</div>
    <div class="op-preview" id="hpPrev"></div>
    ${slide ? `<div class="grid4">${fld('Центр шины от низа детали, мм (0 — середина)', 'level', +hw.level || 0)}${fld('Отступ от переднего края, мм', 'setback', +hw.setback || 0)}${fld('Длина направляющей, мм (0 — по детали)', 'len', +hw.len || 0)}${twin ? `<label class="fld chk"><input type="checkbox" id="hpPair" checked><span>Сразу пара: вторая — на «${esc(label(twin))}»</span></label>` : ''}</div>
      <div class="note">Внутренняя шина крепится к этой детали, внешняя — магнитом к боковине корпуса с зазором 13 мм. С двух сторон — 26 мм: ящик должен быть на 26 мм уже проёма. ${it.g ? `Выезжает весь модуль «${esc(group(it.g).name)}».` : 'Детали ящика не объединены — выедет только эта деталь (объедините ящик: Shift + клик по деталям, Ctrl+G).'}</div>` : ''}
    <div class="grid4">${fld('Сдвиг по ' + fr.U.toUpperCase() + ', мм', 'du', +hw.du || 0)}${fld('Сдвиг по ' + fr.V.toUpperCase() + ', мм', 'dv', +hw.dv || 0)}${hinge ? fld('Петли, мм от края', 'positions', hingeSpots({ ...hw, du: 0, dv: 0 }, it).map(p => Math.round(p[along])).join(', '), { text: true }) : ''}</div>
    <div class="warn" id="hpWarn"></div>`,
    `<button data-close>Отмена</button><button id="hpReset">Сбросить сдвиг</button><button class="accent" id="hpOk">${isNew ? 'Поставить' : 'Готово'}</button>`, true);
  const body = document.getElementById('dlgBody'), prev = document.getElementById('hpPrev'), q = k => body.querySelector(`[data-k="${k}"]`);
  let clash = null;
  function draw() {
    clash = hwClash(hw, it, others);
    let g = `<rect x="${X(0)}" y="${Y(fr.SV)}" width="${fr.SU * s}" height="${fr.SV * s}" fill="#f6efe2" stroke="#1d1a16" stroke-width="1.5"/>`;
    for (const o of it.ops || []) if (o.type === 'hole' && (o.face === 'A' || o.face === 'B') && !String(o.tag || '').startsWith('hw' + hw.id)) g += `<circle cx="${X(o.u)}" cy="${Y(o.v)}" r="${Math.max(1.5, o.dia / 2 * s)}" fill="none" stroke="#8a8378" stroke-dasharray="2 2"/>`;
    for (const o of others) for (const r of rects(o)) g += `<rect x="${X(r.u0)}" y="${Y(r.v1)}" width="${(r.u1 - r.u0) * s}" height="${(r.v1 - r.v0) * s}" fill="${clash === o ? 'rgba(217,72,60,.35)' : 'rgba(120,115,105,.28)'}" stroke="${clash === o ? '#d9483c' : '#8a8378'}"/>`;
    for (const r of rects(hw)) g += `<rect class="hpme" x="${X(r.u0)}" y="${Y(r.v1)}" width="${(r.u1 - r.u0) * s}" height="${(r.v1 - r.v0) * s}" fill="${clash ? 'rgba(217,72,60,.45)' : 'rgba(31,95,180,.35)'}" stroke="${clash ? '#d9483c' : '#1f5fb4'}" style="cursor:move"/>`;
    if (hinge) hingeSpots(hw, it).forEach((p, k) => { g += `<circle cx="${X(p.u)}" cy="${Y(p.v)}" r="${p.c.dia / 2 * s}" fill="none" stroke="#1f5fb4" stroke-width="2"/><text x="${X(p.u) + 4}" y="${Y(p.v) - p.c.dia / 2 * s - 4}" font-size="11" fill="#1f5fb4">${Math.round(p[along])}</text>`; });
    g += `<text x="${X(fr.SU / 2)}" y="${H - 18}" font-size="12" text-anchor="middle">${fmt(fr.SU)} мм</text><text x="18" y="${Y(fr.SV / 2)}" font-size="12" text-anchor="middle" transform="rotate(-90 18 ${Y(fr.SV / 2)})">${fmt(fr.SV)} мм</text>`;
    prev.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Segoe UI, Arial">${g}</svg>`;
    document.getElementById('hpWarn').textContent = warn || (clash ? `✕ Накладывается на «${HW_TYPES[clash.type].name}» — сдвиньте в свободное место` : '');
    document.getElementById('hpWarn').className = clash || warn ? 'warn' : 'note';
    if (!clash && !warn) document.getElementById('hpWarn').textContent = '✓ Место свободно';
    warn = '';
  }
  const syncFields = () => { q('du').value = fmtIn(+hw.du || 0); q('dv').value = fmtIn(+hw.dv || 0); if (hinge) q('positions').value = hingeSpots({ ...hw, du: 0, dv: 0 }, it).map(p => Math.round(p[along])).join(', '); };
  const toFace = e => { const svg = prev.querySelector('svg'), pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return { u: (p.x - m) / s, v: (H - m - p.y) / s }; };
  let drag = null;
  prev.onpointerdown = e => {
    e.preventDefault();
    const f = toFace(e);
    if (hinge) {   // ближайшая чашка — тянем её вдоль кромки
      const sp = hingeSpots(hw, it); let k = -1, best = 1e9;
      sp.forEach((p, i) => { const d = Math.hypot(p.u - f.u, p.v - f.v); if (d < best) { best = d; k = i; } });
      if (best < 60) { drag = { cup: k, list: hingeSpots({ ...hw, du: 0, dv: 0 }, it).map(p => p[along]) }; prev.setPointerCapture(e.pointerId); return; }
    }
    if (e.target.classList.contains('hpme')) { drag = { f, du: +hw.du || 0, dv: +hw.dv || 0 }; prev.setPointerCapture(e.pointerId); }
  };
  prev.onpointermove = e => {
    if (!drag) return;
    const f = toFace(e);
    if (drag.cup !== undefined) { drag.list[drag.cup] = Math.round(Math.max(30, Math.min((along === 'v' ? fr.SV : fr.SU) - 30, f[along] - (along === 'v' ? +hw.dv || 0 : +hw.du || 0)))); hw.place = 'manual'; hw.positions = drag.list.join(', '); }
    else { hw.du = Math.round(drag.du + f.u - drag.f.u); hw.dv = Math.round(drag.dv + f.v - drag.f.v); }
    syncFields(); draw();
  };
  prev.onpointerup = () => { drag = null; };
  body.onchange = e => {
    const k = e.target.dataset.k; if (!k) return;
    if (k === 'positions') { hw.place = 'manual'; hw.positions = e.target.value; } else hw[k] = Math.max(k === 'du' || k === 'dv' ? -1e9 : 0, parseFloat(String(e.target.value).replace(',', '.')) || 0);
    draw();
  };
  body.onkeydown = e => {
    e.stopPropagation();
    if (e.target.tagName === 'INPUT') return;
    const st = e.shiftKey ? 10 : 1, d = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, st], ArrowDown: [0, -st] }[e.key];
    if (d) { e.preventDefault(); hw.du = (+hw.du || 0) + d[0]; hw.dv = (+hw.dv || 0) + d[1]; syncFields(); draw(); }
  };
  document.getElementById('hpReset').onclick = () => { hw.du = 0; hw.dv = 0; syncFields(); draw(); };
  document.getElementById('hpOk').onclick = () => {
    if (clash) { warn = `Нельзя: накладывается на «${HW_TYPES[clash.type].name}». Сдвиньте или удалите ту фурнитуру.`; return draw(); }
    const pair = twin && document.getElementById('hpPair')?.checked;
    closeDialog();
    let msg = '';
    commit(() => {
      if (isNew) { hw.id = nid(); P.hw.push(hw); if (baseNeeded(hw.type)) msg = attachBase(hw, it, null); }
      else { const i = P.hw.findIndex(h => h.id === hw.id); P.hw[i] = hw; delete hw.auto; }
      hwSync(hw, it);
      if (pair) {   // вторая направляющая — на противоположную боковину ящика, ящик уже стоит по первой; проверяем зазор
        const h2 = { ...hw, id: nid(), target: twin.id, base: null };
        const f = findBase(h2, twin, P.items, 60);
        if (f) h2.base = f.part.id;
        P.hw.push(h2); hwSync(h2, twin);
        msg += ' · ' + slideFit(it, twin, item(hw.base), f && f.part);
      }
    });
    status(`${isNew ? 'Поставлено' : 'Место изменено'}: ${describeHw(hw, it)}${msg ? ' · ' + msg : ''}`);
  };
  draw();
}
// Противоположная боковина того же ящика (модуль или связка): параллельная, на одной высоте и глубине
function slideTwin(it) {
  const mates = P.items.filter(i => i.id !== it.id && ((it.g && i.g === it.g) || (it.link && i.link === it.link)));
  const ov = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0);
  return mates.filter(i => thinAxis(i) === 'x' && Math.abs(i.x - it.x) > 50 && ov(i.y, i.y + i.h, it.y, it.y + it.h) > it.h * 0.5 && ov(i.z, i.z + i.d, it.z, it.z + it.d) > it.d * 0.5)
    .sort((a, b) => Math.abs(a.h - it.h) + Math.abs(a.d - it.d) - Math.abs(b.h - it.h) - Math.abs(b.d - it.d))[0] || null;
}
// Подходит ли ящик в проём: с каждой стороны нужно 13 мм под направляющую
function slideFit(a, b, ca, cb) {
  if (!ca || !cb) return 'вторая направляющая: боковина корпуса не найдена рядом — присоедините 🧲';
  const L = Math.min(a.x, b.x), R = Math.max(a.x + a.w, b.x + b.w), box = R - L;
  const opening = Math.max(ca.x, cb.x) - Math.min(ca.x + ca.w, cb.x + cb.w), need = opening - 26;
  if (Math.abs(box - need) <= 0.5) return `ящик ${fmt(box)} мм в проёме ${fmt(opening)} — по 13 мм с каждой стороны ✓`;
  return `⚠ ящик ${fmt(box)} мм, а нужно ${fmt(need)} (проём ${fmt(opening)} − 26): ${box > need ? 'уменьшите' : 'увеличьте'} ширину на ${fmt(Math.abs(box - need))} мм`;
}
// ---------------------------------------------------------------- техника: каталог, куда ставить, свойства, вырез под варочную панель
const APP_NO_OPS = 'Это техника: отверстия, вырезы и фрезеровка делаются в деталях мебели (под варочную панель — «✂ Вырез в столешнице» в её свойствах)';
const appNiche = e => [e.niche ? `ниша ${e.niche.map(fmt).join(' × ')}` : '', e.cut ? `вырез ${e.cut.map(fmt).join(' × ')}` : ''].filter(Boolean).join(', ');
const FACING = ['к нам', 'вправо', 'к стене', 'влево'];
// Свойства техники — справа и в окне техники
function appPanel(i) {
  const e = i.spec, c = appModels.get(i.id), open = (appState.get(i.id) || { to: 0 }).to > 0;
  const boxNote = ['ovenbi', 'microbi'].includes(e.shape) && e.niche ? ' — это корпус, который уходит в нишу (лицевая рамка шире, она снаружи)' : e.shape === 'hob' ? ' — это стекло на столешнице (корпус под ним уходит в вырез)' : '';
  return `<div class="sec"><b>🔌 Техника</b>${fld('Название', 'name', label(i), { text: true })}
      <div class="note">${esc(catName(e.cat))} · ${esc(MOUNTS[e.mount] || '')}${e.brand ? ' · ' + esc(e.brand) : ''}</div>
      ${fld('Цвет корпуса', 'finish', i.finish || 'white', { options: FINISHES })}
      ${c && c.motion ? `<div class="btns"><button class="accent" data-cmd="app-toggle" title="Показать, как открывается: двери, люк, крышка, ящик">${open ? '■ Закрыть' : '▶ Открыть'}</button></div>` : ''}</div>
    <div class="sec"><b>Размеры техники, мм</b><div class="row">${fld('Ширина', 'aw', e.w)}${fld('Высота', 'ah', e.h)}${fld('Глубина', 'ad', e.d)}</div>
      <div class="note">${appInfo(e).map(esc).join('<br>')}</div></div>
    <div class="sec"><b>Положение, мм</b><div class="row">${fld('X слева', 'x', i.x)}${fld('Y от пола', 'y', i.y)}${fld('Z от стены', 'z', i.z)}</div>
      <div class="note">Стоит лицом ${FACING[(i.rot | 0) % 4]}. Коробка в проекте ${dims(i)} мм${boxNote}.</div></div>`;
}
function appActions(i, inDialog) {
  return `<div class="sec"><b>Действия</b><div class="btns"><button data-cmd="rot-y" title="На 90° вокруг вертикали">⟲ Повернуть</button>${i.spec.shape === 'hob' ? '<button data-cmd="app-cut" title="Вырез в детали под стеклом панели — по размеру из паспорта, насквозь. Сдвинули панель — нажмите ещё раз">✂ Вырез в столешнице</button>' : ''}<button data-cmd="duplicate">Копия</button>
    ${i.g ? '<button data-cmd="ungroup">Вынуть из модуля</button>' : ''}${inDialog ? '' : '<button class="danger" data-cmd="delete">Удалить</button>'}</div></div>`;
}
function appChange(i, key, raw, v) {
  if (key === 'finish') return commit(() => { i.finish = raw; });
  if (!isFinite(v)) return refreshInspector();
  if (key === 'x') return moveSel(v - i.x, 0, 0);
  if (key === 'y') return moveSel(0, v - i.y, 0);
  if (key === 'z') return moveSel(0, 0, v - i.z);
  const k = { aw: 'w', ah: 'h', ad: 'd' }[key]; if (!k) return;
  if (!(v >= 10 && v <= 5000)) { status('Размер техники — от 10 до 5000 мм'); return refreshInspector(); }
  const spec = { ...i.spec, [k]: r1(v) }, G = appGeom(spec, i.rot);
  const hit = noClash() && clash([{ ...i, w: G.w, h: G.h, d: G.d }], clashedBefore([i]));
  if (hit) { status(`Не помещается: мешает ${who(hit)}`); return refreshInspector(); }
  commit(() => { i.spec = spec; i.w = G.w; i.h = G.h; i.d = G.d; });
  status(`Размеры техники: ${fmt(spec.w)} × ${fmt(spec.h)} × ${fmt(spec.d)} мм`);
}
// Куда ставить новую технику (коробка G — лицом к нам):
// встраиваемая — в нишу выбранного шкафа: между боковинами, первое свободное место снизу, передом вровень с боковинами;
// настольная и варочная панель — сверху на выбранное, без выбора — на столешницу или верх тумбы (700…1000 мм);
// вытяжка — над плитой; настенная — на стену на свою высоту; остальное — рядом с выбранным, передом вровень;
// ничего не выбрано — у задней стены справа от мебели. Место занято — ищем свободное рядом.
const COOK = ['stove', 'hob', 'tablehob'];
function appSpot(spec, G) {
  const fits = p => !noClash() || !clash([{ id: -1, x: p.x, y: p.y, z: p.z, w: G.w, h: G.h, d: G.d }], new Set());
  const all = selItems(), parts = all.filter(i => !isApp(i)), sb = all.length ? bbox(all) : null, g0 = all[0] && all[0].g && group(all[0].g);
  const where = !all.length ? '' : all.length === 1 ? `«${label(all[0])}»` : g0 && all.every(i => i.g === g0.id) ? `«${g0.name}»` : '«выбранное»';
  const RH = P.room.h || 2700, s = spec.shape, m = spec.mount;
  const near = (p, why) => {
    if (fits(p)) return { ...p, why };
    for (let t = 10; t <= 6000; t += 10) for (const x of [p.x + t, p.x - t]) if (fits({ ...p, x })) return { ...p, x: r1(x), why };
    return null;
  };
  // 1) встраиваемая — в нишу выбранного шкафа
  const niche = ['ovenbi', 'microbi', 'warmer', 'filter', 'disposer'].includes(s) || (s === 'fridge' && /^built/.test(spec.layout)) || ((s === 'wine' || s === 'custom') && m === 'bi') || (s === 'hood' && ['tele', 'box'].includes(spec.kind));
  if (niche && parts.length) {
    const v = parts.filter(i => thinAxis(i) === 'x').sort((a, b) => a.x - b.x);
    for (let k = 0; k + 1 < v.length; k++) {
      const A = v[k], B = v[k + 1], x0 = A.x + A.w, x1 = B.x;
      if (x1 - x0 < G.w - 0.5) continue;
      const front = Math.max(A.z + A.d, B.z + B.d), y1 = Math.min(A.y + A.h, B.y + B.h), x = r1(x0 + (x1 - x0 - G.w) / 2), z = r1(front - G.d);
      for (let y = Math.max(A.y, B.y); y + G.h <= y1 + 0.5; y += 2) if (fits({ x, y, z })) return { x, y: r1(y), z, why: `в нишу ${where}` };
    }
  }
  // 2) настольная и варочная панель — сверху
  const onTop = (b, why) => {
    const span = b.x1 - b.x0 - G.w; if (span < -0.5) return null;
    const room = b.z1 - b.z0 - G.d, z = r1(b.z0 + (s === 'hob' || room < 60 ? Math.max(0, room / 2) : 30)), c = b.x0 + Math.max(0, span) / 2;
    for (let t = 0; t <= Math.max(0, span) / 2 + 5; t += 10) for (const x of [c + t, c - t]) if (x >= b.x0 - 0.5 && x + G.w <= b.x1 + 0.5 && fits({ x, y: b.y1, z })) return { x: r1(x), y: r1(b.y1), z, why };
    return null;
  };
  if (m === 'table' || s === 'hob') {
    if (sb) { const p = onTop(sb, `сверху на ${where}`); if (p) return p; }
    // без выбора или сверху занято — на свободную столешницу или верх тумбы
    for (const t of panels().filter(i => thinAxis(i) === 'y' && i.y + i.h >= 700 && i.y + i.h <= 1000).sort((a, b) => b.w * b.d - a.w * a.d)) { const p = onTop(bbox([t]), `на «${label(t)}»${sb ? ` (на ${where} нет места)` : ''}`); if (p) return p; }
  }
  // 3) вытяжка — над плитой или варочной панелью
  if (s === 'hood') {
    const cook = all.find(i => isApp(i) && COOK.includes(i.spec.shape)) || P.items.find(i => isApp(i) && COOK.includes(i.spec.shape));
    if (cook) {
      // настенная — на стену за плитой (плита у задней стены — вплотную к стене), островная — над центром плиты
      const gas = cook.spec.fuel === 'gas', p = { x: r1(cook.x + cook.w / 2 - G.w / 2), y: r1(Math.min(RH - G.h, cook.y + cook.h + (gas ? 750 : 650))), z: spec.kind === 'island' ? r1(cook.z + cook.d / 2 - G.d / 2) : cook.z < 150 ? 0 : r1(cook.z) };
      if (fits(p)) return { ...p, why: `над «${label(cook)}», на ${gas ? 75 : 65} см выше` };
    }
    if (sb && parts.length && ['flat', 'tele', 'box'].includes(spec.kind)) { const p = near({ x: r1((sb.x0 + sb.x1 - G.w) / 2), y: r1(Math.max(0, sb.y0 - G.h)), z: r1(sb.z0) }, `под ${where}`); if (p) return p; }
  }
  // 4) на стену: телевизор, кондиционер, котёл, водонагреватель, вытяжка без плиты
  if (m === 'wall' || s === 'hood') {
    const y = r1(Math.max(0, Math.min(RH - G.h, s === 'tv' ? 1150 - G.h / 2 : s === 'ac' ? RH - G.h - 150 : s === 'heater' ? RH - G.h - 300
      : s === 'boiler' ? 1250 : s === 'outdoor' ? RH - G.h - 400 : s === 'hood' ? 1500 : 1300)));
    if (sb) {
      if (['tv', 'ac', 'hood'].includes(s)) { const p = near({ x: r1((sb.x0 + sb.x1 - G.w) / 2), y: s === 'tv' ? r1(Math.min(RH - G.h, Math.max(y, sb.y1 + 150))) : y, z: 0 }, `над ${where}, на стене`); if (p) return p; }
      else { const yy = r1(Math.max(0, sb.y1 - G.h)); for (const x of [sb.x1, sb.x0 - G.w]) if (fits({ x, y: yy, z: 0 })) return { x: r1(x), y: yy, z: 0, why: `на стене рядом с ${where}, верх вровень` }; }
    }
    const p = near({ x: r1(freeX(y, G.h)), y, z: 0 }, `на стене, низ на ${fmt(y)} мм от пола`);
    if (p) return p;
  }
  // 5) рядом с выбранным, передом вровень
  const miss = niche && parts.length ? ` (в нишу ${where} не входит${spec.niche ? `: нужна ниша ${spec.niche.map(fmt).join(' × ')} мм` : ''})` : '';
  if (sb) {
    const z = r1(Math.max(0, sb.z1 - G.d));
    for (const [x, side] of [[sb.x1, 'справа от'], [sb.x0 - G.w, 'слева от']]) if (fits({ x, y: 0, z })) return { x: r1(x), y: 0, z, why: `${side} ${where}${miss}` };
  }
  // 6) у задней стены справа от мебели
  const tip = miss || (m === 'table' || s === 'hob' ? ' (выберите столешницу или тумбу — встанет сверху)' : '');
  return near({ x: r1(freeX(0, G.h)), y: 0, z: 0 }, `у стены справа от мебели${tip}`) || { x: r1(freeX(0, G.h)), y: 0, z: 0, why: 'свободного места нет — стоит с наложением, подвиньте' };
}
function addAppliance(e0) {
  const spec = JSON.parse(JSON.stringify(e0)); delete spec.id;
  const G = appGeom(spec, 0), at = appSpot(spec, G);
  const it = { id: nid(), kind: 'appliance', name: '', spec, finish: spec.finish || 'white', rot: 0, x: r1(at.x), y: r1(at.y), z: r1(at.z), w: G.w, h: G.h, d: G.d, g: 0 };
  commit(() => { P.items.push(it); sel.clear(); sel.add(it.id); openGroup = 0; });
  status(`🔌 ${spec.name} — ${at.why}. Стрелки — подвинуть, ⟲ — повернуть${appModels.get(it.id)?.motion ? ', ▶ Открыть — как открывается' : ''}`);
  return it;
}
// Каталог техники: разделы от холодильников до чайников, фильтр (отдельностоящая, встраиваемая, настольная, настенная), поиск;
// «Своя техника» — любые размеры и как открывается
const appUI = { cat: 'fridge', mount: '', q: '' };
function appCatalog() {
  openDialog('🔌 Техника', '<div id="appUI" class="appui"></div>', '<button data-close>Закрыть</button>', true);
  modal.querySelector('.dialog').classList.add('xwide');
  const ui = document.getElementById('appUI'), body = document.getElementById('dlgBody');
  const k = kindOfSelection(), target = k.type === 'none' ? '' : k.type === 'group' ? k.g.name : k.type === 'item' ? label(k.it) : 'выбранного';
  const match = e => (appUI.q ? `${e.name} ${e.brand || ''} ${catName(e.cat)} ${MOUNTS[e.mount]}`.toLowerCase().includes(appUI.q) : e.cat === appUI.cat) && (!appUI.mount || e.mount === appUI.mount);
  const card = e => `<div class="appcard"><div class="appico">${appIcon(e, 64)}</div><div class="appmain"><b>${esc(e.name)}</b>
      <div class="apptags"><span class="tag">${esc(MOUNTS[e.mount])}</span>${e.src === 'shop' ? '<span class="tag shop" title="Размеры по карточкам магазинов Узбекистана">магазин</span>' : '<span class="tag std" title="Типовой размер этого класса техники">типовой</span>'}${appUI.q ? `<span class="tag std">${esc(catName(e.cat))}</span>` : ''}</div>
      <div class="appdims">${fmt(e.w)} × ${fmt(e.h)} × ${fmt(e.d)} мм${appNiche(e) ? ' · ' + appNiche(e) : ''}</div>
      <div class="note">${esc(e.open || '')}</div></div>
      <button class="accent" data-appadd="${e.id}">Поставить</button></div>`;
  const tabs = () => `<div class="hwtabs">${APP_CATS.map(([id, n]) => `<button class="${!appUI.q && id === appUI.cat ? 'on' : ''}" data-appcat="${id}">${esc(n)}</button>`).join('')}<button class="${!appUI.q && appUI.cat === 'own' ? 'on' : ''}" data-appcat="own">＋ Своя техника</button></div>`;
  function drawList() {
    const list = APPLIANCES.filter(match);
    ui.querySelector('.applist').innerHTML = list.map(card).join('') || '<div class="note">Ничего не найдено. Нет нужной модели — «＋ Своя техника»: любые размеры и как открывается.</div>';
    ui.querySelector('.appcount').textContent = `${list.length} шт.`;
    ui.querySelectorAll('[data-appcat]').forEach(b => b.classList.toggle('on', !appUI.q && b.dataset.appcat === appUI.cat));
  }
  function draw() {
    if (appUI.cat === 'own' && !appUI.q) {
      ui.innerHTML = `${tabs()}<div class="note">Нет нужной модели — задайте свою: размеры из паспорта или замеренные и как открывается. В 3D это корпус с дверью, ящиком или крышкой.</div>
        <div class="grid3">${fld('Название', 'own-name', 'Своя техника', { text: true })}${fld('Как ставится', 'own-mount', 'free', { options: Object.entries(MOUNTS) })}${fld('Цвет корпуса', 'own-fin', 'white', { options: FINISHES })}</div>
        <div class="grid4">${fld('Ширина, мм', 'own-w', 600)}${fld('Высота, мм', 'own-h', 850)}${fld('Глубина, мм', 'own-d', 600)}${fld('Как открывается', 'own-open', 'R', { options: CUSTOM_OPEN })}</div>
        <div class="warn" id="ownWarn"></div><div class="btns"><button class="accent" data-appown>Поставить</button></div>`;
      return;
    }
    ui.innerHTML = `<div class="note">Размеры — по карточкам магазинов Узбекистана (Artel, Shivaki, Samsung, LG, Atlant, Beko, Bosch, Midea, Gorenje, Navien, Ariston…) и типовые размеры каждого класса; перед заказом мебели сверьте с паспортом своей модели.
      ${target ? `Куда встанет — относительно «${esc(target)}»: встраиваемая войдёт в нишу шкафа, настольная и варочная панель — сверху, вытяжка — над плитой, остальное — рядом.` : 'Ничего не выбрано: техника встанет у стены справа от мебели, настольная — на столешницу. Выберите шкаф или столешницу — встанет в нишу или сверху.'}</div>
      ${tabs()}
      <div class="appbar"><div class="hwtabs">${[['', 'Все'], ...Object.entries(MOUNTS)].map(([id, n]) => `<button class="${id === appUI.mount ? 'on' : ''}" data-appmount="${id}">${esc(n[0].toUpperCase() + n.slice(1))}</button>`).join('')}</div>
      <input class="app-q" type="search" placeholder="Поиск по всем разделам: Artel, Samsung, 60 см, No Frost, газ…" value="${esc(appUI.q)}"><span class="appcount note"></span></div>
      <div class="applist"></div>`;
    drawList();
  }
  body.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const d = b.dataset;
    if (d.appcat) { appUI.cat = d.appcat; appUI.q = ''; return draw(); }
    if (d.appmount !== undefined) { appUI.mount = d.appmount; return draw(); }
    if (d.appadd) { const e0 = APPLIANCES.find(x => x.id === d.appadd); if (e0) { closeDialog(); addAppliance(e0); } return; }
    if ('appown' in d) {
      const q = key => body.querySelector(`[data-k="${key}"]`), num = key => parseFloat(String(q(key).value).replace(',', '.'));
      const w = num('own-w'), h = num('own-h'), dd = num('own-d'), ok = q('own-open').value;
      if (![w, h, dd].every(v => v >= 10 && v <= 5000)) { document.getElementById('ownWarn').textContent = 'Размеры — от 10 до 5000 мм'; return; }
      closeDialog();
      addAppliance({ cat: 'own', mount: q('own-mount').value, name: q('own-name').value.trim() || 'Своя техника', w, h, d: dd, shape: 'custom', openKind: ok, open: (CUSTOM_OPEN.find(c => c[0] === ok) || [0, ''])[1], src: 'own', finish: q('own-fin').value });
    }
  };
  body.oninput = e => { if (!e.target.classList.contains('app-q')) return; appUI.q = e.target.value.trim().toLowerCase(); drawList(); };
  body.onkeydown = e => e.stopPropagation();
  draw();
}
// Вырез в столешнице под варочную панель: в детали прямо под стеклом, размер — из паспорта, насквозь.
// Помечен tag 'app<id>': нажали ещё раз — старый вырез заменится новым; удалили панель — вырез пропадёт.
function hobCut(it) {
  const e = it.spec, cut = e.cut || [e.w - 30, e.d - 30], q = (it.rot | 0) % 2, cw = q ? cut[1] : cut[0], ch = q ? cut[0] : cut[1];
  const cx = it.x + it.w / 2, cz = it.z + it.d / 2, tag = 'app' + it.id;
  const top = panels().find(p => thinAxis(p) === 'y' && Math.abs(p.y + p.h - it.y) <= 1 && p.x <= cx - cw / 2 + 0.5 && p.x + p.w >= cx + cw / 2 - 0.5 && p.z <= cz - ch / 2 + 0.5 && p.z + p.d >= cz + ch / 2 - 0.5);
  if (!top) return status(`Под панелью нет столешницы, в которую войдёт вырез ${fmt(cw)} × ${fmt(ch)} мм: поставьте панель на деталь (низ стекла = верх детали)`);
  commit(() => {
    for (const x of P.items) if (x.ops) x.ops = x.ops.filter(o => o.tag !== tag);
    (top.ops = top.ops || []).push({ type: 'cut', face: 'A', u: r1(cx - cw / 2 - top.x), v: r1(cz - ch / 2 - top.z), cw, ch, r: 0, depth: top.h, through: true, angle: 0, preset: 'custom', tag, what: `под варочную панель «${label(it)}»` });
  });
  status(`Вырез ${fmt(cw)} × ${fmt(ch)} мм в «${label(top)}» — есть на её чертеже. Сдвинули панель — нажмите «✂ Вырез» ещё раз`);
}
// Лист чертежа техники: виды спереди, сбоку и сверху, ниша, вырез, как открывается
function appSheet(it) {
  const e = it.spec;
  return `<section class="sheet"><div class="sheet-head"><b>🔌 ${esc(label(it))}</b><span>${esc(catName(e.cat))} · ${esc(MOUNTS[e.mount] || '')} · ${fmt(e.w)} × ${fmt(e.h)} × ${fmt(e.d)} мм · в проекте: X ${fmt(it.x)}, Y ${fmt(it.y)}, Z ${fmt(it.z)}, лицом ${FACING[(it.rot | 0) % 4]}</span></div>
    ${appSheetSVG(e)}<div class="note">${appInfo(e).map(esc).join('<br>')}</div></section>`;
}
function appRows() {
  const rows = new Map();
  for (const i of P.items.filter(isApp)) { const key = JSON.stringify([label(i), i.spec, i.finish]); const r = rows.get(key) || { e: i.spec, fin: i.finish, name: label(i), n: 0 }; r.n++; rows.set(key, r); }
  return [...rows.values()];
}
function appSpecTable() {
  const rows = appRows(); if (!rows.length) return '';
  return `<table class="spec"><tr><th>Техника</th><th>Раздел</th><th class="n">Ш × В × Г, мм</th><th>Ниша / вырез, мм</th><th>Цвет</th><th class="n">Кол-во</th></tr>${rows.map(r => `<tr><td>${esc(r.name)}</td><td>${esc(catName(r.e.cat))}, ${esc(MOUNTS[r.e.mount] || '')}</td><td class="n">${fmt(r.e.w)} × ${fmt(r.e.h)} × ${fmt(r.e.d)}</td><td>${appNiche(r.e)}</td><td>${esc((FINISHES.find(f => f[0] === r.fin) || [0, ''])[1])}</td><td class="n">${r.n}</td></tr>`).join('')}</table>`;
}
// ---------------------------------------------------------------- окно детали
function partEditor(id) {
  const it = item(id); if (!it) return;
  if (!(sel.size === 1 && sel.has(id))) { sel.clear(); sel.add(id); openGroup = it.g || 0; selectionChanged(); }
  openDialog('', '', `<button class="danger" data-pe="delete">${isApp(it) ? 'Удалить технику' : 'Удалить деталь'}</button><span class="grow"></span><button data-cmd="drawing">📐 Чертёж на печать</button><button class="accent" data-close>Готово</button>`, true);
  dlgIsPart = true; partEditorId = id;
  modal.querySelector('.dialog').classList.add('xwide');
  const body = document.getElementById('dlgBody');
  body.onclick = e => {
    const c = e.target.closest('[data-cmd]');
    if (c && ['measure-hole', 'measure-cut', 'paint'].includes(c.dataset.cmd)) { partEditorId = 0; closeDialog(); return; }   // эти инструменты работают в 3D
    inspClick(e);
  };
  body.onchange = e => inspChange(e);
  body.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.target.blur(); if (e.key === 'Escape') closeDialog(); };
  document.getElementById('dlgFoot').onclick = e => { if (e.target.closest('[data-pe="delete"]')) { partEditorId = 0; closeDialog(); deleteSel(); } };
  renderPartEditor();
}
function renderPartEditor() {
  const it = item(partEditorId); if (!it) { partEditorId = 0; closeDialog(); return; }
  const g = it.g && group(it.g), app = isApp(it);
  document.getElementById('dlgTitle').textContent = app ? `Техника: ${label(it)} · ${fmt(it.spec.w)} × ${fmt(it.spec.h)} × ${fmt(it.spec.d)} мм` : `Деталь: ${label(it)}${g ? ` · ${g.name}` : ''} · ${dims(it)} мм`;
  const body = document.getElementById('dlgBody'), sc = body.querySelector('.pe-side')?.scrollTop || 0;
  body.innerHTML = `<div class="partgrid"><div class="op-preview pe-draw">${app ? appSheetSVG(it.spec, { maxW: 680, maxH: 600 }) : drawingSVG(it, { width: 680, height: 540 }).svg}</div><div class="inspector pe-side">${app ? appPanel(it) + appActions(it, true) : itemPanel(it)}</div></div>`;
  body.querySelector('.pe-side').scrollTop = sc;
}
function hwDelete(id) {
  const hw = P.hw.find(h => h.id === id); if (!hw) return;
  commit(() => {
    for (const x of P.items) if (x.ops) x.ops = x.ops.filter(o => o.tag !== 'hw' + id);
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
// Отдельный лист детали: сверления с диаметрами, глубинами и назначением; где деталь стоит в шкафу
const sheetPart = i => (i.ops || []).some(o => o.tag !== 'conf' && o.tag !== 'shelf');   // есть фурнитура или своя обработка
function partSheet(it, num) {
  const fr = frame(it), g = it.g ? group(it.g) : null, gb = g ? bbox(groupItems(g.id)) : null;
  const hwName = tag => { const h = String(tag || '').startsWith('hw') && P.hw.find(x => 'hw' + x.id === tag); return h ? HW_TYPES[h.type].name : tag === 'conf' ? 'конфирмат' : tag === 'shelf' ? 'полкодержатель' : tag === 'hinge' ? 'петля' : tag === 'sidecut' ? 'срез боковины' : /^app\d/.test(tag || '') ? 'под технику' : ''; };
  const ops = (it.ops || []).map((o, k) => `<tr><td>${k + 1}</td><td>${esc(describeOp(o, it))}</td><td>${esc(o.mill || hwName(o.tag))}</td></tr>`).join('');
  const where = gb ? ` · в шкафу: от левого края ${fmt(it.x - gb.x0)}, от низа ${fmt(it.y - gb.y0)}, от задней кромки ${fmt(it.z - gb.z0)} мм` : '';
  return `<section class="sheet"><div class="sheet-head"><b>${num ? num + '. ' : ''}${esc(label(it))}</b><span>${g ? esc(g.name) + ' · ' : ''}${esc(mat(it.mat).name)} ${fmt(mat(it.mat).t)} мм · ${fmt(fr.SU)} × ${fmt(fr.SV)} × ${fmt(fr.T)} мм${where}</span></div>
    ${drawingSVG(it).svg}${ops ? `<table class="spec"><tr><th>№</th><th>Обработка: где, диаметр, глубина</th><th>Для чего</th></tr>${ops}</table>` : '<div class="note">Без обработки.</div>'}</section>`;
}
const colorOf = i => isApp(i) ? '#d5dbe0' : mat(i.mat).color;
// Шкаф на одном листе: вид 45° в сборе и без фасадов, все размеры, таблица всех деталей с номерами
const FRONT_KINDS = new Set(['door', 'drawerFront']);
function moduleSheet(g, k) {
  const list = groupItems(g.id).filter(i => !isApp(i)), apps = groupItems(g.id).filter(isApp);
  if (!list.length) return '';   // в модуле только техника — у каждой свой лист
  const b = bbox(list);
  const order = [...list].sort((a, c) => (FRONT_KINDS.has(a.kind) - FRONT_KINDS.has(c.kind)) || a.y - c.y || a.x - c.x || a.z - c.z);
  const num = new Map(order.map((i, n) => [i.id, n + 1]));
  const hwOn = i => hwOf(i.id).map(h => HW_TYPES[h.type].name);
  const conf = i => (i.ops || []).filter(o => o.tag === 'conf').reduce((s, o) => s + Math.max(1, o.count | 0), 0), shelf = i => (i.ops || []).filter(o => o.tag === 'shelf').reduce((s, o) => s + Math.max(1, o.count | 0), 0);
  const rows = order.map(i => {
    const m = mat(i.mat), [L, W, T] = [i.w, i.h, i.d].map(r1).sort((a, c) => c - a), notes = [];
    if (hwOn(i).length) notes.push(hwOn(i).join(', '));
    if (conf(i)) notes.push(`конфирматы ${conf(i)}`); if (shelf(i)) notes.push(`полкодерж. ${shelf(i)}`);
    if (sheetPart(i)) notes.push('<b>→ отдельный лист</b>');
    return `<tr><td>${num.get(i.id)}</td><td>${esc(label(i))}</td><td class="n">${fmt(L)}</td><td class="n">${fmt(W)}</td><td class="n">${fmt(T)}</td><td>${esc(m.name)}</td><td class="n">${fmt(i.x - b.x0)}; ${fmt(i.y - b.y0)}; ${fmt(i.z - b.z0)}</td><td>${notes.join(' · ')}</td></tr>`;
  }).join('');
  const hw = new Map();
  for (const h of P.hw) { const it = item(h.target); if (it && it.g === g.id) { const n = HW_TYPES[h.type].name; hw.set(n, (hw.get(n) || 0) + hardwareCount(h, it)); } }
  const svg = isoModuleSVG(list, { colorOf, numOf: i => num.get(i.id), isFront: i => FRONT_KINDS.has(i.kind) });
  return `<section class="sheet"><div class="sheet-head"><b>${k ? k + '. ' : ''}${esc(g.name)}${g.kind ? ` <i class="kind">${esc(KIND_NAMES[g.kind] || g.kind)}</i>` : ''}</b><span>Габарит ${fmt(b.x1 - b.x0)} × ${fmt(b.y1 - b.y0)} × ${fmt(b.z1 - b.z0)} мм · деталей: ${list.length}</span></div>
    ${svg}
    <table class="spec"><tr><th>№</th><th>Деталь</th><th class="n">Длина</th><th class="n">Ширина</th><th class="n">Толщ.</th><th>Материал</th><th class="n">X; Y; Z в шкафу</th><th>Фурнитура и присадка</th></tr>${rows}</table>
    ${hw.size ? `<table class="spec"><tr><th>Фурнитура шкафа</th><th class="n">Кол-во</th></tr>${[...hw].map(([n, c]) => `<tr><td>${esc(n)}</td><td class="n">${c}</td></tr>`).join('')}</table>` : ''}
    ${apps.length ? `<table class="spec"><tr><th>Техника в модуле</th><th class="n">Ш × В × Г</th><th>Ниша / вырез</th><th class="n">X; Y; Z в шкафу</th></tr>${apps.map(a => `<tr><td>${esc(label(a))}</td><td class="n">${fmt(a.spec.w)} × ${fmt(a.spec.h)} × ${fmt(a.spec.d)}</td><td>${appNiche(a.spec)}</td><td class="n">${fmt(a.x - b.x0)}; ${fmt(a.y - b.y0)}; ${fmt(a.z - b.z0)}</td></tr>`).join('')}</table>` : ''}</section>`;
}
function overviewSheet() {
  const ov = overviewSVG(P.items, P.groups, { colorOf });
  const b = bbox(P.items);
  const mods = ov.order.map((id, k) => { const g = group(id), l = groupItems(id), mb = bbox(l); return `<tr><td>${k + 1}</td><td>${esc(g.name)}</td><td>${esc(KIND_NAMES[g.kind] || '')}</td><td class="n">${fmt(mb.x1 - mb.x0)} × ${fmt(mb.y1 - mb.y0)} × ${fmt(mb.z1 - mb.z0)}</td><td class="n">${l.length}</td></tr>`; }).join('');
  const loose = P.items.filter(i => !i.g && !isApp(i)).length, nApps = P.items.filter(isApp).length;
  return `<section class="sheet"><div class="sheet-head"><b>Общий вид: ${esc(P.name)}</b><span>Габарит ${fmt(b.x1 - b.x0)} × ${fmt(b.y1 - b.y0)} × ${fmt(b.z1 - b.z0)} мм · шкафов: ${ov.order.length} · деталей: ${panels().length}${nApps ? ` · техники: ${nApps}` : ''}</span></div>
    ${ov.svg}<table class="spec"><tr><th>№</th><th>Шкаф / модуль</th><th>Тип</th><th class="n">Ш × В × Г, мм</th><th class="n">Деталей</th></tr>${mods}
    ${loose ? `<tr><td></td><td>Отдельные детали</td><td></td><td></td><td class="n">${loose}</td></tr>` : ''}</table>${hwSpecTable()}${appSpecTable()}</section>`;
}
// Комплект чертежей: scope 'all' — общий вид, каждый шкаф со своими деталями, отдельные детали;
// группа — шкаф и его детали; список деталей — только детали
// Детали шкафа для отдельных листов — с теми же номерами, что на виде 45°
function hwParts(gid) {
  const order = groupItems(gid).filter(i => !isApp(i)).sort((a, c) => (FRONT_KINDS.has(a.kind) - FRONT_KINDS.has(c.kind)) || a.y - c.y || a.x - c.x || a.z - c.z);
  return order.map((i, n) => [i, n + 1]).filter(([i]) => sheetPart(i));
}
function drawingDialog(list, scope) {
  let sheets = [], title;
  if (scope === 'all') {
    if (!P.items.length) return status('В проекте пока нет деталей');
    const ov = overviewSVG(P.items, P.groups, {}).order;
    sheets.push(overviewSheet());
    ov.forEach((id, k) => { sheets.push(moduleSheet(group(id), k + 1)); hwParts(id).forEach(([i, n]) => sheets.push(partSheet(i, `${k + 1}.${n}`))); groupItems(id).filter(isApp).forEach(a => sheets.push(appSheet(a))); });   // детали шкафа — только с фурнитурой и своей обработкой
    P.items.filter(i => !i.g).forEach(i => sheets.push(isApp(i) ? appSheet(i) : partSheet(i)));
    title = `Чертежи проекта (${sheets.length} листов)`;
  } else if (scope && scope.group) {
    sheets.push(moduleSheet(scope.group, 0));
    hwParts(scope.group.id).forEach(([i, n]) => sheets.push(partSheet(i, n)));
    groupItems(scope.group.id).filter(isApp).forEach(a => sheets.push(appSheet(a)));
    title = `Чертёж шкафа: ${scope.group.name}`;
  } else {
    if (!list.length) return status('Выберите деталь или модуль');
    [...list].sort((a, b) => (b.ops || []).length - (a.ops || []).length).forEach(i => sheets.push(isApp(i) ? appSheet(i) : partSheet(i)));
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
  if (sb) sb.onclick = () => saveExport(`${P.name} — ${label(list[0])}`, 'svg', { text: isApp(list[0]) ? appSheetSVG(list[0].spec) : drawingSVG(list[0]).svg });
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
  for (const h of P.hw) if (h.base === undefined && baseNeeded(h.type)) {   // старые проекты: сторону Б находим сами, ничего не двигая
    const it = P.items.find(i => i.id === h.target), f = it && findBase(h, it, P.items, 4);
    h.base = f ? f.part.id : null;
  }
  hwState.clear(); appState.clear();
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
  P = newProject(); filePath = null; sel.clear(); openGroup = 0; undoStack.length = 0; redoStack.length = 0; appState.clear();
  buildRoom(); rebuild(); refreshUI(); setDirty(false); setView('3d');
  roomDialog(true);
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
  new: newFile, open: openFile, room: () => roomDialog(false), paint: () => (bucket.open ? closePalette() : openPalette()), save: () => saveFile(false), cabinet: cabinetDialog,
  'panel-h': () => addPanel('panel-h'), 'panel-v': () => addPanel('panel-v'), 'panel-f': () => addPanel('panel-f'),
  undo, redo, duplicate: duplicateSel, delete: deleteSel, group: groupSel, ungroup: ungroupSel, 'apply-hinges': applyHingesFromInspector,
  'rot-y': () => rotateSel('y'), 'rot-z': () => rotateSel('z'), 'rebuild-group': rebuildGroupFromInspector,
  fit, spec: specDialog, shot: screenshot, drawing: () => drawingDialog(selItems()), drawings: drawingsCommand, 'drawing-module': drawingsCommand,
  'op-hole': () => opDialog('hole'), 'op-cut': () => opDialog('cut'), 'op-corner': () => opDialog('corner'), 'op-bevel': () => opDialog('bevel'), ruler: () => { ruler.toggle(); updateGizmo(); }, 'op-mill': () => millDialog(), 'part-edit': () => { const k = kindOfSelection(); if (k.type === 'item') partEditor(k.it.id); else status('Выберите одну деталь'); }, 'op-shape': () => shapeDialog(),
  hw: () => hwCatalog(), link: () => linkSel(true), unlink: () => linkSel(false), boxsel: () => setBoxMode(!boxMode),
  'hw-toggle-sel': () => { const ids = selItems().map(i => i.id); toggleMotion(P.hw.filter(h => ids.includes(h.target)).map(h => h.id), ids.filter(id => isApp(item(id)))); setTimeout(refreshInspector, 50); },
  'hw-toggle-all': () => toggleMotion(P.hw.map(h => h.id), P.items.filter(isApp).map(i => i.id)),
  appliances: () => appCatalog(), light: toggleLight,
  'app-toggle': () => { const k = kindOfSelection(); if (k.type === 'item' && isApp(k.it)) { toggleMotion([], [k.it.id]); setTimeout(() => { refreshInspector(); if (!modal.hidden && dlgIsPart) renderPartEditor(); }, 50); } },
  'app-cut': () => { const k = kindOfSelection(); if (k.type === 'item' && isApp(k.it)) hobCut(k.it); },
  'measure-hole': () => startMeasure('hole'), 'measure-cut': () => startMeasure('cut'),
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cmd]'); if (b && COMMANDS[b.dataset.cmd]) { COMMANDS[b.dataset.cmd](); return; }
  const v = e.target.closest('[data-view]'); if (v) setView(v.dataset.view);
});
document.addEventListener('keydown', e => {
  if (!modal.hidden) { if (e.key === 'Escape') closeDialog(); return; }
  if (e.target.matches('input, select')) return;
  if (ruler.key(e)) { e.preventDefault(); return; }
  const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase(), step = gridStep() * (e.shiftKey ? 10 : 1);
  const map = {
    z: () => (e.shiftKey ? redo() : undo()), y: redo, d: duplicateSel, s: () => saveFile(e.shiftKey), o: openFile, n: newFile,
    g: () => (e.shiftKey ? ungroupSel() : groupSel()),
  };
  if (ctrl && map[k]) { e.preventDefault(); map[k](); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSel(); }
  else if (e.key === 'Enter') { const k = kindOfSelection(); if (k.type === 'item') partEditor(k.it.id); }
  else if (e.key === 'Escape') { if (bucket.open) closePalette(); else if (basePick) { basePick = null; status('Присоединение отменено'); } else if (measure) stopMeasure(); else { sel.clear(); openGroup = 0; selectionChanged(); } }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); moveSel(-step, 0, 0); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); moveSel(step, 0, 0); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(0, step, 0); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(0, -step, 0); }
  else if (e.key === 'PageUp') { e.preventDefault(); moveSel(0, 0, -step); }
  else if (e.key === 'PageDown') { e.preventDefault(); moveSel(0, 0, step); }
  else if (k === 'f') fit();
});
document.getElementById('showDims').addEventListener('change', updateDims);
(() => {   // галочка «Люди» запоминается
  const c = document.getElementById('showPeople');
  try { c.checked = localStorage.getItem('kcs-people') === '1'; } catch (e) { /* */ }
  people.setEnabled(c.checked);
  c.addEventListener('change', () => { people.setEnabled(c.checked); try { localStorage.setItem('kcs-people', c.checked ? '1' : '0'); } catch (e) { /* */ } status(c.checked ? 'Люди включены: откройте дверь или ящик — он подойдёт и откроет сам, со звуком' : 'Без людей: двери и ящики открываются сами, без звука'); });
})();
document.getElementById('showFast').addEventListener('change', rebuild);
document.getElementById('showRoom').addEventListener('change', buildRoom);
document.getElementById('showRoom').addEventListener('change', requestRender);

let statusTimer = 0;
function status(t) {
  const el = document.getElementById('statusText'); el.textContent = t;
  clearTimeout(statusTimer); statusTimer = setTimeout(() => { const n = P.items.filter(isApp).length; el.textContent = `Деталей: ${P.items.length - n}${n ? ` · техники: ${n}` : ''}`; }, 6000);
}
function refreshUI() {
  refreshTree(); refreshInspector(); ruler.redraw();
  if (!modal.hidden && dlgIsPart) renderPartEditor();
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
// Верхняя панель: если кнопки не помещаются — полоса прокрутки внизу, колесо мыши листает вбок, стрелки по краям
(function toolbarScroll() {
  const tb = document.querySelector('.toolbar'), L = document.getElementById('tbLeft'), Rb = document.getElementById('tbRight');
  const track = document.getElementById('tbTrack'), thumb = document.getElementById('tbThumb');
  const upd = () => {
    const max = tb.scrollWidth - tb.clientWidth; L.hidden = tb.scrollLeft <= 2; Rb.hidden = max <= 2 || tb.scrollLeft >= max - 2;
    track.classList.toggle('off', max <= 2);
    const W = track.clientWidth, tw = Math.max(40, W * tb.clientWidth / tb.scrollWidth);
    thumb.style.width = tw + 'px'; thumb.style.left = (max > 0 ? (W - tw) * tb.scrollLeft / max : 0) + 'px';
  };
  // тянем полосу: ползунок и клик по дорожке
  let grab = null;
  thumb.onpointerdown = e => { grab = { x: e.clientX, s: tb.scrollLeft }; thumb.setPointerCapture(e.pointerId); tb.style.scrollBehavior = 'auto'; e.preventDefault(); };
  thumb.onpointermove = e => { if (!grab) return; const max = tb.scrollWidth - tb.clientWidth, W = track.clientWidth - thumb.offsetWidth; tb.scrollLeft = grab.s + (e.clientX - grab.x) * (W > 0 ? max / W : 0); };
  thumb.onpointerup = () => { grab = null; tb.style.scrollBehavior = ''; };
  track.onpointerdown = e => { if (e.target !== track) return; const r = track.getBoundingClientRect(); tb.scrollLeft = (e.clientX - r.left) / r.width * tb.scrollWidth - tb.clientWidth / 2; };
  tb.addEventListener('wheel', e => { if (tb.scrollWidth <= tb.clientWidth) return; const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX; tb.scrollLeft += d; e.preventDefault(); upd(); }, { passive: false });
  tb.addEventListener('scroll', upd);
  L.onclick = () => { tb.scrollLeft -= tb.clientWidth * 0.6; };
  Rb.onclick = () => { tb.scrollLeft += tb.clientWidth * 0.6; };
  new ResizeObserver(upd).observe(tb);
  upd();
})();
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
  if (!loaded) { buildRoom(); rebuild(); refreshUI(); updateTitle(); setView('3d'); roomDialog(true); }
  else setView('3d');
}
start();
window.__kcs = { get P() { return P; }, sel, COMMANDS, setView, get camera() { return camera; }, pivot, renderer, select: ids => { sel.clear(); ids.forEach(i => sel.add(i)); openGroup = 0; selectionChanged(); },
  hwSetT: (ids, t) => { ids.forEach(id => hwState.set(id, { t, to: t })); applyPoses(); }, meshOf: id => itemsGroup.children.find(m => m.userData.id === id), hwGroup, moveSel,
  basePickTo: (hw, part) => { startBasePick(hw); finishBasePick(part); }, status: () => document.getElementById('statusText').textContent,
  appSetT: (ids, t) => { ids.forEach(id => appState.set(id, { t, to: t })); applyPoses(); }, appModels, addAppliance, APPLIANCES, people };  // для автотестов
