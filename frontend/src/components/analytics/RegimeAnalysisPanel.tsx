import { useEffect, useMemo, useState } from 'react';
import { RegimeDetectionResult, Trade } from '../../types';
import { getRegimeDetection, listTradesForRun } from '../../api/runs';
import { formatFloat } from '../../utils/format';

interface Props { runId: string; }

export default function RegimeAnalysisPanel({ runId }: Props) {
  const [result, setResult] = useState<RegimeDetectionResult | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getRegimeDetection(runId).catch(() => null),
      listTradesForRun(runId).catch(() => []),
    ])
      .then(([r, t]) => { setResult(r); setTrades(t); })
      .catch((err) => setError(err?.message || 'Failed to load regime analysis'))
      .finally(() => setLoading(false));
  }, [runId]);

  const labels = result?.labels ?? [];
  const timeframe = trades?.map(t => t.timestamp) ?? [];
  const width = 700, height = 160, pad = 12;
  const n = labels.length;
  const scaleX = (i: number) => pad + (i / Math.max(1, n-1)) * (width - pad * 2);

  const expByRegime = useMemo(() => {
    const bucket: Record<string, number[]> = {};
    trades.forEach((t, i) => {
      const regime = String(labels[i] ?? 'unknown');
      (bucket[regime] ||= []).push(t.r_multiple ?? 0);
    });
    const entries = Object.entries(bucket);
    return entries.map(([k, arr]) => ({ regime: k, expectancy: arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0, volatility: arr.length ? Math.sqrt(arr.reduce((a,b)=>a+b*b,0)/arr.length - Math.pow(arr.reduce((a,b)=>a+b,0)/arr.length,2)) : 0 }));
  }, [labels, trades]);

  return (
    <div className="space-y-3">
      {loading && <div className="meta">Loading…</div>}
      {error && <div className="meta text-red-400">{error}</div>}
      {!labels.length ? (
        <div className="meta">No regime data available.</div>
      ) : (
        <svg width={width} height={height} className="bg-neutral-900 border border-neutral-800">
          {labels.map((lab, i) => (
            <circle key={i} cx={scaleX(i)} cy={height/2} r={3} fill={lab === 0 ? '#22c55e' : lab === 1 ? '#f59e0b' : '#ef4444'} />
          ))}
        </svg>
      )}
      <div className="grid grid-cols-3 gap-3">
        {expByRegime.map((r) => (
          <div key={r.regime} className="card p-3">
            <div className="meta">Regime {r.regime}</div>
            <div>Expectancy: {formatFloat(r.expectancy, 4)}</div>
            <div>Volatility: {formatFloat(r.volatility, 4)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}