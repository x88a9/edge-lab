import { useState } from 'react';
import { createTrade } from '../../api/trades';
import type { Trade } from '../../types';

interface Props {
  runId: string;
  open: boolean;
  onClose: () => void;
  onAdd: (t: Trade) => void;
}

export default function AddTradeModal({ runId, open, onClose, onAdd }: Props) {
  const [entry, setEntry] = useState('');
  const [exit, setExit] = useState('');
  const [size, setSize] = useState('');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [saving, setSaving] = useState(false);

  const reset = () => { setEntry(''); setExit(''); setSize(''); setDirection('long'); };

  const submit = async () => {
    setSaving(true);
    try {
      const entryNum = Number(entry);
      const exitNum = Number(exit);
      const sizeNum = Number(size);
      const { id } = await createTrade({
        run_id: runId,
        entry_price: entryNum,
        exit_price: exitNum,
        size: sizeNum,
        direction,
      });
      const raw_return = direction === 'long' ? (exitNum - entryNum) / entryNum : (entryNum - exitNum) / entryNum;
      const log_return = Math.log(1 + raw_return);
      onAdd({ id, run_id: runId, entry_price: entryNum, exit_price: exitNum, size: sizeNum, direction, raw_return, log_return });
      reset();
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative card p-4 w-[500px]">
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
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving} onClick={submit}>Add Trade</button>
        </div>
      </div>
    </div>
  );
}