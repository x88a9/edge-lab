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
  const [statusChoice, setStatusChoice] = useState<'open' | 'finished'>('open');

  const saveSettings = async () => {
    if (statusChoice === 'finished') {
      setSaving(true);
      setError(null);
      try {
        await finishRun(runId);
        onFinished('finished');
        onClose();
      } catch (e: any) {
        setError(e?.response?.data?.detail ?? e.message);
      } finally {
        setSaving(false);
      }
    } else {
      // No backend update for switching to 'open'; just close settings.
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative card p-4 w-[460px]">
        <div className="section-title mb-2">Run Settings</div>
        <div className="space-y-3">
          <div>
            <div className="meta mb-1">Status</div>
            <select className="input w-full" value={statusChoice} onChange={(e) => setStatusChoice(e.target.value as any)}>
              <option value="open">Open</option>
              <option value="finished">Finished</option>
            </select>
            <div className="meta mt-1">Choosing "Finished" will prevent further changes.</div>
          </div>
          {/* Additional settings could be added here without backend changes, e.g., local preferences */}
        </div>
        {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving} onClick={saveSettings}>Save</button>
        </div>
      </div>
    </div>
  );
}