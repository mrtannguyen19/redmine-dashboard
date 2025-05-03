class RedmineController {
  constructor(setIssues, setLoading) {
    this.setIssues = setIssues;
    this.setLoading = setLoading;
  }

  async loadData(filterConditions = null) {
    this.setLoading(true);
    const projectsData = require('../projects.json').projects;

    console.log('Fetching from Electron API for projects:', projectsData.map(p => p.name));
    const allIssues = [];
    for (const project of projectsData) {
      try {
        const projectIssues = await window.electronAPI.fetchIssues(project);
        console.log(`Fetched ${projectIssues.length} issues for project: ${project.name}`);
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

    let filteredIssues = allIssues;
    if (filterConditions) {
      filteredIssues = allIssues.filter((issue) => {
        if (filterConditions.status.length > 0 && !filterConditions.status.includes(issue.status?.name)) return false;
        if (filterConditions.keyword && !issue.subject?.includes(filterConditions.keyword)) return false;
        if (filterConditions.createdFrom && new Date(issue.created_on) < new Date(filterConditions.createdFrom)) return false;
        if (filterConditions.createdTo && new Date(issue.created_on) > new Date(filterConditions.createdTo)) return false;
        return true;
      });
    }

    this.setIssues(filteredIssues);
    this.setLoading(false);
  }

  handleApplyFilter(conditions) {
    this.loadData(conditions);
  }

  handleBarClick(value, type, currentIssues, setFilteredIssuesTable) {
    console.log('handleBarClick:', { value, type, issuesCount: currentIssues.length });
    let filtered = [];
    if (type === 'project') {
      filtered = currentIssues.filter((issue) => {
        const projectName = issue.project?.name || '';
        return projectName.trim() === value.trim();
      });
    } else if (type === '回答納期') {
      filtered = currentIssues.filter((issue) => {
        const dueDate = issue.custom_fields?.find((field) => field.name === '回答納期')?.value || 'N/A';
        return dueDate === value && !issue.status.is_closed;
      });
    }
    console.log('Filtered issues:', filtered.length);
    setFilteredIssuesTable(filtered);
  }
}

module.exports = RedmineController;