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
      return data;
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
      });
      programs.push(program);
    });
    return programs;
  }

  createPhase(phaseName, phaseData) {
    return new Phase({
      phaseName,
      deliveryDate: phaseData?.delivery_date || '',
      baselineEffort: phaseData?.baseline_effort || 0,
      plannedStartDate: phaseData?.planned_start_date || '',
      plannedEndDate: phaseData?.planned_end_date || '',
      actualStartDate: phaseData?.actual_start_date || '',
      actualEndDate: phaseData?.actual_end_date || '',
      assignee: phaseData?.assignee || '',
      progress: phaseData?.progress || 0,
      actualEffort: phaseData?.actual_effort || 0,
      designPages: phaseData?.design_pages || 0,
      testCases: phaseData?.test_cases || 0,
      defects: phaseData?.defects || 0,
      notes: phaseData?.notes || '',
    });
  }

  async fetchTrackingIssues(prgid, phaseName = null) {
    try {
      const params = new URLSearchParams();
      params.append('project_id', prgid);
      if (phaseName) {
        params.append('cf_phase', phaseName);
      }

      const url = `${this.trackingBaseUrl}/issues.json?${params.toString()}`;
      const response = await axios.get(url, {
        headers: { 'X-Redmine-API-Key': this.trackingApiKey },
      });

      return response.data.issues.map(
        (issue) =>
          new TrackingIssue({
            issueId: issue.id,
            subject: issue.subject,
            status: issue.status.name,
            priority: issue.priority.name,
            assignee: issue.assigned_to?.name,
            createdOn: issue.created_on,
            updatedOn: issue.updated_on,
            description: issue.description,
            attachments: issue.attachments.map(
              (att) =>
                new Attachment({
                  id: att.id,
                  filename: att.filename,
                  contentUrl: att.content_url,
                  createdOn: att.created_on,
                })
            ),
            projectId: issue.project.id,
            projectName: issue.project.name,
          })
      );
    } catch (error) {
      console.error('Error fetching Tracking issues:', error.message);
      return [];
    }
  }

  saveToStorage(programs) {
    try {
      const storagePath = path.join(app.getPath('userData'), 'schedules.json');
      fs.writeFileSync(storagePath, JSON.stringify(programs));
    } catch (error) {
      console.error('Error saving schedules to storage:', error.message);
    }
  }

  getFromStorage() {
    try {
      const storagePath = path.join(app.getPath('userData'), 'schedules.json');
      if (fs.existsSync(storagePath)) {
        const data = fs.readFileSync(storagePath, 'utf8');
        return JSON.parse(data).map(
          (p) =>
            new Program({
              prgid: p.prgid,
              prgname: p.prgname,
              frame: p.frame,
              phases: p.phases.map(
                (ph) =>
                  new Phase({
                    ...ph,
                    trackingIssues: ph.trackingIssues.map(
                      (ti) =>
                        new TrackingIssue({
                          ...ti,
                          attachments: ti.attachments.map(
                            (att) => new Attachment(att)
                          ),
                        })
                    ),
                  })
              ),
              trackingIssues: p.trackingIssues.map(
                (ti) =>
                  new TrackingIssue({
                    ...ti,
                    attachments: ti.attachments.map(
                      (att) => new Attachment(att)
                    ),
                  })
              ),
            })
        );
      }
      return [];
    } catch (error) {
      console.error('Error reading schedules from storage:', error.message);
      return [];
    }
  }
}

module.exports = ScheduleController;
