// Люди в стиле «Симпсонов» (режим «👥 Люди»). Всегда мультяшные: жёлтая кожа, большие глаза с веками, «морда»,
// 4 пальца, плавные формы с чёрным контуром и заливкой в 3 тона — никаких кубиков.
// Парень (188 см, короткая стрижка, борода) подходит, берётся за ручку и тянет — дверь или ящик едут вместе с его рукой.
// Через 2–3 с после звука приходит соседка (170 см, худая, чёрные волосы в пучке на затылке, бежевая майка на лямках,
// оранжево-красные штаны): ругается с эмоцией — лицо, жест, голос, надпись над головой — и уходит.
// Всё в мм. Фигура стоит ногами в (0, 0, 0) и смотрит на +Z; правая рука — со стороны −X.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { sfx } from './sounds.js';

// Реплики соседки: у каждой своя эмоция — лицо (mood), жест (gesture), голос (pitch, rate) и значок в надписи
const LINES = [
  { text: 'Тихоооо', mood: 'shush', gesture: 'shush', emoji: '🤫', pitch: 1.1, rate: 0.75 },
  { text: 'потише', mood: 'annoyed', gesture: 'hips', emoji: '😒', pitch: 1.2, rate: 0.9 },
  { text: 'выселяй своих Китайцев', mood: 'angry', gesture: 'point', emoji: '😡', pitch: 1.3, rate: 1 },
  { text: 'иди детей в парк своди', mood: 'annoyed', gesture: 'away', emoji: '😤', pitch: 1.25, rate: 0.95 },
  { text: 'дай поспать', mood: 'sleepy', gesture: 'sleep', emoji: '😴', pitch: 0.95, rate: 0.75 },
  { text: 'не ШУМИИИ', mood: 'scream', gesture: 'ears', emoji: '😫', pitch: 1.5, rate: 1.1 },
  { text: 'Сани болен ухлаганда джиииим юрасан', mood: 'smirk', gesture: 'cross', emoji: '😏', pitch: 1.15, rate: 0.9 },
  { text: 'иди лучше молоко принеси, кофе не с чем пить', mood: 'annoyed', gesture: 'palm', emoji: '☕', pitch: 1.2, rate: 0.95 },
  { text: 'иди хлеб лучше купи', mood: 'angry', gesture: 'away', emoji: '🍞', pitch: 1.25, rate: 1 },
];
const LIGHT = { text: 'АБДУЛАЗИИИЗ оплати свет!!!', mood: 'scream', gesture: 'up', emoji: '😱', pitch: 1.55, rate: 1.1, loud: true };

// Лицо: веко (поворот полусферы: −1,5 — глаз широко открыт, 0 — наполовину, +1 — закрыт), наклон век (злость),
// рот [ширина, раскрытие]
const MOODS = {
  calm: { lid: -1.15, tilt: 0, mouth: [1, 0.1] },
  strain: { lid: -0.55, tilt: 0.18, mouth: [1.15, 0.1] },
  surprised: { lid: -1.55, tilt: -0.12, mouth: [0.65, 0.55] },
  angry: { lid: -0.4, tilt: 0.45, mouth: [1.1, 0.35] },
  annoyed: { lid: -0.12, tilt: 0.12, mouth: [0.9, 0.12] },
  sleepy: { lid: 0.6, tilt: -0.25, mouth: [0.6, 0.12] },
  scream: { lid: -1.6, tilt: -0.15, mouth: [1.25, 1] },
  smirk: { lid: -0.3, tilt: 0.2, mouth: [0.9, 0.1], asym: 0.4 },
  shush: { lid: -0.35, tilt: 0.35, mouth: [0.45, 0.35] },
};
// Пальцы: [большой, указательный, средний, безымянный] — сгиб в радианах (у Симпсонов 4 пальца)
const HANDS = { relax: [0.35, 0.3, 0.38, 0.45], open: [0.05, 0, 0, 0.05], fist: [1.3, 2.1, 2.1, 2.1], point: [1.1, 0, 2.1, 2.1], grip: [1.1, 1.55, 1.6, 1.65] };

const MAN = {
  H: 1880, skin: 0xffd521, hair: 0x3a281c, beard: 0x6b4c36, top: 0xf6f6f1, sleeve: true, pants: 0x4c70b2, shoe: 0x3b3b3b,
  hipY: 975, legX: 98, thigh: 450, shin: 445, thighR: [84, 62], shinR: [60, 44], foot: [112, 82, 290], stride: 720, crouchDrop: 470,
  pelvis: [[0, -112], [118, -106], [168, -62], [184, 0], [186, 80], [170, 122], [0, 126]], pdepth: 0.72,
  torso: [[0, 36], [187, 40], [197, 140], [203, 260], [206, 380], [200, 468], [178, 532], [118, 572], [62, 588], [0, 590]], tdepth: 0.7,
  shX: 206, shY: 500, up: 300, fo: 272, upR: [52, 42], foR: [41, 32], palm: [84, 74, 38], finger: [11, 44],
  neck: [570, 650, 54], R: 118, sx: 0.92, sy: 1.14, sz: 0.95, headY: 765, eyeR: 0.31,
};
const WOMAN = {
  H: 1700, skin: 0xffd521, hair: 0x141418, top: 0xe4cba3, pants: 0xe8542c, shoe: 0xf3efe6, lips: 0xd23a4f,
  hipY: 900, legX: 82, thigh: 418, shin: 410, thighR: [76, 54], shinR: [52, 38], foot: [92, 70, 245], stride: 640, crouchDrop: 420,
  pelvis: [[0, -100], [108, -95], [158, -52], [172, 8], [166, 68], [140, 108], [0, 112]], pdepth: 0.75,
  torso: [[0, 40], [150, 44], [131, 140], [139, 230], [156, 295], [160, 340], [153, 380], [152, 385], [0, 396]], tdepth: 0.68,
  chest: [[0, 372], [147, 374], [150, 400], [130, 440], [84, 468], [50, 478], [0, 480]],
  shX: 150, shY: 432, up: 265, fo: 240, upR: [39, 33], foR: [32, 25], palm: [72, 62, 30], finger: [9, 38],
  neck: [470, 560, 42], R: 108, sx: 0.9, sy: 1.12, sz: 0.92, headY: 669, eyeR: 0.33,
};

