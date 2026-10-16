// Люди в сцене: парень (188 см) подходит и открывает шкаф, соседка (170 см) приходит ругаться — с надписью над головой и голосом.
// Всё в мм. Фигура стоит ногами в (0, 0, 0) и смотрит на +Z; поворот rotation.y = atan2(dx, dz) — лицом к направлению (dx, dz).
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const PHRASES = ['потише', 'выселяй своих Китайцев', 'иди детей в парк своди', 'дай поспать', 'не ШУМИИИ'];
const LIGHT_PHRASE = 'АБДУЛАЗИИИЗ оплати свет!!!';

const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o });
const SKIN = M(0xd8a682), SKIN_W = M(0xe6b796);
function capsule(r, len, m) { const o = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(1, len - 2 * r), 6, 14), m); o.position.y = -len / 2; return o; }
// сустав: группа в точке крепления, часть висит вниз
function joint(parent, x, y, z, r, len, m) { const p = new THREE.Group(); p.position.set(x, y, z); p.add(capsule(r, len, m)); parent.add(p); p.userData.len = len; return p; }
function cyl(parent, rTop, rBot, y0, y1, m, sz = 0.55) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, y1 - y0, 24), m); o.scale.z = sz; o.position.y = (y0 + y1) / 2; parent.add(o); return o; }

