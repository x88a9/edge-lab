import { useState } from 'react';
import { Trade } from '../types';
import { updateTrade, deleteTrade } from '../api/trades';

interface Props {
  trades: Trade[];
  onChange: (next: Trade[]) => void;
}

export default function TradesTable({ trades, onChange }: Props) {
  const [editing, setEditing] = useState<Record<string, Partial<Trade>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const startEdit = (t: Trade) => {
    setEditing((e) => ({ ...e, [t.id]: { ...t } }));
  };

  const cancelEdit = (id: string) => {
    setEditing((e) => {
      const next = { ...e };
      delete next[id];
      return next;
    });
  };

  const commitEdit = async (id: string) => {
    const draft = editing[id];
    if (!draft) return;
    setSaving(id);
    try {
      await updateTrade(id, {
        entry_price: Number(draft.entry_price),
        exit_price: Number(draft.exit_price),
        size: Number(draft.size),
        direction: draft.direction as 'long' | 'short',
      });
      onChange(
        trades.map((t) => (t.id === id ? { ...t, ...draft } as Trade : t))
      );
      cancelEdit(id);
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? e.message);
    } finally {
      setSaving(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete trade?')) return;
    setSaving(id);
    try {
      await deleteTrade(id);
      onChange(trades.filter((t) => t.id !== id));
    } catch (e: any) {
      alert(e?.response?.data?.detail ?? e.message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Entry</th>
            <th>Exit</th>
            <th>Size</th>
            <th>Dir</th>
            <th>Raw</th>
            <th>Log</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="animate-fade-in">
          {trades.map((t) => {
            const isEditing = !!editing[t.id];
            const draft = editing[t.id] || {};
            return (
              <tr key={t.id} className="hover:bg-neutral-800/40 transition-all">
                <td>
                  {isEditing ? (
                    <input
                      className="input w-24"
                      type="number"
                      value={draft.entry_price as number}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          [t.id]: { ...draft, entry_price: Number(e.target.value) },
                        }))
                      }
                    />
                  ) : (
                    t.entry_price.toFixed(5)
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      className="input w-24"
                      type="number"
                      value={draft.exit_price as number}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          [t.id]: { ...draft, exit_price: Number(e.target.value) },
                        }))
                      }
                    />
                  ) : (
                    t.exit_price.toFixed(5)
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      className="input w-20"
                      type="number"
                      value={draft.size as number}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          [t.id]: { ...draft, size: Number(e.target.value) },
                        }))
                      }
                    />
                  ) : (
                    t.size
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <select
                      className="input w-24"
                      value={draft.direction as string}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          [t.id]: { ...draft, direction: e.target.value as any },
                        }))
                      }
                    >
                      <option value="long">long</option>
                      <option value="short">short</option>
                    </select>
                  ) : (
                    t.direction
                  )}
                </td>
                <td className="text-text-muted">{t.raw_return.toFixed(6)}</td>
                <td className="text-text-muted">{t.log_return.toFixed(6)}</td>
                <td className="text-right">
                  {isEditing ? (
                    <div className="flex justify-end gap-2">
                      <button className="btn" onClick={() => cancelEdit(t.id)}>
                        Cancel
                      </button>
                      <button
                        className="btn-primary"
                        disabled={saving === t.id}
                        onClick={() => commitEdit(t.id)}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button className="btn" onClick={() => startEdit(t)}>
                        Edit
                      </button>
                      <button
                        className="btn-danger"
                        disabled={saving === t.id}
                        onClick={() => remove(t.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}