// ---------------------------------------------------------------- материалы: заливка в 3 тона и чёрный контур
const GRAD = (() => { const t = new THREE.DataTexture(new Uint8Array([70, 160, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const mats = new Map();
const toon = (c, o) => { const k = c + (o ? 'd' : ''); if (!mats.has(k)) mats.set(k, new THREE.MeshToonMaterial({ color: c, gradientMap: GRAD, ...(o || {}) })); return mats.get(k); };
const flat = c => { const k = 'f' + c; if (!mats.has(k)) mats.set(k, new THREE.MeshBasicMaterial({ color: c })); return mats.get(k); };
const INK = new THREE.MeshBasicMaterial({ color: 0x1b140e, side: THREE.BackSide });
INK.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\ttransformed += normalize(normal) * 4.5;'); };
// деталь фигуры с контуром (контур — та же форма чуть больше, вывернутая наизнанку). Масштаб — только в геометрии, не в mesh.scale
function add(parent, geo, mat, { ink = true, at, rot } = {}) {
  const m = new THREE.Mesh(geo, typeof mat === 'number' ? toon(mat) : mat);
  if (at) m.position.set(...at); if (rot) m.rotation.set(...rot);
  if (ink) m.add(new THREE.Mesh(geo, INK));
  parent.add(m); return m;
}
const ell = (rx, ry = rx, rz = rx, w = 24, h = 16) => new THREE.SphereGeometry(1, w, h).scale(rx, ry, rz);
const lathe = (pts, depth = 1, radial = 32) => { const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), radial); if (depth !== 1) g.scale(1, 1, depth); return g; };
// конечность: плавная «колбаска» от r1 (у сустава, y = 0) до r2 (y = −len)
function taper(r1, r2, len, radial = 18) {
  const p = [];
  for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + Math.PI / 2 * i / 6; p.push([Math.cos(a) * r2, -len + Math.sin(a) * r2]); }
  for (let i = 0; i <= 6; i++) { const a = Math.PI / 2 * i / 6; p.push([Math.cos(a) * r1, Math.sin(a) * r1]); }
  return lathe(p, 1, radial);
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const DOWN = V(0, -1, 0), FWD = V(0, 0, 1);
const clamp = THREE.MathUtils.clamp;
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const turn = (a, b, k) => { const d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * Math.min(1, k); };

// ---------------------------------------------------------------- фигура
class Person {
  constructor(S) {
    this.S = S; const R = S.R;
    const root = this.root = new THREE.Group(); root.visible = false;
    const hips = this.hips = new THREE.Group(); hips.position.y = S.hipY; root.add(hips);
    add(hips, lathe(S.pelvis, S.pdepth), S.pants);
    // ноги: бедро → колено → голень → стопа
    this.legs = [-1, 1].map(s => {
      const thigh = new THREE.Group(); thigh.position.x = s * S.legX; hips.add(thigh);
      add(thigh, taper(S.thighR[0], S.thighR[1], S.thigh), S.pants);
      const knee = new THREE.Group(); knee.position.y = -S.thigh; thigh.add(knee);
      add(knee, taper(S.shinR[0], S.shinR[1], S.shin), S.pants);
      const foot = new THREE.Group(); foot.position.y = -S.shin; knee.add(foot);
      add(foot, ell(S.foot[0] / 2, S.foot[1] / 2, S.foot[2] / 2), S.shoe, { at: [0, -S.foot[1] / 2 + 6, S.foot[2] * 0.2] });
      return { thigh, knee, foot };
    });
    // корпус: наклоняется целиком (spine)
    const spine = this.spine = new THREE.Group(); hips.add(spine);
    add(spine, lathe(S.torso, S.tdepth), S.top);
    if (S.chest) {
      add(spine, lathe(S.chest, S.tdepth), S.skin);
      for (const s of [-1, 1]) {   // лямки майки через плечо
        const c = new THREE.CatmullRomCurve3([V(s * 72, 378, 101), V(s * 80, 445, 70), V(s * 84, 478, 0), V(s * 80, 445, -70), V(s * 72, 378, -101)]);
        add(spine, new THREE.TubeGeometry(c, 24, 9, 8, false), S.top);
      }
    }
    add(spine, taper(S.neck[2], S.neck[2] * 1.05, S.neck[1] - S.neck[0]), S.skin, { at: [0, S.neck[1], 0] });
    // руки: плечо → плечевая кость → локоть → предплечье → кисть с 4 пальцами
    this.arms = [-1, 1].map(s => {
      const sh = new THREE.Group(); sh.position.set(s * S.shX, S.shY, 0); spine.add(sh); sh.userData.y0 = S.shY;
      add(sh, ell(S.upR[0] * 1.1), S.sleeve ? S.top : S.skin);
      const up = new THREE.Group(); sh.add(up);
      add(up, taper(S.upR[0], S.upR[1], S.up), S.skin);
      if (S.sleeve) add(up, taper(S.upR[0] * 1.24, S.upR[0] * 1.12, S.up * 0.46), S.top);   // короткий рукав
      add(up, ell(S.upR[1]), S.skin, { at: [0, -S.up, 0], ink: false });
      const fo = new THREE.Group(); fo.position.y = -S.up; up.add(fo);
      add(fo, taper(S.foR[0], S.foR[1], S.fo), S.skin);
      const hand = new THREE.Group(); hand.position.y = -S.fo; fo.add(hand);
      const [pl, pw, pt] = S.palm, [fr, fl] = S.finger;
      add(hand, ell(pt / 2, pl / 2, pw / 2), S.skin, { at: [0, -pl / 2, 0] });
      const fingers = [[-pl * 0.35, pw * 0.48, true], [-pl * 0.85, pw * 0.3], [-pl * 0.9, 0], [-pl * 0.85, -pw * 0.3]].map(([y, z, thumb]) => {
        const f = new THREE.Group(); f.position.set(0, y, z); if (thumb) f.rotation.x = -0.6; hand.add(f);
        add(f, taper(fr, fr * 0.85, thumb ? fl * 0.8 : fl), S.skin);
        return f;
      });
      return { s, sh, up, fo, hand, fingers, cur: V(s * (S.shX + 26), S.shY - (S.up + S.fo) * 0.96, 18), lenU: S.up, lenF: S.fo + pl * 0.5, curl: [0.3, 0.3, 0.3, 0.3], twist: 0 };
    });
    // голова
    const head = this.head = new THREE.Group(); head.position.y = S.headY; head.rotation.order = 'YXZ'; spine.add(head);
    add(head, ell(R * S.sx, R * S.sy, R * S.sz, 32, 24), S.skin);
    const zs = (x, y) => S.sz * R * Math.sqrt(Math.max(0, 1 - (x / (S.sx * R)) ** 2 - (y / (S.sy * R)) ** 2));   // где поверхность головы спереди
    const er = S.eyeR * R, ey = R * 0.22;
    const lidMat = new THREE.MeshToonMaterial({ color: S.skin, gradientMap: GRAD, side: THREE.DoubleSide });
    this.eyes = [-1, 1].map(s => {   // большие глаза касаются друг друга
      const g = new THREE.Group(); g.position.set(s * er * 0.96, ey, zs(er, ey) - er * 0.35); head.add(g);
      add(g, ell(er, er, er, 24, 18), 0xffffff);
      const pupil = add(g, ell(er * 0.19, er * 0.19, er * 0.12, 12, 10), flat(0x111111), { ink: false, at: [0, 0, er * 0.92] });
      const lid = new THREE.Group(); g.add(lid);
      add(lid, new THREE.SphereGeometry(er * 1.07, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), lidMat, { ink: false });   // верхнее веко
      add(lid, new THREE.TorusGeometry(er * 1.07, 2.4, 6, 32).rotateX(Math.PI / 2), flat(0x1b140e), { ink: false });     // край века
      if (S.lips) for (const [k, phi] of [[0, 0.2], [1, 0.65], [2, 1.05]]) {   // ресницы
        const a = s * phi, d = V(Math.sin(a), 0.85 + k * 0.1, Math.cos(a) * 0.7).normalize();
        const l = add(lid, taper(3.2, 1.6, er * (0.42 + k * 0.08)), flat(0x111111), { ink: false, at: [Math.sin(a) * er * 1.07, 0, Math.cos(a) * er * 1.07] });
        l.quaternion.setFromUnitVectors(DOWN, d);
      }
      lid.rotation.x = -1.15;
      return { s, g, pupil, lid, er };
    });
    // нос «сосиской»
    const man = !S.lips;
    add(head, taper(R * (man ? 0.12 : 0.085), R * (man ? 0.115 : 0.08), R * (man ? 0.5 : 0.3)), S.skin, { at: [0, -R * 0.04, zs(0, -R * 0.04) - 8], rot: [-1.35, 0, 0] });
    // уши
    for (const s of [-1, 1]) {
      add(head, new THREE.TorusGeometry(R * 0.16, R * 0.05, 8, 18, Math.PI * 1.3), S.skin, { at: [s * R * S.sx * 0.96, -R * 0.05, -R * 0.03], rot: [0, s * Math.PI / 2, -0.4] });
      add(head, ell(R * 0.06, R * 0.14, R * 0.11), S.skin, { at: [s * R * S.sx * 0.95, -R * 0.05, -R * 0.03] });
    }
    // «морда»: у парня — борода, у соседки — подбородок; на ней рот
    const mz = man ? [R * 0.7, R * 0.52, R * 0.56, -R * 0.58, R * 0.4] : [R * 0.52, R * 0.4, R * 0.45, -R * 0.55, R * 0.46];
    add(head, ell(mz[0], mz[1], mz[2], 28, 18), man ? S.beard : S.skin, { at: [0, mz[3], mz[4]] });
    const mouth = this.mouth = new THREE.Group(); mouth.position.set(0, mz[3] - R * 0.04, mz[4] + mz[2] - R * 0.03); head.add(mouth);
    add(mouth, ell(R * 0.3, R * 0.2, R * 0.08), flat(0x4a1416), { ink: false });
    add(mouth, ell(R * 0.24, R * 0.05, R * 0.05), flat(0xffffff), { ink: false, at: [0, R * 0.13, R * 0.015] });   // зубы
    add(mouth, ell(R * 0.17, R * 0.07, R * 0.06), flat(0xd65a6a), { ink: false, at: [0, -R * 0.11, 0] });         // язык
    if (S.lips) add(mouth, new THREE.TorusGeometry(R * 0.3, R * 0.045, 8, 28), toon(S.lips), { ink: false });
    mouth.scale.set(1, 0.1, 1);
    // волосы: шапочка по форме головы (сдвинута назад — лоб открыт)
    add(head, new THREE.SphereGeometry(1, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.62).rotateX(man ? -0.62 : -0.72).scale(R * S.sx * 1.05, R * S.sy * 1.05, R * S.sz * 1.05), S.hair);
    if (man) for (const s of [-1, 1]) add(head, ell(R * 0.12, R * 0.32, R * 0.2), S.beard, { at: [s * R * 0.84, -R * 0.24, R * 0.1] });   // бакенбарды
    else {   // волосы собраны на затылке: пучок и резинка
      add(head, ell(R * 0.46), S.hair, { at: [0, R * 0.3, -R * 1.02] });
      add(head, new THREE.TorusGeometry(R * 0.3, R * 0.07, 8, 24), S.lips, { at: [0, R * 0.3, -R * 0.86] });
    }
    this.R = R;
    // состояние
    Object.assign(this, { path: [], speed: 1300, onArrive: null, faceAt: null, phase: 0, walkAmt: 0, moved: 0, gesture: 'rest', mood: 'calm', look: null,
      crouch: 0, crouchCur: 0, lean: 0, leanCur: 0, talking: false, t: 0, blinkUntil: 0, grab: null, attached: false, awayWorld: null });
  }
  get pos() { return this.root.position; }
  place(p) { this.root.position.set(p.x, 0, p.z); this.root.visible = true; }
  go(points, speed, onArrive) { this.path = points.map(p => ({ x: p.x, z: p.z })); this.speed = speed; this.onArrive = onArrive || null; this.faceAt = null; }
  // где голова (для взгляда другого человека)
  headWorld() { return this.head.getWorldPosition(new THREE.Vector3()); }
  update(dt) {
    const S = this.S, r = this.root, R = this.R;
    this.t += dt;
    // 1) ходьба по точкам; стоя — поворот к faceAt
    let moved = this.moved; this.moved = 0;
    if (this.path.length) {
      const p = this.path[0], dx = p.x - r.position.x, dz = p.z - r.position.z, d = Math.hypot(dx, dz), step = this.speed * dt;
      if (d > 1) r.rotation.y = turn(r.rotation.y, Math.atan2(dx, dz), 8 * dt);
      if (d <= step) { r.position.x = p.x; r.position.z = p.z; moved += d; this.path.shift(); if (!this.path.length && this.onArrive) { const f = this.onArrive; this.onArrive = null; f(); } }
      else { r.position.x += dx / d * step; r.position.z += dz / d * step; moved += step; }
    } else if (this.faceAt) { const f = typeof this.faceAt === 'function' ? this.faceAt() : this.faceAt; if (f) r.rotation.y = turn(r.rotation.y, Math.atan2(f.x - r.position.x, f.z - r.position.z), 7 * dt); }
    this.walkAmt = damp(this.walkAmt, moved > 0.05 ? 1 : 0, 9, dt);
    this.phase += moved / S.stride * Math.PI;
    const w = this.walkAmt;
    // 2) ноги: шаг с коленями; присесть — колени вперёд, стопы ровно
    this.crouchCur = damp(this.crouchCur, this.crouch, 6, dt);
    const L = S.thigh + S.shin, drop = this.crouchCur * S.crouchDrop, th = Math.acos(clamp((L - drop) / L, -1, 1));
    this.hips.position.y = S.hipY - drop + w * 14 * Math.cos(2 * this.phase);
    this.legs.forEach((l, i) => {
      const ph = this.phase + (i ? Math.PI : 0), sw = Math.sin(ph) * 0.42 * w, kb = Math.max(0, Math.sin(ph + 1.9)) * 0.8 * w;
      l.thigh.rotation.x = -th + sw; l.knee.rotation.x = 2 * th + kb; l.foot.rotation.x = -(l.thigh.rotation.x + l.knee.rotation.x);
    });
    if (S.lips) { this.hips.rotation.z = Math.sin(this.phase) * 0.07 * w; this.spine.rotation.z = -this.hips.rotation.z * 0.8; }   // походка от бедра
    this.leanCur = damp(this.leanCur, this.lean + this.crouchCur * 0.75 + w * 0.05, 6, dt);
    this.spine.rotation.x = this.leanCur;
    const g = this.gesture;
    for (const a of this.arms) a.sh.position.y = damp(a.sh.position.y, a.sh.userData.y0 + (g === 'shrug' ? 38 : g === 'up' ? 25 : 0), 8, dt);
    r.updateMatrixWorld(true);
    // 3) руки: цель кисти в осях корпуса, плавно; когда держит ручку — точно
    const tg = this.targets();
    this.arms.forEach((a, i) => {
      const T = tg[i];
      if (T.direct) a.cur.copy(T.p); else a.cur.lerp(T.p, 1 - Math.exp(-(T.k || 9) * dt));
      ik(a, a.cur, T.pole);
      const c = HANDS[T.fingers] || HANDS.relax;
      a.fingers.forEach((f, k) => { a.curl[k] = damp(a.curl[k], c[k], 12, dt); f.rotation.z = -a.s * a.curl[k]; });
      a.twist = damp(a.twist, T.twist || 0, 8, dt); a.hand.rotation.y = a.twist;
    });
    // 4) голова смотрит на цель (в пределах поворота шеи), наклон по жесту
    const lp = this.look && (typeof this.look === 'function' ? this.look() : this.look);
    let yaw = 0, pitch = 0;
    if (lp) { const q = this.spine.worldToLocal(lp.clone()).sub(this.head.position); yaw = clamp(Math.atan2(q.x, q.z), -1.1, 1.1); pitch = clamp(Math.atan2(-q.y, Math.hypot(q.x, q.z)), -0.45, 0.6); }
    const tilt = { sleep: 0.42, shrug: 0.16, palm: -0.12, smirk: 0.1 }[g] || 0, up = g === 'up' ? -0.3 : 0;
    this.head.rotation.y = damp(this.head.rotation.y, yaw, 8, dt);
    this.head.rotation.x = damp(this.head.rotation.x, pitch + up, 8, dt);
    this.head.rotation.z = damp(this.head.rotation.z, tilt, 6, dt);
    this.head.updateMatrixWorld(true);
    // 5) лицо: веки по настроению и моргание, зрачки на цель, рот (во время речи — «говорит»)
    const M = MOODS[this.mood] || MOODS.calm, blink = this.t < this.blinkUntil;
    for (const e of this.eyes) {
      const lid = blink ? 1.05 : M.lid + (M.asym && e.s > 0 ? M.asym : 0);
      e.lid.rotation.x = damp(e.lid.rotation.x, lid, blink ? 45 : 12, dt);
      e.lid.rotation.z = damp(e.lid.rotation.z, e.s * M.tilt, 12, dt);
      const d = lp ? this.head.worldToLocal(lp.clone()).sub(e.g.position) : V(0, 0, 1);
      d.normalize(); if (d.z < 0.5) { d.z = 0.5; d.normalize(); }
      e.pupil.position.copy(d).multiplyScalar(e.er * 0.92); e.pupil.quaternion.setFromUnitVectors(FWD, d);
    }
    let open = M.mouth[1];
    if (this.talking) open = Math.max(open, 0.3) + 0.5 * Math.abs(Math.sin(this.t * 13) * Math.sin(this.t * 7.3 + 1));
    this.mouth.scale.x = damp(this.mouth.scale.x, M.mouth[0], 14, dt);
    this.mouth.scale.y = damp(this.mouth.scale.y, Math.max(0.08, Math.min(1.25, open)), 18, dt);
  }
  // куда тянуть кисти (в осях корпуса), каким концом локтя (pole), как сложить пальцы
  targets() {
    const S = this.S, R = this.R, hp = this.head.position, t = this.t, reach = S.up + S.fo, w = this.walkAmt;
    const rest = s => V(s * (S.shX + 26), S.shY - reach * 0.96, 18);
    const hip = s => ({ p: V(s * (S.shX + 42), 70, 20), pole: V(s, 0.1, -0.7), fingers: 'fist' });
    const out = [-1, 1].map(s => ({ p: rest(s), pole: V(s * 0.3, 0, -1), fingers: 'relax' }));
    out.forEach((o, i) => { const sw = Math.sin(this.phase + (i ? 0 : Math.PI)); o.p.z += sw * 170 * w; o.p.y += Math.abs(sw) * 25 * w; });   // руки качаются при ходьбе
    const set = (i, o) => Object.assign(out[i], o);
    switch (this.gesture) {
      case 'grab':
        if (this.grab) { let p = null; try { p = this.grab(); } catch (e) { p = null; } if (p) set(0, { p: this.spine.worldToLocal(p), direct: this.attached, k: 7, pole: V(-0.7, -1, -0.3), fingers: this.attached ? 'grip' : 'open' }); }
        break;
      case 'shrug': [-1, 1].forEach((s, i) => set(i, { p: V(s * (S.shX + 190), S.shY - 330, 230), pole: V(s, -0.5, -0.4), fingers: 'open', twist: -s * 1.2 })); break;
      case 'point': set(0, { p: V(-S.shX * 0.45 + 18 * Math.sin(t * 9), S.shY + 120 + 45 * Math.sin(t * 17), reach * 0.8), fingers: 'point', pole: V(-0.7, -0.7, -0.2) }); set(1, hip(1)); break;
      case 'hips': set(0, hip(-1)); set(1, hip(1)); break;
      case 'shush': set(0, { p: V(-10, hp.y - 0.62 * R - 95, hp.z + R + 30), fingers: 'point', pole: V(-1, -0.8, -0.1), k: 12 }); set(1, hip(1)); break;
      case 'cross': set(0, { p: V(S.shX * 0.55, S.shY - 190, 150), pole: V(-1, -0.4, 0.2), fingers: 'fist' }); set(1, { p: V(-S.shX * 0.55, S.shY - 215, 165), pole: V(1, -0.4, 0.2), fingers: 'fist' }); break;
      case 'sleep': set(0, { p: V(-R * 0.95, hp.y - R * 0.55, 70), pole: V(-1, -1, 0), fingers: 'open' }); set(1, { p: V(-R * 0.72, hp.y - R * 0.62, 125), pole: V(1, -1, 0.2), fingers: 'open' }); break;
      case 'ears': [-1, 1].forEach((s, i) => set(i, { p: V(s * (R * S.sx + 28), hp.y - 0.05 * R, 0), pole: V(s, -0.3, -0.4), fingers: 'open', k: 12 })); break;
      case 'away': {   // показывает рукой на выход
        const sh = this.arms[0].sh.position, d = this.awayWorld ? this.spine.worldToLocal(this.awayWorld.clone()).sub(sh) : V(-1, 0, 0.3);
        d.y = 0; d.normalize();
        set(0, { p: sh.clone().addScaledVector(d, reach * 0.95).add(V(0, 140, 0)), fingers: 'point', pole: V(-0.2, -1, -0.3) }); set(1, hip(1));
        break;
      }
      case 'palm': set(0, { p: V(-S.shX * 0.3, S.shY - 230, reach * 0.72), fingers: 'open', twist: -1.4, pole: V(-0.6, -1, 0) }); set(1, hip(1)); break;
      case 'up': [-1, 1].forEach((s, i) => set(i, { p: V(s * (S.shX + 150), S.shY + reach - 40 + 50 * Math.sin(t * 14 + s), 80), pole: V(s, 0, -0.3), fingers: 'open', k: 12 })); break;
    }
    return out;
  }
}
// Рука в два сустава: кисть в цель, локоть — в сторону pole (оси плеча = оси корпуса)
const _q = new THREE.Quaternion();
function ik(a, target, pole) {
  const t = target.clone().sub(a.sh.position), A = a.lenU, B = a.lenF;
  const dir = t.clone().normalize(), d = clamp(t.length(), Math.abs(A - B) + 5, A + B - 1);
  const ang = Math.acos(clamp((A * A + d * d - B * B) / (2 * A * d), -1, 1));
  const pl = pole.clone().addScaledVector(dir, -pole.dot(dir)); if (pl.lengthSq() < 1e-6) pl.set(0, 0, -1); pl.normalize();
  const u = dir.clone().multiplyScalar(Math.cos(ang)).addScaledVector(pl, Math.sin(ang));
  a.up.quaternion.setFromUnitVectors(DOWN, u);
  const f = t.clone().addScaledVector(u, -A).normalize().applyQuaternion(_q.copy(a.up.quaternion).invert());
  a.fo.quaternion.setFromUnitVectors(DOWN, f);
}

// ---------------------------------------------------------------- режиссёр: кто куда идёт и что делает
export function createPeople({ scene, render, room, camera, target }) {
  const group = new THREE.Group(); group.name = 'people'; scene.add(group);
  const man = new Person(MAN), woman = new Person(WOMAN);
  group.add(man.root, woman.root);
  // облачко: внешний блок двигает CSS2DRenderer, внутренний дрожит или плавает по эмоции (свой transform)
  const box = document.createElement('div'), el = document.createElement('div'); el.className = 'speech'; box.append(el);
  const bubble = new CSS2DObject(box); bubble.center.set(0.5, 1); bubble.position.y = WOMAN.H + 170; bubble.visible = false; woman.root.add(bubble);
  const lamp = new THREE.PointLight(0xffe2b8, 0, 2600, 0); lamp.position.set(0, 1900, 700); woman.root.add(lamp);   // в темноте её видно
  let enabled = false, dark = false, raf = 0, prev = 0, until = 0;
  const kick = (ms = 800) => { until = Math.max(until, performance.now() + ms); if (!raf && enabled) { prev = performance.now(); raf = requestAnimationFrame(tick); } };
  function tick(now) {
    raf = 0;
    // скорость не зависит от числа кадров: большой промежуток считаем несколькими шагами
    let dt = Math.min(0.3, Math.max(0, (now - prev) / 1000)); prev = now;
    while (dt > 1e-4) { const h = Math.min(dt, 0.04); direct(h); for (const p of [man, woman]) if (p.root.visible) p.update(h); dt -= h; }
    render();
    const busy = op || queue.length || man.path.length || woman.path.length || wState !== 'away' || speaking;
    if (enabled && (busy || now < until)) raf = requestAnimationFrame(tick);
  }
  // моргают время от времени
  setInterval(() => { if (!enabled) return; for (const p of [man, woman]) if (p.root.visible && Math.random() < 0.7) p.blinkUntil = p.t + 0.13; kick(400); }, 3200);

  // --- комната: границы, вход (дверной проём), точка внутри
  function poly() { const R = room(); return (R && R.pts && R.pts.length >= 3) ? R.pts : [[0, 0], [3600, 0], [3600, 3000], [0, 3000]]; }
  function inside(x, z) { const p = poly(); let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > z) !== (p[j][1] > z) && x < (p[j][0] - p[i][0]) * (z - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; }
  function bounds() { const p = poly(), xs = p.map(q => q[0]), zs = p.map(q => q[1]); return { x0: Math.min(...xs) + 300, x1: Math.max(...xs) - 300, z0: Math.min(...zs) + 300, z1: Math.max(...zs) - 300 }; }
  const inRoom = p => { const b = bounds(); return { x: clamp(p.x, b.x0, Math.max(b.x0, b.x1)), z: clamp(p.z, b.z0, Math.max(b.z0, b.z1)) }; };
  const camXZ = () => { const c = camera().position; return { x: c.x, z: c.z }; };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  // откуда люди приходят: из дверного проёма комнаты (снаружи → внутрь), иначе из угла со стороны камеры
  function entrance() {
    const R = room() || {}, p = poly(), n = p.length;
    const o = (R.openings || []).find(q => q.type === 'door') || (R.openings || []).find(q => q.type === 'arch' || q.type === 'balcony');
    if (o && p[o.wall]) {
      const a = p[o.wall], b = p[(o.wall + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
      const c = { x: a[0] + ux * (o.off + o.w / 2), z: a[1] + uz * (o.off + o.w / 2) };
      let nx = -uz, nz = ux; if (!inside(c.x + nx * 60, c.z + nz * 60)) { nx = -nx; nz = -nz; }
      const t = (R.t || 200) + 450;
      return { out: { x: c.x - nx * t, z: c.z - nz * t }, in: { x: c.x + nx * 450, z: c.z + nz * 450 } };
    }
    const b = bounds(), cam = camXZ(), cs = [[b.x0, b.z0], [b.x1, b.z0], [b.x0, b.z1], [b.x1, b.z1]].map(([x, z]) => ({ x, z }));
    cs.sort((q, w) => dist(q, cam) - dist(w, cam));
    return { out: cs[0], in: cs[0] };
  }

  // --- парень: очередь «подойти — взяться — потянуть — отпустить»
  const queue = []; let op = null, opPhase = '', opT = 0, opH = null, opN = null;
  const safe = f => { try { return f(); } catch (e) { return null; } };
  function standFor(h, n) {   // встать так, чтобы ручка была перед правым плечом, в полуметре
    const F = { x: -n.x, z: -n.z }, right = { x: -F.z, z: F.x };
    return inRoom({ x: h.x + n.x * 520 - right.x * MAN.shX, z: h.z + n.z * 520 - right.z * MAN.shX });
  }
  const flatN = (v, h) => { let n = v ? { x: v.x, z: v.z } : null, l = n ? Math.hypot(n.x, n.z) : 0; if (l < 0.2) { const c = camXZ(); n = { x: c.x - h.x, z: c.z - h.z }; l = Math.hypot(n.x, n.z) || 1; } return { x: n.x / l, z: n.z / l }; };
  const crouchFor = y => clamp((820 - y) / 520, 0, 1);   // низкая ручка — присесть
  function nextOp() {
    op = queue.shift() || null; opPhase = ''; opT = 0;
    if (!op) { Object.assign(man, { gesture: woman.root.visible ? man.gesture : 'rest', grab: null, attached: false, crouch: 0, lean: 0 }); if (!woman.root.visible) man.mood = 'calm'; return; }
    const h = safe(op.at); if (!h) { safe(op.start); return nextOp(); }
    opH = h; opN = flatN(safe(op.front), h);
    const stand = standFor(h, opN);
    const arrive = () => { opPhase = 'reach'; opT = 0; Object.assign(man, { faceAt: () => safe(op.at) || opH, gesture: 'grab', grab: op.at, attached: false, mood: 'strain', crouch: crouchFor(h.y) }); };
    Object.assign(man, { gesture: 'rest', look: () => (op && safe(op.at)) || opH, mood: 'calm' });
    if (!man.root.visible) { const e = entrance(); man.place(e.out); man.go(e.in === e.out ? [stand] : [e.in, stand], 1300, arrive); }
    else man.go([stand], 1300, arrive);
    opPhase = 'walk';
  }
  function direct(dt) {
    if (!op) return;
    opT += dt;
    if (opPhase === 'reach') {   // рука тянется к ручке
      const h = safe(op.at); if (!h) { opPhase = 'after'; return; }
      const hl = man.spine.worldToLocal(h.clone());
      if (hl.distanceTo(man.arms[0].cur) < 30 || opT > 0.8) {
        man.attached = true; opPhase = 'hold'; opT = 0;
        safe(op.start); sfx(op.sound.kind, 'start', op.sound.seed, op.sound.closing); summon();
      }
    } else if (opPhase === 'hold') {   // держит и тянет: рука на ручке, шагает, чтобы не тянуться и не упираться
      const h = safe(op.at); if (!h) { opPhase = 'after'; return; }
      const sh = man.arms[0].sh.getWorldPosition(new THREE.Vector3()), dx = h.x - sh.x, dz = h.z - sh.z, d = Math.hypot(dx, dz);
      if (d > 600 || d < 330) { const want = d - 470, s = clamp(want, -1500 * dt, 1500 * dt); const p = inRoom({ x: man.pos.x + dx / (d || 1) * s, z: man.pos.z + dz / (d || 1) * s }); man.moved += Math.hypot(p.x - man.pos.x, p.z - man.pos.z); man.pos.x = p.x; man.pos.z = p.z; }
      man.crouch = crouchFor(h.y); man.lean = op.sound.closing ? 0.12 : -0.1;
      if (safe(op.done) || opT > 4) { sfx(op.sound.kind, 'end', op.sound.seed, op.sound.closing); opPhase = 'after'; opT = 0; }
    } else if (opPhase === 'after' && opT > 0.35) {   // отпускает и отходит на шаг
      Object.assign(man, { attached: false, grab: null, gesture: 'rest', crouch: 0, lean: 0, mood: 'calm' });
      const back = inRoom({ x: man.pos.x + opN.x * 350, z: man.pos.z + opN.z * 350 }), h = opH;
      opPhase = 'leave';
      man.go([back], 900, () => { man.faceAt = h; nextOp(); kick(1500); });
    }
  }

  // --- соседка: приходит через 2–3 с после звука, ругается с эмоцией и уходит
  let wState = 'away', wTimer = 0, wPending = 0, wSaid = 0, wNext = null, first = true, last = null, ent = null, speaking = false, voice = null, sayId = 0;
  const pickVoice = () => { try { voice = speechSynthesis.getVoices().find(v => /^ru/i.test(v.lang)) || null; } catch (e) { voice = null; } };
  try { pickVoice(); speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) { /* нет синтеза речи */ }
  function nextLine() {
    if (first) { first = false; return LINES[0]; }
    const pool = LINES.slice(1).filter(l => l !== last);
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function summon(line = null) {
    if (!enabled) return;
    if (wState === 'away') { if (!wTimer) wTimer = setTimeout(() => { wTimer = 0; come(line); }, line === LIGHT ? 600 : 2000 + Math.random() * 1000); else if (line) wNext = line; }
    else if (wState === 'leaving') come(line);
    else if (line && wState === 'talk') { wPending = 0; say(line); }
    else if (line) wNext = line;
    else wPending++;
    kick(800);
  }
  function womanSpot() {
    if (man.root.visible) {   // рядом с ним, на той стороне, что ближе к камере
      const F = { x: Math.sin(man.root.rotation.y), z: Math.cos(man.root.rotation.y) }, side = { x: -F.z, z: F.x }, cam = camXZ();
      const cs = [1, -1].map(s => inRoom({ x: man.pos.x + side.x * s * 1000 - F.x * 420, z: man.pos.z + side.z * s * 1000 - F.z * 420 }));
      cs.sort((a, b) => dist(a, cam) - dist(b, cam));
      return cs[0];
    }
    const c = target(), cam = camXZ(), d = dist(c, cam) || 1, k = Math.min(d * 0.45, 1500);
    return inRoom({ x: c.x + (cam.x - c.x) / d * k, z: c.z + (cam.z - c.z) / d * k });
  }
  function come(line) {
    wState = 'coming'; if (line) wNext = line;
    if (!woman.root.visible || !ent) ent = entrance();
    if (!woman.root.visible) woman.place(ent.out);
    const spot = womanSpot(), fresh = dist(woman.pos, ent.out) < 60 && ent.in !== ent.out;
    Object.assign(woman, { gesture: 'rest', mood: wNext === LIGHT ? 'scream' : 'annoyed', look: () => (man.root.visible ? man.headWorld() : null) });
    if (wNext === LIGHT) woman.gesture = 'up';
    woman.go(fresh ? [ent.in, spot] : [spot], wNext === LIGHT ? 2300 : 1450, () => { woman.faceAt = () => (man.root.visible ? man.pos : camXZ()); const l = wNext || nextLine(); wNext = null; say(l); });
    lamp.intensity = dark ? 1.1 : 0;
    kick(1000);
  }
  function say(line) {
    wState = 'talk'; speaking = true; wSaid++; last = line;
    Object.assign(woman, { mood: line.mood, gesture: line.gesture, talking: true, awayWorld: ent ? new THREE.Vector3(ent.in.x, 1200, ent.in.z) : null });
    el.innerHTML = `<span class="emo">${line.emoji}</span>${line.text}`;
    el.className = `speech mood-${line.mood}${line.loud ? ' loud' : ''}`;
    bubble.visible = true;
    setTimeout(() => { if (!op && enabled) Object.assign(man, { look: () => woman.headWorld(), gesture: 'shrug', mood: 'surprised', faceAt: () => woman.pos }); }, 600);   // он оборачивается и разводит руками
    let ended = false, spoke = !voice;
    const id = ++sayId, t0 = performance.now(), min = 1500 + line.text.length * 60;   // прерванная реплика (свет погас) больше ничего не решает
    const fin = () => { if (ended || id !== sayId || !spoke || performance.now() - t0 < min) return; ended = true; done(); };
    setTimeout(() => { spoke = true; fin(); }, voice ? 9000 : min);
    setTimeout(fin, min + 20);
    if (voice) try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(line.text.replace(/!+/g, '!'));
      Object.assign(u, { voice, lang: voice.lang, pitch: line.pitch, rate: line.rate, volume: 1 });
      u.onend = u.onerror = () => { spoke = true; setTimeout(fin, 250); };
      speechSynthesis.speak(u);
    } catch (e) { spoke = true; }
    kick(1000);
  }
  function done() {
    speaking = false; woman.talking = false;
    if (!enabled) return;
    if (wNext || (wPending > 0 && wSaid < 3)) { if (!wNext) wPending--; setTimeout(() => { if (wState === 'talk') { const l = wNext || nextLine(); wNext = null; say(l); } }, 450); return; }
    setTimeout(leave, 600);
  }
  function leave() {
    if (!enabled || wState !== 'talk') return;
    wState = 'leaving'; bubble.visible = false; wSaid = 0; wPending = 0;
    Object.assign(woman, { gesture: 'rest', mood: 'annoyed', look: null, faceAt: null });
    if (!op) Object.assign(man, { gesture: 'rest', mood: 'calm', look: () => woman.headWorld() });
    const e = ent || entrance();
    woman.go(e.in === e.out ? [e.out] : [e.in, e.out], 1450, () => {
      if (wState !== 'leaving') return;
      woman.root.visible = false; wState = 'away'; lamp.intensity = 0; ent = null;
      if (!op) { man.look = null; man.faceAt = () => camXZ(); }
    });
    kick(1000);
  }
  function hideAll() {
    sayId++; clearTimeout(wTimer); wTimer = 0; wState = 'away'; wPending = 0; wSaid = 0; wNext = null; speaking = false; ent = null;
    man.root.visible = woman.root.visible = false; man.path = []; woman.path = []; bubble.visible = false; lamp.intensity = 0;
    try { speechSynthesis.cancel(); } catch (e) { /* */ }
  }
  return {
    group,
    setEnabled(on) {
      enabled = on;
      if (!on) {   // всё, что ждало человека, открывается само
        if (op && opPhase !== 'hold' && opPhase !== 'after' && opPhase !== 'leave') safe(op.start);
        for (const o of queue) safe(o.start);
        queue.length = 0; op = null; opPhase = ''; hideAll(); render();
      }
    },
    // открыть / закрыть руками: ops — [{ at, front, start, done, sound: { kind, seed, closing } }]
    operate(ops) {
      if (!enabled) { ops.forEach(o => safe(o.start)); return; }
      queue.push(...ops);
      if (!op) nextOp();
      kick(1000);
    },
    _debug: { man, woman, say: i => { come(LINES[i]); }, LINES, MOODS, kick },   // для автотестов
    // свет: щелчок выключателя; погас — соседка прибегает с поднятыми руками
    light(on) {
      dark = !on;
      if (!enabled) return;
      sfx('switch', 'start');
      if (dark) { lamp.intensity = woman.root.visible ? 1.1 : 0; summon(LIGHT); }
      else lamp.intensity = 0;
      kick(400);
    },
  };
}
