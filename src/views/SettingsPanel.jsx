import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);
const SettingsPanel = ({ onBack }) => {
  const [projects, setProjects] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [formData, setFormData] = useState({
    ProjectID: '',
    RootPath: '',
    DesignPath: '',
    TestingPath: '',
    SchedulePath: '',
    ScheduleFileName: '',
    TrackingURL: '',
    TrackingAPIKey: '',
    RedmineName: '',
    RedmineURL: '',
    RedmineAPIKey: ''
  });

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await window.electronAPI.getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error.message);
        setSnackbar({
          open: true,
          message: `Failed to fetch projects: ${error.message}`,
          severity: 'error',
        });
      }
    };
    fetchProjects();
  }, []);

  // Handle RootPath change in dialog
  useEffect(() => {
    const computePaths = async () => {
      if (formData.RootPath) {
        try {
          const paths = await window.electronAPI.computeProjectPaths(formData.RootPath);
          setFormData((prev) => ({
            ...prev,
            DesignPath: paths.DesignPath,
            TestingPath: paths.TestingPath,
            SchedulePath: paths.SchedulePath,
            ScheduleFileName: paths.ScheduleFileName
          }));
        } catch (error) {
          console.error('Error computing paths:', error.message);
          setSnackbar({
            open: true,
            message: `Failed to compute paths: ${error.message}`,
            severity: 'error',
          });
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          DesignPath: '',
          TestingPath: '',
          SchedulePath: '',
          ScheduleFileName: ''
        }));
      }
    };
    computePaths();
  }, [formData.RootPath]);

  // Open dialog for adding new project
  const handleAddProject = () => {
    setCurrentProject(null);
    setFormData({
      ProjectID: '',
      RootPath: '',
      DesignPath: '',
      TestingPath: '',
      SchedulePath: '',
      ScheduleFileName: '',
      TrackingURL: '',
      TrackingAPIKey: '',
      RedmineName: '',
      RedmineURL: '',
      RedmineAPIKey: ''
    });
    setOpenDialog(true);
  };

  // Open dialog for editing project
  const handleEditProject = (project) => {
    setCurrentProject(project);
    setFormData({
      ProjectID: project.ProjectID || '',
      RootPath: project.RootPath || '',
      DesignPath: project.DesignPath || '',
      TestingPath: project.TestingPath || '',
      SchedulePath: project.SchedulePath || '',
      ScheduleFileName: project.ScheduleFileName || '',
      TrackingURL: project.TrackingURL || '',
      TrackingAPIKey: project.TrackingAPIKey || '',
      RedmineName: project.RedmineName || '',
      RedmineURL: project.RedmineURL || '',
      RedmineAPIKey: project.RedmineAPIKey || ''
    });
    setOpenDialog(true);
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Save project (add or update)
  const handleSaveProject = async () => {
    if (!formData.ProjectID) {
      setSnackbar({
        open: true,
        message: 'Project ID is required',
        severity: 'error',
      });
      return;
    }

    // Check for duplicate ProjectID
    const existingProject = projects.find(
      (p) => p.ProjectID === formData.ProjectID && (!currentProject || p.ProjectID !== currentProject.ProjectID)
    );
    if (existingProject) {
      setSnackbar({
        open: true,
        message: `Project ID ${formData.ProjectID} already exists`,
        severity: 'error',
      });
      return;
    }

    try {
      let updatedProjects;
      if (currentProject) {
        // Update existing project by ProjectID
        updatedProjects = projects.map((p) =>
          p.ProjectID === currentProject.ProjectID ? { ...formData } : p
        );
      } else {
        // Add new project
        updatedProjects = [...projects, { ...formData }];
      }
      const success = await window.electronAPI.saveProjects(
        updatedProjects.map((p) => ({
          ProjectID: p.ProjectID,
          RootPath: p.RootPath,
          DesignPath: p.DesignPath,
          TestingPath: p.TestingPath,
          SchedulePath: p.SchedulePath,
          ScheduleFileName: p.ScheduleFileName,
          TrackingURL: p.TrackingURL,
          TrackingAPIKey: p.TrackingAPIKey,
          RedmineName: p.RedmineName,
          RedmineURL: p.RedmineURL,
          RedmineAPIKey: p.RedmineAPIKey
        }))
      );
      if (success) {
        setProjects(updatedProjects);
        setOpenDialog(false);
        setSnackbar({
          open: true,
          message: currentProject ? 'Project updated successfully' : 'Project added successfully',
          severity: 'success',
        });
      } else {
        throw new Error('Failed to save projects');
      }
    } catch (error) {
      console.error('Error saving project:', error.message);
      setSnackbar({
        open: true,
        message: `Failed to save project: ${error.message}`,
        severity: 'error',
      });
    }
  };

  // Delete project
  const handleDeleteProject = async (projectID) => {
    try {
      const updatedProjects = projects.filter((p) => p.ProjectID !== projectID);
      const success = await window.electronAPI.saveProjects(
        updatedProjects.map((p) => ({
          ProjectID: p.ProjectID,
          RootPath: p.RootPath,
          DesignPath: p.DesignPath,
          TestingPath: p.TestingPath,
          SchedulePath: p.SchedulePath,
          ScheduleFileName: p.ScheduleFileName,
          TrackingURL: p.TrackingURL,
          TrackingAPIKey: p.TrackingAPIKey,
          RedmineName: p.RedmineName,
          RedmineURL: p.RedmineURL,
          RedmineAPIKey: p.RedmineAPIKey
        }))
      );
      if (success) {
        setProjects(updatedProjects);
        setSnackbar({
          open: true,
          message: 'Project deleted successfully',
          severity: 'success',
        });
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error.message);
      setSnackbar({
        open: true,
        message: `Failed to delete project: ${error.message}`,
        severity: 'error',
      });
    }
  };

  // AG Grid columns
  const [columnDefs] = useState([
    {
      headerName: 'Actions',
      field: 'actions',
      cellRenderer: (params) => (
        <Box>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => handleEditProject(params.data)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => handleDeleteProject(params.data.ProjectID)}
          >
            Delete
          </Button>
        </Box>
      ),
      width: 200
    },
    { headerName: 'Project ID', field: 'ProjectID' },
    { headerName: 'Root Path', field: 'RootPath' },
    { headerName: 'Design Path', field: 'DesignPath' },
    { headerName: 'Testing Path', field: 'TestingPath' },
    { headerName: 'Schedule Path', field: 'SchedulePath' },
    { headerName: 'Schedule File', field: 'ScheduleFileName' },
    { headerName: 'Tracking URL', field: 'TrackingURL' },
    { headerName: 'Tracking API Key', field: 'TrackingAPIKey' },
    { headerName: 'Redmine Name', field: 'RedmineName' },
    { headerName: 'Redmine URL', field: 'RedmineURL' },
    { headerName: 'Redmine API Key', field: 'RedmineAPIKey' },
  ]);

  return (
    <Container maxWidth="xl">
      <Box py={2}>
        <Typography variant="h4" gutterBottom align="center">
          Project Settings
        </Typography>
        <Box mb={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddProject}
            sx={{ mr: 2 }}
          >
            Add Project
          </Button>
        </Box>
        <Box mt={2} mb={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={onBack}
          >
            Back to Home
          </Button>
        </Box>
        <Box className="ag-theme-quartz" style={{ height: 'calc(100vh - 250px)', width: '100%' }}>
          <AgGridReact
            rowData={projects}
            columnDefs={columnDefs}
            pagination={true}
            paginationPageSize={20}
            defaultColDef={{
              sortable: true,
              filter: true,
              resizable: true,
            }}
            animateRows={true}
            getRowId={params => params.data && params.data.ProjectID}
          />
        </Box>
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{currentProject ? 'Edit Project' : 'Add Project'}</DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Project ID"
                name="ProjectID"
                value={formData.ProjectID}
                onChange={handleFormChange}
                fullWidth
                required
                error={!formData.ProjectID}
                helperText={!formData.ProjectID ? 'Project ID is required' : ''}
              />
              <TextField
                label="Root Path"
                name="RootPath"
                value={formData.RootPath}
                onChange={handleFormChange}
                fullWidth
                helperText="Enter the project root folder path"
              />
              <TextField
                label="Design Path"
                name="DesignPath"
                value={formData.DesignPath}
                onChange={handleFormChange}
                fullWidth
                disabled
              />
              <TextField
                label="Testing Path"
                name="TestingPath"
                value={formData.TestingPath}
                onChange={handleFormChange}
                fullWidth
                disabled
              />
              <TextField
                label="Schedule Path"
                name="SchedulePath"
                value={formData.SchedulePath}
                onChange={handleFormChange}
                fullWidth
                disabled
              />
              <TextField
                label="Schedule File Name"
                name="ScheduleFileName"
                value={formData.ScheduleFileName}
                onChange={handleFormChange}
                fullWidth
                disabled
              />
              <TextField
                label="Tracking URL"
                name="TrackingURL"
                value={formData.TrackingURL}
                onChange={handleFormChange}
                fullWidth
              />
              <TextField
                label="Tracking API Key"
                name="TrackingAPIKey"
                value={formData.TrackingAPIKey}
                onChange={handleFormChange}
                fullWidth
              />
              <TextField
                label="Redmine Name"
                name="RedmineName"
                value={formData.RedmineName}
                onChange={handleFormChange}
                fullWidth
              />
              <TextField
                label="Redmine URL"
                name="RedmineURL"
                value={formData.RedmineURL}
                onChange={handleFormChange}
                fullWidth
              />
              <TextField
                label="Redmine API Key"
                name="RedmineAPIKey"
                value={formData.RedmineAPIKey}
                onChange={handleFormChange}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleSaveProject} color="primary" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
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

export default SettingsPanel;