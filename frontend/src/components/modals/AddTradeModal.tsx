import { useState, useMemo } from 'react';
import { createTrade } from '../../api/trades';
import type { Trade } from '../../types';

type AnyTrade = Trade & {
  stop_loss?: number;
  timestamp?: string;
  timeframe?: 'H1' | 'H4' | 'D1';
};

interface Props {
  runId: string;
  open: boolean;
  onClose: () => void;
  onAdd: (t: AnyTrade) => void;
}

function toErrorMessage(e: any): string {
  const detail = e?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d: any) => d?.msg ?? JSON.stringify(d)).join('; ');
  }
  if (detail && typeof detail === 'object') return JSON.stringify(detail);
  return e?.message ?? 'Unknown error';
}

export default function AddTradeModal({ runId, open, onClose, onAdd }: Props) {
  const [entry, setEntry] = useState('');
  const [exit, setExit] = useState('');
  const [size, setSize] = useState('');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [stopLoss, setStopLoss] = useState('');
  const [timestamp, setTimestamp] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'H1' | 'H4' | 'D1'>('H1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    return isFinite(e) && isFinite(x) && isFinite(sz) && validStop;
  }, [entry, exit, size, validStop]);

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
      const { id } = await createTrade({
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
      const t: AnyTrade = {
        id,
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
      };
      onAdd(t);
      reset();
      onClose();
    } catch (e: any) {
      setError(toErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative card p-4 w-[560px]">
        <div className="section-title mb-2">Add Trade</div>
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
            <input className="input w-full" type="datetime-local" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} />
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
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving || !canSubmit} onClick={submit}>Add Trade</button>
        </div>
      </div>
    </div>
  );
}