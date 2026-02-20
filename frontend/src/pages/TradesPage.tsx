import { useEffect, useState } from 'react';
import { Trade } from '../types';
import { listTrades } from '../api/trades';
import DataTable from '../components/DataTable';
import { formatFloat, formatPercent, formatDate } from '../utils/format';

export default function TradesPage() {
  const [data, setData] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTrades()
      .then(setData)
      .catch((e) => setError(e?.response?.data?.detail ?? e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card p-4"><div className="meta">Loading trades…</div></div>;
  if (error) return <div className="card p-4"><div className="meta">{error}</div></div>;

  return (
    <div>
      <div className="page-title mb-2">All Trades</div>
      <div className="subline mb-4">Executed trades across runs</div>
      <DataTable
        columns={[
          { key: 'run_id', label: 'Run', muted: true },
          { key: 'entry_price', label: 'Entry', align: 'right', render: (t: any) => formatFloat(t.entry_price, 5) },
          { key: 'exit_price', label: 'Exit', align: 'right', render: (t: any) => formatFloat(t.exit_price, 5) },
          { key: 'size', label: 'Size', align: 'right' },
          { key: 'direction', label: 'Side', render: (t: any) => (
            <span className={t.direction === 'long' ? 'text-success' : 'text-danger'}>{t.direction}</span>
          ) },
          { key: 'raw_return', label: 'Return', align: 'right', render: (t: any) => (
            <span className={t.raw_return >= 0 ? 'text-success' : 'text-danger'}>{formatPercent(t.raw_return, 2)}</span>
          ) },
          { key: 'log_return', label: 'Log Return', align: 'right', render: (t: any) => formatFloat(t.log_return, 6) },
          { key: 'created_at', label: 'Created', render: (t: any) => formatDate(t.created_at) },
        ]}
        rows={data}
        rowKey={(t: any) => t.id}
        emptyMessage="No trades found"
      />
    </div>
  );
}