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
    this.qaNo = data.qaNo || '';
    this.subject = data.subject || '';
    this.status = data.status || '';
    this.priority = data.priority || '';
    this.assignee = data.assignee || '';
    this.author = data.author || '';
    this.createdOn = data.createdOn || '';
    this.description = data.description || '';
    this.attachments = data.attachments || [];
    this.projectId = data.projectId || '';
    this.projectName = data.projectName || '';
    this.trackerName = data.trackerName || '';
    this.module = data.module || '';
    this.fixMethod = data.fixMethod || '';
    this.questionVN = data.questionVN || '';
    this.questionJP = data.questionJP || '';
    this.answerJP = data.answerJP || '';
    this.answerVN =  data.answerVN || '';
  }

  static fromJSON(json) {
    return new TrackingIssue({
      issueId: json.issueId,
      qaNo: json.qaNo,
      subject: json.subject,
      status: json.status,
      priority: json.priority,
      assignee: json.assignee,
      author: json.author,
      createdOn: json.createdOn,
      description: json.description,
      attachments: json.attachments ? json.attachments.map(att => Attachment.fromJSON(att)) : [],
      projectId: json.projectId,
      projectName: json.projectName,
      trackerName: json.trackerName,
      module: json.module,
      fixMethod: json.fixMethod,
      questionVN: json.questionVN,
      questionJP: json.questionJP,
      answerJP: json.answerJP,
      answerVN: json.answerVN,
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
    this.trackingIssues = data.trackingIssues || [];
    this.bugCount = data.bugCount || 0;
    this.qaCount = data.qaCount || 0;
    this.bugResolvedCount = data.bugResolvedCount || 0;
    this.qaResolvedCount = data.qaResolvedCount || 0;
  }

  static fromJSON(json) {
    return new Program({
      prgid: json.prgid,
      prgname: json.prgname,
      frame: json.frame,
      phases: json.phases.map(p => Phase.fromJSON(p)),
      trackingIssues: json.trackingIssues?json.trackingIssues.map(i => TrackingIssue.fromJSON(i)):[],
    });
  }
}
module.exports = { Program, Phase, TrackingIssue, Attachment };