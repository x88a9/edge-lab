import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import { getSystem, listVariantsForSystem } from '../api/systems';
import CreateVariantModal from '../components/modals/CreateVariantModal';
import Button from '../components/Button';

export default function SystemPage() {
  const { systemId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [system, setSystem] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [openVariant, setOpenVariant] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      if (!systemId) return;
      setLoading(true);
      setError(null);
      try {
        const s = await getSystem(systemId);
        if (cancelled) return;
        setSystem(s);
        const v = await listVariantsForSystem(systemId);
        if (!cancelled) setVariants(v);
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.detail ?? e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [systemId]);

  if (loading) return <div className="card p-4"><div className="meta">Loading strategy…</div></div>;
  if (error) return <div className="card p-4"><div className="meta text-danger">{error}</div></div>;
  if (!system) return <div className="card p-4"><div className="meta">Strategy not found</div></div>;

  const systemTitle = system.display_name || system.name || system.id;

  return (
    <div>
      <div className="page-title mb-2">{systemTitle}</div>
      <div className="subline mb-4">Asset: {system.asset} • ID: {system.id}</div>

      {system.description ? (
        <div className="card p-4 mb-4">
          <div className="card-title mb-2">Description</div>
          <div className="meta whitespace-pre-wrap">{system.description}</div>
        </div>
      ) : null}

      <div className="card p-0">
        <div className="card-header px-4 py-3 flex items-center justify-between">
          <div className="card-title">Variants for this system</div>
          <div>
            <Button variant="primary" onClick={() => setOpenVariant(true)}>+ New Variant</Button>
          </div>
        </div>
        <div className="p-0">
          <DataTable
            columns={[
              { key: 'display_name', label: 'Variant', render: (v: any) => v.display_name || v.name },
              { key: 'id', label: 'ID', muted: true },
              { key: 'version', label: 'Version', render: (v: any) => v.version ?? v.version_number },
            ]}
            rows={variants}
            rowKey={(v: any) => v.id}
            onRowClick={(v: any) => navigate(`/variants/${v.id}`)}
            emptyMessage="No variants found for this strategy"
          />
        </div>
      </div>

      {openVariant && (
        <CreateVariantModal
          open={openVariant}
          strategyId={system.id}
          onClose={() => setOpenVariant(false)}
          onCreated={async () => {
            try {
              const refreshed = await listVariantsForSystem(system.id);
              setVariants(refreshed);
            } catch {}
          }}
        />
      )}
    </div>
  );
}
