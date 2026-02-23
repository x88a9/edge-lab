import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency } from '../utils/format';
import { getVariant, listRunsForVariant } from '../api/variants';
import { getSystem } from '../api/systems';
import CreateRunModal from '../components/modals/CreateRunModal';
import { getVariantAnalytics, computeVariantAnalytics } from '../api/variants';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import { useAdminInspection } from '../context/AdminInspectionContext';

export default function VariantPage() {
  const { variantId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variant, setVariant] = useState<any>(null);
  const [systemName, setSystemName] = useState<string>('');
  const [runs, setRuns] = useState<any[]>([]);
  const [openRun, setOpenRun] = useState(false);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [computing, setComputing] = useState(false);
  const { inspectionMode } = useAdminInspection();

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      if (!variantId) return;
      setLoading(true);
      setError(null);
      try {
        const v = await getVariant(variantId);
        if (cancelled) return;
        setVariant(v);
        // Fetch system display name
        try {
          const s = await getSystem(v.strategy_id);
          if (!cancelled) setSystemName(s.display_name || s.name || v.strategy_id);
        } catch {
          if (!cancelled) setSystemName(v.strategy_id);
        }
        // Fetch runs for variant
        const r = await listRunsForVariant(variantId);
        if (!cancelled) setRuns(r);
        // Fetch analytics snapshot
        try {
          const a = await getVariantAnalytics(variantId);
          if (!cancelled) setAnalytics(a);
        } catch {
          if (!cancelled) setAnalytics(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.detail ?? e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [variantId]);

  if (loading) return <div className="card p-4"><div className="meta">Loading variant…</div></div>;
  if (error) return <div className="card p-4"><div className="meta text-danger">{error}</div></div>;
  if (!variant) return null;

  return (
    <div>
      <Breadcrumbs items={[
        { label: 'Portfolio', to: '/portfolio' },
        { label: 'Strategies', to: '/systems' },
        { label: systemName || 'System', to: `/systems/${variant.strategy_id}` },
        { label: 'Variant' }
      ]} />
      <div className="page-title mb-1">{variant.display_name || variant.name}</div>
      <div className="subline">Variant v{variant.version}</div>
      <div className="border-b border-neutral-800 mb-4"></div>

      {analytics && (
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="section-title">Variant Analytics</div>
            <div className="flex items-center gap-2">
              {analytics.is_dirty && <span className="badge">Variant analytics outdated</span>}
              <Button
                variant="primary"
                disabled={inspectionMode || computing}
                onClick={async () => {
                  if (!variantId) return;
                  setComputing(true);
                  try {
                    await computeVariantAnalytics(variantId);
                    setAnalytics({ ...analytics, is_dirty: false });
                    const snap = await getVariantAnalytics(variantId);
                    setAnalytics(snap);
                  } finally {
                    setComputing(false);
                  }
                }}
              >
                {computing ? 'Computing…' : 'Recompute Variant'}
              </Button>
            </div>
          </div>
          <div className={analytics.is_dirty ? 'opacity-60' : ''}>
            <div className="grid grid-cols-4 gap-3">
              <div className="card p-3">
                <div className="meta">Aggregated Expectancy</div>
                <div>{analytics.aggregated_metrics.mean_expectancy ?? '—'}</div>
              </div>
              <div className="card p-3">
                <div className="meta">Std Expectancy</div>
                <div>{analytics.aggregated_metrics.std_expectancy ?? '—'}</div>
              </div>
              <div className="card p-3">
                <div className="meta">Mean Log Growth</div>
                <div>{analytics.aggregated_metrics.mean_log_growth ?? '—'}</div>
              </div>
              <div className="card p-3">
                <div className="meta">Mean Max Drawdown</div>
                <div>{analytics.aggregated_metrics.mean_max_drawdown ?? '—'}</div>
              </div>
              <div className="card p-3">
                <div className="meta">Best Run Expectancy</div>
                <div>{analytics.aggregated_metrics.best_run_expectancy ?? '—'}</div>
              </div>
              <div className="card p-3">
                <div className="meta">Worst Run Expectancy</div>
                <div>{analytics.aggregated_metrics.worst_run_expectancy ?? '—'}</div>
              </div>
              <div className="card p-3">
                <div className="meta">Run Count</div>
                <div>{analytics.run_count}</div>
              </div>
              <div className="card p-3">
                <div className="meta">Last Updated</div>
                <div className="meta">{analytics.updated_at ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {variant.description && (
        <div className="card p-4 mb-4">
          <div className="card-title mb-2">Description</div>
          <div className="meta whitespace-pre-wrap">{variant.description}</div>
        </div>
      )}

      <div className="card p-0">
        <div className="card-header px-4 py-3 flex items-center justify-between">
          <div className="card-title">Runs for this variant</div>
          <div>
            {!inspectionMode && (
              <button className="btn" onClick={() => setOpenRun(true)}>+ New Run</button>
            )}
          </div>
        </div>
        <div className="p-0">
          <DataTable
            columns={[
              { key: 'display_name', label: 'Run', render: (r: any) => r.display_name || r.id },
              { key: 'id', label: 'ID', muted: true },
              { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
              { key: 'run_type', label: 'Type' },
              { key: 'initial_capital', label: 'Initial', align: 'right', render: (r: any) => formatCurrency(r.initial_capital) },
            ]}
            rows={runs}
            rowKey={(r: any) => r.id}
            onRowClick={(r: any) => navigate(`/runs/${r.id}`)}
            emptyMessage="No runs found for this variant"
          />
        </div>
      </div>

      {!inspectionMode && openRun && variantId && (
        <CreateRunModal
          open={openRun}
          variantId={variantId}
          onClose={() => setOpenRun(false)}
          onCreated={async () => {
            try {
              const refreshed = await listRunsForVariant(variantId);
              setRuns(refreshed);
            } catch {}
          }}
        />
      )}
    </div>
  );
}
