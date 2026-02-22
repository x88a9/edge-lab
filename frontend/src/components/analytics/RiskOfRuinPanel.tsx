import { useMemo } from 'react';
import { RiskOfRuinSummary, KellySimulationResult } from '../../types';
import { formatPercent } from '../../utils/format';
import MetricCard from '../MetricCard';

interface Props {
  summary: RiskOfRuinSummary | null;
  kellyResults?: KellySimulationResult | null;
}

export default function RiskOfRuinPanel({ summary, kellyResults }: Props) {
  const width = 700, height = 80, pad = 12;
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const barWidth = (p: number) => pad + clamp01(p) * (width - pad * 2);
  const ruinPoints = (kellyResults?.all_results ?? []).filter(r => r.ruin_probability != null);
  const widthLine = 700, heightLine = 160;
  const minF = ruinPoints.length ? Math.min(...ruinPoints.map(r => r.fraction)) : 0;
  const maxF = ruinPoints.length ? Math.max(...ruinPoints.map(r => r.fraction)) : 0.2;
  const minP = ruinPoints.length ? Math.min(...ruinPoints.map(r => r.ruin_probability as number), 0) : 0;
  const maxP = ruinPoints.length ? Math.max(...ruinPoints.map(r => r.ruin_probability as number), 0.01) : 1;
  const sx = (x: number) => pad + ((x - minF) / Math.max(1e-9, maxF - minF)) * (widthLine - pad * 2);
  const sy = (y: number) => heightLine - pad - ((y - minP) / Math.max(1e-9, maxP - minP)) * (heightLine - pad * 2);
  const path = ruinPoints.map((r, i) => `${i === 0 ? 'M' : 'L'} ${sx(r.fraction)} ${sy(r.ruin_probability as number)}`).join(' ');

  return (
    <div className="space-y-3">
      {ruinPoints.length ? (
        <svg width={widthLine} height={heightLine} className="bg-neutral-900 border border-neutral-800">
          <path d={path} fill="none" stroke="#ef4444" strokeWidth={1.5} />
          <text x={widthLine/2} y={heightLine-2} textAnchor="middle" className="meta" fill="#fff">Position Fraction</text>
          <text x={-heightLine/2} y={12} transform={`rotate(-90)`} textAnchor="middle" className="meta" fill="#fff">Ruin Probability</text>
        </svg>
      ) : summary && (
        <svg width={width} height={height} className="bg-neutral-900 border border-neutral-800">
          <rect x={pad} y={height/2-12} width={width-pad*2} height={24} fill="#111827" stroke="#374151" />
          <rect x={pad} y={height/2-12} width={barWidth(summary.ruin_probability)-pad} height={24} fill="rgba(239,68,68,0.5)" />
          <text x={pad} y={height/2 - 16} className="meta" fill="#fff">0%</text>
          <text x={pad + (width - pad * 2) * 0.25} y={height/2 - 16} className="meta" fill="#fff">25%</text>
          <text x={pad + (width - pad * 2) * 0.5} y={height/2 - 16} className="meta" fill="#fff">50%</text>
          <text x={pad + (width - pad * 2) * 0.75} y={height/2 - 16} className="meta" fill="#fff">75%</text>
          <text x={width - pad - 30} y={height/2 - 16} className="meta" fill="#fff">100%</text>
          <text x={width/2} y={height-2} textAnchor="middle" className="meta" fill="#fff">Probability of Ruin (%)</text>
          <g>
            <rect x={pad} y={pad} width={160} height={24} fill="rgba(0,0,0,0.2)" />
            <rect x={pad+8} y={pad+6} width={12} height={8} fill="rgba(239,68,68,0.5)" />
            <text x={pad+28} y={pad+16} className="meta" fill="#fff">Ruin Probability</text>
          </g>
        </svg>
      )}

      {summary ? (
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Probability of Ruin" value={formatPercent(summary.ruin_probability, 2)} subtitle="Snapshot value" />
          <MetricCard label="Expected Terminal R" value={formatPercent(summary.mean_final_capital - 1, 2)} subtitle="Mean final return" />
          <MetricCard label="Worst Case Drawdown" value={formatPercent(summary.worst_case_drawdown, 2)} subtitle="Across simulations" />
        </div>
      ) : (
        <div className="meta">No summary available.</div>
      )}
    </div>
  );
}
