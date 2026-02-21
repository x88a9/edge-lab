import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency } from '../utils/format';
import { getVariant, listRunsForVariant } from '../api/variants';
import { getSystem } from '../api/systems';
import CreateRunModal from '../components/modals/CreateRunModal';

export default function VariantPage() {
  const { variantId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variant, setVariant] = useState<any>(null);
  const [systemName, setSystemName] = useState<string>('');
  const [runs, setRuns] = useState<any[]>([]);
  const [openRun, setOpenRun] = useState(false);

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
  if (!variant) return null;

  return (
    <div>
      <div className="page-title mb-2">{variant.display_name || variant.name}</div>
      <div className="subline mb-4">Variant v{variant.version}</div>

      {variant.description && (
        <div className="card p-4 mb-4">
          <div className="card-title mb-2">Description</div>
          <div className="meta whitespace-pre-wrap">{variant.description}</div>
        </div>
      )}

      <div className="card p-0">
        <div className="card-header px-4 py-3 flex items-center justify-between">
          <div className="card-title">Runs for this variant</div>
          <div>
            <button className="btn" onClick={() => setOpenRun(true)}>+ New Run</button>
          </div>
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

      {openRun && variantId && (
        <CreateRunModal
          open={openRun}
          variantId={variantId}
          onClose={() => setOpenRun(false)}
          onCreated={async () => {
            try {
              const refreshed = await listRunsForVariant(variantId);
              setRuns(refreshed);
            } catch {}
          }}
        />
      )}
    </div>
  );
}