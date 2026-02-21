import { useEffect, useMemo, useState } from 'react';
import { Trade, MetricsSnapshot } from '../../types';
import { listTradesForRun, getMetrics } from '../../api/runs';
import { formatFloat } from '../../utils/format';

interface Props {
  runId: string;
}

export default function DistributionPanel({ runId }: Props) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverBin, setHoverBin] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      listTradesForRun(runId).catch(() => []),
      getMetrics(runId).catch(() => null),
    ])
      .then(([t, m]) => { setTrades(t); setMetrics(m); })
      .catch((err) => setError(err?.message || 'Failed to load distribution'))
      .finally(() => setLoading(false));
  }, [runId]);

  const rMultiples = useMemo(() => trades.map(t => t.r_multiple ?? (Math.exp(t.log_return) - 1)), [trades]);

  const bins = useMemo(() => {
    if (!rMultiples.length) return [] as { x: number; c: number }[];
    const min = Math.min(...rMultiples), max = Math.max(...rMultiples);
    const nb = 20;
    const step = (max - min) / Math.max(1, nb);
    const arr = Array.from({ length: nb }, (_, i) => ({ x: min + i * step, c: 0 }));
    rMultiples.forEach((v) => {
      const idx = Math.min(nb - 1, Math.max(0, Math.floor((v - min) / Math.max(step, 1e-9))));
      arr[idx].c += 1;
    });
    return arr;
  }, [rMultiples]);

  const expectancyR = metrics?.expectancy_R ?? null;
  const avgWinR = metrics?.avg_win_R ?? null;
  const avgLossR = metrics?.avg_loss_R ?? null;
  const volR = metrics?.volatility_R ?? null;

  const width = 700, height = 240, pad = 12;
  const maxC = Math.max(1, ...bins.map(b => b.c));
  const scaleX = (x: number) => pad + ((x - (bins[0]?.x ?? 0)) / Math.max(1e-9, ((bins[bins.length-1]?.x ?? 0) - (bins[0]?.x ?? 0)))) * (width - pad * 2);
  const barW = (width - pad * 2) / Math.max(1, bins.length);
  const scaleY = (c: number) => height - pad - (c / maxC) * (height - pad * 2);

  const expectancyX = expectancyR != null ? scaleX(expectancyR) : null;

  // Boxplot and stats
  const box = useMemo(() => {
    if (!rMultiples.length) return null;
    const sorted = [...rMultiples].sort((a,b)=>a-b);
    const q = (p: number) => sorted[Math.floor(p * (sorted.length-1))];
    return {
      min: sorted[0], q1: q(0.25), median: q(0.5), q3: q(0.75), max: sorted[sorted.length-1], p5: q(0.05)
    };
  }, [rMultiples]);

  const skew = useMemo(() => {
    if (!rMultiples.length) return 0;
    const mean = rMultiples.reduce((a,b)=>a+b,0)/rMultiples.length;
    const sd = Math.sqrt(rMultiples.reduce((a,b)=>a+Math.pow(b-mean,2),0)/Math.max(1, rMultiples.length));
    const m3 = rMultiples.reduce((a,b)=>a+Math.pow(b-mean,3),0)/Math.max(1, rMultiples.length);
    return sd ? m3 / Math.pow(sd, 3) : 0;
  }, [rMultiples]);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
    if (!rect) return; const x = e.clientX - rect.left;
    const i = Math.floor((x - pad) / Math.max(1, barW));
    setHoverBin(i >= 0 && i < bins.length ? i : null);
  };
  const handleLeave = () => setHoverBin(null);

  return (
    <div className="space-y-3">
      {loading && <div className="meta">Loading…</div>}
      {error && <div className="meta text-red-400">{error}</div>}
      {!rMultiples.length ? (
        <div className="meta">No trade distribution available.</div>
      ) : (
        <div className="space-y-2">
          <svg width={width} height={height} className="bg-neutral-900 border border-neutral-800" onMouseMove={handleMove} onMouseLeave={handleLeave}>
            {/* Left-tail highlighting using 5th percentile */}
            {box && (
              <rect x={pad} y={pad} width={Math.max(0, scaleX(box.p5) - pad)} height={height - pad * 2} fill="rgba(239, 68, 68, 0.12)" />
            )}
            {/* Histogram bars */}
            {bins.map((b, i) => (
              <rect key={i} x={pad + i * barW} y={scaleY(b.c)} width={barW - 2} height={height - pad - scaleY(b.c)} fill="#38bdf8" />
            ))}
            {/* Mean (expectancy) and median overlays */}
            {expectancyX != null && (
              <line x1={expectancyX} x2={expectancyX} y1={pad} y2={height - pad} stroke="#facc15" strokeWidth={1.2} />
            )}
            {box && (
              <line x1={scaleX(box.median)} x2={scaleX(box.median)} y1={pad} y2={height - pad} stroke="#f472b6" strokeWidth={1.2} />
            )}
            {/* Legend and axes labels */}
            <g>
              <rect x={pad} y={pad} width={220} height={24} fill="rgba(0,0,0,0.2)" />
              <rect x={pad+8} y={pad+6} width={12} height={8} fill="#38bdf8" />
-              <text x={pad+24} y={pad+16} className="meta">Histogram</text>
+              <text x={pad+24} y={pad+16} className="meta" fill="#fff">Histogram</text>
              <line x1={pad+100} x2={pad+116} y1={pad+12} y2={pad+12} stroke="#facc15" strokeWidth={1.2} />
-              <text x={pad+120} y={pad+16} className="meta">Mean</text>
+              <text x={pad+120} y={pad+16} className="meta" fill="#fff">Mean</text>
              <line x1={pad+160} x2={pad+176} y1={pad+12} y2={pad+12} stroke="#f472b6" strokeWidth={1.2} />
-              <text x={pad+180} y={pad+16} className="meta">Median</text>
+              <text x={pad+180} y={pad+16} className="meta" fill="#fff">Median</text>
            </g>
            <text x={width/2} y={height-2} textAnchor="middle" className="meta" fill="#fff">Return (R)</text>
-            <text x={-height/2} y={12} transform={`rotate(-90)`} textAnchor="middle" className="meta">Frequency</text>
+            <text x={-height/2} y={12} transform={`rotate(-90)`} textAnchor="middle" className="meta" fill="#fff">Frequency</text>
            {/* Tooltip for hovered bin */}
            {hoverBin != null && bins[hoverBin] && (
              <g>
                <line x1={pad + hoverBin * barW + (barW/2)} x2={pad + hoverBin * barW + (barW/2)} y1={pad} y2={height - pad} stroke="#9ca3af" strokeDasharray="2,2" />
                <rect x={Math.min(width-pad-160, Math.max(pad, pad + hoverBin * barW - 80))} y={pad+24} width={160} height={46} fill="rgba(0,0,0,0.6)" stroke="#374151" />
-                <text x={Math.min(width-pad-155, Math.max(pad+5, pad + hoverBin * barW - 75))} y={pad+40} className="meta">Bin {hoverBin}</text>
-                <text x={Math.min(width-pad-155, Math.max(pad+5, pad + hoverBin * barW - 75))} y={pad+56} className="meta">x≈ {formatFloat(bins[hoverBin].x, 4)} / n= {bins[hoverBin].c}</text>
+                <text x={Math.min(width-pad-155, Math.max(pad+5, pad + hoverBin * barW - 75))} y={pad+40} className="meta" fill="#fff">Bin {hoverBin}</text>
+                <text x={Math.min(width-pad-155, Math.max(pad+5, pad + hoverBin * barW - 75))} y={pad+56} className="meta" fill="#fff">x≈ {formatFloat(bins[hoverBin].x, 4)} / n= {bins[hoverBin].c}</text>
              </g>
            )}
            {/* Skew annotation */}
-            <text x={width-pad-6} y={pad+16} textAnchor="end" className="meta">Skew: {formatFloat(skew, 3)}</text>
+            <text x={width-pad-6} y={pad+16} textAnchor="end" className="meta" fill="#fff">Skew: {formatFloat(skew, 3)}</text>
          </svg>
          {box && (
            <svg width={width} height={120} className="bg-neutral-900 border border-neutral-800">
              {/* Simple horizontal boxplot */}
              {(() => {
                const bx = (v: number) => pad + ((v - box.min) / Math.max(1e-9, box.max - box.min)) * (width - pad * 2);
                const midY = 60;
                return (
                  <g>
                    <line x1={bx(box.min)} x2={bx(box.max)} y1={midY} y2={midY} stroke="#64748b" />
                    <rect x={bx(box.q1)} y={midY - 15} width={bx(box.q3) - bx(box.q1)} height={30} fill="#334155" stroke="#94a3b8" />
                    <line x1={bx(box.median)} x2={bx(box.median)} y1={midY - 18} y2={midY + 18} stroke="#f472b6" />
                  </g>
                );
              })()}
            </svg>
          )}
        </div>
      )}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-3"><div className="meta">Expectancy (R)</div><div>{expectancyR != null ? formatFloat(expectancyR, 4) : '—'}</div></div>
        <div className="card p-3"><div className="meta">Avg Win R</div><div>{avgWinR != null ? formatFloat(avgWinR, 4) : '—'}</div></div>
        <div className="card p-3"><div className="meta">Avg Loss R</div><div>{avgLossR != null ? formatFloat(avgLossR, 4) : '—'}</div></div>
        <div className="card p-3"><div className="meta">Volatility (R)</div><div>{volR != null ? formatFloat(volR, 4) : '—'}</div></div>
      </div>
    </div>
  );
}