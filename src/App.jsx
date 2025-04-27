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

  const loadData = async () => {
    const localData = getIssuesFromStorage();
    if (localData && localData.length > 0) {
      console.log("Load from localStorage");
      setIssues(localData);
      setFilteredIssues(localData);
    } else {
      console.log("Fetching from Electron API...");
      const allIssues = [];
      for (const project of projectsData.projects) {
        const projectIssues = await fetchIssuesFromElectron(project);
        allIssues.push(...projectIssues.map(issue => ({
          ...issue,
          projectName: project.name // thêm tên project vào mỗi issue
        })));
      }
      setIssues(allIssues);
      setFilteredIssues(allIssues);
      localStorage.setItem("issues", JSON.stringify(allIssues));
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, AUTO_FETCH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

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
          <ChartPanel data={filteredIssues} />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Vùng 3 - Danh sách issue */}
        <Box>
          <Typography variant="h6">Danh sách Issue</Typography>
          <IssueTable data={filteredIssues} />
        </Box>
      </Box>
    </Container>
  );
}

export default App;