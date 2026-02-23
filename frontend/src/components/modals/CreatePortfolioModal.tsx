import { useState } from 'react';
import { createPortfolio } from '../../api/portfolio';
import Button from '../Button';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

export default function CreatePortfolioModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'equal_weight' | 'kelly_weighted' | 'fixed_weight'>('equal_weight');
  const [configJson, setConfigJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = name.trim().length > 0 && !!mode;

  if (!open) return null;

  const submit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      let cfg: any = undefined;
      if (mode === 'fixed_weight') {
        try {
          cfg = configJson ? JSON.parse(configJson) : {};
        } catch {
          setError('Invalid JSON for allocation config');
          setLoading(false);
          return;
        }
      }
      const created = await createPortfolio({
        name,
        allocation_mode: mode,
        allocation_config: mode === 'fixed_weight' ? cfg : undefined,
      });
      onCreated(created.id);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="card p-6 w-[640px]">
        <div className="section-title mb-4">New Portfolio</div>
        {error ? <div className="meta text-danger mb-3">{error}</div> : null}
        <div className="space-y-3">
          <div>
            <label className="meta">Name</label>
            <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="meta">Allocation Mode</label>
            <select className="input w-full" value={mode} onChange={(e) => setMode(e.target.value as any)}>
              <option value="equal_weight">Equal Weight</option>
              <option value="kelly_weighted">Kelly Weighted</option>
              <option value="fixed_weight">Fixed Weight</option>
            </select>
          </div>
          {mode === 'fixed_weight' && (
            <div>
              <label className="meta">Allocation Config (JSON)</label>
              <textarea className="input w-full h-24" value={configJson} onChange={(e) => setConfigJson(e.target.value)} placeholder='{"<strategy_id>": 0.25, "...": 0.75}' />
            </div>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn" onClick={onClose} disabled={loading}>Cancel</button>
          <Button variant="primary" onClick={submit} disabled={!isValid || loading}>
            {loading ? 'Creating…' : '+ Create Portfolio'}
          </Button>
        </div>
      </div>
    </div>
  );
}
