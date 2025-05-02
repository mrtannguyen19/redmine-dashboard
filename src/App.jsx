import React, { useEffect, useState } from "react";
import { Box, Container, Typography, Divider, Button } from "@mui/material";
import axios from "axios";
import fs from "fs";
import path from "path";
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
          projectName: issue.project?.name  // Thêm tên project vào mỗi issue
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

  const handleProjectClick = (projectName) => {
    // Step 1: Clear bảng trước
    setFilteredIssuesTable([]);
  
    // Step 2: Sau đó load lại dữ liệu lọc
    setTimeout(() => {
      const filtered = filteredIssues.filter(issue => issue.project?.name === projectName);
      setFilteredIssuesTable(filtered);
    }, 100); // Delay nhẹ 100ms cho đẹp
  };

  const handleFilter = (filterConditions) => {
    const filtered = issues.filter((issue) => {
      if (filterConditions.status && issue.status?.name !== filterConditions.status) return false;
      if (filterConditions.keyword && !issue.subject?.includes(filterConditions.keyword)) return false;
      return true;
    });

    setFilteredIssues(filtered);
  };

  const handleGetProjectIds = async () => {
    const updatedProjects = [];

    for (const project of projectsData.projects) {
      try {
        const res = await axios.get(`${project.url}/projects.json?limit=1000`, {
          headers: {
            "X-Redmine-API-Key": project.key
          }
        });

        const matched = res.data.projects.find(p => p.name.trim() === project.name.trim());
        if (matched) {
          updatedProjects.push({ ...project, id: matched.id });
        } else {
          console.warn(`Không tìm thấy project "${project.name}"`);
          updatedProjects.push(project);
        }
      } catch (err) {
        console.error(`Lỗi khi get project_id cho "${project.name}":`, err.message);
        updatedProjects.push(project);
      }
    }

    const filePath = path.join(__dirname, "projects.json");
    fs.writeFileSync(filePath, JSON.stringify({ projects: updatedProjects }, null, 2), "utf-8");
    alert("Đã cập nhật project_id vào projects.json");
  };

  const handleFetchIssues = async () => {
    const allIssues = [];

    for (const project of projectsData.projects) {
      if (!project.id) continue;

      try {
        const response = await axios.get(`${project.url}/issues.json?limit=100&project_id=${project.id}`, {
          headers: {
            "X-Redmine-API-Key": project.key
          }
        });

        const issues = response.data.issues.map(issue => ({
          ...issue,
          projectName: issue.project?.name
        }));

        allIssues.push(...issues);
      } catch (error) {
        console.error(`Lỗi khi fetch issue cho ${project.name}:`, error.message);
      }
    }

    setIssues(allIssues);
    setFilteredIssues(allIssues);
    setFilteredIssuesTable(allIssues);
    localStorage.setItem("issues", JSON.stringify(allIssues));
  };

  return (
    <Container maxWidth="xl">
      <Box py={2}>
        <Box display="flex" gap={2} mb={2}>
          <Button variant="contained" onClick={handleGetProjectIds}>Get Project IDs</Button>
          <Button variant="outlined" onClick={handleFetchIssues}>Fetch Issues</Button>
        </Box>
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
          <ChartPanel data={filteredIssues} onProjectClick={handleProjectClick} />
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