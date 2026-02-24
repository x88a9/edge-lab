import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import { getSystem, listVariantsForSystem, getSystemAnalytics, computeSystemAnalytics } from '../api/systems';
import CreateVariantModal from '../components/modals/CreateVariantModal';
import Button from '../components/Button';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAdminInspection } from '../context/AdminInspectionContext';
import { usePortfolio } from '../context/PortfolioContext';
import { moveSystemToPortfolio } from '../api/portfolio';

export default function SystemPage() {
  const { systemId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [system, setSystem] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [openVariant, setOpenVariant] = useState(false);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [analyticsMissing, setAnalyticsMissing] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);
  const { inspectionMode } = useAdminInspection();
  const { portfolioList } = usePortfolio();
  const [moveErr, setMoveErr] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

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
        setAnalyticsError(null);
        setAnalyticsMissing(false);
        try {
          const a = await getSystemAnalytics(systemId);
          if (!cancelled) setAnalytics(a);
        } catch (ae: any) {
          const st = ae?.response?.status;
          if (!cancelled) {
            if (st === 404) {
              setAnalytics(null);
              setAnalyticsMissing(true);
            } else {
              setAnalyticsError(ae?.response?.data?.detail ?? ae.message);
            }
          }
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
      {!inspectionMode && (
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="section-title">Move System</div>
            <div className="flex items-center gap-2">
              <select
                className="input"
                disabled={moving || (portfolioList || []).length <= 1}
                onChange={async (e) => {
                  const targetId = e.target.value;
                  if (!targetId) return;
                  setMoveErr(null);
                  setMoving(true);
                  try {
                    await moveSystemToPortfolio(targetId, system.id);
                  } catch (err: any) {
                    const status = err?.response?.status;
                    if (status === 409) setMoveErr('Operation conflict');
                    else setMoveErr(err?.response?.data?.detail ?? err.message);
                  } finally {
                    setMoving(false);
                  }
                }}
              >
                <option value="">Select portfolio…</option>
                {(portfolioList || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.is_default ? ' (Default)' : ''}</option>
                ))}
              </select>
            </div>
          </div>
          {moveErr && <div className="meta text-danger mt-2">{moveErr}</div>}
          {(portfolioList || []).length <= 1 && (
            <div className="meta mt-2">Only one portfolio available</div>
          )}
        </div>
      )}

      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="section-title">System Analytics</div>
          <div className="flex items-center gap-2">
            {analytics?.is_dirty && <span className="badge">Recompute required</span>}
            <Button
              variant="primary"
              disabled={inspectionMode || computing}
              onClick={async () => {
                if (!systemId) return;
                setComputing(true);
                setAnalyticsError(null);
                try {
                  await computeSystemAnalytics(systemId);
                  try {
                    const snap = await getSystemAnalytics(systemId);
                    setAnalytics(snap);
                    setAnalyticsMissing(false);
                  } catch (ae: any) {
                    const st = ae?.response?.status;
                    if (st === 404) {
                      setAnalytics(null);
                      setAnalyticsMissing(true);
                    } else {
                      setAnalyticsError(ae?.response?.data?.detail ?? ae.message);
                    }
                  }
                } finally {
                  setComputing(false);
                }
              }}
            >
              {computing ? 'Computing…' : 'Recompute System'}
            </Button>
          </div>
        </div>
        {analyticsError && <div className="meta text-danger">{analyticsError}</div>}
        {analyticsMissing && (
          <div className="card p-3">
            <div className="meta">Analytics not computed yet</div>
          </div>
        )}
        {!analyticsMissing && analytics && (
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
        )}
      </div>

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
