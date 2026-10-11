/* 3D конструктора шкафа PRO (Three.js). Модель — из shkaf-pro-core.js. Координаты, см: x вправо, y вверх, z к зрителю (задняя стенка z≈0). */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { geom, doorList, PALETTE, LACO, roomPoly, wfoot, MIRROR_KINDS, bedDims, BED_COLORS } from '/static/js/shkaf-pro-core.js?v=3';

const DEG = Math.PI / 180, ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export function createPro3D(container, hooks = {}, opts = {}) {
  const viewOnly = !!opts.viewOnly;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  try { if (getComputedStyle(container).position === 'static') container.style.position = 'relative'; } catch (e) {}
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;border-radius:inherit';
  const hud = document.createElement('div');
  hud.style.cssText = 'position:absolute;left:12px;bottom:12px;padding:7px 11px;border-radius:10px;background:rgba(18,22,28,.84);color:#fff;font:600 12px/1.45 system-ui,sans-serif;pointer-events:none;display:none;white-space:pre-line;z-index:3';
  container.appendChild(hud);
  const setHud = t => { if (t) { hud.textContent = t; hud.style.display = 'block'; } else hud.style.display = 'none'; };

  const scene = new THREE.Scene(); scene.background = new THREE.Color('#ece6dc');
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
  const camera = new THREE.PerspectiveCamera(36, 1, 2, 6000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.maxPolarAngle = 89 * DEG; controls.minDistance = 80; controls.maxDistance = 1500; controls.screenSpacePanning = true;
  let rotateMode = true;
  function setRotate(on) { rotateMode = !!on; controls.mouseButtons = { LEFT: on ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: on ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE }; controls.touches = { ONE: on ? THREE.TOUCH.ROTATE : THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }; }
  const hemi = new THREE.HemisphereLight('#fff8ee', '#b9a07a', .6); scene.add(hemi); const HEMI0 = .6, SUN0 = 2.1;
  const sun = new THREE.DirectionalLight('#fff3df', 2.1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .6; scene.add(sun); scene.add(sun.target);

  const glowTex = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 64; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(255,214,130,1)'); gr.addColorStop(1, 'rgba(255,214,130,0)'); g.fillStyle = gr; g.fillRect(0, 0, 4, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const mkGlow = () => new THREE.MeshBasicMaterial({ map: glowTex, color: '#ffffff', transparent: true, opacity: .2, depthWrite: false, blending: THREE.AdditiveBlending });
  const glowRTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 8, 64, 64, 64); gr.addColorStop(0, 'rgba(255,214,130,1)'); gr.addColorStop(1, 'rgba(255,214,130,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const mkGlowR = () => new THREE.MeshBasicMaterial({ map: glowRTex, color: '#ffffff', transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending });
  let dusk = false, ledsOn = true, lastM = null;
  function ledBoost(M) { if (!M) return; const k = ledsOn ? (dusk ? 36 : 2) : 0; M.led.emissiveIntensity = k; M.led.color.set(ledsOn ? '#fff3c4' : '#6b6a66'); M.glowMat.opacity = ledsOn ? (dusk ? .95 : .2) : 0; if (M.glowR) M.glowR.opacity = ledsOn ? (dusk ? 1 : .3) : 0; }
  function setLight(on) { dusk = !on; renderer.toneMappingExposure = dusk ? .11 : 1.05; hemi.intensity = dusk ? .03 : HEMI0; sun.intensity = dusk ? .05 : SUN0; scene.background = new THREE.Color(dusk ? '#15120f' : '#ece6dc'); ledBoost(lastM); invalidate(); }
  function setLeds(on) { ledsOn = !!on; ledBoost(lastM); invalidate(); }
  let needs = true; const invalidate = () => { needs = true; };
  let root = new THREE.Group(); scene.add(root);
  let wg = null, state = null, sel = null, picks = [], doorsAnim = [], openTarget = new Map(), openAmt = new Map(), selBox = null, first = true;

  const mats = {};
  const stdMat = (hex, o) => new THREE.MeshStandardMaterial(Object.assign({ color: hex, roughness: .55, metalness: 0, envMapIntensity: .6 }, o || {}));
  function bodyHex(S) { return S.custom || (PALETTE[S.color] || PALETTE[0])[1]; }

  function build(S) {
    scene.remove(root); root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    root = new THREE.Group(); scene.add(root); picks = []; doorsAnim = []; selBox = null;
    const g = geom(S), t = S.t, W = g.W, H = S.H, D = S.D, ph = S.plinth, hex = bodyHex(S);
    const M = {
      body: stdMat(hex), bodyDark: stdMat(new THREE.Color(hex).multiplyScalar(.82).getStyle()), back: stdMat(new THREE.Color(hex).multiplyScalar(.9).getStyle(), { roughness: .8 }),
      plinth: stdMat('#2d2b29', { roughness: .7 }), chrome: stdMat('#e8ecef', { roughness: .15, metalness: 1 }), steel: stdMat('#9aa0a6', { roughness: .35, metalness: .7 }),
      led: new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffe29a', emissiveIntensity: 2 }), cushion: stdMat('#8b8f94', { roughness: .9 }), glowMat: mkGlow(), glowR: mkGlowR(), groove: stdMat(new THREE.Color(hex).multiplyScalar(.55).getStyle(), { roughness: .8 }), inner: stdMat('#efefec', { roughness: .8 }), black: stdMat('#1a1b1d', { roughness: .3, metalness: .4 }),
      mirror: new THREE.MeshStandardMaterial({ color: '#eef5f9', roughness: .06, metalness: .8, envMapIntensity: 2.4 }),
      glassClear: new THREE.MeshPhysicalMaterial({ color: '#cfe6f2', roughness: .04, metalness: 0, transparent: true, opacity: .32, envMapIntensity: 1, depthWrite: false }),
      alu: stdMat('#b8bec4', { roughness: .3, metalness: .85 }),
      glass: n => new THREE.MeshStandardMaterial({ color: (LACO[n] || LACO[0])[1], roughness: .12, metalness: .1, envMapIntensity: .9 })
    };
    const rm0 = S.room || {}, ft = wfoot(S); wg = new THREE.Group(); wg.position.set((rm0.ox || 0) - ft.mx, 0, (rm0.oz || 0) - ft.mz); wg.rotation.y = (rm0.rot || 0) * Math.PI / 180; root.add(wg);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: .22 });
    const box = (w, h, d, mat, x, y, z, meta, parent) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(.05, w), Math.max(.05, h), Math.max(.05, d)), mat); m.castShadow = m.receiveShadow = true;
      m.position.set(x + w / 2, y + h / 2, z + d / 2);
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeMat));
      if (meta) { m.userData.sel = meta; picks.push(m); }
      (parent || wg).add(m); return m;
    };
    const cyl = (r, len, mat, x, y, z, axis, meta) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), mat); m.castShadow = true;
      if (axis === 'x') m.rotation.z = Math.PI / 2; else if (axis === 'z') m.rotation.x = Math.PI / 2;
      m.position.set(x, y, z); if (meta) { m.userData.sel = meta; picks.push(m); } wg.add(m); return m;
    };
    const z0 = .3, bd = D - z0;
    // стены и пол помещения
    buildRoom(S);
    // корпус: секции (между проёмами), перегородки, антресоли — каждая отдельным блоком
    const selK = { k: 'global' }, n = g.cols.length;
    g.runs.forEach(r => {
      const rw = r.x1 - r.x0, H = r.H, D = r.D, bd = D - z0;
      box(t, H - ph - t, bd, M.body, r.x0, ph + t, z0, selK); box(t, H - ph - t, bd, M.body, r.x1 - t, ph + t, z0, selK);
      box(rw - 2 * t, t, bd, M.body, r.x0 + t, H - t, z0, selK); box(rw, t, bd, M.body, r.x0, ph, z0, selK);
      box(rw - 2 * t, H - ph - 2 * t, .3, M.back, r.x0 + t, ph + t, 0);
      box(rw - 2 * t, ph - .2, t, M.plinth, r.x0 + t, 0, D - 6);
    });
    g.bnd.forEach((b, k) => { if (!b.has || k === 0 || k === n) return; const L = g.cols[k - 1], R = g.cols[k]; if (L.gap || R.gap || R.split) return; box(t, L.y1 - g.y0, L.D - z0, M.body, b.x, g.y0, z0, { k: 'col', i: k - 1 }); });
    g.cols.forEach((c, i) => {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(c.w, c.y1 - g.y0), new THREE.MeshBasicMaterial({ visible: false })); pl.position.set(c.xa + c.w / 2, (g.y0 + c.y1) / 2, 1); pl.userData.sel = { k: 'col', i }; picks.push(pl); wg.add(pl);
    });
    g.mz.forEach(m => {
      const meta = { k: 'mezz', i: m.mi }, mbd = bd;
      box(t, m.h - t, mbd, M.body, m.x0, m.yb + t, z0, meta); box(t, m.h - t, mbd, M.body, m.x1 - t, m.yb + t, z0, meta);
      box(m.w - 2 * t, t, mbd, M.body, m.x0 + t, m.yt - t, z0, meta); box(m.w, t, mbd, M.body, m.x0, m.yb, z0, meta);
      box(m.w - 2 * t, m.h - 2 * t, .3, M.back, m.x0 + t, m.yb + t, 0, meta);
      m.dv.forEach(off => box(t, m.h - 2 * t, mbd, M.body, m.ix0 + off, m.iy0, z0, meta));
      m.comp.forEach(c => { for (let k = 1; k <= (m.shelves | 0); k++) box(c.x1 - c.x0 - .2, t, D - 2.5, M.body, c.x0 + .1, m.iy0 + (m.iy1 - m.iy0) * k / ((m.shelves | 0) + 1), z0, meta); });
    });
    // наполнение
    S.cols.forEach((col, ci) => {
      const c = g.cols[ci]; if (col.gap) return;
      const D = c.D;
      col.items.forEach(it => {
        const meta = { k: 'item', id: it.id, col: ci };
        if (it.type === 'shelf') box(c.w - .2, t, it.d || D - 2.5, M.body, c.xa + .1, it.y, z0, meta);
        else if (it.type === 'rod') {
          cyl(1.25, c.w - .6, M.chrome, c.xa + c.w / 2, it.y, D / 2, 'x', meta);
          [c.xa + .1, c.xb - 2.9].forEach(x => box(2.8, 3.4, 2.4, M.steel, x, it.y - 1.7, D / 2 - 1.2, meta));
        }
        else if (it.type === 'drawer') {
          const y = it.y, fh = it.fh, key = 'w' + it.id, dm = { k: 'item', id: it.id, col: ci, key }, grp = new THREE.Group(); wg.add(grp);
          box(c.w - .4, fh - .3, t, M.body, c.xa + .2, y + .15, D - t, dm, grp);
          box(1.2, fh - 4, D - 12, M.steel, c.xa + 1.2, y + 1.5, 6, dm, grp); box(1.2, fh - 4, D - 12, M.steel, c.xb - 2.4, y + 1.5, 6, dm, grp);
          box(c.w - 4.8, fh - 4, 1.2, M.inner, c.xa + 2.4, y + 1.5, 6, dm, grp); box(c.w - 4.8, 1, D - 12, M.inner, c.xa + 2.4, y + 1.2, 6, dm, grp);
          if (S.doors.handles !== false) box(Math.min(14, c.w * .5), .8, 1.4, M.chrome, c.xa + c.w / 2 - Math.min(14, c.w * .5) / 2, y + fh - 4, D, dm, grp);
          doorsAnim.push({ key, apply: f => { grp.position.z = f * (D - 14) * .8; } });
        }
        else if (it.type === 'idoor') {
          const key = 'i' + it.id, dm = { k: 'item', id: it.id, col: ci, key }, iw = Math.min(it.w || (c.w - it.x), c.w - it.x), ih = it.y1 - it.y, x0 = c.xa + it.x, z = D - 1.2;
          const pv = new THREE.Group(); wg.add(pv);
          if (it.dir === 'R') { pv.position.set(x0 + iw, it.y, z); box(iw - .2, ih - .2, 1.6, M.body, -iw + .1, .1, 0, dm, pv); box(.9, Math.min(20, ih * .3), 1.6, M.chrome, -iw + 3, ih / 2 - 10, 1.6, dm, pv); doorsAnim.push({ key, apply: f => { pv.rotation.y = 105 * DEG * f; } }); }
          else if (it.dir === 'U') { pv.position.set(x0, it.y + ih, z); box(iw - .2, ih - .2, 1.6, M.body, .1, -ih + .1, 0, dm, pv); box(Math.min(20, iw * .4), .9, 1.6, M.chrome, iw / 2 - Math.min(20, iw * .4) / 2, -ih + 3, 1.6, dm, pv); doorsAnim.push({ key, apply: f => { pv.rotation.x = -100 * DEG * f; } }); }
          else if (it.dir === 'D') { pv.position.set(x0, it.y, z); box(iw - .2, ih - .2, 1.6, M.body, .1, .1, 0, dm, pv); box(Math.min(20, iw * .4), .9, 1.6, M.chrome, iw / 2 - Math.min(20, iw * .4) / 2, ih - 4, 1.6, dm, pv); doorsAnim.push({ key, apply: f => { pv.rotation.x = 95 * DEG * f; } }); }
          else { pv.position.set(x0, it.y, z); box(iw - .2, ih - .2, 1.6, M.body, .1, .1, 0, dm, pv); box(.9, Math.min(20, ih * .3), 1.6, M.chrome, iw - 3.5, ih / 2 - 10, 1.6, dm, pv); doorsAnim.push({ key, apply: f => { pv.rotation.y = -105 * DEG * f; } }); }
        }
        else if (it.type === 'shoe') {
          for (let k = 0; k < it.n; k++) {
            const m = box(c.w - .2, t, D - 6, M.body, -(c.w - .2) / 2, -t / 2, -(D - 6) / 2, meta); wg.remove(m);
            const gr = new THREE.Group(); gr.add(m); m.position.set(0, 0, 0); gr.position.set(c.xa + c.w / 2, it.y + k * 12 + 6, z0 + (D - 6) / 2); gr.rotation.x = 12 * DEG; wg.add(gr);
            const lip = box(c.w - .2, 3, .8, M.steel, -(c.w - .2) / 2, -1.5, (D - 6) / 2 - .4, meta, gr); void lip;
          }
        }
        else if (it.type === 'pant') {
          box(c.w - 2, .6, D - 12, M.steel, c.xa + 1, it.y + 5, 6, meta);
          for (let k = 0; k < 7; k++) box(c.w - 3, .5, .8, M.steel, c.xa + 1.5, it.y + 5.6, 9 + k * (D - 24) / 6, meta);
          box(.8, 8, D - 12, M.steel, c.xa + 1, it.y + 1, 6, meta); box(.8, 8, D - 12, M.steel, c.xb - 1.8, it.y + 1, 6, meta);
        }
        else if (it.type === 'basket') {
          const bw = c.w - 3, bdp = D - 14;
          box(bw, .5, bdp, M.steel, c.xa + 1.5, it.y, 8, meta);
          [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([a, b]) => box(.5, it.h, .5, M.steel, c.xa + 1.5 + a * (bw - .5), it.y, 8 + b * (bdp - .5), meta));
          [0, 1].forEach(b => box(bw, .5, .5, M.steel, c.xa + 1.5, it.y + it.h - .5, 8 + b * (bdp - .5), meta)); [0, 1].forEach(a => box(.5, .5, bdp, M.steel, c.xa + 1.5 + a * (bw - .5), it.y + it.h - .5, 8, meta));
        }
        else if (it.type === 'hook') {
          box(c.w - .4, 4, 1.6, M.body, c.xa + .2, it.y, z0, meta);
          const n = Math.max(2, Math.floor(c.w / 8)); for (let k = 0; k < n; k++) box(.8, .8, 5, M.chrome, c.xa + (k + .5) * c.w / n, it.y + 2, z0 + 1.6, meta);
        }
        else if (it.type === 'led') { box(c.w - 1, .6, 1.4, M.led, c.xa + .5, it.y, D - 6, meta); box(c.w - 1, 7, D - 14, M.glowMat, c.xa + .5, it.y - 6.6, 7); }
        else if (it.type === 'vpanel') { const x = Math.max(c.xa + 1, Math.min(c.xb - t - 1, c.xa + it.x)); box(t, it.y1 - it.y, D - 2.5, M.body, x, it.y, z0, meta); }
      });
    });
    // отдельные панели: зеркало / стекло на стене или на фасаде
    // grooves(): фрезеровка (пазы, кассеты, филёнка) на лицевой стороне
    const grooves = (x, y, w, h, z, pat, pitch, meta, parent) => {
      const gw = .45, gz = .35;
      if (pat === 'vgroove' || pat === 'grid') for (let xi = x + pitch; xi < x + w - .5; xi += pitch) box(gw, h - 4, gz, M.groove, xi, y + 2, z, meta, parent);
      if (pat === 'hgroove' || pat === 'grid') for (let yi = y + pitch; yi < y + h - .5; yi += pitch) box(w - 4, gw, gz, M.groove, x + 2, yi, z, meta, parent);
      if (pat === 'frame') { const m = Math.min(6, w / 5, h / 5); box(w - 2 * m, gw, gz, M.groove, x + m, y + m, z, meta, parent); box(w - 2 * m, gw, gz, M.groove, x + m, y + h - m, z, meta, parent); box(gw, h - 2 * m, gz, M.groove, x + m, y + m, z, meta, parent); box(gw, h - 2 * m, gz, M.groove, x + w - m, y + m, z, meta, parent); }
    };
    (S.panels || []).forEach((p, pi) => {
      const meta = { k: 'panel', i: pi }, z = p.mount === 'front' ? D + 3.8 : (p.mount === 'free' ? Math.max(.5, p.pz || 30) : .5);
      if (p.kind === 'slats') {
        const sw = (p.sw || 100) / 10, sd = (p.sd || 32) / 10, sg = (p.sg || 20) / 10, vert = p.so !== 'h', span = vert ? p.w : p.h, cnt = Math.max(1, Math.floor((span + sg) / (sw + sg)));
        for (let k = 0; k < cnt; k++) { const o = k * (sw + sg); if (vert) box(sw, p.h, sd, M.body, p.x + o, p.y, z, meta); else box(p.w, sw, sd, M.body, p.x, p.y + o, z, meta); }
        return;
      }
      const th = (p.kind === 'dsp' || p.kind === 'mdf') ? 1.6 : .7;
      const mat = (p.kind === 'dsp' || p.kind === 'mdf') ? M.body : (p.kind === 'glass' ? M.glassClear : (p.kind === 'laco' ? M.glass(S.doors.laco) : M.mirror));
      const shape = MIRROR_KINDS.includes(p.kind) ? (p.shape || 'rect') : 'rect', cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      const ell = (w, h, mt, zz, tt) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, tt, 56), mt); m.rotation.x = Math.PI / 2; m.scale.set(w, 1, h); m.position.set(cx, cy, zz + tt / 2); m.castShadow = true; m.userData.sel = meta; picks.push(m); wg.add(m); return m; };
      if (shape === 'round' || shape === 'oval') {
        ell(p.w, p.h, mat, z, th);
        if (p.bl) { ell(p.w + 3, p.h + 3, M.led, z - .5, .4); const gl = new THREE.Mesh(new THREE.PlaneGeometry(p.w + 40, p.h + 40), M.glowR); gl.position.set(cx, cy, z - .6); wg.add(gl); }
      } else if (shape === 'arch') {
        const r = p.w / 2, bh = Math.max(1, p.h - r);
        box(p.w, bh, th, mat, p.x, p.y, z, meta);
        { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, th, 56), mat); m.rotation.x = Math.PI / 2; m.position.set(cx, p.y + bh, z + th / 2); m.userData.sel = meta; picks.push(m); wg.add(m); }
        if (p.bl) { box(p.w + 3, bh, .4, M.led, p.x - 1.5, p.y - 1.5, z - .5, null); const m2 = new THREE.Mesh(new THREE.CylinderGeometry(r + 1.5, r + 1.5, .4, 56), M.led); m2.rotation.x = Math.PI / 2; m2.position.set(cx, p.y + bh, z - .3); wg.add(m2); const gl = new THREE.Mesh(new THREE.PlaneGeometry(p.w + 40, p.h + 40), M.glowR); gl.position.set(cx, cy, z - .6); wg.add(gl); }
      } else if (p.frame && p.kind !== 'mdf') { const f = Math.min(p.fw || 3, p.w / 2 - .5, p.h / 2 - .5); box(p.w - 2 * f, p.h - 2 * f, th, mat, p.x + f, p.y + f, z, meta); box(p.w, f, th + 1, M.alu, p.x, p.y, z, meta); box(p.w, f, th + 1, M.alu, p.x, p.y + p.h - f, z, meta); box(f, p.h - 2 * f, th + 1, M.alu, p.x, p.y + f, z, meta); box(f, p.h - 2 * f, th + 1, M.alu, p.x + p.w - f, p.y + f, z, meta); }
      else box(p.w, p.h, th, mat, p.x, p.y, z, meta);
      if (shape === 'rect' && p.bl && MIRROR_KINDS.includes(p.kind)) { const b = 1.2; box(p.w + 2 * b, b, .4, M.led, p.x - b, p.y - b, z - .5); box(p.w + 2 * b, b, .4, M.led, p.x - b, p.y + p.h, z - .5); box(b, p.h, .4, M.led, p.x - b, p.y, z - .5); box(b, p.h, .4, M.led, p.x + p.w, p.y, z - .5); const gl = new THREE.Mesh(new THREE.PlaneGeometry(p.w + 44, p.h + 44), M.glowR); gl.position.set(cx, cy, z - .6); wg.add(gl); }
      if (p.kind === 'mdf') grooves(p.x, p.y, p.w, p.h, z + th, p.pat || 'vgroove', p.gp || 12, meta);
    });
    // тумбы-обувницы: отдельные низкие шкафчики (откидные створки, двери или ящики), можно двигать
    (S.units || []).forEach((u, ui) => {
      const base = { k: 'unit', i: ui }, ph2 = u.legs || 0, hb = u.h - ph2, w = u.w, d = u.d, x0 = u.x, zf = (u.pz || 0), fn = Math.max(1, u.n | 0), fill = u.fill || 'dsp';
      const fmat = fill === 'dsp' || fill === 'mdf' ? M.body : (fill === 'glass' ? M.glassClear : M.mirror);
      box(w, t, d, M.body, x0, ph2, zf, base); box(t, hb - t, d, M.body, x0, ph2 + t, zf, base); box(t, hb - t, d, M.body, x0 + w - t, ph2 + t, zf, base);
      if (u.seat) { box(w + 1, t, d + 1.5, M.body, x0 - .5, u.h - t, zf, base); box(w + 1, 6, d + 1.5, M.cushion, x0 - .5, u.h, zf, base); } else box(w - 2 * t, t, d, M.body, x0 + t, u.h - t, zf, base);
      box(w - 2 * t, hb - 2 * t, .3, M.back, x0 + t, ph2 + t, zf, base);
      if (ph2 > 0) [[2, 2], [w - 3, 2], [2, d - 3], [w - 3, d - 3]].forEach(([lx, lz]) => cyl(1.2, ph2, M.plinth, x0 + lx, ph2 / 2, zf + lz, null));
      const fh = (hb - t - .3) / fn;
      for (let k = 0; k < fn; k++) {
        const key = 'u' + u.id + '.' + k, meta = Object.assign({ key }, base), y = ph2 + t + k * fh + .15, hh = fh - .3;
        if (u.kind === 'flap') {
          box(w - 2 * t, .8, d - 4, M.body, x0 + t, y + hh * .35, zf + 2, base).rotation.x = -.26;
          const pv = new THREE.Group(); pv.position.set(x0 + .2, y, zf + d); wg.add(pv);
          box(w - .4, hh, 1.8, fmat, 0, 0, 0, meta, pv); if (fill === 'mdf') grooves(0, 0, w - .4, hh, 1.8, 'frame', 10, meta, pv);
          if (S.doors.handles !== false) box(Math.min(20, w * .4), .9, 1.6, M.chrome, (w - .4) / 2 - Math.min(20, w * .4) / 2, hh - 4, 1.8, meta, pv);
          doorsAnim.push({ key, apply: f => { pv.rotation.x = 72 * DEG * f; } });
        } else if (u.kind === 'drawers') {
          const grp = new THREE.Group(); wg.add(grp);
          box(w - .4, hh, 1.8, fmat, x0 + .2, y, zf + d - 1.8, meta, grp); box(w - 2 * t - 2, hh - 4, d - 8, M.inner, x0 + t + 1, y + 1.5, zf + 2, meta, grp);
          if (S.doors.handles !== false) box(Math.min(20, w * .4), .8, 1.4, M.chrome, x0 + w / 2 - Math.min(20, w * .4) / 2, y + hh - 4, zf + d, meta, grp);
          doorsAnim.push({ key, apply: f => { grp.position.z = f * (d - 8) * .8; } });
        } else {
          if (k < fn - 1) box(w - 2 * t - .2, t, d - 3, M.body, x0 + t + .1, y + hh + .15 - t / 2, zf + 1, base);
        }
      }
      if (u.kind === 'doors') {
        const dn = w > 65 ? 2 : 1, dw = w / dn;
        for (let k = 0; k < dn; k++) {
          const key = 'u' + u.id + '.d' + k, meta = Object.assign({ key }, base), left = k < dn / 2, pv = new THREE.Group(); pv.position.set(x0 + (left ? k * dw + .2 : (k + 1) * dw - .2), ph2 + .2, zf + d); wg.add(pv);
          const dx = left ? 0 : -(dw - .4); box(dw - .4, hb - .4, 1.8, fmat, dx, 0, 0, meta, pv); if (fill === 'mdf') grooves(dx, 0, dw - .4, hb - .4, 1.8, 'frame', 10, meta, pv);
          if (S.doors.handles !== false) box(.9, Math.min(24, hb * .3), 1.6, M.chrome, left ? dx + dw - 4 : dx + 3, hb / 2 - 12, 1.8, meta, pv);
          doorsAnim.push({ key, apply: f => { pv.rotation.y = (left ? -1 : 1) * 105 * DEG * f; } });
        }
      }
    });
    // кровати: одноярусная и двухъярусная детская; изголовье у z=0, длина вдоль z (поворот 90° — вдоль стены)
    (S.beds || []).forEach((b, bi) => {
      const dd = bedDims(b, t), W = dd.W, L = dd.L, base = { k: 'bed', i: bi }, bg = new THREE.Group();
      if (b.rot === 90) { bg.rotation.y = 90 * DEG; bg.position.set(b.x, 0, b.pz + W); } else bg.position.set(b.x, 0, b.pz);
      wg.add(bg);
      const fabric = (BED_COLORS[b.mcol] || BED_COLORS[0])[1], B = (w, h, d2, mat, x, y, z, meta) => box(w, h, d2, mat, x, y, z, meta || base, bg);
      const mMat = stdMat(fabric, { roughness: .95 }), pill = stdMat('#f4f1ec', { roughness: .95 }), duv = stdMat(new THREE.Color(fabric).lerp(new THREE.Color('#ffffff'), .55).getStyle(), { roughness: .97 }), wood = stdMat('#c9a273', { roughness: .6 });
      [[0, 0], [W - 5, 0], [0, L - 5], [W - 5, L - 5]].forEach(([lx, lz]) => B(5, b.lg, 5, M.plinth, lx, 0, lz));
      B(t, b.sh, L - 2 * t, M.body, 0, b.lg, t); B(t, b.sh, L - 2 * t, M.body, W - t, b.lg, t);
      B(W, b.hh - b.lg, t, M.body, 0, b.lg, 0); B(W, b.fh - b.lg, t, M.body, 0, b.lg, L - t);
      if (b.soft) B(W - 2, Math.max(2, b.hh - (b.lg + b.sh) - 4), 6, stdMat(fabric, { roughness: .95 }), 1, b.lg + b.sh + 2, t);
      B(3, 4, L - 2 * t, wood, t, b.lg + b.sh - 6, t); B(3, 4, L - 2 * t, wood, W - t - 3, b.lg + b.sh - 6, t);
      const deckParts = (y0, lift, keyPrefix) => {
        const dk = new THREE.Group(); dk.position.set(0, y0, t); bg.add(dk);
        const dm = lift ? Object.assign({ key: keyPrefix + '.lift' }, base) : base, bx = (w, h, d2, mat, x, y, z) => box(w, h, d2, mat, x, y, z, dm, dk), n = dd.n, span = (b.ml + 1) - 6.8;
        for (let k = 0; k < n; k++) bx(W - 2 * t, .8, 6.8, wood, t, 0, n > 1 ? k * span / (n - 1) : 0);
        bx(b.mw, b.mt, b.ml, mMat, t + .5, .8, .5);
        for (let k = 0; k < 3; k++) bx(b.mw - 1, .3, .5, stdMat(new THREE.Color(fabric).multiplyScalar(.8).getStyle()), t + 1, .8 + b.mt + .05, 20 + k * (b.ml - 40) / 2);
        if (b.bedding) { const pw = Math.min(55, b.mw / 2 - 3); bx(pw, 12, 38, pill, t + 2, .8 + b.mt, 3); if (b.mw >= 110) bx(pw, 12, 38, pill, t + b.mw - pw - 1, .8 + b.mt, 3); bx(b.mw + 3, 5, b.ml * .62, duv, t - 1, .8 + b.mt - 2, 42); }
        if (lift) doorsAnim.push({ key: keyPrefix + '.lift', apply: f => { dk.rotation.x = -55 * DEG * f; } });
      };
      deckParts(dd.slatTop, !!b.lift && b.kind !== 'bunk', 'b' + b.id);
      for (let k = 0; k < (b.drw | 0); k++) {
        const dn = b.drw | 0, fl = (L - 2 * t) / dn - .3, z = t + k * (L - 2 * t) / dn + .15, key = 'b' + b.id + '.dr' + k, dm = Object.assign({ key }, base), grp = new THREE.Group(); bg.add(grp);
        box(1.8, b.sh - 4, fl, M.body, W, b.lg + 2, z, dm, grp); box(36, Math.max(4, b.sh - 10), fl - 4, M.inner, W - 36, b.lg + 4, z + 2, dm, grp);
        if (S.doors.handles !== false) box(1.2, .9, Math.min(16, fl * .5), M.chrome, W + 1.8, b.lg + b.sh - 6, z + fl / 2 - Math.min(16, fl * .5) / 2, dm, grp);
        doorsAnim.push({ key, apply: f => { grp.position.x = f * 36; } });
      }
      if (b.kind === 'bunk') {
        const y2 = b.lv2 + 3.2 - b.sh, ph = dd.postH;
        [[0, 0], [W - 7, 0], [0, L - 7], [W - 7, L - 7]].forEach(([lx, lz]) => B(7, ph, 7, wood, lx, 0, lz));
        B(t, b.sh, L - 2 * t, M.body, 0, y2, t); B(t, b.sh, L - 2 * t, M.body, W - t, y2, t); B(3, 4, L - 2 * t, wood, t, y2 + b.sh - 6 + 1, t); B(3, 4, L - 2 * t, wood, W - t - 3, y2 + b.sh - 6 + 1, t);
        const dk2 = new THREE.Group(); dk2.position.set(0, b.lv2, t); bg.add(dk2); const n = dd.n, span = (b.ml + 1) - 6.8, bx2 = (w, h, d2, mat, x, y, z) => box(w, h, d2, mat, x, y, z, base, dk2);
        for (let k = 0; k < n; k++) bx2(W - 2 * t, .8, 6.8, wood, t, 0, n > 1 ? k * span / (n - 1) : 0);
        bx2(b.mw, b.mt, b.ml, mMat, t + .5, .8, .5);
        if (b.bedding) { bx2(Math.min(55, b.mw - 4), 11, 36, pill, t + 2, .8 + b.mt, 3); bx2(b.mw + 2, 4, b.ml * .6, duv, t - .5, .8 + b.mt - 1.5, 42); }
        const gy = b.lv2 - 2, gh = b.mt + b.rail + 2;
        B(W, gh, t, M.body, 0, gy, 0);                                              // изголовный бортик
        if (b.ladder === 'end') { B(t, gh, L - 2 * t, M.body, 0, gy, t); B(t, gh, L - 2 * t, M.body, W - t, gy, t); }
        else { B(t, gh, L - 2 * t, M.body, 0, gy, t); const gl = (L - 2 * t) * .5; B(t, gh, gl, M.body, W - t, gy, t); B(W, gh, t, M.body, 0, gy, L - t); }
        const sn = Math.max(3, b.steps | 0), sp = b.lv2 / (sn + 1);
        if (b.ladder === 'end') { [10, W - 16].forEach(x => B(6, b.lv2 + 6, 2.5, wood, x, 0, L + 3)); for (let k = 1; k <= sn; k++) B(W - 26, 2.5, 6, wood, 13, k * sp, L + 1.5); }
        else { const z1 = L - 2 * t - (L - 2 * t) * .5 + t; [z1 + 8, L - t - 14].forEach(z => B(2.5, b.lv2 + 6, 6, wood, W + 3, 0, z)); for (let k = 1; k <= sn; k++) B(6, 2.5, (L - t - 14) - (z1 + 8) + 6, wood, W + 1.5, k * sp, z1 + 8); }
      }
    });
    // двери: основные (по секциям) и антресолей (каждая своими)
    const dl = doorList(S);
    dl.forEach(d => {
      const D = d.ci != null && g.cols[d.ci] ? g.cols[d.ci].D : S.D;
      const mz = d.zone === 'mezz', gl = d.fill === 'glass', mat = (d.fill === 'dsp' || d.fill === 'mdf') ? M.body : (d.fill === 'laco' ? M.glass(S.doors.laco) : (gl ? M.glassClear : M.mirror)), th = (d.fill === 'dsp' || d.fill === 'mdf') ? 1.6 : .8;
      const face = (par, dx, dy) => { if (!gl) { box(d.w, d.h, th, mat, dx, dy, 0, meta, par); if (d.fill === 'mdf') grooves(dx, dy, d.w, d.h, th, 'frame', 10, meta, par); return; } const f = Math.min(Math.max(1, S.doors.gf || 4), d.w / 2 - .6, d.h / 2 - .6); box(d.w - 2 * f, d.h - 2 * f, .5, M.glassClear, dx + f, dy + f, .5, meta, par); box(d.w, f, 1.8, M.alu, dx, dy, 0, meta, par); box(d.w, f, 1.8, M.alu, dx, dy + d.h - f, 0, meta, par); box(f, d.h - 2 * f, 1.8, M.alu, dx, dy + f, 0, meta, par); box(f, d.h - 2 * f, 1.8, M.alu, dx + d.w - f, dy + f, 0, meta, par); };
      const key = mz ? 'm' + d.mi + '.' + d.i : 'd' + d.i, meta = mz ? { k: 'mezz', i: d.mi, key } : (d.ci != null ? { k: 'col', i: d.ci, key } : { k: 'doors', key });
      if (d.sliding) {
        const layer = d.ri % 2, z = D + .4 + layer * 3.4, grp = new THREE.Group(); grp.position.set(d.x, 0, z); wg.add(grp);
        face(grp, 0, d.y);
        if (d.fill !== 'dsp' && !gl) { box(d.w, 2.2, th + .4, M.steel, 0, d.y, -.2, null, grp); box(d.w, 2.2, th + .4, M.steel, 0, d.y + d.h - 2.2, -.2, null, grp); }
        doorsAnim.push({ key, apply: f => { grp.position.x = d.x + (layer === 1 ? (d.w - 2.5) * f * (d.left ? -1 : 1) : 0); } });
      } else {
        const hg = d.hinge || (d.left ? 'L' : 'R'), pv = new THREE.Group(); wg.add(pv);
        if (hg === 'L' || hg === 'R') {
          const left = hg === 'L'; pv.position.set(left ? d.x : d.x + d.w, d.y, D + .3);
          const dx = left ? 0 : -d.w;
          face(pv, dx, 0);
          if (S.doors.handles !== false) box(.9, Math.min(24, d.h * .3), 1.6, M.chrome, left ? dx + d.w - 4 : dx + 3, mz ? Math.min(6, d.h / 3) : d.h / 2 - 12, th, meta, pv);
          doorsAnim.push({ key, apply: f => { pv.rotation.y = (left ? -1 : 1) * 105 * DEG * f; } });
        } else if (hg === 'U') {
          pv.position.set(d.x, d.y + d.h, D + .3); face(pv, 0, -d.h);
          if (S.doors.handles !== false) box(Math.min(24, d.w * .4), .9, 1.6, M.chrome, d.w / 2 - Math.min(24, d.w * .4) / 2, -d.h + 3, th, meta, pv);
          doorsAnim.push({ key, apply: f => { pv.rotation.x = -105 * DEG * f; } });
        } else {
          pv.position.set(d.x, d.y, D + .3); face(pv, 0, 0);
          if (S.doors.handles !== false) box(Math.min(24, d.w * .4), .9, 1.6, M.chrome, d.w / 2 - Math.min(24, d.w * .4) / 2, d.h - 4, th, meta, pv);
          doorsAnim.push({ key, apply: f => { pv.rotation.x = 95 * DEG * f; } });
        }
      }
    });
    if (S.led && !S.cols.some(c => c.items.some(i => i.type === 'led'))) g.cols.forEach(c => { if (!c.gap) box(c.w - 1, .6, 1.4, M.led, c.xa + .5, g.y1 - t - .8, D - 6); });
    // свет
    const sx = (rm0.ox || 0) + ft.w / 2, sz = (rm0.oz || 0) + ft.d / 2; sun.position.set(sx - 220, g.totalH + 260, sz + D + 340); sun.target.position.set(sx, H / 3, sz);
    const sc = sun.shadow.camera, sp = Math.max(W, g.totalH) * 1.1; sc.left = -sp; sc.right = sp; sc.top = sp; sc.bottom = -sp; sc.near = 10; sc.far = 1400; sc.updateProjectionMatrix();
    lastM = M; ledBoost(M);
    applyDoors(); highlight();
    if (first) { frame(); first = false; }
    invalidate();
  }
  function buildRoom(S) {   // пол и стены комнаты по углам (прямоугольник или нарисованная форма)
    const P = roomPoly(S), H = (S.room && S.room.H) || 260, n = P.length;
    const inside = (x, z) => { let c = false; for (let i = 0, j = n - 1; i < n; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
    const fl = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(P.map(p => new THREE.Vector2(p[0], -p[1])))), stdMat('#cdb48e', { roughness: .7 }));
    fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; root.add(fl);
    const wallM = stdMat('#efe8dc', { roughness: .95 }), skM = stdMat('#e4dccb', { roughness: .8 });
    for (let i = 0; i < n; i++) {
      const a = P[i], b = P[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      let nx = -dz / len, nz = dx / len; if (!inside(mx + nx * 2, mz + nz * 2)) { nx = -nx; nz = -nz; }
      const w = new THREE.Mesh(new THREE.PlaneGeometry(len, H), wallM); w.receiveShadow = true; w.rotation.y = Math.atan2(nx, nz); w.position.set(mx - nx * .8, H / 2, mz - nz * .8); root.add(w);
      const sk = new THREE.Mesh(new THREE.BoxGeometry(len, 7, 1.4), skM); sk.rotation.y = Math.atan2(nx, nz); sk.position.set(mx + nx * .1, 3.5, mz + nz * .1); root.add(sk);
    }
  }
  function applyDoors() { doorsAnim.forEach(a => a.apply(ease(openAmt.get(a.key) || 0))); }
  function frame() {
    if (!state) return; const g = geom(state), t = state.t;
    let x0 = 0, x1 = g.W, zMax = state.D;
    (state.units || []).forEach(u => { x0 = Math.min(x0, u.x); x1 = Math.max(x1, u.x + u.w); zMax = Math.max(zMax, (u.pz || 0) + u.d); });
    (state.panels || []).forEach(p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x + p.w); });
    (state.beds || []).forEach(b => { const d = bedDims(b, t), ex = b.rot === 90 ? d.L : d.W, ez = b.rot === 90 ? d.W : d.L; x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + ex); zMax = Math.max(zMax, b.pz + ez); });
    wg.updateMatrixWorld(true);
    const lc = new THREE.Vector3((x0 + x1) / 2, 0, zMax / 2).applyMatrix4(wg.matrixWorld), rr = (state.room && state.room.rot) || 0, ff = new THREE.Vector3(Math.sin(rr * Math.PI / 180), 0, Math.cos(rr * Math.PI / 180));
    const W = x1 - x0, H = g.totalH, dist = Math.max(W * 1.55, H * 1.75, 330);
    controls.target.set(lc.x, H * .46, lc.z); camera.position.set(lc.x + dist * .28 * ff.z + ff.x * dist, H * .6, lc.z + ff.z * dist - dist * .28 * ff.x); controls.update(); invalidate();
  }
  function highlight() {
    if (selBox) { root.remove(selBox); selBox = null; }
    if (!sel || sel.k === 'global') return;
    root.updateMatrixWorld(true);
    const bb = new THREE.Box3(); let any = false;
    picks.forEach(m => { const s = m.userData.sel; if (!s || !m.geometry || m.geometry.type === 'PlaneGeometry') return; if ((sel.k === 'item' && s.k === 'item' && s.id === sel.id) || (sel.k === 'col' && s.k === 'col' && s.i === sel.i && false) || (sel.k === 'mezz' && s.k === 'mezz' && s.i === sel.i) || (sel.k === 'panel' && s.k === 'panel' && s.i === sel.i) || (sel.k === 'unit' && s.k === 'unit' && s.i === sel.i) || (sel.k === 'bed' && s.k === 'bed' && s.i === sel.i) || (sel.k === 'doors' && s.k === 'doors')) { bb.expandByObject(m); any = true; } });
    if (sel.k === 'col' && state) { const g = geom(state), c = g.cols[sel.i]; if (c) { bb.set(new THREE.Vector3(c.xa, g.y0, 0), new THREE.Vector3(c.xb, c.y1, c.D)); any = true; } }
    if (!any) return;
    const sz = bb.getSize(new THREE.Vector3()), ct = bb.getCenter(new THREE.Vector3()), geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(sz.x + 1, sz.y + 1, sz.z + 1));
    selBox = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#e0a21a' })); selBox.position.copy(ct); root.add(selBox);
  }

  /* ---- мышь: выбрать, потянуть предмет по вертикали и между отсеками ---- */
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), plane = new THREE.Plane(), hitP = new THREE.Vector3();
  let downAt = null, drag = null, lastTap = { key: null, t: 0 };
  const rayFrom = ev => { const r = renderer.domElement.getBoundingClientRect(); ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camera); };
  function hit(ev) { rayFrom(ev); const h = ray.intersectObjects(picks, false).find(x => x.object.userData.sel); return h ? { sel: h.object.userData.sel, p: h.point.clone() } : null; }
  renderer.domElement.addEventListener('pointerdown', e => {
    downAt = [e.clientX, e.clientY]; drag = null; if (viewOnly) return;
    const h = hit(e); if (!h) return;
    if (h.sel.k === 'col' && !(sel && sel.k === 'col' && sel.i === h.sel.i) && hooks.onMoveAll) {   // потянули невыбранный отсек — двигаем весь шкаф по полу
      rayFrom(e); plane.set(new THREE.Vector3(0, 1, 0), 0); if (ray.ray.intersectPlane(plane, hitP)) { drag = { floor: true, sel: h.sel, p0: hitP.clone(), moved: false }; controls.enabled = false; try { renderer.domElement.setPointerCapture(e.pointerId); } catch (er) {} return; }
    }
    const colDrag = h.sel.k === 'col' && sel && sel.k === 'col' && sel.i === h.sel.i;   // отсек тащим, только если он уже выбран (иначе камера крутится)
    if (h.sel.k === 'item' || h.sel.k === 'mezz' || h.sel.k === 'panel' || h.sel.k === 'unit' || h.sel.k === 'bed' || colDrag) {
      if (hooks.onSelect) hooks.onSelect(h.sel);
      drag = { sel: h.sel, p0: h.p, moved: false }; controls.enabled = false; try { renderer.domElement.setPointerCapture(e.pointerId); } catch (er) {}
    }
  });
  renderer.domElement.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 5) return;
    drag.moved = true; rayFrom(e);
    if (drag.floor) { plane.set(new THREE.Vector3(0, 1, 0), 0); if (!ray.ray.intersectPlane(plane, hitP)) return; setHud(hooks.onMoveAll(hitP.x - drag.p0.x, hitP.z - drag.p0.z) || ''); invalidate(); return; }
    const rr = (state && state.room && state.room.rot) || 0, side = rr === 90 || rr === 270;
    if (side) plane.set(new THREE.Vector3(1, 0, 0), -drag.p0.x); else plane.set(new THREE.Vector3(0, 0, 1), -drag.p0.z); if (!ray.ray.intersectPlane(plane, hitP)) return;
    wg.updateMatrixWorld(true); const lx = wg.worldToLocal(hitP.clone()).x, lx0 = drag.l0 === undefined ? (drag.l0 = wg.worldToLocal(drag.p0.clone()).x) : drag.l0;
    const txt = hooks.onDrag && hooks.onDrag(drag.sel, hitP.y - drag.p0.y, lx, lx - lx0); setHud(txt || ''); invalidate();
  });
  const endDrag = () => { const d = drag; drag = null; controls.enabled = true; setHud(''); if (d && d.moved && d.floor && hooks.onMoveEnd) hooks.onMoveEnd(); else if (d && d.moved && hooks.onDragEnd) hooks.onDragEnd(); return !!(d && d.moved); };
  renderer.domElement.addEventListener('pointercancel', endDrag);
  renderer.domElement.addEventListener('pointerup', e => {
    if (endDrag()) return;
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
    const h = hit(e);
    if (viewOnly) { if (h && h.sel.key) toggleDoor(h.sel.key); return; }
    const now = performance.now();   // двойное нажатие по двери/ящику определяем сами: работает и на мыши, и на пальце
    if (h && h.sel.key) { if (lastTap.key === h.sel.key && now - lastTap.t < 550) { toggleDoor(h.sel.key); lastTap = { key: null, t: 0 }; } else lastTap = { key: h.sel.key, t: now }; } else lastTap = { key: null, t: 0 };
    if (hooks.onSelect) hooks.onSelect(h ? h.sel : null);
  });
  function toggleDoor(key) { openTarget.set(key, (openTarget.get(key) || 0) > .5 ? 0 : 1); invalidate(); }
  function toggleDoors(on) { const keys = [...new Set(doorsAnim.map(a => a.key))]; if (on === undefined) on = !keys.some(k => (openTarget.get(k) || 0) > .5); keys.forEach(k => openTarget.set(k, on ? 1 : 0)); invalidate(); }

  let last = performance.now(), raf = 0, alive = true;
  function loop(now) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - last) / 1000); last = now; let moving = false;
    openTarget.forEach((tg, k) => { const cur = openAmt.get(k) || 0; if (Math.abs(cur - tg) > .001) { openAmt.set(k, cur + Math.sign(tg - cur) * Math.min(Math.abs(tg - cur), dt / .8)); moving = true; } });
    if (moving) applyDoors();
    const damp = controls.update();
    if (moving || needs || damp) { renderer.render(scene, camera); needs = false; }
  }
  raf = requestAnimationFrame(loop);
  const ro = new ResizeObserver(() => { const w = container.clientWidth || 600, h = container.clientHeight || 400; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); invalidate(); });
  ro.observe(container);

  return {
    update(S) { state = S; build(S); },
    select(s) { sel = s; highlight(); invalidate(); },
    setLight, setLeds, isLight: () => !dusk, isLeds: () => ledsOn, setRotate, isRotate: () => rotateMode, toggleDoors, toggleDoor, isOpen: () => [...openTarget.values()].some(v => v > .5), frame, setHud,
    snapshot() { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); },
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); container.removeChild(renderer.domElement); }
  };
}
