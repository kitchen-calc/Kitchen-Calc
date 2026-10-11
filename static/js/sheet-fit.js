/* Чертежи мастера: всё содержимое листа A4 должно лежать внутри рамки и не заходить на штамп.
   Если не помещается — уменьшаем и при необходимости поворачиваем на 90° (выбирается вариант с большим масштабом). */
(function () {
  var R1 = { x0: 44, y0: 44, x1: 1146, y1: 636 }, R2 = { x0: 44, y0: 44, x1: 606, y1: 776 };
  window.fitSheetSvg = function (svg) {
    var g = svg.querySelector('g.ct'); if (!g) return;
    g.removeAttribute('transform');
    var b; try { b = g.getBBox(); } catch (e) { return; }
    if (!b.width || !b.height || !isFinite(b.x)) return;
    var fitsFrame = b.x >= 32 && b.y >= 32 && b.x + b.width <= 1158 && b.y + b.height <= 788, hitsTitle = b.x + b.width > 622 && b.y + b.height > 648;
    if (fitsFrame && !hitsTitle) return;
    var best = null;
    [0, 90].forEach(function (rot) {
      var bw = rot ? b.height : b.width, bh = rot ? b.width : b.height;
      [R1, R2].forEach(function (R) {
        var s = Math.min(1, (R.x1 - R.x0) / bw, (R.y1 - R.y0) / bh);
        if (!best || s > best.s + 1e-6) best = { rot: rot, R: R, s: s, bw: bw, bh: bh };
      });
    });
    var s = best.s, R = best.R, x0 = R.x0 + (R.x1 - R.x0 - best.bw * s) / 2, y0 = R.y0 + (R.y1 - R.y0 - best.bh * s) / 2, tr;
    if (best.rot === 0) tr = 'translate(' + (x0 - s * b.x).toFixed(2) + ' ' + (y0 - s * b.y).toFixed(2) + ') scale(' + s.toFixed(4) + ')';
    else tr = 'translate(' + (x0 - s * b.y).toFixed(2) + ' ' + (y0 + s * (b.x + b.width)).toFixed(2) + ') scale(' + s.toFixed(4) + ') matrix(0 -1 1 0 0 0)';
    g.setAttribute('transform', tr);
  };
  window.fitSheetsIn = function (root) { root.querySelectorAll('svg').forEach(window.fitSheetSvg); };
})();
