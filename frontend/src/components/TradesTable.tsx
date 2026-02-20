import { useMemo, useState } from 'react';

interface Trade {
  id: string;
  direction: 'long' | 'short';
  entry_price: number;
  exit_price?: number | null;
  stop_loss?: number | null;
  r_multiple?: number | null;
  is_win?: boolean | null;
  timestamp?: string | null;
  timeframe?: 'H1' | 'H4' | 'D1' | null;
}

interface Props {
  trades: Trade[];
  onChange?: (updated: Trade[]) => void;
  onDelete?: (id: string) => void;
}

export default function TradesTable({ trades, onChange, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Trade>>({});

  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return ta - tb;
    });
  }, [trades]);

  const startEdit = (t: Trade) => {
    setEditingId(t.id);
    setDraft({
      direction: t.direction,
      entry_price: t.entry_price,
      exit_price: t.exit_price ?? undefined,
      stop_loss: t.stop_loss ?? undefined,
      timestamp: t.timestamp ?? undefined,
      timeframe: t.timeframe ?? undefined,
      r_multiple: t.r_multiple ?? undefined,
      is_win: t.is_win ?? undefined,
    });
  };

  const applyEdit = () => {
    if (!editingId) return;
    const updated = sortedTrades.map((x) => (x.id === editingId ? { ...x, ...draft } as Trade : x));
    onChange?.(updated);
    setEditingId(null);
    setDraft({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };

  const handleDelete = (id: string) => {
    onDelete?.(id);
  };

  const fmt2 = (val: number | null | undefined) => {
    if (val == null) return '';
    return Number(val).toFixed(2);
  };

  return (
    <div className="card">
      <div className="section-title mb-2">Trades</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">Win/Loss</th>
              <th className="text-left p-2">Direction</th>
              <th className="text-right p-2">Entry</th>
              <th className="text-right p-2">Exit</th>
              <th className="text-right p-2">Stop</th>
              <th className="text-right p-2">R Multiple</th>
              <th className="text-left p-2">Timestamp</th>
              <th className="text-left p-2">Timeframe</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTrades.map((t, i) => {
              const win = t.is_win;
              const r = t.r_multiple;
              const editing = editingId === t.id;
              return (
                <tr key={t.id} style={{ borderLeft: `4px solid ${win == null ? 'transparent' : win ? '#16a34a' : '#dc2626'}` }}>
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{win == null ? '' : win ? 'Win' : 'Loss'}</td>
                  <td className="p-2">
                    {editing ? (
                      <select className="input" value={(draft.direction ?? t.direction) as any} onChange={(e) => setDraft((d) => ({ ...d, direction: e.target.value as any }))}>
                        <option value="long">Long</option>
                        <option value="short">Short</option>
                      </select>
                    ) : (
                      <span className="mono">{t.direction}</span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {editing ? (
                      <input className="input text-right w-24" type="number" step="0.01" value={draft.entry_price ?? t.entry_price ?? ''} onChange={(e) => setDraft((d) => ({ ...d, entry_price: e.target.value === '' ? undefined : Number(e.target.value) }))} />
                    ) : (
                      <span className="mono">{fmt2(t.entry_price)}</span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {editing ? (
                      <input className="input text-right w-24" type="number" step="0.01" value={draft.exit_price ?? t.exit_price ?? ''} onChange={(e) => setDraft((d) => ({ ...d, exit_price: e.target.value === '' ? undefined : Number(e.target.value) }))} />
                    ) : (
                      <span className="mono">{fmt2(t.exit_price ?? null)}</span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {editing ? (
                      <input className="input text-right w-24" type="number" step="0.01" value={draft.stop_loss ?? t.stop_loss ?? ''} onChange={(e) => setDraft((d) => ({ ...d, stop_loss: e.target.value === '' ? undefined : Number(e.target.value) }))} />
                    ) : (
                      <span className="mono">{fmt2(t.stop_loss ?? null)}</span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {r == null ? '' : (
                      <span className="font-bold" style={{ color: r > 0 ? '#16a34a' : r < 0 ? '#dc2626' : 'inherit' }}>{Number(r).toFixed(2)}</span>
                    )}
                  </td>
                  <td className="p-2">{t.timestamp ? new Date(t.timestamp).toLocaleString() : ''}</td>
                  <td className="p-2">{t.timeframe ?? ''}</td>
                  <td className="p-2">
                    {editing ? (
                      <div className="flex gap-2">
                        <button className="btn" onClick={cancelEdit}>Cancel</button>
                        <button className="btn-primary" onClick={applyEdit}>Save</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button className="btn" onClick={() => startEdit(t)}>Edit</button>
                        {onDelete && <button className="btn-danger" onClick={() => handleDelete(t.id)}>Delete</button>}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}