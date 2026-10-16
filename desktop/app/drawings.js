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

// ---------------------------------------------------------------- аксонометрия шкафа (вид 45° сбоку и сверху)
// Камера спереди-слева-сверху: видны левые, верхние и передние грани. Детали рисуются от дальних к ближним
// (порядок по разделяющим плоскостям), размеры — вдоль осей, номера деталей — выноски к таблице.
const AZ = Math.PI / 4, EL = Math.atan(1 / Math.SQRT2);   // 45° вокруг вертикали, ≈35° сверху (изометрия)
const R = [Math.cos(AZ), 0, Math.sin(AZ)], U = [Math.sin(AZ) * Math.sin(EL), Math.cos(EL), -Math.cos(AZ) * Math.sin(EL)];
const prj = (x, y, z) => [x * R[0] + z * R[2], x * U[0] + y * U[1] + z * U[2]];
function behind(a, b) {   // a целиком дальше b от зрителя (зритель: −x, +y, +z)
  const t = 0.01;
  return a.x >= b.x + b.w - t || a.y + a.h <= b.y + t || a.z + a.d <= b.z + t;
}
function paintOrder(items) {
  const n = items.length, after = items.map(() => []), deg = new Array(n).fill(0);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && behind(items[i], items[j]) && !behind(items[j], items[i])) { after[i].push(j); deg[j]++; }
  const out = [], q = [];
  const depth = i => { const it = items[i]; return -(it.x + it.w / 2) + (it.y + it.h / 2) + (it.z + it.d / 2); };
  for (let i = 0; i < n; i++) if (!deg[i]) q.push(i);
  const used = new Array(n).fill(false);
  while (out.length < n) {
    if (!q.length) { let k = -1; for (let i = 0; i < n; i++) if (!used[i] && (k < 0 || depth(i) < depth(k))) k = i; q.push(k); }   // цикл — по глубине
    q.sort((a, b) => depth(a) - depth(b));
    const i = q.shift(); if (used[i]) continue; used[i] = true; out.push(items[i]);
    for (const j of after[i]) if (--deg[j] === 0 && !used[j]) q.push(j);
  }
  return out;
}
const shade = (hex, k) => { const c = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(c >> 16)},${f((c >> 8) & 255)},${f(c & 255)})`; };
// iso: { svg, scale } — items: детали, numOf: id → номер выноски (или null), hide: id → не рисовать (фасады на втором виде)
function isoView(items, { x0, y0, s, colorOf, numOf, hidden = new Set() }) {
  const P = (x, y, z) => { const [a, b] = prj(x, y, z); return [x0 + a * s, y0 - b * s]; };
  const poly = pts => pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
  let g = '';
  const shown = paintOrder(items.filter(i => !hidden.has(i.id)));
  for (const i of shown) {
    const X0 = i.x, X1 = i.x + i.w, Y0 = i.y, Y1 = i.y + i.h, Z0 = i.z, Z1 = i.z + i.d, base = colorOf(i) || '#f1efe9';
    const top = [P(X0, Y1, Z0), P(X1, Y1, Z0), P(X1, Y1, Z1), P(X0, Y1, Z1)];
    const front = [P(X0, Y0, Z1), P(X1, Y0, Z1), P(X1, Y1, Z1), P(X0, Y1, Z1)];
    const left = [P(X0, Y0, Z0), P(X0, Y0, Z1), P(X0, Y1, Z1), P(X0, Y1, Z0)];
    g += `<polygon points="${poly(left)}" fill="${shade(base, 0.82)}" stroke="${INK}" stroke-width=".7" stroke-linejoin="round"/>`;
    g += `<polygon points="${poly(front)}" fill="${shade(base, 0.95)}" stroke="${INK}" stroke-width=".7" stroke-linejoin="round"/>`;
    g += `<polygon points="${poly(top)}" fill="${shade(base, 1.04)}" stroke="${INK}" stroke-width=".7" stroke-linejoin="round"/>`;
  }
  // выноски: точка на самой заметной видимой грани детали; номера раздвигаются, чтобы не налезали друг на друга
  const placed = [];
  for (const i of shown) {
    const n = numOf(i); if (n == null) continue;
    const thin = i.w <= i.h && i.w <= i.d ? 'x' : i.h <= i.d ? 'y' : 'z';
    const c = thin === 'x' ? P(i.x, i.y + i.h * 0.55, i.z + i.d * 0.5) : thin === 'y' ? P(i.x + i.w * 0.5, i.y + i.h, i.z + i.d * 0.55) : P(i.x + i.w * 0.5, i.y + i.h * 0.5, i.z + i.d);
    let lx = c[0] + 10, ly = c[1] - 10;
    for (let k = 0; k < 12 && placed.some(([px, py]) => Math.hypot(px - lx, py - ly) < 16); k++) { ly -= 9; lx += 7; }
    placed.push([lx, ly]);
    g += `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="1.6" fill="#1f5fb4"/><path d="M${c[0].toFixed(1)} ${c[1].toFixed(1)}L${lx.toFixed(1)} ${ly.toFixed(1)}" stroke="#1f5fb4" stroke-width=".5"/><g><circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="7.5" fill="#fff" stroke="#1f5fb4"/><text x="${lx.toFixed(1)}" y="${(ly + 3.4).toFixed(1)}" font-size="9" text-anchor="middle" fill="#1f5fb4" font-weight="600">${n}</text></g>`;
  }
  return { g, P };
}
// размер вдоль оси на аксонометрии: от a до b (мировые точки), сдвиг off (мировой вектор), подпись
function isoDim(P, a, b, off, text, color = INK) {
  const A = P(a[0] + off[0], a[1] + off[1], a[2] + off[2]), B = P(b[0] + off[0], b[1] + off[1], b[2] + off[2]);
  const a0 = P(...a), b0 = P(...b);
  let ang = Math.atan2(B[1] - A[1], B[0] - A[0]) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
  const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
  return `<path d="M${a0[0].toFixed(1)} ${a0[1].toFixed(1)}L${A[0].toFixed(1)} ${A[1].toFixed(1)}M${b0[0].toFixed(1)} ${b0[1].toFixed(1)}L${B[0].toFixed(1)} ${B[1].toFixed(1)}" stroke="${color}" stroke-width=".45" opacity=".7"/>` +
    `<path d="M${A[0].toFixed(1)} ${A[1].toFixed(1)}L${B[0].toFixed(1)} ${B[1].toFixed(1)}" stroke="${color}" stroke-width=".8" marker-start="url(#ar)" marker-end="url(#ar)"/>` +
    `<text x="${mx.toFixed(1)}" y="${my.toFixed(1)}" dy="-3" font-size="10.5" font-weight="600" text-anchor="middle" fill="${color}" transform="rotate(${ang.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)})">${text}</text>`;
}
// Лист шкафа: слева — собранный (с фасадами), справа — без фасадов (видно полки, ящики, перегородки); размеры и выноски
export function isoModuleSVG(items, { colorOf = () => null, numOf = () => null, isFront = () => false, width = 1100, height = 640 } = {}) {
  const b = extents(items), W = b.x1 - b.x0, H = b.y1 - b.y0, D = b.z1 - b.z0;
  const fronts = new Set(items.filter(isFront).map(i => i.id));
  const corners = []; for (const x of [b.x0, b.x1]) for (const y of [b.y0, b.y1]) for (const z of [b.z0, b.z1]) corners.push(prj(x, y, z));
  const xs = corners.map(c => c[0]), ys = corners.map(c => c[1]);
  const pw = Math.max(...xs) - Math.min(...xs), ph = Math.max(...ys) - Math.min(...ys);
  const two = fronts.size > 0, cols = two ? 2 : 1, pad = 95;
  const s = Math.min((width / cols - 2 * pad) / pw, (height - 2 * pad - 20) / ph);
  let g = '';
  for (let k = 0; k < cols; k++) {
    const cx = width / cols * k + width / cols / 2, cy = height / 2 + 5;
    const x0 = cx - (Math.min(...xs) + pw / 2) * s, y0 = cy + (Math.min(...ys) + ph / 2) * s;
    const v = isoView(items, { x0, y0, s, colorOf, numOf: k === 0 && two ? (i => (fronts.has(i.id) ? numOf(i) : null)) : (i => numOf(i)), hidden: k === 1 ? fronts : new Set() });
    g += v.g;
    const P = v.P, o = 55 / s;   // отступ размерных линий ~55 px
    // габариты: ширина — по переднему нижнему ребру, высота — по левому переднему, глубина — по левому нижнему
    g += isoDim(P, [b.x0, b.y0, b.z1], [b.x1, b.y0, b.z1], [0, 0, o], f(W));
    g += isoDim(P, [b.x0, b.y0, b.z1], [b.x0, b.y1, b.z1], [-o * 0.8, 0, 0], f(H));
    g += isoDim(P, [b.x0, b.y0, b.z0], [b.x0, b.y0, b.z1], [-o, 0, 0], f(D));
    if (k === cols - 1) {
      // цепочки: уровни горизонтальных деталей (по высоте от низа) и положение вертикальных (по ширине) — на правом заднем ребре
      const lv = [...new Set(items.filter(i => i.h < i.w && i.h < i.d && !fronts.has(i.id)).flatMap(i => [r1(i.y - b.y0), r1(i.y + i.h - b.y0)]))].sort((a, c) => a - c);
      for (let j = 1; j < lv.length; j++) if (lv[j] - lv[j - 1] > 25) g += isoDim(P, [b.x1, b.y0 + lv[j - 1], b.z0], [b.x1, b.y0 + lv[j], b.z0], [o * 0.6, 0, -o * 0.3], f(lv[j] - lv[j - 1]), '#1f5fb4');
      const vx = [...new Set(items.filter(i => i.w < i.h && i.w < i.d).flatMap(i => [r1(i.x - b.x0), r1(i.x + i.w - b.x0)]))].sort((a, c) => a - c);
      for (let j = 1; j < vx.length; j++) if (vx[j] - vx[j - 1] > 25) g += isoDim(P, [b.x0 + vx[j - 1], b.y1, b.z0], [b.x0 + vx[j], b.y1, b.z0], [0, o * 0.45, -o * 0.3], f(vx[j] - vx[j - 1]), '#1f5fb4');
    }
    g += `<text x="${width / cols * k + 14}" y="22" font-size="12" font-weight="600" fill="#5a5348">${two ? (k === 0 ? 'Вид 45° — в сборе' : 'Вид 45° — без фасадов (видно внутреннее)') : 'Вид 45°'}</text>`;
  }
  g += `<text x="14" y="${height - 10}" font-size="10.5" fill="#5a5348">Размеры в мм · чёрные — габарит, синие — цепочки: высоты между горизонтальными деталями и ширины между вертикальными · номера — детали из таблицы</text>`;
  return wrap(width, height, g);
}
function r1(v) { return Math.round(v * 10) / 10; }
