import React from 'react';
import { Typography } from '@mui/material';
import { Bar } from 'react-chartjs-2';

const ProjectFjnErrorChart = ({ data, onClick }) => {
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
    barThickness: 20,
    onClick,
  };

  return (
    <>
      <Typography variant="subtitle1">プロジェクトごとFJN側障害種別 (Issues by Project and FJN Error Type)</Typography>
      <Bar data={data} options={options} />
    </>
  );
};

export default ProjectFjnErrorChart;