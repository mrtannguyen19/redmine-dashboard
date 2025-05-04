import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, getElementsAtEvent } from 'react-chartjs-2';
import { useRedmine } from './App';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ChartPanel = () => {
  const { filteredIssues, handleBarClick } = useRedmine();
  const chartRef = useRef(null);
  const dueDateChartRef = useRef(null);

  if (!filteredIssues || !Array.isArray(filteredIssues) || filteredIssues.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="body1">Không có dữ liệu để vẽ biểu đồ.</Typography>
      </Box>
    );
  }

  const projectCount = {};
  filteredIssues.forEach((issue) => {
    const projectName = issue.project?.name || 'Unknown';
    projectCount[projectName] = (projectCount[projectName] || 0) + 1;
  });

  const dueDateCount = {};
  filteredIssues.forEach((issue) => {
    //if (!issue.status.is_closed) { // Chỉ tính issue chưa đóng
      const dueDate = issue.custom_fields?.find((field) => field.name === '回答納期')?.value || 'N/A';
      dueDateCount[dueDate] = (dueDateCount[dueDate] || 0) + 1;
    //}
  });

  // Lấy ngày hiện tại
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Đặt về đầu ngày để so sánh chính xác

  // Lọc các ngày hợp lệ (ngày >= today)
  const validDueDates = Object.keys(dueDateCount).filter(
    (date) => date === 'N/A' || (date !== 'N/A' && !isNaN(new Date(date).getTime()) && new Date(date) >= today)
  );

  // Sắp xếp ngày: các ngày hợp lệ theo thứ tự tăng dần, N/A ở cuối
  const sortedDueDates = validDueDates
    .sort((a, b) => {
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return new Date(a) - new Date(b);
    });

  // Nếu ít hơn 7 ngày, lấy 7 ngày lớn nhất từ tất cả ngày
  let finalDueDates = sortedDueDates;
  if (sortedDueDates.length < 7) {
    const allValidDates = Object.keys(dueDateCount).filter(
      (date) => date !== 'N/A' && !isNaN(new Date(date).getTime())
    );
    const sortedAllDates = allValidDates
      .sort((a, b) => new Date(b) - new Date(a)) // Sắp xếp giảm dần để lấy ngày lớn nhất
      .slice(0, 7 - sortedDueDates.length); // Lấy số ngày còn thiếu
    finalDueDates = [...sortedDueDates.filter(date => date !== 'N/A'), ...sortedAllDates];
    if (dueDateCount['N/A']) {
      finalDueDates.push('N/A'); // Thêm N/A vào cuối nếu có
    }
  } else {
    finalDueDates = sortedDueDates.slice(0, 7); // Chỉ lấy 7 ngày đầu tiên
  }

  const dueDateChartData = {
    labels: finalDueDates,
    datasets: [
      {
        label: 'Số lượng Issue theo 回答納期',
        data: finalDueDates.map((date) => dueDateCount[date] || 0),
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
    const chart = chartRef.current;
    if (!chart) return;
    const elements = getElementsAtEvent(chart, event);
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const clickedLabel = chartData.labels[clickedIndex];
      handleBarClick(clickedLabel, 'project');
    }
  };

  const handleDueDateClick = (event) => {
    const dueDateChart = dueDateChartRef.current;
    if (!dueDateChart) return;
    const elements = getElementsAtEvent(dueDateChart, event);
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const clickedLabel = dueDateChartData.labels[clickedIndex];
      handleBarClick(clickedLabel, '回答納期');
    }
  };

  return (
    <Box p={2} sx={{ display: 'flex', gap: 2, height: 400 }}>
      <Box sx={{ flex: 1, p: 1 }}>
        <Typography variant="h6">Biểu đồ 7 ngày giao hàng gần nhất (回答納期)</Typography>
        <Bar
          ref={dueDateChartRef}
          data={dueDateChartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                maxBarThickness: 10, // Giới hạn bề rộng tối đa của bar là 10
              },
            },
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
            scales: {
              x: {
                ticks: { autoSkip: false },
                maxBarThickness: 5
              }
            }
          }}
          onClick={handleClick}
        />
      </Box>
    </Box>
  );
};

export default ChartPanel;