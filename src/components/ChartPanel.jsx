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

const ChartPanel = ({ data, onBarClick }) => {
  const chartRef = useRef(null); // Create a ref to access the chart instance
  const dueDateChartRef = useRef(null);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="body1">Không có dữ liệu để vẽ biểu đồ.</Typography>
      </Box>
    );
  }

  const projectCount = {};
  data.forEach((issue) => {
    const projectName = issue.project?.name || 'Unknown';
    projectCount[projectName] = (projectCount[projectName] || 0) + 1;
  });

  const dueDateCount = {};
  data.forEach((issue) => {
    const dueDate = issue.custom_fields?.find((field) => field.name === '回答納期')?.value || 'N/A';
    if (dueDate) {
      dueDateCount[dueDate] = (dueDateCount[dueDate] || 0) + 1;
    }
  });

  const sortedDueDates = Object.keys(dueDateCount)
    .sort((a, b) => new Date(a) - new Date(b))
    .slice(0, 7);

  const dueDateChartData = {
    labels: sortedDueDates,
    datasets: [
      {
        label: 'Số lượng Issue theo 回答納期',
        data: sortedDueDates.map(date => dueDateCount[date]),
        backgroundColor: 'rgba(255,99,132,0.6)',
      },
    ],
  };

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
      onBarClick(clickedLabel,'project'); // Send clicked info to App.jsx
    }
  };

  const handleDueDateClick = (event) => {
    const chart = dueDateChartRef.current;
    if (!chart) return;

    const elements = getElementsAtEvent(chart, event);
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const clickedLabel = dueDateChartData.labels[clickedIndex];
      onBarClick(clickedLabel,'回答納期'); // Send clicked info to App.jsx   
   }
  };

  return (
    <Box p={2} sx={{ display: 'flex', gap: 2, height: 400 }}>
      <Box sx={{ flex: 1, p: 1 }}>
        <Typography variant="h6">Biểu đồ 7 kỳ giao hàng sắp tới (回答納期)</Typography>
        <Bar
          ref={dueDateChartRef}
          data={dueDateChartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
          }}
          onClick={handleDueDateClick}
        />
      </Box>
      <Box sx={{ flex: 1, p: 1 }}>
        <Typography variant="h6">Biểu đồ số lượng issue theo Project</Typography>
        <Bar
          ref={chartRef}
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
          }}
          onClick={handleClick}
        />
      </Box>
    </Box>
  );
};

export default ChartPanel;