// ---------------------------------------------------------------- лицо: рисунок на круге перед головой
const faceCache = new Map();
function faceTex(who, mood) {
  const key = who + mood;
  if (faceCache.has(key)) return faceCache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), man = who === 'man';
  g.lineCap = 'round'; g.lineJoin = 'round';
  if (man) {   // борода и усы
    g.fillStyle = '#3b2a1e';
    g.beginPath(); g.moveTo(22, 120); g.quadraticCurveTo(30, 250, 128, 254); g.quadraticCurveTo(226, 250, 234, 120); g.quadraticCurveTo(210, 160, 186, 158); g.quadraticCurveTo(128, 140, 70, 158); g.quadraticCurveTo(46, 160, 22, 120); g.fill();
    g.beginPath(); g.ellipse(128, 168, 46, 12, 0, 0, Math.PI * 2); g.fill();
  }
  const scream = mood === 'scream', angry = mood === 'angry';
  // глаза
  for (const s of [-1, 1]) {
    const ex = 128 + s * 46, ey = 100, ew = scream ? 22 : 18, eh = scream ? 22 : angry ? 9 : 12;
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex, ey, ew, eh, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = man ? '#4a3220' : '#2a1a10'; g.beginPath(); g.arc(ex, ey + (angry ? 1 : 0), scream ? 6 : 8, 0, Math.PI * 2); g.fill();
    if (!man) { g.strokeStyle = '#111'; g.lineWidth = 3; g.beginPath(); g.ellipse(ex, ey, ew, eh, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); }
    // брови: злые — внутренний край вниз, крик — высоко дугой
    g.strokeStyle = man ? '#2e2016' : '#111'; g.lineWidth = man ? 9 : 6; g.beginPath();
    if (angry) { g.moveTo(ex + s * 26, ey - 30); g.lineTo(ex - s * 16, ey - 12); }
    else if (scream) { g.moveTo(ex - 24, ey - 30); g.quadraticCurveTo(ex, ey - 50, ex + 24, ey - 30); }
    else { g.moveTo(ex - 22, ey - 24); g.quadraticCurveTo(ex, ey - 30, ex + 22, ey - 24); }
    g.stroke();
  }
  // рот
  g.fillStyle = '#5a0f12'; g.strokeStyle = man ? '#8a4a3a' : '#c0262e'; g.lineWidth = man ? 4 : 6;
  if (scream) { g.beginPath(); g.ellipse(128, 190, 34, 46, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(104, 148, 48, 9); }
  else if (angry) { g.beginPath(); g.ellipse(128, 182, 24, 17, 0, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(110, 167, 36, 6); }
  else { g.beginPath(); g.moveTo(104, 168); g.quadraticCurveTo(128, 182, 152, 168); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  faceCache.set(key, t); return t;
}

// ---------------------------------------------------------------- фигуры
function figure(who) {
  const man = who === 'man', root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const skin = man ? SKIN : SKIN_W;
  const H = man ? 1880 : 1700, hr = man ? 112 : 100, hy = H - hr;
  const pants = man ? M(0x2b3a55) : M(0xe24a26), top = man ? M(0x7a8088) : M(0xd9c3a0), shoe = M(man ? 0x1e1e1e : 0xf2efe8);
  const hipY = man ? 940 : 880, legLen = hipY - 40, legX = man ? 95 : 80;
  // ноги, обувь
  const legs = [-1, 1].map(s => { const l = joint(body, s * legX, hipY, 0, man ? 72 : 60, legLen, pants); const sh = new THREE.Mesh(new THREE.BoxGeometry(man ? 110 : 90, 60, man ? 280 : 240), shoe); sh.position.set(0, -legLen + 10, 45); l.add(sh); return l; });
  // таз, торс, шея
  cyl(body, man ? 175 : 150, man ? 170 : 165, hipY - 60, hipY + 70, pants);
  if (man) cyl(body, 215, 178, hipY + 60, 1590, top);
  else {
    cyl(body, 150, 130, hipY + 60, 1360, top);            // майка
    cyl(body, 150, 152, 1360, 1440, skin);                // плечи открыты
    for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(16, 90, 90), top); st.position.set(s * 85, 1395, 0); body.add(st); }   // лямки
  }
  cyl(body, man ? 55 : 45, man ? 58 : 48, man ? 1580 : 1430, hy - hr * 0.6, skin, 1);
  // голова, лицо, волосы
  const head = new THREE.Group(); head.position.y = hy; body.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(hr, 28, 20), skin));
  // лицо — «маска» по форме головы спереди (часть сферы чуть больше головы), рисунок с прозрачным фоном
  const face = new THREE.Mesh(new THREE.SphereGeometry(hr * 1.012, 24, 18, Math.PI / 2 - 1.05, 2.1, Math.PI / 2 - 1.05, 2.1), new THREE.MeshStandardMaterial({ map: faceTex(who, man ? 'calm' : 'angry'), transparent: true, alphaTest: 0.05, roughness: 0.8 }));
  head.add(face);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(hr * 1.05, 28, 16, 0, Math.PI * 2, 0, Math.PI * (man ? 0.4 : 0.55)), M(man ? 0x2a1d14 : 0x0d0d0f));
  hair.rotation.x = man ? -0.35 : -0.45; head.add(hair);
  if (!man) { const bun = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.42, 20, 14), hair.material); bun.position.set(0, hr * 0.45, -hr * 0.95); head.add(bun); }   // волосы собраны на затылке
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.2, 10, 8), skin); ear.scale.set(0.5, 1, 0.8); ear.position.set(s * hr * 0.98, -hr * 0.05, 0); head.add(ear); }
  // руки: плечо → локоть → кисть (у неё — указательный палец)
  const shY = man ? 1530 : 1395, shX = man ? 240 : 180, up = man ? 320 : 290, lo = man ? 300 : 270;
  const arms = [-1, 1].map(s => {
    const a = joint(body, s * shX, shY, 0, man ? 54 : 40, up, man ? top : skin);
    if (man) { const sk = capsule(46, up * 0.45, skin); sk.position.y = -up * 0.75; a.add(sk); }   // короткий рукав
    const f = joint(a, 0, -up, 0, man ? 44 : 34, lo, skin);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(man ? 50 : 40, 14, 10), skin); hand.position.y = -lo - 10; hand.scale.set(0.8, 1.1, 0.6); f.add(hand);
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(10, 70, 4, 8), skin); finger.position.y = -lo - 75; finger.visible = false; f.add(finger);
    return { a, f, finger };
  });
  root.userData = { who, legs, arms, head, face, H };
  root.visible = false;
  return root;
}
const angleTo = (dx, dz) => Math.atan2(dx, dz);

