import React, { useEffect, useState } from "react";
import { Box, Container, Typography, Divider } from "@mui/material";
import { fetchIssuesFromAPI, getIssuesFromStorage } from "./controllers/dataController";
import FilterPanel from "./components/FilterPanel";
import ChartPanel from "./components/ChartPanel";
import IssueTable from "./components/IssueTable";
import projects from "./projects.json"; // danh sách project từ file json

const AUTO_FETCH_INTERVAL_MS = 1000 * 60 * 5; // 5 phút

function App() {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [currentProject, setCurrentProject] = useState(projects.project[0]); // project đầu tiên

  // Lấy dữ liệu từ localStorage hoặc API
  const loadData = async () => {
    const localData = getIssuesFromStorage();
    if (localData && localData.length > 0) {
      console.log("Load from localStorage");
      setIssues(localData);
      setFilteredIssues(localData);
    } else {
      console.log("No local data, fetch from API...");
      const data = await fetchIssuesFromAPI(currentProject.key, currentProject.url);
      if (data) {
        setIssues(data);
        setFilteredIssues(data);
      } else {
        alert("Không lấy được dữ liệu từ API và không có dữ liệu local.");
      }
    }
  };

  // Tự động refresh data
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      fetchIssuesFromAPI(currentProject.key, currentProject.url).then((data) => {
        if (data) {
          setIssues(data);
          setFilteredIssues(data);
        }
      });
    }, AUTO_FETCH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [currentProject]);

  // Xử lý filter từ FilterPanel
  const handleFilter = (filterConditions) => {
    const filtered = issues.filter((issue) => {
      // ví dụ: lọc theo status
      if (filterConditions.status && issue.status?.name !== filterConditions.status) {
        return false;
      }
      if (filterConditions.keyword && !issue.subject.includes(filterConditions.keyword)) {
        return false;
      }
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