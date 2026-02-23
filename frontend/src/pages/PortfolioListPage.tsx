import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import DataTable from '../components/DataTable';

export default function PortfolioListPage() {
  const { portfolioList, loading, error } = usePortfolio();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (error) return;
    if (portfolioList.length === 1) {
      navigate(`/portfolio/${portfolioList[0].id}`, { replace: true });
    }
  }, [portfolioList, loading, error, navigate]);

  if (loading) return <div className="card p-4"><div className="meta">Loading portfolios…</div></div>;
  if (error) return <div className="card p-4"><div className="meta text-danger">{error}</div></div>;

  if (portfolioList.length === 0) {
    return (
      <div className="card p-4">
        <div className="page-title mb-1">Create Portfolio</div>
        <div className="meta">No portfolios found. Create a portfolio to begin.</div>
      </div>
    );
  }

  if (portfolioList.length === 1) {
    return null;
  }

  return (
    <div>
      <div className="page-title mb-1">Select Portfolio</div>
      <div className="subline">Choose a portfolio to view analytics</div>
      <div className="border-b border-neutral-800 mb-4"></div>
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
    </div>
  );
}
