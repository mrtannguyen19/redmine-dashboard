import { useState, useEffect } from 'react';
import axios from 'axios';
import { getCustomFieldValue } from '../utils/helpers';

const CACHE_KEY = 'redmine_issues_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

const RedmineModel = (apiKeysFile) => {
  const [nearDueIssues, setNearDueIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [projectData, setProjectData] = useState({ labels: [], datasets: [] });
  const [dueDateData, setDueDateData] = useState({ labels: [], datasets: [] });
  const [priorityData, setPriorityData] = useState({ labels: [], datasets: [] });
  const [projectFjnErrorData, setProjectFjnErrorData] = useState({ labels: [], datasets: [] });
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
    if (!Array.isArray(issues) || issues.length === 0) {
      console.error('processIssues: issues is not an array or is empty', issues);
      setNearDueIssues([]);
      setFilteredIssues([]);
      setProjectData({ labels: [], datasets: [] });
      setDueDateData({ labels: [], datasets: [] });
      setPriorityData({ labels: [], datasets: [] });
      setProjectFjnErrorData({ labels: [], datasets: [] });
      return;
    }
  
    const issuesWithUrl = issues.map(issue => {
      const projectName = issue.project?.name || 'Unknown';
      const apiKey = apiKeys.find(key => key.project === projectName) || {};
      const redmineUrl = apiKey.url ? `${apiKey.url}/issues/${issue.id}` : '#';
      return { ...issue, redmineUrl };
    });
  
    setNearDueIssues(issuesWithUrl);
    setFilteredIssues(issuesWithUrl);
  
    // Project Data
    const projectCount = issuesWithUrl.reduce((acc, issue) => {
      acc[issue.project.name] = (acc[issue.project.name] || 0) + 1;
      return acc;
    }, {});
    setProjectData({
      labels: Object.keys(projectCount),
      datasets: [{ label: 'プロジェクトごとの課題数', data: Object.values(projectCount), backgroundColor: '#36A2EB', borderColor: '#36A2EB', borderWidth: 1 }],
    });
  
    // Due Date Data
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
  
    // Priority Data
    const priorityCount = issuesWithUrl.reduce((acc, issue) => {
      acc[issue.priority?.name || 'Unknown'] = (acc[issue.priority?.name || 'Unknown'] || 0) + 1;
      return acc;
    }, {});
    setPriorityData({
      labels: Object.keys(priorityCount),
      datasets: [{ data: Object.values(priorityCount), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50'] }],
    });
  
    // Project FJN Error Data
    const projectFjnErrorCount = {};
    issuesWithUrl.forEach((issue) => {
      const project = issue.project?.name || 'Unknown';
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

  const fetchIssues = async (keys) => {
    setLoading(true);
    let allIssues = [];
    try {
      for (const { key, url } of keys) {
        const proxyUrl = 'https://redmine-proxy.onrender.com/redmine-api'; // Thay bằng URL proxy Render của bạn
        const response = await axios.get(`${proxyUrl}/issues.json?limit=200&sort=created_on:desc&assigned_to_id=me`, {
          headers: {
            'X-Redmine-API-Key': key,
            'X-Target-URL': url,
          },
        });
        allIssues = [...allIssues, ...(response.data.issues || [])];
      }
      allIssues = Array.from(new Map(allIssues.map(issue => [issue.id, issue])).values());
      console.log('Fetched issues:', allIssues);
      processIssues(allIssues, keys);
      localStorage.setItem(CACHE_KEY, JSON.stringify(allIssues));
      localStorage.setItem(`${CACHE_KEY}_time`, new Date().getTime());
    } catch (error) {
      console.error('Error fetching issues:', error);
      setNearDueIssues([]);
      setFilteredIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      if (!apiKeysFile) {
        setLoading(false);
        return; // Chưa chọn file, không làm gì
      }

      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const xmlText = e.target.result;
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
          const accounts = xmlDoc.getElementsByTagName('account');
          const keys = Array.from(accounts).map(account => ({
            project: account.getElementsByTagName('project')[0].textContent,
            key: account.getElementsByTagName('key')[0].textContent,
            url: account.getElementsByTagName('url')[0].textContent,
          }));
          setApiKeys(keys);

          const cachedData = localStorage.getItem(CACHE_KEY);
          const cachedTime = localStorage.getItem(`${CACHE_KEY}_time`);
          const now = new Date().getTime();

          if (cachedData && cachedTime && (now - cachedTime < CACHE_EXPIRY)) {
            processIssues(JSON.parse(cachedData), keys);
          } else if (keys.length > 0) {
            fetchIssues(keys);
          }
          setLoading(false);
        };
        reader.readAsText(apiKeysFile); // Đọc file XML tại client
      } catch (error) {
        console.error('Error reading apiKeys.xml:', error);
        setApiKeys([]);
        setLoading(false);
      }
    };
    initialize();
  }, [apiKeysFile]); // Chạy lại khi file thay đổi

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