export function createPeople({ scene, render, room }) {
  const group = new THREE.Group(); group.name = 'people'; scene.add(group);
  const man = figure('man'), woman = figure('woman'); group.add(man, woman);
  const el = document.createElement('div'); el.className = 'speech';
  const bubble = new CSS2DObject(el); bubble.center.set(0.5, 1); bubble.position.y = 1780; bubble.visible = false; woman.add(bubble);
  const lamp = new THREE.PointLight(0xffe2b8, 0, 2600, 0); lamp.position.set(0, 1900, 700); woman.add(lamp);   // в темноте её видно: подсвечена, как телефоном
  const st = new Map([[man, {}], [woman, {}]]);
  let enabled = false, first = true, last = '', raf = 0, bubbleUntil = 0, voice = null;

  function pickVoice() { try { voice = speechSynthesis.getVoices().find(v => /^ru/i.test(v.lang)) || null; } catch (e) { voice = null; } }
  try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch (e) { /* нет синтеза речи */ }
  function say(text, loud) {
    el.textContent = text; el.classList.toggle('loud', !!loud); bubble.visible = true; bubbleUntil = performance.now() + 5000;
    try {
      if (!voice) return;   // русского голоса в системе нет — только надпись
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/!+/g, '!')); u.voice = voice; u.lang = voice.lang; u.pitch = 1.35; u.rate = loud ? 1.05 : 0.95; u.volume = 1;
      speechSynthesis.speak(u);
    } catch (e) { /* не страшно */ }
  }
  function bounds() {
    const p = (room() && room().pts) || [[0, 0], [3600, 0], [3600, 3000], [0, 3000]];
    const xs = p.map(q => q[0]), zs = p.map(q => q[1]);
    return { x0: Math.min(...xs) + 280, x1: Math.max(...xs) - 280, z0: Math.min(...zs) + 280, z1: Math.max(...zs) - 280 };
  }
  const clamp = (v, a, b) => Math.min(Math.max(v, a), Math.max(a, b));
  const inRoom = p => { const b = bounds(); return { x: clamp(p.x, b.x0, b.x1), z: clamp(p.z, b.z0, b.z1) }; };
  // идти к точке и встать лицом к face; pose — что делать по приходу
  function walk(fig, to, face, pose, speed, from) {
    const s = st.get(fig);
    to = inRoom(to);
    if (!fig.visible || from) { const f = inRoom(from || to); fig.position.set(f.x, 0, f.z); fig.visible = true; }
    Object.assign(s, { to, face, pose, speed, walking: true, phase: s.phase || 0, poseT: 0 });
    setPose(fig, 'walk', 0);
    loop();
  }
  function setPose(fig, pose, t) {
    const u = fig.userData, [R, L] = u.arms;   // R — правая (−X), L — левая (+X)
    for (const a of u.arms) { a.a.rotation.set(0, 0, 0); a.f.rotation.set(0, 0, 0); a.finger.visible = false; }
    for (const l of u.legs) l.rotation.set(0, 0, 0);
    u.head.rotation.set(0, 0, 0);
    if (pose === 'walk') {
      const sw = Math.sin(t);
      u.legs[0].rotation.x = sw * 0.45; u.legs[1].rotation.x = -sw * 0.45;
      R.a.rotation.x = -sw * 0.35; L.a.rotation.x = sw * 0.35; R.f.rotation.x = L.f.rotation.x = -0.25;
    } else if (pose === 'open') {   // тянется рукой к ручке
      R.a.rotation.x = -1.25; R.a.rotation.z = 0.15; R.f.rotation.x = -0.25; L.a.rotation.z = 0.08;
      u.head.rotation.x = 0.12;
    } else if (pose === 'point') {   // грозит пальцем, вторая рука на поясе
      R.a.rotation.x = -2.1 + Math.sin(t * 9) * 0.12; R.f.rotation.x = -0.9 + Math.sin(t * 9) * 0.25; R.finger.visible = true;
      L.a.rotation.z = 0.55; L.f.rotation.z = -1.6; L.f.rotation.x = -0.4;
      u.head.rotation.x = -0.05 + Math.sin(t * 9) * 0.04;
    } else if (pose === 'scream') {   // кричит, руки вверх
      const sh = Math.sin(t * 12) * 0.12;
      R.a.rotation.x = -2.75 + sh; R.a.rotation.z = -0.35; L.a.rotation.x = -2.75 - sh; L.a.rotation.z = 0.35;
      R.f.rotation.x = L.f.rotation.x = -0.3; u.head.rotation.x = -0.18;
    }
  }
  function loop() { if (!raf) { prev = performance.now(); raf = requestAnimationFrame(tick); } }
  let prev = 0;
  function tick(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    let busy = false;
    for (const [fig, s] of st) {
      if (!fig.visible) continue;
      if (s.walking) {
        const dx = s.to.x - fig.position.x, dz = s.to.z - fig.position.z, d = Math.hypot(dx, dz), step = s.speed * dt;
        if (d <= step) { fig.position.set(s.to.x, 0, s.to.z); s.walking = false; fig.rotation.y = angleTo(s.face.x - s.to.x, s.face.z - s.to.z); setPose(fig, s.pose, 0); if (s.onArrive) { const f = s.onArrive; s.onArrive = null; f(); } }
        else { fig.position.x += dx / d * step; fig.position.z += dz / d * step; fig.rotation.y = angleTo(dx, dz); s.phase += step / 140; setPose(fig, 'walk', s.phase); }
        busy = true;
      } else if (s.pose === 'point' || s.pose === 'scream') {
        s.poseT += dt; if (s.poseT < 4) { setPose(fig, s.pose, s.poseT); busy = true; } else setPose(fig, s.pose, 0);
      }
    }
    if (bubble.visible && now > bubbleUntil) bubble.visible = false;
    if (bubble.visible) busy = true;
    render();
    if (busy) raf = requestAnimationFrame(tick);
  }
  function mood(m) { woman.userData.face.material.map = faceTex('woman', m); woman.userData.face.material.needsUpdate = true; }
  return {
    group,
    setEnabled(on) {
      enabled = on;
      if (!on) { man.visible = woman.visible = false; bubble.visible = false; lamp.intensity = 0; try { speechSynthesis.cancel(); } catch (e) { /* */ } render(); }
    },
    // кто-то открыл или закрыл: box — что двигали, front — куда смотрит перед (x, z)
    act(box, front) {
      if (!enabled || !box) return;
      const f = front, L = { x: f.z, z: -f.x };   // вбок от шкафа
      const c = { x: (box.x0 + box.x1) / 2, z: (box.z0 + box.z1) / 2 }, half = Math.abs(f.x) * (box.x1 - box.x0) / 2 + Math.abs(f.z) * (box.z1 - box.z0) / 2;
      const mStand = { x: c.x + f.x * (half + 430) - L.x * 160, z: c.z + f.z * (half + 430) - L.z * 160 };
      walk(man, mStand, { x: c.x, z: c.z }, 'open', 1300, man.visible ? null : { x: mStand.x - L.x * 1600 + f.x * 900, z: mStand.z - L.z * 1600 + f.z * 900 });
      const wStand = { x: mStand.x + L.x * 950 + f.x * 300, z: mStand.z + L.z * 950 + f.z * 300 };
      const text = first ? 'Тихоооо' : PHRASES.filter(p => p !== last)[Math.floor(Math.random() * (PHRASES.length - 1))];
      first = false; last = text;
      mood('angry'); lamp.intensity = lamp.intensity ? 1.1 : 0;
      walk(woman, wStand, mStand, 'point', 2000, woman.visible ? null : { x: wStand.x + L.x * 1800 + f.x * 700, z: wStand.z + L.z * 1800 + f.z * 700 });
      st.get(woman).onArrive = () => say(text, false);
    },
    // свет выключили: она прибегает к камере, руки вверх, кричит
    lightsOff(target, cam) {
      if (!enabled) return;
      const v = { x: cam.x - target.x, z: cam.z - target.z }, d = Math.hypot(v.x, v.z) || 1;
      const k = Math.min(d * 0.45, 1600), at = { x: target.x + v.x / d * k, z: target.z + v.z / d * k };
      mood('scream'); lamp.intensity = 1.1;
      walk(woman, at, { x: cam.x, z: cam.z }, 'scream', 2400, woman.visible ? null : { x: at.x - v.z / d * 1800, z: at.z + v.x / d * 1800 });
      st.get(woman).onArrive = () => say(LIGHT_PHRASE, true);
    },
    lightsOn() { lamp.intensity = 0; if (woman.visible) { mood('angry'); st.get(woman).pose = 'point'; setPose(woman, 'point', 0); } render(); },
  };
}
