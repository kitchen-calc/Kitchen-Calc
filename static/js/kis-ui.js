/* Премиальный каталог фурнитуры: карточки вариантов с иконками, брендом, ценой и наличием.
   Общий для /calc и /shkaf. Использование:
     KISUI.panel({ ctx, title, sub, sections: [{ field, grp, title, hint, value, keys, per }] })  -> html
   По клику на карточку страница получает событие document 'kispick' { ctx, field, key }.
   Счётчики (+ / −): событие 'kiscount' { ctx, field, delta }. */
(function () {
  const T = s => { try { if (typeof LANG !== 'undefined' && LANG === 'uz' && window.kcTr) return window.kcTr(s); } catch (e) {} return s; };
  const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/[  ]/g, ' ');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* иконки 48×48, линия золотом */
  const S = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const ICON = {
    hinge:   `<svg viewBox="0 0 48 48" ${S}><rect x="5" y="14" width="14" height="20" rx="2"/><circle cx="12" cy="24" r="4"/><path d="M19 24h12l8-8M31 24l8 8"/><circle cx="39" cy="16" r="2"/><circle cx="39" cy="32" r="2"/></svg>`,
    handle:  `<svg viewBox="0 0 48 48" ${S}><rect x="4" y="10" width="40" height="28" rx="3"/><path d="M14 24h20"/><circle cx="14" cy="24" r="2"/><circle cx="34" cy="24" r="2"/></svg>`,
    tipon:   `<svg viewBox="0 0 48 48" ${S}><rect x="6" y="8" width="36" height="32" rx="3"/><path d="M24 34V20m0 0l-5 5m5-5l5 5"/><path d="M14 14h20" stroke-dasharray="3 3"/></svg>`,
    lift:    `<svg viewBox="0 0 48 48" ${S}><path d="M6 40V12h36v28"/><path d="M6 12l22-8"/><path d="M28 4l8 6"/><path d="M34 20a10 10 0 0 1 6 8"/></svg>`,
    lifthf:  `<svg viewBox="0 0 48 48" ${S}><path d="M6 40V12h36v28"/><path d="M8 12l14 6 14-12"/><path d="M22 18l10 12"/></svg>`,
    slide:   `<svg viewBox="0 0 48 48" ${S}><rect x="4" y="6" width="40" height="36" rx="2"/><path d="M4 11h40M4 37h40"/><path d="M19 11v26M33 11v26"/><path d="M22 24h4m6 0h-4" /></svg>`,
    fold:    `<svg viewBox="0 0 48 48" ${S}><path d="M6 8l10 4v28L6 36zM16 12l10-4v32l-10 0zM26 8l10 4v28l-10-4zM36 12l6-2v30l-6 0z"/></svg>`,
    corner:  `<svg viewBox="0 0 48 48" ${S}><path d="M6 6h36v36"/><path d="M6 6v36h36"/><path d="M16 16h12v12H16z"/><path d="M30 30a8 8 0 0 0-8-8"/></svg>`,
    sinkbox: `<svg viewBox="0 0 48 48" ${S}><path d="M8 6h32M8 6l4 10h24l4-10"/><rect x="8" y="22" width="32" height="18" rx="2"/><path d="M18 30h12"/></svg>`,
    cargo:   `<svg viewBox="0 0 48 48" ${S}><rect x="14" y="4" width="20" height="40" rx="2"/><path d="M14 14h20M14 24h20M14 34h20"/></svg>`,
    space:   `<svg viewBox="0 0 48 48" ${S}><rect x="6" y="6" width="36" height="36" rx="2"/><path d="M6 20h36M6 31h36M24 20v22"/></svg>`,
    pant:    `<svg viewBox="0 0 48 48" ${S}><path d="M6 8h36"/><path d="M10 8l6 12M38 8l-6 12"/><path d="M12 22h24"/><path d="M16 22v18M32 22v18"/></svg>`,
    rod:     `<svg viewBox="0 0 48 48" ${S}><path d="M4 12h40"/><path d="M12 12c0 10-4 22-4 28M24 12c0 10 0 22 0 28M36 12c0 10 4 22 4 28" /></svg>`,
    trouser: `<svg viewBox="0 0 48 48" ${S}><rect x="6" y="6" width="36" height="8" rx="2"/><path d="M14 14v26M22 14v26M30 14v26M38 14v26"/></svg>`,
    shoe:    `<svg viewBox="0 0 48 48" ${S}><circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="4"/><path d="M24 7v13M41 24H28M24 41V28M7 24h13"/></svg>`,
    basket:  `<svg viewBox="0 0 48 48" ${S}><path d="M8 16h32l-4 24H12z"/><path d="M14 16c0-6 4-10 10-10s10 4 10 10"/></svg>`,
    drawer:  `<svg viewBox="0 0 48 48" ${S}><rect x="6" y="10" width="36" height="28" rx="2"/><path d="M6 22h36"/><path d="M20 16h8M20 30h8"/></svg>`,
    gem:     `<svg viewBox="0 0 48 48" ${S}><path d="M10 14h28l6 10-20 20L4 24z"/><path d="M4 24h40M18 14l-4 10 10 20 10-20-4-10"/></svg>`
  };
  const BRAND = (txt) => /Blum|AVENTOS|TANDEM|LEGRA|TIP-ON|CLIP/i.test(txt) ? 'Blum · Австрия'
    : /Cinetto/i.test(txt) ? 'Cinetto · Италия'
    : /Vauth|VS /i.test(txt) ? 'Vauth-Sagel · Германия'
    : /Cabio/i.test(txt) ? 'Cabio · Италия'
    : /Giusti|Marella|Linea|Scandi|Ручки/i.test(txt) ? 'Италия' : '';

  function css() {
    if (document.getElementById('kisCss')) return;
    const st = document.createElement('style'); st.id = 'kisCss';
    st.textContent = `
.kis{margin:20px 0;border-radius:22px;padding:26px 22px 20px;color:#f3ead7;position:relative;overflow:hidden;
  background:radial-gradient(1200px 400px at 85% -10%,rgba(217,154,28,.22),transparent 60%),linear-gradient(160deg,#1c1710,#0f0d09 70%);
  border:1px solid rgba(217,154,28,.55);box-shadow:0 18px 50px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,226,154,.08)}
.kis:before{content:"";position:absolute;inset:8px;border:1px solid rgba(217,154,28,.22);border-radius:16px;pointer-events:none}
.kis-head{text-align:center;margin-bottom:6px}
.kis-orn{color:#d99a1c;letter-spacing:.5em;font-size:.78rem;opacity:.9}
.kis-title{font-family:var(--serif,'Cormorant Garamond',Georgia,serif);font-size:2rem;font-weight:700;line-height:1.1;margin:6px 0 4px;
  background:linear-gradient(90deg,#f6dc9a,#d99a1c 45%,#f6dc9a);-webkit-background-clip:text;background-clip:text;color:transparent}
.kis-sub{color:#cdbf9f;font-size:.88rem;max-width:560px;margin:0 auto 12px}
.kis-brands{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:10px 0 4px}
.kis-brands span{border:1px solid rgba(217,154,28,.45);border-radius:999px;padding:4px 12px;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:#e8cf8f;background:rgba(217,154,28,.07)}
.kis-sec{margin-top:22px}
.kis-sec>h4{font-family:var(--serif,'Cormorant Garamond',Georgia,serif);font-size:1.28rem;color:#f6dc9a;margin:0 0 2px;display:flex;align-items:center;gap:10px}
.kis-sec>h4:after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(217,154,28,.6),transparent)}
.kis-hint{color:#a99c80;font-size:.8rem;margin:0 0 10px}
.kis-grid{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 12px;scroll-snap-type:x proximity;scrollbar-width:thin;scrollbar-color:#b88a2a rgba(255,255,255,.06);-webkit-overflow-scrolling:touch}
.kis-grid::-webkit-scrollbar{height:7px}.kis-grid::-webkit-scrollbar-thumb{background:#b88a2a;border-radius:9px}.kis-grid::-webkit-scrollbar-track{background:rgba(255,255,255,.06);border-radius:9px}
.kis-c{flex:0 0 200px;scroll-snap-align:start;position:relative;text-align:left;cursor:pointer;border-radius:14px;padding:12px 12px 12px;border:1px solid rgba(255,226,154,.18);
  background:linear-gradient(170deg,rgba(255,255,255,.06),rgba(255,255,255,.015));color:inherit;font:inherit;transition:.18s;display:flex;flex-direction:column;gap:6px;min-height:0}
.kis-c:hover{border-color:rgba(217,154,28,.8);transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,0,0,.35)}
.kis-c.on{border-color:#e9b44c;background:linear-gradient(170deg,rgba(217,154,28,.28),rgba(217,154,28,.07));box-shadow:0 0 0 1px #e9b44c,0 10px 28px rgba(217,154,28,.22)}
.kis-c.on:after{content:"✓";position:absolute;top:8px;right:10px;width:22px;height:22px;border-radius:50%;background:#e9b44c;color:#1a1408;font-weight:900;font-size:.8rem;display:flex;align-items:center;justify-content:center}
.kis-ic{width:44px;height:44px;color:#e9b44c}
.kis-ic svg{width:100%;height:100%}
.kis-n{font-weight:700;font-size:.86rem;line-height:1.25;color:#fff4dc}
.kis-b{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:#bda673}
.kis-p{margin-top:auto;font-family:var(--serif,'Cormorant Garamond',Georgia,serif);font-size:1.2rem;font-weight:700;color:#f6dc9a}
.kis-p small{font-family:var(--sans,Manrope,sans-serif);font-size:.68rem;font-weight:600;color:#a99c80;margin-left:3px}
.kis-tag{position:absolute;top:8px;left:10px;font-size:.62rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:2px 7px;border-radius:999px}
.kis-tag.ord{background:rgba(255,140,60,.18);color:#ffb27a;border:1px solid rgba(255,140,60,.5)}
.kis-tag.base{background:rgba(120,200,140,.15);color:#a8e3b8;border:1px solid rgba(120,200,140,.45)}
.kis-c .kis-ic{margin-top:14px}
.kis-cnt{display:flex;align-items:center;gap:10px;margin-top:2px}
.kis-cnt button{width:30px;height:30px;border-radius:50%;border:1px solid #e9b44c;background:transparent;color:#f6dc9a;font-size:1.1rem;cursor:pointer}
.kis-cnt button:hover{background:#e9b44c;color:#1a1408}
.kis-cnt b{min-width:20px;text-align:center;font-size:1.05rem;color:#fff4dc}
.kis-foot{margin-top:18px;text-align:center;color:#a99c80;font-size:.76rem;border-top:1px dashed rgba(217,154,28,.3);padding-top:12px}
.kis-sum{margin-top:14px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.kis-sum span{background:rgba(217,154,28,.12);border:1px solid rgba(217,154,28,.4);color:#f6dc9a;border-radius:10px;padding:5px 10px;font-size:.78rem}
@media (max-width:520px){.kis{padding:20px 12px 14px}.kis-title{font-size:1.6rem}.kis-c{flex-basis:168px}}
.kis-swipe{color:#a99c80;font-size:.7rem;margin:-4px 0 8px;letter-spacing:.04em}
`;
    document.head.appendChild(st);
  }

  function art(sec, key) {
    const a = window.KISART && KISART.art(sec.grp, key);
    if (a) return a;
    const ic = ICON[(sec.icon && (typeof sec.icon === 'function' ? sec.icon(key) : sec.icon)) || 'gem'] || ICON.gem;
    return `<div class="kis-ic">${ic}</div>`;
  }
  function card(sec, key, item, active) {
    const tag = item.avail === false ? `<span class="kis-tag ord">${T('под заказ')}</span>` : '';
    return `<button type="button" class="kis-c${active ? ' on' : ''}" data-kis-ctx="${esc(sec.ctx)}" data-kis-field="${esc(sec.field)}" data-kis-key="${esc(key)}">${tag}${art(sec, key)}<div class="kis-n">${esc(T(item.ru))}</div><div class="kis-b">${esc(T(BRAND(item.ru)))}</div></button>`;
  }
  function counter(sec, key, item, n) {
    return `<div class="kis-c${n > 0 ? ' on' : ''}">${art(sec, key)}<div class="kis-n">${esc(T(item.ru))}</div><div class="kis-b">${esc(T(BRAND(item.ru)))}</div>
      <div class="kis-cnt"><button type="button" data-kis-count="1" data-kis-ctx="${esc(sec.ctx)}" data-kis-field="${esc(sec.field)}" data-kis-key="${esc(key)}" data-kis-d="-1">−</button><b>${n}</b><button type="button" data-kis-count="1" data-kis-ctx="${esc(sec.ctx)}" data-kis-field="${esc(sec.field)}" data-kis-key="${esc(key)}" data-kis-d="1">+</button></div></div>`;
  }

  window.KISUI = {
    fmt, ICON,
    panel(o) {
      css();
      const secs = o.sections.filter(Boolean).map(s => {
        s.ctx = o.ctx;
        const keys = s.keys || Object.keys(KIS[s.grp] || {});
        let body;
        if (s.counts) body = keys.map(k => counter(s, k, KIS[s.grp][k], (s.counts[k] | 0))).join('');
        else body = keys.map(k => card(s, k, KIS[s.grp][k], k === s.value)).join('');
        return `<div class="kis-sec"><h4>${esc(T(s.title))}</h4>${s.hint ? `<p class="kis-hint">${esc(T(s.hint))}</p>` : ''}<div class="kis-grid" data-field="${esc(s.field)}">${body}</div>${keys.length > 3 ? `<div class="kis-swipe">${T('← листайте →')}</div>` : ''}</div>`;
      }).join('');
      return `<section class="kis" data-ctx="${esc(o.ctx)}"><div class="kis-head"><div class="kis-orn">✦ ✦ ✦</div><div class="kis-title">${esc(T(o.title))}</div><p class="kis-sub">${esc(T(o.sub || ''))}</p>
        <div class="kis-brands"><span>Blum</span><span>Cinetto</span><span>Vauth-Sagel</span><span>Cabio</span><span>Giusti</span></div></div>
        ${secs}
        ${o.summary ? `<div class="kis-sum">${o.summary.map(x => `<span>${esc(T(x))}</span>`).join('')}</div>` : ''}
        <div class="kis-foot">${esc(T('Оригинальная фурнитура из наличия · цены kis.uz на'))} ${esc(KIS.date)} · ${esc(T('мастер подтвердит перед заказом'))}</div></section>`;
    }
  };

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-kis-key]'); if (!b) return;
    const ctx = b.dataset.kisCtx, root = b.closest('.kis'), saved = {}, y = window.scrollY;
    if (root) root.querySelectorAll('.kis-grid').forEach(g => { saved[g.dataset.field] = g.scrollLeft; });
    if (b.dataset.kisCount) document.dispatchEvent(new CustomEvent('kiscount', { detail: { ctx, field: b.dataset.kisField, key: b.dataset.kisKey, delta: +b.dataset.kisD } }));
    else document.dispatchEvent(new CustomEvent('kispick', { detail: { ctx, field: b.dataset.kisField, key: b.dataset.kisKey } }));
    const nr = document.querySelector('.kis[data-ctx="' + ctx + '"]');   // панель перерисована: вернуть положение лент и страницы
    if (nr) nr.querySelectorAll('.kis-grid').forEach(g => { if (saved[g.dataset.field] != null) g.scrollLeft = saved[g.dataset.field]; });
    if (Math.abs(window.scrollY - y) > 2) window.scrollTo(0, y);
  });
})();
