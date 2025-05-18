import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { Box, Container, Typography, Divider, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import HomeScreen from './HomeScreen';
import SettingsPanel from './SettingsPanel';
import SchedulePanel from './SchedulePanel';
import ChartPanel from './ChartPanel';
import IssueTable from './IssueTable';
import FilterPanel from './FilterPanel';
import RedmineController from '../controllers/redmineController';

const RedmineContext = createContext();

export const useRedmine = () => useContext(RedmineContext);

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [filteredIssuesTable, setFilteredIssuesTable] = useState([]);
  const [isLoading, setLoading] = useState(false);

  const controller = useMemo(() => new RedmineController(setIssues, setLoading), []);

  useEffect(() => {
    if (currentScreen === 'redmine') {
      async function initialize() {
        try {
          const localData = await window.electronAPI.getIssuesFromStorage();
          if (localData && localData.length > 0 && 0 > 1) {
            setIssues(localData);
            setFilteredIssues(localData);
            setFilteredIssuesTable(localData);
          } else {
            await controller.loadData();
          }
        } catch (error) {
          console.error('Error initializing app:', error.message);
        }
      }
      initialize();
    }
  }, [currentScreen, controller]);

  useEffect(() => {
    if (filteredIssues !== issues) {
      setFilteredIssues(issues);
    }
    if (filteredIssuesTable !== issues) {
      setFilteredIssuesTable(issues);
    }
  }, [issues]);

  const handleApplyFilter = (conditions) => {
    controller.handleApplyFilter(conditions);
  };

  const handleBarClick = (value, type) => {
    controller.handleBarClick(value, type, filteredIssues, setFilteredIssuesTable);
  };

  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    return (
      <AnimatePresence>
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
        >
          {(() => {
            switch (currentScreen) {
              case 'home':
                return <HomeScreen onNavigate={handleNavigate} />;
              case 'settings':
                return <SettingsPanel onBack={() => handleNavigate('home')} />;
              case 'schedule':
                return <SchedulePanel onBack={() => handleNavigate('home')} />;
              case 'redmine':
                return (
                  <Container maxWidth="xl">
                    <Box py={2}>
                      <Typography variant="h4" gutterBottom align="center">
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
                      <Box mt={2}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleNavigate('home')}
                        >
                          Back to Home
                        </Button>
                      </Box>
                    </Box>
                  </Container>
                );
              default:
                return <HomeScreen onNavigate={handleNavigate} />;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <RedmineContext.Provider
      value={{
        issues,
        filteredIssues,
        filteredIssuesTable,
        isLoading,
        handleApplyFilter,
        handleBarClick,
      }}
    >
      {renderScreen()}
    </RedmineContext.Provider>
  );
}

export default App;