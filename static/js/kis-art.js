/* Анимированные схемы «как это открывается» для карточек каталога фурнитуры (/calc и /shkaf).
   KISART.art(grp, key) -> svg-строка. Анимация зациклена, при «уменьшить движение» в системе — статичная картинка. */
(function () {
  const CSS = `
.kis-art{width:100%;height:96px;display:block;border-radius:10px;margin:2px 0 2px;background:radial-gradient(120px 80px at 50% 40%,rgba(233,180,76,.10),rgba(255,255,255,0))}
.kis-art .a-box{fill:rgba(255,255,255,.05);stroke:#8d7a4d;stroke-width:1.4}
.kis-art .a-open{fill:none;stroke:#a8935a;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.kis-art .a-ln{fill:none;stroke:#cdbb8a;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.kis-art .a-door{fill:none;stroke:#e9b44c;stroke-width:3.4;stroke-linecap:round}
.kis-art .a-doorf{fill:rgba(233,180,76,.22);stroke:#e9b44c;stroke-width:1.6}
.kis-art .a-dash{fill:none;stroke:#8d7a4d;stroke-width:1;stroke-dasharray:3 3}
.kis-art .a-gold{fill:#e9b44c;stroke:none}
.kis-art .a-sil{fill:#c4c9ce;stroke:none}
.kis-art .a-glass{fill:rgba(150,205,235,.25);stroke:#9fd0ea;stroke-width:1.5}
.kis-art .a-bask{fill:rgba(233,180,76,.12);stroke:#e9b44c;stroke-width:1.3}
.kis-art .a-leather{fill:#6b4630;stroke:#d9b25f;stroke-width:1.2}
.kis-art .a-t{font:700 9px Manrope,Arial,sans-serif;fill:#cbb27a}
.kis-art .a-arrow{fill:none;stroke:#ffe29a;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.k-sw{animation:kswing 3.8s ease-in-out infinite;transform-origin:var(--ox) var(--oy)}
.k-pop{animation:kpop 3.8s ease-in-out infinite;transform-origin:var(--ox) var(--oy)}
.k-sl{animation:kslide 3.8s ease-in-out infinite}
.k-sl2{animation:kslide 3.8s ease-in-out .22s infinite}
.k-rot{animation:krot 8s linear infinite;transform-origin:var(--ox) var(--oy)}
.k-press{animation:kpress 3.8s ease-in-out infinite}
@keyframes kswing{0%,10%{transform:rotate(0)}45%,72%{transform:rotate(var(--a))}100%{transform:rotate(0)}}
@keyframes kpop{0%,12%{transform:rotate(0)}22%,52%{transform:rotate(var(--a))}66%,100%{transform:rotate(0)}}
@keyframes kslide{0%,10%{transform:translate(0,0)}45%,72%{transform:translate(var(--tx,0px),var(--ty,0px))}100%{transform:translate(0,0)}}
@keyframes krot{to{transform:rotate(360deg)}}
@keyframes kpress{0%,8%{transform:translateY(0)}18%,30%{transform:translateY(-8px)}44%,100%{transform:translateY(0)}}
@media (prefers-reduced-motion:reduce){.k-sw,.k-pop,.k-sl,.k-sl2,.k-rot,.k-press{animation:none!important}}
`;
  function css() { if (document.getElementById('kisArtCss')) return; const s = document.createElement('style'); s.id = 'kisArtCss'; s.textContent = CSS; document.head.appendChild(s); }

  const A = (inner, lab) => `<svg class="kis-art" viewBox="0 0 120 84" aria-hidden="true">${inner}${lab ? `<text x="116" y="80" text-anchor="end" class="a-t">${lab}</text>` : ''}</svg>`;
  const G = (cls, vars, inner) => `<g class="${cls}" style="${vars}">${inner}</g>`;
  const O = (x, y, a) => `--ox:${x}px;--oy:${y}px;--a:${a}deg`;
  const L = (x1, y1, x2, y2, c) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${c || 'a-ln'}"/>`;

  /* вид сверху: дверь на петле, открывается наружу (вниз) */
  function hinge(key) {
    const ang = { tier: 110, std_soft: 110, std: 110, eco: 100, black: 110, inset: 107, wide155: 155, wide170: 170, frame: 95, glass: 94 }[key] || 110;
    const px = key === 'inset' ? 27 : 22, ex = key === 'inset' ? 93 : 98, py = 50;
    let door;
    if (key === 'black') door = `<line x1="${px}" y1="${py}" x2="${ex}" y2="${py}" stroke="#e9b44c" stroke-width="6" stroke-linecap="round"/><line x1="${px}" y1="${py}" x2="${ex}" y2="${py}" stroke="#15130f" stroke-width="3.6" stroke-linecap="round"/>`;
    else if (key === 'glass') door = `<line x1="${px}" y1="${py}" x2="${ex}" y2="${py}" stroke="#9fd0ea" stroke-width="3.4" stroke-linecap="round"/>`;
    else if (key === 'frame') door = `<line x1="${px}" y1="${py - 1.6}" x2="${ex}" y2="${py - 1.6}" class="a-door" style="stroke-width:1.5"/><line x1="${px}" y1="${py + 1.6}" x2="${ex}" y2="${py + 1.6}" class="a-door" style="stroke-width:1.5"/>`;
    else door = L(px, py, ex, py, 'a-door');
    const body = key === 'inset' ? `<path class="a-open" d="M22 50V12H98V50"/>` : `<rect class="a-box" x="22" y="12" width="76" height="38"/>`;
    return A(body + `<path class="a-dash" d="M${ex} ${py} A${ex - px} ${ex - px} 0 0 1 ${px + (ex - px) * Math.cos(ang * Math.PI / 180)} ${py + (ex - px) * Math.sin(ang * Math.PI / 180)}"/>` + G('k-sw', O(px, py, ang), door) + `<circle cx="${px}" cy="${py}" r="3.4" class="a-gold"/>`, ang + '°');
  }
  /* ручки на двери */
  function handle(key) {
    const h = { handle_eco: ['#c4c9ce', 6, 1.8, 0], handle_std: ['#e9b44c', 10, 2.4, 2.4], handle_design: ['#f1c862', 15, 3.2, 3] }[key] || ['#c4c9ce', 6, 1.8, 0];
    const bar = `<line x1="86" y1="50" x2="86" y2="${50 + h[1]}" stroke="${h[0]}" stroke-width="${h[2]}" stroke-linecap="round"/>` + (h[3] ? `<circle cx="86" cy="${50 + h[1]}" r="${h[3]}" fill="${h[0]}"/>` : '');
    return A(`<rect class="a-box" x="22" y="12" width="76" height="38"/>` + G('k-sw', O(22, 50, 95), L(22, 50, 98, 50, 'a-door') + bar) + `<circle cx="22" cy="50" r="3.4" class="a-gold"/>`, key === 'handle_eco' ? 'скоба' : (key === 'handle_std' ? 'ручка' : 'дизайн'));
  }
  /* нажимное открывание Blum TIP-ON */
  function tipon(key) {
    const long = key === 'tipon_l', pl = long ? 15 : 9;
    return A(`<rect class="a-box" x="22" y="12" width="76" height="38"/><rect x="86" y="${50 - pl}" width="5" height="${pl}" class="a-sil"/>` +
      G('k-pop', O(22, 50, 14), L(22, 50, 98, 50, 'a-door')) + `<circle cx="22" cy="50" r="3.4" class="a-gold"/>` +
      G('k-press', '', `<path class="a-arrow" d="M70 78V62M64 68L70 62L76 68"/>`), long ? 'TIP-ON L' : 'TIP-ON');
  }
  /* вид сбоку: верхний шкаф и подъёмный механизм */
  function lift(key) {
    if (key === 'hinge') return hinge('std_soft');
    const k = key === 'tier' ? 'hk_top' : key;
    const cfg = { hk_xs: [24, 'HK-XS'], hk_s: [32, 'HK-S'], hk_top: [46, 'HK top'], hf: [50, 'HF'], hf_top: [54, 'HF top'], hs: [46, 'HS'], hl: [46, 'HL'] }[k] || [40, ''];
    const h = cfg[0], y0 = 18, fx = 78, body = `<path class="a-open" d="M${fx} ${y0}H30V${y0 + h}H${fx}"/>` + L(22, 8, 22, 76, 'a-dash');
    const door = (y1, y2) => L(fx, y1, fx, y2, 'a-door');
    let mov;
    if (k === 'hf' || k === 'hf_top') mov = G('k-sw', O(fx, y0, -82), door(y0, y0 + h / 2) + G('k-sw', O(fx, y0 + h / 2, 160), door(y0 + h / 2, y0 + h)));
    else if (k === 'hs') mov = G('k-sw', O(fx, y0, -168), door(y0, y0 + h));
    else if (k === 'hl') mov = G('k-sl', `--ty:-${h + 6}px`, door(y0, y0 + h));
    else mov = G('k-sw', O(fx, y0, -80), door(y0, y0 + h));
    return A(body + mov + `<circle cx="${fx}" cy="${y0}" r="3" class="a-gold"/>`, cfg[1]);
  }
  /* раздвижные двери Cinetto, вид спереди */
  function sliding(key) {
    const sw = { ps40: 0.9, ps06: 1.6, ps48: 2.4, tier: 2.2 }[key] || 2.2;
    return A(`<rect class="a-box" x="10" y="8" width="100" height="68"/>` + L(10, 12, 110, 12, 'a-ln') + L(10, 72, 110, 72, 'a-ln') +
      `<rect x="60" y="14" width="48" height="56" fill="rgba(150,205,235,.12)" stroke="#e9b44c" stroke-width="${sw}"/>` +
      G('k-sl', '--tx:46px', `<rect x="12" y="14" width="48" height="56" fill="rgba(233,180,76,.22)" stroke="#e9b44c" stroke-width="${sw}"/><line x1="22" y1="66" x2="34" y2="20" stroke="#fff" stroke-opacity=".25" stroke-width="3"/>`), key === 'tier' ? '' : key.toUpperCase());
  }
  /* пантограф / штанга */
  function pant(key) {
    const hangers = [30, 50, 70, 90].map(x => `<path d="M${x} 14l-7 12h14z" class="a-bask"/>`).join('');
    const frame = `<rect class="a-box" x="10" y="8" width="100" height="68"/>`;
    if (key === 'cabio' && false) return '';
    return A(frame + G('k-sl', '--ty:26px', L(16, 12, 104, 12, 'a-door') + hangers) + (key === 'cabio_e' ? `<path d="M96 22l-6 10h5l-3 9 9-12h-5l3-7z" class="a-gold"/>` : '') + `<path class="a-arrow" d="M104 36V56M99 51L104 56L109 51"/>`, key === 'cabio_e' ? 'электро' : '');
  }
  function rod() {
    const hangers = [26, 44, 62, 80, 96].map((x, i) => `<path d="M${x} 28l-7 ${26 + (i % 2) * 6}h14z" class="a-bask"/>`).join('');
    return A(`<rect class="a-box" x="10" y="8" width="100" height="68"/>` + L(14, 26, 106, 26, 'a-door') + hangers);
  }
  /* Cabio: модули */
  function cabio(key) {
    if (key === 'trouser') return A(`<rect class="a-box" x="10" y="8" width="100" height="68"/>` + L(18, 14, 18, 70, 'a-dash') +
      G('k-sl', '--tx:-34px', L(104, 12, 104, 56, 'a-door') + [0, 1, 2, 3, 4].map(i => `<line x1="104" y1="${18 + i * 8}" x2="80" y2="${18 + i * 8}" class="a-ln"/><rect x="80" y="${18 + i * 8}" width="7" height="${16 - i}" class="a-bask"/>`).join('')));
    if (key === 'shoe_rot') return A(`<circle cx="60" cy="42" r="31" class="a-box"/>` + G('k-rot', '--ox:60px;--oy:42px', [0, 60, 120, 180, 240, 300].map(a => `<g transform="rotate(${a} 60 42)"><line x1="60" y1="42" x2="60" y2="14" class="a-ln"/><rect x="55" y="16" width="10" height="8" rx="2" class="a-bask"/></g>`).join('') + `<circle cx="60" cy="42" r="4.4" class="a-gold"/>`), '380°');
    const side = `<path class="a-open" d="M34 18H30V70H74"/><path class="a-open" d="M30 18H74"/>`;
    if (key === 'basket') return A(side + G('k-sl', '--tx:34px', `<path d="M38 40l4 26h26l4-26z" class="a-bask"/><line x1="40" y1="48" x2="70" y2="48" class="a-ln"/><line x1="42" y1="56" x2="68" y2="56" class="a-ln"/><line x1="36" y1="40" x2="74" y2="40" class="a-door"/>`));
    if (key === 'shoe_box') return A(side + G('k-sl', '--tx:34px', `<rect x="34" y="42" width="40" height="24" rx="2" class="a-bask"/><path d="M42 62c4-8 12-10 20-8l4 8z" class="a-sil"/><line x1="74" y1="38" x2="74" y2="68" class="a-door"/>`));
    return A(side + G('k-sl', '--tx:34px', `<rect x="34" y="44" width="40" height="22" rx="2" class="a-leather"/>${key === 'access' ? '<circle cx="46" cy="58" r="3" class="a-gold"/><rect x="54" y="54" width="10" height="6" class="a-gold" opacity=".7"/>' : ''}<line x1="74" y1="40" x2="74" y2="68" class="a-door"/>`));
  }
  /* угловые механизмы, вид сверху */
  function corner(key) {
    if (key === 'none') return A(`<rect class="a-box" x="22" y="12" width="76" height="58"/>` + G('k-sw', O(22, 70, 95), L(22, 70, 98, 70, 'a-door')) + `<circle cx="22" cy="70" r="3.4" class="a-gold"/>`);
    const sq = `<rect class="a-box" x="22" y="12" width="76" height="58"/>`, dr = G('k-sw', O(22, 70, 92), L(22, 70, 98, 70, 'a-door')) + `<circle cx="22" cy="70" r="3.2" class="a-gold"/>`;
    if (key === 'dynamic' || key === 'compact') return A(sq + `<circle cx="60" cy="40" r="22" class="a-bask"/>` + G('k-rot', '--ox:60px;--oy:40px', `<line x1="38" y1="40" x2="82" y2="40" class="a-ln"/><line x1="60" y1="18" x2="60" y2="62" class="a-ln"/><circle cx="60" cy="40" r="3.6" class="a-gold"/>`) + dr);
    if (key === 'fold') return A(sq + G('k-sl', '--tx:-12px;--ty:20px', `<rect x="46" y="34" width="38" height="16" rx="3" class="a-bask"/>`) + G('k-sl2', '--tx:10px;--ty:12px', `<rect x="34" y="20" width="30" height="14" rx="3" class="a-bask"/>`) + dr);
    if (key === 'space_c') return A(sq + G('k-sl', '--ty:22px', `<path d="M30 20H90V40H52V62H30Z" class="a-bask"/>`) + dr);
    return A(sq + G('k-sl', '--tx:-14px;--ty:22px', `<rect x="48" y="32" width="38" height="20" rx="3" class="a-bask"/><line x1="52" y1="38" x2="82" y2="38" class="a-ln"/>`) + G('k-sl2', '--tx:8px;--ty:8px', `<rect x="34" y="18" width="30" height="14" rx="3" class="a-bask"/>`) + dr);
  }
  /* ящик под мойку, вид сбоку */
  function sinkbox(key) {
    if (key === 'none') return A(`<path class="a-open" d="M30 34V72H78V34"/><path d="M36 16l6 18h28l6-18z" class="a-ln"/>` + G('k-sw', O(78, 72, -95), L(78, 72, 78, 36, 'a-door')) + `<circle cx="78" cy="72" r="3" class="a-gold"/>`);
    const ds = { antaro: ['#e9b44c', 1.6, 24], legrabox: ['#cfd5da', 1.1, 28], intivo: ['#f1c862', 1.8, 30], plus: ['#e9b44c', 1.6, 24] }[key] || ['#e9b44c', 1.6, 24];
    return A(`<path class="a-open" d="M30 34V72H78"/><path d="M36 14l6 20h28l6-20z" class="a-ln"/><path d="M52 34v8c0 4 6 4 6 8" class="a-ln"/>` +
      G('k-sl', '--tx:28px', `<path d="M36 44v${ds[2]}h40" fill="none" stroke="${ds[0]}" stroke-width="${ds[1]}"/><path d="M36 ${44 + ds[2]}h38" stroke="${ds[0]}" stroke-width="${ds[1] + 1}" fill="none"/><rect x="74" y="40" width="4" height="${ds[2] + 8}" fill="${ds[0]}" opacity=".85"/><path d="M44 52h18v10H44z" class="a-dash"/>`), key === 'legrabox' ? 'LEGRABOX' : (key === 'intivo' ? 'intivo' : 'antaro'));
  }
  /* карго */
  function cargo(key) {
    const n = { cromat: 2, sub150: 3, sub200: 3, sub300: 3, quadro: 4 }[key] || 3, w = { cromat: 22, sub150: 18, sub200: 24, sub300: 34, quadro: 24 }[key] || 24;
    const baskets = Array.from({ length: n }, (_, i) => `<rect x="${40}" y="${10 + i * (60 / n)}" width="${w}" height="${60 / n - 5}" rx="2" class="a-bask"/><line x1="${40}" y1="${10 + i * (60 / n) + 4}" x2="${40 + w}" y2="${10 + i * (60 / n) + 4}" class="a-ln"/>`).join('');
    return A(`<path class="a-open" d="M34 8V76H34M34 8H60M34 76H60"/>` + G('k-sl', '--tx:36px', baskets + `<line x1="${40 + w}" y1="8" x2="${40 + w}" y2="72" class="a-door"/>`), key === 'cromat' ? '' : (w + ' ').trim().replace(/^\d+$/, '') || '');
  }
  /* внутренние конструкции Blum */
  function space(key) {
    if (key === 'twin_a' || key === 'twin_l') return A(`<path class="a-open" d="M30 22V68H74M30 22H74"/>` + G('k-sl', '--tx:20px', `<rect x="34" y="34" width="40" height="30" rx="2" class="a-bask"/><line x1="74" y1="30" x2="74" y2="66" class="a-door"/>` + G('k-sl2', '--tx:14px', `<rect x="40" y="44" width="28" height="14" rx="2" fill="rgba(233,180,76,.35)" stroke="#ffe29a" stroke-width="1.2"/>`)), key === 'twin_a' ? 'TWIN antaro' : 'TWIN LEGRABOX');
    if (key === 'bottle') return A(`<path class="a-open" d="M42 8V76M42 8H62M42 76H62"/>` + G('k-sl', '--tx:34px', `<rect x="44" y="12" width="20" height="58" rx="2" class="a-bask"/>` + [0, 1, 2, 3].map(i => `<circle cx="54" cy="${22 + i * 14}" r="5" class="a-glass"/>`).join('') + `<line x1="64" y1="8" x2="64" y2="74" class="a-door"/>`));
    return A(`<path class="a-open" d="M30 6V78M30 6H68M30 78H68"/>` + G('k-sl', '--tx:34px', `<rect x="34" y="8" width="34" height="68" rx="2" class="a-bask"/>` + [0, 1, 2, 3].map(i => `<line x1="34" y1="${22 + i * 14}" x2="68" y2="${22 + i * 14}" class="a-ln"/>`).join('') + `<line x1="68" y1="6" x2="68" y2="78" class="a-door"/>`), 'TOWER');
  }
  /* сушилка для посуды: вид спереди верхнего шкафа, дверь поднимается, видны тарелки на решётке */
  function dryer(key) {
    if (key === 'none') return base();
    const two = key !== 'inoxa_702', drawer = key === 'inoxa_6703';
    const plates = (y, n) => Array.from({ length: n }, (_, i) => `<ellipse cx="${38 + i * 9}" cy="${y}" rx="2.4" ry="9" class="a-glass"/>`).join('') + L(32, y + 9, 90, y + 9, 'a-ln');
    if (drawer) return A(`<path class="a-open" d="M30 30V72H90V30"/>` + G('k-sl', '--ty:-0px;--tx:0px', '') + G('k-sl', '--tx:0px;--ty:-14px', plates(56, 6) + L(30, 72, 90, 72, 'a-door')), 'ящик');
    const rack = two ? plates(30, 6) + plates(56, 4).replace(/cy="56"/g, 'cy="56"') : plates(46, 6);
    return A(`<rect class="a-box" x="28" y="10" width="64" height="66"/>` + rack + G('k-sw', O(28, 10, -82), `<rect x="28" y="10" width="64" height="66" class="a-doorf"/>`), two ? '2 уровня' : '1 уровень');
  }
  /* лоток для столовых приборов: вид сверху, ящик выдвигается */
  function tray(key) {
    if (key === 'none') return A(`<path class="a-open" d="M24 12V62H96V12"/>` + G('k-sl', '--ty:12px', `<rect x="28" y="16" width="64" height="44" class="a-bask"/>` + L(26, 62, 94, 62, 'a-door')));
    const wood = key === 'ambia', cells = [36, 46, 56, 66, 76].map(x => `<rect x="${x}" y="22" width="8" height="32" rx="2" class="${wood ? 'a-leather' : 'a-bask'}"/>`).join('');
    return A(`<path class="a-open" d="M24 12V62H96V12"/>` + G('k-sl', '--ty:12px', `<rect x="28" y="16" width="64" height="44" class="a-box"/>` + cells + L(26, 62, 94, 62, 'a-door')), wood ? 'дерево' : '');
  }
  /* мусорные вёдра под мойкой: дверь открывается, вёдра выезжают */
  function bin(key) {
    if (key === 'none') return A(`<path class="a-open" d="M30 30V72H84V30"/>` + G('k-sw', O(84, 72, -95), L(84, 72, 84, 32, 'a-door')) + `<circle cx="84" cy="72" r="3" class="a-gold"/>`);
    const n = { union1: 1, door97: 1, union2: 2, union3: 3, union800: 3, envi: 2 }[key] || 1;
    const bins = Array.from({ length: n }, (_, i) => `<path d="M${36 + i * (40 / n)} 46l3 24h${40 / n - 8}l3-24z" class="a-bask"/>`).join('');
    if (key === 'door97') return A(`<path class="a-open" d="M30 30V72H84V30"/>` + G('k-sw', O(84, 72, -80), L(84, 72, 84, 32, 'a-door') + `<path d="M70 44l2 20h10l2-20z" class="a-bask"/>`) + `<circle cx="84" cy="72" r="3" class="a-gold"/>`, 'на дверь');
    return A(`<path class="a-open" d="M30 30V72H84V30"/>` + G('k-sl', '--tx:22px', bins + L(84, 34, 84, 72, 'a-door')), n > 1 ? n + ' ведра' : '');
  }
  /* «по классу комплектации» и прочее без механизма */
  function base() { return A(`<rect class="a-box" x="22" y="12" width="76" height="38"/>` + L(22, 50, 98, 50, 'a-door') + `<circle cx="22" cy="50" r="3.4" class="a-gold"/>`); }

  function art(grp, key) {
    try {
      if (grp === 'hinges') return key === 'tier' ? base() : hinge(key);
      if (grp === 'open') return key === 'tier' ? base() : (/^tipon/.test(key) ? tipon(key) : handle(key));
      if (grp === 'lifts' || grp === 'liftsK') return lift(key);
      if (grp === 'sliding') return sliding(key);
      if (grp === 'pantSel') return key === 'tier' ? pant('cabio') : pant(key);
      if (grp === 'rodSel') return rod();
      if (grp === 'cabio') return cabio(key);
      if (grp === 'corner') return corner(key);
      if (grp === 'sinkbox') return sinkbox(key);
      if (grp === 'cargo') return cargo(key);
      if (grp === 'space') return space(key);
      if (grp === 'dryer') return dryer(key);
      if (grp === 'tray') return tray(key);
      if (grp === 'bin') return bin(key);
    } catch (e) {}
    return '';
  }
  css();
  window.KISART = { art };
})();
