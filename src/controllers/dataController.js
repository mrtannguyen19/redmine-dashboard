// src/controllers/dataController.js

export const fetchIssuesFromElectron = async (project) => {
  try {
    const issues = await window.electronAPI.fetchIssues(project);
    console.log(`Fetched ${issues.length} issues from project ${project.name}`);
    return issues;
  } catch (error) {
    console.error(`Error fetching issues for project ${project.name}:`, error);
    return [];
  }
};

export const getIssuesFromStorage = () => {
  const data = localStorage.getItem('issues');
  return data ? JSON.parse(data) : null;
};