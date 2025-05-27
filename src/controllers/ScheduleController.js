const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const axios = require('axios');
const importExcelFile = require('../models/excelImporter.js');
const {
  Program,
  Phase,
  TrackingIssue,
  Attachment,
} = require('../models/scheduleManager.js');

class ScheduleController {
  constructor(apiKey, baseUrl, trackingApiKey, trackingBaseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.trackingApiKey = trackingApiKey;
    this.trackingBaseUrl = trackingBaseUrl;
  }

  async importFromExcel(filePath) {
    try {
      const data = await importExcelFile(filePath);
      return this.parseExcelData(data);
    } catch (error) {
      console.error('ScheduleController importFromExcel error:', error.message);
      throw error;
    }
  }

  parseExcelData(excelData) {
    const programs = [];
    excelData.forEach((row) => {
      const program = new Program({
        prgid: row.prgid,
        prgname: row.prgname,
        frame: row.frame,
        phases: [
          this.createPhase('Design', row.design),
          this.createPhase('Review', row.review),
          this.createPhase('Coding', row.coding),
          this.createPhase('Testing', row.testing),
        ],
        bugCount: 0,
        qaCount: 0,
        bugResolvedCount: 0,
        qaResovledCount: 0,
        trackingIssues: [],
      });
      programs.push(program);
    });
    return programs;
  }

  createPhase(phaseName, phaseData) {
    return new Phase({
      phaseName,
      deliveryDate: phaseData?.deliveryDate || '',
      baselineEffort: phaseData?.baselineEffort || 0,
      plannedStartDate: phaseData?.plannedStartDate || '',
      plannedEndDate: phaseData?.plannedEndDate || '',
      actualStartDate: phaseData?.actualStartDate || '',
      actualEndDate: phaseData?.actualEndDate || '',
      assignee: phaseData?.assignee || '',
      progress: phaseData?.progress || 0,
      actualEffort: phaseData?.actualEffort || 0,
      designPages: phaseData?.designPages || 0,
      testCases: phaseData?.testCases || 0,
      defects: phaseData?.defects || 0,
      notes: phaseData?.notes || '',
    });
  }

  async fetchTrackingIssues(projectId, phaseName = null) {
    try {
      const params = new URLSearchParams();
      params.append('project_id', projectId);
      if (phaseName) {
        params.append('cf_phase', phaseName);
      }
      params.append('status_id', '*');
      params.append('limit', 100);

      let allIssues = [];
      let offset = 0;
      let totalCount = 0;

      do {
        params.set('offset', offset);
        const url = `${this.trackingBaseUrl}/issues.json?${params.toString()}`;
        const response = await axios.get(url, {
          headers: { 'X-Redmine-API-Key': this.trackingApiKey },
        });

        allIssues = [...allIssues, ...response.data.issues];
        totalCount = response.data.total_count;
        offset += response.data.limit;
      } while (offset < totalCount);
      //allIssues = require('../tracking.json').issues;
      return allIssues.map((issue) => {
        const moduleField = issue.custom_fields?.find(field => field.name === 'Module')?.value || '';
        const fixMethod = issue.custom_fields?.find(field => field.name === 'Fix Method')?.value || '';
        const questionVN = issue.custom_fields?.find(field => field.name === 'Question (VN)')?.value || '';
        const questionJP = issue.custom_fields?.find(field => field.name === 'Question (JP)')?.value || '';
        const answerJP = issue.custom_fields?.find(field => field.name === 'Answer (JP)')?.value || '';
        const answerVN = issue.custom_fields?.find(field => field.name === 'Answer (VN)')?.value || '';
        return new TrackingIssue({
          issueId: issue.id,
          qaNo: issue.custom_fields?.find(field => field.name === 'Q&A No.')?.value || '',
          subject: issue.subject,
          status: issue.status.name,
          priority: issue.priority.name,
          assignee: issue.assigned_to?.name || '',
          author: issue.author?.name || '',
          createdOn: issue.created_on,
          updatedOn: issue.updated_on,
          trackerName: issue.tracker.name,
          module: moduleField,
          description: issue.description || '',
          attachments: issue.attachments?.map(
            (att) =>
              new Attachment({
                id: att.id,
                filename: att.filename,
                contentUrl: att.content_url,
                createdOn: att.created_on,
              })
          ) || [],
          projectId: issue.project.id,
          projectName: issue.project.name,
          fixMethod: fixMethod,
          questionVN: questionVN,
          questionJP: questionJP,
          answerJP: answerJP,
          answerVN: answerVN,
        });
      });
    } catch (error) {
      console.error('Error fetching Tracking issues:', error.message);
      return [];
    }
  }

  async updateSchedulesWithIssues(schedules, project) {
    try {
      const issues = await this.fetchTrackingIssues(project.ProjectID);
      if (!issues || issues.length === 0) {
        return schedules;
      }
      const updatedSchedules = schedules.map(schedule => {
        //const schedule = raw instanceof Program ? raw : Program.fromJSON(raw);
        schedule.trackingIssues = issues.filter(issue => issue.module?.includes(schedule.prgid)) || [];
        schedule.bugCount = schedule.trackingIssues.length > 0 ? schedule.trackingIssues.filter(issue => issue.trackerName === 'Bug').length : 0;
        schedule.qaCount = schedule.trackingIssues.length > 0 ? schedule.trackingIssues.filter(issue => issue.trackerName === 'Q&A').length : 0;
        schedule.bugResolvedCount = schedule.trackingIssues.length > 0 ? schedule.trackingIssues.filter(issue => issue.status === 'Resolved' && issue.trackerName === 'Bug').length : 0;
        schedule.qaResolvedCount = schedule.trackingIssues.length > 0 ? schedule.trackingIssues.filter(issue => issue.status === 'Resolved' && issue.trackerName === 'Q&A').length : 0;
        return schedule;
      });
      return updatedSchedules;
    } catch (error) {
      console.error('Error updating schedules with issues:', error.message);
      return schedules;
    }
  }

  async saveToStorage(programs) {
    try {
      const storagePath = path.join(app.getPath('userData'), 'schedules.json');
      fs.writeFileSync(storagePath, JSON.stringify(programs, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving schedules to storage:', error.message);
      throw error;
    }
  }

  async getFromStorage() {
    try {
      const storagePath = path.join(app.getPath('userData'), 'schedules.json');
      if (fs.existsSync(storagePath)) {
        const data = fs.readFileSync(storagePath, 'utf8');
        return JSON.parse(data).map(p => Program.fromJSON(p));
      }
      return [];
    } catch (error) {
      console.error('Error reading schedules from storage:', error.message);
      throw error;
    }
  }
}

module.exports = ScheduleController;