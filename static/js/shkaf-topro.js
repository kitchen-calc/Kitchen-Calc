/* Проект калькулятора шкафов (/shkaf) → состояние конструктора PRO (shkaf-pro-core.js).
   Нужен режиму мастера на /shkaf: по этому состоянию строятся чертежи и раскрой (shkaf-pro-draw.js),
   ссылка клиенту (/shkaf/view#p=…) и «Открыть в PRO» (/shkaf/pro#p=…). Все размеры — в сантиметрах.
   ctx: { walls: [см], widths(wi) → ширины секций стены, plan(gi, n) → {rods, shelves, drawers, shoes, pant, dsys, xt} } */
(function () {
  const T = 1.6, PL = 8, Y0 = PL + T;           // как в wardrobe3d.js: цоколь 8, ЛДСП 16 мм
  const r1 = v => Math.round(v * 10) / 10;
  const FILL = { dsp: 'dsp', glass: 'glass', mirror: 'mirror', film: 'film', laco: 'laco', sand: 'sand', combo: 'mirror' };
  const MIR = { plain: 'mirror', film: 'film', sand: 'sand', led: 'mirror' };

  /* наполнение секции — те же правила раскладки, что в 3D (wardrobe3d.js → section) */
  function items(sec, y1, dsysDef) {
    const out = [], dsys = i => (sec.dsys && sec.dsys[i] && sec.dsys[i] !== 'tier') ? sec.dsys[i] : dsysDef;
    let floor = Y0;
    for (let k = 0; k < Math.min(sec.drawers | 0, 6); k++) { out.push({ type: 'drawer', y: r1(floor), fh: 18, sys: dsys(k) }); floor += 18; }
    (sec.xt || []).forEach(kx => {
      if (kx === 'basket') { out.push({ type: 'basket', y: r1(floor), h: 24 }); floor += 26; }
      else if (kx === 'leather' || kx === 'access' || kx === 'shoe_box') { const h = kx === 'shoe_box' ? 20 : 17; out.push({ type: 'drawer', y: r1(floor), fh: h, sys: dsysDef }); floor += h + 1; }
      else if (kx === 'shoe_rot') { out.push({ type: 'shoe', y: r1(floor), n: 3 }); floor += 38; }
      else if (kx === 'trouser') out.push({ type: 'pant', y: r1(y1 - 60) });
    });
    const shoes = Math.min(sec.shoes | 0, 4);
    if (shoes) { out.push({ type: 'shoe', y: r1(floor), n: Math.min(6, shoes) }); floor += Math.max(15 * shoes, 12 * shoes); }
    let hangBottom = y1;
    if ((sec.pant | 0) > 0) { out.push({ type: 'rod', y: r1(y1 - 12) }); hangBottom = y1 - 96; }   // пантограф — штанга с лифтом
    else if ((sec.rods | 0) >= 2 && y1 - Y0 > 190) { out.push({ type: 'rod', y: r1(y1 - 9) }, { type: 'rod', y: r1(y1 - 107) }); hangBottom = y1 - 183; }
    else if ((sec.rods | 0) >= 1) { const drop = Math.min(130, y1 - floor - 40); out.push({ type: 'rod', y: r1(y1 - 9) }); hangBottom = y1 - 9 - Math.max(40, drop) - 6; }
    const hasHang = (sec.pant | 0) || (sec.rods | 0);
    const ns = Math.max(sec.shelves | 0, (!hasHang && !(sec.drawers | 0) && !(sec.shoes | 0)) ? 3 : 0);
    const fb = floor + 3, ft = Math.max(fb + 12, hangBottom - 2);
    for (let k = 1; k <= ns; k++) out.push({ type: 'shelf', y: r1(fb + (ft - fb) * k / (ns + 1)) });
    return out;
  }
  // ширины отсеков PRO (без перегородок) из наружных ширин секций: снаружи = t·(n+1) + Σw
  function colW(outer, total) { const n = outer.length, inner = total - (n + 1) * T, sum = outer.reduce((a, b) => a + b, 0) || 1; return outer.map(v => r1(Math.max(15, v * inner / sum))); }
  // секции прихожей (как в 3D: hallWardrobe)
  const hallPlan = (i, ns) => ({ rods: i === 0 ? 1 : (i === 1 ? 2 : 0), shelves: i === 0 ? 1 : 3, drawers: i === ns - 1 && ns > 1 ? 2 : 0, shoes: 0, pant: 0 });

  function base(M) {
    const hw = M.hw || {}, ok = v => (v && v !== 'tier' && v !== 'hinge') ? v : '';
    return {
      v: 2, t: 1.6, plinth: PL, tier: M.tier | 0, color: M.color | 0, custom: M.customColor && /^#[0-9a-f]{6}$/i.test(M.customColor.hex || '') ? M.customColor.hex : null,
      cols: [], mezzes: [], panels: [], units: [], beds: [], objs: [], opens: [],
      doors: { kind: 'none', n: 3, fills: ['dsp', 'dsp', 'dsp', 'dsp', 'dsp', 'dsp', 'dsp', 'dsp'], laco: M.laco | 0, handles: true, gf: M.gf || 4, mp: 'frame' },
      hw: { hinge: ok(hw.hinge), open: ok(hw.open), drawer: ok(M.drawerSys), lift: ok(hw.lift), slide: ok(hw.sys), pant: ok(hw.pant), rod: ok(hw.rod) },
      led: !!M.led, nb: false, nsl: false, nsr: false
    };
  }
  function room(S, M, W, D, H) { S.room = { W: r1(Math.max(150, W + 60)), D: r1(Math.max(150, D + 120)), H: r1(Math.max(260, H + 10)), ox: 0, oz: 0, rot: 0, mag: true, poly: null, set: true, view: '', fin: M.fin || null }; }
  const mezzDir = M => (M.hw && M.hw.lift && M.hw.lift !== 'hinge') ? 'U' : 'swing';
  function mirrorPanel(M, x, y, w, h) {
    return { x: r1(x), y: r1(y), w: r1(w), h: r1(h), kind: MIR[M.mirror.type] || 'mirror', mount: 'wall', frame: true, fw: 1.5, shape: 'rect', bl: M.mirror.type === 'led', pz: 0 };
  }

  function kupe(M, ctx, dsysDef) {
    const S = base(M), ha = M.antresol > 0 ? M.antresol : 0, Hb = M.H - ha, n = M.doors;
    S.name = 'Шкаф-купе ' + M.W + '×' + M.H; S.W = M.W; S.H = Hb; S.D = M.D;
    const ws = colW(ctx.widths(0), M.W);
    S.cols = ws.map((w, i) => ({ w, items: items(ctx.plan(i, n), Hb - T, dsysDef) }));
    S.doors.kind = 'sliding'; S.doors.n = n; S.doors.fills = M.fills.slice(0, n).map(f => FILL[f] || 'dsp');
    if (ha) { const dn = Math.max(2, Math.ceil(M.W / 60)); S.mezzes.push({ x: 0, w: M.W, h: ha, y: Hb, n: dn, shelves: 0, fill: 'dsp', div: [], cd: [], dir: Array(dn).fill(mezzDir(M)) }); }
    room(S, M, M.W, M.D, M.H);
    return S;
  }

  function wardrobe(M, ctx, dsysDef) {
    const S = base(M), walls = ctx.walls, H = M.H, D = M.D, y1 = H - T;
    S.name = 'Гардеробная ' + walls.join('×'); S.H = H; S.D = D; S.nb = true;   // открытая система без задней стенки
    let gi = 0;
    const total = walls.reduce((a, _, wi) => a + ctx.widths(wi).length, 0);
    walls.forEach((Lw, wi) => {
      const ws = ctx.widths(wi);
      if (wi === 0) { colW(ws, Lw).forEach(w => { S.cols.push({ w, items: items(ctx.plan(gi, total), y1, dsysDef) }); gi++; }); return; }
      // стены Б (слева) и В (справа) — отдельные секции у боковых стен, лицом в комнату
      let acc = 0;
      ws.forEach(w => {
        const rot = wi === 1 ? 90 : 270, x = wi === 1 ? 0 : walls[0] - D;
        S.cols.push({ w: r1(Math.max(15, w - 2 * T)), items: items(ctx.plan(gi, total), y1, dsysDef), det: { x: r1(x), z: r1(D + acc), rot } });
        acc += w; gi++;
      });
    });
    if (M.mirror && M.mirror.on) {
      if (M.shape === 'U') S.panels.push(Object.assign(mirrorPanel(M, 0, 30, M.mirror.W, Math.min(M.mirror.H, H - 10)), { mount: 'free', fp: { x: r1(walls[0] - 2), z: r1(D + (walls[2] || 0) + 30), rot: 270 } }));
      else S.panels.push(mirrorPanel(M, walls[0] + 25, 30, M.mirror.W, Math.min(M.mirror.H, H - 10)));
    }
    room(S, M, walls[0] + (M.mirror && M.mirror.on && M.shape !== 'U' ? M.mirror.W + 40 : 0), Math.max(D, (walls[1] || 0) + D, (walls[2] || 0) + D), H);
    return S;
  }

  // скамья: открытая тумба 45 см (сиденье, 2 боковины, полка под обувь)
  const bench = (x, w) => ({ kind: 'low', x: r1(x), z: 0, rot: 0, y: 0, w: r1(w), d: 38, h: 45, n: 1, dn: 0, back: false, fill: 'dsp' });
  // шкаф прихожей → отсеки: у купе — по числу дверей, у распашного — одна дверь на отсек
  function hallCols(M, w, H, doors, mirrorDoor, dsysDef) {
    const ns = Math.max(1, doors | 0), ws = colW(Array(ns).fill(w.W / ns), w.W);
    return ws.map((cw, i) => {
      const c = { w: cw, items: items(hallPlan(i, ns), H - T, dsysDef) };
      if (w.kind !== 'sliding') { c.dn = 1; c.dd = i % 2 === 0 ? 'L' : 'R'; if (mirrorDoor && i === ns - 1) c.df = 'mirror'; }
      return c;
    });
  }
  function hall(M, ctx, dsysDef) {
    const S = base(M), h = M.hall, w = h.wardrobe, GAP = 6;
    S.name = 'Прихожая'; S.D = w.D;
    S.doors.kind = w.kind === 'sliding' ? 'sliding' : 'swing';
    if (h.shape === 'line') {
      let x = 0; S.H = w.H;
      const items0 = [];
      if (w.on) items0.push({ k: 'w', w: w.W });
      if (h.hanger.on || h.bench.on) items0.push({ k: 'h', w: Math.max(h.hanger.on ? h.hanger.W : 0, h.bench.on ? h.bench.W : 0) });
      if (h.shoe.on || (M.mirror && M.mirror.on)) items0.push({ k: 's', w: Math.max(h.shoe.on ? h.shoe.W : 0, M.mirror && M.mirror.on ? M.mirror.W + 16 : 0) });
      items0.forEach(it => {
        if (it.k === 'w') {
          S.cols = hallCols(M, w, w.H, w.doors, w.mirrorDoor, dsysDef);
          if (w.kind === 'sliding') { S.doors.n = w.doors; S.doors.fills = Array.from({ length: 8 }, (_, i) => w.mirrorDoor && i === w.doors - 1 ? 'mirror' : 'dsp'); }
          if (h.antresol.on) { const aw = Math.min(h.antresol.W, w.W), dn = Math.max(2, Math.ceil(aw / 60)); S.mezzes.push({ x: 0, w: aw, h: h.antresol.H, y: w.H, n: dn, shelves: 0, fill: 'dsp', div: [], cd: [], dir: Array(dn).fill(mezzDir(M)) }); }
        } else if (it.k === 'h') {
          if (h.hanger.on) {
            const hx = x + (it.w - h.hanger.W) / 2;
            S.panels.push({ x: r1(hx), y: 87, w: r1(h.hanger.W), h: 118, kind: 'dsp', mount: 'wall', frame: false, fw: 3, shape: 'rect', bl: false, pz: 0 });
            S.objs.push({ kind: 'shelf', x: r1(hx - 2), z: 0, rot: 0, y: 205, w: r1(h.hanger.W + 4), d: 28, h: 2, n: 0, dn: 0, back: false, fill: 'dsp' });
          }
          if (h.bench.on) S.objs.push(bench(x + (it.w - h.bench.W) / 2, h.bench.W));
        } else {
          const Hs = h.shoe.on ? 20 * h.shoe.tiers + 10 : 0;
          if (h.shoe.on) S.units.push({ x: r1(x + (it.w - h.shoe.W) / 2), pz: 0, w: r1(h.shoe.W), h: r1(Hs), d: 26, kind: 'flap', n: Math.min(8, h.shoe.tiers | 0), fill: 'dsp', seat: false, legs: PL });
          if (M.mirror && M.mirror.on) S.panels.push(mirrorPanel(M, x + (it.w - M.mirror.W) / 2, Hs + 12, M.mirror.W, M.mirror.H));
        }
        x += it.w + GAP;
      });
      if (!S.cols.length) { S.cols = [{ w: 15, gap: true, items: [] }, { w: 15, items: [] }]; S.H = 100; }   // без шкафа: пустой отсек-заглушка
      room(S, M, Math.max(80, x - GAP), 60, Math.max(w.H, 220));
      return S;
    }
    // Г / П: шкафы вокруг ниши; ниша — проём, антресоль над ней
    const U = h.shape === 'U', right = (h.side || 'right') === 'right', H = w.H, ha = h.antresol.on ? h.antresol.H : 0;
    const Hn = H - ha, Hw = U ? H - ha : H, Wn = h.niche.W, W1 = w.W, W2 = U ? h.wardrobe2.W : 0;
    S.H = Hw;
    const c1 = w.on ? hallCols(M, w, Hw, w.doors, w.mirrorDoor, dsysDef) : [], c2 = U && w.on ? hallCols(M, Object.assign({}, w, { W: W2 }), Hw, h.wardrobe2.doors, false, dsysDef) : [];
    const gap = { w: r1(Wn - (c1.length ? T : 0) - (c2.length ? T : 0)), gap: true, items: [] };
    let xN;
    if (U) { S.cols = c1.concat([gap], c2); xN = W1; } else if (right) { S.cols = [gap].concat(c1); xN = 0; } else { S.cols = c1.concat([gap]); xN = W1; }
    if (!S.cols.some(c => !c.gap)) S.cols.push({ w: 15, items: [] });
    if (w.kind === 'sliding') { const n = (w.on ? w.doors : 0) + (U && w.on ? h.wardrobe2.doors : 0); S.doors.n = Math.max(1, Math.min(8, n)); S.doors.fills = Array.from({ length: 8 }, (_, i) => w.mirrorDoor && i === w.doors - 1 ? 'mirror' : 'dsp'); }
    if (h.niche.slats) S.panels.push({ x: r1(xN), y: 0, w: r1(Wn), h: r1(Hn), kind: 'slats', mount: 'wall', frame: false, fw: 3, shape: 'rect', bl: false, sw: 100, sd: 32, sg: 20, so: 'v', pz: 0 });
    if (h.bench.on) S.objs.push(bench(xN + 2, Wn - 4));
    if (h.shoe.on && !h.bench.on) S.objs.push({ kind: 'rack', x: r1(xN + 2), z: 0, rot: 0, y: 0, w: r1(Wn - 4), d: 28, h: r1(20 * Math.min(h.shoe.tiers, 6)), n: Math.max(0, Math.min(h.shoe.tiers, 6) - 1), dn: 0, back: false, fill: 'dsp' });
    if (h.hanger.on) S.objs.push({ kind: 'shelf', x: r1(xN + 2), z: 0, rot: 0, y: r1(Hn - 26), w: r1(Wn - 4), d: 28, h: 2, n: 0, dn: 0, back: false, fill: 'dsp' });
    if (M.mirror && M.mirror.on) { const mw = Math.min(M.mirror.W, Wn - 14), mh = Math.max(30, Math.min(M.mirror.H, Hn - 130)); S.panels.push(mirrorPanel(M, xN + (Wn - mw) / 2, h.bench.on ? 62 : 30, mw, mh)); }
    if (ha) {
      const aw = U ? W1 + Wn + W2 : Wn, dn = U ? Math.max(1, Math.round(Wn / 60)) + (w.doors | 0) + (h.wardrobe2.doors | 0) : Math.max(2, Math.ceil(aw / 60));
      S.mezzes.push({ x: U ? 0 : r1(xN), w: r1(aw), h: ha, y: r1(H - ha), n: Math.min(10, dn), shelves: 0, fill: 'dsp', div: [], cd: [], dir: Array(Math.min(10, dn)).fill(mezzDir(M)) });
    }
    room(S, M, W1 + Wn + W2, w.D, H);
    return S;
  }

  window.shkafToPro = function (M, ctx) {
    const dsysDef = M.drawerSys && M.drawerSys !== 'tier' ? M.drawerSys : 'tier';
    const S = M.type === 'kupe' ? kupe(M, ctx, dsysDef) : (M.type === 'wardrobe' ? wardrobe(M, ctx, dsysDef) : hall(M, ctx, dsysDef));
    if (S.cols.length > 14) S.cols = S.cols.slice(0, 14);   // PRO держит до 14 отсеков
    const n = S.cols.filter(c => !c.det).length;
    S.W = r1(T * (n + 1) + S.cols.filter(c => !c.det).reduce((a, c) => a + c.w, 0));
    return S;
  };
  // та же упаковка, что encodeState в shkaf-pro-core.js
  window.shkafProEncode = S => btoa(unescape(encodeURIComponent(JSON.stringify(S)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
})();
