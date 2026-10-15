// Чертежи сборок: шкаф в трёх видах (спереди, слева, сверху) и общий вид проекта (фасад + план).
// Детали проецируются прямоугольниками; ближние закрывают дальние, а все контуры ещё раз наносятся
// тонким пунктиром — так видно, что спрятано за дверями (полки, ящики, перегородки).
const f = v => String(Math.round(v * 10) / 10).replace('.', ',');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const INK = '#1d1a16';

function extents(items) {
  const b = { x0: Infinity, y0: Infinity, z0: Infinity, x1: -Infinity, y1: -Infinity, z1: -Infinity };
  for (const i of items) {
    b.x0 = Math.min(b.x0, i.x); b.y0 = Math.min(b.y0, i.y); b.z0 = Math.min(b.z0, i.z);
    b.x1 = Math.max(b.x1, i.x + i.w); b.y1 = Math.max(b.y1, i.y + i.h); b.z1 = Math.max(b.z1, i.z + i.d);
  }
  return b;
}
// Вид: какие оси идут вправо и вверх, по какой оси «глубина» (кто ближе — рисуется позже)
const VIEWS = {
  front: { name: 'Вид спереди', h: 'x', v: 'y', depth: i => i.z + i.d },
  left: { name: 'Вид слева', h: 'z', v: 'y', depth: i => -i.x },
  top: { name: 'Вид сверху', h: 'x', v: 'z', vFlip: true, depth: i => i.y + i.h },
};
const AX = { x: ['x', 'w'], y: ['y', 'h'], z: ['z', 'd'] };

function fillOf(i, matColor) {
  if (['door', 'drawerFront'].includes(i.kind)) return matColor || '#efe4d2';
  if (i.mat === 'hdf3') return '#eceae4';
  return '#ffffff';
}
function dimH(x0, x1, y, text, side = 1) {
  return `<path d="M${x0} ${y - 6 * side}V${y + 6 * side}M${x1} ${y - 6 * side}V${y + 6 * side}M${x0} ${y}H${x1}" stroke="${INK}" stroke-width=".8" marker-start="url(#ar)" marker-end="url(#ar)"/>` +
    `<text x="${(x0 + x1) / 2}" y="${y - 4}" font-size="11.5" text-anchor="middle" font-weight="600">${text}</text>`;
}
function dimV(y0, y1, x, text) {
  return `<path d="M${x - 6} ${y0}H${x + 6}M${x - 6} ${y1}H${x + 6}M${x} ${y0}V${y1}" stroke="${INK}" stroke-width=".8" marker-start="url(#ar)" marker-end="url(#ar)"/>` +
    `<text x="${x - 5}" y="${(y0 + y1) / 2}" font-size="11.5" text-anchor="middle" font-weight="600" transform="rotate(-90 ${x - 5} ${(y0 + y1) / 2})">${text}</text>`;
}

// Один вид: прямоугольники деталей в заданной области листа
function viewSVG(items, b, view, ox, oy, s, colorOf) {
  const V = VIEWS[view], [hk, hs] = AX[V.h], [vk, vs] = AX[V.v];
  const H0 = b[V.h + '0'], V0 = b[V.v + '0'], V1 = b[V.v + '1'];
  const rect = i => {
    const x = ox + (i[hk] - H0) * s, w = i[hs] * s;
    const y = V.vFlip ? oy + (i[vk] - V0) * s : oy + (V1 - (i[vk] + i[vs])) * s, h = i[vs] * s;
    return { x, y, w: Math.max(w, 0.6), h: Math.max(h, 0.6) };
  };
  let g = '';
  for (const i of [...items].sort((a, c) => V.depth(a) - V.depth(c))) {
    const r = rect(i);
    g += `<rect x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.w.toFixed(1)}" height="${r.h.toFixed(1)}" fill="${fillOf(i, colorOf(i))}" stroke="${INK}" stroke-width="1"/>`;
  }
  for (const i of items) {   // скрытые контуры
    const r = rect(i);
    g += `<rect x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.w.toFixed(1)}" height="${r.h.toFixed(1)}" fill="none" stroke="#8a8378" stroke-width=".5" stroke-dasharray="3 2.5"/>`;
  }
  return g;
}

const defs = `<defs><marker id="ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 2L10 5L0 8" fill="none" stroke="${INK}"/></marker></defs>`;
const wrap = (W, H, g) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Segoe UI, Arial, sans-serif" fill="${INK}">${defs}<rect width="100%" height="100%" fill="#fff"/>${g}</svg>`;

