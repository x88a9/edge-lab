import { useState } from 'react';
import { createRun } from '../../api/runs';

interface Props {
  open: boolean;
  variantId: string;
  onClose: () => void;
  onCreated: (run: any) => void;
}

export default function CreateRunModal({ open, variantId, onClose, onCreated }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [initialCapital, setInitialCapital] = useState<string>('100000');
  const [runType, setRunType] = useState<'backtest' | 'forward' | 'montecarlo'>('backtest');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = variantId && displayName.trim() && initialCapital.trim();

  const submit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        variant_id: variantId,
        display_name: displayName,
        initial_capital: Number(initialCapital),
        run_type: runType,
        description: description || undefined,
      };
      const created = await createRun(payload);
      onCreated(created);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="card p-6 w-[520px]">
        <div className="section-title mb-4">New Run</div>
        {error ? <div className="meta text-danger mb-3">{error}</div> : null}
        <div className="space-y-3">
          <div>
            <label className="meta">Display Name</label>
            <input className="input w-full" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className="meta">Initial Capital</label>
            <input className="input w-full" type="number" value={initialCapital} onChange={(e) => setInitialCapital(e.target.value)} />
          </div>
          <div>
            <label className="meta">Run Type</label>
            <select className="input w-full" value={runType} onChange={(e) => setRunType(e.target.value as any)}>
              <option value="backtest">Backtest</option>
              <option value="forward">Forward</option>
              <option value="montecarlo">Monte Carlo</option>
            </select>
          </div>
          <div>
            <label className="meta">Description</label>
            <textarea className="input w-full h-20" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={!isValid || loading}>
            {loading ? 'Creating…' : '+ Create Run'}
          </button>
        </div>
      </div>
    </div>
  );
}