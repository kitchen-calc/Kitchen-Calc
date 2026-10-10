/* Опрос-квиз на главной: 6 коротких вопросов о мебели, сроке и оплате → контакты → заявка мастеру в Telegram (/lead).
   Встраивается в <div id="quiz"></div>. Открыть с предвыбранным ответом: KCQuiz.open({ pay: 'inst' }). */
(function () {
  var UZ = location.pathname.indexOf('/uz') === 0;
  var T = function (ru, uz) { return UZ ? uz : ru; };
  var IMG = function (n) { return '/static/home/' + n + '-640.webp'; };
  var ICON = {
    straight: '<svg viewBox="0 0 64 40"><rect x="6" y="8" width="52" height="12" rx="1.5"/></svg>',
    corner: '<svg viewBox="0 0 64 40"><path d="M6 8h52v12H20v16H6z"/></svg>',
    u: '<svg viewBox="0 0 64 40"><path d="M6 8h52v28H44V20H20v16H6z"/></svg>',
    island: '<svg viewBox="0 0 64 40"><rect x="6" y="6" width="52" height="10" rx="1.5"/><rect x="18" y="24" width="28" height="10" rx="1.5"/></svg>',
    q: '<svg viewBox="0 0 64 40"><text x="32" y="29" text-anchor="middle" font-size="24" font-family="Georgia,serif">?</text></svg>'
  };
  var Q = [
    { id: 'what', q: T('Какая мебель вам нужна?', 'Sizga qanday mebel kerak?'), img: true, opts: [
      ['kitchen', T('Кухня', 'Oshxona'), IMG('ph-k4')], ['kupe', T('Шкаф-купе', 'Shkaf-kupe'), IMG('ph-w4')],
      ['wardrobe', T('Гардеробная', 'Garderob'), IMG('ph-w3')], ['hall', T('Прихожая', 'Dahliz'), IMG('ph-h2')],
      ['full', T('Мебель для всей квартиры', 'Butun kvartira uchun'), IMG('ph-b2')]] },
    { id: 'shape', q: T('Какой формы кухня?', 'Oshxona qanday shaklda?'), only: function (a) { return !a.what || a.what === 'kitchen' || a.what === 'full'; }, opts: [
      ['straight', T('Прямая', 'Toʻgʻri'), ICON.straight], ['corner', T('Угловая', 'Burchakli'), ICON.corner],
      ['u', T('П-образная', 'P-shaklida'), ICON.u], ['island', T('С островом', 'Orolli'), ICON.island], ['unknown', T('Пока не знаю', 'Hali bilmayman'), ICON.q]] },
    { id: 'size', q: T('Примерная длина мебели?', 'Mebelning taxminiy uzunligi?'), opts: [
      ['lt2', T('До 2 метров', '2 metrgacha')], ['2to3', T('2–3 метра', '2–3 metr')], ['3to4', T('3–4 метра', '3–4 metr')],
      ['gt4', T('Больше 4 метров', '4 metrdan koʻp')], ['measure', T('Не знаю — нужен замер', 'Bilmayman — oʻlchov kerak')]] },
    { id: 'level', q: T('Какой уровень отделки ближе?', 'Qaysi daraja yaqinroq?'), opts: [
      ['econ', T('Эконом — ЛДСП, практично', 'Ekonom — LDSP, amaliy')], ['std', T('Стандарт — МДФ, хорошая фурнитура', 'Standart — MDF, yaxshi furnitura')],
      ['prem', T('Премиум — акрил, Blum, подсветка', 'Premium — akril, Blum, yoritish')], ['help', T('Посоветуйте, что лучше', 'Maslahat bering')]] },
    { id: 'when', q: T('Когда нужна мебель?', 'Mebel qachon kerak?'), opts: [
      ['asap', T('Как можно скорее', 'Imkon qadar tez')], ['1m', T('В течение месяца', 'Bir oy ichida')],
      ['3m', T('Через 1–3 месяца', '1–3 oydan keyin')], ['later', T('Идёт ремонт, пока выбираю', 'Taʼmir ketyapti, tanlayapman')]] },
    { id: 'pay', q: T('Как удобнее оплатить?', 'Qanday toʻlash qulay?'), opts: [
      ['now', T('Сразу', 'Birdaniga')], ['inst', T('В рассрочку без процентов', 'Foizsiz boʻlib toʻlash')], ['undecided', T('Ещё не решил', 'Hali hal qilmadim')]] }
  ];
  var A = {}, step = -1, root = null;

  function steps() { return Q.filter(function (q) { return !q.only || q.only(A); }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function labelOf(qid) { var q = Q.find(function (x) { return x.id === qid; }); var o = q && q.opts.find(function (x) { return x[0] === A[qid]; }); return o ? o[1] : '—'; }

  function render() {
    if (!root) return;
    var list = steps(), n = list.length;
    if (step < 0) {
      root.innerHTML = '<div class="kq-intro"><img class="kq-bg" src="' + IMG('hero') + '" alt="" loading="lazy">' +
        '<div class="kq-in"><div class="eyebrow">' + T('Расчёт за 1 минуту', '1 daqiqada hisob') + '</div>' +
        '<h2>' + T('Подберём мебель под ваш бюджет и сроки', 'Byudjet va muddatingizga mos mebel tanlaymiz') + '</h2>' +
        '<p>' + T('Ответьте на 6 коротких вопросов — мастер подготовит расчёт и предложит варианты под вашу квартиру.', '6 ta qisqa savolga javob bering — usta hisob tayyorlaydi va kvartirangizga variantlar taklif qiladi.') + '</p>' +
        '<button type="button" class="btn btn-gold kq-start">' + T('Пройти опрос', 'Soʻrovnomadan oʻtish') + ' →</button>' +
        '<div class="kq-bonus"><span>' + T('После опроса', 'Soʻrovnomadan keyin') + '</span>' +
        '<b>📐 ' + T('Бесплатный замер', 'Bepul oʻlchov') + '</b><b>💳 ' + T('Рассрочка 0%', '0% boʻlib toʻlash') + '</b><b>🧾 ' + T('Расчёт стоимости', 'Narx hisobi') + '</b></div></div></div>';
      return;
    }
    if (step >= n) return renderForm();
    var q = list[step], pct = Math.round(step / (n + 1) * 100);
    var opts = q.opts.map(function (o) {
      var on = A[q.id] === o[0] ? ' on' : '';
      if (q.img) return '<button type="button" class="kq-opt kq-img' + on + '" data-v="' + o[0] + '"><img src="' + o[2] + '" alt="" loading="lazy"><span>' + esc(o[1]) + '</span></button>';
      if (o[2]) return '<button type="button" class="kq-opt kq-ic' + on + '" data-v="' + o[0] + '">' + o[2] + '<span>' + esc(o[1]) + '</span></button>';
      return '<button type="button" class="kq-opt kq-tx' + on + '" data-v="' + o[0] + '"><i></i><span>' + esc(o[1]) + '</span></button>';
    }).join('');
    root.innerHTML = '<div class="kq-box"><div class="kq-top"><span>' + T('Вопрос', 'Savol') + ' ' + (step + 1) + ' / ' + n + '</span><div class="kq-bar"><i style="width:' + pct + '%"></i></div></div>' +
      '<h3>' + esc(q.q) + '</h3><div class="kq-opts ' + (q.img ? 'grid-img' : (q.opts[0][2] ? 'grid-ic' : 'grid-tx')) + '">' + opts + '</div>' +
      '<div class="kq-nav"><button type="button" class="kq-back">← ' + T('Назад', 'Orqaga') + '</button>' +
      '<button type="button" class="btn btn-gold btn-sm kq-next"' + (A[q.id] ? '' : ' disabled') + '>' + T('Далее', 'Keyingi') + ' →</button></div></div>';
  }
  function renderForm(done, err) {
    var n = steps().length;
    if (done) {
      root.innerHTML = '<div class="kq-box kq-done"><div class="kq-ok">✓</div><h3>' + T('Спасибо! Заявка отправлена', 'Rahmat! Ariza yuborildi') + '</h3><p>' +
        T('Мастер свяжется с вами в ближайшее время, уточнит детали и договорится о бесплатном замере.', 'Usta tez orada siz bilan bogʻlanadi va bepul oʻlchov haqida kelishadi.') + '</p>' +
        '<a class="btn btn-line btn-sm" href="' + (A.what === 'kitchen' || !A.what ? '/calc' : '/shkaf') + '">' + T('Пока соберите вариант в калькуляторе →', 'Hozircha kalkulyatorda yigʻing →') + '</a></div>';
      return;
    }
    root.innerHTML = '<div class="kq-box"><div class="kq-top"><span>' + T('Последний шаг', 'Oxirgi qadam') + '</span><div class="kq-bar"><i style="width:' + Math.round(n / (n + 1) * 100) + '%"></i></div></div>' +
      '<h3>' + T('Куда прислать расчёт?', 'Hisobni qayerga yuboramiz?') + '</h3>' +
      '<div class="kq-sum">' + steps().map(function (q) { return '<span><em>' + esc(q.q) + '</em> ' + esc(labelOf(q.id)) + '</span>'; }).join('') + '</div>' +
      '<form class="kq-form"><input name="name" type="text" autocomplete="name" placeholder="' + T('Ваше имя', 'Ismingiz') + '">' +
      '<input name="phone" type="tel" autocomplete="tel" inputmode="tel" required placeholder="+998 __ ___-__-__">' +
      '<input name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">' +
      '<div class="kq-way"><label><input type="radio" name="way" value="tg" checked> Telegram</label><label><input type="radio" name="way" value="call"> ' + T('Звонок', 'Qoʻngʻiroq') + '</label></div>' +
      (err ? '<div class="kq-err">' + esc(err) + '</div>' : '') +
      '<button type="submit" class="btn btn-gold">' + T('Получить расчёт', 'Hisobni olish') + '</button>' +
      '<small>' + T('Нажимая кнопку, вы соглашаетесь с', 'Tugmani bosib, siz rozilik bildirasiz:') + ' <a href="/privacy" target="_blank" rel="noopener">' + T('политикой конфиденциальности', 'maxfiylik siyosati') + '</a></small></form>' +
      '<div class="kq-nav"><button type="button" class="kq-back">← ' + T('Назад', 'Orqaga') + '</button></div></div>';
  }
  function send(form) {
    var phone = form.phone.value.trim();
    if ((phone.match(/\d/g) || []).length < 9) { renderForm(false, T('Укажите номер телефона', 'Telefon raqamini kiriting')); return; }
    var btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = T('Отправляю…', 'Yuborilmoqda…');
    var det = {}; steps().forEach(function (q) { det[q.q.replace(/\?$/, '')] = labelOf(q.id); });
    det[T('Связаться через', 'Aloqa')] = form.way.value === 'call' ? T('звонок', 'qoʻngʻiroq') : 'Telegram';
    det['Язык'] = UZ ? 'узбекский' : 'русский';
    fetch('/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      form: 'quiz', name: form.name.value.trim().slice(0, 100), phone: phone.slice(0, 30), website: form.website.value, notes: 'Опрос на главной', details: det
    }) }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok, j: j }; }); }).then(function (res) {
      if (res.ok) { step = 99; renderForm(true); try { if (window.ym) ym(113463296, 'reachGoal', 'quiz_lead'); } catch (e) {} }
      else renderForm(false, T('Не удалось отправить. Позвоните: +998 92 093-45-10', 'Yuborib boʻlmadi. Qoʻngʻiroq qiling: +998 92 093-45-10'));
    }).catch(function () { renderForm(false, T('Нет связи. Позвоните: +998 92 093-45-10', 'Aloqa yoʻq. Qoʻngʻiroq qiling: +998 92 093-45-10')); });
  }
  function scrollIn() { var r = root.getBoundingClientRect(); if (r.top < 60 || r.top > innerHeight * .5) root.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function onClick(e) {
    var t = e.target;
    if (t.closest('.kq-start')) { step = 0; render(); scrollIn(); return; }
    var o = t.closest('.kq-opt');
    if (o) { var q = steps()[step]; A[q.id] = o.getAttribute('data-v'); render(); setTimeout(function () { step++; render(); scrollIn(); }, 260); return; }
    if (t.closest('.kq-next')) { step++; render(); scrollIn(); return; }
    if (t.closest('.kq-back')) { step = Math.max(-1, Math.min(step, steps().length) - 1); render(); scrollIn(); }
  }
  function init() {
    root = document.getElementById('quiz'); if (!root) return;
    root.addEventListener('click', onClick);
    root.addEventListener('submit', function (e) { e.preventDefault(); send(e.target); });
    render();
    // кнопки «Узнать условия» / «Пройти опрос» по всей странице
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-quiz]'); if (!a) return;
      e.preventDefault(); window.KCQuiz.open(a.getAttribute('data-quiz') === 'inst' ? { pay: 'inst' } : null);
    });
  }
  window.KCQuiz = { open: function (pre) { if (pre) Object.keys(pre).forEach(function (k) { A[k] = pre[k]; }); step = 0; render(); root.scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
