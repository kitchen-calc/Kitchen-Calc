// Kitchen Calc Studio — окно программы, открытие/сохранение файлов (всё остальное — в app/editor.js)
const { app, BrowserWindow, ipcMain, dialog, Menu, protocol, net } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

// Файлы программы отдаются по адресу app://studio/... — так в окне работают JS-модули (с file:// они бы не загрузились)
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
// Если видеокарта недоступна или в чёрном списке — 3D всё равно работает программно (иначе Chromium отключает WebGL)
app.commandLine.appendSwitch('enable-unsafe-swiftshader');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// Журнал ошибок: %APPDATA%\Kitchen Calc Studio\kcs-log.txt — его можно прислать, если программа не работает
function log(msg) {
  try { fs.appendFileSync(path.join(app.getPath('userData'), 'kcs-log.txt'), `[${new Date().toISOString()}] ${msg}\n`); } catch (e) { /* нет доступа к папке */ }
}
process.on('uncaughtException', e => { log('main: ' + (e.stack || e)); dialog.showErrorBox('Kitchen Calc Studio', 'Ошибка запуска:\n' + (e.message || e)); });

const PROJECT_FILTERS = [{ name: 'Проект Kitchen Calc', extensions: ['kcp'] }, { name: 'Все файлы', extensions: ['*'] }];
let win = null;
let dirty = false;

// Файл проекта, с которым программу открыли (двойной клик по .kcp)
function fileFromArgs(argv) {
  return argv.slice(1).find(a => /\.kcp$/i.test(a) && fs.existsSync(a)) || null;
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1000, minHeight: 640,
    backgroundColor: '#15130f',
    title: 'Kitchen Calc Studio',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true },
  });
  Menu.setApplicationMenu(null);
  win.loadURL('app://studio/app/index.html');
  win.webContents.on('console-message', (e, level, message, line, source) => { if (level >= 2) log(`renderer: ${message} (${source}:${line})`); });
  win.webContents.on('did-fail-load', (e, code, desc, url) => {
    log(`load failed ${code} ${desc} ${url}`);
    dialog.showErrorBox('Kitchen Calc Studio', `Не удалось открыть окно программы (${desc}).\nЖурнал: ${path.join(app.getPath('userData'), 'kcs-log.txt')}`);
  });
  win.webContents.on('render-process-gone', (e, d) => {
    log('render process gone: ' + d.reason);
    dialog.showErrorBox('Kitchen Calc Studio', 'Окно программы аварийно закрылось (' + d.reason + '). Попробуйте запустить ещё раз.');
  });
  win.on('close', e => {
    if (!dirty) return;
    const r = dialog.showMessageBoxSync(win, {
      type: 'question', buttons: ['Выйти без сохранения', 'Отмена'], defaultId: 1, cancelId: 1,
      title: 'Kitchen Calc Studio', message: 'Проект не сохранён. Выйти без сохранения?',
    });
    if (r !== 0) e.preventDefault();
  });
}

ipcMain.handle('initial-file', () => {
  const p = fileFromArgs(process.argv);
  return p ? { path: p, data: fs.readFileSync(p, 'utf8') } : null;
});

ipcMain.handle('open', async () => {
  const r = await dialog.showOpenDialog(win, { filters: PROJECT_FILTERS, properties: ['openFile'] });
  if (r.canceled || !r.filePaths.length) return null;
  const p = r.filePaths[0];
  return { path: p, data: fs.readFileSync(p, 'utf8') };
});

ipcMain.handle('save', async (e, { data, path: p, saveAs, name }) => {
  if (!p || saveAs) {
    const r = await dialog.showSaveDialog(win, { defaultPath: p || (name || 'Проект') + '.kcp', filters: PROJECT_FILTERS });
    if (r.canceled || !r.filePath) return null;
    p = r.filePath;
  }
  fs.writeFileSync(p, data, 'utf8');
  return p;
});

// Экспорт: картинка (base64) или текст (спецификация CSV)
ipcMain.handle('export', async (e, { name, ext, text, base64 }) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: name + '.' + ext, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, base64 != null ? Buffer.from(base64, 'base64') : text);
  return r.filePath;
});

ipcMain.on('dirty', (e, v) => { dirty = !!v; });
ipcMain.on('title', (e, t) => { if (win) win.setTitle(t); });

// Второй запуск (двойной клик по ярлыку, пока программа открыта) — просто показываем уже открытое окно
if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

app.whenReady().then(() => {
  log(`start ${app.getVersion()} electron ${process.versions.electron} ${process.platform} ${require('os').release()}`);
  protocol.handle('app', req => {
    const file = path.normalize(path.join(__dirname, decodeURIComponent(new URL(req.url).pathname)));
    if (!file.startsWith(__dirname + path.sep)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
});
app.on('window-all-closed', () => app.quit());
