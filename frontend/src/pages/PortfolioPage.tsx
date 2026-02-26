import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { computePortfolio } from '../api/portfolio';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import { useAdminInspection } from '../context/AdminInspectionContext';

export default function PortfolioPage() {
  const navigate = useNavigate();
  const { portfolioId } = useParams();
  interface GovernancePortfolio { id: string; name: string; is_default: boolean; is_dirty: boolean; updated_at?: string }
  interface PortfolioCombinedMetrics { combined_expectancy: number | null; combined_mean_log_growth: number | null }
  interface PortfolioCombinedEquity { equity: number[] }
  interface PortfolioAnalytics { combined_metrics: PortfolioCombinedMetrics | null; combined_equity: PortfolioCombinedEquity | null; strategy_count: number; is_dirty: boolean; updated_at?: string }
  const [gov, setGov] = useState<GovernancePortfolio | null>(null);
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [analyticsMissing, setAnalyticsMissing] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);
  const { inspectionMode } = useAdminInspection();
  const [systems, setSystems] = useState<any[]>([]);
  const [variantsBySystem, setVariantsBySystem] = useState<Record<string, any[]>>({});
  const [runsByVariant, setRunsByVariant] = useState<Record<string, any[]>>({});
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      setError(null);
      setAnalyticsError(null);
      setAnalyticsMissing(false);
      try {
        if (!portfolioId) {
          navigate('/portfolio', { replace: true });
          return;
        }
        const gresp = await apiClient.get(`/portfolio/${portfolioId}`);
        const g: GovernancePortfolio = {
          id: gresp.data?.id,
          name: gresp.data?.name,
          is_default: !!gresp.data?.is_default,
          is_dirty: !!gresp.data?.is_dirty,
          updated_at: gresp.data?.updated_at,
        };
        if (!cancelled) setGov(g);
        try {
          const aresp = await apiClient.get(`/portfolio/${portfolioId}/analytics`);
          const a: PortfolioAnalytics = {
            combined_metrics: aresp.data?.combined_metrics ?? null,
            combined_equity: aresp.data?.combined_equity ?? null,
            strategy_count: aresp.data?.strategy_count ?? 0,
            is_dirty: !!aresp.data?.is_dirty,
            updated_at: aresp.data?.updated_at,
          };
          if (!cancelled) {
            setAnalytics(a);
            setAnalyticsMissing(false);
          }
        } catch (ae: any) {
          const st = ae?.response?.status;
          if (st === 404) {
            if (!cancelled) {
              setAnalytics(null);
              setAnalyticsMissing(true);
            }
          } else {
            if (!cancelled) setAnalyticsError(ae?.response?.data?.detail ?? ae.message);
          }
        }
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
    async function fetchTree() {
      if (!portfolioId) return;
      setTreeLoading(true);
      setTreeError(null);
      try {
        const sysResp = await apiClient.get('/systems', { params: { portfolio_id: portfolioId } });
        const sysList: any[] = Array.isArray(sysResp.data) ? sysResp.data : [];
        setSystems(sysList);
        const variantEntries = await Promise.all(sysList.map(async (s: any) => {
          try {
            const vResp = await apiClient.get(`/systems/${s.id}/variants`);
            return [s.id, Array.isArray(vResp.data) ? vResp.data : []] as const;
          } catch {
            return [s.id, []] as const;
          }
        }));
        setVariantsBySystem(Object.fromEntries(variantEntries));
        const runMap: Record<string, any[]> = {};
        for (const [, vs] of variantEntries) {
          for (const v of vs) {
            try {
              const rResp = await apiClient.get(`/variants/${v.id}/runs`);
              runMap[v.id] = Array.isArray(rResp.data) ? rResp.data : [];
            } catch {
              runMap[v.id] = [];
            }
          }
        }
        setRunsByVariant(runMap);
      } catch (e: any) {
        setTreeError(e?.response?.data?.detail ?? e.message);
      } finally {
        setTreeLoading(false);
      }
    }
    fetchTree();
    return () => { cancelled = true; };
  }, [portfolioId]);

  if (loading) return <div className="card p-4"><div className="meta">Loading portfolio…</div></div>;
  if (error) return <div className="card p-4"><div className="meta text-danger">{error}</div></div>;
  if (!gov) return null;

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Portfolio' }]} />
      <div className="page-title mb-1">Portfolio Dashboard</div>
      <div className="subline">Updated: {gov.updated_at ?? '—'}</div>
      <div className="border-b border-neutral-800 mb-4"></div>

      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="section-title">Portfolio Analytics</div>
          <div className="flex items-center gap-2">
            {gov.is_dirty && <span className="badge">Recompute required</span>}
            <Button
              variant="primary"
              disabled={inspectionMode || computing}
              onClick={async () => {
                if (!portfolioId) return;
                setComputing(true);
                setAnalyticsError(null);
                try {
                  await computePortfolio(portfolioId);
                  let attempts = 0;
                  let got = false;
                  while (attempts < 20) {
                    try {
                      const aresp = await apiClient.get(`/portfolio/${portfolioId}/analytics`);
                      const a: PortfolioAnalytics = {
                        combined_metrics: aresp.data?.combined_metrics ?? null,
                        combined_equity: aresp.data?.combined_equity ?? null,
                        strategy_count: aresp.data?.strategy_count ?? 0,
                        is_dirty: !!aresp.data?.is_dirty,
                        updated_at: aresp.data?.updated_at,
                      };
                      setAnalytics(a);
                      setAnalyticsMissing(false);
                      got = true;
                      break;
                    } catch (ae: any) {
                      const st = ae?.response?.status;
                      if (st !== 404) {
                        setAnalyticsError(ae?.response?.data?.detail ?? ae.message);
                        break;
                      }
                      await new Promise((res) => setTimeout(res, 800));
                      attempts += 1;
                    }
                  }
                  try {
                    const gresp = await apiClient.get(`/portfolio/${portfolioId}`);
                    const g: GovernancePortfolio = {
                      id: gresp.data?.id,
                      name: gresp.data?.name,
                      is_default: !!gresp.data?.is_default,
                      is_dirty: !!gresp.data?.is_dirty,
                      updated_at: gresp.data?.updated_at,
                    };
                    setGov(g);
                  } catch {}
                  if (!got) {
                    setAnalytics(null);
                    setAnalyticsMissing(true);
                  }
                } catch (err: any) {
                  const status = err?.response?.status;
                  if (status === 400) {
                    setAnalyticsError('No strategy analytics available. Compute system analytics first.');
                  } else {
                    setAnalyticsError(err?.response?.data?.detail ?? err.message);
                  }
                  setAnalyticsMissing(true);
                } finally {
                  setComputing(false);
                }
              }}
            >
              {computing ? 'Computing…' : 'Recompute Portfolio'}
            </Button>
          </div>
        </div>
        {analyticsError && <div className="meta text-danger">{analyticsError}</div>}
        {analyticsMissing && (
          <div className="card p-3">
            <div className="meta">Not computed</div>
          </div>
        )}
        {!analyticsMissing && analytics && (
          <div className={gov.is_dirty ? 'opacity-60' : ''}>
            {(() => {
              const cm = analytics?.combined_metrics ?? null;
              return (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="card p-3">
                <div className="meta">Combined Expectancy</div>
                <div>{cm?.combined_expectancy ?? '—'}</div>
              </div>
              <div className="card p-3">
                <div className="meta">Combined Log Growth</div>
                <div>{cm?.combined_mean_log_growth ?? '—'}</div>
              </div>
              <div className="card p-3">
                <div className="meta">Strategy Count</div>
                <div>{analytics.strategy_count}</div>
              </div>
            </div>
              );
            })()}
            <div>
              <div className="section-title mb-2">Combined Equity</div>
              <svg width={800} height={200} className="bg-neutral-900 border border-neutral-800 rounded-lg">
                {Array.isArray(analytics.combined_equity?.equity) && (analytics.combined_equity!.equity as number[]).map((e, i, arr) => {
                  const x = (i / Math.max(arr.length - 1, 1)) * 780 + 10;
                  const y = 180 - ((e - Math.min(...arr)) / Math.max(1e-9, Math.max(...arr) - Math.min(...arr))) * 160;
                  const prevX = ((i - 1) / Math.max(arr.length - 1, 1)) * 780 + 10;
                  const prevY = 180 - (((arr[i - 1] ?? e) - Math.min(...arr)) / Math.max(1e-9, Math.max(...arr) - Math.min(...arr))) * 160;
                  if (i === 0) return null;
                  return <line key={i} x1={prevX} y1={prevY} x2={x} y2={y} stroke="#9bb4e2" strokeWidth={1} />;
                })}
              </svg>
            </div>
          </div>
        )}
      </div>
      <div className="card p-4">
        <div className="section-title mb-2">Portfolio Contents</div>
        {treeLoading && <div className="meta">Loading contents…</div>}
        {treeError && <div className="meta text-danger">{treeError}</div>}
        {!treeLoading && !treeError && systems.length === 0 && (
          <div className="meta">No systems assigned to this portfolio</div>
        )}
        <div className="grid grid-cols-2 gap-4">
          {systems.map((s: any) => (
            <div key={s.id} className="border border-neutral-800 rounded-lg p-3">
              <div
                className="flex items-center justify-between cursor-pointer hover:bg-neutral-900 rounded px-2 py-1"
                onClick={() => navigate(`/systems/${s.id}`)}
              >
                <div className="font-semibold">{s.display_name || s.name}</div>
                <div className="meta">#{String(s.id).slice(0,5)}</div>
              </div>
              <div className="mt-2 pl-3 border-l border-neutral-700 space-y-2">
                {(variantsBySystem[s.id] || []).map((v: any) => (
                  <div key={v.id}>
                    <div
                      className="flex items-center justify-between cursor-pointer hover:bg-neutral-900 rounded px-2 py-1"
                      onClick={() => navigate(`/variants/${v.id}`)}
                    >
                      <div>{v.display_name || v.name}</div>
                      <div className="meta">#{String(v.id).slice(0,5)}</div>
                    </div>
                    <div className="mt-1 pl-3 border-l border-neutral-700 space-y-1">
                      {(runsByVariant[v.id] || []).map((r: any) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between cursor-pointer hover:bg-neutral-900 rounded px-2 py-1"
                          onClick={() => navigate(`/runs/${r.id}`)}
                        >
                          <div>{r.display_name || r.id}</div>
                          <div className="meta">#{String(r.id).slice(0,5)}</div>
                        </div>
                      ))}
                      {(runsByVariant[v.id] || []).length === 0 && (
                        <div className="meta">No runs</div>
                      )}
                    </div>
                  </div>
                ))}
                {(variantsBySystem[s.id] || []).length === 0 && (
                  <div className="meta">No variants</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
