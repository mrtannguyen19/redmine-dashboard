const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  importSchedule: (filePath) => ipcRenderer.invoke('import-schedule', filePath),
  selectExcelFile: () => ipcRenderer.invoke('select-excel-file'),
  fetchIssues: (project, filterConditions) => ipcRenderer.invoke('fetch-issues', project, filterConditions),
  saveIssuesToStorage: (issues) => ipcRenderer.invoke('save-issues-to-storage', issues),
  getIssuesFromStorage: () => ipcRenderer.invoke('get-issues-from-storage'),
  fetchScheduleIssues: (prgid, phaseName) => ipcRenderer.invoke('fetch-schedule-issues', prgid, phaseName),
  getSchedules: () => ipcRenderer.invoke('get-schedules'),
  getProjects: () => ipcRenderer.invoke('get-projects'),
  saveProjects: (projects) => ipcRenderer.invoke('save-projects', projects),
  computeProjectPaths: (rootPath) => ipcRenderer.invoke('compute-project-paths', rootPath)
});
