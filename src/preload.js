const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  fetchIssues: (project) => ipcRenderer.invoke('fetch-issues', project),
  saveIssuesToStorage: (issues) => ipcRenderer.invoke('save-issues-to-storage', issues),
  getIssuesFromStorage: () => ipcRenderer.invoke('get-issues-from-storage'),
});