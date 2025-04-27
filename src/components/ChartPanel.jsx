import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, getElementsAtEvent } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ChartPanel = ({ data, onProjectClick }) => {
  const chartRef = useRef(null); // Create a ref to access the chart instance

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="body1">Không có dữ liệu để vẽ biểu đồ.</Typography>
      </Box>
    );
  }

  const projectCount = {};
  data.forEach((issue) => {
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
      },
    ],
  };

  const handleClick = (event) => {
    const chart = chartRef.current; // Access the chart instance via ref
    if (!chart) return;

    // Use getElementsAtEvent to get the clicked elements
    const elements = getElementsAtEvent(chart, event);
    if (elements.length > 0) {
      const clickedIndex = elements[0].index; // Get the index of the clicked bar
      const clickedLabel = chartData.labels[clickedIndex];
      onProjectClick(clickedLabel); // Send clicked project info to App.jsx
    }
  };

  return (
    <Box p={2} sx={{ height: 400 }}>
      <Typography variant="h6">Biểu đồ số lượng issue theo Project</Typography>
      <Bar
        ref={chartRef} // Attach the ref to the Bar component
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
        }}
        onClick={handleClick} // Attach the click handler
      />
    </Box>
  );
};

export default ChartPanel;