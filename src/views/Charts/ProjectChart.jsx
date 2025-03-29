import React from 'react';
import { Typography } from '@mui/material';
import { Bar } from 'react-chartjs-2';

const ProjectChart = ({ data, onClick }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      datalabels: { color: '#fff', font: { weight: 'bold' }, formatter: (value) => Math.round(value), anchor: 'end', align: 'top' },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, callback: (value) => Number.isInteger(value) ? value : null } },
      x: { ticks: { maxRotation: 45, minRotation: 45 } },
    },
    barThickness: 40,
    onClick,
  };

  return (
    <div>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
        プロジェクトごとの課題数 (Issues by Project)
      </Typography>
      <Bar data={data} options={options} />
    </div>
  );
};

export default ProjectChart;