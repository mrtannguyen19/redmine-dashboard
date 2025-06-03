import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Button, Box, Container, Typography, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, Grid,
  Accordion, AccordionSummary, AccordionDetails, Card, CardContent, CircularProgress, TextField, Zoom,
  Dialog, DialogTitle, DialogContent, DialogActions, ThemeProvider, createTheme
} from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import { Bar } from 'react-chartjs-2';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

ChartJS.register(CategoryScale, LinearScale, PointElement, BarElement, Title, Tooltip, Legend);
ModuleRegistry.registerModules([AllCommunityModule]);

// Custom MUI theme with modern colors and dark mode support
const theme = createTheme({
  palette: {
    mode: 'light', // Support for dark mode toggle
    primary: { main: '#1e88e5', light: '#6ab7ff', dark: '#005cb2' },
    secondary: { main: '#e91e63', light: '#ff6090', dark: '#b0003a' },
    success: { main: '#4caf50' },
    warning: { main: '#ffca28' },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
      ...(localStorage.getItem('themeMode') === 'dark' && {
        default: '#121212',
        paper: '#1e1e1e',
      }),
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    h6: { fontWeight: 700, letterSpacing: 0.2 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.2s, background-color 0.2s',
          '&:hover': { transform: 'scale(1.05)', backgroundColor: '#005cb2' },
          borderRadius: '20px',
          textTransform: 'none',
          padding: '8px 24px',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          marginBottom: '16px',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #ffffff, #f0f4f8)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          transition: 'box-shadow 0.3s ease',
          '&:hover': { boxShadow: '0 6px 24px rgba(0, 0, 0, 0.15)' },
        },
      },
    },
  },
});

// Utility functions
const getPhaseProgressStyle = (value) => {
  const progress = Number(value) * 100;
  if (isNaN(progress) || progress === 0) return {};
  let backgroundColor = '';
  if (progress < 50) {
    backgroundColor = '#ffca28';
  } else if (progress >= 50 && progress <= 99) {
    const ratio = (progress - 50) / 50;
    backgroundColor = `hsl(120, 100%, ${50 - ratio * 20}%)`;
  } else {
    backgroundColor = '#4caf50';
  }
  return { backgroundColor, color: '#fff', borderRadius: '4px', textAlign: 'center' };
};

const formatProgress = (value) => {
  const progress = Number(value);
  return isNaN(progress) ? '' : `${(progress * 100).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 0 })}`;
};

const getIssueCountStyle = (resolved, total) => {
  if (resolved === 0 && total === 0) {
    return { backgroundColor: '#f5f5f5', color: '#9e9e9e' };
  } else if (resolved < total) {
    return { backgroundColor: '#fdecea', color: '#b71c1c' };
  }
  return { backgroundColor: '#e6f4ea', color: '#1b5e20' };
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
};

