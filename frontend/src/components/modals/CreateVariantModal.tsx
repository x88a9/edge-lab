import { useState } from 'react';
import { createVariant } from '../../api/variants';

interface Props {
  open: boolean;
  strategyId: string;
  onClose: () => void;
  onCreated: (variant: any) => void;
}

export default function CreateVariantModal({ open, strategyId, onClose, onCreated }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [paramHash, setParamHash] = useState('');
  const [paramJson, setParamJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = strategyId && name.trim() && displayName.trim();

  const submit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        strategy_id: strategyId,
        name,
        display_name: displayName,
        version_number: Number(version) || 1,
        parameter_hash: paramHash || 'placeholder-hash',
        parameter_json: paramJson || '{"placeholder": true}',
      };
      const created = await createVariant(payload);
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
      <div className="card p-6 w-[560px]">
        <div className="section-title mb-4">New Variant</div>
        {error ? <div className="meta text-danger mb-3">{error}</div> : null}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="meta">Display Name</label>
            <input className="input w-full" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className="meta">Internal Name</label>
            <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="meta">Version</label>
            <input className="input w-full" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. 1" />
          </div>
          <div>
            <label className="meta">Parameter Hash</label>
            <input className="input w-full" value={paramHash} onChange={(e) => setParamHash(e.target.value)} placeholder="placeholder-hash" />
          </div>
          <div>
            <label className="meta">Parameter JSON</label>
            <textarea className="input w-full h-24" value={paramJson} onChange={(e) => setParamJson(e.target.value)} placeholder='{"placeholder": true}' />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={!isValid || loading}>
            {loading ? 'Creating…' : '+ Create Variant'}
          </button>
        </div>
      </div>
    </div>
  );
}