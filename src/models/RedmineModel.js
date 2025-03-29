import { useState, useEffect } from 'react';
import axios from 'axios';
import { getCustomFieldValue } from '../utils/helpers';

const CACHE_KEY = 'redmine_issues_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

const RedmineModel = () => {
  const [nearDueIssues, setNearDueIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [projectData, setProjectData] = useState({});
  const [dueDateData, setDueDateData] = useState({});
  const [priorityData, setPriorityData] = useState({});
  const [projectFjnErrorData, setProjectFjnErrorData] = useState({});
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState([]);
  const [filters, setFilters] = useState({
    stt: '',
    ticketNo: '',
    generatedPgId: '',
    projectName: '',
    author: '',
    desiredDeliveryDate: '',
    responseDeliveryDate: '',
    fjnErrorType: '',
    ucdErrorType: '',
    unitId: '',
    editPgId: '',
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showCharts, setShowCharts] = useState({
    project: true,
    dueDate: true,
    priority: true,
    projectFjnError: true,
  });
  const [showAllCharts, setShowAllCharts] = useState(true);

  const processIssues = (issues, apiKeys) => {
    // Thêm URL cho mỗi issue dựa trên project và apiKeys
    const issuesWithUrl = issues.map(issue => {
      const projectName = issue.project.name;
      const apiKey = apiKeys.find(key => key.project === projectName);
      const redmineUrl = apiKey ? `${apiKey.url}/issues/${issue.id}` : '#'; // Mặc định là '#' nếu không tìm thấy
      return { ...issue, redmineUrl };
    });

    setNearDueIssues(issuesWithUrl);
    setFilteredIssues(issuesWithUrl);

    const projectCount = issuesWithUrl.reduce((acc, issue) => {
      acc[issue.project.name] = (acc[issue.project.name] || 0) + 1;
      return acc;
    }, {});
    setProjectData({
      labels: Object.keys(projectCount),
      datasets: [{ label: 'プロジェクトごとの課題数', data: Object.values(projectCount), backgroundColor: '#36A2EB', borderColor: '#36A2EB', borderWidth: 1 }],
    });

    const responseDueDates = issuesWithUrl.map((issue) => getCustomFieldValue(issue.custom_fields, '回答納期')).filter(date => date !== 'N/A');
    const dueDateCount = responseDueDates.reduce((acc, date) => {
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    const topDueDates = Object.entries(dueDateCount).sort((a, b) => b[1] - a[1]).slice(0, 7);
    const sortedDueDates = topDueDates.sort((a, b) => new Date(a[0]) - new Date(b[0]));
    setDueDateData({
      labels: sortedDueDates.map(([date]) => date),
      datasets: [{ label: '回答納期ごとの課題数', data: sortedDueDates.map(([, count]) => count), backgroundColor: '#FF6384', borderColor: '#FF6384', borderWidth: 1 }],
    });

    const priorityCount = issuesWithUrl.reduce((acc, issue) => {
      acc[issue.priority.name] = (acc[issue.priority.name] || 0) + 1;
      return acc;
    }, {});
    setPriorityData({
      labels: Object.keys(priorityCount),
      datasets: [{ data: Object.values(priorityCount), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50'] }],
    });

    const projectFjnErrorCount = {};
    issuesWithUrl.forEach((issue) => {
      const project = issue.project.name;
      const fjnErrorType = getCustomFieldValue(issue.custom_fields, 'FJN側障害種別');
      if (!projectFjnErrorCount[project]) projectFjnErrorCount[project] = {};
      projectFjnErrorCount[project][fjnErrorType] = (projectFjnErrorCount[project][fjnErrorType] || 0) + 1;
    });
    const projects = Object.keys(projectFjnErrorCount);
    const fjnErrorTypes = [...new Set(issuesWithUrl.map(issue => getCustomFieldValue(issue.custom_fields, 'FJN側障害種別')))];
    const datasets = fjnErrorTypes.map((errorType, index) => ({
      label: errorType,
      data: projects.map(project => projectFjnErrorCount[project][errorType] || 0),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9966FF', '#FF9F40'][index % 6],
    }));
    setProjectFjnErrorData({ labels: projects, datasets });
  };

  const loadApiKeysFromXML = async () => {
    try {
      const response = await fetch('/apiKeys.xml');
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
      const accounts = xmlDoc.getElementsByTagName('account');
      const keys = Array.from(accounts).map(account => ({
        project: account.getElementsByTagName('project')[0].textContent,
        key: account.getElementsByTagName('key')[0].textContent,
        url: account.getElementsByTagName('url')[0].textContent,
      }));
      return keys;
    } catch (error) {
      console.error('Error loading apiKeys.xml:', error);
      return [];
    }
  };

  const fetchIssues = async (keys) => {
    setLoading(true);
    let allIssues = [];
    try {
      for (const { key, url } of keys) {
        const response = await axios.get('/redmine-api/issues.json?limit=200&sort=created_on:desc&assigned_to_id=me', {
          headers: { 'X-Redmine-API-Key': key, 'X-Target-URL': url },
        });
        allIssues = [...allIssues, ...(response.data.issues || [])];
      }
      allIssues = Array.from(new Map(allIssues.map(issue => [issue.id, issue])).values());
      processIssues(allIssues, keys); // Truyền apiKeys vào processIssues
      localStorage.setItem(CACHE_KEY, JSON.stringify(allIssues));
      localStorage.setItem(`${CACHE_KEY}_time`, new Date().getTime());
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const keys = await loadApiKeysFromXML();
      setApiKeys(keys);
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(`${CACHE_KEY}_time`);
      const now = new Date().getTime();

      if (cachedData && cachedTime && (now - cachedTime < CACHE_EXPIRY)) {
        processIssues(JSON.parse(cachedData), keys);
      } else if (keys.length > 0) {
        await fetchIssues(keys);
      }
      setLoading(false);
    };
    initialize().catch(error => {
      console.error('Initialization error:', error);
      setLoading(false);
    });
  }, []);

  return {
    nearDueIssues,
    filteredIssues,
    setFilteredIssues,
    projectData,
    dueDateData,
    priorityData,
    projectFjnErrorData,
    selectedFilter,
    setSelectedFilter,
    loading,
    apiKeys,
    filters,
    setFilters,
    sortConfig,
    setSortConfig,
    showCharts,
    setShowCharts,
    showAllCharts,
    setShowAllCharts,
    processIssues,
    fetchIssues,
  };
};

export default RedmineModel;