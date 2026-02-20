import { useEffect, useState } from 'react';
import { RiskOfRuinSummary } from '../../types';
import { getRiskOfRuin } from '../../api/runs';
import { formatPercent } from '../../utils/format';
import MetricCard from '../MetricCard';

interface Props {
  runId: string;
}

export default function RiskOfRuinPanel({ runId }: Props) {
  const [posFraction, setPosFraction] = useState(0.01);
  const [ruinThreshold, setRuinThreshold] = useState(0.3);
  const [summary, setSummary] = useState<RiskOfRuinSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  const runSim = async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await getRiskOfRuin(runId, { position_fraction: clamp01(posFraction), ruin_threshold: clamp01(ruinThreshold) });
      setSummary(s);
    } catch (e: any) {
      setError(e?.message || 'Failed to simulate risk of ruin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runSim(); }, [runId]);

  const width = 700, height = 80, pad = 12;
  const barWidth = (p: number) => pad + clamp01(p) * (width - pad * 2);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-4">
        <div>
          <div className="meta">Position Fraction (0–1)</div>
          <input type="number" step="0.001" min="0" max="1" className="input"
                 value={posFraction}
                 onChange={(e) => {
                   const v = parseFloat(e.target.value); setPosFraction(isNaN(v) ? 0 : v);
                 }}
                 onBlur={() => setPosFraction(clamp01(posFraction))}
          />
          <div className="meta mt-1">Typical range: 0.00–0.50</div>
        </div>
        <div>
          <div className="meta">Ruin Threshold (0–1)</div>
          <input type="number" step="0.01" min="0" max="1" className="input"
                 value={ruinThreshold}
                 onChange={(e) => {
                   const v = parseFloat(e.target.value); setRuinThreshold(isNaN(v) ? 0 : v);
                 }}
                 onBlur={() => setRuinThreshold(clamp01(ruinThreshold))}
          />
          <div className="meta mt-1">Fractional drawdown from initial capital (e.g., 0.3 = 30%)</div>
        </div>
        <button className="btn-primary" onClick={runSim}>Run Simulation</button>
        {loading && <div className="meta">Running…</div>}
        {error && <div className="meta text-red-400">{error}</div>}
      </div>

      {/* Ruin probability bar with axis label and legend */}
      {summary && (
        <svg width={width} height={height} className="bg-neutral-900 border border-neutral-800">
          <rect x={pad} y={height/2-12} width={width-pad*2} height={24} fill="#111827" stroke="#374151" />
          <rect x={pad} y={height/2-12} width={barWidth(summary.ruin_probability)-pad} height={24} fill="rgba(239,68,68,0.5)" />
          <text x={width/2} y={height-2} textAnchor="middle" className="meta">Probability of Ruin (%)</text>
          <g>
            <rect x={pad} y={pad} width={200} height={24} fill="rgba(0,0,0,0.2)" />
            <rect x={pad+8} y={pad+6} width={12} height={8} fill="rgba(239,68,68,0.5)" />
            <text x={pad+28} y={pad+16} className="meta" fill="#fff">p_win</text>
            <text x={pad+24} y={pad+16} className="meta" fill="#fff">Ruin Probability</text>
          </g>
        </svg>
      )}

      {summary ? (
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Probability of Ruin" value={formatPercent(summary.ruin_probability, 2)} subtitle={`At threshold ${formatPercent(ruinThreshold, 0)}`} />
          <MetricCard label="Expected Terminal R" value={formatPercent(summary.mean_final_capital - 1, 2)} subtitle="Mean final return" />
          <MetricCard label="Worst Case Drawdown" value={formatPercent(summary.worst_case_drawdown, 2)} subtitle="Across simulations" />
        </div>
      ) : (
        <div className="meta">No summary available.</div>
      )}
    </div>
  );
}