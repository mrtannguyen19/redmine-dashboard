const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  fetchIssues: (project) => ipcRenderer.invoke('fetch-issues', project)
});