import React, { useEffect, useState } from "react";
import { Box, Container, Typography, Divider } from "@mui/material";
import { fetchIssuesFromElectron, getIssuesFromStorage } from "./controllers/dataController";
import ChartPanel from "./components/ChartPanel";
import IssueTable from "./components/IssueTable";
import projectsData from "./projects.json";
import FilterPanel from "./components/FilterPanel";

const AUTO_FETCH_INTERVAL_MS = 1000 * 60 * 5; // 5 phút

function App() {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [filteredIssuesTable, setFilteredIssuesTable] = useState([]);

  const loadData = async () => {
    const localData = getIssuesFromStorage();
    if (localData && localData.length > 0 && 0>1) {
      console.log("Load from localStorage");
      setIssues(localData);
      setFilteredIssues(localData);
      setFilteredIssuesTable(localData);
    } else {
      console.log("Fetching from Electron API...");
      const allIssues = [];
      for (const project of projectsData.projects) {
        const projectIssues = await fetchIssuesFromElectron(project);
        allIssues.push(...projectIssues.map(issue => ({
          ...issue,
          url: project?.url  // Thêm tên project vào mỗi issue
        })));
      }
      setIssues(allIssues);
      setFilteredIssues(allIssues);
      setFilteredIssuesTable(allIssues);
      localStorage.setItem("issues", JSON.stringify(allIssues));
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, AUTO_FETCH_INTERVAL_MS);

    return () => clearInterval(interval); // Dọn dẹp interval khi component unmount
  }, []);

  const handleBarClick = (value, type) => {
    setFilteredIssuesTable([]);

    setTimeout(() => {
      let filtered = [];
      console.log(`Click on ${type} chart: ${value}`);
      if (type === 'project') {
        filtered = filteredIssues.filter(issue => issue.project?.name === value);
      } else if (type === '回答納期') {
        if (value === 'N/A') {
          filtered = filteredIssues.filter(issue =>
            !issue.custom_fields?.find(field => field.name === '回答納期' && field.value)
          );
        } else {
          filtered = filteredIssues.filter(issue =>
            issue.custom_fields?.find(field => field.name === '回答納期' && field.value === value)
          );
        }
      }

      setFilteredIssuesTable(filtered);
    }, 100);
  };

  const handleFilter = (filterConditions) => {
    const filtered = issues.filter((issue) => {
      if (filterConditions.status && issue.status?.name !== filterConditions.status) return false;
      if (filterConditions.keyword && !issue.subject?.includes(filterConditions.keyword)) return false;
      return true;
    });

    setFilteredIssues(filtered);
  };

  return (
    <Container maxWidth="xl">
      <Box py={2}>
        <Typography variant="h4" gutterBottom>
          Redmine Dashboard
        </Typography>

        {/* Vùng 1 - Bộ lọc */}
        <Box>
          <Typography variant="h6">Bộ lọc</Typography>
          <FilterPanel onFilter={handleFilter} />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Vùng 2 - Biểu đồ */}
        <Box>
          <Typography variant="h6">Biểu đồ thống kê</Typography>
          <ChartPanel data={filteredIssues} onBarClick={handleBarClick} />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Vùng 3 - Danh sách issue */}
        <Box>
          <Typography variant="h6">Danh sách Issue</Typography>
          <IssueTable rows={filteredIssuesTable} />
        </Box>
      </Box>
    </Container>
  );
}

export default App;