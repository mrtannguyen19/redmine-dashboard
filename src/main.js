const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const RedmineModel = require('./models/redmineModel');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadFile(path.join(__dirname, '../build/index.html')).catch((err) => {
    console.error('Error loading index.html:', err);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('fetch-issues', async (event, project) => {
  const model = new RedmineModel(project.key, project.url);
  try {
    const issues = await model.fetchIssues(project.name);
    return issues;
  } catch (error) {
    console.error('IPC fetch-issues error:', error.message);
    return [];
  }
});

ipcMain.handle('save-issues-to-storage', async (event, issues) => {
  const model = new RedmineModel('', '');
  try {
    model.saveIssuesToStorage(issues);
    return true;
  } catch (error) {
    console.error('IPC save-issues-to-storage error:', error.message);
    return false;
  }
});

ipcMain.handle('get-issues-from-storage', async () => {
  const model = new RedmineModel('', '');
  try {
    return model.getIssuesFromStorage() || [];
  } catch (error) {
    console.error('IPC get-issues-from-storage error:', error.message);
    return [];
  }
});