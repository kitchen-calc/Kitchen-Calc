/* Чертежи мастера → PDF или Word (.docx): каждый лист A4 альбомный, как на экране. Работает в браузере, без сервера.
   Листы (SVG) рисуются в картинки с высоким разрешением — кириллица и рамки выглядят так же, как на экране. */
(function () {
  var libs = {};
  function load(url, test) {
    if (libs[url]) return libs[url];
    libs[url] = new Promise(function (res, rej) {
      if (test()) return res();
      var s = document.createElement('script'); s.src = url; s.onload = res; s.onerror = function () { rej(new Error('Не удалось загрузить библиотеку (нужен интернет)')); }; document.head.appendChild(s);
    });
    return libs[url];
  }
  function svgToPng(html, scale) {   // html — содержимое листа (строка с <svg>)
    return new Promise(function (res, rej) {
      var box = document.createElement('div'); box.innerHTML = html; var svg = box.querySelector('svg'); if (!svg) return rej(new Error('нет svg'));
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); svg.setAttribute('width', '1190'); svg.setAttribute('height', '840'); svg.removeAttribute('style');
      var xml = new XMLSerializer().serializeToString(svg), url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })), img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas'); c.width = Math.round(1190 * scale); c.height = Math.round(840 * scale); var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); c.toBlob(function (b) { b ? res({ blob: b, w: c.width, h: c.height, url: c.toDataURL('image/png') }) : rej(new Error('не получилось нарисовать лист')); }, 'image/png');
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('лист не отрисовался')); }; img.src = url;
    });
  }
  function save(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); }
  var stamp = function () { var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '_' + p(d.getHours()) + '-' + p(d.getMinutes()); };
  var safe = function (n) { return String(n || 'Чертежи').replace(/[\/:*?"<>|]+/g, ' ').trim().slice(0, 50) || 'Чертежи'; };

  window.exportSheets = async function (sheets, kind, baseName, say) {
    say = say || function () {}; if (!sheets || !sheets.length) { say('Нет листов для сохранения'); return; }
    var name = safe(baseName) + ' чертежи ' + stamp();
    try {
      var imgs = [];
      for (var i = 0; i < sheets.length; i++) { say('Готовлю листы: ' + (i + 1) + ' из ' + sheets.length + '…'); imgs.push(await svgToPng(sheets[i], 2.2)); }
      if (kind === 'pdf') {
        await load('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', function () { return window.jspdf && window.jspdf.jsPDF; });
        var pdf = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
        imgs.forEach(function (im, k) { if (k) pdf.addPage('a4', 'landscape'); pdf.addImage(im.url, 'PNG', 0, 0, 297, 210, undefined, 'FAST'); });
        say('Сохраняю PDF…'); save(pdf.output('blob'), name + '.pdf'); say('PDF сохранён: ' + name + '.pdf');
      } else {
        await load('https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js', function () { return window.docx && window.docx.Document; });
        var D = window.docx, secs = [];
        for (var j = 0; j < imgs.length; j++) {
          var buf = new Uint8Array(await imgs[j].blob.arrayBuffer());
          secs.push({ properties: { page: { size: { width: 11906, height: 16838, orientation: D.PageOrientation.LANDSCAPE }, margin: { top: 240, bottom: 240, left: 240, right: 240 } } },
            children: [new D.Paragraph({ alignment: D.AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new D.ImageRun({ data: buf, type: 'png', transformation: { width: 1080, height: 762 } })] })] });
        }
        var doc = new D.Document({ creator: 'Kitchen Calc', title: name, sections: secs });
        say('Сохраняю Word…'); save(await D.Packer.toBlob(doc), name + '.docx'); say('Word сохранён: ' + name + '.docx');
      }
    } catch (e) { console.error(e); say('Не получилось: ' + (e && e.message || e)); alert('Не получилось сохранить чертежи: ' + (e && e.message || e)); }
  };
})();
