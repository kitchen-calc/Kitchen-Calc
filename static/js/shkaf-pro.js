/* Конструктор шкафа PRO: интерфейс. Модель и расчёт — shkaf-pro-core.js, 3D — shkaf-pro-3d.js, чертежи мастера — shkaf-pro-draw.js */
import * as C from '/static/js/shkaf-pro-core.js?v=3';
const { BED_STYLES, BED_SIZES, BED_KINDS, BED_COLORS, mkBed, bedDims, UNIT_KINDS, mkUnit, PANEL_KINDS, MIRROR_KINDS, SLAT_PRESETS, MIRROR_SIZES, PANEL_PATTERNS, rpRectIn, roomPoly, wfoot, wardrobeRect, wardrobeMagnet, rpEdgeLen, levels, doorList, geom, ext, mkItem, mkMezz, mkPanel, presetP, freeY, warnings, buildParts, pricing, PALETTE, LACO, FILLS, ITEM_TYPES, ITEM_ICON, DRAWER_SYS, P, r1, clamp, fitWidth, recalcW, defState, encodeState, decodeState, sanitize } = C;

import { openRoomStart, openRoomEditor } from '/static/js/shkaf-room.js?v=2';
const VIEW = /^\/shkaf\/view\/?$/.test(location.pathname);
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/[  ]/g, ' ');
let USD = 11770;
fetch('/api/usd').then(r => r.json()).then(d => { if (d && d.rate > 5000) { USD = d.rate; renderPrice(); } }).catch(() => {});

