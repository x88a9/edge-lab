import { Route, Routes, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import RunsList from './pages/RunsList';
import RunPage from './pages/RunPage';
import SystemsPage from './pages/SystemsPage';
import VariantsPage from './pages/VariantsPage';
import TradesPage from './pages/TradesPage';
import VariantPage from './pages/VariantPage';
import SystemPage from './pages/SystemPage';
import Login from './pages/Login';
import { ProtectedRoute } from './auth/AuthContext';
import PortfolioPage from './pages/PortfolioPage';
import ManualBacktestingPage from './pages/ManualBacktestingPage';
import PortfolioListPage from './pages/PortfolioListPage';
import PortfolioBootstrap from './pages/PortfolioBootstrap';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><PortfolioBootstrap /></ProtectedRoute>} />
        <Route path="/portfolio" element={<ProtectedRoute><PortfolioListPage /></ProtectedRoute>} />
        <Route path="/portfolio/:portfolioId" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
        <Route path="/manual" element={<ProtectedRoute><ManualBacktestingPage /></ProtectedRoute>} />
        <Route path="/runs" element={<ProtectedRoute><RunsList /></ProtectedRoute>} />
        <Route path="/runs/:runId" element={<ProtectedRoute><RunPage /></ProtectedRoute>} />
        <Route path="/systems" element={<ProtectedRoute><SystemsPage /></ProtectedRoute>} />
        <Route path="/systems/:systemId" element={<ProtectedRoute><SystemPage /></ProtectedRoute>} />
        <Route path="/variants" element={<ProtectedRoute><VariantsPage /></ProtectedRoute>} />
        <Route path="/variants/:variantId" element={<ProtectedRoute><VariantPage /></ProtectedRoute>} />
        <Route path="/trades" element={<ProtectedRoute><TradesPage /></ProtectedRoute>} />
      </Routes>
    </Layout>
  );
}
