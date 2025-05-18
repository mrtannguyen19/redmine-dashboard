class RedmineController {
  constructor(setIssues, setLoading) {
    this.setIssues = setIssues;
    this.setLoading = setLoading;
  }

  async loadData(filterConditions = {}) {
    this.setLoading(true);
    const projectsData = require('../projects.json').projects;
  
    const allIssues = [];
    for (const project of projectsData) {
      try {
        const projectIssues = await window.electronAPI.fetchIssues(project, filterConditions);
        allIssues.push(
          ...projectIssues.map((issue) => ({
            ...issue,
            url: project.url,
            project: { ...issue.project, apiKey: project.key },
          }))
        );
      } catch (error) {
        console.error(`Error fetching issues for project ${project.name}:`, error.message);
      }
    }
  
    try {
      await window.electronAPI.saveIssuesToStorage(allIssues);
    } catch (error) {
      console.error('Error saving issues to storage:', error.message);
    }
  
    this.setIssues(allIssues);
    this.setLoading(false);
  }

  handleApplyFilter(conditions) {
    this.loadData(conditions);
  }

  handleBarClick(value, type, currentIssues, setFilteredIssuesTable) {
    let filtered = [];
    if (type === 'project') {
      filtered = currentIssues.filter((issue) => {
        const projectName = issue.project?.name || '';
        return projectName.trim() === value.trim();
      });
    } else if (type === '回答納期') {
      filtered = currentIssues.filter((issue) => {
        const dueDate = issue.custom_fields?.find((field) => field.name === '回答納期')?.value || 'N/A';
        return dueDate === value;
      });
    }
    setFilteredIssuesTable(filtered);
  }
}

module.exports = RedmineController;