let S = null, sel = { k: 'global' }, K = null, undo = [], redo = [], OWNER = false, holdT = null, holdI = null;
function load() {
  const m = location.hash.match(/^#p=([A-Za-z0-9_-]+)/);
  if (m) { const s = decodeState(m[1]); if (s) return s; }
  if (!VIEW) { try { const j = localStorage.getItem('kc_pro'); if (j) { const s = sanitize(JSON.parse(j)); if (s) return s; } } catch (e) {} }
  return defState();
}
function save() { try { localStorage.setItem('kc_pro', JSON.stringify(S)); } catch (e) {} }
const snap = () => JSON.stringify(S);
function pushUndo() { undo.push(snap()); if (undo.length > 60) undo.shift(); redo = []; }
function doUndo() { if (!undo.length) return; redo.push(snap()); S = sanitize(JSON.parse(undo.pop())); fixSel(); refresh(); }
function doRedo() { if (!redo.length) return; undo.push(snap()); S = sanitize(JSON.parse(redo.pop())); fixSel(); refresh(); }
function fixSel() { if (sel.k === 'item' && !findItem(sel.id)) sel = { k: 'global' }; if (sel.k === 'col' && sel.i >= S.cols.length) sel = { k: 'global' }; if (sel.k === 'mezz' && !S.mezzes[sel.mi]) sel = { k: 'global' }; if (sel.k === 'panel' && !S.panels[sel.pi]) sel = { k: 'global' }; if (sel.k === 'unit' && !S.units[sel.ui]) sel = { k: 'global' }; if (sel.k === 'bed' && !S.beds[sel.bi]) sel = { k: 'global' }; }
function mutate(fn, noUndo) { if (!noUndo) pushUndo(); fn(); recalcW(S); fixSel(); refresh(); }
function findItem(id) { for (let ci = 0; ci < S.cols.length; ci++) { const it = S.cols[ci].items.find(i => i.id === id); if (it) return { it, ci, col: S.cols[ci] }; } return null; }
const toast = (t) => { const e = $('toast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 2600); };

/* ---------- ввод чисел ---------- */
const RANGE = { W: [60, 800], H: [100, 320], D: [25, 90], plinth: [0, 20], 'mezz.h': [15, 90], 'mezz.n': [0, 8], 'mezz.shelves': [0, 3], 'doors.n': [1, 8], 'col.w': [15, 200], 'item.y': [0, 330], 'item.d': [15, 85], 'item.n': [1, 8], 'item.fh': [8, 40], 'item.h': [10, 40], 'item.y1': [0, 330], 'item.x': [0, 200], 'mz.x': [-100, 900], 'mz.w': [20, 900], 'mz.h': [15, 120], 'mz.y': [0, 340], 'mz.n': [0, 10], 'mz.shelves': [0, 3], 'doors.gf': [2, 30], 'pn.x': [-300, 1200], 'pn.y': [0, 340], 'pn.w': [10, 400], 'pn.h': [10, 340], 'pn.fw': [1, 15], 'item.w': [8, 250], 'col.dn': [0, 3], 'col.H': [60, 320], 'col.D': [25, 90], 'room.W': [100, 1500], 'room.D': [100, 1500], 'room.H': [180, 400], 'room.oz': [-500, 1500], 'room.rot': [-90, 450], 'room.ox': [-500, 1500], 'pn.sw': [10, 400], 'pn.sd': [6, 100], 'pn.sg': [0, 200], 'pn.pz': [0, 400], 'pn.gp': [3, 60], 'bd.x': [-800, 1800], 'bd.pz': [0, 500], 'bd.mw': [50, 220], 'bd.ml': [100, 240], 'bd.mt': [5, 40], 'bd.sh': [10, 60], 'bd.hh': [20, 220], 'bd.fh': [10, 220], 'bd.lg': [0, 40], 'bd.drw': [0, 4], 'bd.lv2': [80, 200], 'bd.rail': [10, 60], 'bd.steps': [3, 9], 'un.x': [-600, 1600], 'un.pz': [0, 400], 'un.w': [25, 300], 'un.h': [30, 200], 'un.d': [15, 80], 'un.n': [1, 8], 'un.legs': [0, 20] };
function stepper(label, path, val, step, unit) {
  return `<div class="r"><span>${esc(label)}</span><span class="stp"><button type="button" onpointerdown="PRO.hold(event,'${path}',${-step})">−</button><input type="number" step="any" value="${r1(val)}" onfocus="this.select()" onchange="PRO.set('${path}',this.value)"><button type="button" onpointerdown="PRO.hold(event,'${path}',${step})">+</button><small>${esc(unit || 'см')}</small></span></div>`;
}
function getVal(path) {
  if (path.startsWith('item.')) { const f = findItem(sel.id); return f ? f.it[path.slice(5)] : 0; }
  if (path.startsWith('mzd.')) { const m = S.mezzes[sel.mi]; return m && m.div ? m.div[+path.slice(4)] : 0; }
  if (path.startsWith('mzc.')) { const m = S.mezzes[sel.mi], ci = +path.slice(4); return m ? (m.cd && m.cd[ci] != null ? m.cd[ci] : geom(S).mz[sel.mi].comp.length ? Math.max(1, Math.round((geom(S).mz[sel.mi].comp[ci].x1 - geom(S).mz[sel.mi].comp[ci].x0) / 60)) : 1) : 0; }
  if (path.startsWith('mz.')) { const m = S.mezzes[sel.mi]; return m ? m[path.slice(3)] : 0; }
  if (path.startsWith('pn.')) { const p = S.panels[sel.pi]; return p ? p[path.slice(3)] : 0; }
  if (path.startsWith('un.')) { const u = S.units[sel.ui]; return u ? u[path.slice(3)] : 0; }
  if (path.startsWith('bd.')) { const b = S.beds[sel.bi]; return b ? b[path.slice(3)] : 0; }
  if (path.startsWith('room.')) return S.room[path.slice(5)];
  if (path === 'col.H' || path === 'col.D') { const c = S.cols[sel.i]; return c ? (c[path.slice(4)] || S[path.slice(4)]) : 0; }
  if (path === 'col.dn') { const c = S.cols[sel.i], g = geom(S); return c ? (c.dn != null ? c.dn : (c.w > 65 ? 2 : 1)) : 0; }
  if (path === 'col.w') return S.cols[sel.i] ? S.cols[sel.i].w : 0;
  if (path === 'W') return geom(S).W;
  return path.split('.').reduce((o, k) => o[k], S);
}
function setVal(path, v) {
  v = parseFloat(String(v).replace(',', '.')); if (!isFinite(v)) { refresh(); return; }
  const [a, b] = RANGE[path] || [0, 9999]; v = clamp(v, a, b);
  mutate(() => {
    if (path.startsWith('item.')) { const f = findItem(sel.id); if (!f) return; const key = path.slice(5); f.it[key] = ['n'].includes(key) ? Math.round(v) : r1(v); if (key === 'y1' && f.it.y1 <= f.it.y) f.it.y1 = f.it.y + 5; return; }
    if (path.startsWith('mzd.')) { const m = S.mezzes[sel.mi]; if (m && m.div) m.div[+path.slice(4)] = r1(clamp(v, 5, Math.max(5, m.w - 3 * S.t - 5))); return; }
    if (path.startsWith('mzc.')) { const m = S.mezzes[sel.mi]; if (m) { m.cd = m.cd || []; m.cd[+path.slice(4)] = Math.round(clamp(v, 0, 5)); } return; }
    if (path.startsWith('pn.')) { const p = S.panels[sel.pi]; if (p) p[path.slice(3)] = r1(v); return; }
    if (path.startsWith('bd.')) { const b = S.beds[sel.bi]; if (b) b[path.slice(3)] = ['drw', 'steps'].includes(path.slice(3)) ? Math.round(v) : r1(v); return; }
    if (path.startsWith('un.')) { const u = S.units[sel.ui]; if (u) u[path.slice(3)] = path === 'un.n' ? Math.round(v) : r1(v); return; }
    if (path.startsWith('mz.')) { const m = S.mezzes[sel.mi]; if (!m) return; const k = path.slice(3); m[k] = ['n', 'shelves'].includes(k) ? Math.round(v) : r1(v); return; }
    if (path === 'room.rot') { const c = S.room.rot || 0, f = wfoot(S), cx = (S.room.ox || 0) + f.w / 2, cz = (S.room.oz || 0) + f.d / 2; S.room.rot = (((Math.round(v / 90) * 90) % 360) + 360) % 360; const n = wfoot(S); S.room.ox = r1(cx - n.w / 2); S.room.oz = r1(cz - n.d / 2); return; }
    if (path.startsWith('room.')) { S.room[path.slice(5)] = r1(v); S.room.set = true; return; }
    if (path === 'col.H' || path === 'col.D') { S.cols[sel.i][path.slice(4)] = r1(v); return; }
    if (path === 'col.dn') { S.cols[sel.i].dn = Math.round(clamp(v, 0, 3)); return; }
    if (path === 'col.w') { S.cols[sel.i].w = r1(v); return; }
    if (path === 'W') { const g = geom(S), inner0 = g.W - (S.cols.length + 1) * S.t, inner1 = v - (S.cols.length + 1) * S.t; if (inner1 < S.cols.length * 15) return; const full = S.mezzes.filter(m => Math.abs(m.x) < .6 && Math.abs(m.w - g.W) < .6); S.cols.forEach(c => { c.w = r1(c.w * inner1 / inner0); }); const drift = r1(inner1 - S.cols.reduce((x, c) => x + c.w, 0)); S.cols[S.cols.length - 1].w = r1(S.cols[S.cols.length - 1].w + drift); recalcW(S); full.forEach(m => { m.w = S.W; }); return; }
    if (path === 'mezz.n' || path === 'mezz.shelves' || path === 'doors.n') v = Math.round(v);
    const ks = path.split('.'); let o = S; ks.slice(0, -1).forEach(k => { o = o[k]; }); o[ks[ks.length - 1]] = ks.length === 1 ? r1(v) : v;
  });
}
function nudge(path, d) { setVal(path, getVal(path) + d); }
function hold(ev, path, d) {
  ev.preventDefault(); clearHold(); const tg = ev.currentTarget; nudge(path, d);
  holdT = setTimeout(() => { holdI = setInterval(() => { if (!document.body.contains(tg)) { clearHold(); return; } nudge(path, d); }, 110); }, 380);
}
function clearHold() { clearTimeout(holdT); clearInterval(holdI); holdT = holdI = null; }
['pointerup', 'pointercancel', 'blur'].forEach(e => window.addEventListener(e, clearHold));

/* ---------- действия ---------- */
function addItem(type) {
  const ci = sel.k === 'col' ? sel.i : (sel.k === 'item' ? findItem(sel.id).ci : 0), col = S.cols[ci], g = geom(S);
  let y, it;
  if (type === 'drawer' || type === 'shoe' || type === 'pant' || type === 'basket') {
    const h = { drawer: 18, shoe: 36, pant: 10, basket: 18 }[type]; y = freeY(S, col, h);
    if (y == null) { toast('В отсеке нет свободного места для этого элемента'); return; }
  } else if (type === 'rod') y = r1(g.cols[ci].y1 - 14);
  else if (type === 'vpanel' || type === 'idoor') y = g.y0;
  else y = r1((g.y0 + g.cols[ci].y1) / 2);
  mutate(() => { it = mkItem(type, y); if (type === 'vpanel') { it.y1 = r1(g.cols[ci].y1); it.x = r1(col.w / 2); } if (type === 'idoor') { it.y1 = r1(g.cols[ci].y1); it.x = 0; it.w = null; } col.items.push(it); sel = { k: 'item', id: it.id, col: ci }; });
}
function delItem() { const f = findItem(sel.id); if (!f) return; mutate(() => { f.col.items = f.col.items.filter(i => i !== f.it); sel = { k: 'col', i: f.ci }; }); }
function dupItem() { const f = findItem(sel.id); if (!f) return; mutate(() => { const c = JSON.parse(JSON.stringify(f.it)); c.id = C.uid(); c.y = r1(c.y + (ext(f.it, S)[1] - ext(f.it, S)[0]) + 2); if (c.y1 != null) c.y1 = r1(c.y1 + 2); f.col.items.push(c); sel = { k: 'item', id: c.id, col: f.ci }; }); }
function moveItemCol(d) { const f = findItem(sel.id); if (!f) return; const nc = f.ci + d; if (nc < 0 || nc >= S.cols.length) return; mutate(() => { f.col.items = f.col.items.filter(i => i !== f.it); S.cols[nc].items.push(f.it); sel = { k: 'item', id: f.it.id, col: nc }; }); }
function addGap() { mutate(() => { S.cols.push({ id: C.uid(), w: 80, gap: true, items: [] }); sel = { k: 'col', i: S.cols.length - 1 }; }); }
function toggleGap(i) { mutate(() => { const c = S.cols[i]; c.gap = !c.gap; if (c.gap) c.items = []; else c.items = [mkItem('shelf', 70), mkItem('shelf', 140)]; }); }
function addBed(kind) { const g = geom(S); mutate(() => { const b = mkBed(g.W + 20, kind); S.beds.push(b); sel = { k: 'bed', bi: S.beds.length - 1 }; }); if (K) K.frame(); }
function bedPatch(fn) { mutate(() => { const b = S.beds[sel.bi]; if (b) fn(b); }); }
function addUnit() { const g = geom(S); mutate(() => { const u = mkUnit(g.W + 8, 80); S.units.push(u); sel = { k: 'unit', ui: S.units.length - 1 }; }); if (K) K.frame(); }
function delUnit() { mutate(() => { S.units.splice(sel.ui, 1); sel = { k: 'global' }; }); }
function dupUnit() { mutate(() => { const u = Object.assign({}, S.units[sel.ui], { id: C.uid(), x: r1(S.units[sel.ui].x + S.units[sel.ui].w + 3) }); S.units.push(u); sel = { k: 'unit', ui: S.units.length - 1 }; }); }
function unitMove(dx) { mutate(() => { const u = S.units[sel.ui]; u.x = r1(u.x + dx); }); }
function selectUnit(i) { sel = { k: 'unit', ui: i }; refresh(false); }
function addPanel(kind) { const g = geom(S); mutate(() => { const p = mkPanel(g.W + 10, 20, 60, Math.min(180, S.H - 20)); if (kind === 'mdf' || kind === 'slats') { p.kind = kind; p.w = kind === 'slats' ? 100 : 80; p.h = 220; if (kind === 'slats') p.mount = 'free'; } S.panels.push(p); sel = { k: 'panel', pi: S.panels.length - 1 }; }); }
function delPanel() { mutate(() => { S.panels.splice(sel.pi, 1); sel = { k: 'global' }; }); }
function dupPanel() { mutate(() => { const p = Object.assign({}, S.panels[sel.pi], { id: C.uid(), x: r1(S.panels[sel.pi].x + S.panels[sel.pi].w + 5) }); S.panels.push(p); sel = { k: 'panel', pi: S.panels.length - 1 }; }); }
function panelMove(dx, dy) { mutate(() => { const p = S.panels[sel.pi]; p.x = r1(p.x + dx); p.y = r1(Math.max(0, p.y + dy)); }); }
function panelOverDoors() { mutate(() => { const p = S.panels[sel.pi], g = geom(S); p.mount = 'front'; p.x = 0; p.w = g.W; p.y = S.plinth; p.h = S.H - S.plinth; }); }
function selectPanel(i) { sel = { k: 'panel', pi: i }; refresh(false); }
function addMezz() { const g = geom(S); mutate(() => { const m = mkMezz(0, g.W, g.totalH); S.mezzes.push(m); sel = { k: 'mezz', mi: S.mezzes.length - 1 }; }); }
function delMezz() { mutate(() => { S.mezzes.splice(sel.mi, 1); sel = { k: 'global' }; }); }
function dupMezz() { mutate(() => { const m = Object.assign({}, S.mezzes[sel.mi], { id: C.uid(), y: r1(S.mezzes[sel.mi].y + S.mezzes[sel.mi].h) }); S.mezzes.push(m); sel = { k: 'mezz', mi: S.mezzes.length - 1 }; }); }
function mezzFull() { mutate(() => { const m = S.mezzes[sel.mi]; m.x = 0; m.w = geom(S).W; m.n = Math.max(1, Math.round(m.w / 60)); }); }
function mezzOver(i) { mutate(() => { const m = S.mezzes[sel.mi], c = geom(S).cols[i]; m.x = r1(c.xa - S.t); m.w = r1(c.w + 2 * S.t); m.y = c.H; m.n = Math.max(1, Math.round(m.w / 60)); }); }
function mezzMove(dx, dy) { mutate(() => { const m = S.mezzes[sel.mi]; m.x = r1(m.x + dx); m.y = r1(Math.max(0, m.y + dy)); }); }
function selectMezz(i) { sel = { k: 'mezz', mi: i }; refresh(false); }
function loadTemplate(kind) { if (!confirm('Заменить текущий проект шаблоном?')) return; mutate(() => { S = kind === 'P' ? presetP() : defState(); sel = { k: 'global' }; }); if (K) K.frame(); }
function addCol(side) { mutate(() => { const w = r1(S.cols.length ? Math.min(80, S.cols[S.cols.length - 1].w) : 80); const at = sel.k === 'col' && side ? sel.i + (side > 0 ? 1 : 0) : S.cols.length; S.cols.splice(at, 0, { id: C.uid(), w, items: [mkItem('shelf', 70), mkItem('shelf', 140)] }); sel = { k: 'col', i: at }; }); }
function dupCol(i) { mutate(() => { const c = JSON.parse(JSON.stringify(S.cols[i])); c.id = C.uid(); c.items.forEach(it => { it.id = C.uid(); }); S.cols.splice(i + 1, 0, c); sel = { k: 'col', i: i + 1 }; }); }
function delCol(i) { mutate(() => { S.cols.splice(i, 1); sel = { k: 'global' }; }); }
function moveCol(i, d) { const j = i + d; if (j < 0 || j >= S.cols.length) return; mutate(() => { const t = S.cols[i]; S.cols[i] = S.cols[j]; S.cols[j] = t; sel = { k: 'col', i: j }; }); }
function eqCols() { if (!S.cols.length) return; mutate(() => { const g = geom(S), inner = g.W - (S.cols.length + 1) * S.t, w = r1(inner / S.cols.length); S.cols.forEach(c => { c.w = w; }); S.cols[S.cols.length - 1].w = r1(inner - w * (S.cols.length - 1)); }); }
function evenShelves(n) {
  n = Math.max(0, Math.min(12, Math.round(parseFloat(n) || 0))); const ci = sel.k === 'col' ? sel.i : findItem(sel.id).ci, col = S.cols[ci], g = geom(S);
  mutate(() => { col.items = col.items.filter(i => i.type !== 'shelf'); for (let k = 1; k <= n; k++) col.items.push(mkItem('shelf', g.y0 + (g.y1 - g.y0 - S.t) * k / (n + 1))); });
}
function setColor(i) { mutate(() => { S.color = i; S.custom = null; }); }
function setCustom(h) { mutate(() => { S.custom = /^#[0-9a-f]{6}$/i.test(h) ? h : null; }); }
const setDoors = k => mutate(() => { S.doors.kind = k; });
const setFill = (i, v) => mutate(() => { S.doors.fills[i] = v; });
function selectCol(i) { sel = { k: 'col', i }; refresh(false); }
function selectItem(id) { const f = findItem(id); if (!f) return; sel = { k: 'item', id, col: f.ci }; refresh(false); }
function selectGlobal() { sel = { k: 'global' }; refresh(false); }

/* ---------- панель ---------- */
function selMeta() { return sel.k === 'item' ? { k: 'item', id: sel.id } : (sel.k === 'col' ? { k: 'col', i: sel.i } : (sel.k === 'mezz' ? { k: 'mezz', i: sel.mi } : (sel.k === 'bed' ? { k: 'bed', i: sel.bi } : (sel.k === 'unit' ? { k: 'unit', i: sel.ui } : (sel.k === 'panel' ? { k: 'panel', i: sel.pi } : (sel.k === 'doors' ? { k: 'doors' } : { k: 'global' })))))); }
const btn = (on, act, txt, cls) => `<button type="button" class="${on ? 'on ' : ''}${cls || ''}" onclick="${act}">${txt}</button>`;
function sideGlobal() {
  const g = geom(S), T = P.tiers;
  let h = `<div class="sh">${esc(S.name)}</div><div class="note">Нажмите на отсек или предмет в 3D, предметы можно тащить вверх-вниз и в соседний отсек. Камера: галочка «Вращать» вверху — вращать, без галочки — двигать картинку (мышь: правая кнопка или Shift+ЛКМ — двигать, колесо — приблизить).</div>`;
  { const rp = roomPoly(S), custom = !!S.room.poly;
    h += `<div class="sub">Комната</div>`;
    if (custom) h += `<div class="cols">${rp.map((p, i) => `<button type="button" class="colchip" onclick="PRO.room()">Стена ${i + 1}<b>${Math.round(rpEdgeLen(rp, i))}</b></button>`).join('')}</div>`;
    else h += stepper('Ширина стены', 'room.W', S.room.W, 5) + stepper('Глубина комнаты', 'room.D', S.room.D, 5);
    h += stepper('Высота потолка', 'room.H', S.room.H, 5) + `<div class="r">${btn(0, 'PRO.room()', '✏️ Нарисовать комнату (Г, П и др.)')}</div>`;
    h += `<div class="sub">Где стоит шкаф</div><div class="note">Потяните шкаф мышью (за отсек, который не выбран) — он поедет по полу. Магнит прижимает его задней стенкой к стене и разворачивает лицом в комнату.</div>`;
    h += `<div class="r">${btn(S.room.mag, 'PRO.magnet()', '🧲 Магнит к стенам: ' + (S.room.mag ? 'вкл' : 'выкл'))}${btn(0, 'PRO.rotW(-90)', '↺ 90°')}${btn(0, 'PRO.rotW(90)', '↻ 90°')}</div>`;
    h += stepper('Шкаф: от левой стены, см', 'room.ox', S.room.ox, 5) + stepper('Шкаф: от дальней стены, см', 'room.oz', S.room.oz || 0, 5) + stepper('Поворот шкафа, °', 'room.rot', S.room.rot || 0, 90) + `<div class="r">${btn(0, 'PRO.centerWall()', 'По центру стены')}${btn(0, 'PRO.leftWall()', 'К левому углу')}${btn(0, 'PRO.rightWall()', 'К правому углу')}</div>`; }
  h += `<div class="sub">Размеры шкафа</div>` + stepper('Ширина', 'W', g.W, 1) + stepper('Высота корпуса', 'H', S.H, 1) + stepper('Глубина', 'D', S.D, 1) + stepper('Цоколь', 'plinth', S.plinth, 1);
  h += `<div class="r"><span>ЛДСП</span>${btn(S.t === 1.6, 'PRO.t(1.6)', '16 мм')}${btn(S.t === 1.8, 'PRO.t(1.8)', '18 мм')}</div>`;
  h += `<div class="sub">Цвет корпуса</div><div class="sw">${PALETTE.map((c, i) => `<button type="button" class="swb ${!S.custom && S.color === i ? 'on' : ''}" style="background:${c[1]}" title="${c[0]}" onclick="PRO.color(${i})"></button>`).join('')}<input type="color" value="${S.custom || '#cdbba0'}" onchange="PRO.custom(this.value)" title="свой цвет"></div>`;
  h += `<div class="r"><span>Класс</span>${T.map((t, i) => btn(S.tier === i, `PRO.tier(${i})`, t.ru)).join('')}</div>`;
  h += `<div class="sub">Отсеки (${S.cols.length})</div><div class="cols">${S.cols.map((c, i) => `<button type="button" class="colchip" onclick="PRO.selCol(${i})"><span class="chx" title="Удалить" onclick="event.stopPropagation(); PRO.delCol(${i})">✕</span>${c.gap ? 'проём' : '№' + (i + 1)}<b>${Math.round(c.w * 10)}</b><small>${c.gap ? '—' : c.items.length + ' поз.'}</small></button>`).join('')}</div>`;
  h += `<div class="r">${btn(0, 'PRO.addCol()', '＋ Отсек (шкаф)')}${btn(0, 'PRO.eqCols()', 'Выровнять ширину')}</div>`;
  const gm = geom(S);
  h += `<div class="sub">Антресоли (${S.mezzes.length}) — отдельные блоки</div><div class="cols">${S.mezzes.map((m, i) => `<button type="button" class="colchip" onclick="PRO.selMezz(${i})"><span class="chx" title="Удалить" onclick="event.stopPropagation(); PRO.delMezzAt(${i})">✕</span>А${i + 1}<b>${Math.round(m.w * 10)}</b><small>y ${Math.round(m.y * 10)}</small></button>`).join('')}</div>`;
  h += `<div class="r">${btn(0, 'PRO.addMezz()', '＋ Антресоль')}${btn(0, 'PRO.addGap()', '＋ Проём между отсеками')}</div><div class="note">Антресоль — отдельная коробка: её можно двигать вбок и вверх независимо от низа, поставить над проёмом (П-образный шкаф).</div>`;
  h += `<div class="sub">Зеркала и стеклянные панели (${S.panels.length})</div><div class="cols">${S.panels.map((p, i) => `<button type="button" class="colchip" onclick="PRO.selPanel(${i})"><span class="chx" title="Удалить" onclick="event.stopPropagation(); PRO.delPanelAt(${i})">✕</span>П${i + 1}<b>${Math.round(p.w * 10)}×${Math.round(p.h * 10)}</b><small>${FILLS[p.kind]}</small></button>`).join('')}</div><div class="r">${btn(0, 'PRO.addPanel()', '＋ Панель (зеркало)')}</div><div class="note">Отдельная панель: зеркало, стекло, лакобель или ЛДСП. На стену рядом со шкафом или на фасад поверх дверей; размер и место — любые.</div>`;
  h += `<div class="sub">Кровати (${S.beds.length})</div><div class="cols">${S.beds.map((b, i) => `<button type="button" class="colchip" onclick="PRO.selBed(${i})"><span class="chx" title="Удалить" onclick="event.stopPropagation(); PRO.delBedAt(${i})">✕</span>К${i + 1}<b>${Math.round(b.mw * 10)}</b><small>${b.kind === 'bunk' ? '2 яруса' : 'кровать'}</small></button>`).join('')}</div><div class="r">${btn(0, "PRO.addBed('single')", '＋ Кровать')}${btn(0, "PRO.addBed('bunk')", '＋ Двухъярусная детская')}</div>`;
  h += `<div class="sub">Тумбы-обувницы (${S.units.length})</div><div class="cols">${S.units.map((u, i) => `<button type="button" class="colchip" onclick="PRO.selUnit(${i})"><span class="chx" title="Удалить" onclick="event.stopPropagation(); PRO.delUnitAt(${i})">✕</span>Т${i + 1}<b>${Math.round(u.w * 10)}</b><small>${UNIT_KINDS[u.kind].split(' ')[0]}</small></button>`).join('')}</div><div class="r">${btn(0, 'PRO.addUnit()', '＋ Тумба-обувница')}</div><div class="note">Отдельная низкая тумба: откидные створки, двери или ящики. Двигайте мышью вдоль стены, размеры любые.</div>`;
  h += `<div class="sub">Шаблоны</div><div class="r">${btn(0, "PRO.tpl('S')", 'Прямой шкаф')}${btn(0, "PRO.tpl('P')", 'П-образный')}</div>`;
  h += `<div class="sub">Двери</div><div class="r">${btn(S.doors.kind === 'none', "PRO.doors('none')", 'Без дверей')}${btn(S.doors.kind === 'swing', "PRO.doors('swing')", 'Распашные')}${btn(S.doors.kind === 'sliding', "PRO.doors('sliding')", 'Купе')}</div>`;
  if (S.doors.kind !== 'none') {
    if (S.doors.kind === 'swing') h += `<div class="note">Распашные двери настраиваются в каждом отсеке отдельно: нажмите на отсек в 3D. Новый отсек — кнопка «＋ Отсек».</div><div class="r"><span>Все двери</span>${['dsp', 'glass', 'mirror', 'laco'].map(k => btn(0, `PRO.allDf('${k}')`, FILLS[k].split(' ')[0])).join('')}</div>`;
    if (S.doors.kind === 'sliding') h += stepper('Количество', 'doors.n', S.doors.n, 1, 'шт');
    if (S.doors.kind === 'sliding') for (let i = 0; i < S.doors.n; i++) h += `<div class="r"><span>Дверь ${i + 1}</span><select onchange="PRO.fill(${i},this.value)">${Object.keys(FILLS).map(k => `<option value="${k}" ${S.doors.fills[i] === k ? 'selected' : ''}>${FILLS[k]}</option>`).join('')}</select>${S.doors.kind === 'swing' ? `<select onchange="PRO.ddir(${i},this.value)" title="Как открывается">${[['auto', 'открывание: авто'], ['L', '◀ влево'], ['R', 'вправо ▶'], ['U', '▲ вверх'], ['D', '▼ вниз']].map(([k, t]) => `<option value="${k}" ${((S.doors.dir && S.doors.dir[i]) || 'auto') === k ? 'selected' : ''}>${t}</option>`).join('')}</select>` : ''}</div>`;
    if (S.cols.some(c => c.df === 'glass') || (S.doors.kind === 'sliding' && S.doors.fills.slice(0, S.doors.n).includes('glass'))) { const gd = doorList(S).find(d => d.fill === 'glass' && d.zone === 'main'); h += stepper('Рамка вокруг стекла', 'doors.gf', S.doors.gf || 4, 1) + `<div class="note">Меньше рамка — больше стекло.${gd ? ' Стекло одной двери: ' + mm(gd.w - 2 * (S.doors.gf || 4)) + '×' + mm(gd.h - 2 * (S.doors.gf || 4)) + ' мм.' : ''}</div>`; }
    if (S.cols.some(c => c.df === 'laco') || S.doors.fills.slice(0, S.doors.n).includes('laco')) h += `<div class="r"><span>Лакобель</span><div class="sw">${LACO.map((c, i) => `<button type="button" class="swb ${S.doors.laco === i ? 'on' : ''}" style="background:${c[1]}" title="${c[0]}" onclick="PRO.laco(${i})"></button>`).join('')}</div></div>`;
    h += `<div class="r">${btn(S.doors.handles !== false, 'PRO.handles()', 'Ручки')}${btn(0, 'PRO.openAll(true)', '↔ Открыть всё')}${btn(0, 'PRO.openAll(false)', 'Закрыть')}</div><div class="note">Двойной щелчок по двери в 3D открывает её отдельно.</div>`;
  }
  h += `<div class="sub">Свет</div><div class="r">${btn(S.led, 'PRO.led()', '💡 Общая подсветка')}</div>`;
  h += `<div class="sub">Название</div><div class="r"><input type="text" class="nm" value="${esc(S.name)}" onchange="PRO.name(this.value)"></div>`;
  return h;
}
function addButtons() { return `<div class="grid2">${Object.keys(ITEM_TYPES).map(t => `<button type="button" onclick="PRO.add('${t}')">${ITEM_ICON[t]} ${ITEM_TYPES[t]}</button>`).join('')}</div>`; }
function sideCol() {
  const i = sel.i, c = S.cols[i], g = geom(S), items = c.items.slice().sort((a, b) => ext(b, S)[0] - ext(a, S)[0]);
  if (c.gap) return `<div class="sh">Проём ${i + 1}</div><div class="note">Пустое место без стенок: проход, стол, техника. Антресоль может проходить над ним.</div>` + stepper('Ширина', 'col.w', c.w, 1) + `<div class="r">${btn(0, `PRO.moveCol(${i},-1)`, '◀')}${btn(0, `PRO.moveCol(${i},1)`, '▶')}${btn(0, `PRO.toggleGap(${i})`, 'Сделать отсеком')}${btn(0, `PRO.delCol(${i})`, 'Удалить')}${btn(0, 'PRO.global()', '✕ Весь шкаф')}</div>`;
  let h = `<div class="sh">Отсек ${i + 1}</div>` + stepper('Ширина', 'col.w', c.w, 1) + stepper('Высота (от пола)', 'col.H', c.H || S.H, 1) + stepper('Глубина', 'col.D', c.D || S.D, 1) + ((c.H || c.D) ? `<div class="r">${btn(0, `PRO.colReset(${i})`, 'Размеры как у всего шкафа')}</div>` : '');
  h += `<div class="r">${btn(0, `PRO.moveCol(${i},-1)`, '◀')}${btn(0, `PRO.moveCol(${i},1)`, '▶')}${btn(0, `PRO.addCol(-1)`, '＋ слева')}${btn(0, `PRO.addCol(1)`, '＋ справа')}${btn(0, `PRO.addGapAt(-1)`, '＋ проём слева')}${btn(0, `PRO.addGapAt(1)`, '＋ проём справа')}${btn(0, `PRO.dupCol(${i})`, 'Копия')}${btn(0, `PRO.toggleGap(${i})`, 'Сделать проёмом')}${btn(0, `PRO.delCol(${i})`, 'Удалить')}${btn(0, 'PRO.global()', '✕ Весь шкаф')}</div>`;
  if (S.doors.kind === 'swing') {
    const nn = c.dn != null ? c.dn : (c.w > 65 ? 2 : 1), dr = c.dd || 'auto';
    h += `<div class="sub">Двери этого отсека</div><div class="r"><span>Дверей</span>${[0, 1, 2, 3].map(k => btn(nn === k, `PRO.set('col.dn',${k})`, k === 0 ? 'Нет' : String(k))).join('')}</div>`;
    if (nn > 0) h += `<div class="r"><span>Материал</span><select onchange="PRO.cdf(this.value)">${Object.keys(FILLS).map(k => `<option value="${k}" ${(c.df || 'dsp') === k ? 'selected' : ''}>${FILLS[k]}</option>`).join('')}</select></div><div class="r"><span>Открывание</span>${[['auto', 'авто'], ['L', '◀ влево'], ['R', 'вправо ▶'], ['U', '▲ вверх'], ['D', '▼ вниз']].map(([k, t]) => btn(dr === k, `PRO.cdd('${k}')`, t)).join('')}</div><div class="note">Двойной щелчок по двери в 3D открывает её. Двери удаляются вместе с отсеком или кнопкой «Нет».</div>`;
  } else h += `<div class="r">${btn(0, "PRO.doors('swing')", '🚪 Включить двери по отсекам')}</div>`;
  h += `<div class="sub">Добавить в отсек</div>` + addButtons();
  h += `<div class="r"><span>Полки поровну</span><input type="number" min="0" max="12" value="${c.items.filter(x => x.type === 'shelf').length}" onchange="PRO.even(this.value)" style="width:56px"><small>шт</small></div>`;
  h += `<div class="sub">Содержимое (сверху вниз)</div><div class="ilist">${items.map(it => `<button type="button" class="iit" onclick="PRO.selItem('${it.id}')">${ITEM_ICON[it.type]} ${ITEM_TYPES[it.type]}<b>${Math.round(ext(it, S)[0] * 10)} мм</b></button>`).join('') || '<div class="note">Пусто — добавьте полки, штангу, ящики…</div>'}</div>`;
  return h;
}
function sideItem() {
  const f = findItem(sel.id); if (!f) return sideGlobal();
  const it = f.it, [a, b] = ext(it, S), g = geom(S), T = ITEM_TYPES[it.type];
  let h = `<div class="sh">${ITEM_ICON[it.type]} ${T}</div><div class="note">Отсек ${f.ci + 1} · от пола ${mm(a)} — ${mm(b)} мм</div>`;
  h += stepper(it.type === 'rod' ? 'Высота оси от пола' : 'Высота от пола (низ)', 'item.y', it.y, 1);
  h += `<div class="r"><span>Шаг</span>${btn(0, "PRO.nu('item.y',-10)", '−10')}${btn(0, "PRO.nu('item.y',-1)", '−1')}${btn(0, "PRO.nu('item.y',1)", '+1')}${btn(0, "PRO.nu('item.y',10)", '+10')}</div>`;
  if (it.type === 'shelf') h += stepper('Глубина полки', 'item.d', it.d || S.D - 2.5, 1);
  if (it.type === 'drawer') { h += stepper('Высота фасада', 'item.fh', it.fh, 1) + `<div class="r">${btn(0, 'PRO.drawerAbove()', '＋ Ещё ящик над этим')}${btn(0, 'PRO.drawerBelow()', '＋ ниже')}</div><div class="note">Ящики добавляются по одному: у каждого своя высота. Двойной щелчок по ящику — выдвинуть.</div>`; h += `<div class="r"><span>Система</span><select onchange="PRO.sys(this.value)">${Object.keys(DRAWER_SYS).map(k => `<option value="${k}" ${it.sys === k ? 'selected' : ''}>${DRAWER_SYS[k].ru}</option>`).join('')}</select></div>`; }
  if (it.type === 'shoe') h += stepper('Полок', 'item.n', it.n, 1, 'шт');
  if (it.type === 'basket') h += stepper('Высота корзины', 'item.h', it.h, 1);
  if (it.type === 'vpanel') h += betweenHtml(f.col, it) + stepper('Низ панели', 'item.y', it.y, 1) + stepper('Верх панели', 'item.y1', it.y1, 1) + stepper('От левого края отсека', 'item.x', it.x, 1) + `<div class="r">${btn(0, 'PRO.vpCenter()', 'По центру отсека')}</div><div class="note">Панель делит отсек на две части. Рядом с ней можно поставить «Дверцу в отсеке».</div>`;
  if (it.type === 'idoor') h += betweenHtml(f.col, it) + stepper('Верх дверцы', 'item.y1', it.y1, 1) + stepper('От левого края отсека', 'item.x', it.x, 1) + stepper('Ширина дверцы (0 — до края)', 'item.w', it.w || 0, 1) + `<div class="r"><span>Открывание</span>${[['L', '◀ влево'], ['R', 'вправо ▶'], ['U', '▲ вверх'], ['D', '▼ вниз']].map(([k, t]) => btn(it.dir === k, `PRO.idoorDir('${k}')`, t)).join('')}</div>`;
  h += `<div class="r">${btn(0, 'PRO.moveItemCol(-1)', '◀ в левый отсек')}${btn(0, 'PRO.moveItemCol(1)', 'в правый ▶')}</div>`;
  h += `<div class="r">${btn(0, 'PRO.dupItem()', 'Копия')}${btn(0, 'PRO.delItem()', 'Удалить')}${btn(0, `PRO.selCol(${f.ci})`, '✕ К отсеку')}</div>`;
  return h;
}
const mm = v => Math.round(v * 10);
// «между какими полками»: выбор нижнего и верхнего уровня для панели / дверцы
function betweenHtml(col, it) {
  const L = levels(S, col), near = (v, key) => { let bi = 0, bd = 1e9; L.forEach((l, i) => { const d = Math.abs(l[key] - v); if (d < bd) { bd = d; bi = i; } }); return bi; };
  const a = near(it.y, 'top'), b = near(it.y1, 'bot');
  const opt = (sel) => L.map((l, i) => `<option value="${i}" ${sel === i ? 'selected' : ''}>${esc(l.label)}</option>`).join('');
  return `<div class="r"><span>Между полками</span></div><div class="r"><span>от</span><select onchange="PRO.between(this.value, ${b})">${opt(a)}</select></div><div class="r"><span>до</span><select onchange="PRO.between(${a}, this.value)">${opt(b)}</select></div>`;
}
function sideMezz() {
  const m = S.mezzes[sel.mi]; if (!m) return sideGlobal(); const g = geom(S);
  let h = `<div class="sh">Антресоль ${sel.mi + 1}</div><div class="note">Отдельная коробка. Тащите её в 3D вбок и вверх или задайте цифрами.</div>`;
  h += `<div class="r"><span>Двери</span><select onchange="PRO.mfill(this.value)">${Object.keys(FILLS).map(k => `<option value="${k}" ${(m.fill || 'dsp') === k ? 'selected' : ''}>${FILLS[k]}</option>`).join('')}</select></div>`;
  if ((m.fill || 'dsp') === 'glass') h += stepper('Рамка вокруг стекла', 'doors.gf', S.doors.gf || 4, 1);
  h += stepper('От левого края', 'mz.x', m.x, 1) + stepper('Ширина', 'mz.w', m.w, 1) + stepper('Высота', 'mz.h', m.h, 1) + stepper('Низ от пола', 'mz.y', m.y, 1) + stepper('Дверок', 'mz.n', m.n, 1, 'шт') + stepper('Полок', 'mz.shelves', m.shelves, 1, 'шт');
  h += `<div class="r"><span>Сдвиг</span>${btn(0, 'PRO.mezzMove(-10,0)', '◀ 10')}${btn(0, 'PRO.mezzMove(-1,0)', '◀ 1')}${btn(0, 'PRO.mezzMove(1,0)', '1 ▶')}${btn(0, 'PRO.mezzMove(10,0)', '10 ▶')}</div>`;
  h += `<div class="r"><span>Высота</span>${btn(0, 'PRO.mezzMove(0,-10)', '▼ 10')}${btn(0, 'PRO.mezzMove(0,-1)', '▼ 1')}${btn(0, 'PRO.mezzMove(0,1)', '▲ 1')}${btn(0, 'PRO.mezzMove(0,10)', '▲ 10')}</div>`;
  const gz = g.mz[sel.mi];
  h += `<div class="sub">Перегородки антресоли (${(m.div || []).length})</div><div class="r">${btn(0, 'PRO.addDiv()', '＋ Перегородка')}${btn(0, 'PRO.eqDiv(2)', 'Поровну на 2')}${btn(0, 'PRO.eqDiv(3)', 'на 3')}${(m.div || []).length ? btn(0, 'PRO.eqDiv(1)', 'Убрать все') : ''}</div>`;
  (m.div || []).forEach((v, i) => { h += stepper('Перегородка ' + (i + 1) + ' (от левой стенки)', 'mzd.' + i, v, 1) + `<div class="r">${btn(0, `PRO.delDiv(${i})`, 'Удалить эту перегородку')}</div>`; });
  h += `<div class="sub">Двери по отсекам антресоли</div>`;
  gz.comp.forEach((c, ci) => { const mode = (m.dir && m.dir[ci]) || 'swing'; h += `<div class="r"><span>Отсек ${ci + 1} · ${mm(c.x1 - c.x0)} мм</span></div>` + stepper('Дверей (0 — открытый)', 'mzc.' + ci, getVal('mzc.' + ci), 1, 'шт') + `<div class="r"><span>Открывание</span>${[['swing', 'в бока'], ['U', '▲ вверх'], ['D', '▼ вниз']].map(([k, t]) => btn(mode === k, `PRO.mdir(${ci},'${k}')`, t)).join('')}</div>`; });
  h += `<div class="sub">Быстро поставить</div><div class="r">${btn(0, 'PRO.mezzFull()', '↔ На всю ширину')}${g.cols.map((c, i) => btn(0, `PRO.mezzOver(${i})`, (c.gap ? 'над проёмом ' : 'над отсеком ') + (i + 1))).join('')}</div>`;
  h += `<div class="r">${btn(0, 'PRO.dupMezz()', 'Копия')}${btn(0, 'PRO.delMezz()', 'Удалить')}${btn(0, 'PRO.global()', '✕ Весь шкаф')}</div>`;
  return h;
}
function sidePanel() {
  const p = S.panels[sel.pi]; if (!p) return sideGlobal();
  const isM = MIRROR_KINDS.includes(p.kind), slats = p.kind === 'slats', mdf = p.kind === 'mdf';
  let h = `<div class="sh">Панель ${sel.pi + 1}</div><div class="note">${PANEL_KINDS[p.kind]} · ${mm(p.w)}×${mm(p.h)} мм · ${{ front: 'на фасаде', free: 'отдельно стоящая', wall: 'на стене' }[p.mount] || 'на стене'}. Тащите в 3D или задайте цифрами.</div>`;
  h += `<div class="r"><span>Материал</span><select onchange="PRO.pKind(this.value)">${Object.keys(PANEL_KINDS).map(k => `<option value="${k}" ${p.kind === k ? 'selected' : ''}>${PANEL_KINDS[k]}</option>`).join('')}</select></div>`;
  h += `<div class="r"><span>Где</span>${btn(p.mount !== 'front' && p.mount !== 'free', "PRO.pMount('wall')", 'На стене')}${btn(p.mount === 'front', "PRO.pMount('front')", 'На фасаде')}${btn(p.mount === 'free', "PRO.pMount('free')", 'Отдельно (перегородка)')}</div>`;
  if (p.mount === 'free') h += stepper('От стены (вперёд)', 'pn.pz', p.pz || 30, 1);
  if (isM) {
    h += `<div class="r"><span>Форма</span>${[['rect', '▭ Прямоугольное'], ['round', '◯ Круглое'], ['oval', '⬭ Овальное'], ['arch', '⌓ Арка']].map(([k, t]) => btn((p.shape || 'rect') === k, `PRO.pShape('${k}')`, t)).join('')}</div>`;
    h += `<div class="r"><span>Размер (быстро)</span>${MIRROR_SIZES.map(([w, hh, sh]) => btn(0, `PRO.pSize(${w},${hh},'${sh}')`, sh === 'round' ? 'Ø' + w : (sh === 'oval' ? 'овал ' + w + '×' + hh : (sh === 'arch' ? 'арка ' + w + '×' + hh : w + '×' + hh)))).join('')}</div>`;
    h += `<div class="r">${btn(!!p.bl, 'PRO.pBl()', '✨ Подсветка по контуру')}</div>`;
  }
  h += stepper('От левого края', 'pn.x', p.x, 1) + stepper('Низ от пола', 'pn.y', p.y, 1) + stepper('Ширина', 'pn.w', p.w, 1) + stepper('Высота', 'pn.h', p.h, 1);
  if (mdf) h += `<div class="r"><span>Фрезеровка</span><select onchange="PRO.pPat(this.value)">${Object.keys(PANEL_PATTERNS).map(k => `<option value="${k}" ${(p.pat || 'vgroove') === k ? 'selected' : ''}>${PANEL_PATTERNS[k]}</option>`).join('')}</select></div>` + stepper('Шаг пазов', 'pn.gp', p.gp || 12, 1);
  if (slats) {
    h += `<div class="r"><span>Рейка (толщина×ширина)</span>${SLAT_PRESETS.map(([d, w]) => btn((p.sd || 32) === d && (p.sw || 100) === w, `PRO.pSlat(${d},${w})`, d + '×' + w)).join('')}</div>`;
    h += stepper('Толщина рейки', 'pn.sd', p.sd || 32, 1, 'мм') + stepper('Ширина рейки', 'pn.sw', p.sw || 100, 5, 'мм') + stepper('Зазор между рейками', 'pn.sg', p.sg || 20, 5, 'мм');
    h += `<div class="r"><span>Рейки</span>${btn(p.so !== 'h', "PRO.pSo('v')", '▮ Вертикальные')}${btn(p.so === 'h', "PRO.pSo('h')", '▬ Горизонтальные')}</div>`;
    const sw = p.sw || 100, sg = p.sg || 20, vert = p.so !== 'h', span = (vert ? p.w : p.h) * 10; h += `<div class="note">Реек: ${Math.max(1, Math.floor((span + sg) / (sw + sg)))} шт · клеёный МДФ ${p.sd || 32}×${sw}×${mm(vert ? p.h : p.w)} мм.</div>`;
  }
  if (!slats && !mdf && !(isM && (p.shape || 'rect') !== 'rect')) { h += `<div class="r">${btn(!!p.frame, 'PRO.pFrame()', 'Алюминиевая рамка')}</div>`; if (p.frame) h += stepper('Рамка (профиль)', 'pn.fw', p.fw || 3, 1); }
  h += `<div class="r"><span>Сдвиг</span>${btn(0, 'PRO.panelMove(-10,0)', '◀ 10')}${btn(0, 'PRO.panelMove(-1,0)', '◀ 1')}${btn(0, 'PRO.panelMove(1,0)', '1 ▶')}${btn(0, 'PRO.panelMove(10,0)', '10 ▶')}</div>`;
  h += `<div class="r"><span>Высота</span>${btn(0, 'PRO.panelMove(0,-10)', '▼ 10')}${btn(0, 'PRO.panelMove(0,-1)', '▼ 1')}${btn(0, 'PRO.panelMove(0,1)', '▲ 1')}${btn(0, 'PRO.panelMove(0,10)', '▲ 10')}</div>`;
  h += `<div class="r">${btn(0, 'PRO.panelOverDoors()', 'Закрыть весь фасад')}${btn(0, 'PRO.dupPanel()', 'Копия')}${btn(0, 'PRO.delPanel()', 'Удалить')}${btn(0, 'PRO.global()', '✕ Весь шкаф')}</div>`;
  return h;
}
function sideBed() {
  const b = S.beds[sel.bi]; if (!b) return sideGlobal(); const d = bedDims(b, S.t), bunk = b.kind === 'bunk';
  let h = `<div class="sh">${bunk ? 'Двухъярусная кровать' : 'Кровать'} ${sel.bi + 1}</div><div class="note">Каркас ${mm(d.W)}×${mm(d.L)} мм · изголовье ${mm(b.hh)} · боковина ${mm(b.sh)} · матрас ${mm(b.mw)}×${mm(b.ml)}×${mm(b.mt)} мм.</div>`;
  h += `<div class="r"><span>Тип</span>${Object.keys(BED_KINDS).map(k => btn(b.kind === k, `PRO.bKind('${k}')`, BED_KINDS[k])).join('')}</div>`;
  h += `<div class="sub">Матрас</div><div class="r"><span>Размер</span>${BED_SIZES.map(([w, l, n]) => btn(b.mw === w && b.ml === l, `PRO.bSize(${w},${l})`, n)).join('')}</div>`;
  h += stepper('Ширина матраса', 'bd.mw', b.mw, 1) + stepper('Длина матраса', 'bd.ml', b.ml, 1) + stepper('Толщина матраса', 'bd.mt', b.mt, 1);
  h += `<div class="r"><span>Стиль</span><select onchange="PRO.bStyle(this.value)">${Object.keys(BED_STYLES).map(k => `<option value="${k}" ${b.style === k ? 'selected' : ''}>${BED_STYLES[k].ru}</option>`).join('')}</select></div>`;
  h += `<div class="r"><span>Цвет чехла</span><div class="sw">${BED_COLORS.map((c, i) => `<button type="button" class="swb ${b.mcol === i ? 'on' : ''}" style="background:${c[1]}" title="${c[0]}" onclick="PRO.bCol(${i})"></button>`).join('')}</div></div>`;
  h += `<div class="sub">Каркас — выше / ниже</div>` + stepper('Высота боковины', 'bd.sh', b.sh, 1) + stepper('Изголовье (от пола)', 'bd.hh', b.hh, 1) + stepper('Изножье (от пола)', 'bd.fh', b.fh, 1) + stepper('Ножки', 'bd.lg', b.lg, 1);
  h += `<div class="r"><span>Боковины</span>${btn(0, 'PRO.nuBed(\'bd.sh\',-5)', '▼ ниже 5')}${btn(0, 'PRO.nuBed(\'bd.sh\',5)', '▲ выше 5')}</div><div class="r"><span>Изголовье</span>${btn(0, 'PRO.nuBed(\'bd.hh\',-5)', '▼ ниже 5')}${btn(0, 'PRO.nuBed(\'bd.hh\',5)', '▲ выше 5')}</div>`;
  h += `<div class="sub">Опции</div>` + stepper('Ящики под кроватью', 'bd.drw', b.drw, 1, 'шт') + `<div class="r">${btn(!!b.lift, 'PRO.bFlag(\'lift\')', '⤴ Подъёмное основание')}${btn(!!b.soft, 'PRO.bFlag(\'soft\')', '🛋 Мягкое изголовье')}${btn(!!b.bedding, 'PRO.bFlag(\'bedding\')', '🛏 Постель (для вида)')}</div>`;
  if (bunk) h += `<div class="sub">Второй ярус</div>` + stepper('Высота 2-го яруса (от пола до реек)', 'bd.lv2', b.lv2, 1) + stepper('Бортик над матрасом', 'bd.rail', b.rail, 1) + `<div class="r"><span>Лестница</span>${btn(b.ladder === 'end', "PRO.bLadder('end')", 'С торца')}${btn(b.ladder === 'side', "PRO.bLadder('side')", 'Сбоку')}</div>` + stepper('Ступеней', 'bd.steps', b.steps, 1, 'шт');
  h += `<div class="sub">Положение</div>` + stepper('От левого края шкафа', 'bd.x', b.x, 1) + stepper('От стены', 'bd.pz', b.pz || 0, 1) + `<div class="r"><span>Поворот</span>${btn(b.rot !== 90, "PRO.bRot(0)", 'Изголовьем к стене')}${btn(b.rot === 90, "PRO.bRot(90)", 'Боком к стене')}</div>`;
  h += `<div class="r">${btn(0, 'PRO.bMove(-10)', '◀ 10')}${btn(0, 'PRO.bMove(-1)', '◀ 1')}${btn(0, 'PRO.bMove(1)', '1 ▶')}${btn(0, 'PRO.bMove(10)', '10 ▶')}</div>`;
  h += `<div class="r">${btn(0, 'PRO.openAll(true)', '↔ Открыть (ящики / подъём)')}${btn(0, 'PRO.openAll(false)', 'Закрыть')}${btn(0, 'PRO.dupBed()', 'Копия')}${btn(0, 'PRO.delBed()', 'Удалить')}${btn(0, 'PRO.global()', '✕ Весь шкаф')}</div>`;
  return h;
}
function sideUnit() {
  const u = S.units[sel.ui]; if (!u) return sideGlobal();
  let h = `<div class="sh">Тумба-обувница ${sel.ui + 1}</div><div class="note">${UNIT_KINDS[u.kind]} · ${mm(u.w)}×${mm(u.h)}×${mm(u.d)} мм. Двойной щелчок по створке — открыть.</div>`;
  h += `<div class="r"><span>Тип</span>${Object.keys(UNIT_KINDS).map(k => btn(u.kind === k, `PRO.uKind('${k}')`, UNIT_KINDS[k])).join('')}</div>`;
  h += stepper(u.kind === 'drawers' ? 'Ящиков' : (u.kind === 'flap' ? 'Откидных створок' : 'Полок'), 'un.n', u.n, 1, 'шт');
  h += stepper('Ширина', 'un.w', u.w, 1) + stepper('Высота', 'un.h', u.h, 1) + stepper('Глубина', 'un.d', u.d, 1) + stepper('Ножки (высота)', 'un.legs', u.legs, 1);
  h += stepper('От левого края шкафа', 'un.x', u.x, 1) + stepper('От стены (вперёд)', 'un.pz', u.pz || 0, 1);
  h += `<div class="r"><span>Фасад</span><select onchange="PRO.uFill(this.value)">${['dsp', 'mdf', 'glass', 'mirror'].map(k => `<option value="${k}" ${(u.fill || 'dsp') === k ? 'selected' : ''}>${FILLS[k]}</option>`).join('')}</select></div>`;
  h += `<div class="r">${btn(!!u.seat, 'PRO.uSeat()', '🪑 Мягкое сиденье сверху')}</div>`;
  h += `<div class="r"><span>Сдвиг</span>${btn(0, 'PRO.unitMove(-10)', '◀ 10')}${btn(0, 'PRO.unitMove(-1)', '◀ 1')}${btn(0, 'PRO.unitMove(1)', '1 ▶')}${btn(0, 'PRO.unitMove(10)', '10 ▶')}</div>`;
  h += `<div class="r">${btn(0, 'PRO.openAll(true)', '↔ Открыть всё')}${btn(0, 'PRO.dupUnit()', 'Копия')}${btn(0, 'PRO.delUnit()', 'Удалить')}${btn(0, 'PRO.global()', '✕ Весь шкаф')}</div>`;
  return h;
}
function renderSide() {
  const box = $('side'); if (!box) return;
  if (VIEW) { box.innerHTML = sideView(); return; }
  box.innerHTML = sel.k === 'item' ? sideItem() : (sel.k === 'col' ? sideCol() : (sel.k === 'mezz' ? sideMezz() : (sel.k === 'panel' ? sidePanel() : (sel.k === 'unit' ? sideUnit() : (sel.k === 'bed' ? sideBed() : sideGlobal())))));
}
function sideView() {
  const pr = pricing(S), g = geom(S);
  return `<div class="sh">${esc(S.name)}</div><div class="note">Вращайте камеру. Нажмите на двери, чтобы открыть.</div>
    <div class="r">${btn(0, 'PRO.openAll(true)', '↔ Открыть всё')}${btn(0, 'PRO.openAll(false)', 'Закрыть')}</div>
    <div class="sub">Параметры</div>
    <div class="r"><span>Размер</span><b>${mm(g.W)} × ${mm(S.H)} × ${mm(S.D)} мм</b></div>
    <div class="r"><span>Цвет</span><b>${esc(S.custom || PALETTE[S.color][0])}</b></div>
    <div class="r"><span>Отсеков</span><b>${S.cols.filter(c => !c.gap).length}${S.mezzes.length ? ' + антресолей: ' + S.mezzes.length : ''}</b></div>
    <div class="sub">Стоимость</div><div class="vp">$${fmt(pr.total / USD)}</div><div class="note">Ориентировочно. Точный проект и цена — после замера.</div>
    <div class="r" style="margin-top:12px"><a class="cta" href="tel:+998920934510">📞 Позвонить</a><a class="cta" href="https://t.me/Kitchencalc" target="_blank" rel="noopener">✈ Telegram</a></div>`;
}
function renderPrice() {
  const e = $('price'); if (!e || VIEW) return;
  const bp = buildParts(S), pr = pricing(S, bp);
  e.innerHTML = `<small>Ориентировочная стоимость</small><b>$${fmt(pr.total / USD)}</b><div class="sum">${fmt(pr.total)} сум · ${S.cols.filter(c => !c.gap).length} отсек., ${S.mezzes.length} антрес., ${bp.parts.reduce((a, p) => a + p.qty, 0)} деталей</div>`;
}
function renderWarn() {
  const e = $('warn'); if (!e || VIEW) return; const w = warnings(S);
  { const g = geom(S), P = roomPoly(S); if (g.cols.length && !rpRectIn(P, wardrobeRect(S))) w.push('Шкаф выходит за пределы комнаты — сдвиньте его или увеличьте комнату'); }
  e.innerHTML = w.length ? w.map(x => `<div>⚠ ${esc(x)}</div>`).join('') : '<div class="ok">✔ Всё размещено, пересечений нет</div>';
}
let odT = null;
function refresh(full) {
  if (full !== false) { recalcW(S); save(); try { history.replaceState(null, '', location.pathname + '#p=' + encodeState(S)); } catch (e) {} }
  if (K) { if (full !== false) K.update(S); K.select(selMeta()); }   // выбор не пересобирает сцену: двойной щелчок по двери всегда срабатывает
  renderSide(); renderPrice(); renderWarn();
  if (OWNER && full !== false) { clearTimeout(odT); odT = setTimeout(renderOwner, 350); }
}

/* ---------- 3D ---------- */
async function init3D() {
  const mod = await import('/static/js/shkaf-pro-3d.js?v=4');
  K = mod.createPro3D($('p3d'), VIEW ? {} : {
    onSelect: s => { sel = !s ? { k: 'global' } : (s.k === 'item' ? { k: 'item', id: s.id, col: s.col } : (s.k === 'col' ? { k: 'col', i: s.i } : (s.k === 'mezz' ? { k: 'mezz', mi: s.i } : (s.k === 'panel' ? { k: 'panel', pi: s.i } : (s.k === 'unit' ? { k: 'unit', ui: s.i } : (s.k === 'bed' ? { k: 'bed', bi: s.i } : { k: 'global' })))))); refresh(false); },
    onMoveAll: (dx, dz) => {   // тянем весь шкаф по полу
      if (!dragState || !dragState.all) { pushUndo(); dragState = { all: true, ox: S.room.ox || 0, oz: S.room.oz || 0 }; }
      let ox = dragState.ox + dx, oz = dragState.oz + dz, mg = null;
      if (S.room.mag) mg = wardrobeMagnet(S, ox, oz);
      if (mg) { S.room.ox = mg.ox; S.room.oz = mg.oz; S.room.rot = mg.rot; } else { S.room.ox = r1(Math.round(ox)); S.room.oz = r1(Math.round(oz)); }
      K.update(S); K.select(selMeta()); renderWarn();
      return (mg ? '🧲 прижат к стене · ' : 'свободно · ') + 'от левой стены ' + mm(S.room.ox) + ' мм, от дальней ' + mm(S.room.oz) + ' мм';
    },
    onMoveEnd: () => { dragState = null; refresh(); },
    onDrag: (s, dy, hx, dx) => {
      if (s.k === 'col') {   // отсек двигаем вдоль шкафа: меняется порядок отсеков и проёмов
        const g = geom(S), cur = s.i; if (!dragState || dragState.col !== s.id0) { pushUndo(); dragState = { col: s.id0 }; }
        const hxl = hx; let j = g.cols.findIndex(c => hxl >= c.xa - S.t && hxl <= c.xb + S.t); if (j < 0) j = hxl < 0 ? 0 : S.cols.length - 1;
        if (j !== cur && j >= 0) { const c = S.cols.splice(cur, 1)[0]; S.cols.splice(j, 0, c); s.i = j; sel = { k: 'col', i: j }; recalcW(S); K.update(S); K.select(selMeta()); renderWarn(); renderSide(); }
        return `отсек ${s.i + 1}: тяните вдоль шкафа · от левого края ${mm(geom(S).cols[s.i].xa)} мм`;
      }
      if (s.k === 'bed') {
        const b = S.beds[s.i]; if (!b) return '';
        if (!dragState || dragState.bed !== s.i) { pushUndo(); dragState = { bed: s.i, x0: b.x }; }
        b.x = r1(Math.round(dragState.x0 + dx)); K.update(S); K.select(selMeta()); renderWarn();
        return `кровать ${s.i + 1}: от левого края шкафа ${mm(b.x)} мм`;
      }
      if (s.k === 'unit') {
        const u = S.units[s.i]; if (!u) return '';
        if (!dragState || dragState.unit !== s.i) { pushUndo(); dragState = { unit: s.i, x0: u.x }; }
        u.x = r1(Math.round(dragState.x0 + dx)); K.update(S); K.select(selMeta()); renderWarn();
        return `тумба ${s.i + 1}: от левого края шкафа ${mm(u.x)} мм`;
      }
      if (s.k === 'panel') {
        const p = S.panels[s.i]; if (!p) return '';
        if (!dragState || dragState.panel !== s.i) { pushUndo(); dragState = { panel: s.i, x0: p.x, y0: p.y }; }
        p.x = r1(Math.round(dragState.x0 + dx)); p.y = r1(Math.max(0, Math.round(dragState.y0 + dy)));
        K.update(S); K.select(selMeta()); renderWarn();
        return `панель ${s.i + 1}: от левого края ${mm(p.x)} мм · низ от пола ${mm(p.y)} мм`;
      }
      if (s.k === 'mezz') {
        const m = S.mezzes[s.i]; if (!m) return '';
        if (!dragState || dragState.mezz !== s.i) { pushUndo(); dragState = { mezz: s.i, x0: m.x, y0: m.y }; }
        m.x = r1(Math.round(dragState.x0 + dx)); m.y = r1(Math.max(0, Math.round(dragState.y0 + dy)));
        K.update(S); K.select(selMeta()); renderWarn();
        return `антресоль ${s.i + 1}: от левого края ${mm(m.x)} мм · низ от пола ${mm(m.y)} мм`;
      }
      const f = findItem(s.id); if (!f) return '';
      if (!dragState || dragState.id !== s.id) { pushUndo(); dragState = { id: s.id, y0: f.it.y, y10: f.it.y1 }; }
      const g = geom(S); f.it.y = r1(Math.round(dragState.y0 + dy));
      if (f.it.type === 'vpanel') f.it.y1 = r1(dragState.y10 + (f.it.y - dragState.y0));
      let ci = g.cols.findIndex(c => hx >= c.xa - S.t / 2 && hx <= c.xb + S.t / 2);
      if (ci >= 0 && ci !== f.ci) { f.col.items = f.col.items.filter(i => i !== f.it); S.cols[ci].items.push(f.it); sel = { k: 'item', id: f.it.id, col: ci }; }
      K.update(S); K.select(selMeta()); renderWarn();
      return `от пола: ${mm(ext(f.it, S)[0])} мм · отсек ${findItem(s.id).ci + 1}`;
    },
    onDragEnd: () => { dragState = null; refresh(true); }
  }, { viewOnly: VIEW });
  $('p3dLoad').style.display = 'none';
  refresh(false);
}
let dragState = null;

/* ---------- заявка ---------- */
async function sendLead() {
  const phone = $('lPhone').value.trim(), st = $('lStatus'), b = $('lBtn'), pr = pricing(S), g = geom(S);
  if (phone.replace(/\D/g, '').length < 9) { st.textContent = 'Проверьте номер телефона.'; return; }
  const old = b.textContent; b.disabled = true; b.textContent = 'Отправляю…';
  const d = { 'Изделие': 'Шкаф (конструктор PRO): ' + S.name, 'Размер': `${mm(g.W)}×${mm(S.H)}×${mm(S.D)} мм`, 'Отсеков': S.cols.filter(c => !c.gap).length + (S.mezzes.length ? ' + антресолей: ' + S.mezzes.length : ''), 'Двери': { none: 'без дверей', swing: 'распашные', sliding: 'купе' }[S.doors.kind] + (S.doors.kind !== 'none' ? ' ' + S.doors.n : ''), 'Цвет': S.custom || PALETTE[S.color][0], 'Класс': P.tiers[S.tier].ru, 'Ссылка': location.origin + '/shkaf/view#p=' + encodeState(S) };
  try {
    const r = await fetch('/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: $('lName').value.trim(), phone, notes: $('lNotes').value.trim(), price: fmt(pr.total), source: location.href, website: $('lWeb').value, details: d, lower: [], upper: [], blocks: [] }) });
    let j = {}; try { j = await r.json(); } catch (e) {}
    if (r.ok && j.ok) { b.textContent = '✓ Отправлено'; st.textContent = 'Заявка отправлена мастеру, он свяжется с вами.'; return; }
    st.textContent = j.error === 'bad_phone' ? 'Проверьте номер телефона.' : 'Не удалось отправить. Позвоните или напишите в Telegram.';
  } catch (e) { st.textContent = 'Не удалось отправить. Позвоните или напишите в Telegram.'; }
  b.disabled = false; b.textContent = old;
}

/* ---------- мастер: чертежи ---------- */
async function ownerVerify(key) { try { const r = await fetch('/api/owner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) }); return r.ok; } catch (e) { return false; } }
async function ownerUnlock() {
  if (VIEW) return;
  if (OWNER) { if (confirm('Выйти из режима мастера?')) { fetch('/api/owner/logout', { method: 'POST' }).finally(() => { location.href = '/shkaf'; }); } return; }
  const key = prompt('Ключ мастера'); if (!key) return;
  if (await ownerVerify(key)) { try { localStorage.setItem('kc_owner', key); } catch (e) {} ownerApply(true); toast('Режим мастера включён'); } else toast('Неверный ключ');
}
async function ownerBoot() { if (VIEW) return; ownerApply(true); }   // страница открывается только мастеру (cookie), поэтому режим включён сразу
function ownerApply(on) { OWNER = !!on && !VIEW; const b = $('ownerBox'); if (b) b.style.display = OWNER ? '' : 'none'; const cl = $('clientBtn'); if (cl) cl.style.display = OWNER ? '' : 'none'; const ct = $('clientTg'); if (ct) ct.style.display = OWNER ? '' : 'none'; if (OWNER) renderOwner(); }
let drawMod = null, lastSheets = [];
async function renderOwner() {
  if (!OWNER) return;
  if (!drawMod) drawMod = await import('/static/js/shkaf-pro-draw.js?v=2');
  const r = drawMod.buildSheets(S); lastSheets = r.sheets;
  $('ownerBody').innerHTML = r.sheets.map(s => `<div class="od-sheet">${s}</div>`).join('');
}
function ownerPrint() {
  if (!lastSheets.length) return; const w = window.open('', '_blank'); if (!w) return;
  w.document.write('<!doctype html><meta charset="utf-8"><title>Чертежи шкафа</title><style>@page{size:A4 landscape;margin:0}body{margin:0}svg{width:100%;height:auto;page-break-after:always;display:block}</style>' + lastSheets.join(''));
  w.document.close(); setTimeout(() => { try { w.print(); } catch (e) {} }, 400);
}
document.addEventListener('keydown', e => {
  if ((e.ctrlKey && e.shiftKey && (e.code === 'KeyK' || e.key === 'K' || e.key === 'k')) || (e.altKey && e.shiftKey && e.code === 'KeyM')) { e.preventDefault(); ownerUnlock(); return; }
  if (VIEW) return; const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (/INPUT|SELECT|TEXTAREA/.test(tag)) return;
  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z' || e.code === 'KeyZ')) { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
  if (sel.k === 'col') {
    if (e.key === 'ArrowLeft') { e.preventDefault(); moveCol(sel.i, -1); } else if (e.key === 'ArrowRight') { e.preventDefault(); moveCol(sel.i, 1); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); delCol(sel.i); }
    return;
  }
  if (sel.k === 'bed') {
    const d = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowLeft') { e.preventDefault(); window.PRO.bMove(-d); } else if (e.key === 'ArrowRight') { e.preventDefault(); window.PRO.bMove(d); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); window.PRO.delBed(); }
    return;
  }
  if (sel.k === 'unit') {
    const d = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowLeft') { e.preventDefault(); unitMove(-d); } else if (e.key === 'ArrowRight') { e.preventDefault(); unitMove(d); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); delUnit(); }
    return;
  }
  if (sel.k === 'panel') {
    const d = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowLeft') { e.preventDefault(); panelMove(-d, 0); } else if (e.key === 'ArrowRight') { e.preventDefault(); panelMove(d, 0); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); panelMove(0, d); } else if (e.key === 'ArrowDown') { e.preventDefault(); panelMove(0, -d); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); delPanel(); }
    return;
  }
  if (sel.k === 'mezz') {
    const d = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowLeft') { e.preventDefault(); mezzMove(-d, 0); } else if (e.key === 'ArrowRight') { e.preventDefault(); mezzMove(d, 0); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); mezzMove(0, d); } else if (e.key === 'ArrowDown') { e.preventDefault(); mezzMove(0, -d); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); delMezz(); }
    return;
  }
  if (sel.k === 'item') {
    const d = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowUp') { e.preventDefault(); nudge('item.y', d); } else if (e.key === 'ArrowDown') { e.preventDefault(); nudge('item.y', -d); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); moveItemCol(-1); } else if (e.key === 'ArrowRight') { e.preventDefault(); moveItemCol(1); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); delItem(); }
  }
});
(function () { let n = 0, tm = null; document.addEventListener('click', e => { if (!e.target.closest || !e.target.closest('.brand')) return; n++; clearTimeout(tm); tm = setTimeout(() => { n = 0; }, 900); if (n >= 3) { n = 0; e.preventDefault(); ownerUnlock(); } }, true); })();

/* ---------- ссылки ---------- */
function copy(txt, ok) { const done = r => toast(r ? ok : 'Не удалось скопировать: ' + txt); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => done(true), () => done(false)); else { try { const ta = document.createElement('textarea'); ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); done(document.execCommand('copy')); ta.remove(); } catch (e) { done(false); } } }
let fsOn = false, sidePh = null;
function fullscreen(on) {
  const box = $('p3dBox'), side = $('side'); if (on === undefined) on = !fsOn; if (on === fsOn) return; fsOn = on;
  if (on) {
    sidePh = document.createComment('side'); side.parentNode.insertBefore(sidePh, side); box.appendChild(side); box.classList.add('fs'); document.body.style.overflow = 'hidden';
    const rq = box.requestFullscreen || box.webkitRequestFullscreen; if (rq) { try { const pr = rq.call(box); if (pr && pr.catch) pr.catch(() => {}); } catch (e) {} }
  } else {
    box.classList.remove('fs', 'side-off'); if (sidePh && sidePh.parentNode) { sidePh.parentNode.insertBefore(side, sidePh); sidePh.remove(); } document.body.style.overflow = '';
    const fe = document.fullscreenElement || document.webkitFullscreenElement; if (fe) { const ex = document.exitFullscreen || document.webkitExitFullscreen; try { const pr = ex.call(document); if (pr && pr.catch) pr.catch(() => {}); } catch (e) {} }
  }
  const fb = $('fsBtn'); if (fb) fb.textContent = on ? '✕ Свернуть' : '⛶ На весь экран';
  const sb = $('sideBtn'); if (sb) { sb.style.display = on ? '' : 'none'; sb.textContent = '⚙ Скрыть панель'; }
  setTimeout(() => window.dispatchEvent(new Event('resize')), 120);
}
function sideToggle() { const box = $('p3dBox'); box.classList.toggle('side-off'); const sb = $('sideBtn'); if (sb) sb.textContent = box.classList.contains('side-off') ? '⚙ Параметры' : '⚙ Скрыть панель'; setTimeout(() => window.dispatchEvent(new Event('resize')), 60); }
['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => { if (!(document.fullscreenElement || document.webkitFullscreenElement) && fsOn) fullscreen(false); }));
function drawerNear(delta) { const f = findItem(sel.id); if (!f || f.it.type !== 'drawer') return; const [a, b] = ext(f.it, S); mutate(() => { const y = delta > 0 ? b : a - f.it.fh; const c = mkItem('drawer', y); c.fh = f.it.fh; c.sys = f.it.sys; f.col.items.push(c); sel = { k: 'item', id: c.id, col: f.ci }; }); }
function between(a, b) {
  const f = findItem(sel.id); if (!f) return; const L = levels(S, f.col); a = +a; b = +b; if (b <= a) b = Math.min(L.length - 1, a + 1); if (b <= a) { a = Math.max(0, b - 1); }
  mutate(() => { f.it.y = r1(L[a].top); f.it.y1 = r1(L[b].bot); if (f.it.y1 <= f.it.y) f.it.y1 = r1(f.it.y + 10); });
}

window.PRO = {
  set: setVal, nu: nudge, hold, add: addItem, delItem, dupItem, moveItemCol, addCol, dupCol, delCol, moveCol, eqCols, even: evenShelves,
  color: setColor, custom: setCustom, selCol: selectCol, selItem: selectItem, global: selectGlobal,
  tier: i => mutate(() => { S.tier = i; }), t: v => mutate(() => { S.t = v; }), name: v => mutate(() => { S.name = String(v).slice(0, 60); }, true),
  addBed, selBed: i => { sel = { k: 'bed', bi: i }; refresh(false); }, delBed: () => mutate(() => { S.beds.splice(sel.bi, 1); sel = { k: 'global' }; }), delBedAt: i => mutate(() => { S.beds.splice(i, 1); sel = { k: 'global' }; }),
  dupBed: () => mutate(() => { const b = Object.assign({}, S.beds[sel.bi], { id: C.uid(), x: r1(S.beds[sel.bi].x + bedDims(S.beds[sel.bi], S.t).W + 10) }); S.beds.push(b); sel = { k: 'bed', bi: S.beds.length - 1 }; }),
  bMove: dx => bedPatch(b => { b.x = r1(b.x + dx); }), nuBed: (p, d) => nudge(p, d), bRot: v => bedPatch(b => { b.rot = v; }), bFlag: k => bedPatch(b => { b[k] = !b[k]; }), bStyle: v => bedPatch(b => { b.style = v; }), bCol: i => bedPatch(b => { b.mcol = i; }), bLadder: v => bedPatch(b => { b.ladder = v; }),
  bSize: (w, l) => bedPatch(b => { b.mw = w; b.ml = l; }), bKind: k => bedPatch(b => { const d = mkBed(b.x, k); Object.assign(b, { kind: k, mw: d.mw, ml: d.ml, mt: d.mt, style: d.style, sh: d.sh, hh: d.hh, fh: d.fh, lg: d.lg, soft: d.soft }); }),
  addUnit, delUnit, dupUnit, unitMove, selUnit: selectUnit, delUnitAt: i => mutate(() => { S.units.splice(i, 1); sel = { k: 'global' }; }), uKind: v => mutate(() => { const u = S.units[sel.ui]; if (u) { u.kind = v; if (v === 'drawers' && u.n > 5) u.n = 3; } }), uFill: v => mutate(() => { const u = S.units[sel.ui]; if (u) u.fill = v; }), uSeat: () => mutate(() => { const u = S.units[sel.ui]; if (u) u.seat = !u.seat; }),
  pShape: v => mutate(() => { const p = S.panels[sel.pi]; if (p) { p.shape = v; if (v === 'round') p.h = p.w; } }), pBl: () => mutate(() => { const p = S.panels[sel.pi]; if (p) p.bl = !p.bl; }), pPat: v => mutate(() => { const p = S.panels[sel.pi]; if (p) p.pat = v; }), pSo: v => mutate(() => { const p = S.panels[sel.pi]; if (p) p.so = v; }), pSlat: (d, w) => mutate(() => { const p = S.panels[sel.pi]; if (p) { p.sd = d; p.sw = w; } }), pSize: (w, hh, sh) => mutate(() => { const p = S.panels[sel.pi]; if (p) { p.w = w; p.h = hh; p.shape = sh; if (!MIRROR_KINDS.includes(p.kind)) p.kind = 'mirror'; } }),
  addPanel, delPanel, dupPanel, panelMove, panelOverDoors, selPanel: selectPanel, pKind: v => mutate(() => { const p = S.panels[sel.pi]; if (p) p.kind = v; }), pMount: v => mutate(() => { const p = S.panels[sel.pi]; if (p) p.mount = v; }), pFrame: () => mutate(() => { const p = S.panels[sel.pi]; if (p) p.frame = !p.frame; }),
  mfill: v => mutate(() => { const m = S.mezzes[sel.mi]; if (m) m.fill = v; }), delMezzAt: i => mutate(() => { S.mezzes.splice(i, 1); sel = { k: 'global' }; }), delPanelAt: i => mutate(() => { S.panels.splice(i, 1); sel = { k: 'global' }; }), addGapAt: side => mutate(() => { const at = sel.k === 'col' ? sel.i + (side > 0 ? 1 : 0) : S.cols.length; S.cols.splice(at, 0, { id: C.uid(), w: 60, gap: true, items: [] }); sel = { k: 'col', i: at }; }), addMezz, delMezz, dupMezz, mezzFull, mezzOver, mezzMove, selMezz: selectMezz, addGap, toggleGap, tpl: loadTemplate, doors: setDoors, fill: setFill, laco: i => mutate(() => { S.doors.laco = i; }),
  handles: () => mutate(() => { S.doors.handles = S.doors.handles === false; }), led: () => mutate(() => { S.led = !S.led; }),
  sys: v => mutate(() => { const f = findItem(sel.id); if (f) f.it.sys = v; }),
  toggleDoors: () => { if (K) { K.toggleDoors(); setTimeout(renderSide, 50); } }, openAll: on => { if (K) { K.toggleDoors(on); setTimeout(renderSide, 50); } },
  cdf: v => mutate(() => { const c = S.cols[sel.i]; if (c) { if (v === 'dsp') delete c.df; else c.df = v; } }), cdd: v => mutate(() => { const c = S.cols[sel.i]; if (c) { if (v === 'auto') delete c.dd; else c.dd = v; } }), allDf: v => mutate(() => { S.cols.forEach(c => { if (!c.gap) { if (v === 'dsp') delete c.df; else c.df = v; } }); }),
  room: () => openRoomEditor({ poly: S.room.poly, W: S.room.W, D: S.room.D, onApply: P => mutate(() => { if (P) { S.room.poly = P; S.room.W = Math.round(rpEdgeLen(P, 0)); S.room.D = Math.round(Math.max(...P.map(p => p[1]))); } else S.room.poly = null; S.room.set = true; }) }),
  magnet: () => mutate(() => { S.room.mag = !S.room.mag; if (S.room.mag) { const m = wardrobeMagnet(S, S.room.ox || 0, S.room.oz || 0, 120); if (m) { S.room.ox = m.ox; S.room.oz = m.oz; S.room.rot = m.rot; } } }),
  rotW: d => mutate(() => { const f = wfoot(S), cx = (S.room.ox || 0) + f.w / 2, cz = (S.room.oz || 0) + f.d / 2; S.room.rot = (((S.room.rot || 0) + d) % 360 + 360) % 360; const n = wfoot(S); S.room.ox = r1(cx - n.w / 2); S.room.oz = r1(cz - n.d / 2); if (S.room.mag) { const m = wardrobeMagnet(S, S.room.ox, S.room.oz, 200, S.room.rot); if (m) { S.room.ox = m.ox; S.room.oz = m.oz; S.room.rot = m.rot; } } }),
  centerWall: () => mutate(() => { S.room.rot = 0; S.room.oz = 0; S.room.ox = r1(Math.max(0, (rpEdgeLen(roomPoly(S), 0) - geom(S).W) / 2)); }),
  leftWall: () => mutate(() => { S.room.rot = 0; S.room.oz = 0; S.room.ox = 0; }), rightWall: () => mutate(() => { S.room.rot = 0; S.room.oz = 0; S.room.ox = r1(Math.max(0, rpEdgeLen(roomPoly(S), 0) - geom(S).W)); }),
  colReset: i => mutate(() => { delete S.cols[i].H; delete S.cols[i].D; }),
  light: () => { if (!K) return; const on = !K.isLight(); K.setLight(on); $('lightBtn').textContent = on ? '💡 Свет: вкл' : '🌙 Свет: выкл'; },
  leds: () => { if (!K) return; const on = !K.isLeds(); K.setLeds(on); $('ledBtn').textContent = on ? '✨ Подсветка: вкл' : '▫ Подсветка: выкл'; },
  rot: on => { if (K) K.setRotate(on); }, sideToggle, drawerAbove: () => drawerNear(1), drawerBelow: () => drawerNear(-1), between, vpCenter: () => mutate(() => { const f = findItem(sel.id); if (f) f.it.x = r1(f.col.w / 2 - S.t / 2); }), idoorDir: v => mutate(() => { const f = findItem(sel.id); if (f) f.it.dir = v; }),
  addDiv: () => mutate(() => { const m = S.mezzes[sel.mi]; m.div = m.div || []; const w = m.w - 2 * S.t, pts = [0].concat(m.div.slice().sort((a, b) => a - b).map(v => v + S.t), [w]); let bi = 0, bw = -1; for (let i = 0; i < pts.length - 1; i++) if (pts[i + 1] - pts[i] > bw) { bw = pts[i + 1] - pts[i]; bi = i; } m.div.push(r1(pts[bi] + (pts[bi + 1] - pts[bi] - S.t) / 2)); m.div.sort((a, b) => a - b); m.cd = []; }),
  delDiv: i => mutate(() => { const m = S.mezzes[sel.mi]; m.div.splice(i, 1); m.cd = []; m.dir = []; }),
  eqDiv: n => mutate(() => { const m = S.mezzes[sel.mi], w = m.w - 2 * S.t, cw = (w - (n - 1) * S.t) / n; m.div = []; for (let k = 1; k < n; k++) m.div.push(r1(k * cw + (k - 1) * S.t)); m.cd = []; m.dir = []; }),
  mdir: (ci, v) => mutate(() => { const m = S.mezzes[sel.mi]; m.dir = m.dir || []; while (m.dir.length <= ci) m.dir.push('swing'); m.dir[ci] = v; }),
  ddir: (i, v) => mutate(() => { S.doors.dir = S.doors.dir || []; while (S.doors.dir.length <= i) S.doors.dir.push('auto'); S.doors.dir[i] = v; }), undo: doUndo, redo: doRedo, lead: sendLead, share: () => copy(location.origin + '/shkaf/pro#p=' + encodeState(S), 'Ссылка на проект скопирована'),
  client: mode => { const url = location.origin + '/shkaf/view#p=' + encodeState(S); if (mode === 'tg') window.open('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent('Ваш шкаф в 3D — можно крутить и открывать двери:'), '_blank', 'noopener'); else copy(url, 'Ссылка для клиента скопирована — только просмотр ✔'); },
  print: ownerPrint, owner: ownerUnlock, full: fullscreen,
  reset: () => { if (confirm('Начать заново с шаблона?')) mutate(() => { S = defState(); sel = { k: 'global' }; }); }
};

const FRESH = (() => { if (VIEW) return false; if (/^#p=/.test(location.hash)) return false; try { return !localStorage.getItem('kc_pro'); } catch (e) { return false; } })();
S = load();
if (VIEW) document.body.classList.add('view');
init3D().catch(e => { console.warn(e); const l = $('p3dLoad'); if (l) l.textContent = '3D недоступно в этом браузере'; });
refresh(false);
ownerBoot();
if (FRESH && !S.room.set) setTimeout(() => {   // в начале — размер комнаты, как на кухне
  const done = r => mutate(() => { if (r) { S.room.W = r.W; S.room.D = r.D; S.room.H = r.H; } S.room.set = true; S.room.ox = r1(Math.max(0, (S.room.W - geom(S).W) / 2)); }, true);
  openRoomStart(S.room, done, () => window.PRO.room());
}, 600);
if (/[?&]master\b/.test(location.search) && !VIEW) setTimeout(() => { if (!OWNER) ownerUnlock(); }, 600);
