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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = name.trim().length > 0;

  if (!open) return null;

  const submit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createPortfolio({ name });
      onCreated(created.id);
      onClose();
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 409) setError('Integritätskonflikt');
      else setError(e?.response?.data?.detail ?? e.message);
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
