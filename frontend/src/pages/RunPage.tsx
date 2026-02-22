import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useRun from '../hooks/useRun';
import TradesTable from '../components/TradesTable';
import StatusBadge from '../components/StatusBadge';
import MetricCard from '../components/MetricCard';
import { formatCurrency, formatPercent, formatSharpe, formatFloat, formatDate } from '../utils/format';
import type { AnalyticsSnapshot } from '../types';
import AddTradeModal from '../components/modals/AddTradeModal';
import FinishRunModal from '../components/modals/FinishRunModal';
import CollapsibleSection from '../components/CollapsibleSection';
import EquityDrawdownPanel from '../components/analytics/EquityDrawdownPanel';
import DistributionPanel from '../components/analytics/DistributionPanel';
import MonteCarloPanel from '../components/analytics/MonteCarloPanel';
import RiskOfRuinPanel from '../components/analytics/RiskOfRuinPanel';
import KellySimulationPanel from '../components/analytics/KellySimulationPanel';
import WalkForwardPanel from '../components/analytics/WalkForwardPanel';
import RegimeAnalysisPanel from '../components/analytics/RegimeAnalysisPanel';
import { computeAnalytics, getAnalyticsSnapshot } from '../api/runs';

export default function RunPage() {
  const { runId } = useParams();
  const { run, trades, equity, metrics, setTrades, setRun } = useRun(runId!);
  const [tab, setTab] = useState<'overview' | 'analytics' | 'trades'>('trades');
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analyticsMissing, setAnalyticsMissing] = useState(false);
  const [computing, setComputing] = useState(false);

  const loadAnalytics = async () => {
    if (!run?.id) return;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    setAnalyticsMissing(false);
    try {
      const snap = await getAnalyticsSnapshot(run.id);
      setAnalytics(snap || null);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404) {
        setAnalytics(null);
        setAnalyticsMissing(true);
      } else {
        setAnalyticsError(e?.message || 'Failed to load analytics');
      }
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const pollAnalyticsReady = async (maxTries = 20, intervalMs = 1500) => {
    if (!run?.id) return;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    setAnalyticsMissing(false);
    for (let i = 0; i < maxTries; i++) {
      try {
        const snap = await getAnalyticsSnapshot(run.id);
        setAnalytics(snap || null);
        setAnalyticsLoading(false);
        setAnalyticsMissing(false);
        return;
      } catch (e: any) {
        const status = e?.response?.status;
        if (status !== 404) {
          setAnalyticsError(e?.message || 'Failed to load analytics');
          setAnalyticsLoading(false);
          return;
        }
        await new Promise((r) => setTimeout(r, intervalMs));
      }
    }
    setAnalyticsMissing(true);
    setAnalyticsLoading(false);
  };

  useEffect(() => {
    if (tab === 'analytics') {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, run?.id]);
  useEffect(() => {
    if (run?.id) {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.id]);

  if (!run) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">Run {run.display_name ?? run.id}</div>
          <div className="meta">Variant {run.variant_id} • <StatusBadge status={run.status} /></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="btn-group">
            <button className={`btn ${tab === 'overview' ? 'btn-active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
            <button className={`btn ${tab === 'analytics' ? 'btn-active' : ''}`} onClick={() => setTab('analytics')}>Analytics</button>
            <button className={`btn ${tab === 'trades' ? 'btn-active' : ''}`} onClick={() => setTab('trades')}>Trades</button>
          </div>
          <button
            className="btn"
            aria-label="Run settings"
            title="Run settings"
            onClick={() => setSettingsOpen(true)}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {run.description && (
        <div className="card p-4">
          <div className="section-title mb-2">Description</div>
          <div className="meta whitespace-pre-wrap">{run.description}</div>
        </div>
      )}

      {tab === 'overview' && (
        <section>
          <div className="grid grid-cols-2 gap-6">
            <div className="card p-4">
              <div className="section-title mb-2">Details</div>
              <div className="body-text space-y-1">
                <div>Type: {run.run_type}</div>
                <div>Initial Capital: {formatCurrency(run.initial_capital)}</div>
                <div>Trade Limit: {run.trade_limit ?? '—'}</div>
                <div>Created: {formatDate(run.created_at)}</div>
              </div>
            </div>
            <div className="card p-4">
              <div className="section-title mb-2">Metrics</div>
              {(() => {
                const overviewMetrics = metrics ?? (analytics?.metrics_json ?? null);
                return !overviewMetrics ? (
                <div className="meta">No metrics snapshot yet.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {overviewMetrics.total_trades != null && <MetricCard label="Total Trades" value={overviewMetrics.total_trades} />}
                  {overviewMetrics.wins != null && <MetricCard label="Wins" value={overviewMetrics.wins} />}
                  {overviewMetrics.losses != null && <MetricCard label="Losses" value={overviewMetrics.losses} />}
                  {overviewMetrics.win_rate != null && <MetricCard label="Win Rate" value={formatPercent(overviewMetrics.win_rate, 2)} />}
                  {overviewMetrics.total_R != null && <MetricCard label="Total R" value={formatFloat(overviewMetrics.total_R, 4)} />}
                  {overviewMetrics.avg_R != null && <MetricCard label="Avg R" value={formatFloat(overviewMetrics.avg_R, 4)} />}
                  {overviewMetrics.avg_win_R != null && <MetricCard label="Avg Win R" value={formatFloat(overviewMetrics.avg_win_R, 4)} />}
                  {overviewMetrics.avg_loss_R != null && <MetricCard label="Avg Loss R" value={formatFloat(overviewMetrics.avg_loss_R, 4)} />}
                  {overviewMetrics.expectancy_R != null && <MetricCard label="Expectancy (R)" value={formatFloat(overviewMetrics.expectancy_R, 4)} />}
                  {overviewMetrics.volatility_R != null && <MetricCard label="Volatility (R)" value={formatFloat(overviewMetrics.volatility_R, 4)} />}
                  {overviewMetrics.kelly_f != null && <MetricCard label="Kelly Fraction" value={formatPercent(overviewMetrics.kelly_f, 2)} />}
                  {overviewMetrics.log_growth != null && <MetricCard label="Log Growth" value={formatFloat(overviewMetrics.log_growth, 6)} />}
                  {overviewMetrics.max_drawdown_R != null && <MetricCard label="Max Drawdown (R)" value={formatFloat(overviewMetrics.max_drawdown_R, 4)} />}
                  {/* Legacy fields fallback if present */}
                  {overviewMetrics.expectancy != null && <MetricCard label="Expectancy" value={formatFloat(overviewMetrics.expectancy, 6)} />}
                  {overviewMetrics.sharpe != null && <MetricCard label="Sharpe" value={formatSharpe(overviewMetrics.sharpe)} />}
                  {overviewMetrics.volatility != null && <MetricCard label="Volatility" value={formatPercent(overviewMetrics.volatility, 2)} />}
                  {overviewMetrics.volatility_drag != null && <MetricCard label="Volatility Drag" value={formatPercent(overviewMetrics.volatility_drag, 2)} />}
                  {overviewMetrics.max_drawdown != null && <MetricCard label="Max Drawdown" value={formatPercent(overviewMetrics.max_drawdown, 2)} />}
                  {overviewMetrics.total_return != null && <MetricCard label="Total Return" value={formatPercent(overviewMetrics.total_return, 2)} />}
                </div>
              );
              })()}
            </div>
          </div>
        </section>
      )}

      {tab === 'trades' && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="section-title">Trades</div>
            <div className="flex items-center gap-2">
              <button className="btn-primary" onClick={() => setAddOpen(true)}>+ Add Trade</button>
              <button
                className="btn"
                aria-label="Run settings"
                title="Run settings"
                onClick={() => setSettingsOpen(true)}
              >
                ⚙️ Settings
              </button>
            </div>
          </div>
          <TradesTable trades={trades as any} onChange={(updated) => setTrades(updated as any)} />
        </section>
      )}

      {tab === 'analytics' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="section-title">Analytics</div>
            <div className="flex items-center gap-2">
              {analytics?.is_dirty && <span className="badge-warning">Outdated</span>}
              <button
                className="btn-primary"
                disabled={computing || analyticsLoading}
                onClick={async () => {
                  setComputing(true);
                  try {
                    await computeAnalytics(run!.id);
                    await pollAnalyticsReady();
                  } catch (e: any) {
                    setAnalyticsError(e?.message || 'Failed to compute analytics');
                  } finally {
                    setComputing(false);
                  }
                }}
              >
                {computing ? 'Computing…' : 'Recompute Analytics'}
              </button>
            </div>
          </div>
          {analyticsLoading && <div className="meta">Loading analytics…</div>}
          {analyticsError && <div className="meta text-danger">{analyticsError}</div>}
          {analyticsMissing && (
            <div className="card p-3">
              <div className="meta">Analytics not computed yet</div>
            </div>
          )}
          {!analyticsMissing && !analyticsLoading && (
            <>
              {trades.length === 0 && (
                <div className="card p-3">
                  <div className="meta">No trades yet. Add trades to unlock analytics panels.</div>
                </div>
              )}
            </>
          )}
          <CollapsibleSection title="Equity & Drawdown" defaultOpen>
            <EquityDrawdownPanel
              equityJson={analytics?.equity_json}
              metricsJson={analytics?.metrics_json ?? null}
            />
          </CollapsibleSection>
          <CollapsibleSection title="Distribution" defaultOpen>
            <DistributionPanel metricsJson={analytics?.metrics_json ?? null} trades={trades as any} />
          </CollapsibleSection>
          <CollapsibleSection title="Monte Carlo" defaultOpen>
            <MonteCarloPanel summary={analytics?.monte_carlo_json ?? null} />
          </CollapsibleSection>
          <CollapsibleSection title="Risk of Ruin" defaultOpen>
            <RiskOfRuinPanel summary={analytics?.risk_of_ruin_json ?? null} kellyResults={analytics?.kelly_json ?? null} />
          </CollapsibleSection>
          <CollapsibleSection title="Kelly Simulation" defaultOpen>
            <KellySimulationPanel result={analytics?.kelly_json ?? null} />
          </CollapsibleSection>
          <CollapsibleSection title="Walk Forward Analysis" defaultOpen>
            <WalkForwardPanel windows={analytics?.walk_forward_json ?? []} />
          </CollapsibleSection>
          <CollapsibleSection title="Regime Analysis" defaultOpen>
            <RegimeAnalysisPanel result={analytics?.regime_json ?? null} />
          </CollapsibleSection>
        </section>
      )}

      {addOpen && (
        <AddTradeModal
          runId={run.id}
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onAdd={(t) => {
            setTrades([...trades, t]);
          }}
        />
      )}

      {settingsOpen && (
        <FinishRunModal
          runId={run.id}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onFinished={(status) => {
            setRun({ ...run, status } as any);
          }}
        />
      )}
    </div>
  );
}

// Remove inline EquityChart not used anymore
