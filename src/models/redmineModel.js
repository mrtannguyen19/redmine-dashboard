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

  async fetchIssues(projectName, filterConditions = {}) {
    try {
      // Find project by name
      const matchedProject = await this.findProjectByName(projectName);
      if (!matchedProject) {
        console.warn(`Project "${projectName}" not found.`);
        return [];
      }
  
      // Calculate default date range: last 12 months from now
      const now = new Date();
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(now.getMonth() - 12);
  
      // Use filterConditions if provided, otherwise default to 12-month range
      const createdFrom = filterConditions.createdFrom || twelveMonthsAgo.toISOString().split('T')[0]; // YYYY-MM-DD
      const createdTo = filterConditions.createdTo || now.toISOString().split('T')[0]; // YYYY-MM-DD
      const statusFilter = filterConditions.status || []; // Array of status names
      const assignedTo = filterConditions.assignedTo || ''; // Name of assigned user
  
      let offset = 0;
      const limit = 100;
      let allIssues = [];
  
      // Map status names to status IDs (if needed)
       let statusIds = [];
      // if (statusFilter.length > 0) {
      //   // Fetch available statuses from Redmine API
      //   const statusUrl = `${this.baseUrl}/issue_statuses.json`;
      //   const statusResponse = await axios.get(statusUrl, {
      //     headers: { 'X-Redmine-API-Key': this.apiKey },
      //   });
      //   statusIds = statusResponse.data.issue_statuses
      //     .filter((s) => statusFilter.includes(s.name))
      //     .map((s) => s.id);
      // }
  
      // Fetch user ID for assignedTo (if provided)
       let assignedToId = '';
      // if (assignedTo) {
      //   const userUrl = `${this.baseUrl}/users.json?name=${encodeURIComponent(assignedTo)}`;
      //   const userResponse = await axios.get(userUrl, {
      //     headers: { 'X-Redmine-API-Key': this.apiKey },
      //   });
      //   const matchedUser = userResponse.data.users.find(
      //     (u) => u.firstname + ' ' + u.lastname === assignedTo.trim()
      //   );
      //   assignedToId = matchedUser ? matchedUser.id : '';
      // }
  
      // Paginate through issues
      while (true) {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());
        params.append('project_id', matchedProject.id.toString());
        //params.append('status_id', statusIds.length > 0 ? statusIds.join('|') : '*');
        params.append('include', 'attachments');
  
        // Add date range filter
        if (createdFrom && createdTo) {
          params.append('created_on', `><${createdFrom}|${createdTo}`);
        }
  
        // Add assigned_to_id filter
        if (assignedToId) {
          params.append('assigned_to_id', assignedToId);
        }
  
        const url = `${this.baseUrl}/issues.json?${params.toString()}`;
        const response = await axios.get(url, {
          headers: { 'X-Redmine-API-Key': this.apiKey },
        });
  
        let issues = response.data.issues || [];
  
        allIssues = allIssues.concat(issues);
  
        // Break loop if fewer issues than limit are returned (end of pagination)
        if (issues.length < limit) {
          break;
        }
  
        offset += limit;
      }
  
      return allIssues;
    } catch (error) {
      // Enhanced error handling
      if (error.response) {
        console.error(
          `Redmine API error: ${error.response.status} - ${error.response.statusText}`,
          error.response.data
        );
      } else if (error.request) {
        console.error('No response received from Redmine API:', error.request);
      } else {
        console.error('Error setting up Redmine API request:', error.message);
      }
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