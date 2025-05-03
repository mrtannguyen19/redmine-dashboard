import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { Box, Container, Typography, Divider } from '@mui/material';
import ChartPanel from './ChartPanel';
import IssueTable from './IssueTable';
import FilterPanel from './FilterPanel';
import RedmineController from '../controllers/redmineController';

const RedmineContext = createContext();

export const useRedmine = () => useContext(RedmineContext);

function App() {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [filteredIssuesTable, setFilteredIssuesTable] = useState([]);
  const [isLoading, setLoading] = useState(false);

  // Memoize controller để tránh tạo instance mới mỗi lần render
  const controller = useMemo(() => new RedmineController(setIssues, setLoading), []);

  useEffect(() => {
    console.log('useEffect initialize called');
    async function initialize() {
      try {
        const localData = await window.electronAPI.getIssuesFromStorage();
        if (localData && localData.length > 0) {
          console.log('Loaded issues from storage:', localData.length);
          setIssues(localData);
          setFilteredIssues(localData);
          setFilteredIssuesTable(localData);
        } else {
          console.log('No local data, fetching from API');
          await controller.loadData();
        }
      } catch (error) {
        console.error('Error initializing app:', error.message);
      }
    }
    initialize();

    // Tạm thời vô hiệu hóa interval để debug
    // const interval = setInterval(() => {
    //   controller.loadData();
    // }, 1000 * 60 * 5);
    // return () => clearInterval(interval);
  }, []); // Loại bỏ dependency [controller]

  // useEffect(() => {
  //   console.log('useEffect issues updated, issues length:', issues.length);
  //   // Chỉ cập nhật nếu issues thực sự thay đổi
  //   if (filteredIssues !== issues) {
  //     setFilteredIssues(issues);
  //   }
  //   if (filteredIssuesTable !== issues) {
  //     setFilteredIssuesTable(issues);
  //   }
  // }, [issues, filteredIssues, filteredIssuesTable]);

  const handleApplyFilter = (conditions) => {
    console.log('Applying filter with conditions:', conditions);
    controller.handleApplyFilter(conditions);
  };

  const handleBarClick = (value, type) => {
    console.log('App handleBarClick:', { value, type });
    controller.handleBarClick(value, type, filteredIssues, setFilteredIssuesTable);
  };

  return (
    <RedmineContext.Provider value={{ issues, filteredIssues, filteredIssuesTable, isLoading, handleApplyFilter, handleBarClick }}>
      <Container maxWidth="xl">
        <Box py={2}>
          <Typography variant="h4" gutterBottom>
            Redmine Dashboard
          </Typography>
          <Box>
            <Typography variant="h6">Bộ lọc</Typography>
            <FilterPanel />
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography variant="h6">Biểu đồ thống kê</Typography>
            <ChartPanel />
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography variant="h6">Danh sách Issue</Typography>
            <IssueTable />
          </Box>
        </Box>
      </Container>
    </RedmineContext.Provider>
  );
}

export default App;