// Column definitions
const getGridColumns = (currentProjectURL) => {
  const phases = ['Design', 'Review', 'Coding', 'Testing'];
  const phaseColumns = phases.flatMap((phase) => [
    {
      field: `${phase.toLowerCase()}_deliveryDate`,
      headerName: `${phase} Delivery Date`,
      width: 150,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: `${phase.toLowerCase()}_baselineEffort`,
      headerName: `${phase} Baseline Effort`,
      width: 150,
      valueFormatter: (params) => Number(params.value).toLocaleString() || '0',
    },
    {
      field: `${phase.toLowerCase()}_plannedStartDate`,
      headerName: `${phase} Planned Start`,
      width: 150,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: `${phase.toLowerCase()}_plannedEndDate`,
      headerName: `${phase} Planned End`,
      width: 150,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: `${phase.toLowerCase()}_actualStartDate`,
      headerName: `${phase} Actual Start`,
      width: 150,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: `${phase.toLowerCase()}_actualEndDate`,
      headerName: `${phase} Actual End`,
      width: 150,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: `${phase.toLowerCase()}_assignee`,
      headerName: `${phase} Assignee`,
      width: 150,
    },
    {
      field: `${phase.toLowerCase()}_progress`,
      headerName: `${phase} %`,
      width: 100,
      cellStyle: (params) => getPhaseProgressStyle(params.value),
      valueFormatter: (params) => formatProgress(params.value),
    },
    {
      field: `${phase.toLowerCase()}_actualEffort`,
      headerName: `${phase} Actual Effort`,
      width: 150,
      valueFormatter: (params) => Number(params.value).toLocaleString() || '0',
    },
    {
      field: `${phase.toLowerCase()}_designPages`,
      headerName: `${phase} Design Pages`,
      width: 150,
      valueFormatter: (params) => Number(params.value).toLocaleString() || '0',
    },
    {
      field: `${phase.toLowerCase()}_testCases`,
      headerName: `${phase} Test Cases`,
      width: 150,
      valueFormatter: (params) => Number(params.value).toLocaleString() || '0',
    },
    {
      field: `${phase.toLowerCase()}_defects`,
      headerName: `${phase} Defects`,
      width: 150,
      valueFormatter: (params) => Number(params.value).toLocaleString() || '0',
    },
    {
      field: `${phase.toLowerCase()}_notes`,
      headerName: `${phase} Notes`,
      width: 200,
      wrapText: true,
      autoHeight: true,
    },
  ]);

  return [
    { field: 'id', headerName: 'ID', width: 90, pinned: 'left' },
    { field: 'prgid', headerName: 'Program ID', width: 120, pinned: 'left' },
    { field: 'prgname', headerName: 'Program Name', width: 180, pinned: 'left' },
    {
      field: 'bugCount',
      headerName: 'Bugs',
      width: 100,
      valueGetter: (params) => `${params.data.bugResolvedCount || 0} / ${params.data.bugCount || 0}`,
      cellStyle: (params) => getIssueCountStyle(params.data.bugResolvedCount || 0, params.data.bugCount || 0),
    },
    {
      field: 'qaCount',
      headerName: 'Q&A',
      width: 100,
      valueGetter: (params) => `${params.data.qaResolvedCount || 0} / ${params.data.qaCount || 0}`,
      cellStyle: (params) => getIssueCountStyle(params.data.qaResolvedCount || 0, params.data.qaCount || 0),
    },
    ...phaseColumns,
  ];
};

const getBugColumns = (currentProjectURL) => [
  {
    field: 'issueId',
    headerName: 'ID',
    width: 80,
    cellRenderer: (params) => (
      <a href={`${currentProjectURL}/issues/${params.data.issueId}`} target="_blank" rel="noopener noreferrer">
        {params.data.issueId}
      </a>
    ),
  },
  { field: 'status', headerName: 'Status', width: 80 },
  { field: 'subject', headerName: 'Subject', width: 250, wrapText: true, autoHeight: true },
  { field: 'author', headerName: 'Author', width: 100 },
  { field: 'assignee', headerName: 'Assigned To', width: 100 },
  { field: 'description', headerName: 'Description', width: 400, wrapText: true, autoHeight: true },
  { field: 'fixMethod', headerName: 'Fix Method', width: 300, wrapText: true, autoHeight: true },
];

const getQAColumns = () => [
  { field: 'qaNo', headerName: 'Q&ANo.', width: 90 },
  { field: 'status', headerName: 'Status', width: 90 },
  { field: 'subject', headerName: 'Subject', width: 250, wrapText: true, autoHeight: true },
  { field: 'author', headerName: 'Author', width: 100 },
  { field: 'assignee', headerName: 'Assigned To', width: 100 },
  { field: 'questionVN', headerName: 'Question (VN)', width: 400, wrapText: true, autoHeight: true },
  { field: 'questionJP', headerName: 'Question (JP)', width: 350, wrapText: true, autoHeight: true },
  { field: 'answerJP', headerName: 'Answer (JP)', width: 350, wrapText: true, autoHeight: true },
  { field: 'answerVN', headerName: 'Answer (VN)', width: 350, wrapText: true, autoHeight: true },
];

