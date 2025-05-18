import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { Settings, Schedule, Dashboard } from '@mui/icons-material';

const HomeScreen = ({ onNavigate }) => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 4,
        }}
      >
        <Typography variant="h3" gutterBottom>
          Welcome to the Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => onNavigate('settings')}
          sx={{ width: 300, height: 80, fontSize: '1.5rem' }}
          startIcon={<Settings />}
        >
          Settings
        </Button>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          onClick={() => onNavigate('schedule')}
          sx={{ width: 300, height: 80, fontSize: '1.5rem' }}
          startIcon={<Schedule />}
        >
          Schedule
        </Button>
        <Button
          variant="contained"
          color="success"
          size="large"
          onClick={() => onNavigate('redmine')}
          sx={{ width: 300, height: 80, fontSize: '1.5rem' }}
          startIcon={<Dashboard />}
        >
          Redmine Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default HomeScreen;