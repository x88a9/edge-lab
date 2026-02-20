import { Route, Routes, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import RunsList from './pages/RunsList';
import RunPage from './pages/RunPage';
import SystemsPage from './pages/SystemsPage';
import VariantsPage from './pages/VariantsPage';
import TradesPage from './pages/TradesPage';
import VariantPage from './pages/VariantPage';
import SystemPage from './pages/SystemPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/runs" replace />} />
        <Route path="/runs" element={<RunsList />} />
        <Route path="/runs/:runId" element={<RunPage />} />
        <Route path="/systems" element={<SystemsPage />} />
        <Route path="/systems/:systemId" element={<SystemPage />} />
        <Route path="/variants" element={<VariantsPage />} />
        <Route path="/variants/:variantId" element={<VariantPage />} />
        <Route path="/trades" element={<TradesPage />} />
      </Routes>
    </Layout>
  );
}