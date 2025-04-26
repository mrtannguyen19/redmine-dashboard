import axios from 'axios';

const LOCAL_STORAGE_KEY = 'issues';

export const fetchIssuesFromAPI = async (projectKey, apiUrl) => {
  try {
    const response = await axios.get(`${apiUrl}/issues.json`, {
      headers: {
        'X-Redmine-API-Key': projectKey
      }
    });
    const issues = response.data.issues;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(issues));
    return issues;
  } catch (err) {
    console.error("API fetch error:", err);
    return null;
  }
};

export const getIssuesFromStorage = () => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};