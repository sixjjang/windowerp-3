import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { windowGalleryTheme } from './theme/theme';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/business/Schedule';
import EstimateManagement from './pages/business/EstimateManagement';
import DeliveryManagement from './pages/business/DeliveryManagement';
import OrderManagement from './pages/business/OrderManagement';
import ProductManagement from './pages/business/ProductManagement';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import CustomerManagement from './pages/admin/CustomerManagement';
import VendorManagement from './pages/admin/VendorManagement';
import ProductManagementAdmin from './pages/admin/ProductManagement';
import OptionManagement from './pages/admin/OptionManagement';
import FormulaManagement from './pages/admin/FormulaManagement';
import CompanyInfoManagement from './pages/admin/CompanyInfoManagement';
import Accounting from './pages/admin/Accounting';
import Statistics from './pages/admin/Statistics';
import TaxInvoice from './pages/admin/TaxInvoice';
import ContractManagement from './pages/business/ContractManagement';
import MeasurementData from './pages/business/MeasurementData';
import HistoricalDataManagement from './pages/business/HistoricalDataManagement';
import TimeTreeCallback from './pages/TimeTreeCallback';
import TestHistorical from './pages/TestHistorical';
import './styles/global.css';

function App() {
  // 접근성 문제 해결: aria-hidden 제거
  useEffect(() => {
    const rootElement = document.getElementById('root');
    if (rootElement && rootElement.getAttribute('aria-hidden') === 'true') {
      rootElement.removeAttribute('aria-hidden');
    }
    
    // 주기적으로 확인 (동적으로 설정될 수 있으므로)
    const interval = setInterval(() => {
      if (rootElement && rootElement.getAttribute('aria-hidden') === 'true') {
        rootElement.removeAttribute('aria-hidden');
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider theme={windowGalleryTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 50%, #1A1A1A 100%)',
          backgroundAttachment: 'fixed',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 80%, rgba(255, 107, 157, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 71, 87, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(255, 179, 209, 0.05) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
            zIndex: 0,
          },
        }}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/timetree-callback" element={<TimeTreeCallback />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="estimate" element={<EstimateManagement />} />
            <Route path="contract" element={<ContractManagement />} />
            <Route path="order" element={<OrderManagement />} />
            <Route path="delivery" element={<DeliveryManagement />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="measurement" element={<MeasurementData />} />
            <Route path="historical" element={<HistoricalDataManagement />} />
            <Route path="customers" element={<CustomerManagement />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="options" element={<OptionManagement />} />
            <Route path="formulas" element={<FormulaManagement />} />
            <Route path="company-info" element={<CompanyInfoManagement />} />
            <Route path="vendors" element={<VendorManagement />} />
            <Route path="accounting" element={<Accounting />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="tax-invoice" element={<TaxInvoice />} />
            <Route path="test-historical" element={<TestHistorical />} />
            <Route path="admin/users" element={<AdminUserManagement />} />
            <Route
              path="business/contract-management"
              element={<ContractManagement />}
            />
            <Route path="business/estimate" element={<EstimateManagement />} />
          </Route>
        </Routes>
      </Box>
    </ThemeProvider>
  );
}

export default App;