// Шкаф: три вида в одном масштабе, габариты на каждом
export function moduleSVG(items, { colorOf = () => null, width = 1000, height = 660 } = {}) {
  const b = extents(items), W = b.x1 - b.x0, H = b.y1 - b.y0, D = b.z1 - b.z0;
  const m = 70, gap = 90;
  // два варианта раскладки — выбираем тот, где чертёж крупнее: «Г» (сверху — под фасадом) или три вида в ряд
  const sL = Math.min((width - 2 * m - gap) / (W + D), (height - 2 * m - gap - 20) / (H + D));
  const sRow = Math.min((width - 2 * m - 2 * gap) / (W + D + W), (height - 2 * m - 20) / Math.max(H, D));
  const row = sRow > sL, s = row ? sRow : sL;
  const fx = m, fy = m, sx = m + W * s + gap;
  const tx = row ? sx + D * s + gap : fx, ty = row ? fy : m + H * s + gap;
  let g = '';
  g += viewSVG(items, b, 'front', fx, fy, s, colorOf);
  g += viewSVG(items, b, 'left', sx, fy, s, colorOf);
  g += viewSVG(items, b, 'top', tx, ty, s, colorOf);
  const lbl = (x, y, t) => `<text x="${x}" y="${y}" font-size="12" font-weight="600" fill="#5a5348">${t}</text>`;
  g += lbl(fx, fy - 40, 'Вид спереди') + lbl(sx, fy - 40, 'Вид слева') + lbl(tx, ty - (row ? 40 : 30), 'Вид сверху');
  g += dimH(fx, fx + W * s, fy + H * s + 28, f(W)) + dimV(fy, fy + H * s, fx - 30, f(H));
  g += dimH(sx, sx + D * s, fy + H * s + 28, f(D)) + dimV(fy, fy + H * s, sx + D * s + 30, f(H));
  g += row ? dimH(tx, tx + W * s, ty + D * s + 28, f(W)) + dimV(ty, ty + D * s, tx + W * s + 30, f(D)) : dimV(ty, ty + D * s, fx - 30, f(D));
  // уровни снизу: цоколь/ножки, корпус, верх — по горизонтальным деталям
  const levels = [...new Set(items.filter(i => i.h < i.w && i.h < i.d).map(i => Math.round(i.y - b.y0)))].sort((a, c) => a - c);
  const ly = y => fy + (H - y) * s;
  levels.slice(0, 12).forEach(y => { g += `<path d="M${fx + W * s + 4} ${ly(y)}h10" stroke="#1f5fb4" stroke-width=".8"/><text x="${fx + W * s + 17}" y="${ly(y) + 3.5}" font-size="9.5" fill="#1f5fb4">${f(y)}</text>`; });
  g += `<text x="${m}" y="${height - 10}" font-size="10.5" fill="#5a5348">Размеры в мм · пунктир — детали, скрытые за фасадами · синие отметки — высота полок и днищ от низа шкафа</text>`;
  return wrap(width, height, g);
}

// Общий вид проекта: фасад всей мебели с цепочкой размеров по шкафам и план сверху
export function overviewSVG(items, groups, { colorOf = () => null, width = 1000, height = 700 } = {}) {
  const b = extents(items), W = b.x1 - b.x0, H = b.y1 - b.y0, D = b.z1 - b.z0;
  const m = 80, gap = 140;
  // план под фасадом или справа от него — где крупнее
  const sStack = Math.min((width - 2 * m) / W, (height - 2 * m - gap - 40) / (H + D));
  const sSide = Math.min((width - 2 * m - gap) / (2 * W), (height - 2 * m - 100) / Math.max(H, D));
  const side = sSide > sStack, s = side ? sSide : sStack;
  const fx = m, fy = m, tx = side ? fx + W * s + gap : fx, ty = side ? fy : m + H * s + gap;
  let g = viewSVG(items, b, 'front', fx, fy, s, colorOf) + viewSVG(items, b, 'top', tx, ty, s, colorOf);
  g += `<text x="${fx}" y="${fy - 50}" font-size="12" font-weight="600" fill="#5a5348">Общий вид спереди</text><text x="${tx}" y="${ty - (side ? 50 : 36)}" font-size="12" font-weight="600" fill="#5a5348">План (вид сверху)</text>`;
  // подписи шкафов и цепочка ширин
  const mods = groups.map(gr => ({ gr, b: extents(items.filter(i => i.g === gr.id)) })).filter(x => isFinite(x.b.x0)).sort((a, c) => a.b.x0 - c.b.x0);
  mods.forEach((md, k) => {
    const cx = fx + ((md.b.x0 + md.b.x1) / 2 - b.x0) * s, cy = fy + (b.y1 - md.b.y1) * s;
    g += `<g><circle cx="${cx}" cy="${cy - 16}" r="10" fill="#fff" stroke="#1f5fb4"/><text x="${cx}" y="${cy - 12}" font-size="11" text-anchor="middle" fill="#1f5fb4">${k + 1}</text></g>`;
    const upper = md.b.y0 >= b.y0 + 300;   // верхние шкафы подписываем у стены, нижние — у фасада
    const tcx = tx + ((md.b.x0 + md.b.x1) / 2 - b.x0) * s, tcy = ty + ((upper ? md.b.z0 + 80 : md.b.z1 - 60) - b.z0) * s;
    g += `<text x="${tcx}" y="${tcy + 4}" font-size="11" text-anchor="middle" fill="#1f5fb4">${k + 1}</text>`;
  });
  // цепочка по нижним и верхним шкафам отдельно (у них разные ряды)
  const rows = [mods.filter(md => md.b.y0 < b.y0 + 300), mods.filter(md => md.b.y0 >= b.y0 + 300)];
  rows.forEach((row, ri) => {
    const y = ri === 0 ? fy + H * s + 30 : fy - 26;
    row.forEach(md => { g += dimH(fx + (md.b.x0 - b.x0) * s, fx + (md.b.x1 - b.x0) * s, y, f(md.b.x1 - md.b.x0)); });
  });
  g += dimH(fx, fx + W * s, fy + H * s + 62, 'Общая ширина ' + f(W));
  g += dimV(fy, fy + H * s, fx - 34, f(H)) + dimV(ty, ty + D * s, tx - 34, f(D));
  g += `<text x="${m}" y="${height - 10}" font-size="10.5" fill="#5a5348">Размеры в мм · номера — шкафы из таблицы ниже · пунктир — скрытые детали</text>`;
  return { svg: wrap(width, height, g), order: mods.map(md => md.gr.id) };
}
