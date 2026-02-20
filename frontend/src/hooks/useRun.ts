import { useEffect, useState } from 'react';
import { EquityPoint, MetricsSnapshot, Run, Trade, Variant, System } from '../types';
import { getRun, listTradesForRun, getMetrics, getEquity } from '../api/runs';
import { getVariant } from '../api/variants';
import { getSystem } from '../api/systems';

export default function useRun(runId?: string) {
  const [run, setRun] = useState<Run | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [equity, setEquity] = useState<EquityPoint[]>([]);
  const [variant, setVariant] = useState<Variant | null>(null);
  const [system, setSystem] = useState<System | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!runId) return;
      setLoading(true);
      setError(null);
      try {
        const [r, t, m, e] = await Promise.all([
          getRun(runId),
          listTradesForRun(runId),
          getMetrics(runId).catch(() => null),
          getEquity(runId).catch(() => []),
        ]);
        setRun(r);
        setTrades(t);
        setMetrics(m);
        setEquity(e);

        // Fetch variant and system display names for the run view
        try {
          const v = await getVariant(r.variant_id);
          setVariant(v);
          if (v?.strategy_id) {
            const s = await getSystem(v.strategy_id);
            setSystem(s);
          }
        } catch (innerErr) {
          console.warn('Failed to fetch variant/system for run:', innerErr);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load run');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [runId]);

  return {
    run,
    setRun,
    trades,
    setTrades,
    metrics,
    equity,
    variant,
    system,
    loading,
    error,
  };
}

export { useRun };