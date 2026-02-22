import { useEffect, useMemo, useState } from 'react';
import { Trade } from '../types';
import { listTrades } from '../api/trades';
import DataTable from '../components/DataTable';
import { formatFloat, formatPercent, formatDate } from '../utils/format';
import Button from '../components/Button';

export default function TradesPage() {
  const [data, setData] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dir, setDir] = useState<'all' | 'long' | 'short'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    listTrades()
      .then(setData)
      .catch((e) => setError(e?.response?.data?.detail ?? e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card p-4"><div className="meta">Loading trades…</div></div>;
  if (error) return <div className="card p-4"><div className="meta">{error}</div></div>;

  const filtered = useMemo(() => {
    return (data || []).filter((t) => {
      if (dir !== 'all' && t.direction !== dir) return false;
      if (search && !(t.run_id?.includes(search) || t.timeframe?.includes(search))) return false;
      return true;
    });
  }, [data, dir, search]);

  return (
    <div>
      <div className="page-title mb-2">All Trades</div>
      <div className="subline mb-2">Executed trades across runs</div>
      <div className="card p-3 mb-4 flex items-center gap-3">
        <div>
          <label className="meta">Direction</label>
          <select className="input" value={dir} onChange={(e) => setDir(e.target.value as any)}>
            <option value="all">All</option>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="meta">Search (Run / Timeframe)</label>
          <input className="input w-full" placeholder="e.g. cfecb or D1" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <DataTable
        columns={[
          { key: 'timestamp', label: 'Timestamp', render: (t: any) => t.timestamp ? formatDate(t.timestamp) : '—' },
          { key: 'direction', label: 'Direction', render: (t: any) => (
            <span className={t.direction === 'long' ? 'text-[#9acd92]' : 'text-[#e29b9b]'}>{t.direction}</span>
          ) },
          { key: 'entry_price', label: 'Entry', align: 'right', render: (t: any) => formatFloat(t.entry_price, 5) },
          { key: 'exit_price', label: 'Exit', align: 'right', render: (t: any) => formatFloat(t.exit_price, 5) },
          { key: 'size', label: 'Size', align: 'right' },
          { key: 'r_multiple', label: 'R Multiple', align: 'right', render: (t: any) => (
            <span className={Number(t.r_multiple ?? 0) >= 0 ? 'text-[#9acd92]' : 'text-[#e29b9b]'}>{formatFloat(t.r_multiple ?? 0, 3)}</span>
          ) },
          { key: 'timeframe', label: 'TF', muted: true },
          { key: 'run_id', label: 'Run', muted: true },
        ]}
        rows={filtered}
        rowKey={(t: any) => t.id}
        emptyMessage="No trades found"
      />
    </div>
  );
}
