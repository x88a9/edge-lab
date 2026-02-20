import { useEffect, useMemo, useState } from 'react';
import { KellySimulationResult, Trade } from '../../types';
import { getKellySimulation, listTradesForRun } from '../../api/runs';
import { formatFloat, formatPercent } from '../../utils/format';

interface Props { runId: string; }

export default function KellySimulationPanel({ runId }: Props) {
  const [result, setResult] = useState<KellySimulationResult | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getKellySimulation(runId).catch(() => null),
      listTradesForRun(runId).catch(() => []),
    ])
      .then(([r, t]) => { setResult(r); setTrades(t); })
      .catch((err) => setError(err?.message || 'Failed to load Kelly simulation'))
      .finally(() => setLoading(false));
  }, [runId]);

  // Comparative equity curves for Full, 0.5x, 0.25x Kelly using actual trade sequence
  const baseFraction = result?.growth_optimal?.fraction ?? 0.02;
  const fractions = [baseFraction, baseFraction * 0.5, baseFraction * 0.25];

  const curves = useMemo(() => {
    if (!trades.length) return null;
    const rmult = trades.map(t => t.r_multiple ?? (Math.exp(t.log_return) - 1));
    const makeCurve = (f: number) => {
      const path: number[] = [];
      let capital = 1.0;
      for (const r of rmult) {
        capital *= (1 + f * r);
        path.push(capital);
      }
      return path;
    };
    return fractions.map(makeCurve);
  }, [trades, fractions.join(',')]);

  const width = 700, height = 240, pad = 12;
  const n = curves?.[0]?.length ?? 0;
  const allVals = curves ? curves.flat() : [];
  const minY = Math.min(1, ...allVals), maxY = Math.max(1, ...allVals);
  const scaleX = (i: number) => pad + (i / Math.max(1, n-1)) * (width - pad * 2);
  const scaleY = (y: number) => height - pad - ((y - minY) / Math.max(1e-9, maxY - minY)) * (height - pad * 2);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
    if (!rect) return; const x = e.clientX - rect.left;
    const i = Math.round(((x - pad) / Math.max(1, (width - pad * 2))) * (n - 1));
    setHoverIdx(Math.max(0, Math.min(n - 1, i)));
  };
  const handleLeave = () => setHoverIdx(null);

  const mdds = useMemo(() => {
    if (!curves) return [] as number[];
    return curves.map((p) => {
      let peak = 1, worst = 0;
      p.forEach((y) => { peak = Math.max(peak, y); const dd = (peak - y) / Math.max(1e-9, peak); worst = Math.max(worst, dd); });
      return worst;
    });
  }, [curves]);

  return (
    <div className="space-y-3">
      {loading && <div className="meta">Loading…</div>}
      {error && <div className="meta text-red-400">{error}</div>}
      {!curves ? (
        <div className="card p-3"><div className="meta">No trades available for Kelly comparison.</div></div>
      ) : (
        <svg width={width} height={height} className="bg-neutral-900 border border-neutral-800" onMouseMove={handleMove} onMouseLeave={handleLeave}>
          {/* Gridline at equity=1 */}
          <line x1={pad} x2={width-pad} y1={scaleY(1)} y2={scaleY(1)} stroke="#374151" strokeWidth={0.8} />
          {curves.map((p, idx) => {
            const d = p.map((y, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(y)}`).join(' ');
            const color = idx === 0 ? '#38bdf8' : (idx === 1 ? '#fbbf24' : '#22c55e');
            return <path key={idx} d={d} fill="none" stroke={color} strokeWidth={1.5} />;
          })}
          {/* Legend */}
          <g>
            <rect x={pad} y={pad} width={220} height={24} fill="rgba(0,0,0,0.2)" />
            <line x1={pad+8} x2={pad+24} y1={pad+12} y2={pad+12} stroke="#38bdf8" strokeWidth={1.5} />
            <text x={pad+28} y={pad+16} className="meta" fill="#fff">Full Kelly</text>
            <line x1={pad+108} x2={pad+124} y1={pad+12} y2={pad+12} stroke="#fbbf24" strokeWidth={1.5} />
            <text x={pad+128} y={pad+16} className="meta" fill="#fff">0.5x</text>
            <line x1={pad+168} x2={pad+184} y1={pad+12} y2={pad+12} stroke="#22c55e" strokeWidth={1.5} />
            <text x={pad+188} y={pad+16} className="meta" fill="#fff">0.25x</text>
          </g>
          {/* Axes labels */}
          <text x={width/2} y={height-4} textAnchor="middle" className="meta" fill="#fff">Kelly Fraction</text>
          <text x={-height/2} y={12} transform={`rotate(-90)`} textAnchor="middle" className="meta" fill="#fff">Equity (× initial)</text>
          {/* Tooltip */}
          {hoverIdx != null && (
            <g>
              <line x1={scaleX(hoverIdx)} x2={scaleX(hoverIdx)} y1={pad} y2={height-pad} stroke="#9ca3af" strokeDasharray="2,2" />
              <rect x={Math.min(width-pad-160, Math.max(pad, scaleX(hoverIdx)-80))} y={pad+24} width={160} height={62} fill="rgba(0,0,0,0.6)" stroke="#374151" />
              <text x={Math.min(width-pad-155, Math.max(pad+5, scaleX(hoverIdx)-75))} y={pad+40} className="meta" fill="#fff">t {hoverIdx}</text>
              <text x={Math.min(width-pad-155, Math.max(pad+5, scaleX(hoverIdx)-75))} y={pad+56} className="meta" fill="#fff">Full: {formatFloat(curves[0][hoverIdx], 4)}</text>
              <text x={Math.min(width-pad-155, Math.max(pad+5, scaleX(hoverIdx)-75))} y={pad+72} className="meta" fill="#fff">0.5: {formatFloat(curves[1][hoverIdx], 4)} / 0.25: {formatFloat(curves[2][hoverIdx], 4)}</text>
            </g>
          )}
        </svg>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3"><div className="meta">Full Kelly Fraction</div><div>{formatPercent(baseFraction, 2)}</div></div>
        <div className="card p-3"><div className="meta">0.5 Kelly</div><div>{formatPercent(baseFraction * 0.5, 2)}</div></div>
        <div className="card p-3"><div className="meta">0.25 Kelly</div><div>{formatPercent(baseFraction * 0.25, 2)}</div></div>
      </div>
      {result && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3"><div className="meta">Optimal Kelly</div><div>{formatPercent(result.growth_optimal?.fraction ?? 0, 2)}</div></div>
          <div className="card p-3"><div className="meta">Growth Rate (mean final capital)</div><div>{formatFloat((result.growth_optimal?.mean_final_capital ?? 1) - 1, 4)}</div></div>
          <div className="card p-3"><div className="meta">Drawdown Comparison (mean max DD)</div><div>{formatPercent(result.growth_optimal?.mean_max_drawdown ?? 0, 2)}</div></div>
        </div>
      )}
      {curves && (
        <div className="card p-3 mt-2">
          <div className="meta">Max Drawdown comparison</div>
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div className="card p-3"><div className="meta">Full Kelly MDD</div><div>{formatPercent(mdds[0] ?? 0, 2)}</div></div>
            <div className="card p-3"><div className="meta">0.5 Kelly MDD</div><div>{formatPercent(mdds[1] ?? 0, 2)}</div></div>
            <div className="card p-3"><div className="meta">0.25 Kelly MDD</div><div>{formatPercent(mdds[2] ?? 0, 2)}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}