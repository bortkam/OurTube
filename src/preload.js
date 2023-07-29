const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('darkMode', {
  system: () => ipcRenderer.invoke('dark-mode:system')
});