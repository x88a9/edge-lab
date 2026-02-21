import { useState } from 'react';
import { createSystem } from '../../api/systems';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (system: any) => void;
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

export default function CreateStrategyModal({ open, onClose, onCreated }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [name, setName] = useState('');
  const [asset, setAsset] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = displayName.trim() && name.trim() && asset.trim();

  const submit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const payload: { name: string; display_name: string; asset: string; description?: string } = {
        name,
        display_name: displayName,
        asset,
      };
      if (description.trim()) {
        payload.description = description.trim();
      }
      const created = await createSystem(payload);
      onCreated(created);
      onClose();
    } catch (e: any) {
      setError(toErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="card p-6 w-[620px]">
        <div className="section-title mb-4">New System</div>
        {error ? <div className="meta text-danger mb-3">{error}</div> : null}
        <div className="space-y-3">
          <div>
            <label className="meta">Display Name</label>
            <input className="input w-full" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className="meta">Internal Name</label>
            <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="meta">Asset</label>
            <input className="input w-full" value={asset} onChange={(e) => setAsset(e.target.value)} />
          </div>
          <div>
            <label className="meta">Description (optional)</label>
            <textarea className="input w-full h-24" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={!isValid || loading}>
            {loading ? 'Creating…' : '+ Create System'}
          </button>
        </div>
      </div>
    </div>
  );
}