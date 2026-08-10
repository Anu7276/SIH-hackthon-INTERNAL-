import React from 'react';
import { createRoot } from 'react-dom/client';
import InvestorDashboardPage from './InvestorDashboardPage.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <InvestorDashboardPage />
  </React.StrictMode>,
);