// Custom hook for fetching projects
const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [selectedProjectId, setSelectedProjectId] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const list = await window.electronAPI.getProjects();
        setProjects(list);
        if (list.length > 0) {
          setSelectedProjectId(list[0].ProjectID);
        }
      } catch (err) {
        console.error('Failed to load projects:', err.message);
        setSnackbar({ open: true, message: `Failed to load projects: ${err.message}`, severity: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return { projects, isLoading, snackbar, setSnackbar, selectedProjectId, setSelectedProjectId };
};

// Custom hook for fetching schedules
const useSchedules = (selectedProjectId, projects) => {
  const [schedules, setSchedules] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSchedulesLoaded, setIsSchedulesLoaded] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const currentProjectIdRef = useRef('');
  const currentProjectURLRef = useRef('');

  useEffect(() => {
    let isCancelled = false;

    const loadSchedule = async () => {
      if (!selectedProjectId) return;
      setIsLoading(true);
      setIsSchedulesLoaded(false);
      try {
        currentProjectIdRef.current = selectedProjectId;
        currentProjectURLRef.current = projects.find(p => p.ProjectID === selectedProjectId)?.TrackingURL || '';
        const result = await window.electronAPI.loadSchedule(selectedProjectId);
        if (isCancelled) return;
        setSchedules(result.schedules);
        setSelectedFile(result.filePath);
        setIsSchedulesLoaded(true);
        setSnackbar({
          open: true,
          message: `Imported ${result.schedules.length} items from ${result.filePath.split('/').pop()}`,
          severity: 'success',
        });
      } catch (err) {
        if (isCancelled) return;
        console.error('Failed to load schedule:', err.message);
        setSnackbar({
          open: true,
          message: `Failed to load schedule: ${err.message || 'Unknown error'}`,
          severity: 'error',
        });
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadSchedule();

    return () => {
      isCancelled = true;
    };
  }, [selectedProjectId, projects]);

  return { schedules, setSchedules, selectedFile, isLoading, isSchedulesLoaded, snackbar, setSnackbar, currentProjectIdRef, currentProjectURLRef };
};

// Custom hook for fetching issues
const useIssues = (selectedProjectId, schedules, isSchedulesLoaded, setSchedules, setSnackbar) => {
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const fetchIssues = async () => {
      if (!isSchedulesLoaded || schedules.length === 0 || !selectedProjectId) return;
      setIsLoadingIssues(true);
      try {
        const updatedSchedules = await window.electronAPI.updateScheduleIssues(selectedProjectId, schedules);
        if (isCancelled) return;
        setSchedules(updatedSchedules);
        setSnackbar({
          open: true,
          message: `Updated ${updatedSchedules.length} schedules with ${updatedSchedules.reduce((sum, s) => sum + s.bugCount + s.qaCount, 0)} issues`,
          severity: 'success',
        });
      } catch (err) {
        if (isCancelled) return;
        console.error('Failed to update schedules with issues:', err.message);
        setSnackbar({
          open: true,
          message: `Failed to update issues: ${err.message || 'Unknown error'}`,
          severity: 'error',
        });
      } finally {
        if (!isCancelled) setIsLoadingIssues(false);
      }
    };

    fetchIssues();

    return () => {
      isCancelled = true;
    };
  }, [isSchedulesLoaded, selectedProjectId]);

  return { isLoadingIssues };
};

// Main component
const SchedulePanel = ({ onBack }) => {
  const { 
    projects, 
    isLoading: isProjectsLoading, 
    snackbar: projectsSnackbar, 
    setSnackbar: setProjectsSnackbar, 
    selectedProjectId, 
    setSelectedProjectId 
  } = useProjects();
  const {
    schedules,
    setSchedules,
    selectedFile,
    isLoading: isSchedulesLoading,
    isSchedulesLoaded,
    snackbar: schedulesSnackbar,
    setSnackbar: setSchedulesSnackbar,
    currentProjectIdRef,
    currentProjectURLRef,
  } = useSchedules(selectedProjectId, projects);
  const { isLoadingIssues } = useIssues(selectedProjectId, schedules, isSchedulesLoaded, setSchedules, setSchedulesSnackbar);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogIssues, setDialogIssues] = useState([]);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogType, setDialogType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isChartsLoaded, setIsChartsLoaded] = useState(false);
  const [themeMode, setThemeMode] = useState(localStorage.getItem('themeMode') || 'light');

  const chartRef = useRef();

  // Combine snackbars
  const snackbar = projectsSnackbar.open ? projectsSnackbar : schedulesSnackbar;
  const setSnackbar = projectsSnackbar.open ? setProjectsSnackbar : setSchedulesSnackbar;

  // Toggle theme mode
  const toggleTheme = useCallback(() => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    localStorage.setItem('themeMode', newMode);
  }, [themeMode]);

  // Memoized grid rows
  const rows = useMemo(() => {
    return schedules.map((schedule, index) => {
      const row = {
        id: index + 1,
        prgid: schedule.prgid,
        prgname: schedule.prgname,
        bugCount: schedule.bugCount || 0,
        qaCount: schedule.qaCount || 0,
        qaResolvedCount: schedule.qaResolvedCount || 0,
        bugResolvedCount: schedule.bugResolvedCount || 0,
      };

      ['Design', 'Review', 'Coding', 'Testing'].forEach((phase) => {
        const phaseData = schedule.phases.find(p => p.phaseName === phase) || {};
        row[`${phase.toLowerCase()}_phaseName`] = phaseData.phaseName || '';
        row[`${phase.toLowerCase()}_deliveryDate`] = phaseData.deliveryDate || '';
        row[`${phase.toLowerCase()}_baselineEffort`] = phaseData.baselineEffort || 0;
        row[`${phase.toLowerCase()}_plannedStartDate`] = phaseData.plannedStartDate || '';
        row[`${phase.toLowerCase()}_plannedEndDate`] = phaseData.plannedEndDate || '';
        row[`${phase.toLowerCase()}_actualStartDate`] = phaseData.actualStartDate || '';
        row[`${phase.toLowerCase()}_actualEndDate`] = phaseData.actualEndDate || '';
        row[`${phase.toLowerCase()}_assignee`] = phaseData.assignee || '';
        row[`${phase.toLowerCase()}_progress`] = phaseData.progress || 0;
        row[`${phase.toLowerCase()}_actualEffort`] = phaseData.actualEffort || 0;
        row[`${phase.toLowerCase()}_designPages`] = phaseData.designPages || 0;
        row[`${phase.toLowerCase()}_testCases`] = phaseData.testCases || 0;
        row[`${phase.toLowerCase()}_defects`] = phaseData.defects || 0;
        row[`${phase.toLowerCase()}_notes`] = phaseData.notes || '';
      });

      return row;
    });
  }, [schedules]);

  // Memoized chart data for combined Design and Coding
  const getCombinedDeliveryChartData = useCallback(() => {
  const dateMapDesign = new Map();
  const dateMapCoding = new Map();

  schedules.forEach(s => {
    const designDate = s.phases.find(p => p.phaseName === 'Design')?.deliveryDate;
    const codingDate = s.phases.find(p => p.phaseName === 'Coding')?.deliveryDate;

    if (designDate) {
      const d = new Date(designDate).toLocaleDateString('en-CA');
      dateMapDesign.set(d, (dateMapDesign.get(d) || 0) + 1);
    }
    if (codingDate) {
      const d = new Date(codingDate).toLocaleDateString('en-CA');
      dateMapCoding.set(d, (dateMapCoding.get(d) || 0) + 1);
    }
  });

  const allDates = [...new Set([...dateMapDesign.keys(), ...dateMapCoding.keys()])]
    .sort((a, b) => new Date(a) - new Date(b))
    .slice(0, 7);

  return {
    labels: allDates,
    datasets: [
      {
        label: 'Design Delivery Count',
        data: allDates.map(d => dateMapDesign.get(d) || 0),
        backgroundColor: ['#1e88e580'],
        borderColor: '#1e88e5',
        borderWidth: 1,
        hoverBackgroundColor: '#005cb2',
        hoverBorderColor: '#003087',
        barPercentage: 0.8, // Tăng từ 0.45 lên 0.8
      },
      {
        label: 'Coding Delivery Count',
        data: allDates.map(d => dateMapCoding.get(d) || 0),
        backgroundColor: ['#e91e6380'],
        borderColor: '#e91e63',
        borderWidth: 1,
        hoverBackgroundColor: '#b0003a',
        hoverBorderColor: '#880e4f',
        barPercentage: 0.9, // Tăng từ 0.45 lên 0.8
      },
    ],
  };
}, [schedules]);

  const combinedChartData = useMemo(() => getCombinedDeliveryChartData(), [getCombinedDeliveryChartData]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 16, family: "'Inter', 'Roboto', sans-serif" },
          color: themeMode === 'light' ? '#1e88e5' : '#90caf9',
          padding: 10,
        },
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: themeMode === 'light' ? '#121212' : '#424242',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: themeMode === 'light' ? '#1e88e5' : '#90caf9',
        borderWidth: 1,
        titleFont: { size: 16 },
        bodyFont: { size: 14 },
        callbacks: {
          label: (context) => {
            const count = context.parsed.y;
            const date = context.label;
            const phase = context.dataset.label.split(' ')[0];
            return `${count} ${phase} items delivered on ${date}`;
          },
        },
      },
      datalabels: {
        color: '#ffffff',
        font: { size: 14, weight: 'bold', family: "'Inter', 'Roboto', sans-serif" },
        formatter: (value) => (value > 0 ? value : ''),
        anchor: 'end',
        align: 'top',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Delivery Date',
          font: { size: 16, family: "'Inter', 'Roboto', sans-serif" },
          color: themeMode === 'light' ? '#1e88e5' : '#90caf9',
        },
        grid: { display: false },
        barPercentage: 0.8, // Tăng từ 0.4 lên 0.8
        categoryPercentage: 0.9, // Tăng từ 0.5 lên 0.9
      },
      y: {
        title: {
          display: true,
          text: 'Count',
          font: { size: 16, family: "'Inter', 'Roboto', sans-serif" },
          color: themeMode === 'light' ? '#1e88e5' : '#90caf9',
        },
        beginAtZero: true,
        grid: {
          color: themeMode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
          borderDash: [5, 5],
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  }), [themeMode]);

  const handleBarClick = useCallback((elements, event) => {
    if (!elements.length) return;
    const index = elements[0].index;
    const phase = elements[0].datasetIndex === 0 ? 'Design' : 'Coding';
    const label = chartRef.current?.data?.labels?.[index];
    if (!label) return;
    const filtered = schedules.filter(s => {
      const date = s.phases.find(p => p.phaseName === phase)?.deliveryDate;
      return date && new Date(date).toLocaleDateString('en-CA') === label;
    });
    setFilteredSchedules(filtered);
    setActiveFilter({ phase, date: label });
  }, [schedules]);

  const handleCellDoubleClicked = useCallback((params) => {
    const { colDef, data } = params;
    const schedule = schedules.find(s => s.prgid === data.prgid);
    if (!schedule || !schedule.trackingIssues) {
      console.warn('No schedule or trackingIssues found for prgid:', data.prgid);
      return;
    }

    if (colDef.field === 'bugCount') {
      const bugs = schedule.trackingIssues
        .filter(issue => issue.trackerName === 'Bug')
        .map(issue => ({
          issueId: issue.issueId,
          subject: issue.subject,
          status: issue.status,
          author: issue.author,
          assignee: issue.assignee || '',
          description: issue.description,
          fixMethod: issue.fixMethod || '',
        }));
      setDialogIssues(bugs);
      setDialogTitle(`Bugs for ${schedule.prgname} (${schedule.prgid})`);
      setDialogType('bug');
      setOpenDialog(true);
    } else if (colDef.field === 'qaCount') {
      const qas = schedule.trackingIssues
        .filter(issue => issue.trackerName === 'Q&A')
        .map(issue => ({
          qaNo: issue.qaNo,
          subject: issue.subject,
          status: issue.status,
          author: issue.author,
          assignee: issue.assignee || '',
          questionVN: issue.questionVN || '',
          questionJP: issue.questionJP || '',
          answerJP: issue.answerJP || '',
          answerVN: issue.answerVN || '',
        }));
      setDialogIssues(qas);
      setDialogTitle(`Q&A for ${schedule.prgname} (${schedule.prgid})`);
      setDialogType('qa');
      setOpenDialog(true);
    }
  }, [schedules]);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setDialogIssues([]);
    setDialogTitle('');
    setDialogType('');
    setSearchTerm('');
  }, []);

  // Filter issues in dialog
  const filteredDialogIssues = useMemo(() => {
    if (!searchTerm) return dialogIssues;
    return dialogIssues.filter(issue =>
      issue.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dialogIssues, searchTerm]);

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth={false} sx={{ maxWidth: '98%', py: 4 }}>
        <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <Button
            variant="contained"
            color="primary"
            onClick={onBack}
            disabled={isProjectsLoading || isSchedulesLoading}
            startIcon={isProjectsLoading || isSchedulesLoading ? <CircularProgress size={20} /> : null}
            sx={{ borderRadius: '20px', textTransform: 'none', px: 3 }}
            aria-label="Back to Home"
          >
            Back to Home
          </Button>
          <Button
            variant="outlined"
            onClick={toggleTheme}
            sx={{ borderRadius: '20px', textTransform: 'none' }}
            aria-label={`Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {themeMode === 'light' ? 'Dark' : 'Light'} Mode
          </Button>
        </Box>

        <Card sx={{ mb: 3 }}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography
                variant="h6"
                sx={{ transition: 'color 0.3s ease', '&:hover': { color: theme.palette.primary.dark } }}
              >
                Project Selection
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {isProjectsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
                  <CircularProgress color="primary" />
                </Box>
              ) : (
                <Box>
                  <FormControl fullWidth sx={{ maxWidth: 400, mb: 2 }} aria-label="Select a project from the list">
                    <InputLabel>Select Project</InputLabel>
                    <Select
                      value={selectedProjectId}
                      label="Select Project"
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      aria-label="Select a project from the list"
                    >
                      {projects.length === 0 ? (
                        <MenuItem disabled>No projects available</MenuItem>
                      ) : (
                        projects.map((proj) => (
                          <MenuItem key={proj.ProjectID} value={proj.ProjectID}>
                            {proj.ProjectID}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                  {selectedFile && (
                    <Typography variant="body1" color="text.secondary">
                      Selected: {selectedFile.split('/').pop()}
                    </Typography>
                  )}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Card>

        <Card sx={{ mb: 3 }}>
          <Accordion defaultExpanded onChange={(event, expanded) => setIsChartsLoaded(expanded)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography
                variant="h6"
                sx={{ transition: 'color 0.3s ease', '&:hover': { color: theme.palette.primary.dark } }}
              >
                Delivery Charts
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {/* {isSchedulesLoading || !isChartsLoaded ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 500 , overflow: 'auto' }}>
                  <CircularProgress color="primary" />
                </Box>
              ) : ( */}
                <Grid container spacing={4}>
                  <Grid item xs={12}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ transition: 'color 0.3s ease', '&:hover': { color: theme.palette.primary.dark } }}
                    >
                      Design and Coding Delivery Dates
                    </Typography>
                    <Box
                        sx={{ height: { md: 400 }, width:  { md: 800 }, maxWidth: { md: 1200 }, overflow: 'auto' }}
                        aria-label="Bar chart showing Design and Coding delivery counts by date"
                      >
                      <Bar
                        ref={chartRef}
                        data={combinedChartData}
                        options={{
                          ...chartOptions,
                          onClick: (evt, elements) => handleBarClick(elements, evt),
                        }}
                      />
                    </Box>
                  </Grid>
                  {filteredSchedules.length > 0 && (
                    <Grid item xs={12}>
                      {activeFilter && (
                        <Box mt={2} display="flex" alignItems="center" gap={2}>
                          <Typography variant="body1" color="text.primary">
                            Filtering by: <strong>{activeFilter.phase.toUpperCase()}</strong> – Delivery Date <strong>{activeFilter.date}</strong>
                          </Typography>
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => {
                              setFilteredSchedules([]);
                              setActiveFilter(null);
                            }}
                            sx={{ borderRadius: '20px', textTransform: 'none' }}
                            aria-label="Clear Filter"
                          >
                            Clear Filter
                          </Button>
                        </Box>
                      )}
                    </Grid>
                  )}
                </Grid>
              {/* )} */}
            </AccordionDetails>
          </Accordion>
        </Card>

        <Card>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography
                variant="h6"
                sx={{ transition: 'color 0.3s ease', '&:hover': { color: theme.palette.primary.dark } }}
              >
                Schedule Grid {isLoadingIssues ? '(Currently counting the number of Bugs and Q&As in Tracking…)' : ''}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {isSchedulesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                  <CircularProgress color="primary" />
                </Box>
              ) : schedules.length > 0 ? (
                <Box sx={{ height: `calc(100vh - 250px)`, width: '100%' }} className="ag-theme-quartz">
                  <AgGridReact
                    rowData={filteredSchedules.length > 0 ? filteredSchedules.map((s, index) => ({
                      ...rows.find(r => r.prgid === s.prgid),
                      id: index + 1,
                    })) : rows}
                    columnDefs={getGridColumns(currentProjectURLRef.current)}
                    pagination={true}
                    paginationPageSize={20}
                    defaultColDef={{
                      sortable: true,
                      filter: true,
                      resizable: true,
                    }}
                    rowBuffer={20}
                    animateRows={true}
                    getRowStyle={() => ({
                      transition: 'background-color 0.3s ease',
                      '&:hover': { backgroundColor: theme.palette.action.hover },
                    })}
                    accessibility={true}
                    onCellDoubleClicked={handleCellDoubleClicked}
                  />
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary" align="center">
                  No schedules available.
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Card>

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="lg"
          fullWidth
          TransitionComponent={Zoom}
          TransitionProps={{ timeout: 400 }}
        >
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Search Issues"
              variant="outlined"
              sx={{ mb: 2 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search issues by subject or description"
            />
            {filteredDialogIssues.length > 0 ? (
              <Box sx={{ height: '600px', width: '100%' }} className="ag-theme-quartz">
                <AgGridReact
                  rowData={filteredDialogIssues}
                  columnDefs={dialogType === 'bug' ? getBugColumns(currentProjectURLRef.current) : getQAColumns()}
                  defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                  }}
                  pagination={true}
                  paginationPageSize={10}
                  animateRows={true}
                />
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No issues available.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseDialog}
              color="primary"
              variant="contained"
              sx={{ borderRadius: '20px', textTransform: 'none' }}
              aria-label="Close Dialog"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
};

export default SchedulePanel;