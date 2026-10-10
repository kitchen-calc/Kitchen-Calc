/* Конструктор шкафа PRO: интерфейс. Модель и расчёт — shkaf-pro-core.js, 3D — shkaf-pro-3d.js, чертежи мастера — shkaf-pro-draw.js */
import * as C from '/static/js/shkaf-pro-core.js?v=1';
const { geom, ext, mkItem, freeY, warnings, buildParts, pricing, PALETTE, LACO, FILLS, ITEM_TYPES, ITEM_ICON, DRAWER_SYS, P, r1, clamp, fitWidth, recalcW, defState, encodeState, decodeState, sanitize } = C;

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
function fixSel() { if (sel.k === 'item' && !findItem(sel.id)) sel = { k: 'global' }; if (sel.k === 'col' && sel.i >= S.cols.length) sel = { k: 'global' }; }
function mutate(fn, noUndo) { if (!noUndo) pushUndo(); fn(); recalcW(S); fixSel(); refresh(); }
function findItem(id) { for (let ci = 0; ci < S.cols.length; ci++) { const it = S.cols[ci].items.find(i => i.id === id); if (it) return { it, ci, col: S.cols[ci] }; } return null; }
const toast = (t) => { const e = $('toast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 2600); };

/* ---------- ввод чисел ---------- */
const RANGE = { W: [60, 800], H: [100, 320], D: [25, 90], plinth: [0, 20], 'mezz.h': [15, 90], 'mezz.n': [0, 8], 'mezz.shelves': [0, 3], 'doors.n': [1, 8], 'col.w': [15, 200], 'item.y': [0, 330], 'item.d': [15, 85], 'item.n': [1, 8], 'item.fh': [8, 40], 'item.h': [10, 40], 'item.y1': [0, 330], 'item.x': [0, 200] };
function stepper(label, path, val, step, unit) {
  return `<div class="r"><span>${esc(label)}</span><span class="stp"><button type="button" onpointerdown="PRO.hold(event,'${path}',${-step})">−</button><input type="number" step="any" value="${r1(val)}" onfocus="this.select()" onchange="PRO.set('${path}',this.value)"><button type="button" onpointerdown="PRO.hold(event,'${path}',${step})">+</button><small>${esc(unit || 'см')}</small></span></div>`;
}
function getVal(path) {
  if (path.startsWith('item.')) { const f = findItem(sel.id); return f ? f.it[path.slice(5)] : 0; }
  if (path === 'col.w') return S.cols[sel.i] ? S.cols[sel.i].w : 0;
  if (path === 'W') return geom(S).W;
  return path.split('.').reduce((o, k) => o[k], S);
}
function setVal(path, v) {
  v = parseFloat(String(v).replace(',', '.')); if (!isFinite(v)) { refresh(); return; }
  const [a, b] = RANGE[path] || [0, 9999]; v = clamp(v, a, b);
  mutate(() => {
    if (path.startsWith('item.')) { const f = findItem(sel.id); if (!f) return; const key = path.slice(5); f.it[key] = ['n'].includes(key) ? Math.round(v) : r1(v); if (key === 'y1' && f.it.y1 <= f.it.y) f.it.y1 = f.it.y + 5; return; }
    if (path === 'col.w') { S.cols[sel.i].w = r1(v); return; }
    if (path === 'W') { const g = geom(S), inner0 = g.W - (S.cols.length + 1) * S.t, inner1 = v - (S.cols.length + 1) * S.t; if (inner1 < S.cols.length * 15) return; S.cols.forEach(c => { c.w = r1(c.w * inner1 / inner0); }); const drift = r1(inner1 - S.cols.reduce((x, c) => x + c.w, 0)); S.cols[S.cols.length - 1].w = r1(S.cols[S.cols.length - 1].w + drift); return; }
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
function selMeta() { return sel.k === 'item' ? { k: 'item', id: sel.id } : (sel.k === 'col' ? { k: 'col', i: sel.i } : (sel.k === 'mezz' || sel.k === 'doors' ? { k: sel.k } : { k: 'global' })); }
const btn = (on, act, txt, cls) => `<button type="button" class="${on ? 'on ' : ''}${cls || ''}" onclick="${act}">${txt}</button>`;
function sideGlobal() {
  const g = geom(S), T = P.tiers;
  let h = `<div class="sh">${esc(S.name)}</div><div class="note">Нажмите на отсек или любой предмет в 3D. Предметы можно тащить: вверх-вниз и в соседний отсек.</div>`;
  h += `<div class="sub">Размеры шкафа</div>` + stepper('Ширина', 'W', g.W, 1) + stepper('Высота', 'H', S.H, 1) + stepper('Глубина', 'D', S.D, 1) + stepper('Цоколь', 'plinth', S.plinth, 1);
  h += `<div class="r"><span>ЛДСП</span>${btn(S.t === 1.6, 'PRO.t(1.6)', '16 мм')}${btn(S.t === 1.8, 'PRO.t(1.8)', '18 мм')}</div>`;
  h += `<div class="sub">Цвет корпуса</div><div class="sw">${PALETTE.map((c, i) => `<button type="button" class="swb ${!S.custom && S.color === i ? 'on' : ''}" style="background:${c[1]}" title="${c[0]}" onclick="PRO.color(${i})"></button>`).join('')}<input type="color" value="${S.custom || '#cdbba0'}" onchange="PRO.custom(this.value)" title="свой цвет"></div>`;
  h += `<div class="r"><span>Класс</span>${T.map((t, i) => btn(S.tier === i, `PRO.tier(${i})`, t.ru)).join('')}</div>`;
  h += `<div class="sub">Отсеки (${S.cols.length})</div><div class="cols">${S.cols.map((c, i) => `<button type="button" class="colchip" onclick="PRO.selCol(${i})">№${i + 1}<b>${Math.round(c.w * 10)}</b><small>${c.items.length} поз.</small></button>`).join('')}</div>`;
  h += `<div class="r">${btn(0, 'PRO.addCol()', '＋ Отсек')}${btn(0, 'PRO.eqCols()', 'Выровнять ширину')}</div>`;
  h += `<div class="sub">Антресоль</div><div class="r">${btn(S.mezz.on, 'PRO.mezz(1)', 'Есть')}${btn(!S.mezz.on, 'PRO.mezz(0)', 'Нет')}</div>`;
  if (S.mezz.on) h += stepper('Высота', 'mezz.h', S.mezz.h, 1) + stepper('Дверок', 'mezz.n', S.mezz.n, 1, 'шт') + stepper('Полок', 'mezz.shelves', S.mezz.shelves, 1, 'шт');
  h += `<div class="sub">Двери</div><div class="r">${btn(S.doors.kind === 'none', "PRO.doors('none')", 'Без дверей')}${btn(S.doors.kind === 'swing', "PRO.doors('swing')", 'Распашные')}${btn(S.doors.kind === 'sliding', "PRO.doors('sliding')", 'Купе')}</div>`;
  if (S.doors.kind !== 'none') {
    h += stepper('Количество', 'doors.n', S.doors.n, 1, 'шт');
    for (let i = 0; i < S.doors.n; i++) h += `<div class="r"><span>Дверь ${i + 1}</span><select onchange="PRO.fill(${i},this.value)">${Object.keys(FILLS).map(k => `<option value="${k}" ${S.doors.fills[i] === k ? 'selected' : ''}>${FILLS[k]}</option>`).join('')}</select></div>`;
    if (S.doors.fills.slice(0, S.doors.n).includes('laco')) h += `<div class="r"><span>Лакобель</span><div class="sw">${LACO.map((c, i) => `<button type="button" class="swb ${S.doors.laco === i ? 'on' : ''}" style="background:${c[1]}" title="${c[0]}" onclick="PRO.laco(${i})"></button>`).join('')}</div></div>`;
    h += `<div class="r">${btn(S.doors.handles !== false, 'PRO.handles()', 'Ручки')}${btn(K && K.isOpen(), 'PRO.toggleDoors()', '↔ Открыть / закрыть двери')}</div>`;
  }
  h += `<div class="sub">Свет</div><div class="r">${btn(S.led, 'PRO.led()', '💡 Общая подсветка')}</div>`;
  h += `<div class="sub">Название</div><div class="r"><input type="text" class="nm" value="${esc(S.name)}" onchange="PRO.name(this.value)"></div>`;
  return h;
}
function addButtons() { return `<div class="grid2">${Object.keys(ITEM_TYPES).map(t => `<button type="button" onclick="PRO.add('${t}')">${ITEM_ICON[t]} ${ITEM_TYPES[t]}</button>`).join('')}</div>`; }
function sideCol() {
  const i = sel.i, c = S.cols[i], g = geom(S), items = c.items.slice().sort((a, b) => ext(b, S)[0] - ext(a, S)[0]);
  let h = `<div class="sh">Отсек ${i + 1}</div>` + stepper('Ширина', 'col.w', c.w, 1);
  h += `<div class="r">${btn(0, `PRO.moveCol(${i},-1)`, '◀')}${btn(0, `PRO.moveCol(${i},1)`, '▶')}${btn(0, `PRO.dupCol(${i})`, 'Копия')}${btn(0, `PRO.delCol(${i})`, 'Удалить')}${btn(0, 'PRO.global()', '✕ Весь шкаф')}</div>`;
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
function renderSide() {
  const box = $('side'); if (!box) return;
  if (VIEW) { box.innerHTML = sideView(); return; }
  box.innerHTML = sel.k === 'item' ? sideItem() : (sel.k === 'col' ? sideCol() : sideGlobal());
}
function sideView() {
  const pr = pricing(S), g = geom(S);
  return `<div class="sh">${esc(S.name)}</div><div class="note">Вращайте камеру. Нажмите на двери, чтобы открыть.</div>
    <div class="r">${btn(0, 'PRO.toggleDoors()', '↔ Открыть / закрыть двери')}</div>
    <div class="sub">Параметры</div>
    <div class="r"><span>Размер</span><b>${mm(g.W)} × ${mm(S.H)} × ${mm(S.D)} мм</b></div>
    <div class="r"><span>Цвет</span><b>${esc(S.custom || PALETTE[S.color][0])}</b></div>
    <div class="r"><span>Отсеков</span><b>${S.cols.length}${S.mezz.on ? ' + антресоль' : ''}</b></div>
    <div class="sub">Стоимость</div><div class="vp">$${fmt(pr.total / USD)}</div><div class="note">Ориентировочно. Точный проект и цена — после замера.</div>
    <div class="r" style="margin-top:12px"><a class="cta" href="tel:+998920934510">📞 Позвонить</a><a class="cta" href="https://t.me/Kitchencalc" target="_blank" rel="noopener">✈ Telegram</a></div>`;
}
function renderPrice() {
  const e = $('price'); if (!e || VIEW) return;
  const bp = buildParts(S), pr = pricing(S, bp);
  e.innerHTML = `<small>Ориентировочная стоимость</small><b>$${fmt(pr.total / USD)}</b><div class="sum">${fmt(pr.total)} сум · ${S.cols.length} отсек., ${bp.parts.reduce((a, p) => a + p.qty, 0)} деталей</div>`;
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
    onSelect: s => { sel = !s ? { k: 'global' } : (s.k === 'item' ? { k: 'item', id: s.id, col: s.col } : (s.k === 'col' ? { k: 'col', i: s.i } : (s.k === 'mezz' || s.k === 'doors' ? { k: 'global' } : { k: 'global' }))); refresh(false); },
    onDrag: (s, dy, hx) => {
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
  const d = { 'Изделие': 'Шкаф (конструктор PRO): ' + S.name, 'Размер': `${mm(g.W)}×${mm(S.H)}×${mm(S.D)} мм`, 'Отсеков': S.cols.length + (S.mezz.on ? ' + антресоль' : ''), 'Двери': { none: 'без дверей', swing: 'распашные', sliding: 'купе' }[S.doors.kind] + (S.doors.kind !== 'none' ? ' ' + S.doors.n : ''), 'Цвет': S.custom || PALETTE[S.color][0], 'Класс': P.tiers[S.tier].ru, 'Ссылка': location.origin + '/shkaf/view#p=' + encodeState(S) };
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
  if (OWNER) { if (confirm('Выйти из режима мастера?')) { try { localStorage.removeItem('kc_owner'); } catch (e) {} ownerApply(false); } return; }
  const key = prompt('Ключ мастера'); if (!key) return;
  if (await ownerVerify(key)) { try { localStorage.setItem('kc_owner', key); } catch (e) {} ownerApply(true); toast('Режим мастера включён'); } else toast('Неверный ключ');
}
async function ownerBoot() { if (VIEW) return; let k = null; try { k = localStorage.getItem('kc_owner'); } catch (e) {} if (k && await ownerVerify(k)) ownerApply(true); }
function ownerApply(on) { OWNER = !!on && !VIEW; const b = $('ownerBox'); if (b) b.style.display = OWNER ? '' : 'none'; const cl = $('clientBtn'); if (cl) cl.style.display = OWNER ? '' : 'none'; if (OWNER) renderOwner(); }
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
  mezz: on => mutate(() => { S.mezz.on = !!on; }), doors: setDoors, fill: setFill, laco: i => mutate(() => { S.doors.laco = i; }),
  handles: () => mutate(() => { S.doors.handles = S.doors.handles === false; }), led: () => mutate(() => { S.led = !S.led; }),
  sys: v => mutate(() => { const f = findItem(sel.id); if (f) f.it.sys = v; }),
  toggleDoors: () => { if (K) { K.toggleDoors(); setTimeout(renderSide, 50); } },
  undo: doUndo, redo: doRedo, lead: sendLead, share: () => copy(location.origin + '/shkaf/pro#p=' + encodeState(S), 'Ссылка на проект скопирована'),
  client: () => copy(location.origin + '/shkaf/view#p=' + encodeState(S), 'Ссылка для клиента скопирована — только просмотр ✔'),
  print: ownerPrint, owner: ownerUnlock, full: fullscreen,
  reset: () => { if (confirm('Начать заново с шаблона?')) mutate(() => { S = defState(); sel = { k: 'global' }; }); }
};

S = load();
if (VIEW) document.body.classList.add('view');
init3D().catch(e => { console.warn(e); const l = $('p3dLoad'); if (l) l.textContent = '3D недоступно в этом браузере'; });
refresh(false);
ownerBoot();
if (/[?&]master\b/.test(location.search) && !VIEW) setTimeout(() => { if (!OWNER) ownerUnlock(); }, 600);
