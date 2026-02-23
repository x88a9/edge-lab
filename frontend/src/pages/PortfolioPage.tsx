import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPortfolio, computePortfolio } from '../api/portfolio';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import type { PortfolioSnapshot } from '../types';
import { useAdminInspection } from '../context/AdminInspectionContext';

export default function PortfolioPage() {
  const navigate = useNavigate();
  const { portfolioId } = useParams();
  const [data, setData] = useState<PortfolioSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);
  const { inspectionMode } = useAdminInspection();

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        if (!portfolioId) {
          navigate('/portfolio', { replace: true });
          return;
        }
        const snap = await getPortfolio(portfolioId);
        if (!cancelled) setData(snap);
      } catch (e: any) {
        if (!cancelled) {
          const status = e?.response?.status;
          if (status === 404) {
            navigate('/portfolio', { replace: true });
          } else {
            setError(e?.response?.data?.detail ?? e.message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [portfolioId]);

  if (loading) return <div className="card p-4"><div className="meta">Loading portfolio…</div></div>;
  if (error) return <div className="card p-4"><div className="meta text-danger">{error}</div></div>;
  if (!data) return null;

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Portfolio' }]} />
      <div className="page-title mb-1">Portfolio Dashboard</div>
      <div className="subline">Allocation: {data.allocation_mode} • Strategies: {data.strategy_count}</div>
      <div className="border-b border-neutral-800 mb-4"></div>

      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="section-title">Portfolio Analytics</div>
          <div className="flex items-center gap-2">
            {data.is_dirty && <span className="badge">Portfolio analytics outdated</span>}
            <Button
              variant="primary"
              disabled={inspectionMode || computing}
              onClick={async () => {
                if (!portfolioId) return;
                setComputing(true);
                try {
                  await computePortfolio(portfolioId);
                  let attempts = 0;
                  let snap: PortfolioSnapshot | null = null;
                  const startingUpdatedAt = data?.updated_at ?? null;
                  while (attempts < 10) {
                    const fresh = await getPortfolio(portfolioId);
                    snap = fresh;
                    const updatedChanged = startingUpdatedAt !== fresh.updated_at;
                    const notDirty = !fresh.is_dirty;
                    if (updatedChanged || notDirty) break;
                    await new Promise((res) => setTimeout(res, 800));
                    attempts += 1;
                  }
                  if (snap) setData(snap);
                } finally {
                  setComputing(false);
                }
              }}
            >
              {computing ? 'Computing…' : 'Recompute Portfolio'}
            </Button>
          </div>
        </div>
        <div className={data.is_dirty ? 'opacity-60' : ''}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="card p-3">
              <div className="meta">Combined Expectancy</div>
              <div>{data.combined_metrics.combined_expectancy}</div>
            </div>
            <div className="card p-3">
              <div className="meta">Combined Log Growth</div>
              <div>{data.combined_metrics.combined_mean_log_growth}</div>
            </div>
            <div className="card p-3">
              <div className="meta">Strategy Count</div>
              <div>{data.strategy_count}</div>
            </div>
          </div>
          <div>
            <div className="section-title mb-2">Combined Equity</div>
            <svg width={800} height={200} className="bg-neutral-900 border border-neutral-800 rounded-lg">
              {Array.isArray(data.combined_equity?.equity) && data.combined_equity!.equity.map((e, i, arr) => {
                const x = (i / Math.max(arr.length - 1, 1)) * 780 + 10;
                const y = 180 - ((e - Math.min(...arr)) / Math.max(1e-9, Math.max(...arr) - Math.min(...arr))) * 160;
                const prevX = ((i - 1) / Math.max(arr.length - 1, 1)) * 780 + 10;
                const prevY = 180 - (((arr[i - 1] ?? e) - Math.min(...arr)) / Math.max(1e-9, Math.max(...arr) - Math.min(...arr))) * 160;
                if (i === 0) return null;
                return <line key={i} x1={prevX} y1={prevY} x2={x} y2={y} stroke="#9bb4e2" strokeWidth={1} />;
              })}
            </svg>
            <div className="meta mt-2">Equity chart uses muted institutional styling</div>
          </div>
        </div>
      </div>
    </div>
  );
}
