import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Đăng ký component cho Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ChartPanel = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="body1">Không có dữ liệu để vẽ biểu đồ.</Typography>
      </Box>
    );
  }

  const projectCount = {};
  data.forEach(issue => {
    const projectName = issue.project?.name || issue.projectName || 'Unknown';
    projectCount[projectName] = (projectCount[projectName] || 0) + 1;
  });

  const chartData = {
    labels: Object.keys(projectCount),
    datasets: [
      {
        label: 'Số lượng Issue',
        data: Object.values(projectCount),
        backgroundColor: 'rgba(75,192,192,0.6)',
      }
    ]
  };

  return (
    <Box p={2} sx={{ height: 400 }}>
      <Typography variant="h6">Biểu đồ số lượng issue theo Project</Typography>
      <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
    </Box>
  );
};

export default ChartPanel;