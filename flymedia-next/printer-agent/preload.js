const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  getConfig: () => ipcRenderer.invoke('get-config'),
  triggerTestPrint: () => ipcRenderer.invoke('trigger-test-print'),
  onConnectionStatus: (callback) => ipcRenderer.on('connection-status', (event, data) => callback(data)),
  onNewJobLog: (callback) => ipcRenderer.on('new-job-log', (event, data) => callback(data)),
});
