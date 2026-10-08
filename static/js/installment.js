/* Рассрочка в окне договора (/calc и /shkaf): переключатель в верхней панели, график платежей в Приложении № 4.
   Окно договора передаёт сумму и дату в <div class="doc" data-total="..." data-date="ГГГГ-ММ-ДД">. */
(function () {
  const doc = document.querySelector('.doc');
  const bar = document.querySelector('.toolbar');
  const h = [...document.querySelectorAll('.doc h1')].find(x => /Приложение № 4/.test(x.textContent));
  if (!doc || !bar || !h) return;
  const total = Math.round(+doc.dataset.total || 0);
  const [y, m, d] = (doc.dataset.date || '').split('-').map(Number);

  // Приложение № 4 — последнее: разрыв страницы перед заголовком, заголовок и всё после него
  const part = [h.previousElementSibling && h.previousElementSibling.classList.contains('appendix') ? h.previousElementSibling : null, h];
  for (let e = h.nextElementSibling; e; e = e.nextElementSibling) part.push(e);
  const parts = part.filter(Boolean);
  const pStarts = re => parts.find(e => e.tagName === 'P' && re.test(e.textContent.trim()));
  const pTotal = pStarts(/^1\. Общая стоимость/), pTerms = pStarts(/^2\. Предоплата/);
  const table = parts.find(e => e.tagName === 'TABLE' && /№ платежа/.test(e.textContent));

  const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const pad = n => String(n).padStart(2, '0');
  const due = i => {  // тот же день через i месяцев (31-е → последний день короткого месяца)
    const last = new Date(y, m - 1 + i + 1, 0).getDate();
    const dt = new Date(y, m - 1 + i, Math.min(d, last));
    return `${pad(dt.getDate())}.${pad(dt.getMonth() + 1)}.${dt.getFullYear()}`;
  };

  const st = document.createElement('style');
  st.textContent = '.inst-off{display:none!important}.inst{display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:#1e293b;border-radius:8px;padding:6px 10px}' +
    '.inst input[type=number],.inst select{width:64px;padding:5px;border-radius:5px;border:none;font-size:14px}.inst label{display:flex;gap:6px;align-items:center;cursor:pointer}' +
    '.inst b{color:#fbbf24}.inst .hint{color:#94a3b8;font-size:12px}';
  document.head.appendChild(st);

  const ui = document.createElement('div');
  ui.className = 'inst';
  ui.innerHTML = '<label><input type="checkbox" id="instOn"> <b>Рассрочка</b></label>' +
    '<label class="opt">Предоплата <input type="number" id="instPre" min="10" max="90" step="5" value="50"> %</label>' +
    '<label class="opt">на <select id="instN">' + [2, 3, 4, 5, 6, 9, 12].map(n => `<option${n === 3 ? ' selected' : ''}>${n}</option>`).join('') + '</select> мес.</label>' +
    '<span class="opt" id="instSum"></span><span class="opt hint">Совет: предоплата не меньше стоимости материалов (50 %+)</span>';
  bar.appendChild(ui);
  const $ = id => ui.querySelector('#' + id);

  function render() {
    const on = $('instOn').checked;
    parts.forEach(e => e.classList.toggle('inst-off', !on));
    ui.querySelectorAll('.opt').forEach(e => e.classList.toggle('inst-off', !on));
    if (!on) return;
    const pct = Math.min(90, Math.max(10, +$('instPre').value || 50)), n = +$('instN').value;
    const pre = Math.round(total * pct / 100 / 1000) * 1000, rest = total - pre;
    const each = Math.floor(rest / n / 1000) * 1000;
    $('instSum').textContent = `= ${fmt(pre)} сум сразу, затем ${n} × ~${fmt(each)} сум`;
    if (pTotal) pTotal.textContent = `1. Общая стоимость Изделия по договору составляет ${fmt(total)} сум.`;
    if (pTerms) pTerms.textContent = `2. Предоплата — ${pct} % (${fmt(pre)} сум) — вносится в день подписания договора. Оставшаяся сумма — ` +
      `${fmt(rest)} сум — оплачивается в рассрочку на ${n} мес. равными платежами по графику ниже, без процентов. ` +
      'Заказчик вправе погасить рассрочку досрочно полностью или частично.';
    if (table) {
      let left = rest, rows = '';
      for (let i = 1; i <= n; i++) {
        const sum = i === n ? left : each;
        left -= sum;
        rows += `<tr><td>${i}</td><td><span class="fill" contenteditable="true">${due(i)}</span></td><td>${fmt(sum)}</td><td>${fmt(left)}</td></tr>`;
      }
      const head = table.querySelector('tr').outerHTML;
      table.innerHTML = head + rows + `<tr><td></td><td><b>Итого рассрочка</b></td><td><b>${fmt(rest)}</b></td><td></td></tr>`;
    }
  }
  ui.addEventListener('input', render);
  ui.addEventListener('change', render);
  render();
})();
