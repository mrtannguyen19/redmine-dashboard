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

  win.loadFile(path.join(__dirname, "../build/index.html"));
}

async function findProjectByName(project) {
  try {
    const response = await axios.get(`${project.url}/projects.json?limit=1000`, {
      headers: {
        'X-Redmine-API-Key': project.key
      }
    });

    const matched = response.data.projects.find(
      (p) => p.name.trim() === project.name.trim()
    );

    if (!matched) {
      console.warn(`Không tìm thấy project với tên "${project.name}"`);
      return null;
    }

    return matched;
  } catch (err) {
    console.error("Lỗi khi tìm project theo tên:", err.message);
    return null;
  }
}

ipcMain.handle('fetch-issues', async (event, project) => {
  try {
      const matchedProject = await findProjectByName(project);
      
      const response = await axios.get(`${project.url}/issues.json?limit=100&project_id=${matchedProject.id}`, {
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