import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import { getSystem, listVariantsForSystem, getSystemAnalytics, computeSystemAnalytics } from '../api/systems';
import CreateVariantModal from '../components/modals/CreateVariantModal';
import Button from '../components/Button';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAdminInspection } from '../context/AdminInspectionContext';

export default function SystemPage() {
  const { systemId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [system, setSystem] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [openVariant, setOpenVariant] = useState(false);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [computing, setComputing] = useState(false);
  const { inspectionMode } = useAdminInspection();

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      if (!systemId) return;
      setLoading(true);
      setError(null);
      try {
        const s = await getSystem(systemId);
        if (cancelled) return;
        setSystem(s);
        const v = await listVariantsForSystem(systemId);
        if (!cancelled) setVariants(v);
        try {
          const a = await getSystemAnalytics(systemId);
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
  }, [systemId]);

  if (loading) return <div className="card p-4"><div className="meta">Loading strategy…</div></div>;
  if (error) return <div className="card p-4"><div className="meta text-danger">{error}</div></div>;
  if (!system) return <div className="card p-4"><div className="meta">Strategy not found</div></div>;

  const systemTitle = system.display_name || system.name || system.id;

  return (
    <div>
      <Breadcrumbs items={[
        { label: 'Portfolio', to: '/portfolio' },
        { label: 'Strategies', to: '/systems' },
        { label: systemTitle }
      ]} />
      <div className="page-title mb-1">{systemTitle}</div>
      <div className="subline">Asset: {system.asset} • ID: {system.id}</div>
      <div className="border-b border-neutral-800 mb-4"></div>

      {analytics && (
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="section-title">System Analytics</div>
            <div className="flex items-center gap-2">
              {analytics.is_dirty && <span className="badge">System analytics outdated</span>}
              <Button
                variant="primary"
                disabled={inspectionMode || computing}
                onClick={async () => {
                  if (!systemId) return;
                  setComputing(true);
                  try {
                    await computeSystemAnalytics(systemId);
                    setAnalytics({ ...analytics, is_dirty: false });
                    const snap = await getSystemAnalytics(systemId);
                    setAnalytics(snap);
                  } finally {
                    setComputing(false);
                  }
                }}
              >
                {computing ? 'Computing…' : 'Recompute System'}
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
                <div className="meta">Aggregated Log Growth</div>
                <div>{analytics.aggregated_metrics.mean_log_growth ?? '—'}</div>
              </div>
              <div className="card p-3">
                <div className="meta">Variant Count</div>
                <div>{analytics.variant_count}</div>
              </div>
              <div className="card p-3">
                <div className="meta">Last Updated</div>
                <div className="meta">{analytics.updated_at ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {system.description ? (
        <div className="card p-4 mb-4">
          <div className="card-title mb-2">Description</div>
          <div className="meta whitespace-pre-wrap">{system.description}</div>
        </div>
      ) : null}

      <div className="card p-0">
        <div className="card-header px-4 py-3 flex items-center justify-between">
          <div className="card-title">Variants for this system</div>
          <div>
            {!inspectionMode && (
              <Button variant="primary" onClick={() => setOpenVariant(true)}>+ New Variant</Button>
            )}
          </div>
        </div>
        <div className="p-0">
          <DataTable
            columns={[
              { key: 'display_name', label: 'Variant', render: (v: any) => v.display_name || v.name },
              { key: 'id', label: 'ID', muted: true },
              { key: 'version', label: 'Version', render: (v: any) => v.version ?? v.version_number },
            ]}
            rows={variants}
            rowKey={(v: any) => v.id}
            onRowClick={(v: any) => navigate(`/variants/${v.id}`)}
            emptyMessage="No variants found for this strategy"
          />
        </div>
      </div>

      {!inspectionMode && openVariant && (
        <CreateVariantModal
          open={openVariant}
          strategyId={system.id}
          onClose={() => setOpenVariant(false)}
          onCreated={async () => {
            try {
              const refreshed = await listVariantsForSystem(system.id);
              setVariants(refreshed);
            } catch {}
          }}
        />
      )}
    </div>
  );
}
