import React from 'react';
import { Typography } from '@mui/material';
import { Pie } from 'react-chartjs-2';

const PriorityChart = ({ data, onClick }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      datalabels: { color: '#000', font: { weight: 'bold' }, formatter: (value) => Math.round(value) },
    },
    onClick,
  };

  return (
    <div style={{ maxWidth: '400px', width: '100%' }}>
      <Typography variant="subtitle1" align="center">優先度ごとの課題数 (Issues by Priority)</Typography>
      <Pie data={data} options={options} />
    </div>
  );
};

export default PriorityChart;