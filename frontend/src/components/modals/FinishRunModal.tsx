import { useState } from 'react';
import { finishRun } from '../../api/runs';

interface Props {
  runId: string;
  open: boolean;
  onClose: () => void;
  onFinished: (status: string) => void;
}

export default function FinishRunModal({ runId, open, onClose, onFinished }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const { status } = await finishRun(runId);
      onFinished('finished');
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative card p-4 w-[420px]">
        <div className="section-title mb-2">Finish Run</div>
        <div className="body-text">Mark this run as <span className="text-accent">finished</span>? This will prevent further changes.</div>
        {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving} onClick={submit}>Confirm</button>
        </div>
      </div>
    </div>
  );
}