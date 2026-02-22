import { useMemo } from 'react';
import { MonteCarloSummary } from '../../types';
import { formatPercent } from '../../utils/format';

interface Props { summary: MonteCarloSummary | null; }

export default function MonteCarloPanel({ summary }: Props) {
  const width = 700, height = 120, pad = 12;
  const minX = summary ? Math.min(summary.p5_final_return, summary.p95_final_return) : -0.5;
  const maxX = summary ? Math.max(summary.p5_final_return, summary.p95_final_return) : 0.5;
  const scaleX = (v: number) => pad + ((v - minX) / Math.max(1e-9, maxX - minX)) * (width - pad * 2);

  return (
    <div className="space-y-3">
      {/* Summary visualization with axis labels and legend */}
      {summary ? (
        <svg width={width} height={height} className="bg-neutral-900 border border-neutral-800">
          {/* Axis */}
          <line x1={pad} x2={width-pad} y1={height/2} y2={height/2} stroke="#374151" strokeWidth={0.8} />
          {/* Markers */}
          <line x1={scaleX(summary.p5_final_return)} x2={scaleX(summary.p5_final_return)} y1={height/2-18} y2={height/2+18} stroke="#ef4444" strokeWidth={1.5} />
          <line x1={scaleX(summary.median_final_return)} x2={scaleX(summary.median_final_return)} y1={height/2-18} y2={height/2+18} stroke="#f472b6" strokeWidth={1.5} />
          <line x1={scaleX(summary.mean_final_return)} x2={scaleX(summary.mean_final_return)} y1={height/2-18} y2={height/2+18} stroke="#facc15" strokeWidth={1.5} />
          <line x1={scaleX(summary.p95_final_return)} x2={scaleX(summary.p95_final_return)} y1={height/2-18} y2={height/2+18} stroke="#22c55e" strokeWidth={1.5} />
          {/* Labels near markers */}
          <text x={scaleX(summary.p5_final_return)} y={height/2-22} textAnchor="middle" className="meta" fill="#fff">5% {formatPercent(summary.p5_final_return, 1)}</text>
          <text x={scaleX(summary.median_final_return)} y={height/2-22} textAnchor="middle" className="meta" fill="#fff">Median {formatPercent(summary.median_final_return, 1)}</text>
          <text x={scaleX(summary.mean_final_return)} y={height/2+34} textAnchor="middle" className="meta" fill="#fff">Mean {formatPercent(summary.mean_final_return, 1)}</text>
          <text x={scaleX(summary.p95_final_return)} y={height/2-22} textAnchor="middle" className="meta" fill="#fff">95% {formatPercent(summary.p95_final_return, 1)}</text>
          {/* Legend */}
          <g>
            <rect x={pad} y={pad} width={260} height={24} fill="rgba(0,0,0,0.2)" />
            <line x1={pad+8} x2={pad+24} y1={pad+12} y2={pad+12} stroke="#facc15" strokeWidth={1.2} />
            <text x={pad+28} y={pad+16} className="meta" fill="#fff">Mean</text>
            <line x1={pad+88} x2={pad+104} y1={pad+12} y2={pad+12} stroke="#f472b6" strokeWidth={1.2} />
            <text x={pad+108} y={pad+16} className="meta" fill="#fff">Median</text>
            <line x1={pad+168} x2={pad+184} y1={pad+12} y2={pad+12} stroke="#ef4444" strokeWidth={1.2} />
            <text x={pad+188} y={pad+16} className="meta" fill="#fff">5% / 95%</text>
          </g>
          {/* Axis labels */}
          <text x={width/2} y={height-2} textAnchor="middle" className="meta" fill="#fff">Final Return (%)</text>
        </svg>
      ) : (
        <div className="card p-3">
          <div className="meta">Simulated equity curves</div>
          <div className="meta">No path data returned by API. Summary stats shown below.</div>
        </div>
      )}
      {summary ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3"><div className="meta">Mean Final Return</div><div>{formatPercent(summary.mean_final_return, 2)}</div></div>
          <div className="card p-3"><div className="meta">Median Final Return</div><div>{formatPercent(summary.median_final_return, 2)}</div></div>
          <div className="card p-3"><div className="meta">5% / 95% Final Return</div><div>{formatPercent(summary.p5_final_return, 2)} / {formatPercent(summary.p95_final_return, 2)}</div></div>
          <div className="card p-3"><div className="meta">Worst Case Drawdown</div><div>{formatPercent(summary.worst_case_dd, 2)}</div></div>
        </div>
      ) : (
        <div className="meta">No summary available.</div>
      )}
    </div>
  );
}
