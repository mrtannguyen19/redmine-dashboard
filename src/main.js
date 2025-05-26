const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const RedmineModel = require('./models/redmineModel');
const ScheduleController = require('./controllers/ScheduleController');

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
  win.maximize();
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';",
        ],
      },
    });
  });

  win.loadFile(path.join(__dirname, '../build/index.html')).catch((err) => {
    console.error('Error loading index.html:', err);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('select-excel-file', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    const filePath = result.filePaths[0];
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return filePath;
  } catch (error) {
    console.error('IPC select-excel-file error:', error.message);
    throw error;
  }
});

ipcMain.handle('import-schedule', async (event, filePath) => {
  const controller = new ScheduleController('', '', '', '');
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const data = await controller.importFromExcel(filePath);
    return data;
  } catch (error) {
    console.error('IPC import-schedule error:', error.message);
    return [];
  }
});

ipcMain.handle('load-schedule', async (event, projectId) => {
  try {
    const projectsPath = path.join(__dirname, 'projects.json');
    const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
    const project = projects.find(p => p.ProjectID === projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const controller = new ScheduleController(
      project.TrackingAPIKey,
      project.TrackingURL,
      project.TrackingAPIKey,
      project.TrackingURL
    );

    if (!project.SchedulePath || !project.ScheduleFileName) {
      throw new Error('Invalid project schedule path or filename');
    }
    const filePath = path.join(project.SchedulePath, project.ScheduleFileName);
    const schedules = await controller.importFromExcel(filePath);
    return { schedules, filePath };
  } catch (error) {
    console.error('IPC load-schedule error:', error.message);
    throw error;
  }
});

ipcMain.handle('update-schedule-issues', async (event, projectId, schedules) => {
  try {
    const projectsPath = path.join(__dirname, 'projects.json');
    const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
    const project = projects.find(p => p.ProjectID === projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const controller = new ScheduleController(
      project.TrackingAPIKey,
      project.TrackingURL,
      project.TrackingAPIKey,
      project.TrackingURL
    );

    const updatedSchedules = await controller.updateSchedulesWithIssues(schedules, project);
    await controller.saveToStorage(updatedSchedules);
    return updatedSchedules;
  } catch (error) {
    console.error('IPC update-schedule-issues error:', error.message);
    throw error;
  }
});

ipcMain.handle('fetch-issues', async (event, project, filterConditions) => {
  const model = new RedmineModel(project.RedmineAPIKey, project.RedmineURL);
  try {
    const issues = await model.fetchIssues(project.RedmineName, filterConditions);
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

ipcMain.handle('fetch-schedule-issues', async (event, prgid, phaseName) => {
  const controller = new ScheduleController('', '', '', '');
  try {
    return await controller.fetchTrackingIssues(prgid, phaseName);
  } catch (error) {
    console.error('IPC fetch-schedule-issues error:', error.message);
    return [];
  }
});

ipcMain.handle('get-schedules', async () => {
  try {
    const storagePath = path.join(app.getPath('userData'), 'schedules.json');
    if (fs.existsSync(storagePath)) {
      const data = fs.readFileSync(storagePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('IPC get-schedules error:', error.message);
    return [];
  }
});

ipcMain.handle('compute-project-paths', async (event, rootPath) => {
  try {
    if (!fs.existsSync(rootPath)) {
      // throw new Error(`RootPath does not exist: ${rootPath}`);
    }
    const designPath = path.join(rootPath, '01_Development','01.02_Design');
    const testingPath = path.join(rootPath, '01_Development','01.04_Testing');
    const schedulePath = path.join(rootPath, '02_Management','02.02_Monitoring and Control','_Schedule (Internal)');
   
 
    let scheduleFileName = [];
    if (fs.existsSync(schedulePath)) {
      const files = fs.readdirSync(schedulePath).filter(file => file.endsWith('.xlsm')
      );
      scheduleFileName = files.length > 0 ? files:[];
    }
    
    return {
      DesignPath: designPath,
      TestingPath: testingPath,
      SchedulePath: schedulePath,
      ScheduleFileName: scheduleFileName
    };
  } catch (error) {
    console.error('IPC compute-project-paths error:', error.message);
    return {
      DesignPath: '',
      TestingPath: '',
      SchedulePath: '',
      ScheduleFileName: ''
    };
  }
});

ipcMain.handle('get-projects', async () => {
  try {
    const projectsPath = path.join(__dirname, 'projects.json');
    if (!fs.existsSync(projectsPath)) {
      fs.writeFileSync(projectsPath, JSON.stringify([], null, 2));
    }
    const data = fs.readFileSync(projectsPath, 'utf8');
    try {
      const parsed = JSON.parse(data);
      return parsed;
    } catch (parseError) {
      console.error('Invalid JSON in projects.json, resetting to empty array');
      fs.writeFileSync(projectsPath, JSON.stringify([], null, 2));
      return [];
    }
  } catch (error) {
    console.error('IPC get-projects error:', error.message);
    return [];
  }
});

ipcMain.handle('save-projects', async (event, projects) => {
  try {
    const projectsPath = path.join(__dirname, 'projects.json');
    const updatedProjects = await Promise.all(projects.map(async (project) => {
      let computedPaths = {};
      if (project.RootPath) {
        // computedPaths = await ipcMain.handle('compute-project-paths', null, project.RootPath);
      }
      return {
        ProjectID: project.ProjectID || '',
        RootPath: project.RootPath || '',
        DesignPath: computedPaths.DesignPath || project.DesignPath || '',
        TestingPath: computedPaths.TestingPath || project.TestingPath || '',
        SchedulePath: computedPaths.SchedulePath || project.SchedulePath || '',
        ScheduleFileName: computedPaths.ScheduleFileName || project.ScheduleFileName || '',
        TrackingURL: project.TrackingURL || '',
        TrackingAPIKey: project.TrackingAPIKey || '',
        RedmineName: project.RedmineName || '',
        RedmineURL: project.RedmineURL || '',
        RedmineAPIKey: project.RedmineAPIKey || ''
      };
    }));
    fs.writeFileSync(projectsPath, JSON.stringify(updatedProjects, null, 2));
    return true;
  } catch (error) {
    console.error('IPC save-projects error:', error.message);
    return false;
  }
});