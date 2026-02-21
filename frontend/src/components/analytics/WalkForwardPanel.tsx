import { useEffect, useMemo, useState } from 'react';
import { WalkForwardWindow } from '../../types';
import { getWalkForward } from '../../api/runs';
import { formatFloat } from '../../utils/format';

interface Props { runId: string; }

export default function WalkForwardPanel({ runId }: Props) {
  const [data, setData] = useState<WalkForwardWindow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    getWalkForward(runId)
      .then(setData)
      .catch((err) => setError(err?.message || 'Failed to load walk-forward'))
      .finally(() => setLoading(false));
  }, [runId]);

  // Filter invalid windows and guard against NaN/null
  const windows = useMemo(() => (
    (data || []).filter((d) => [d.train_expectancy, d.test_expectancy, d.train_sharpe, d.test_sharpe]
      .every((v) => Number.isFinite(v)))
  ), [data]);

  const width = 700, height = 240, pad = 12;
  const n = windows.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const minExp = useMemo(() => {
    const vals = windows.flatMap(d => [d.train_expectancy, d.test_expectancy]);
    return vals.length ? Math.min(...vals, 0) : 0;
  }, [windows]);
  const maxExp = useMemo(() => {
    const vals = windows.flatMap(d => [d.train_expectancy, d.test_expectancy]);
    return vals.length ? Math.max(...vals, 0.01) : 1;
  }, [windows]);
  const minSharpe = useMemo(() => {
    const vals = windows.flatMap(d => [d.train_sharpe, d.test_sharpe]);
    return vals.length ? Math.min(...vals, 0) : 0;
  }, [windows]);
  const maxSharpe = useMemo(() => {
    const vals = windows.flatMap(d => [d.train_sharpe, d.test_sharpe]);
    return vals.length ? Math.max(...vals, 0.01) : 1;
  }, [windows]);

  const scaleX = (i: number) => pad + (i / Math.max(1, n-1)) * (width - pad * 2);
  const scaleYExp = (y: number) => height - pad - ((y - minExp) / Math.max(1e-9, maxExp - minExp)) * (height - pad * 2);
  const scaleYSharpe = (y: number) => height - pad - ((y - minSharpe) / Math.max(1e-9, maxSharpe - minSharpe)) * (height - pad * 2);

  const dTrain = windows.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleYExp(d.train_expectancy)}`).join(' ');
  const dTest = windows.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleYExp(d.test_expectancy)}`).join(' ');

  // Approximate volatility per window via expectancy/sharpe (vol ≈ mean / sharpe)
  const volTrain = windows.map(d => {
    const s = d.train_sharpe ?? 0;
    return s ? Math.abs(d.train_expectancy / s) : 0;
  });
  const volTest = windows.map(d => {
    const s = d.test_sharpe ?? 0;
    return s ? Math.abs(d.test_expectancy / s) : 0;
  });

  const minVol = volTrain.length || volTest.length ? Math.min(...volTrain, ...volTest, 0) : 0;
  const maxVol = volTrain.length || volTest.length ? Math.max(...volTrain, ...volTest, 0.01) : 1;
  const scaleYVol = (y: number) => height - pad - ((y - minVol) / Math.max(1e-9, maxVol - minVol)) * (height - pad * 2);

  const dVolTrain = volTrain.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleYVol(v)}`).join(' ');
  const dVolTest = volTest.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleYVol(v)}`).join(' ');

  const degradation = useMemo(() => {
    const flags = windows.map(d => (d.test_expectancy < d.train_expectancy));
    const count = flags.filter(Boolean).length;
    return { count, total: windows.length };
  }, [windows]);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const i = Math.round(((x - pad) / Math.max(1, (width - pad * 2))) * (n - 1));
    setHoverIdx(Math.max(0, Math.min(n - 1, i)));
  };

  const handleLeave = () => setHoverIdx(null);

  return (
    <div className="space-y-3">
      {loading && <div className="meta">Loading…</div>}
      {error && <div className="meta text-red-400">{error}</div>}
      {!windows.length ? (
        <div className="card p-3">
          <div className="meta">No walk-forward windows computed for this run.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Expectancy chart */}
          <svg width={width} height={height} className="bg-neutral-900 border border-neutral-800" onMouseMove={handleMove} onMouseLeave={handleLeave}>
            {/* Gridlines */}
            <line x1={pad} x2={width-pad} y1={scaleYExp(0)} y2={scaleYExp(0)} stroke="#374151" strokeWidth={0.8} />
            {/* Series */}
            <path d={dTrain} fill="none" stroke="#22c55e" strokeWidth={1.5} />
            <path d={dTest} fill="none" stroke="#f59e0b" strokeWidth={1.5} />
            {/* Legend */}
            <g>
              <rect x={pad} y={pad} width={180} height={24} fill="rgba(0,0,0,0.2)" />
              <circle cx={pad+10} cy={pad+12} r={4} fill="#22c55e" />
-              <text x={pad+20} y={pad+16} className="meta">Train Expectancy (R)</text>
+              <text x={pad+20} y={pad+16} className="meta" fill="#fff">Train Expectancy (R)</text>
              <circle cx={pad+130} cy={pad+12} r={4} fill="#f59e0b" />
-              <text x={pad+140} y={pad+16} className="meta">Test</text>
+              <text x={pad+140} y={pad+16} className="meta" fill="#fff">Test</text>
            </g>
            {/* Axes labels */}
-            <text x={width/2} y={height-2} textAnchor="middle" className="meta">Window Index</text>
-            <text x={-height/2} y={12} transform={`rotate(-90)`} textAnchor="middle" className="meta">Expectancy (R)</text>
+            <text x={width/2} y={height-2} textAnchor="middle" className="meta" fill="#fff">Window Index</text>
+            <text x={-height/2} y={12} transform={`rotate(-90)`} textAnchor="middle" className="meta" fill="#fff">Expectancy (R)</text>
            {/* Tooltip */}
            {hoverIdx != null && (
              <g>
                <line x1={scaleX(hoverIdx)} x2={scaleX(hoverIdx)} y1={pad} y2={height-pad} stroke="#9ca3af" strokeDasharray="2,2" />
                <rect x={Math.min(width-pad-140, Math.max(pad, scaleX(hoverIdx)-70))} y={pad+24} width={140} height={46} fill="rgba(0,0,0,0.6)" stroke="#374151" />
-                <text x={Math.min(width-pad-135, Math.max(pad+5, scaleX(hoverIdx)-65))} y={pad+40} className="meta">W {hoverIdx}</text>
-                <text x={Math.min(width-pad-135, Math.max(pad+5, scaleX(hoverIdx)-65))} y={pad+56} className="meta">T: {formatFloat(windows[hoverIdx].train_expectancy, 4)} R / S: {formatFloat(windows[hoverIdx].train_sharpe, 3)}</text>
-                <text x={Math.min(width-pad-135, Math.max(pad+5, scaleX(hoverIdx)-65))} y={pad+72} className="meta">t: {formatFloat(windows[hoverIdx].test_expectancy, 4)} R / s: {formatFloat(windows[hoverIdx].test_sharpe, 3)}</text>
+                <text x={Math.min(width-pad-135, Math.max(pad+5, scaleX(hoverIdx)-65))} y={pad+40} className="meta" fill="#fff">W {hoverIdx}</text>
+                <text x={Math.min(width-pad-135, Math.max(pad+5, scaleX(hoverIdx)-65))} y={pad+56} className="meta" fill="#fff">T: {formatFloat(windows[hoverIdx].train_expectancy, 4)} R / S: {formatFloat(windows[hoverIdx].train_sharpe, 3)}</text>
+                <text x={Math.min(width-pad-135, Math.max(pad+5, scaleX(hoverIdx)-65))} y={pad+72} className="meta" fill="#fff">t: {formatFloat(windows[hoverIdx].test_expectancy, 4)} R / s: {formatFloat(windows[hoverIdx].test_sharpe, 3)}</text>
              </g>
            )}
          </svg>

          {/* Volatility proxy chart */}
          <svg width={width} height={height} className="bg-neutral-900 border border-neutral-800">
            <line x1={pad} x2={width-pad} y1={scaleYVol(0)} y2={scaleYVol(0)} stroke="#374151" strokeWidth={0.8} />
            <path d={dVolTrain} fill="none" stroke="#22c55e" strokeWidth={1.5} />
            <path d={dVolTest} fill="none" stroke="#fbbf24" strokeWidth={1.5} />
-            <text x={width/2} y={height-2} textAnchor="middle" className="meta">Window Index</text>
-            <text x={-height/2} y={12} transform={`rotate(-90)`} textAnchor="middle" className="meta">Volatility (approx)</text>
+            <text x={width/2} y={height-2} textAnchor="middle" className="meta" fill="#fff">Window Index</text>
+            <text x={-height/2} y={12} transform={`rotate(-90)`} textAnchor="middle" className="meta" fill="#fff">Volatility (approx)</text>
          </svg>

          {/* Stability indicator */}
          <svg width={width} height={120} className="bg-neutral-900 border border-neutral-800">
            {windows.map((d, i) => (
              <circle key={i} cx={scaleX(i)} cy={60} r={4} fill={d.test_expectancy < d.train_expectancy ? '#ef4444' : '#22c55e'} />
            ))}
-            <text x={width/2} y={118} textAnchor="middle" className="meta">Window Index</text>
-            <text x={-60} y={12} transform={`rotate(-90)`} textAnchor="middle" className="meta">Stability</text>
+            <text x={width/2} y={118} textAnchor="middle" className="meta" fill="#fff">Window Index</text>
+            <text x={-60} y={12} transform={`rotate(-90)`} textAnchor="middle" className="meta" fill="#fff">Stability</text>
          </svg>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3"><div className="meta">Windows</div><div>{windows.length}</div></div>
        <div className="card p-3"><div className="meta">Stability</div><div>{degradation.total ? `${degradation.count} degrading / ${degradation.total}` : '—'}</div></div>
        <div className="card p-3"><div className="meta">Expectancy Range</div><div>{formatFloat(minExp, 4)} → {formatFloat(maxExp, 4)}</div></div>
        <div className="card p-3"><div className="meta">Volatility Range</div><div>{formatFloat(minVol, 4)} → {formatFloat(maxVol, 4)}</div></div>
      </div>
    </div>
  );
}