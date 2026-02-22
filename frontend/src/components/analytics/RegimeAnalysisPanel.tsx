import { useMemo } from 'react';
import { RegimeDetectionResult } from '../../types';

interface Props { result: RegimeDetectionResult | null; }

export default function RegimeAnalysisPanel({ result }: Props) {
  const labels = result?.labels ?? [];
  const width = 700, height = 160, pad = 12;
  const n = labels.length;
  const scaleX = (i: number) => pad + (i / Math.max(1, n-1)) * (width - pad * 2);
  const counts = useMemo(() => {
    const c: Record<number, number> = {};
    labels.forEach(l => { c[l] = (c[l] ?? 0) + 1; });
    return c;
  }, [labels]);
  const centroids = result?.centroids ?? [];

  return (
    <div className="space-y-3">
      {!labels.length ? (
        <div className="meta">No regime data available.</div>
      ) : (
        <svg width={width} height={height} className="bg-neutral-900 border border-neutral-800">
          {labels.map((lab, i) => (
            <circle key={i} cx={scaleX(i)} cy={height/2} r={3} fill={lab === 0 ? '#22c55e' : lab === 1 ? '#f59e0b' : '#ef4444'} />
          ))}
        </svg>
      )}
      {centroids.length ? (
        <div className="grid grid-cols-3 gap-3">
          {centroids.map((c, idx) => (
            <div key={idx} className="card p-3">
              <div className="meta">Regime {idx}</div>
              <div>Count: {counts[idx] ?? 0}</div>
              <div>Expectancy: {typeof c[1] === 'number' ? c[1].toFixed(4) : '—'}</div>
              <div>Volatility: {typeof c[0] === 'number' ? c[0].toFixed(4) : '—'}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
