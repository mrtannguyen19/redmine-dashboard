import React, { useState, useEffect, useRef } from 'react';
import {Button, Box, Container, Typography, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { Bar } from 'react-chartjs-2';
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
ChartJS.register(CategoryScale, LinearScale, PointElement, BarElement, Title, Tooltip, Legend);
ModuleRegistry.registerModules([AllCommunityModule]);


const SchedulePanel = ({ onBack }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);

  const chartRefs = {
    design: useRef(),
    coding: useRef(),
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const list = await window.electronAPI.getProjects();
        const sorted = list.sort((a, b) => b.ProjectID.localeCompare(a.ProjectID));
        setProjects(sorted);
        if (sorted.length > 0) setSelectedProjectId(sorted[0].ProjectID);
      } catch (err) {
        console.error('Failed to load projects:', err.message);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const project = projects.find(p => p.ProjectID === selectedProjectId);
        if (project && project.SchedulePath && project.ScheduleFileName) {
          const filePath = `${project.SchedulePath}/${project.ScheduleFileName}`;
          const data = await window.electronAPI.importSchedule(filePath);
          setSchedules(data);
          setSelectedFile(filePath);
          setSnackbar({
            open: true,
            message: `Imported ${data.length} items from ${filePath.split('/').pop()}`,
            severity: 'success',
          });
        }
      } catch (err) {
        console.error('Failed to load schedule:', err.message);
        setSnackbar({
          open: true,
          message: `Failed to load schedule: ${err.message}`,
          severity: 'error',
        });
      }
    };
    if (selectedProjectId) loadSchedule();
  }, [selectedProjectId, projects]);

  const columns = [
    {field: 'id', headerName: 'ID', width: 90},
    { field: 'prgid', headerName: 'Program ID', width: 120 },
    { field: 'prgname', headerName: 'Program Name', width: 180 },
    { field: 'designDeliveryDate', headerName: 'Design Delivery', width: 150},
    { field: 'design_assignee', headerName: 'Design Assignee', width: 150 },
    {
      field: 'design_progress',
      headerName: '%',
      width: 70,
      cellStyle: params => {
        const value = Number(params.value) * 100; // vì đang lưu dạng 0.75
        if (isNaN(value) || value === 0) return {};

        let backgroundColor = '';

        if (value < 50) {
          backgroundColor = 'rgb(255, 165, 0)'; // cam
        } else if (value >= 50 && value <= 99) {
          const ratio = (value - 50) / 30;
          backgroundColor = `rgb(255, ${Math.round(165 + (230 - 165) * ratio)}, ${Math.round(0 + (100 - 0) * ratio)})`;
         } else {
          backgroundColor = 'rgb(0, 200, 0)' ;
        }

        return {
          backgroundColor,
          color: '#000',
        };
      },
      valueFormatter: params => {
        const value = Number(params.value);
        return isNaN(value) ? '' : `${(value).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 0 })}`;
      },
    },
    { field: 'review_assignee', headerName: 'Review Assignee', width: 150 },
    {
      field: 'review_progress',
      headerName: '%',
      width: 70,
      cellStyle: params => {
        const value = Number(params.value) * 100; // vì đang lưu dạng 0.75
        if (isNaN(value) || value === 0) return {};

        let backgroundColor = '';

        if (value < 50) {
          backgroundColor = 'rgb(255, 165, 0)'; // cam
        } else if (value >= 50 && value <= 99) {
          const ratio = (value - 50) / 30;
          backgroundColor = `rgb(255, ${Math.round(165 + (230 - 165) * ratio)}, ${Math.round(0 + (100 - 0) * ratio)})`;
         } else {
          backgroundColor = 'rgb(0, 200, 0)' ;
        }

        return {
          backgroundColor,
          color: '#000',
        };
      },
      valueFormatter: params => {
        const value = Number(params.value);
        return isNaN(value) ? '' : `${(value).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 0 })}`;
      },
    },
    { field: 'codingDeliveryDate', headerName: 'Coding Delivery', width: 150,},
    { field: 'coding_assignee', headerName: 'Coding Assignee', width: 150 },
    {
      field: 'coding_progress',
      headerName: '%',
      width: 70,
      cellStyle: params => {
        const value = Number(params.value) * 100; // vì đang lưu dạng 0.75
        if (isNaN(value) || value === 0) return {};

        let backgroundColor = '';

        if (value < 50) {
          backgroundColor = 'rgb(255, 165, 0)'; // cam
        } else if (value >= 50 && value <= 99) {
          const ratio = (value - 50) / 30;
          backgroundColor = `rgb(255, ${Math.round(165 + (230 - 165) * ratio)}, ${Math.round(0 + (100 - 0) * ratio)})`;
         } else {
          backgroundColor = 'rgb(0, 200, 0)' ;
        }

        return {
          backgroundColor,
          color: '#000',
        };
      },
      valueFormatter: params => {
        const value = Number(params.value);
        return isNaN(value) ? '' : `${(value).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 0 })}`;
      },
    },
    { field: 'testing_assignee', headerName: 'Testing Assignee', width: 150 },
    {
      field: 'testing_progress',
      headerName: '%',
      width: 70,
      cellStyle: params => {
        const value = Number(params.value) * 100; // vì đang lưu dạng 0.75
        if (isNaN(value) || value === 0) return {};

        let backgroundColor = '';

        if (value < 50) {
          backgroundColor = 'rgb(255, 165, 0)'; // cam
        } else if (value >= 50 && value <= 99) {
          const ratio = (value - 50) / 30;
          backgroundColor = `rgb(255, ${Math.round(165 + (230 - 165) * ratio)}, ${Math.round(0 + (100 - 0) * ratio)})`;
         } else {
          backgroundColor = 'rgb(0, 200, 0)' ;
        }

        return {
          backgroundColor,
          color: '#000',
        };
      },
      valueFormatter: params => {
        const value = Number(params.value);
        return isNaN(value) ? '' : `${(value).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 0 })}`;
      },
    },
  ];

  const rows = schedules.map((schedule, index) => ({
    id: index,
    prgid: schedule.prgid,
    prgname: schedule.prgname,
    designDeliveryDate: schedule.design?.deliveryDate ? new Date(schedule.design.deliveryDate).toISOString().split('T')[0] : '',
    design_assignee: schedule.design?.assignee || '',
    design_progress: schedule.design?.progress || 0,
    review_assignee: schedule.review?.assignee || '',
    review_progress: schedule.review?.progress || 0,
    codingDeliveryDate: schedule.coding?.deliveryDate ? new Date(schedule.coding.deliveryDate).toISOString().split('T')[0] : '',
    coding_assignee: schedule.coding?.assignee || '',
    coding_progress: schedule.coding?.progress || 0,
    testing_assignee: schedule.testing?.assignee || '',
    testing_progress: schedule.testing?.progress || 0,
  }));

  const getDeliveryChartData = (phase) => {
    const dateMap = new Map();
    schedules.forEach(s => {
      const dateStr = s[phase]?.deliveryDate;
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
          label: `${phase.charAt(0).toUpperCase() + phase.slice(1)} Delivery Count`,
          data: sorted.map(([, count]) => count),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          borderColor: 'rgb(53, 162, 235)',
          borderWidth: 1,
        },
      ],
    };
  };

  const designChartData = getDeliveryChartData('design');
  const codingChartData = getDeliveryChartData('coding');

  const handleBarClick = (elements, event, chartPhase) => {
    if (!elements.length) return;
    const index = elements[0].index;
    const label = chartRefs[chartPhase].current?.data?.labels?.[index];
    if (!label) return;
    const filtered = schedules.filter(s => {
      const date = s[chartPhase]?.deliveryDate;
      return date && new Date(date).toLocaleDateString('en-CA') === label;
    });
    setFilteredSchedules(filtered);
    setActiveFilter({ phase: chartPhase, date: label });
  };

  return (
    <Container maxWidth="xl">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box display="flex" gap={4}>
            <Box flex={1}>
              <Typography variant="h6" gutterBottom>
                Design Delivery Dates
              </Typography>
              <Bar
                ref={chartRefs.design}
                data={designChartData}
                options={{
                  onClick: (evt, elements) => handleBarClick(elements, evt, 'design'),
                }}
              />
            </Box>
            <Box flex={1}>
              <Typography variant="h6" gutterBottom>
                Coding Delivery Dates
              </Typography>
              <Bar
                ref={chartRefs.coding}
                data={codingChartData}
                options={{
                  onClick: (evt, elements) => handleBarClick(elements, evt, 'coding'),
                }}
              />
            </Box>
          </Box>
          {filteredSchedules.length > 0 && (
            <>
              {activeFilter && (
                <Box mt={2}>
                  <Typography variant="body1">
                    Đang lọc theo: <strong>{activeFilter.phase.toUpperCase()}</strong> – Ngày giao hàng <strong>{activeFilter.date}</strong>
                  </Typography>
                </Box>
              )}
              <Box mt={2}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFilteredSchedules([]);
                    setActiveFilter(null);
                  }}
                >
                  Xoá bộ lọc
                </Button>
              </Box>
            </>
          )}
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom align="center">
            Schedule Import
          </Typography>
          <FormControl fullWidth sx={{ maxWidth: 300, mb: 2 }}>
            <InputLabel>Select Project</InputLabel>
            <Select
              value={selectedProjectId}
              label="Select Project"
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map((proj) => (
                <MenuItem key={proj.ProjectID} value={proj.ProjectID}>
                  {proj.ProjectID}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedFile && (
            <Typography variant="body1" gutterBottom>
              Selected: {selectedFile.split('/').pop()}
            </Typography>
          )}
          <Box mt={2} mb={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={onBack}
            >
              Back to Home
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          {schedules.length > 0 && (
            <Box sx={{ height: `calc(100vh - 250px)`, width: '100%' }} className="ag-theme-quartz">
              <AgGridReact
                rowData={filteredSchedules.length > 0 ? filteredSchedules.map((s, index) => ({
                  id: index,
                  prgid: s.prgid,
                  prgname: s.prgname,
                  designDeliveryDate: s.design?.deliveryDate ? new Date(s.design.deliveryDate).toISOString().split('T')[0] : '',
                  design_assignee: s.design?.assignee || '',
                  design_progress: s.design?.progress || 0,
                  review_assignee: s.review?.assignee || '',
                  review_progress: s.review?.progress || 0,
                  codingDeliveryDate: s.coding?.deliveryDate ? new Date(s.coding.deliveryDate).toISOString().split('T')[0] : '',
                  coding_assignee: s.coding?.assignee || '',
                  coding_progress: s.coding?.progress || 0,
                  testing_assignee: s.testing?.assignee || '',
                  testing_progress: s.testing?.progress || 0,
                })) : rows}
                columnDefs={columns}
                pagination={true}
                paginationPageSize={20}
                defaultColDef={{
                  sortable: true,
                  filter: true,
                  resizable: true,
                }}
                animateRows={true}
              />
            </Box>
          )}
        </Grid>
      </Grid>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SchedulePanel;