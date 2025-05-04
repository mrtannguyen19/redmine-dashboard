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
      const response = await axios.get(url, {
        headers: { 'X-Redmine-API-Key': this.apiKey },
      });
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

  async fetchIssues(projectName, assignedToId = null) {
    try {
      const matchedProject = await this.findProjectByName(projectName);
      if (!matchedProject) return [];
  
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const createdAfter = sixMonthsAgo.toISOString().split('T')[0]; // YYYY-MM-DD
  
      let offset = 0;
      const limit = 100;
      let allIssues = [];
      let fetchedCount = 0;
  
      do {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());
        params.append('project_id', matchedProject.id.toString());
        params.append('status_id', '*');
        params.append('include', 'attachments');
        params.append('created_on', `>=${createdAfter}`); // Encode '>' as '%3E'
        if (assignedToId !== null) {
          params.append('assigned_to_id', assignedToId.toString());
        }
  
        const url = `${this.baseUrl}/issues.json?${params.toString()}`;
        const response = await axios.get(url, {
          headers: { 'X-Redmine-API-Key': this.apiKey },
        });
  
        const issues = response.data.issues || [];
        console.log(`GET issues InModel project ${projectName}: ${issues.length}`);
        allIssues = allIssues.concat(issues);
        fetchedCount = issues.length;
        offset += limit;
      } while (fetchedCount === limit);
  
      return allIssues;
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