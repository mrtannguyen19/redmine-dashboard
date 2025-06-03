const fs = require('fs').promises; // Sử dụng promises để xử lý bất đồng bộ
const path = require('path');
const { app } = require('electron');
const axios = require('axios');
const winston = require('winston'); // Thêm logger
const importExcelFile = require('../models/excelImporter.js');
const { Program, Phase, TrackingIssue, Attachment } = require('../models/scheduleManager.js');

// Cấu hình logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: path.join(app.getPath('userData'), 'app.log') }),
    new winston.transports.Console(),
  ],
});

// Cấu hình storage
const STORAGE_PATH = path.join(app.getPath('userData'), 'schedules.json');

// Utility functions
const parsePhaseData = (phaseName, phaseData = {}) => {
  return new Phase({
    phaseName,
    deliveryDate: phaseData.deliveryDate || '',
    baselineEffort: phaseData.baselineEffort || 0,
    plannedStartDate: phaseData.plannedStartDate || '',
    plannedEndDate: phaseData.plannedEndDate || '',
    actualStartDate: phaseData.actualStartDate || '',
    actualEndDate: phaseData.actualEndDate || '',
    assignee: phaseData.assignee || '',
    progress: phaseData.progress || 0,
    actualEffort: phaseData.actualEffort || 0,
    designPages: phaseData.designPages || 0,
    testCases: phaseData.testCases || 0,
    defects: phaseData.defects || 0,
    notes: phaseData.notes || '',
  });
};

const parseIssueData = (issue) => {
  const customFieldValue = (fieldName) => issue.custom_fields?.find(field => field.name === fieldName)?.value || '';
  
  return new TrackingIssue({
    issueId: issue.id,
    qaNo: customFieldValue('Q&A No.'),
    subject: issue.subject || '',
    status: issue.status?.name || '',
    priority: issue.priority?.name || '',
    assignee: issue.assigned_to?.name || '',
    author: issue.author?.name || '',
    createdOn: issue.created_on || '',
    updatedOn: issue.updated_on || '',
    trackerName: issue.tracker?.name || '',
    module: customFieldValue('Module'),
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
    projectId: issue.project?.id || '',
    projectName: issue.project?.name || '',
    fixMethod: customFieldValue('Fix Method'),
    questionVN: customFieldValue('Question (VN)'),
    questionJP: customFieldValue('Question (JP)'),
    answerJP: customFieldValue('Answer (JP)'),
    answerVN: customFieldValue('Answer (VN)'),
  });
};

class ScheduleController {
  constructor(apiKey, baseUrl, trackingApiKey, trackingBaseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.trackingApiKey = trackingApiKey;
    this.trackingBaseUrl = trackingBaseUrl;
    this.validateConfig();
  }

  // Kiểm tra cấu hình
  validateConfig() {
    if (!this.apiKey || !this.baseUrl || !this.trackingApiKey || !this.trackingBaseUrl) {
      const error = new Error('Missing required configuration parameters');
      logger.error(error.message);
      throw error;
    }
  }

  async importFromExcel(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      const error = new Error('Invalid file path');
      logger.error(error.message);
      throw error;
    }

