// Фрезеровки: готовые шаблоны (ручки, соединения, пазы, декор фасада, вырезы под технику).
// Каждый шаблон превращается в обычные операции обработки (отверстия, вырезы, скосы) — они видны в 3D, на чертеже и в списке.
const r1 = v => Math.round(v * 10) / 10;

// Торец E: t — вдоль торца, d — расстояние от торца внутрь детали → координаты пласти (u, v)
function edge(fr, E) {
  const { SU, SV } = fr;
  const map = { U0: (t, d) => [d, t], U1: (t, d) => [SU - d, t], V0: (t, d) => [t, d], V1: (t, d) => [t, SV - d] }[E];
  return { len: E[0] === 'U' ? SV : SU, at: map };
}
// Прямоугольник у торца: от t0 до t1 вдоль, от d0 до d1 внутрь → вырез
function rect(fr, E, t0, t1, d0, d1) {
  const e = edge(fr, E), a = e.at(t0, d0), b = e.at(t1, d1);
  return { u: r1(Math.min(a[0], b[0])), v: r1(Math.min(a[1], b[1])), cw: r1(Math.abs(b[0] - a[0])), ch: r1(Math.abs(b[1] - a[1])) };
}
const cut = (face, R, depth, through, r = 0) => ({ type: 'cut', face, ...R, r: Math.min(r, R.cw / 2, R.ch / 2), depth: through ? 0 : depth, through, angle: 0 });
const holeFace = (face, u, v, dia, depth, through) => ({ type: 'hole', face, u: r1(u), v: r1(v), dia, depth: through ? 0 : depth, through, count: 1, step: 32, dir: 'u' });
const holeEdge = (E, s, o, dia, depth) => ({ type: 'hole', face: E, s: r1(s), o: r1(o), dia, depth, count: 1, step: 32, dir: 'u', through: false });
// Позиции вдоль торца: n штук, крайние — на from от концов
const spots = (len, from, n) => (n <= 1 ? [len / 2] : Array.from({ length: n }, (_, k) => from + (len - 2 * from) * k / (n - 1)));

const EDGE = { k: 'E', label: 'Торец', edge: true, def: 'V1' };
const FACE = { k: 'face', label: 'Сторона', face: true, def: 'A' };
const n = (k, label, def) => ({ k, label, def });

