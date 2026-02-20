import { useEffect, useMemo, useState } from 'react';
import { EquityPoint, MetricsSnapshot } from '../../types';
import { getEquity, getMetrics } from '../../api/runs';
import { formatFloat, formatPercent } from '../../utils/format';

interface Props {
  runId: string;
}

export default function EquityDrawdownPanel({ runId }: Props) {
  const [equity, setEquity] = useState<EquityPoint[]>([]);
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [scale, setScale] = useState<'linear' | 'log'>('linear');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getEquity(runId).catch(() => []),
      getMetrics(runId).catch(() => null),
    ])
      .then(([e, m]) => { setEquity(e); setMetrics(m); })
      .catch((err) => setError(err?.message || 'Failed to load equity'))
      .finally(() => setLoading(false));
  }, [runId]);

  const equityArr = useMemo(() => (Array.isArray(equity) ? equity : []), [equity]);

  const stats = useMemo(() => {
    const totalR = metrics?.total_R ?? null;
    const maxDdR = metrics?.max_drawdown_R ?? null;
    const logGrowth = metrics?.log_growth ?? null;
    return { totalR, maxDdR, logGrowth };
  }, [metrics]);

  const ddSeries = useMemo(() => {
    if (!equityArr.length) return [] as number[];
    const ys = equityArr.map(p => p.equity);
    const peaks = ys.reduce<number[]>((arr, y, i) => {
      const prev = i === 0 ? y : Math.max(arr[i-1], y);
      arr.push(prev);
      return arr;
    }, []);
    return ys.map((y, i) => (y / peaks[i]) - 1);
  }, [equityArr]);

  const maxDdIndex = useMemo(() => {
    if (!ddSeries.length) return -1;
    let minV = 0, idx = -1;
    ddSeries.forEach((v, i) => { if (v < minV) { minV = v; idx = i; } });
    return idx;
  }, [ddSeries]);

  const maxDD = useMemo(() => (ddSeries.length ? Math.abs(Math.min(...ddSeries)) : 0), [ddSeries]);
  const width = 700;
  const height = 240;
  const pad = 12;

  const xs = equityArr.map((_, i) => i);
  const ys = equityArr.map((p) => p.equity);
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 1;
  const logY = (y: number) => Math.log(Math.max(1e-9, y));
  const minYL = ys.length ? Math.min(...ys.map(logY)) : 0;
  const maxYL = ys.length ? Math.max(...ys.map(logY)) : 1;

  const scaleX = (i: number) => pad + (i / Math.max(1, xs.length - 1)) * (width - pad * 2);
  const scaleY = (y: number) => {
    if (scale === 'linear') {
      return height - pad - ((y - minY) / Math.max(1e-9, maxY - minY)) * (height - pad * 2);
    } else {
      return height - pad - ((logY(y) - minYL) / Math.max(1e-9, maxYL - minYL)) * (height - pad * 2);
    }
  };

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const i = Math.round(((x - pad) / Math.max(1, (width - pad * 2))) * (xs.length - 1));
    setHoverIdx(Math.max(0, Math.min(xs.length - 1, i)));
  };
  const handleLeave = () => setHoverIdx(null);

  const equityPath = ys.map((y, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(y)}`).join(' ');

  const ddHeight = 140;
  const scaleYdd = (v: number) => ddHeight - pad - ((v - (-1)) / (1 - (-1))) * (ddHeight - pad * 2);
  const ddPath = ddSeries.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleYdd(v)}`).join(' ');
  const ddBaselineY = scaleYdd(0);
  const ddAreaPath = ddSeries.length ? `M ${scaleX(0)} ${ddBaselineY} ${ddSeries.map((v,i)=>`L ${scaleX(i)} ${scaleYdd(v)}`).join(' ')} L ${scaleX(ddSeries.length-1)} ${ddBaselineY} Z` : '';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="meta">Scale:</label>
          <div className="btn-group">
            <button className={`btn ${scale==='linear'?'btn-active':''}`} onClick={() => setScale('linear')}>Linear</button>
            <button className={`btn ${scale==='log'?'btn-active':''}`} onClick={() => setScale('log')}>Log</button>
          </div>
        </div>
        {loading && <div className="meta">Loading…</div>}
        {error && <div className="meta text-red-400">{error}</div>}
      </div>
      {!equityArr.length ? (
        <div className="card p-3"><div className="meta">No equity data available.</div></div>
      ) : (
        <div className="space-y-2">
          {/* Equity chart */}
          <svg width={width} height={height} className="bg-neutral-900 border border-neutral-800" onMouseMove={handleMove} onMouseLeave={handleLeave}>
            {/* Zero gridline for visual anchor */}
            <line x1={pad} x2={width-pad} y1={scaleY(minY)} y2={scaleY(minY)} stroke="#374151" strokeWidth={0.8} />
            {/* Equity series */}
            <path d={equityPath} fill="none" stroke="#38bdf8" strokeWidth={1.5} />
            {/* Max drawdown annotation on equity curve */}
            {maxDdIndex >= 0 && (
              <g>
                <line x1={scaleX(maxDdIndex)} x2={scaleX(maxDdIndex)} y1={pad} y2={height-pad} stroke="#ef4444" strokeDasharray="3,3" />
                <circle cx={scaleX(maxDdIndex)} cy={scaleY(ys[maxDdIndex])} r={3} fill="#ef4444" />
                <text x={Math.min(width-pad-140, Math.max(pad+5, scaleX(maxDdIndex)+6))} y={pad+16} className="meta">Max DD {formatPercent(Math.abs(ddSeries[maxDdIndex] || 0), 2)}</text>
              </g>
            )}
            {/* Axes labels */}
            <text x={width/2} y={height-2} textAnchor="middle" className="meta">Time Index</text>
            <text x={-height/2} y={12} transform={`rotate(-90)`} textAnchor="middle" className="meta">Equity (R)</text>
            {/* Tooltip */}
            {hoverIdx != null && (
              <g>
                <line x1={scaleX(hoverIdx)} x2={scaleX(hoverIdx)} y1={pad} y2={height-pad} stroke="#9ca3af" strokeDasharray="2,2" />
                <rect x={Math.min(width-pad-160, Math.max(pad, scaleX(hoverIdx)-80))} y={pad+24} width={160} height={52} fill="rgba(0,0,0,0.6)" stroke="#374151" />
                <text x={Math.min(width-pad-155, Math.max(pad+5, scaleX(hoverIdx)-75))} y={pad+40} className="meta">t {hoverIdx}</text>
                <text x={Math.min(width-pad-155, Math.max(pad+5, scaleX(hoverIdx)-75))} y={pad+56} className="meta">Eq: {formatFloat(ys[hoverIdx], 4)} / DD: {formatPercent(Math.abs(ddSeries[hoverIdx] ?? 0), 2)}</text>
              </g>
            )}
          </svg>

          {/* Drawdown chart with area fill */}
          <svg width={width} height={ddHeight} className="bg-neutral-900 border border-neutral-800">
            {/* Baseline at 0 drawdown */}
            <line x1={pad} x2={width-pad} y1={ddBaselineY} y2={ddBaselineY} stroke="#374151" strokeWidth={0.8} />
            {/* Area fill between curve and baseline */}
            {ddAreaPath && <path d={ddAreaPath} fill="rgba(239, 68, 68, 0.15)" stroke="none" />}
            {/* Drawdown series */}
            <path d={ddPath} fill="none" stroke="#f87171" strokeWidth={1.2} />
            {/* Axes labels */}
            <text x={width/2} y={ddHeight-2} textAnchor="middle" className="meta">Time Index</text>
            <text x={-ddHeight/2} y={12} transform={`rotate(-90)`} textAnchor="middle" className="meta">Drawdown (%)</text>
            <text x={width-pad-6} y={pad+16} textAnchor="end" className="meta" fill="#fff">Max DD: {formatPercent(maxDD, 2)}</text>
          </svg>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3"><div className="meta">Total R</div><div>{stats.totalR != null ? formatFloat(stats.totalR, 4) : '—'}</div></div>
        <div className="card p-3"><div className="meta">Max Drawdown (R)</div><div>{stats.maxDdR != null ? formatFloat(stats.maxDdR, 4) : '—'}</div></div>
        <div className="card p-3"><div className="meta">Log Growth</div><div>{stats.logGrowth != null ? formatFloat(stats.logGrowth, 6) : '—'}</div></div>
      </div>
    </div>
  );
}