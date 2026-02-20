import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency } from '../utils/format';
import { getVariant, listRunsForVariant } from '../api/variants';
import { getSystem } from '../api/systems';

export default function VariantPage() {
  const { variantId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variant, setVariant] = useState<any>(null);
  const [systemName, setSystemName] = useState<string>('');
  const [runs, setRuns] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      if (!variantId) return;
      setLoading(true);
      setError(null);
      try {
        const v = await getVariant(variantId);
        if (cancelled) return;
        setVariant(v);
        // Fetch system display name
        try {
          const s = await getSystem(v.strategy_id);
          if (!cancelled) setSystemName(s.display_name || s.name || v.strategy_id);
        } catch {
          if (!cancelled) setSystemName(v.strategy_id);
        }
        // Fetch runs for variant
        const r = await listRunsForVariant(variantId);
        if (!cancelled) setRuns(r);
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.detail ?? e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [variantId]);

  if (loading) return <div className="card p-4"><div className="meta">Loading variant…</div></div>;
  if (error) return <div className="card p-4"><div className="meta text-danger">{error}</div></div>;
  if (!variant) return <div className="card p-4"><div className="meta">Variant not found</div></div>;

  const variantTitle = variant.display_name || variant.name || variant.id;

  return (
    <div>
      <div className="page-title mb-2">{variantTitle}</div>
      <div className="subline mb-4">Strategy: {systemName} • Version: {variant.version ?? variant.version_number}</div>

      <div className="card p-0">
        <div className="card-header px-4 py-3 flex items-center justify-between">
          <div className="card-title">Runs for this variant</div>
        </div>
        <div className="p-0">
          <DataTable
            columns={[
              { key: 'display_name', label: 'Run', render: (r: any) => r.display_name || r.id },
              { key: 'id', label: 'ID', muted: true },
              { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
              { key: 'run_type', label: 'Type' },
              { key: 'initial_capital', label: 'Initial', align: 'right', render: (r: any) => formatCurrency(r.initial_capital) },
            ]}
            rows={runs}
            rowKey={(r: any) => r.id}
            onRowClick={(r: any) => navigate(`/runs/${r.id}`)}
            emptyMessage="No runs found for this variant"
          />
        </div>
      </div>
    </div>
  );
}