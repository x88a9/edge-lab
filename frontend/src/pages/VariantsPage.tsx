import { useEffect, useState } from 'react';
import { useVariants } from '../hooks/useVariants';
import CreateRunModal from '../components/modals/CreateRunModal';
import Toast from '../components/Toast';
import { getSystem } from '../api/systems';
import DataTable from '../components/DataTable';
import { useNavigate } from 'react-router-dom';

export default function VariantsPage() {
  const { data, loading, error } = useVariants();
  const [openRun, setOpenRun] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [strategyNames, setStrategyNames] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const ids = Array.from(new Set(data.map((v) => v.strategy_id))).filter(Boolean);
    if (!ids.length) return;
    let cancelled = false;
    Promise.all(ids.map((id) => getSystem(id).then((s) => [id, s.display_name || s.name] as const).catch(() => [id, id] as const)))
      .then((entries) => {
        if (cancelled) return;
        setStrategyNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      });
    return () => { cancelled = true; };
  }, [data]);

  if (loading) return <div className="card p-4"><div className="meta">Loading variants…</div></div>;
  if (error) return <div className="card p-4"><div className="meta text-danger">{error}</div></div>;

  return (
    <div>
      <div className="page-title mb-1">Variants</div>
      <div className="subline">All variants</div>
      <div className="border-b border-neutral-800 mb-4"></div>

      <DataTable
        columns={[
          { key: 'display_name', label: 'Variant', render: (v: any) => v.display_name || v.name },
          { key: 'id', label: 'ID', muted: true },
          { key: 'strategy_id', label: 'Strategy', render: (v: any) => strategyNames[v.strategy_id] || v.strategy_id },
          { key: 'version', label: 'Version', render: (v: any) => v.version ?? v.version_number },
          { key: 'description', label: 'Description' },
          { key: 'actions', label: 'Actions', render: (v: any) => (
            <div className="flex justify-end">
              <button className="btn" onClick={(e) => { e.stopPropagation(); setSelectedVariantId(v.id); setOpenRun(true); }}>+ New Run</button>
            </div>
          ), align: 'right' },
        ]}
        rows={data}
        rowKey={(v: any) => v.id}
        onRowClick={(v: any) => navigate(`/variants/${v.id}`)}
      />

      {openRun && selectedVariantId && (
        <CreateRunModal
          open={openRun}
          variantId={selectedVariantId}
          onClose={() => setOpenRun(false)}
          onCreated={() => setToast('Run created')}
        />
      )}

      {toast && <Toast message={toast} onHide={() => setToast(null)} />}
    </div>
  );
}
