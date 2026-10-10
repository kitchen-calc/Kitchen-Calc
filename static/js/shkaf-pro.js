/* Конструктор шкафа PRO: интерфейс. Модель и расчёт — shkaf-pro-core.js, 3D — shkaf-pro-3d.js, чертежи мастера — shkaf-pro-draw.js */
import * as C from '/static/js/shkaf-pro-core.js?v=1';
const { doorList, geom, ext, mkItem, mkMezz, mkPanel, presetP, freeY, warnings, buildParts, pricing, PALETTE, LACO, FILLS, ITEM_TYPES, ITEM_ICON, DRAWER_SYS, P, r1, clamp, fitWidth, recalcW, defState, encodeState, decodeState, sanitize } = C;

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
function fixSel() { if (sel.k === 'item' && !findItem(sel.id)) sel = { k: 'global' }; if (sel.k === 'col' && sel.i >= S.cols.length) sel = { k: 'global' }; if (sel.k === 'mezz' && !S.mezzes[sel.mi]) sel = { k: 'global' }; if (sel.k === 'panel' && !S.panels[sel.pi]) sel = { k: 'global' }; }
function mutate(fn, noUndo) { if (!noUndo) pushUndo(); fn(); recalcW(S); fixSel(); refresh(); }
function findItem(id) { for (let ci = 0; ci < S.cols.length; ci++) { const it = S.cols[ci].items.find(i => i.id === id); if (it) return { it, ci, col: S.cols[ci] }; } return null; }
const toast = (t) => { const e = $('toast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 2600); };

/* ---------- ввод чисел ---------- */
const RANGE = { W: [60, 800], H: [100, 320], D: [25, 90], plinth: [0, 20], 'mezz.h': [15, 90], 'mezz.n': [0, 8], 'mezz.shelves': [0, 3], 'doors.n': [1, 8], 'col.w': [15, 200], 'item.y': [0, 330], 'item.d': [15, 85], 'item.n': [1, 8], 'item.fh': [8, 40], 'item.h': [10, 40], 'item.y1': [0, 330], 'item.x': [0, 200], 'mz.x': [-100, 900], 'mz.w': [20, 900], 'mz.h': [15, 120], 'mz.y': [0, 340], 'mz.n': [0, 10], 'mz.shelves': [0, 3], 'doors.gf': [2, 30], 'pn.x': [-300, 1200], 'pn.y': [0, 340], 'pn.w': [10, 400], 'pn.h': [10, 340], 'pn.fw': [1, 15] };
function stepper(label, path, val, step, unit) {
  return `<div class="r"><span>${esc(label)}</span><span class="stp"><button type="button" onpointerdown="PRO.hold(event,'${path}',${-step})">−</button><input type="number" step="any" value="${r1(val)}" onfocus="this.select()" onchange="PRO.set('${path}',this.value)"><button type="button" onpointerdown="PRO.hold(event,'${path}',${step})">+</button><small>${esc(unit || 'см')}</small></span></div>`;
}
function getVal(path) {
  if (path.startsWith('item.')) { const f = findItem(sel.id); return f ? f.it[path.slice(5)] : 0; }
  if (path.startsWith('mz.')) { const m = S.mezzes[sel.mi]; return m ? m[path.slice(3)] : 0; }
  if (path.startsWith('pn.')) { const p = S.panels[sel.pi]; return p ? p[path.slice(3)] : 0; }
  if (path === 'col.w') return S.cols[sel.i] ? S.cols[sel.i].w : 0;
  if (path === 'W') return geom(S).W;
  return path.split('.').reduce((o, k) => o[k], S);
}
function setVal(path, v) {
  v = parseFloat(String(v).replace(',', '.')); if (!isFinite(v)) { refresh(); return; }
  const [a, b] = RANGE[path] || [0, 9999]; v = clamp(v, a, b);
  mutate(() => {
    if (path.startsWith('item.')) { const f = findItem(sel.id); if (!f) return; const key = path.slice(5); f.it[key] = ['n'].includes(key) ? Math.round(v) : r1(v); if (key === 'y1' && f.it.y1 <= f.it.y) f.it.y1 = f.it.y + 5; return; }
    if (path.startsWith('pn.')) { const p = S.panels[sel.pi]; if (p) p[path.slice(3)] = r1(v); return; }
    if (path.startsWith('mz.')) { const m = S.mezzes[sel.mi]; if (!m) return; const k = path.slice(3); m[k] = ['n', 'shelves'].includes(k) ? Math.round(v) : r1(v); return; }
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
  if (type === 'drawers' || type === 'shoe' || type === 'pant' || type === 'basket') {
    const h = { drawers: 54, shoe: 36, pant: 10, basket: 18 }[type]; y = freeY(S, col, h);
    if (y == null) { toast('В отсеке нет свободного места для этого элемента'); return; }
  } else if (type === 'rod') y = r1(g.y1 - 14);
  else if (type === 'vpanel') y = g.y0;
  else y = r1((g.y0 + g.y1) / 2);
  mutate(() => { it = mkItem(type, y); if (type === 'vpanel') { it.y1 = r1(g.y1); it.x = r1(col.w / 2); } col.items.push(it); sel = { k: 'item', id: it.id, col: ci }; });
}
function delItem() { const f = findItem(sel.id); if (!f) return; mutate(() => { f.col.items = f.col.items.filter(i => i !== f.it); sel = { k: 'col', i: f.ci }; }); }
function dupItem() { const f = findItem(sel.id); if (!f) return; mutate(() => { const c = JSON.parse(JSON.stringify(f.it)); c.id = C.uid(); c.y = r1(c.y + (ext(f.it, S)[1] - ext(f.it, S)[0]) + 2); if (c.y1 != null) c.y1 = r1(c.y1 + 2); f.col.items.push(c); sel = { k: 'item', id: c.id, col: f.ci }; }); }
function moveItemCol(d) { const f = findItem(sel.id); if (!f) return; const nc = f.ci + d; if (nc < 0 || nc >= S.cols.length) return; mutate(() => { f.col.items = f.col.items.filter(i => i !== f.it); S.cols[nc].items.push(f.it); sel = { k: 'item', id: f.it.id, col: nc }; }); }
function addGap() { mutate(() => { S.cols.push({ id: C.uid(), w: 80, gap: true, items: [] }); sel = { k: 'col', i: S.cols.length - 1 }; }); }
function toggleGap(i) { mutate(() => { const c = S.cols[i]; c.gap = !c.gap; if (c.gap) c.items = []; else c.items = [mkItem('shelf', 70), mkItem('shelf', 140)]; }); }
function addPanel() { const g = geom(S); mutate(() => { const p = mkPanel(g.W + 10, 20, 60, Math.min(180, S.H - 20)); S.panels.push(p); sel = { k: 'panel', pi: S.panels.length - 1 }; }); }
function delPanel() { mutate(() => { S.panels.splice(sel.pi, 1); sel = { k: 'global' }; }); }
function dupPanel() { mutate(() => { const p = Object.assign({}, S.panels[sel.pi], { id: C.uid(), x: r1(S.panels[sel.pi].x + S.panels[sel.pi].w + 5) }); S.panels.push(p); sel = { k: 'panel', pi: S.panels.length - 1 }; }); }
function panelMove(dx, dy) { mutate(() => { const p = S.panels[sel.pi]; p.x = r1(p.x + dx); p.y = r1(Math.max(0, p.y + dy)); }); }
function panelOverDoors() { mutate(() => { const p = S.panels[sel.pi], g = geom(S); p.mount = 'front'; p.x = 0; p.w = g.W; p.y = S.plinth; p.h = S.H - S.plinth; }); }
function selectPanel(i) { sel = { k: 'panel', pi: i }; refresh(false); }
function addMezz() { const g = geom(S); mutate(() => { const m = mkMezz(0, g.W, g.totalH); S.mezzes.push(m); sel = { k: 'mezz', mi: S.mezzes.length - 1 }; }); }
function delMezz() { mutate(() => { S.mezzes.splice(sel.mi, 1); sel = { k: 'global' }; }); }
function dupMezz() { mutate(() => { const m = Object.assign({}, S.mezzes[sel.mi], { id: C.uid(), y: r1(S.mezzes[sel.mi].y + S.mezzes[sel.mi].h) }); S.mezzes.push(m); sel = { k: 'mezz', mi: S.mezzes.length - 1 }; }); }
function mezzFull() { mutate(() => { const m = S.mezzes[sel.mi]; m.x = 0; m.w = geom(S).W; m.n = Math.max(1, Math.round(m.w / 60)); }); }
function mezzOver(i) { mutate(() => { const m = S.mezzes[sel.mi], c = geom(S).cols[i]; m.x = r1(c.xa - S.t); m.w = r1(c.w + 2 * S.t); m.y = S.H; m.n = Math.max(1, Math.round(m.w / 60)); }); }
function mezzMove(dx, dy) { mutate(() => { const m = S.mezzes[sel.mi]; m.x = r1(m.x + dx); m.y = r1(Math.max(0, m.y + dy)); }); }
function selectMezz(i) { sel = { k: 'mezz', mi: i }; refresh(false); }
function loadTemplate(kind) { if (!confirm('Заменить текущий проект шаблоном?')) return; mutate(() => { S = kind === 'P' ? presetP() : defState(); sel = { k: 'global' }; }); if (K) K.frame(); }
function addCol() { mutate(() => { const w = r1(Math.min(80, S.cols[S.cols.length - 1].w)); S.cols.push({ id: C.uid(), w, items: [mkItem('shelf', 70), mkItem('shelf', 140)] }); sel = { k: 'col', i: S.cols.length - 1 }; }); }
function dupCol(i) { mutate(() => { const c = JSON.parse(JSON.stringify(S.cols[i])); c.id = C.uid(); c.items.forEach(it => { it.id = C.uid(); }); S.cols.splice(i + 1, 0, c); sel = { k: 'col', i: i + 1 }; }); }
function delCol(i) { if (S.cols.length <= 1) { toast('Должен остаться хотя бы один отсек'); return; } mutate(() => { S.cols.splice(i, 1); sel = { k: 'global' }; }); }
function moveCol(i, d) { const j = i + d; if (j < 0 || j >= S.cols.length) return; mutate(() => { const t = S.cols[i]; S.cols[i] = S.cols[j]; S.cols[j] = t; sel = { k: 'col', i: j }; }); }
function eqCols() { mutate(() => { const g = geom(S), inner = g.W - (S.cols.length + 1) * S.t, w = r1(inner / S.cols.length); S.cols.forEach(c => { c.w = w; }); S.cols[S.cols.length - 1].w = r1(inner - w * (S.cols.length - 1)); }); }
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
function selMeta() { return sel.k === 'item' ? { k: 'item', id: sel.id } : (sel.k === 'col' ? { k: 'col', i: sel.i } : (sel.k === 'mezz' ? { k: 'mezz', i: sel.mi } : (sel.k === 'panel' ? { k: 'panel', i: sel.pi } : (sel.k === 'doors' ? { k: 'doors' } : { k: 'global' })))); }
const btn = (on, act, txt, cls) => `<button type="button" class="${on ? 'on ' : ''}${cls || ''}" onclick="${act}">${txt}</button>`;
function sideGlobal() {
  const g = geom(S), T = P.tiers;
  let h = `<div class="sh">${esc(S.name)}</div><div class="note">Нажмите на отсек или предмет в 3D, предметы можно тащить вверх-вниз и в соседний отсек. Камера: галочка «Вращать» вверху — вращать, без галочки — двигать картинку (мышь: правая кнопка или Shift+ЛКМ — двигать, колесо — приблизить).</div>`;
  h += `<div class="sub">Размеры шкафа</div>` + stepper('Ширина', 'W', g.W, 1) + stepper('Высота корпуса', 'H', S.H, 1) + stepper('Глубина', 'D', S.D, 1) + stepper('Цоколь', 'plinth', S.plinth, 1);
  h += `<div class="r"><span>ЛДСП</span>${btn(S.t === 1.6, 'PRO.t(1.6)', '16 мм')}${btn(S.t === 1.8, 'PRO.t(1.8)', '18 мм')}</div>`;
  h += `<div class="sub">Цвет корпуса</div><div class="sw">${PALETTE.map((c, i) => `<button type="button" class="swb ${!S.custom && S.color === i ? 'on' : ''}" style="background:${c[1]}" title="${c[0]}" onclick="PRO.color(${i})"></button>`).join('')}<input type="color" value="${S.custom || '#cdbba0'}" onchange="PRO.custom(this.value)" title="свой цвет"></div>`;
  h += `<div class="r"><span>Класс</span>${T.map((t, i) => btn(S.tier === i, `PRO.tier(${i})`, t.ru)).join('')}</div>`;
  h += `<div class="sub">Отсеки (${S.cols.length})</div><div class="cols">${S.cols.map((c, i) => `<button type="button" class="colchip" onclick="PRO.selCol(${i})">${c.gap ? 'проём' : '№' + (i + 1)}<b>${Math.round(c.w * 10)}</b><small>${c.gap ? '—' : c.items.length + ' поз.'}</small></button>`).join('')}</div>`;
  h += `<div class="r">${btn(0, 'PRO.addCol()', '＋ Отсек')}${btn(0, 'PRO.eqCols()', 'Выровнять ширину')}</div>`;
  const gm = geom(S);
  h += `<div class="sub">Антресоли (${S.mezzes.length}) — отдельные блоки</div><div class="cols">${S.mezzes.map((m, i) => `<button type="button" class="colchip" onclick="PRO.selMezz(${i})">А${i + 1}<b>${Math.round(m.w * 10)}</b><small>y ${Math.round(m.y * 10)}</small></button>`).join('')}</div>`;
  h += `<div class="r">${btn(0, 'PRO.addMezz()', '＋ Антресоль')}${btn(0, 'PRO.addGap()', '＋ Проём между отсеками')}</div><div class="note">Антресоль — отдельная коробка: её можно двигать вбок и вверх независимо от низа, поставить над проёмом (П-образный шкаф).</div>`;
  h += `<div class="sub">Зеркала и стеклянные панели (${S.panels.length})</div><div class="cols">${S.panels.map((p, i) => `<button type="button" class="colchip" onclick="PRO.selPanel(${i})">П${i + 1}<b>${Math.round(p.w * 10)}×${Math.round(p.h * 10)}</b><small>${FILLS[p.kind]}</small></button>`).join('')}</div><div class="r">${btn(0, 'PRO.addPanel()', '＋ Панель (зеркало)')}</div><div class="note">Отдельная панель: зеркало, стекло, лакобель или ЛДСП. На стену рядом со шкафом или на фасад поверх дверей; размер и место — любые.</div>`;
  h += `<div class="sub">Шаблоны</div><div class="r">${btn(0, "PRO.tpl('S')", 'Прямой шкаф')}${btn(0, "PRO.tpl('P')", 'П-образный')}</div>`;
  h += `<div class="sub">Двери</div><div class="r">${btn(S.doors.kind === 'none', "PRO.doors('none')", 'Без дверей')}${btn(S.doors.kind === 'swing', "PRO.doors('swing')", 'Распашные')}${btn(S.doors.kind === 'sliding', "PRO.doors('sliding')", 'Купе')}</div>`;
  if (S.doors.kind !== 'none') {
    h += stepper('Количество', 'doors.n', S.doors.n, 1, 'шт');
    for (let i = 0; i < S.doors.n; i++) h += `<div class="r"><span>Дверь ${i + 1}</span><select onchange="PRO.fill(${i},this.value)">${Object.keys(FILLS).map(k => `<option value="${k}" ${S.doors.fills[i] === k ? 'selected' : ''}>${FILLS[k]}</option>`).join('')}</select></div>`;
    if (S.doors.fills.slice(0, S.doors.n).includes('glass')) { const gd = doorList(S).find(d => d.fill === 'glass' && d.zone === 'main'); h += stepper('Рамка вокруг стекла', 'doors.gf', S.doors.gf || 4, 1) + `<div class="note">Меньше рамка — больше стекло.${gd ? ' Стекло одной двери: ' + mm(gd.w - 2 * (S.doors.gf || 4)) + '×' + mm(gd.h - 2 * (S.doors.gf || 4)) + ' мм.' : ''}</div>`; }
    if (S.doors.fills.slice(0, S.doors.n).includes('laco')) h += `<div class="r"><span>Лакобель</span><div class="sw">${LACO.map((c, i) => `<button type="button" class="swb ${S.doors.laco === i ? 'on' : ''}" style="background:${c[1]}" title="${c[0]}" onclick="PRO.laco(${i})"></button>`).join('')}</div></div>`;
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
  let h = `<div class="sh">Отсек ${i + 1}</div>` + stepper('Ширина', 'col.w', c.w, 1);
  h += `<div class="r">${btn(0, `PRO.moveCol(${i},-1)`, '◀')}${btn(0, `PRO.moveCol(${i},1)`, '▶')}${btn(0, `PRO.dupCol(${i})`, 'Копия')}${btn(0, `PRO.toggleGap(${i})`, 'Сделать проёмом')}${btn(0, `PRO.delCol(${i})`, 'Удалить')}${btn(0, 'PRO.global()', '✕ Весь шкаф')}</div>`;
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
  if (it.type === 'drawers') { h += stepper('Ящиков', 'item.n', it.n, 1, 'шт') + stepper('Высота фасада', 'item.fh', it.fh, 1); h += `<div class="r"><span>Система</span><select onchange="PRO.sys(this.value)">${Object.keys(DRAWER_SYS).map(k => `<option value="${k}" ${it.sys === k ? 'selected' : ''}>${DRAWER_SYS[k].ru}</option>`).join('')}</select></div>`; }
  if (it.type === 'shoe') h += stepper('Полок', 'item.n', it.n, 1, 'шт');
  if (it.type === 'basket') h += stepper('Высота корзины', 'item.h', it.h, 1);
  if (it.type === 'vpanel') h += stepper('Верх панели', 'item.y1', it.y1, 1) + stepper('Положение от левого края', 'item.x', it.x, 1);
  h += `<div class="r">${btn(0, 'PRO.moveItemCol(-1)', '◀ в левый отсек')}${btn(0, 'PRO.moveItemCol(1)', 'в правый ▶')}</div>`;
  h += `<div class="r">${btn(0, 'PRO.dupItem()', 'Копия')}${btn(0, 'PRO.delItem()', 'Удалить')}${btn(0, `PRO.selCol(${f.ci})`, '✕ К отсеку')}</div>`;
  return h;
}
const mm = v => Math.round(v * 10);
function sideMezz() {
  const m = S.mezzes[sel.mi]; if (!m) return sideGlobal(); const g = geom(S);
  let h = `<div class="sh">Антресоль ${sel.mi + 1}</div><div class="note">Отдельная коробка. Тащите её в 3D вбок и вверх или задайте цифрами.</div>`;
  h += `<div class="r"><span>Двери</span><select onchange="PRO.mfill(this.value)">${Object.keys(FILLS).map(k => `<option value="${k}" ${(m.fill || 'dsp') === k ? 'selected' : ''}>${FILLS[k]}</option>`).join('')}</select></div>`;
  if ((m.fill || 'dsp') === 'glass') h += stepper('Рамка вокруг стекла', 'doors.gf', S.doors.gf || 4, 1);
  h += stepper('От левого края', 'mz.x', m.x, 1) + stepper('Ширина', 'mz.w', m.w, 1) + stepper('Высота', 'mz.h', m.h, 1) + stepper('Низ от пола', 'mz.y', m.y, 1) + stepper('Дверок', 'mz.n', m.n, 1, 'шт') + stepper('Полок', 'mz.shelves', m.shelves, 1, 'шт');
  h += `<div class="r"><span>Сдвиг</span>${btn(0, 'PRO.mezzMove(-10,0)', '◀ 10')}${btn(0, 'PRO.mezzMove(-1,0)', '◀ 1')}${btn(0, 'PRO.mezzMove(1,0)', '1 ▶')}${btn(0, 'PRO.mezzMove(10,0)', '10 ▶')}</div>`;
  h += `<div class="r"><span>Высота</span>${btn(0, 'PRO.mezzMove(0,-10)', '▼ 10')}${btn(0, 'PRO.mezzMove(0,-1)', '▼ 1')}${btn(0, 'PRO.mezzMove(0,1)', '▲ 1')}${btn(0, 'PRO.mezzMove(0,10)', '▲ 10')}</div>`;
  h += `<div class="sub">Быстро поставить</div><div class="r">${btn(0, 'PRO.mezzFull()', '↔ На всю ширину')}${g.cols.map((c, i) => btn(0, `PRO.mezzOver(${i})`, (c.gap ? 'над проёмом ' : 'над отсеком ') + (i + 1))).join('')}</div>`;
  h += `<div class="r">${btn(0, 'PRO.dupMezz()', 'Копия')}${btn(0, 'PRO.delMezz()', 'Удалить')}${btn(0, 'PRO.global()', '✕ Весь шкаф')}</div>`;
  return h;
}
function sidePanel() {
  const p = S.panels[sel.pi]; if (!p) return sideGlobal();
  let h = `<div class="sh">Панель ${sel.pi + 1}</div><div class="note">${FILLS[p.kind]} · ${mm(p.w)}×${mm(p.h)} мм · ${p.mount === 'front' ? 'на фасаде' : 'на стене'}. Тащите её в 3D или задайте цифрами.</div>`;
  h += `<div class="r"><span>Материал</span><select onchange="PRO.pKind(this.value)">${['mirror', 'film', 'sand', 'glass', 'laco', 'dsp'].map(k => `<option value="${k}" ${p.kind === k ? 'selected' : ''}>${FILLS[k]}</option>`).join('')}</select></div>`;
  h += `<div class="r"><span>Где</span>${btn(p.mount !== 'front', "PRO.pMount('wall')", 'На стене')}${btn(p.mount === 'front', "PRO.pMount('front')", 'На фасаде')}</div>`;
  h += stepper('От левого края', 'pn.x', p.x, 1) + stepper('Низ от пола', 'pn.y', p.y, 1) + stepper('Ширина', 'pn.w', p.w, 1) + stepper('Высота', 'pn.h', p.h, 1);
  h += `<div class="r">${btn(!!p.frame, 'PRO.pFrame()', 'Алюминиевая рамка')}</div>`;
  if (p.frame) h += stepper('Рамка (профиль)', 'pn.fw', p.fw || 3, 1);
  h += `<div class="r"><span>Сдвиг</span>${btn(0, 'PRO.panelMove(-10,0)', '◀ 10')}${btn(0, 'PRO.panelMove(-1,0)', '◀ 1')}${btn(0, 'PRO.panelMove(1,0)', '1 ▶')}${btn(0, 'PRO.panelMove(10,0)', '10 ▶')}</div>`;
  h += `<div class="r"><span>Высота</span>${btn(0, 'PRO.panelMove(0,-10)', '▼ 10')}${btn(0, 'PRO.panelMove(0,-1)', '▼ 1')}${btn(0, 'PRO.panelMove(0,1)', '▲ 1')}${btn(0, 'PRO.panelMove(0,10)', '▲ 10')}</div>`;
  h += `<div class="r">${btn(0, 'PRO.panelOverDoors()', 'Закрыть весь фасад')}${btn(0, 'PRO.dupPanel()', 'Копия')}${btn(0, 'PRO.delPanel()', 'Удалить')}${btn(0, 'PRO.global()', '✕ Весь шкаф')}</div>`;
  return h;
}
function renderSide() {
  const box = $('side'); if (!box) return;
  if (VIEW) { box.innerHTML = sideView(); return; }
  box.innerHTML = sel.k === 'item' ? sideItem() : (sel.k === 'col' ? sideCol() : (sel.k === 'mezz' ? sideMezz() : (sel.k === 'panel' ? sidePanel() : sideGlobal())));
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
  e.innerHTML = w.length ? w.map(x => `<div>⚠ ${esc(x)}</div>`).join('') : '<div class="ok">✔ Всё размещено, пересечений нет</div>';
}
let odT = null;
function refresh(full) {
  if (full !== false) { recalcW(S); save(); try { history.replaceState(null, '', location.pathname + '#p=' + encodeState(S)); } catch (e) {} }
  if (K) { K.update(S); K.select(selMeta()); }
  renderSide(); renderPrice(); renderWarn();
  if (OWNER && full !== false) { clearTimeout(odT); odT = setTimeout(renderOwner, 350); }
}

/* ---------- 3D ---------- */
async function init3D() {
  const mod = await import('/static/js/shkaf-pro-3d.js?v=1');
  K = mod.createPro3D($('p3d'), VIEW ? {} : {
    onSelect: s => { sel = !s ? { k: 'global' } : (s.k === 'item' ? { k: 'item', id: s.id, col: s.col } : (s.k === 'col' ? { k: 'col', i: s.i } : (s.k === 'mezz' ? { k: 'mezz', mi: s.i } : (s.k === 'panel' ? { k: 'panel', pi: s.i } : { k: 'global' })))); refresh(false); },
    onDrag: (s, dy, hx, dx) => {
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
  if (!drawMod) drawMod = await import('/static/js/shkaf-pro-draw.js?v=1');
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
function fullscreen() { const b = $('p3dBox'); const rq = b.requestFullscreen || b.webkitRequestFullscreen; if (rq) { try { rq.call(b); } catch (e) {} } else b.classList.toggle('full'); }

window.PRO = {
  set: setVal, nu: nudge, hold, add: addItem, delItem, dupItem, moveItemCol, addCol, dupCol, delCol, moveCol, eqCols, even: evenShelves,
  color: setColor, custom: setCustom, selCol: selectCol, selItem: selectItem, global: selectGlobal,
  tier: i => mutate(() => { S.tier = i; }), t: v => mutate(() => { S.t = v; }), name: v => mutate(() => { S.name = String(v).slice(0, 60); }, true),
  addPanel, delPanel, dupPanel, panelMove, panelOverDoors, selPanel: selectPanel, pKind: v => mutate(() => { const p = S.panels[sel.pi]; if (p) p.kind = v; }), pMount: v => mutate(() => { const p = S.panels[sel.pi]; if (p) p.mount = v; }), pFrame: () => mutate(() => { const p = S.panels[sel.pi]; if (p) p.frame = !p.frame; }),
  mfill: v => mutate(() => { const m = S.mezzes[sel.mi]; if (m) m.fill = v; }), addMezz, delMezz, dupMezz, mezzFull, mezzOver, mezzMove, selMezz: selectMezz, addGap, toggleGap, tpl: loadTemplate, doors: setDoors, fill: setFill, laco: i => mutate(() => { S.doors.laco = i; }),
  handles: () => mutate(() => { S.doors.handles = S.doors.handles === false; }), led: () => mutate(() => { S.led = !S.led; }),
  sys: v => mutate(() => { const f = findItem(sel.id); if (f) f.it.sys = v; }),
  toggleDoors: () => { if (K) { K.toggleDoors(); setTimeout(renderSide, 50); } }, openAll: on => { if (K) { K.toggleDoors(on); setTimeout(renderSide, 50); } },
  rot: on => { if (K) K.setRotate(on); }, undo: doUndo, redo: doRedo, lead: sendLead, share: () => copy(location.origin + '/shkaf/pro#p=' + encodeState(S), 'Ссылка на проект скопирована'),
  client: mode => { const url = location.origin + '/shkaf/view#p=' + encodeState(S); if (mode === 'tg') window.open('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent('Ваш шкаф в 3D — можно крутить и открывать двери:'), '_blank', 'noopener'); else copy(url, 'Ссылка для клиента скопирована — только просмотр ✔'); },
  print: ownerPrint, owner: ownerUnlock, full: fullscreen,
  reset: () => { if (confirm('Начать заново с шаблона?')) mutate(() => { S = defState(); sel = { k: 'global' }; }); }
};

S = load();
if (VIEW) document.body.classList.add('view');
init3D().catch(e => { console.warn(e); const l = $('p3dLoad'); if (l) l.textContent = '3D недоступно в этом браузере'; });
refresh(false);
ownerBoot();
if (/[?&]master\b/.test(location.search) && !VIEW) setTimeout(() => { if (!OWNER) ownerUnlock(); }, 600);
