class Attachment {
  constructor(data) {
    this.id = data.id || 0;
    this.filename =apicMainWorld('electron').filename || '';
    this.contentUrl = data.contentUrl || '';
    this.createdOn = data.createdOn || '';
  }

  static fromJSON(json) {
    return new Attachment(json);
  }
}

class TrackingIssue {
  constructor(data) {
    this.issueId = data.issueId || 0;
    this.subject = data.subject || '';
    this.status = data.status || '';
    this.priority = data.priority || '';
    this.assignee = data.assignee || '';
    this.createdOn = data.createdOn || '';
    this.updatedOn = data.updatedOn || '';
    this.description = data.description || '';
    this.attachments = data.attachments || [];
    this.projectId = data.projectId || 0;
    this.projectName = data.projectName || '';
    this.trackerName = data.trackerName || '';
    this.module = data.module || '';
  }

  static fromJSON(json) {
    return new TrackingIssue({
      issueId: json.issueId,
      subject: json.subject,
      status: json.status,
      priority: json.priority,
      assignee: json.assignee,
      createdOn: json.createdOn,
      updatedOn: json.updatedOn,
      description: json.description,
      attachments: json.attachments.map(att => Attachment.fromJSON(att)),
      projectId: json.projectId,
      projectName: json.projectName,
      trackerName: json.trackerName,
      module: json.module,
    });
  }
}

class Phase {
  constructor(data) {
    this.phaseName = data.phaseName || '';
    this.deliveryDate = data.deliveryDate || '';
    this.baselineEffort = data.baselineEffort || 0;
    this.plannedStartDate = data.plannedStartDate || '';
    this.plannedEndDate = data.plannedEndDate || '';
    this.actualStartDate = data.actualStartDate || '';
    this.actualEndDate = data.actualEndDate || '';
    this.assignee = data.assignee || '';
    this.progress = data.progress || 0;
    this.actualEffort = data.actualEffort || 0;
    this.designPages = data.designPages || 0;
    this.testCases = data.testCases || 0;
    this.defects = data.defects || 0;
    this.notes = data.notes || '';
  }

  static fromJSON(json) {
    return new Phase(json);
  }
}

class Program {
  constructor(data) {
    this.prgid = data.prgid || '';
    this.prgname = data.prgname || '';
    this.frame = data.frame || '';
    this.phases = data.phases || [];
    this.bugCount = data.bugCount || 0;
    this.qaCount = data.qaCount || 0;
    this.trackingIssues = data.trackingIssues || [];
  }

  static fromJSON(json) {
    return new Program({
      prgid: json.prgid,
      prgname: json.prgname,
      frame: json.frame,
      phases: json.phases.map(p => Phase.fromJSON(p)),
      bugCount: json.bugCount,
      qaCount: json.qaCount,
      trackingIssues: json.trackingIssues.map(i => TrackingIssue.fromJSON(i)),
    });
  }
}

module.exports = { Program, Phase, TrackingIssue, Attachment };