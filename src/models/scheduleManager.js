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

class ScheduleManager {
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }
}

module.exports = {
  Attachment,
  TrackingIssue,
  Phase,
  Program,
  ScheduleManager,
};