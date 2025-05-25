import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Button, Box, Container, Typography, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, Grid,
  Accordion, AccordionSummary, AccordionDetails, Card, CardContent, Skeleton, ThemeProvider, createTheme,
  Dialog, DialogTitle, DialogContent, DialogActions, Link
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
// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-quartz.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, BarElement, Title, Tooltip, Legend);
ModuleRegistry.registerModules([AllCommunityModule]);

// Custom MUI theme
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#f50057' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
  },
  typography: {
    h6: { fontWeight: 600 },
    body1: { fontSize: '1rem' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.2s, background-color 0.2s',
          '&:hover': { transform: 'scale(1.05)' },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.3s ease',
          '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.15)' },
        },
      },
    },
  },
});

const SchedulePanel = ({ onBack }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [isSchedulesLoaded, setIsSchedulesLoaded] = useState(false);
  const currentProjectIdRef = useRef('');
  const currentProjectURLRef = useRef('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogIssues, setDialogIssues] = useState([]);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogType, setDialogType] = useState(''); // 'bug' hoặc 'qa'

  const chartRefs = {
    design: useRef(),
    coding: useRef(),
  };

  // Load projects when component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const list = await window.electronAPI.getProjects();
        const sorted = list.sort((a, b) => b.ProjectID.localeCompare(a.ProjectID));
        setProjects(sorted);
        if (sorted.length > 0) setSelectedProjectId(sorted[0].ProjectID);
      } catch (err) {
        console.error('Failed to load projects:', err.message);
        setSnackbar({ open: true, message: `Failed to load projects: ${err.message}`, severity: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadSchedule = async () => {
      setIsLoading(true);
      setIsSchedulesLoaded(false);
      try {
        if (selectedProjectId) {
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
        }
      } catch (err) {
        if (isCancelled) return;
        console.error('Failed to load schedule:', err.message);
        setSnackbar({
          open: true,
          message: `Failed to load schedule: ${err.message || 'Unknown error'}`,
          severity: 'error',
        });
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSchedule();

    return () => {
      isCancelled = true;
    };
  }, [selectedProjectId]);

  useEffect(() => {
    let isCancelled = false;

    const fetchIssues = async () => {
      if (!isSchedulesLoaded || schedules.length === 0 || !selectedProjectId) return;
      if (currentProjectIdRef.current !== selectedProjectId) return;

      setIsLoadingIssues(true);
      try {
        const updatedSchedules = await window.electronAPI.updateScheduleIssues(selectedProjectId, schedules);
        if (isCancelled || currentProjectIdRef.current !== selectedProjectId) return;

        setSchedules(updatedSchedules);
        if (isCancelled) return;
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

  // Định nghĩa cột cho dialog Bug
  const bugColumns = [
    { field: 'issueId', headerName: 'ID', width: 80, 
      cellRenderer: (params) => {
      const issueId = params.data.issueId;
      const url = currentProjectURLRef.current ? `${currentProjectURLRef.current}/issues/${issueId}` : '';
      return (
        <a href={url} target="_blank">
            {issueId}
        </a>
    );
    },},
    { field: 'status', headerName: 'Status', width: 80 },
    { field: 'subject', headerName: 'Subject', width: 250,wrapText: true,autoHeight: true, },
    { field: 'author', headerName: 'Author', width: 100 },
    { field: 'assignee', headerName: 'Assigned To', width: 100 },
    {
      field: 'description',
      headerName: 'Description',
      width: 400, // Tăng chiều rộng để hiển thị tốt hơn
      wrapText: true, // Cho phép text xuống dòng
      autoHeight: true, // Tự động điều chỉnh chiều cao hàng
    },
    {
      field: 'fixMethod',
      headerName: 'Fix Method',
      width: 300,
      wrapText: true, // Cho phép text xuống dòng
      autoHeight: true, // Tự động điều chỉnh chiều cao hàng
      //valueGetter: params => params.data.customFields?.find(f => f.name === 'Fix Method')?.value || 'N/A',
    },
  ];

  // Định nghĩa cột cho dialog Q&A
  const qaColumns = [
    { field: 'qaNo', headerName: 'Q&ANo.', width: 90 },
    { field: 'status', headerName: 'Status', width: 90 },
    { field: 'subject', headerName: 'Subject', width: 250, wrapText: true,autoHeight: true, },
    { field: 'author', headerName: 'Author', width: 100 },
    { field: 'assignee', headerName: 'Assigned To', width: 100 },
    {
      field: 'questionVN',
      headerName: 'Question (VN)',
      width: 400,
      wrapText: true, // Cho phép text xuống dòng
      autoHeight: true, // Tự động điều chỉnh chiều cao hàng
      //valueGetter: params => params.data.customFields?.find(f => f.name === 'Question (VN)')?.value || 'N/A',
    },
    {
      field: 'questionJP',
      headerName: 'Question (JP)',
      width: 350,
      wrapText: true, // Cho phép text xuống dòng
      autoHeight: true, // Tự động điều chỉnh chiều cao hàng
      //valueGetter: params => params.data.customFields?.find(f => f.name === 'Question (JP)')?.value || 'N/A',
    },
    {
      field: 'answerJP',
      headerName: 'Answer (JP)',
      width: 350,
      wrapText: true, // Cho phép text xuống dòng
      autoHeight: true, // Tự động điều chỉnh chiều cao hàng
      //valueGetter: params => params.data.customFields?.find(f => f.name === 'Answer (JP)')?.value || 'N/A',
    },
    {
      field: 'answerVN',
      headerName: 'Answer (VN)',
      width: 350,
      wrapText: true, // Cho phép text xuống dòng
      autoHeight: true, // Tự động điều chỉnh chiều cao hàng
      //valueGetter: params => params.data.customFields?.find(f => f.name === 'Answer (VN)')?.value || 'N/A',
    },
  ];

  // Hàm xử lý double-click trên cell
  const handleCellDoubleClicked = (params) => {
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
          fixMethod: issue.fixMethod||'',
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
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'prgid', headerName: 'Program ID', width: 120 },
    { field: 'prgname', headerName: 'Program Name', width: 180 },
    {
      field: 'bugCount',
      headerName: 'Bugs',
      width: 100,
      valueGetter: (params) => {
        const resolved = params.data.bugResolvedCount || 0;
        const total = params.data.bugCount || 0;
        return `${resolved} / ${total}`;
      },
      cellStyle: (params) => {
        const resolved = params.data.bugResolvedCount || 0;
        const total = params.data.bugCount || 0;
        if (resolved === 0 && total === 0) {
          return { backgroundColor: '#f5f5f5', color: '#9e9e9e' }; // màu xám nhạt nếu không có dữ liệu
        } else if (resolved < total) {
          return { backgroundColor: '#fdecea', color: '#b71c1c' }; // đỏ nhạt
        }
        return { backgroundColor: '#e6f4ea', color: '#1b5e20' }; // xanh nhạt
      }
    },
    {
      field: 'qaCount',
      headerName: 'Q&A',
      width: 100,
      valueGetter: (params) => {
        const resolved = params.data.qaResolvedCount || 0;
        const total = params.data.qaCount || 0;
        return `${resolved} / ${total}`;
      },
      cellStyle: (params) => {
        const resolved = params.data.qaResolvedCount || 0;
        const total = params.data.qaCount || 0;
        if (resolved === 0 && total === 0) {
          return { backgroundColor: '#f5f5f5', color: '#9e9e9e' }; // màu xám nhạt nếu không có dữ liệu
        } else if (resolved < total) {
          return { backgroundColor: '#fdecea', color: '#b71c1c' }; // đỏ nhạt
        }
        return { backgroundColor: '#e6f4ea', color: '#1b5e20' }; // xanh nhạt
      },
    },
    { field: 'designDeliveryDate', headerName: 'Design Delivery', width: 150 },
    { field: 'design_assignee', headerName: 'Design Assignee', width: 150 },
    {
      field: 'design_progress',
      headerName: '%',
      width: 70,
      cellStyle: params => {
        const value = Number(params.value) * 100;
        if (isNaN(value) || value === 0) return {};
        let backgroundColor = '';
        if (value < 50) {
          backgroundColor = '#ffca28';
        } else if (value >= 50 && value <= 99) {
          const ratio = (value - 50) / 50;
          backgroundColor = `hsl(120, 100%, ${50 - ratio * 20}%)`;
        } else {
          backgroundColor = '#4caf50';
        }
        return { backgroundColor, color: '#fff', borderRadius: '4px', textAlign: 'center' };
      },
      valueFormatter: params => {
        const value = Number(params.value);
        return isNaN(value) ? '' : `${(value * 100).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 0 })}`;
      },
    },
    { field: 'review_assignee', headerName: 'Review Assignee', width: 150 },
    {
      field: 'review_progress',
      headerName: '%',
      width: 70,
      cellStyle: params => {
        const value = Number(params.value) * 100;
        if (isNaN(value) || value === 0) return {};
        let backgroundColor = '';
        if (value < 50) {
          backgroundColor = '#ffca28';
        } else if (value >= 50 && value <= 99) {
          const ratio = (value - 50) / 50;
          backgroundColor = `hsl(120, 100%, ${50 - ratio * 20}%)`;
        } else {
          backgroundColor = '#4caf50';
        }
        return { backgroundColor, color: '#fff', borderRadius: '4px', textAlign: 'center' };
      },
      valueFormatter: params => {
        const value = Number(params.value);
        return isNaN(value) ? '' : `${(value * 100).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 0 })}`;
      },
    },
    { field: 'codingDeliveryDate', headerName: 'Coding Delivery', width: 150 },
    { field: 'coding_assignee', headerName: 'Coding Assignee', width: 150 },
    {
      field: 'coding_progress',
      headerName: '%',
      width: 70,
      cellStyle: params => {
        const value = Number(params.value) * 100;
        if (isNaN(value) || value === 0) return {};
        let backgroundColor = '';
        if (value < 50) {
          backgroundColor = '#ffca28';
        } else if (value >= 50 && value <= 99) {
          const ratio = (value - 50) / 50;
          backgroundColor = `hsl(120, 100%, ${50 - ratio * 20}%)`;
        } else {
          backgroundColor = '#4caf50';
        }
        return { backgroundColor, color: '#fff', borderRadius: '4px', textAlign: 'center' };
      },
      valueFormatter: params => {
        const value = Number(params.value);
        return isNaN(value) ? '' : `${(value * 100).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 0 })}`;
      },
    },
    { field: 'testing_assignee', headerName: 'Testing Assignee', width: 150 },
    {
      field: 'testing_progress',
      headerName: '%',
      width: 70,
      cellStyle: params => {
        const value = Number(params.value) * 100;
        if (isNaN(value) || value === 0) return {};
        let backgroundColor = '';
        if (value < 50) {
          backgroundColor = '#ffca28';
        } else if (value >= 50 && value <= 99) {
          const ratio = (value - 50) / 50;
          backgroundColor = `hsl(120, 100%, ${50 - ratio * 20}%)`;
        } else {
          backgroundColor = '#4caf50';
        }
        return { backgroundColor, color: '#fff', borderRadius: '4px', textAlign: 'center' };
      },
      valueFormatter: params => {
        const value = Number(params.value);
        return isNaN(value) ? '' : `${(value * 100).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 0 })}`;
      },
    },
  ];

  // Memoize rows to avoid recomputing on every render
  const rows = useMemo(() => {
    return schedules.map((schedule, index) => ({
      id: index + 1,
      prgid: schedule.prgid,
      prgname: schedule.prgname,
      bugCount: schedule.bugCount || 0,
      qaCount: schedule.qaCount || 0,
      qaResolvedCount: schedule.qaResolvedCount || 0,
      bugResolvedCount: schedule.bugResolvedCount || 0,
      designDeliveryDate: schedule.phases.find(p => p.phaseName === 'Design')?.deliveryDate ? new Date(schedule.phases.find(p => p.phaseName === 'Design').deliveryDate).toISOString().split('T')[0] : '',
      design_assignee: schedule.phases.find(p => p.phaseName === 'Design')?.assignee || '',
      design_progress: schedule.phases.find(p => p.phaseName === 'Design')?.progress || 0,
      review_assignee: schedule.phases.find(p => p.phaseName === 'Review')?.assignee || '',
      review_progress: schedule.phases.find(p => p.phaseName === 'Review')?.progress || 0,
      codingDeliveryDate: schedule.phases.find(p => p.phaseName === 'Coding')?.deliveryDate ? new Date(schedule.phases.find(p => p.phaseName === 'Coding').deliveryDate).toISOString().split('T')[0] : '',
      coding_assignee: schedule.phases.find(p => p.phaseName === 'Coding')?.assignee || '',
      coding_progress: schedule.phases.find(p => p.phaseName === 'Coding')?.progress || 0,
      testing_assignee: schedule.phases.find(p => p.phaseName === 'Testing')?.assignee || '',
      testing_progress: schedule.phases.find(p => p.phaseName === 'Testing')?.progress || 0,
    }));
  }, [schedules]);

  const getDeliveryChartData = (phase) => {
    const dateMap = new Map();
    schedules.forEach(s => {
      const dateStr = s.phases.find(p => p.phaseName === phase)?.deliveryDate;
      if (dateStr) {
        const d = new Date(dateStr).toLocaleDateString('en-CA');
        dateMap.set(d, (dateMap.get(d) || 0) + 1);
      }
    });

    const sorted = [...dateMap.entries()]
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(0, 7);

    return {
      labels: sorted.map(([d]) => d),
      datasets: [
        {
          label: `${phase} Delivery Count`,
          data: sorted.map(([, count]) => count),
          backgroundColor: theme.palette.primary.main + '80',
          borderColor: theme.palette.primary.main,
          borderWidth: 2,
          hoverBackgroundColor: theme.palette.primary.dark,
          hoverBorderColor: theme.palette.primary.dark,
        },
      ],
    };
  };

  // Memoize chart data to avoid recomputing
  const designChartData = useMemo(() => getDeliveryChartData('Design'), [schedules]);
  const codingChartData = useMemo(() => getDeliveryChartData('Coding'), [schedules]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 14 } } },
      tooltip: { enabled: true, mode: 'index', intersect: false },
    },
    scales: {
      x: { title: { display: true, text: 'Delivery Date', font: { size: 14 } } },
      y: { title: { display: true, text: 'Count', font: { size: 14 } }, beginAtZero: true },
    },
  };

  const handleBarClick = (elements, event, chartPhase) => {
    if (!elements.length) return;
    const index = elements[0].index;
    const label = chartRefs[chartPhase.toLowerCase()].current?.data?.labels?.[index];
    if (!label) return;
    const filtered = schedules.filter(s => {
      const date = s.phases.find(p => p.phaseName === chartPhase)?.deliveryDate;
      return date && new Date(date).toLocaleDateString('en-CA') === label;
    });
    setFilteredSchedules(filtered);
    setActiveFilter({ phase: chartPhase, date: label });
  };

  // Đóng dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogIssues([]);
    setDialogTitle('');
    setDialogType('');
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box mb={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={onBack}
            sx={{ borderRadius: '20px', textTransform: 'none', px: 3 }}
            aria-label="Back to Home"
          >
            Back to Home
          </Button>
        </Box>

        <Card sx={{ mb: 3 }}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Project Selection</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {isLoading ? (
                <Skeleton variant="rectangular" height={100} />
              ) : (
                <Box>
                  <FormControl fullWidth sx={{ maxWidth: 400, mb: 2 }} aria-label="Select Project">
                    <InputLabel>Select Project</InputLabel>
                    <Select
                      value={selectedProjectId}
                      label="Select Project"
                      onChange={(e) => setSelectedProjectId(e.target.value)}
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
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Delivery Charts</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {isLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Design Delivery Dates
                    </Typography>
                    <Box sx={{ height: { xs: 200, md: 300 } }}>
                      <Bar
                        ref={chartRefs.design}
                        data={designChartData}
                        options={{
                          ...chartOptions,
                          onClick: (evt, elements) => handleBarClick(elements, evt, 'Design'),
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Coding Delivery Dates
                    </Typography>
                    <Box sx={{ height: { xs: 200, md: 300 } }}>
                      <Bar
                        ref={chartRefs.coding}
                        data={codingChartData}
                        options={{
                          ...chartOptions,
                          onClick: (evt, elements) => handleBarClick(elements, evt, 'Coding'),
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
              )}
            </AccordionDetails>
          </Accordion>
        </Card>

        <Card>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Schedule Grid {isLoadingIssues ? '(Currently counting the number of Bugs and Q&As in Tracking…)' : ''}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {isLoading ? (
                <Skeleton variant="rectangular" height={400} />
              ) : schedules.length > 0 ? (
                <Box sx={{ height: `calc(100vh - 250px)`, width: '100%' }} className="ag-theme-quartz">
                  <AgGridReact
                    rowData={filteredSchedules.length > 0 ? filteredSchedules.map((s, index) => ({
                      id: index,
                      prgid: s.prgid,
                      prgname: s.prgname,
                      bugCount: s.bugCount || 0,
                      qaCount: s.qaCount || 0,
                      designDeliveryDate: s.phases.find(p => p.phaseName === 'Design')?.deliveryDate ? new Date(s.phases.find(p => p.phaseName === 'Design').deliveryDate).toISOString().split('T')[0] : '',
                      design_assignee: s.phases.find(p => p.phaseName === 'Design')?.assignee || '',
                      design_progress: s.phases.find(p => p.phaseName === 'Design')?.progress || 0,
                      review_assignee: s.phases.find(p => p.phaseName === 'Review')?.assignee || '',
                      review_progress: s.phases.find(p => p.phaseName === 'Review')?.progress || 0,
                      codingDeliveryDate: s.phases.find(p => p.phaseName === 'Coding')?.deliveryDate ? new Date(s.phases.find(p => p.phaseName === 'Coding').deliveryDate).toISOString().split('T')[0] : '',
                      coding_assignee: s.phases.find(p => p.phaseName === 'Coding')?.assignee || '',
                      coding_progress: s.phases.find(p => p.phaseName === 'Coding')?.progress || 0,
                      testing_assignee: s.phases.find(p => p.phaseName === 'Testing')?.assignee || '',
                      testing_progress: s.phases.find(p => p.phaseName === 'Testing')?.progress || 0,
                    })) : rows}
                    columnDefs={columns}
                    pagination={true}
                    paginationPageSize={20}
                    defaultColDef={{
                      sortable: true,
                      filter: true,
                      floatingFilter: true,
                      resizable: true,
                      //sheaderClass: 'ag-header-sticky',
                    }}
                    animateRows={true}
                    getRowStyle={() => ({ transition: 'all 0.3s ease' })}
                    accessibility={true}
                    onCellDoubleClicked={handleCellDoubleClicked}
                  />
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary" align="center">
                  No schedules available. Please select a project.
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Card>

        {/* Dialog để hiển thị danh sách Bugs hoặc Q&A */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogContent>
            {dialogIssues.length > 0 ? (
              <Box sx={{ height: '600px', width: '100%' }} className="ag-theme-quartz">
                <AgGridReact
                  rowData={dialogIssues}
                  columnDefs={dialogType === 'bug' ? bugColumns : qaColumns}
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
            <Button onClick={handleCloseDialog} color="primary" variant="contained">
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