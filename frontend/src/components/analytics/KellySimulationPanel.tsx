import { useMemo } from 'react';
import { KellySimulationResult } from '../../types';
import { formatFloat, formatPercent } from '../../utils/format';

interface Props { result: KellySimulationResult | null; }

export default function KellySimulationPanel({ result }: Props) {
  const baseFraction = result?.growth_optimal?.fraction ?? 0.02;
  const points = result?.all_results ?? [];
  const width = 700, height = 200, pad = 12;
  const minX = points.length ? Math.min(...points.map(p => p.fraction)) : 0;
  const maxX = points.length ? Math.max(...points.map(p => p.fraction)) : 0.2;
  const minY = points.length ? Math.min(...points.map(p => p.mean_log_growth ?? 0)) : -0.05;
  const maxY = points.length ? Math.max(...points.map(p => p.mean_log_growth ?? 0)) : 0.05;
  const scaleX = (v: number) => pad + ((v - minX) / Math.max(1e-9, maxX - minX)) * (width - pad * 2);
  const scaleY = (v: number) => height - pad - ((v - minY) / Math.max(1e-9, maxY - minY)) * (height - pad * 2);
  const hasPositiveEdge = points.some(p => (p.mean_log_growth ?? 0) > 0);
  const optimal = result?.growth_optimal ?? null;
  const safe = result?.safe_fraction ?? null;
  const showOptimal = !!(optimal && (optimal.mean_log_growth ?? 0) > 0);
  const showSafe = !!(safe && (safe.mean_log_growth ?? 0) > 0 && (safe.ruin_probability ?? 1) < 0.05);

  return (
    <div className="space-y-3">
      {points.length ? (
        <svg width={width} height={height} className="bg-neutral-900 border border-neutral-800">
          <line x1={pad} x2={width-pad} y1={scaleY(0)} y2={scaleY(0)} stroke="#374151" strokeWidth={0.8} />
          {points.map((p, i) => (
            <circle key={i} cx={scaleX(p.fraction)} cy={scaleY(p.mean_log_growth ?? 0)} r={3} fill="#38bdf8" />
          ))}
          {showOptimal && optimal && (
            <circle cx={scaleX(optimal.fraction)} cy={scaleY(optimal.mean_log_growth ?? 0)} r={4} fill="#22c55e" />
          )}
          {showSafe && safe && (
            <circle cx={scaleX(safe.fraction)} cy={scaleY(safe.mean_log_growth ?? 0)} r={4} fill="#f59e0b" />
          )}
          <text x={width/2} y={height-2} textAnchor="middle" className="meta" fill="#fff">Position Fraction</text>
          <text x={-height/2} y={12} transform={`rotate(-90)`} textAnchor="middle" className="meta" fill="#fff">Mean Log Growth</text>
        </svg>
      ) : (
        <div className="card p-3"><div className="meta">No Kelly simulation points available.</div></div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3"><div className="meta">Optimale Fraktion</div><div>{hasPositiveEdge && showOptimal ? formatPercent(optimal!.fraction, 2) : '0%'}</div></div>
        <div className="card p-3"><div className="meta">Sichere Fraktion</div><div>{hasPositiveEdge && showSafe ? formatPercent(safe!.fraction, 2) : '0%'}</div></div>
      </div>
    </div>
  );
}
