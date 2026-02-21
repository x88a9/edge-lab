import { useParams } from 'react-router-dom';
import { useState } from 'react';
import useRun from '../hooks/useRun';
import TradesTable from '../components/TradesTable';
import StatusBadge from '../components/StatusBadge';
import MetricCard from '../components/MetricCard';
import { formatCurrency, formatPercent, formatSharpe, formatFloat, formatDate } from '../utils/format';
import type { EquityPoint } from '../types';
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

export default function RunPage() {
  const { runId } = useParams();
  const { run, trades, equity, metrics, setTrades, setRun } = useRun(runId!);
  const [tab, setTab] = useState<'overview' | 'analytics' | 'trades'>('trades');
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
              {!metrics ? (
                <div className="meta">No metrics snapshot yet.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {metrics.total_trades != null && <MetricCard label="Total Trades" value={metrics.total_trades} />}
                  {metrics.wins != null && <MetricCard label="Wins" value={metrics.wins} />}
                  {metrics.losses != null && <MetricCard label="Losses" value={metrics.losses} />}
                  {metrics.win_rate != null && <MetricCard label="Win Rate" value={formatPercent(metrics.win_rate, 2)} />}
                  {metrics.total_R != null && <MetricCard label="Total R" value={formatFloat(metrics.total_R, 4)} />}
                  {metrics.avg_R != null && <MetricCard label="Avg R" value={formatFloat(metrics.avg_R, 4)} />}
                  {metrics.avg_win_R != null && <MetricCard label="Avg Win R" value={formatFloat(metrics.avg_win_R, 4)} />}
                  {metrics.avg_loss_R != null && <MetricCard label="Avg Loss R" value={formatFloat(metrics.avg_loss_R, 4)} />}
                  {metrics.expectancy_R != null && <MetricCard label="Expectancy (R)" value={formatFloat(metrics.expectancy_R, 4)} />}
                  {metrics.volatility_R != null && <MetricCard label="Volatility (R)" value={formatFloat(metrics.volatility_R, 4)} />}
                  {metrics.kelly_f != null && <MetricCard label="Kelly Fraction" value={formatPercent(metrics.kelly_f, 2)} />}
                  {metrics.log_growth != null && <MetricCard label="Log Growth" value={formatFloat(metrics.log_growth, 6)} />}
                  {metrics.max_drawdown_R != null && <MetricCard label="Max Drawdown (R)" value={formatFloat(metrics.max_drawdown_R, 4)} />}
                  {/* Legacy fields fallback if present */}
                  {metrics.expectancy != null && <MetricCard label="Expectancy" value={formatFloat(metrics.expectancy, 6)} />}
                  {metrics.sharpe != null && <MetricCard label="Sharpe" value={formatSharpe(metrics.sharpe)} />}
                  {metrics.volatility != null && <MetricCard label="Volatility" value={formatPercent(metrics.volatility, 2)} />}
                  {metrics.volatility_drag != null && <MetricCard label="Volatility Drag" value={formatPercent(metrics.volatility_drag, 2)} />}
                  {metrics.max_drawdown != null && <MetricCard label="Max Drawdown" value={formatPercent(metrics.max_drawdown, 2)} />}
                  {metrics.total_return != null && <MetricCard label="Total Return" value={formatPercent(metrics.total_return, 2)} />}
                </div>
              )}
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
          <TradesTable trades={trades} onChange={setTrades} />
        </section>
      )}

      {tab === 'analytics' && (
        <section className="space-y-4">
          {trades.length === 0 && (
            <div className="card p-3">
              <div className="meta">No trades yet. Add trades to unlock analytics panels.</div>
            </div>
          )}
          <CollapsibleSection title="Equity & Drawdown" defaultOpen>
            <EquityDrawdownPanel runId={run.id} />
          </CollapsibleSection>
          <CollapsibleSection title="Distribution" defaultOpen>
            <DistributionPanel runId={run.id} />
          </CollapsibleSection>
          <CollapsibleSection title="Monte Carlo" defaultOpen>
            <MonteCarloPanel runId={run.id} />
          </CollapsibleSection>
          <CollapsibleSection title="Risk of Ruin" defaultOpen>
            <RiskOfRuinPanel runId={run.id} />
          </CollapsibleSection>
          <CollapsibleSection title="Kelly Simulation" defaultOpen>
            <KellySimulationPanel runId={run.id} />
          </CollapsibleSection>
          <CollapsibleSection title="Walk Forward Analysis" defaultOpen>
            <WalkForwardPanel runId={run.id} />
          </CollapsibleSection>
          <CollapsibleSection title="Regime Analysis" defaultOpen>
            <RegimeAnalysisPanel runId={run.id} />
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