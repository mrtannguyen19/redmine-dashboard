import React from 'react';
import { Typography } from '@mui/material';
import { Bar } from 'react-chartjs-2';

const DueDateChart = ({ data, onClick }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      datalabels: { color: '#fff', font: { weight: 'bold' }, formatter: (value) => Math.round(value), anchor: 'end', align: 'top' },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, callback: (value) => Number.isInteger(value) ? value : null } },
      x: { ticks: { maxRotation: 45, minRotation: 45, autoSkip: true, maxTicksLimit: 10 } },
    },
    barThickness: 40,
    onClick,
  };

  return (
    <>
      <Typography variant="subtitle1">回答納期ごとの課題数 (Issues by Response Due Date)</Typography>
      <Bar data={data} options={options} />
    </>
  );
};

export default DueDateChart;