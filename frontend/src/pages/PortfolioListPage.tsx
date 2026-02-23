import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import DataTable from '../components/DataTable';
import Button from '../components/Button';
import { useAdminInspection } from '../context/AdminInspectionContext';
import CreatePortfolioModal from '../components/modals/CreatePortfolioModal';
import Toast from '../components/Toast';

export default function PortfolioListPage() {
  const { portfolioList, loading, error } = usePortfolio();
  const navigate = useNavigate();
  const { inspectionMode } = useAdminInspection();
  const isEmptyError = !!error && /not found/i.test(error);
  const [openCreate, setOpenCreate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (loading) return <div className="card p-4"><div className="meta">Loading portfolios…</div></div>;
  if (error && !isEmptyError) return <div className="card p-4"><div className="meta text-danger">{error}</div></div>;

  return (
    <div>
      <div className="page-title mb-1">Portfolios</div>
      <div className="subline">All portfolios</div>
      <div className="border-b border-neutral-800 mb-4"></div>
      {portfolioList.length === 0 || isEmptyError ? (
        <div className="card p-4 flex items-center justify-between">
          <div className="meta text-danger">No portfolios found</div>
          {!inspectionMode && (
            <Button variant="secondary" onClick={() => setOpenCreate(true)}>+ Create Portfolio</Button>
          )}
        </div>
      ) : (
        <DataTable
          columns={[
            { key: 'name', label: 'Portfolio' },
            { key: 'allocation_mode', label: 'Allocation' },
            { key: 'strategy_count', label: 'Strategies', align: 'right' },
            { key: 'is_dirty', label: 'Dirty', render: (p: any) => p.is_dirty ? <span className="badge">Outdated</span> : <span className="badge">OK</span> },
            { key: 'updated_at', label: 'Updated', render: (p: any) => <span className="meta">{p.updated_at ?? '—'}</span> },
          ]}
          rows={portfolioList}
          rowKey={(p: any) => p.id}
          onRowClick={(p: any) => navigate(`/portfolio/${p.id}`)}
        />
      )}

      {!inspectionMode && openCreate && (
        <CreatePortfolioModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onCreated={(id: string) => {
            setToast('Portfolio created');
            navigate(`/portfolio/${id}`);
          }}
        />
      )}

      {toast && <Toast message={toast} onHide={() => setToast(null)} />}
    </div>
  );
}
