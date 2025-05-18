const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const axios = require('axios');

class Attachment {
  constructor({ id, filename, contentUrl, createdOn }) {
    this.id = id;
    this.filename = filename;
    this.contentUrl = contentUrl;
    this.createdOn = createdOn;
  }
}

class TrackingIssue {
  constructor({
    issueId,
    subject,
    status,
    priority,
    assignee,
    createdOn,
    updatedOn,
    description,
    attachments = [],
    projectId,
    projectName,
  }) {
    this.issueId = issueId;
    this.subject = subject;
    this.status = status;
    this.priority = priority;
    this.assignee = assignee;
    this.createdOn = createdOn;
    this.updatedOn = updatedOn;
    this.description = description;
    this.attachments = attachments;
    this.projectId = projectId;
    this.projectName = projectName;
  }
}

class Phase {
  constructor({
    phaseName,
    deliveryDate,
    baselineEffort,
    plannedStartDate,
    plannedEndDate,
    actualStartDate,
    actualEndDate,
    assignee,
    progress,
    actualEffort,
    designPages,
    testCases,
    defects,
    notes,
    trackingIssues = [],
  }) {
    this.phaseName = phaseName;
    this.deliveryDate = deliveryDate;
    this.baselineEffort = baselineEffort;
    this.plannedStartDate = plannedStartDate;
    this.plannedEndDate = plannedEndDate;
    this.actualStartDate = actualStartDate;
    this.actualEndDate = actualEndDate;
    this.assignee = assignee;
    this.progress = progress;
    this.actualEffort = actualEffort;
    this.designPages = designPages;
    this.testCases = testCases;
    this.defects = defects;
    this.notes = notes;
    this.trackingIssues = trackingIssues;
  }
}

class Program {
  constructor({
    prgid,
    prgname,
    frame,
    phases,
    trackingIssues = [],
  }) {
    this.prgid = prgid;
    this.prgname = prgname;
    this.frame = frame;
    this.phases = phases || [];
    this.trackingIssues = trackingIssues;
  }
}

const importExcelFile = require('./excelImporter.js'); // Adjust path if needed

class ScheduleManager {
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async importFromExcel(filePath) {
    try {
      const data = await importExcelFile(filePath);
      // Process or store data as needed
      return data;
    } catch (error) {
      console.error('ScheduleManager importFromExcel error:', error.message);
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

  saveToStorage() {
    try {
      const storagePath = path.join(app.getPath('userData'), 'schedules.json');
      fs.writeFileSync(storagePath, JSON.stringify(this.programs));
    } catch (error) {
      console.error('Error saving schedules to storage:', error.message);
    }
  }

  getFromStorage() {
    try {
      const storagePath = path.join(app.getPath('userData'), 'schedules.json');
      if (fs.existsSync(storagePath)) {
        const data = fs.readFileSync(storagePath, 'utf8');
        this.programs = JSON.parse(data).map(
          (p) =>
            new Program({
              prgid: p.prgid,
              prgname: p.prgname,
              frame: p.frame,
              phases: p.phases.map(
                (ph) =>
                  new Phase({
                    phaseName: ph.phaseName,
                    deliveryDate: ph.deliveryDate,
                    baselineEffort: ph.baselineEffort,
                    plannedStartDate: ph.plannedStartDate,
                    plannedEndDate: ph.plannedEndDate,
                    actualStartDate: ph.actualStartDate,
                    actualEndDate: ph.actualEndDate,
                    assignee: ph.assignee,
                    progress: ph.progress,
                    actualEffort: ph.actualEffort,
                    designPages: ph.designPages,
                    testCases: ph.testCases,
                    defects: ph.defects,
                    notes: ph.notes,
                    trackingIssues: ph.trackingIssues.map(
                      (ti) =>
                        new TrackingIssue({
                          issueId: ti.issueId,
                          subject: ti.subject,
                          status: ti.status,
                          priority: ti.priority,
                          assignee: ti.assignee,
                          createdOn: ti.createdOn,
                          updatedOn: ti.updatedOn,
                          description: ti.description,
                          attachments: ti.attachments.map(
                            (att) =>
                              new Attachment({
                                id: att.id,
                                filename: att.filename,
                                contentUrl: att.contentUrl,
                                createdOn: att.createdOn,
                              })
                          ),
                          projectId: ti.projectId,
                          projectName: ti.projectName,
                        })
                    ),
                  })
              ),
              trackingIssues: p.trackingIssues.map(
                (ti) =>
                  new TrackingIssue({
                    issueId: ti.issueId,
                    subject: ti.subject,
                    status: ti.status,
                    priority: ti.priority,
                    assignee: ti.assignee,
                    createdOn: ti.createdOn,
                    updatedOn: ti.updatedOn,
                    description: ti.description,
                    attachments: ti.attachments.map(
                      (att) =>
                        new Attachment({
                          id: att.id,
                          filename: att.filename,
                          contentUrl: att.contentUrl,
                          createdOn: att.createdOn,
                        })
                    ),
                    projectId: ti.projectId,
                    projectName: ti.projectName,
                  })
              ),
            })
        );
        return this.programs;
      }
      return [];
    } catch (error) {
      console.error('Error reading schedules from storage:', error.message);
      return [];
    }
  }
}

module.exports = ScheduleManager;