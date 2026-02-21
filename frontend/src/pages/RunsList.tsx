import { useNavigate } from 'react-router-dom';
import { useRuns } from '../hooks/useRuns';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency } from '../utils/format';

export default function RunsList() {
  const { data, loading, error } = useRuns();
  const navigate = useNavigate();

  if (loading) return <div className="card p-4"><div className="meta">Loading runs…</div></div>;
  if (error) return <div className="card p-4"><div className="meta">{error}</div></div>;

  return (
    <div>
      <div className="page-title mb-2">Runs</div>
      <div className="subline mb-4">All strategy runs</div>
      <DataTable
        columns={[
          { key: 'display_name', label: 'Run', render: (r: any) => r.display_name || r.id },
          { key: 'id', label: 'ID', muted: true },
          { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
          { key: 'run_type', label: 'Type' },
          { key: 'initial_capital', label: 'Initial', align: 'right', render: (r: any) => formatCurrency(r.initial_capital) },
          { key: 'description', label: 'Description' },
        ]}
        rows={data}
        rowKey={(r: any) => r.id}
        onRowClick={(r: any) => navigate(`/runs/${r.id}`)}
        emptyMessage="No runs found"
      />
    </div>
  );
}