    try {
      logger.info(`Importing Excel file: ${filePath}`);
      const data = await importExcelFile(filePath);
      const programs = this.parseExcelData(data);
      logger.info(`Imported ${programs.length} programs from ${filePath}`);
      return programs;
    } catch (error) {
      logger.error(`Failed to import Excel file: ${error.message}`);
      throw error;
    }
  }

  parseExcelData(excelData) {
    if (!Array.isArray(excelData)) {
      logger.error('Invalid Excel data format: Expected an array');
      throw new Error('Invalid Excel data format');
    }

    return excelData.map((row, index) => {
      if (!row.prgid || !row.prgname) {
        logger.warn(`Skipping invalid row at index ${index}: Missing prgid or prgname`);
        return null;
      }

      return new Program({
        prgid: row.prgid,
        prgname: row.prgname,
        frame: row.frame || '',
        phases: [
          parsePhaseData('Design', row.design),
          parsePhaseData('Review', row.review),
          parsePhaseData('Coding', row.coding),
          parsePhaseData('Testing', row.testing),
        ],
        bugCount: 0,
        qaCount: 0,
        bugResolvedCount: 0,
        qaResolvedCount: 0,
        trackingIssues: [],
      });
    }).filter(program => program !== null);
  }

  async fetchTrackingIssues(projectId, phaseName = null) {
    if (!projectId) {
      logger.error('Invalid project ID');
      return [];
    }

    try {
      logger.info(`Fetching tracking issues for project ${projectId}${phaseName ? `, phase: ${phaseName}` : ''}`);
      const params = new URLSearchParams({
        project_id: projectId,
        status_id: '*',
        limit: '100',
      });

      let allIssues = [];
      let offset = 0;
      let totalCount = 0;

      do {
        params.set('offset', offset);
        const url = `${this.trackingBaseUrl}/issues.json?${params.toString()}`;
        const response = await axios.get(url, {
          headers: { 'X-Redmine-API-Key': this.trackingApiKey },
          timeout: 10000, // Thêm timeout
        });

        allIssues = [...allIssues, ...response.data.issues];
        totalCount = response.data.total_count;
        offset += response.data.limit;
      } while (offset < totalCount);

      const parsedIssues = allIssues.map(parseIssueData);
      logger.info(`Fetched ${parsedIssues.length} issues for project ${projectId}`);
      return parsedIssues;
    } catch (error) {
      logger.error(`Failed to fetch tracking issues: ${error.message}`);
      return [];
    }
  }

  async updateSchedulesWithIssues(schedules, project) {
    if (!project?.ProjectID || !Array.isArray(schedules)) {
      logger.error('Invalid project or schedules');
      return schedules;
    }

    try {
      logger.info(`Updating schedules with issues for project ${project.ProjectID}`);
      const issues = await this.fetchTrackingIssues(project.ProjectID);
      if (!issues.length) {
        logger.warn(`No issues found for project ${project.ProjectID}`);
        return schedules;
      }

      const updatedSchedules = schedules.map(schedule => {
        const trackingIssues = issues.filter(issue => issue.module?.includes(schedule.prgid)) || [];
        return new Program({
          ...schedule,
          trackingIssues,
          bugCount: trackingIssues.filter(issue => issue.trackerName === 'Bug').length,
          qaCount: trackingIssues.filter(issue => issue.trackerName === 'Q&A').length,
          bugResolvedCount: trackingIssues.filter(issue => issue.status === 'Resolved' && issue.trackerName === 'Bug').length,
          qaResolvedCount: trackingIssues.filter(issue => issue.status === 'Resolved' && issue.trackerName === 'Q&A').length,
        });
      });

      logger.info(`Updated ${updatedSchedules.length} schedules with ${issues.length} issues`);
      return updatedSchedules;
    } catch (error) {
      logger.error(`Failed to update schedules with issues: ${error.message}`);
      return schedules;
    }
  }

  async saveToStorage(programs) {
    if (!Array.isArray(programs)) {
      logger.error('Invalid programs data: Expected an array');
      throw new Error('Invalid programs data');
    }

    try {
      logger.info(`Saving ${programs.length} programs to storage: ${STORAGE_PATH}`);
      await fs.writeFile(STORAGE_PATH, JSON.stringify(programs, null, 2));
      logger.info('Successfully saved programs to storage');
      return true;
    } catch (error) {
      logger.error(`Failed to save programs to storage: ${error.message}`);
      throw error;
    }
  }

  async getFromStorage() {
    try {
      logger.info(`Reading programs from storage: ${STORAGE_PATH}`);
      if (!await fs.access(STORAGE_PATH).then(() => true).catch(() => false)) {
        logger.warn('Storage file does not exist');
        return [];
      }

      const data = await fs.readFile(STORAGE_PATH, 'utf8');
      const programs = JSON.parse(data).map(p => Program.fromJSON(p));
      logger.info(`Loaded ${programs.length} programs from storage`);
      return programs;
    } catch (error) {
      logger.error(`Failed to read programs from storage: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ScheduleController;