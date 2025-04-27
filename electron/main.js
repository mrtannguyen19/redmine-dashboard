const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile(path.join(__dirname, "../public/index.html")); 
}

ipcMain.handle('fetch-issues', async (event, project) => {
  try {
    const response = await axios.get(`${project.url}/issues.json?limit=100`, {
      headers: {
        "X-Redmine-API-Key": project.key
      }
    });
    return response.data.issues;
  } catch (error) {
    console.error('Error fetching issues:', error.message);
    return [];
  }
});

app.whenReady().then(createWindow);