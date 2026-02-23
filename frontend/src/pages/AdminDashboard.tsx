import { useEffect, useState } from 'react';
import { getAdminOverview } from '../api/admin';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const res = await getAdminOverview();
        if (!cancel) setData(res);
      } catch (e: any) {
        if (!cancel) setError(e?.response?.data?.detail ?? e.message);
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    fetch();
    return () => { cancel = true; };
  }, []);

  if (!currentUser?.is_admin) return null;
  if (loading) return <div className="card p-4"><div className="meta">Loading…</div></div>;
  if (error) return <div className="card p-4"><div className="meta text-danger">{error}</div></div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="page-title mb-1">Admin Overview</div>
          <div className="subline">System status and totals</div>
        </div>
        <div>
          <Button variant="secondary" onClick={() => navigate('/admin/users')}>Manage Users</Button>
        </div>
      </div>
      <div className="border-b border-neutral-800 mb-4"></div>
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3"><div className="meta">Total Users</div><div className="h2">{data.total_users}</div></div>
        <div className="card p-3"><div className="meta">Strategies</div><div className="h2">{data.total_strategies}</div></div>
        <div className="card p-3"><div className="meta">Variants</div><div className="h2">{data.total_variants}</div></div>
        <div className="card p-3"><div className="meta">Runs</div><div className="h2">{data.total_runs}</div></div>
        <div className="card p-3"><div className="meta">Trades</div><div className="h2">{data.total_trades}</div></div>
        <div className="card p-3"><div className="meta">Portfolios</div><div className="h2">{data.total_portfolios}</div></div>
      </div>
    </div>
  );
}
