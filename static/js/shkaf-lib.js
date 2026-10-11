/* «Мои изделия»: библиотека сохранённых изделий (хранится в этом браузере, общая для шкафов и кухни).
   Из неё изделие вставляется в комнату сколько угодно раз; изделия из 3D-конструктора можно открыть и изменить. */
(function () {
  var KEY = 'kc_pro_lib', $ = function (id) { return document.getElementById(id); };
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
  function thumb(o) {
    var rects = [], W = 1, D = 1;
    if (o.kind === 'parts' && o.pt) { rects = o.pt.map(function (b) { return [b[1], b[3], b[4], b[6], b[0]]; }); }
    else if (o.kind === 'boards' && o.bd) { rects = o.bd.map(function (b) { return [b[0], 0, b[2], o.d || 30, 0]; }); }
    else if (o.poly && o.poly.length) {
      var xs = o.poly.map(function (p) { return p[0]; }), zs = o.poly.map(function (p) { return p[1]; }), x0 = Math.min.apply(null, xs), z0 = Math.min.apply(null, zs), w = Math.max.apply(null, xs) - x0 || 1, d = Math.max.apply(null, zs) - z0 || 1, k = Math.min(86 / w, 46 / d);
      return '<svg width="96" height="56" viewBox="0 0 96 56"><polygon points="' + o.poly.map(function (p) { return (5 + (p[0] - x0) * k).toFixed(1) + ',' + (5 + (p[1] - z0) * k).toFixed(1); }).join(' ') + '" fill="#e6d9c0" stroke="#444" stroke-width="1.4"/></svg>';
    } else rects = [[0, 0, o.w || 100, o.d || 40, 0]];
    var xe = Math.max.apply(null, rects.map(function (r) { return r[0] + r[2]; })), ze = Math.max.apply(null, rects.map(function (r) { return r[1] + r[3]; })), kk = Math.min(86 / (xe || 1), 46 / (ze || 1));
    return '<svg width="96" height="56" viewBox="0 0 96 56">' + rects.map(function (r) { return '<rect x="' + (5 + r[0] * kk).toFixed(1) + '" y="' + (5 + r[1] * kk).toFixed(1) + '" width="' + Math.max(1.2, r[2] * kk).toFixed(1) + '" height="' + Math.max(1.2, r[3] * kk).toFixed(1) + '" fill="' + (r[4] === 6 ? '#efe3c8' : r[4] >= 2 && r[4] <= 5 ? '#f2eadb' : '#e6d9c0') + '" stroke="#444" stroke-width=".9"/>'; }).join('') + '</svg>';
  }
  function render() {
    var box = $('shapeLib'); if (!box) return; var lib = load();
    if (!lib.length) { box.innerHTML = '<div class="note">Пока пусто. Соберите изделие выше и нажмите «💾 В мои изделия» — оно появится здесь, и его можно будет вставлять в комнату сколько угодно раз.</div>'; return; }
    box.innerHTML = '<div class="shlib">' + lib.map(function (it, i) { return '<div class="shcard">' + thumb(it.tpl) + '<input type="text" value="' + String(it.name || '').replace(/"/g, '&quot;') + '" data-ren="' + i + '"><div class="shr"><button type="button" class="go" data-ins="' + i + '">Вставить в комнату</button></div><div class="shr">' + (it.tpl.kind === 'parts' ? '<button type="button" data-edit="' + i + '">✏️ Изменить</button>' : '') + '<button type="button" data-del="' + i + '">🗑 Удалить</button></div></div>'; }).join('') + '</div>';
  }
  function bind() {
    var box = $('shapeLib'); if (!box || box._b) return; box._b = 1;
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return; var lib = load();
      if (b.dataset.ins != null) { var it = lib[+b.dataset.ins]; if (it && window.PRO && window.PRO.insertTpl) { window.PRO.insertTpl(it.tpl, it.name); var m = $('p3Msg'); if (m) { m.textContent = '✔ «' + it.name + '» вставлен в комнату — смотрите 3D выше'; setTimeout(function () { m.textContent = ''; }, 3500); } } }
      else if (b.dataset.edit != null) { var it2 = lib[+b.dataset.edit]; if (it2 && window.PART3D) window.PART3D.open(Object.assign({}, it2.tpl, { id: null, name: it2.name })); }
      else if (b.dataset.del != null) { var nm = lib[+b.dataset.del] && lib[+b.dataset.del].name; if (!window.confirm('Удалить «' + (nm || 'изделие') + '» из «Мои изделия»?\n(Уже вставленные в комнату изделия останутся.)')) return; lib.splice(+b.dataset.del, 1); save(lib); render(); }
    });
    box.addEventListener('change', function (ev) { var t = ev.target; if (t.dataset && t.dataset.ren != null) { var lib = load(); if (lib[+t.dataset.ren]) { lib[+t.dataset.ren].name = t.value.trim() || 'Изделие'; save(lib); } } });
  }
  window.SHAPE = {
    libAdd: function (o, name) { var lib = load(), nm = name || ('Изделие ' + (lib.length + 1)), tpl = JSON.parse(JSON.stringify(o)); delete tpl.id; delete tpl.x; delete tpl.z; delete tpl.rot; lib.push({ name: nm, tpl: tpl }); save(lib); render(); return nm; },
    open: function () { if (window.PART3D) window.PART3D.open(null); }
  };
  window.BOARDS = { open: function () { if (window.PART3D) window.PART3D.open(null); } };
  function init() { bind(); render(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
