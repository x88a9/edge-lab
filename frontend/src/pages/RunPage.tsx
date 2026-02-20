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

export default function RunPage() {
  const { runId = '' } = useParams();
  const { run, setRun, trades, setTrades, metrics, equity, variant, system, loading, error } = useRun(runId);
  const [tab, setTab] = useState<'overview' | 'trades' | 'analytics'>('overview');
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (loading) return <div className="card p-4"><div className="meta">Loading run…</div></div>;
  if (error || !run) return <div className="card p-4"><div className="meta">{error ?? 'Run not found'}</div></div>;

  const runTitle = run.display_name || `Run ${run.id}`;
  const variantLabel = variant?.display_name || variant?.name || run.variant_id;
  const systemLabel = system?.display_name || system?.name || 'Unknown system';

  return (
    <div>
      <div className="page-title mb-1">{runTitle}</div>
      <div className="subline mb-4">Variant {variantLabel} • System {systemLabel} • <StatusBadge status={run.status} /></div>

      <div className="flex border-b border-neutral-800 mb-4">
        {(['overview','trades','analytics'] as const).map((t) => (
          <button
            key={t}
            className={`px-3 py-2 text-sm border-b-2 ${tab === t ? 'border-accent text-text' : 'border-transparent text-text-muted'} hover:text-text`}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

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
                  <MetricCard label="Expectancy" value={formatFloat(metrics.expectancy, 6)} />
                  <MetricCard label="Win Rate" value={formatPercent(metrics.win_rate, 2)} />
                  <MetricCard label="Sharpe" value={formatSharpe(metrics.sharpe)} />
                  <MetricCard label="Volatility" value={formatPercent(metrics.volatility, 2)} />
                  <MetricCard label="Max Drawdown" value={formatPercent(metrics.max_drawdown, 2)} />
                  <MetricCard label="Total Return" value={formatPercent(metrics.total_return, 2)} />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {tab === 'trades' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="btn" onClick={() => setAddOpen(true)}>+ Add Trade</button>
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
          <TradesTable trades={trades} onChange={setTrades} />
        </section>
      )}

      {tab === 'analytics' && (
        <section className="grid grid-cols-2 gap-6">
          <div className="card p-4">
            <div className="section-title mb-2">Equity Curve</div>
            {!equity?.length ? (
              <div className="meta">No equity data available.</div>
            ) : (
              <EquityChart points={equity} />
            )}
          </div>
          <div className="card p-4">
            <div className="section-title mb-2">Notes</div>
            <div className="meta">Walk-forward, regime detection, and monte-carlo can be exposed as advanced panels.</div>
          </div>
        </section>
      )}

      <AddTradeModal
        runId={run.id}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(newTrade) => setTrades([newTrade, ...trades])}
      />

      <FinishRunModal
        runId={run.id}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onFinished={(status) => setRun(run ? { ...run, status } : run)}
      />
    </div>
  );
}

function EquityChart({ points }: { points: EquityPoint[] }) {
  const width = 600;
  const height = 200;
  const padding = 10;
  const xs = points.map((_, i) => i);
  const ys = points.map((p) => p.equity);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scaleX = (i: number) => padding + (i / Math.max(1, xs.length - 1)) * (width - padding * 2);
  const scaleY = (y: number) => height - padding - ((y - minY) / Math.max(1, maxY - minY)) * (height - padding * 2);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(p.equity)}`).join(' ');

  return (
    <svg width={width} height={height} className="bg-neutral-900 border border-neutral-800">
      <path d={d} fill="none" stroke="#38bdf8" strokeWidth={1.5} />
    </svg>
  );
}