import React, { useState, useEffect } from 'react';
import {Button, Box, Container, Typography, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);


const SchedulePanel = ({ onBack }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

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
    { field: 'design_delivery_date', headerName: 'Design Delivery', width: 150 },
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
    { field: 'coding_delivery_date', headerName: 'Coding Delivery', width: 150 },
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
    design_delivery_date: schedule.design?.delivery_date || '',
    design_assignee: schedule.design?.assignee || '',
    design_progress: schedule.design?.progress || 0,
    review_assignee: schedule.review?.assignee || '',
    review_progress: schedule.review?.progress || 0,
    coding_delivery_date: schedule.coding?.delivery_date || '',
    coding_assignee: schedule.coding?.assignee || '',
    coding_progress: schedule.coding?.progress || 0,
    testing_assignee: schedule.testing?.assignee || '',
    testing_progress: schedule.testing?.progress || 0,
  }));

  return (
    <Container maxWidth="xl">
      <Box py={2}>
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
        {schedules.length > 0 && (
          <Box sx={{ height: `calc(100vh - 250px)`, width: '100%' }} className="ag-theme-quartz">
            <AgGridReact
              rowData={rows}
              columnDefs={columns}
              pagination={true}
              paginationPageSize={20}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
                flex: 1,
              }}
              animateRows={true}
            />
          </Box>
        )}
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
      </Box>
    </Container>
  );
};

export default SchedulePanel;