// src/chartSetup.js
import { Chart as ChartJS, ArcElement, BarElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(ArcElement, BarElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, ChartDataLabels);

export default ChartJS;