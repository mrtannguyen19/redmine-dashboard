const axios = require('axios');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

class RedmineModel {
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async findProjectByName(projectName) {
    try {
      const url = `${this.baseUrl}/projects.json?limit=1000`;
      console.log('Fetching projects with URL:', url);
      console.log('Using API Key:', this.apiKey);
      const response = await axios.get(url, {
        headers: { 'X-Redmine-API-Key': this.apiKey },
      });
      console.log('Projects response:', response.data);
      const matched = response.data.projects.find((p) => p.name.trim() === projectName.trim());
      if (!matched) {
        console.warn(`Không tìm thấy project với tên "${projectName}"`);
        return null;
      }
      return matched;
    } catch (err) {
      console.error('Lỗi khi tìm project theo tên:', err.message, err.stack);
      throw err;
    }
  }

  async fetchIssues(projectName) {
    try {
      const matchedProject = await this.findProjectByName(projectName);
      if (!matchedProject) return [];
      const url = `${this.baseUrl}/issues.json?limit=100&project_id=${matchedProject.id}&status_id=*&include=attachments`;
      console.log('Fetching issues with URL:', url);
      const response = await axios.get(url, {
        headers: { 'X-Redmine-API-Key': this.apiKey },
      });
      console.log('Issues response:', response.data);
      return response.data.issues || [];
    } catch (error) {
      console.error('Lỗi khi fetch issues:', error.message, error.stack);
      throw error;
    }
  }

  getIssuesFromStorage() {
    try {
      const storagePath = path.join(app.getPath('userData'), 'issues.json');
      if (fs.existsSync(storagePath)) {
        const data = fs.readFileSync(storagePath, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (err) {
      console.error('Lỗi khi đọc issues từ storage:', err.message);
      throw err;
    }
  }

  saveIssuesToStorage(issues) {
    try {
      const storagePath = path.join(app.getPath('userData'), 'issues.json');
      fs.writeFileSync(storagePath, JSON.stringify(issues));
    } catch (err) {
      console.error('Lỗi khi lưu issues vào storage:', err.message);
      throw err;
    }
  }
}

module.exports = RedmineModel;