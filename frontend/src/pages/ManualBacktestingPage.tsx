import { useEffect, useMemo, useState } from 'react';
import { useSystems } from '../hooks/useSystems';
import { useRuns } from '../hooks/useRuns';
import { listVariantsForSystem } from '../api/systems';
import { createTrade } from '../api/trades';
import { listVariants } from '../api/variants';
import { listTradesForRun } from '../api/runs';
import { listUserVariants, listUserRunTrades } from '../api/admin';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import TradesTable from '../components/TradesTable';
import { useAdminInspection } from '../context/AdminInspectionContext';

export default function ManualBacktestingPage() {
  const { data: systems } = useSystems();
  const { data: runs } = useRuns();
  const { inspectionMode, inspectedUserId } = useAdminInspection();
  if (inspectionMode) return null;
  const [systemId, setSystemId] = useState<string>('');
  const [variantId, setVariantId] = useState<string>('');
  const [variantIds, setVariantIds] = useState<string[]>([]);
  const [availableVariants, setAvailableVariants] = useState<any[]>([]);
  const [runId, setRunId] = useState<string>('');
  const [trades, setTrades] = useState<any[]>([]);
  const [entry, setEntry] = useState('');
  const [exit, setExit] = useState('');
  const [size, setSize] = useState('');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [stopLoss, setStopLoss] = useState('');
  const [timestamp, setTimestamp] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'H1' | 'H4' | 'D1'>('H1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    async function fetchVariants() {
      try {
        if (!systemId) {
          const vs = inspectionMode && inspectedUserId ? await listUserVariants(inspectedUserId) : await listVariants();
          setAvailableVariants(vs);
          setVariantIds(vs.map((v: any) => v.id));
          return;
        }
        // If system selected, prefer filtering client-side when in inspection
        if (inspectionMode && inspectedUserId) {
          const vs = await listUserVariants(inspectedUserId);
          const filtered = vs.filter((v: any) => v.system_id === systemId);
          setAvailableVariants(filtered);
          setVariantIds(filtered.map((v: any) => v.id));
        } else {
          const vs = await listVariantsForSystem(systemId);
          setAvailableVariants(vs);
          setVariantIds(vs.map((v: any) => v.id));
        }
      } catch {
        setAvailableVariants([]);
        setVariantIds([]);
      }
    }
    fetchVariants();
  }, [systemId, inspectionMode, inspectedUserId]);

  const filteredRuns = useMemo(() => {
    if (variantId) return runs.filter((r: any) => r.variant_id === variantId);
    if (systemId && variantIds.length) return runs.filter((r: any) => variantIds.includes(r.variant_id));
    return runs;
  }, [runs, systemId, variantId, variantIds]);

  useEffect(() => {
    if (!runId) { setTrades([]); return; }
    async function fetchTrades() {
      try {
        if (inspectionMode && inspectedUserId) {
          const ts = await listUserRunTrades(inspectedUserId, runId);
          setTrades(ts);
        } else {
          const ts = await listTradesForRun(runId);
          setTrades(ts);
        }
      } catch {
        setTrades([]);
      }
    }
    fetchTrades();
  }, [runId, inspectionMode, inspectedUserId]);

  const validStop = useMemo(() => {
    const e = Number(entry);
    const s = Number(stopLoss);
    if (!isFinite(e) || !isFinite(s)) return false;
    return direction === 'long' ? s < e : s > e;
  }, [entry, stopLoss, direction]);

  const canSubmit = useMemo(() => {
    const e = Number(entry);
    const x = Number(exit);
    const sz = Number(size);
    return runId && isFinite(e) && isFinite(x) && isFinite(sz) && validStop;
  }, [runId, entry, exit, size, validStop]);

  const reset = () => {
    setEntry(''); setExit(''); setSize(''); setDirection('long'); setStopLoss(''); setTimestamp(''); setTimeframe('H1'); setError(null);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const entryNum = Number(entry);
      const exitNum = Number(exit);
      const sizeNum = Number(size);
      const stopNum = Number(stopLoss);
      const timestampISO = timestamp ? new Date(timestamp).toISOString() : undefined;
      const res = await createTrade({
        run_id: runId,
        entry_price: entryNum,
        exit_price: exitNum,
        stop_loss: stopNum,
        size: sizeNum,
        direction,
        timestamp: timestampISO,
        timeframe,
      });
      const raw_return = direction === 'long' ? (exitNum - entryNum) / entryNum : (entryNum - exitNum) / entryNum;
      const log_return = Math.log(1 + raw_return);
      setTrades((prev) => [
        ...prev,
        {
          id: res.id,
          run_id: runId,
          entry_price: entryNum,
          exit_price: exitNum,
          size: sizeNum,
          direction,
          raw_return,
          log_return,
          stop_loss: stopNum,
          timestamp: timestampISO || new Date().toISOString(),
          timeframe,
        }
      ]);
      setCount((c) => c + 1);
      reset();
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (typeof detail === 'string') setError(detail);
      else setError(e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Manual Backtesting' }]} />
      <div className="page-title mb-1">Start Manual Backtesting</div>
      <div className="subline">Select system and run, then enter trades repeatedly</div>
      <div className="border-b border-neutral-800 mb-4"></div>

      <div className="card p-4">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="meta">System</label>
            <select className="input w-full" value={systemId} onChange={(e) => setSystemId(e.target.value)}>
              <option value="">Select system…</option>
              {systems.map((s: any) => <option key={s.id} value={s.id}>{(s.display_name || s.name)} ({String(s.id).slice(0,6)})</option>)}
            </select>
          </div>
          <div>
            <label className="meta">Variant</label>
            <select className="input w-full" value={variantId} onChange={(e) => setVariantId(e.target.value)}>
              <option value="">Select variant…</option>
              {availableVariants.map((v: any) => <option key={v.id} value={v.id}>{(v.display_name || v.name)} ({String(v.id).slice(0,6)})</option>)}
            </select>
          </div>
          <div>
            <label className="meta">Run</label>
            <select className="input w-full" value={runId} onChange={(e) => setRunId(e.target.value)}>
              <option value="">Select run…</option>
              {filteredRuns.map((r: any) => <option key={r.id} value={r.id}>{(r.display_name || r.id)} ({String(r.id).slice(0,6)})</option>)}
            </select>
          </div>
          <div className="flex items-end justify-end">
            <div className="meta">Trades added: {count}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-muted">Entry</label>
            <input className="input w-full" value={entry} onChange={(e) => setEntry(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-text-muted">Exit</label>
            <input className="input w-full" value={exit} onChange={(e) => setExit(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-text-muted">Size</label>
            <input className="input w-full" value={size} onChange={(e) => setSize(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-text-muted">Direction</label>
            <select className="input w-full" value={direction} onChange={(e) => setDirection(e.target.value as any)}>
              <option value="long">long</option>
              <option value="short">short</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted">Stop Loss</label>
            <input className="input w-full" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
            {!validStop && (
              <div className="mt-1 text-xs text-red-400">{direction === 'long' ? 'Stop must be < Entry' : 'Stop must be > Entry'}</div>
            )}
          </div>
          <div>
            <label className="text-xs text-text-muted">Timestamp</label>
            <div className="flex items-center gap-2">
              <input className="input w-full" type="datetime-local" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const d = new Date();
                  const pad = (n: number) => String(n).padStart(2, '0');
                  const s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                  setTimestamp(s);
                }}
              >
                Now
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted">Timeframe</label>
            <select className="input w-full" value={timeframe} onChange={(e) => setTimeframe(e.target.value as any)}>
              <option value="H1">H1</option>
              <option value="H4">H4</option>
              <option value="D1">D1</option>
            </select>
          </div>
        </div>
        {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={reset}>Reset</Button>
          <Button variant="primary" disabled={inspectionMode || saving || !canSubmit} onClick={submit}>Add Trade</Button>
        </div>
      </div>
      {runId && (
        <div className="mt-4">
          <div className="section-title mb-2">Trades for selected run</div>
          <TradesTable trades={trades as any} onChange={(updated) => setTrades(updated as any)} />
        </div>
      )}
    </div>
  );
}
