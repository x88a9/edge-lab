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

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/runs" replace />} />
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