// Мост между окном редактора и файловой системой (окно само к диску доступа не имеет)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kc', {
  initialFile: () => ipcRenderer.invoke('initial-file'),
  open: () => ipcRenderer.invoke('open'),
  save: opts => ipcRenderer.invoke('save', opts),
  exportFile: opts => ipcRenderer.invoke('export', opts),
  setDirty: v => ipcRenderer.send('dirty', v),
  setTitle: t => ipcRenderer.send('title', t),
});
