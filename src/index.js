// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client'; // Thay đổi import từ 'react-dom' sang 'react-dom/client'
import './index.css';
import App from './App';
import './chartSetup'; // Đảm bảo ChartJS được đăng ký

// Tạo root và render ứng dụng
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);