export const MILL_CATS = [['handles', 'Ручки'], ['joints', 'Соединения'], ['grooves', 'Пазы и четверти'], ['decor', 'Декор фасада'], ['wall', 'Стеновые панели'], ['other', 'Вырезы под технику и прочее']];
export const MILLS = [
  // ---- ручки
  { id: 'notch', cat: 'handles', name: 'Полукруглая выборка на торце', desc: 'Сквозной полукруглый вырез по краю фасада — ручка без фурнитуры.',
    params: [EDGE, n('w', 'Ширина, мм', 120), n('h', 'Глубина выборки, мм', 35)],
    gen: (fr, p) => { const e = edge(fr, p.E), t = e.len / 2; return [cut('A', rect(fr, p.E, t - p.w / 2, t + p.w / 2, -p.h, p.h), 0, true, p.h)]; } },
  { id: 'finger', cat: 'handles', name: 'Выборка под пальцы с обратной стороны', desc: 'Паз по всей кромке с тыльной стороны: фасад открывают, поддев пальцами.',
    params: [EDGE, n('h', 'Ширина выборки, мм', 30), n('dp', 'Глубина, мм', 10)],
    gen: (fr, p) => { const e = edge(fr, p.E); return [cut('B', rect(fr, p.E, -1, e.len + 1, -1, p.h), p.dp, false)]; } },
  { id: 'jprofile', cat: 'handles', name: 'J-ручка (фрезерованный профиль)', desc: 'Глубокая выборка с тыльной стороны и скос кромки — встроенная ручка по всей длине.',
    params: [EDGE, n('h', 'Высота профиля, мм', 25), n('lip', 'Остаётся толщины, мм', 6), n('deg', 'Скос кромки, °', 30)],
    gen: (fr, p) => { const e = edge(fr, p.E); return [cut('B', rect(fr, p.E, -1, e.len + 1, -1, p.h), Math.max(1, fr.T - p.lip), false), { type: 'bevel', edge: p.E, side: 'B', deg: p.deg }]; } },
  { id: 'slot', cat: 'handles', name: 'Сквозная овальная прорезь', desc: 'Прорезь для пальцев недалеко от края.',
    params: [EDGE, n('w', 'Длина, мм', 120), n('h', 'Высота, мм', 30), n('off', 'От торца, мм', 40)],
    gen: (fr, p) => { const t = edge(fr, p.E).len / 2; return [cut('A', rect(fr, p.E, t - p.w / 2, t + p.w / 2, p.off, p.off + p.h), 0, true, p.h / 2)]; } },
  { id: 'ring', cat: 'handles', name: 'Круглое отверстие-ручка', desc: 'Сквозное отверстие для пальца.',
    params: [EDGE, n('dia', 'Диаметр, мм', 30), n('off', 'От торца до центра, мм', 40)],
    gen: (fr, p) => { const e = edge(fr, p.E), [u, v] = e.at(e.len / 2, p.off); return [holeFace('A', u, v, p.dia, 0, true)]; } },
  { id: 'shell', cat: 'handles', name: 'Врезная ручка-ракушка', desc: 'Карман под врезную ручку.',
    params: [EDGE, n('w', 'Длина, мм', 100), n('h', 'Ширина, мм', 40), n('dp', 'Глубина, мм', 10), n('off', 'От торца, мм', 50)],
    gen: (fr, p) => { const t = edge(fr, p.E).len / 2; return [cut('A', rect(fr, p.E, t - p.w / 2, t + p.w / 2, p.off, p.off + p.h), p.dp, false, p.h / 2)]; } },
  { id: 'bevelHandle', cat: 'handles', name: 'Скос кромки под ручку', desc: 'Кромка срезана под углом с тыльной стороны — за неё удобно браться.',
    params: [EDGE, n('deg', 'Угол, °', 45)],
    gen: (fr, p) => [{ type: 'bevel', edge: p.E, side: 'B', deg: p.deg }] },
  // ---- соединения
  { id: 'minifix', cat: 'joints', name: 'Эксцентрик (Minifix): комплект', desc: 'Чашка Ø15 в пласти на 34 мм от торца и отверстие Ø8 в торце под шток.',
    params: [{ ...EDGE, def: 'U0' }, n('cnt', 'Количество', 2), n('from', 'От концов, мм', 50), n('off', 'Чашка от торца, мм', 34)],
    gen: (fr, p) => { const e = edge(fr, p.E); return spots(e.len, p.from, p.cnt | 0).flatMap(t => { const [u, v] = e.at(t, p.off); return [holeFace('B', u, v, 15, 12.5, false), holeEdge(p.E, t, fr.T / 2, 8, p.off)]; }); } },
  { id: 'dowel', cat: 'joints', name: 'Шканты в торец', desc: 'Отверстия Ø8 в торце под деревянные шканты.',
    params: [{ ...EDGE, def: 'U0' }, n('cnt', 'Количество', 3), n('from', 'От концов, мм', 32), n('dia', 'Диаметр, мм', 8), n('dp', 'Глубина, мм', 30)],
    gen: (fr, p) => spots(edge(fr, p.E).len, p.from, p.cnt | 0).map(t => holeEdge(p.E, t, fr.T / 2, p.dia, p.dp)) },
  { id: 'dowelFace', cat: 'joints', name: 'Шканты в пласть (ответные)', desc: 'Отверстия Ø8 в пласти — пара к шкантам в торце соседней детали.',
    params: [{ ...EDGE, def: 'U0' }, n('cnt', 'Количество', 3), n('from', 'От концов, мм', 32), n('off', 'От торца, мм', 8), n('dp', 'Глубина, мм', 12)],
    gen: (fr, p) => { const e = edge(fr, p.E); return spots(e.len, p.from, p.cnt | 0).map(t => { const [u, v] = e.at(t, p.off); return holeFace('B', u, v, 8, p.dp, false); }); } },
  { id: 'confEdge', cat: 'joints', name: 'Конфирматы в торец Ø7×50', desc: 'Отверстия под евровинт в торце.',
    params: [{ ...EDGE, def: 'U0' }, n('cnt', 'Количество', 2), n('from', 'От концов, мм', 50)],
    gen: (fr, p) => spots(edge(fr, p.E).len, p.from, p.cnt | 0).map(t => holeEdge(p.E, t, fr.T / 2, 7, 50)) },
  { id: 'confFace', cat: 'joints', name: 'Конфирматы в пласть Ø5 (сквозные)', desc: 'Сквозные отверстия в пласти на половине толщины соседней детали от торца.',
    params: [{ ...EDGE, def: 'U0' }, n('cnt', 'Количество', 2), n('from', 'От концов, мм', 50), n('off', 'От торца, мм', 8)],
    gen: (fr, p) => { const e = edge(fr, p.E); return spots(e.len, p.from, p.cnt | 0).map(t => { const [u, v] = e.at(t, p.off); return holeFace('A', u, v, 5, 0, true); }); } },
  { id: 'lamello', cat: 'joints', name: 'Ламели (бисквит / Clamex) в пласть', desc: 'Пазы 56×4 под ламели — соединение без видимого крепежа.',
    params: [{ ...EDGE, def: 'U0' }, n('cnt', 'Количество', 3), n('from', 'От концов, мм', 60), n('off', 'От торца до паза, мм', 8), n('dp', 'Глубина, мм', 10)],
    gen: (fr, p) => { const e = edge(fr, p.E); return spots(e.len, p.from, p.cnt | 0).map(t => cut('B', rect(fr, p.E, t - 28, t + 28, p.off - 2, p.off + 2), p.dp, false, 2)); } },
  // ---- пазы и четверти
  { id: 'rebate', cat: 'grooves', name: 'Четверть по кромке', desc: 'Ступенька по всей кромке — под заднюю стенку, стекло или накладку.',
    params: [EDGE, FACE, n('w', 'Ширина, мм', 10), n('dp', 'Глубина, мм', 8)],
    gen: (fr, p) => { const e = edge(fr, p.E); return [cut(p.face, rect(fr, p.E, -1, e.len + 1, -1, p.w), p.dp, false)]; } },
  { id: 'grooveHdf', cat: 'grooves', name: 'Паз под ХДФ / стекло', desc: 'Паз вдоль кромки с отступом — задняя стенка или стекло вставляются в него.',
    params: [{ ...EDGE, def: 'U0' }, { ...FACE, def: 'B' }, n('off', 'От торца, мм', 10), n('w', 'Ширина паза, мм', 4), n('dp', 'Глубина, мм', 8)],
    gen: (fr, p) => { const e = edge(fr, p.E); return [cut(p.face, rect(fr, p.E, -1, e.len + 1, p.off, p.off + p.w), p.dp, false)]; } },
  { id: 'led', cat: 'grooves', name: 'Паз под LED-профиль', desc: 'Паз под алюминиевый профиль со светодиодной лентой.',
    params: [EDGE, { ...FACE, def: 'B' }, n('off', 'От торца, мм', 30), n('w', 'Ширина, мм', 12), n('dp', 'Глубина, мм', 8)],
    gen: (fr, p) => { const e = edge(fr, p.E); return [cut(p.face, rect(fr, p.E, -1, e.len + 1, p.off, p.off + p.w), p.dp, false)]; } },
  { id: 'cableGroove', cat: 'grooves', name: 'Кабель-канал (паз под провод)', desc: 'Паз для провода по детали.',
    params: [EDGE, { ...FACE, def: 'B' }, n('off', 'От торца, мм', 50), n('w', 'Ширина, мм', 10), n('dp', 'Глубина, мм', 8)],
    gen: (fr, p) => { const e = edge(fr, p.E); return [cut(p.face, rect(fr, p.E, -1, e.len + 1, p.off, p.off + p.w), p.dp, false, p.w / 2)]; } },
  // ---- декор фасада
  { id: 'frame', cat: 'decor', name: 'Рамка (классика)', desc: 'Фрезерованная канавка по контуру фасада.',
    params: [n('off', 'Отступ от края, мм', 60), n('w', 'Ширина канавки, мм', 6), n('dp', 'Глубина, мм', 3)],
    gen: (fr, p) => { const a = p.off, b = p.off + p.w, U = fr.SU, V = fr.SV; return [
      cut('A', { u: a, v: a, cw: r1(U - 2 * a), ch: p.w }, p.dp, false), cut('A', { u: a, v: r1(V - b), cw: r1(U - 2 * a), ch: p.w }, p.dp, false),
      cut('A', { u: a, v: a, cw: p.w, ch: r1(V - 2 * a) }, p.dp, false), cut('A', { u: r1(U - b), v: a, cw: p.w, ch: r1(V - 2 * a) }, p.dp, false)]; } },
  { id: 'panel', cat: 'decor', name: 'Филёнка (выборка в центре)', desc: 'Центр фасада углублён — рамочный вид из цельной плиты.',
    params: [n('off', 'Ширина рамки, мм', 70), n('dp', 'Глубина, мм', 2), n('r', 'Скругление углов, мм', 10)],
    gen: (fr, p) => [cut('A', { u: p.off, v: p.off, cw: r1(fr.SU - 2 * p.off), ch: r1(fr.SV - 2 * p.off) }, p.dp, false, p.r)] },
  { id: 'hgrooves', cat: 'decor', name: 'Горизонтальные пазы (рельеф)', desc: 'Ряд параллельных канавок поперёк фасада.',
    params: [n('step', 'Шаг, мм', 60), n('w', 'Ширина, мм', 6), n('dp', 'Глубина, мм', 3)],
    gen: (fr, p) => { const out = []; for (let v = p.step; v < fr.SV - p.w / 2; v += p.step) out.push(cut('A', { u: -1, v: r1(v - p.w / 2), cw: fr.SU + 2, ch: p.w }, p.dp, false)); return out; } },
  { id: 'vgrooves', cat: 'decor', name: 'Вертикальные пазы (под рейку)', desc: 'Ряд вертикальных канавок — вид реечного фасада.',
    params: [n('step', 'Шаг, мм', 40), n('w', 'Ширина, мм', 5), n('dp', 'Глубина, мм', 4)],
    gen: (fr, p) => { const out = []; for (let u = p.step; u < fr.SU - p.w / 2; u += p.step) out.push(cut('A', { u: r1(u - p.w / 2), v: -1, cw: p.w, ch: fr.SV + 2 }, p.dp, false)); return out; } },
  { id: 'vgroovesV', cat: 'decor', name: 'V-образные канавки (скос)', desc: 'Узкие канавки с наклонными стенками — имитация досок.',
    params: [n('step', 'Шаг, мм', 100), n('w', 'Ширина, мм', 8), n('dp', 'Глубина, мм', 4)],
    gen: (fr, p) => { const out = []; for (let u = p.step; u < fr.SU - p.w / 2; u += p.step) out.push(cut('A', { u: r1(u - p.w / 2), v: -1, cw: p.w, ch: fr.SV + 2 }, p.dp, false, p.w / 2)); return out; } },
  { id: 'shaker', cat: 'decor', name: 'Шейкер (широкая рамка, плоская середина)', desc: 'Середина фасада утоплена на 3–5 мм, рамка 60–80 мм — классический «шейкер».',
    params: [n('off', 'Ширина рамки, мм', 70), n('dp', 'Глубина середины, мм', 4)],
    gen: (fr, p) => [cut('A', { u: p.off, v: p.off, cw: r1(fr.SU - 2 * p.off), ch: r1(fr.SV - 2 * p.off) }, p.dp, false, 0)] },
  { id: 'frame2', cat: 'decor', name: 'Двойная рамка', desc: 'Две канавки по контуру — внешняя и внутренняя.',
    params: [n('off', 'Отступ внешней, мм', 40), n('gap', 'Между рамками, мм', 30), n('w', 'Ширина канавки, мм', 5), n('dp', 'Глубина, мм', 3)],
    gen: (fr, p) => [0, 1].flatMap(k => { const a = p.off + k * (p.gap + p.w), U = fr.SU, V = fr.SV; if (U - 2 * a < 20 || V - 2 * a < 20) return [];
      return [cut('A', { u: a, v: a, cw: r1(U - 2 * a), ch: p.w }, p.dp, false), cut('A', { u: a, v: r1(V - a - p.w), cw: r1(U - 2 * a), ch: p.w }, p.dp, false), cut('A', { u: a, v: a, cw: p.w, ch: r1(V - 2 * a) }, p.dp, false), cut('A', { u: r1(U - a - p.w), v: a, cw: p.w, ch: r1(V - 2 * a) }, p.dp, false)]; }) },
  { id: 'flutes', cat: 'decor', name: 'Рифление (полукруглые канавки)', desc: 'Частые вертикальные канавки со скруглённым дном — «флютинг».',
    params: [n('step', 'Шаг, мм', 20), n('w', 'Ширина, мм', 12), n('dp', 'Глубина, мм', 4)],
    gen: (fr, p) => { const out = []; for (let u = p.step / 2; u < fr.SU - p.w / 2; u += p.step) out.push(cut('A', { u: r1(u - p.w / 2), v: -1, cw: p.w, ch: fr.SV + 2 }, p.dp, false, p.w / 2)); return out; } },
  { id: 'grid', cat: 'decor', name: 'Сетка (квадраты)', desc: 'Горизонтальные и вертикальные канавки — фасад в клетку.',
    params: [n('step', 'Размер клетки, мм', 150), n('w', 'Ширина канавки, мм', 5), n('dp', 'Глубина, мм', 3)],
    gen: (fr, p) => { const out = []; for (let u = p.step; u < fr.SU - p.w; u += p.step) out.push(cut('A', { u: r1(u - p.w / 2), v: -1, cw: p.w, ch: fr.SV + 2 }, p.dp, false)); for (let v = p.step; v < fr.SV - p.w; v += p.step) out.push(cut('A', { u: -1, v: r1(v - p.w / 2), cw: fr.SU + 2, ch: p.w }, p.dp, false)); return out; } },
  { id: 'cassettes', cat: 'decor', name: 'Кассеты (несколько филёнок)', desc: 'Фасад делится на одинаковые утопленные прямоугольники.',
    params: [n('nx', 'По ширине, шт', 1), n('ny', 'По высоте, шт', 3), n('frm', 'Рамка / перемычка, мм', 50), n('dp', 'Глубина, мм', 3), n('r', 'Скругление, мм', 6)],
    gen: (fr, p) => { const nx = Math.max(1, p.nx | 0), ny = Math.max(1, p.ny | 0), cw = (fr.SU - p.frm * (nx + 1)) / nx, ch = (fr.SV - p.frm * (ny + 1)) / ny, out = []; if (cw < 20 || ch < 20) return out;
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) out.push(cut('A', { u: r1(p.frm + i * (cw + p.frm)), v: r1(p.frm + j * (ch + p.frm)), cw: r1(cw), ch: r1(ch) }, p.dp, false, p.r)); return out; } },
  { id: 'border', cat: 'decor', name: 'Ступенька по всему контуру', desc: 'Кромка фасада обнижена по периметру — фасад кажется тоньше.',
    params: [n('w', 'Ширина ступеньки, мм', 12), n('dp', 'Глубина, мм', 6)],
    gen: (fr, p) => { const U = fr.SU, V = fr.SV; return [cut('A', { u: -1, v: -1, cw: U + 2, ch: p.w + 1 }, p.dp, false), cut('A', { u: -1, v: r1(V - p.w), cw: U + 2, ch: p.w + 1 }, p.dp, false), cut('A', { u: -1, v: -1, cw: p.w + 1, ch: V + 2 }, p.dp, false), cut('A', { u: r1(U - p.w), v: -1, cw: p.w + 1, ch: V + 2 }, p.dp, false)]; } },
  { id: 'lattice', cat: 'decor', name: 'Решётка (сквозные прорези)', desc: 'Ряд сквозных вертикальных прорезей — для экрана радиатора, обувницы, вентиляции.',
    params: [n('step', 'Шаг, мм', 30), n('w', 'Ширина прорези, мм', 12), n('off', 'Поле по краю, мм', 60)],
    gen: (fr, p) => { const out = []; for (let u = p.off; u + p.w <= fr.SU - p.off; u += p.step) out.push(cut('A', { u: r1(u), v: p.off, cw: p.w, ch: r1(fr.SV - 2 * p.off) }, 0, true, p.w / 2)); return out; } },
  { id: 'arch', cat: 'decor', name: 'Арка (скруглённый верх филёнки)', desc: 'Утопленная середина с большим скруглением углов — мягкий «арочный» вид.',
    params: [n('off', 'Ширина рамки, мм', 60), n('dp', 'Глубина, мм', 3)],
    gen: (fr, p) => { const cw = r1(fr.SU - 2 * p.off), ch = r1(fr.SV - 2 * p.off); return [cut('A', { u: p.off, v: p.off, cw, ch }, p.dp, false, Math.min(cw, ch) / 2)]; } },
  // ---- стеновые панели (большая деталь-панель на стену: рисунок фрезеруется по плите)
  { id: 'wallSlats', cat: 'wall', name: 'Под рейку (глубокие вертикальные пазы)', desc: 'Широкие глубокие пазы с шагом — плита выглядит как рейки на стене.',
    params: [n('step', 'Шаг, мм', 45), n('w', 'Ширина паза, мм', 15), n('dp', 'Глубина, мм', 8)],
    gen: (fr, p) => { const out = []; for (let u = p.step - p.w / 2; u < fr.SU - p.w; u += p.step) out.push(cut('A', { u: r1(u), v: -1, cw: p.w, ch: fr.SV + 2 }, p.dp, false)); return out; } },
  { id: 'wallBoards', cat: 'wall', name: 'Горизонтальные доски (вагонка)', desc: 'V-образные швы поперёк панели — имитация досок.',
    params: [n('step', 'Ширина доски, мм', 120), n('w', 'Ширина шва, мм', 6), n('dp', 'Глубина, мм', 3)],
    gen: (fr, p) => { const out = []; for (let v = p.step; v < fr.SV - p.w; v += p.step) out.push(cut('A', { u: -1, v: r1(v - p.w / 2), cw: fr.SU + 2, ch: p.w }, p.dp, false, p.w / 2)); return out; } },
  { id: 'wallBoiserie', cat: 'wall', name: 'Буазери (рамки на стене)', desc: 'Канавки-рамки по низу и верху стеновой панели — классическая отделка стены.',
    params: [n('nx', 'Рамок по ширине', 2), n('split', 'Низ рамки до, мм', 900), n('off', 'Поля, мм', 80), n('w', 'Ширина канавки, мм', 6), n('dp', 'Глубина, мм', 3)],
    gen: (fr, p) => { const out = [], nx = Math.max(1, p.nx | 0), cw = (fr.SU - p.off * (nx + 1)) / nx; if (cw < 40) return out;
      const rects = [[p.off, Math.min(p.split, fr.SV) - p.off], [Math.min(p.split, fr.SV) + p.off, fr.SV - p.off]].filter(([a, b]) => b - a > 60);
      for (let i = 0; i < nx; i++) for (const [v0, v1] of rects) { const u0 = p.off + i * (cw + p.off), u1 = u0 + cw;
        out.push(cut('A', { u: r1(u0), v: r1(v0), cw: r1(cw), ch: p.w }, p.dp, false), cut('A', { u: r1(u0), v: r1(v1 - p.w), cw: r1(cw), ch: p.w }, p.dp, false), cut('A', { u: r1(u0), v: r1(v0), cw: p.w, ch: r1(v1 - v0) }, p.dp, false), cut('A', { u: r1(u1 - p.w), v: r1(v0), cw: p.w, ch: r1(v1 - v0) }, p.dp, false)); }
      return out; } },
  { id: 'wallTiles', cat: 'wall', name: 'Под плитку / кирпич (швы)', desc: 'Сетка швов со смещением рядов — панель «под кирпич» или крупную плитку.',
    params: [n('tw', 'Длина плитки, мм', 250), n('th', 'Высота плитки, мм', 65), n('w', 'Шов, мм', 5), n('dp', 'Глубина, мм', 3)],
    gen: (fr, p) => { const out = []; let row = 0; for (let v = p.th; v < fr.SV; v += p.th + p.w, row++) { out.push(cut('A', { u: -1, v: r1(v), cw: fr.SU + 2, ch: p.w }, p.dp, false)); const y0 = v - p.th; for (let u = row % 2 ? p.tw / 2 : p.tw; u < fr.SU; u += p.tw + p.w) out.push(cut('A', { u: r1(u), v: r1(Math.max(0, y0)), cw: p.w, ch: r1(Math.min(p.th, v - Math.max(0, y0))) }, p.dp, false)); } return out; } },
  // ---- прочее
  { id: 'vent', cat: 'other', name: 'Вентиляционные прорези', desc: 'Ряд сквозных прорезей — для техники и цоколя.',
    params: [EDGE, n('cnt', 'Количество', 6), n('w', 'Длина, мм', 200), n('h', 'Ширина, мм', 10), n('step', 'Шаг, мм', 25), n('off', 'От торца, мм', 50)],
    gen: (fr, p) => { const t = edge(fr, p.E).len / 2, out = []; for (let k = 0; k < (p.cnt | 0); k++) out.push(cut('A', rect(fr, p.E, t - p.w / 2, t + p.w / 2, p.off + k * p.step, p.off + k * p.step + p.h), 0, true, p.h / 2)); return out; } },
  { id: 'sink', cat: 'other', name: 'Вырез под мойку / варочную панель', desc: 'Сквозной вырез в столешнице по размеру из паспорта техники.',
    params: [{ ...EDGE, def: 'V1', label: 'Передний торец' }, n('w', 'Ширина выреза, мм', 560), n('h', 'Глубина выреза, мм', 490), n('off', 'От переднего края, мм', 60), n('r', 'Радиус углов, мм', 10)],
    gen: (fr, p) => { const t = edge(fr, p.E).len / 2; return [cut('A', rect(fr, p.E, t - p.w / 2, t + p.w / 2, p.off, p.off + p.h), 0, true, p.r)]; } },
  { id: 'tap', cat: 'other', name: 'Отверстие под смеситель Ø35', desc: 'Сквозное отверстие в столешнице.',
    params: [{ ...EDGE, def: 'V0', label: 'От какого торца' }, n('off', 'От торца до центра, мм', 50), n('dia', 'Диаметр, мм', 35)],
    gen: (fr, p) => { const e = edge(fr, p.E), [u, v] = e.at(e.len / 2, p.off); return [holeFace('A', u, v, p.dia, 0, true)]; } },
  { id: 'grommet', cat: 'other', name: 'Отверстие под провода Ø60', desc: 'Под заглушку для кабелей в столешнице или стенке.',
    params: [{ ...EDGE, def: 'V0' }, n('off', 'От торца до центра, мм', 60), n('dia', 'Диаметр, мм', 60)],
    gen: (fr, p) => { const e = edge(fr, p.E), [u, v] = e.at(e.len - 100, p.off); return [holeFace('A', u, v, p.dia, 0, true)]; } },
  { id: 'socketCut', cat: 'other', name: 'Вырез под розетку в стенке', desc: 'Квадратный сквозной вырез 70×70 для розетки или выключателя.',
    params: [n('u', 'X центра, мм', 100), n('v', 'Y центра, мм', 100), n('s', 'Размер, мм', 70)],
    gen: (fr, p) => [cut('A', { u: r1(p.u - p.s / 2), v: r1(p.v - p.s / 2), cw: p.s, ch: p.s }, 0, true, 3)] },
  { id: 'skirting', cat: 'other', name: 'Вырез под плинтус', desc: 'Прямоугольный вырез в нижнем заднем углу боковины — шкаф встаёт к стене вплотную.',
    params: [n('w', 'По глубине, мм', 20), n('h', 'По высоте, мм', 80), n('corner', 'Угол: 0 — задний (слева), 1 — правый', 0)],
    gen: (fr, p) => [cut('A', { u: p.corner ? r1(fr.SU - p.w) : -1, v: -1, cw: r1(p.w + 1), ch: r1(p.h + 1) }, 0, true)] },
];
export const millDefaults = m => Object.fromEntries(m.params.map(p => [p.k, p.def]));
