/* 3D конструктора шкафа PRO (Three.js). Модель — из shkaf-pro-core.js. Координаты, см: x вправо, y вверх, z к зрителю (задняя стенка z≈0). */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { geom, doorList, PALETTE, LACO } from '/static/js/shkaf-pro-core.js?v=1';

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
  scene.add(new THREE.HemisphereLight('#fff8ee', '#b9a07a', .6));
  const sun = new THREE.DirectionalLight('#fff3df', 2.1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .6; scene.add(sun); scene.add(sun.target);

  let needs = true; const invalidate = () => { needs = true; };
  let root = new THREE.Group(); scene.add(root);
  let state = null, sel = null, picks = [], doorsAnim = [], openTarget = new Map(), openAmt = new Map(), selBox = null, first = true;

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
      led: new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffe29a', emissiveIntensity: 2 }), inner: stdMat('#efefec', { roughness: .8 }), black: stdMat('#1a1b1d', { roughness: .3, metalness: .4 }),
      mirror: new THREE.MeshStandardMaterial({ color: '#eef5f9', roughness: .06, metalness: .8, envMapIntensity: 2.4 }),
      glassClear: new THREE.MeshPhysicalMaterial({ color: '#cfe6f2', roughness: .04, metalness: 0, transparent: true, opacity: .32, envMapIntensity: 1, depthWrite: false }),
      alu: stdMat('#b8bec4', { roughness: .3, metalness: .85 }),
      glass: n => new THREE.MeshStandardMaterial({ color: (LACO[n] || LACO[0])[1], roughness: .12, metalness: .1, envMapIntensity: .9 })
    };
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: .22 });
    const box = (w, h, d, mat, x, y, z, meta, parent) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(.05, w), Math.max(.05, h), Math.max(.05, d)), mat); m.castShadow = m.receiveShadow = true;
      m.position.set(x + w / 2, y + h / 2, z + d / 2);
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeMat));
      if (meta) { m.userData.sel = meta; picks.push(m); }
      (parent || root).add(m); return m;
    };
    const cyl = (r, len, mat, x, y, z, axis, meta) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), mat); m.castShadow = true;
      if (axis === 'x') m.rotation.z = Math.PI / 2; else if (axis === 'z') m.rotation.x = Math.PI / 2;
      m.position.set(x, y, z); if (meta) { m.userData.sel = meta; picks.push(m); } root.add(m); return m;
    };
    const z0 = .3, bd = D - z0;
    // стены и пол помещения
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W + 400, D + 400), stdMat('#cdb48e', { roughness: .7 })); floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0, D / 2 + 100); floor.receiveShadow = true; root.add(floor);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(W + 400, 360), stdMat('#efe8dc', { roughness: .95 })); wall.position.set(W / 2, 180, -.4); root.add(wall);
    // корпус: секции (между проёмами), перегородки, антресоли — каждая отдельным блоком
    const selK = { k: 'global' }, n = g.cols.length;
    g.runs.forEach(r => {
      const rw = r.x1 - r.x0;
      box(t, H - ph, bd, M.body, r.x0, ph, z0, selK); box(t, H - ph, bd, M.body, r.x1 - t, ph, z0, selK);
      box(rw - 2 * t, t, bd, M.body, r.x0 + t, H - t, z0, selK); box(rw - 2 * t, t, bd, M.body, r.x0 + t, ph, z0, selK);
      box(rw, H - ph, .3, M.back, r.x0, ph, 0);
      box(rw - 2 * t, ph - .2, t, M.plinth, r.x0 + t, 0, D - 6);
    });
    g.bnd.forEach((b, k) => { if (!b.has || k === 0 || k === n) return; const L = g.cols[k - 1], R = g.cols[k]; if (L.gap || R.gap) return; box(t, g.y1 - g.y0, bd, M.body, b.x, g.y0, z0, { k: 'col', i: k - 1 }); });
    g.cols.forEach((c, i) => {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(c.w, g.y1 - g.y0), new THREE.MeshBasicMaterial({ visible: false })); pl.position.set(c.xa + c.w / 2, (g.y0 + g.y1) / 2, 1); pl.userData.sel = { k: 'col', i }; picks.push(pl); root.add(pl);
    });
    g.mz.forEach(m => {
      const meta = { k: 'mezz', i: m.mi }, mbd = bd;
      box(t, m.h, mbd, M.body, m.x0, m.yb, z0, meta); box(t, m.h, mbd, M.body, m.x1 - t, m.yb, z0, meta);
      box(m.w - 2 * t, t, mbd, M.body, m.x0 + t, m.yt - t, z0, meta); box(m.w - 2 * t, t, mbd, M.body, m.x0 + t, m.yb, z0, meta);
      box(m.w, m.h, .3, M.back, m.x0, m.yb, 0, meta);
      m.dv.forEach(off => box(t, m.h - 2 * t, mbd, M.body, m.ix0 + off, m.iy0, z0, meta));
      m.comp.forEach(c => { for (let k = 1; k <= (m.shelves | 0); k++) box(c.x1 - c.x0 - .2, t, D - 2.5, M.body, c.x0 + .1, m.iy0 + (m.iy1 - m.iy0) * k / ((m.shelves | 0) + 1), z0, meta); });
    });
    // наполнение
    S.cols.forEach((col, ci) => {
      const c = g.cols[ci]; if (col.gap) return;
      col.items.forEach(it => {
        const meta = { k: 'item', id: it.id, col: ci };
        if (it.type === 'shelf') box(c.w - .2, t, it.d || D - 2.5, M.body, c.xa + .1, it.y, z0, meta);
        else if (it.type === 'rod') {
          cyl(1.25, c.w - .6, M.chrome, c.xa + c.w / 2, it.y, D / 2, 'x', meta);
          [c.xa + .1, c.xb - 2.9].forEach(x => box(2.8, 3.4, 2.4, M.steel, x, it.y - 1.7, D / 2 - 1.2, meta));
        }
        else if (it.type === 'drawer') {
          const y = it.y, fh = it.fh, key = 'w' + it.id, dm = { k: 'item', id: it.id, col: ci, key }, grp = new THREE.Group(); root.add(grp);
          box(c.w - .4, fh - .3, t, M.body, c.xa + .2, y + .15, D - t, dm, grp);
          box(1.2, fh - 4, D - 12, M.steel, c.xa + 1.2, y + 1.5, 6, dm, grp); box(1.2, fh - 4, D - 12, M.steel, c.xb - 2.4, y + 1.5, 6, dm, grp);
          box(c.w - 4.8, fh - 4, 1.2, M.inner, c.xa + 2.4, y + 1.5, 6, dm, grp); box(c.w - 4.8, 1, D - 12, M.inner, c.xa + 2.4, y + 1.2, 6, dm, grp);
          if (S.doors.handles !== false) box(Math.min(14, c.w * .5), .8, 1.4, M.chrome, c.xa + c.w / 2 - Math.min(14, c.w * .5) / 2, y + fh - 4, D, dm, grp);
          doorsAnim.push({ key, apply: f => { grp.position.z = f * (D - 14) * .8; } });
        }
        else if (it.type === 'idoor') {
          const key = 'i' + it.id, dm = { k: 'item', id: it.id, col: ci, key }, iw = Math.min(it.w || (c.w - it.x), c.w - it.x), ih = it.y1 - it.y, x0 = c.xa + it.x, z = D - 1.2;
          const pv = new THREE.Group(); root.add(pv);
          if (it.dir === 'R') { pv.position.set(x0 + iw, it.y, z); box(iw - .2, ih - .2, 1.6, M.body, -iw + .1, .1, 0, dm, pv); box(.9, Math.min(20, ih * .3), 1.6, M.chrome, -iw + 3, ih / 2 - 10, 1.6, dm, pv); doorsAnim.push({ key, apply: f => { pv.rotation.y = 105 * DEG * f; } }); }
          else if (it.dir === 'U') { pv.position.set(x0, it.y + ih, z); box(iw - .2, ih - .2, 1.6, M.body, .1, -ih + .1, 0, dm, pv); box(Math.min(20, iw * .4), .9, 1.6, M.chrome, iw / 2 - Math.min(20, iw * .4) / 2, -ih + 3, 1.6, dm, pv); doorsAnim.push({ key, apply: f => { pv.rotation.x = -100 * DEG * f; } }); }
          else if (it.dir === 'D') { pv.position.set(x0, it.y, z); box(iw - .2, ih - .2, 1.6, M.body, .1, .1, 0, dm, pv); box(Math.min(20, iw * .4), .9, 1.6, M.chrome, iw / 2 - Math.min(20, iw * .4) / 2, ih - 4, 1.6, dm, pv); doorsAnim.push({ key, apply: f => { pv.rotation.x = 95 * DEG * f; } }); }
          else { pv.position.set(x0, it.y, z); box(iw - .2, ih - .2, 1.6, M.body, .1, .1, 0, dm, pv); box(.9, Math.min(20, ih * .3), 1.6, M.chrome, iw - 3.5, ih / 2 - 10, 1.6, dm, pv); doorsAnim.push({ key, apply: f => { pv.rotation.y = -105 * DEG * f; } }); }
        }
        else if (it.type === 'shoe') {
          for (let k = 0; k < it.n; k++) {
            const m = box(c.w - .2, t, D - 6, M.body, -(c.w - .2) / 2, -t / 2, -(D - 6) / 2, meta); root.remove(m);
            const gr = new THREE.Group(); gr.add(m); m.position.set(0, 0, 0); gr.position.set(c.xa + c.w / 2, it.y + k * 12 + 6, z0 + (D - 6) / 2); gr.rotation.x = 12 * DEG; root.add(gr);
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
        else if (it.type === 'led') box(c.w - 1, .6, 1.4, M.led, c.xa + .5, it.y, D - 6, meta);
        else if (it.type === 'vpanel') { const x = Math.max(c.xa + 1, Math.min(c.xb - t - 1, c.xa + it.x)); box(t, it.y1 - it.y, D - 2.5, M.body, x, it.y, z0, meta); }
      });
    });
    // отдельные панели: зеркало / стекло на стене или на фасаде
    (S.panels || []).forEach((p, pi) => {
      const meta = { k: 'panel', i: pi }, z = p.mount === 'front' ? D + 3.8 : .5, th = p.kind === 'dsp' ? 1.6 : .7;
      const mat = p.kind === 'dsp' ? M.body : (p.kind === 'glass' ? M.glassClear : (p.kind === 'laco' ? M.glass(S.doors.laco) : M.mirror));
      if (p.frame) { const f = Math.min(p.fw || 3, p.w / 2 - .5, p.h / 2 - .5); box(p.w - 2 * f, p.h - 2 * f, th, mat, p.x + f, p.y + f, z, meta); box(p.w, f, th + 1, M.alu, p.x, p.y, z, meta); box(p.w, f, th + 1, M.alu, p.x, p.y + p.h - f, z, meta); box(f, p.h - 2 * f, th + 1, M.alu, p.x, p.y + f, z, meta); box(f, p.h - 2 * f, th + 1, M.alu, p.x + p.w - f, p.y + f, z, meta); }
      else box(p.w, p.h, th, mat, p.x, p.y, z, meta);
    });
    // двери: основные (по секциям) и антресолей (каждая своими)
    const dl = doorList(S);
    dl.forEach(d => {
      const mz = d.zone === 'mezz', gl = d.fill === 'glass', mat = d.fill === 'dsp' ? M.body : (d.fill === 'laco' ? M.glass(S.doors.laco) : (gl ? M.glassClear : M.mirror)), th = d.fill === 'dsp' ? 1.6 : .8;
      const face = (par, dx, dy) => { if (!gl) { box(d.w, d.h, th, mat, dx, dy, 0, meta, par); return; } const f = Math.min(Math.max(1, S.doors.gf || 4), d.w / 2 - .6, d.h / 2 - .6); box(d.w - 2 * f, d.h - 2 * f, .5, M.glassClear, dx + f, dy + f, .5, meta, par); box(d.w, f, 1.8, M.alu, dx, dy, 0, meta, par); box(d.w, f, 1.8, M.alu, dx, dy + d.h - f, 0, meta, par); box(f, d.h - 2 * f, 1.8, M.alu, dx, dy + f, 0, meta, par); box(f, d.h - 2 * f, 1.8, M.alu, dx + d.w - f, dy + f, 0, meta, par); };
      const key = mz ? 'm' + d.mi + '.' + d.i : 'd' + d.i, meta = mz ? { k: 'mezz', i: d.mi, key } : { k: 'doors', key };
      if (d.sliding) {
        const layer = d.ri % 2, z = D + .4 + layer * 3.4, grp = new THREE.Group(); grp.position.set(d.x, 0, z); root.add(grp);
        face(grp, 0, d.y);
        if (d.fill !== 'dsp' && !gl) { box(d.w, 2.2, th + .4, M.steel, 0, d.y, -.2, null, grp); box(d.w, 2.2, th + .4, M.steel, 0, d.y + d.h - 2.2, -.2, null, grp); }
        doorsAnim.push({ key, apply: f => { grp.position.x = d.x + (layer === 1 ? (d.w - 2.5) * f * (d.left ? -1 : 1) : 0); } });
      } else {
        const hg = d.hinge || (d.left ? 'L' : 'R'), pv = new THREE.Group(); root.add(pv);
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
    sun.position.set(W / 2 - 220, g.totalH + 260, D + 340); sun.target.position.set(W / 2, H / 3, D / 2);
    const sc = sun.shadow.camera, sp = Math.max(W, g.totalH) * 1.1; sc.left = -sp; sc.right = sp; sc.top = sp; sc.bottom = -sp; sc.near = 10; sc.far = 1400; sc.updateProjectionMatrix();
    applyDoors(); highlight();
    if (first) { frame(); first = false; }
    invalidate();
  }
  function applyDoors() { doorsAnim.forEach(a => a.apply(ease(openAmt.get(a.key) || 0))); }
  function frame() {
    if (!state) return; const g = geom(state), W = g.W, H = g.totalH, dist = Math.max(W * 1.55, H * 1.75, 330);
    controls.target.set(W / 2, H * .46, state.D / 2); camera.position.set(W / 2 + dist * .28, H * .6, state.D / 2 + dist); controls.update(); invalidate();
  }
  function highlight() {
    if (selBox) { root.remove(selBox); selBox = null; }
    if (!sel || sel.k === 'global') return;
    root.updateMatrixWorld(true);
    const bb = new THREE.Box3(); let any = false;
    picks.forEach(m => { const s = m.userData.sel; if (!s || !m.geometry || m.geometry.type === 'PlaneGeometry') return; if ((sel.k === 'item' && s.k === 'item' && s.id === sel.id) || (sel.k === 'col' && s.k === 'col' && s.i === sel.i && false) || (sel.k === 'mezz' && s.k === 'mezz' && s.i === sel.i) || (sel.k === 'panel' && s.k === 'panel' && s.i === sel.i) || (sel.k === 'doors' && s.k === 'doors')) { bb.expandByObject(m); any = true; } });
    if (sel.k === 'col' && state) { const g = geom(state), c = g.cols[sel.i]; if (c) { bb.set(new THREE.Vector3(c.xa, g.y0, 0), new THREE.Vector3(c.xb, g.y1, state.D)); any = true; } }
    if (!any) return;
    const sz = bb.getSize(new THREE.Vector3()), ct = bb.getCenter(new THREE.Vector3()), geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(sz.x + 1, sz.y + 1, sz.z + 1));
    selBox = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#e0a21a' })); selBox.position.copy(ct); root.add(selBox);
  }

  /* ---- мышь: выбрать, потянуть предмет по вертикали и между отсеками ---- */
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), plane = new THREE.Plane(), hitP = new THREE.Vector3();
  let downAt = null, drag = null;
  const rayFrom = ev => { const r = renderer.domElement.getBoundingClientRect(); ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camera); };
  function hit(ev) { rayFrom(ev); const h = ray.intersectObjects(picks, false).find(x => x.object.userData.sel); return h ? { sel: h.object.userData.sel, p: h.point.clone() } : null; }
  renderer.domElement.addEventListener('pointerdown', e => {
    downAt = [e.clientX, e.clientY]; drag = null; if (viewOnly) return;
    const h = hit(e); if (!h) return;
    if (h.sel.k === 'item' || h.sel.k === 'mezz' || h.sel.k === 'panel') {
      if (hooks.onSelect) hooks.onSelect(h.sel);
      drag = { sel: h.sel, p0: h.p, moved: false }; controls.enabled = false; try { renderer.domElement.setPointerCapture(e.pointerId); } catch (er) {}
    }
  });
  renderer.domElement.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 5) return;
    drag.moved = true; rayFrom(e);
    plane.set(new THREE.Vector3(0, 0, 1), -drag.p0.z); if (!ray.ray.intersectPlane(plane, hitP)) return;
    const txt = hooks.onDrag && hooks.onDrag(drag.sel, hitP.y - drag.p0.y, hitP.x, hitP.x - drag.p0.x); setHud(txt || ''); invalidate();
  });
  const endDrag = () => { const d = drag; drag = null; controls.enabled = true; setHud(''); if (d && d.moved && hooks.onDragEnd) hooks.onDragEnd(); return !!(d && d.moved); };
  renderer.domElement.addEventListener('pointercancel', endDrag);
  renderer.domElement.addEventListener('pointerup', e => {
    if (endDrag()) return;
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
    const h = hit(e);
    if (viewOnly) { if (h && h.sel.key) toggleDoor(h.sel.key); return; }
    if (hooks.onSelect) hooks.onSelect(h ? h.sel : null);
  });
  renderer.domElement.addEventListener('dblclick', e => { const h = hit(e); if (h && h.sel.key) toggleDoor(h.sel.key); });
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
    setRotate, isRotate: () => rotateMode, toggleDoors, toggleDoor, isOpen: () => [...openTarget.values()].some(v => v > .5), frame, setHud,
    snapshot() { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); },
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); container.removeChild(renderer.domElement); }
  };
}
