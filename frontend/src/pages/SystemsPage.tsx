import { useEffect, useState } from 'react';
import { useSystems } from '../hooks/useSystems';
import CreateStrategyModal from '../components/modals/CreateStrategyModal';
import CreateVariantModal from '../components/modals/CreateVariantModal';
import Toast from '../components/Toast';
import DataTable from '../components/DataTable';
import { listVariantsForSystem } from '../api/systems';
import type { Variant, System } from '../types';
import { useNavigate } from 'react-router-dom';

export default function SystemsPage() {
  const { data, loading, error, refetch } = useSystems();
  const [openStrategy, setOpenStrategy] = useState(false);
  const [openVariant, setOpenVariant] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const navigate = useNavigate();

  // Expanded systems and cached variants per system
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [variantsBySystem, setVariantsBySystem] = useState<Record<string, Variant[]>>({});
  const [loadingVariants, setLoadingVariants] = useState<Record<string, boolean>>({});

  const toggleVariants = async (system: System) => {
    const next = new Set(expanded);
    if (next.has(system.id)) {
      next.delete(system.id);
      setExpanded(next);
      return;
    }
    next.add(system.id);
    setExpanded(next);
    if (!variantsBySystem[system.id]) {
      setLoadingVariants((prev) => ({ ...prev, [system.id]: true }));
      try {
        const variants = await listVariantsForSystem(system.id);
        setVariantsBySystem((prev) => ({ ...prev, [system.id]: variants }));
      } catch (e) {
        console.warn('Failed to load variants for system', system.id, e);
      } finally {
        setLoadingVariants((prev) => ({ ...prev, [system.id]: false }));
      }
    }
  };

  if (loading) return <div className="card p-4"><div className="meta">Loading systems…</div></div>;
  if (error) return <div className="card p-4"><div className="meta text-danger">{error}</div></div>;

  return (
    <div>
      <div className="page-title mb-2">Strategies</div>
      <div className="subline mb-4">All strategies in the workspace</div>
      <div className="mb-3 flex justify-end">
        <button className="btn-primary" onClick={() => setOpenStrategy(true)}>+ New Strategy</button>
      </div>

      <DataTable
        columns={[
          { key: 'display_name', label: 'Strategy', render: (s: any) => s.display_name || s.name },
          { key: 'id', label: 'ID', muted: true },
          { key: 'asset', label: 'Asset' },
          { key: 'created_at', label: 'Created', muted: true },
          { key: 'actions', label: 'Actions', render: (s: any) => (
            <div className="flex gap-2 justify-end">
              <button className="btn" onClick={(e) => { e.stopPropagation(); setSelectedSystemId(s.id); setOpenVariant(true); }}>+ New Variant</button>
              <button className="btn" onClick={(e) => { e.stopPropagation(); toggleVariants(s); }}>{expanded.has(s.id) ? 'Hide Variants' : 'Show Variants'}</button>
            </div>
          ), align: 'right' },
        ]}
        rows={data}
        rowKey={(s: any) => s.id}
        onRowClick={(s: any) => navigate(`/systems/${s.id}`)}
      />

      {[...expanded].map((systemId) => {
        const variants = variantsBySystem[systemId] || [];
        const sys = data.find((s) => s.id === systemId);
        return (
          <div key={systemId} className="mt-4">
            <div className="section-title mb-2">Variants for {sys?.display_name || sys?.name || systemId}</div>
            {loadingVariants[systemId] ? (
              <div className="card p-4"><div className="meta">Loading variants…</div></div>
            ) : (
              <DataTable
                columns={[
                  { key: 'display_name', label: 'Variant', render: (v: any) => v.display_name || v.name },
                  { key: 'id', label: 'ID', muted: true },
                  { key: 'version', label: 'Version', render: (v: any) => v.version ?? v.version_number },
                ]}
                rows={variants}
                rowKey={(v: any) => v.id}
                onRowClick={(v: any) => navigate(`/variants/${v.id}`)}
                emptyMessage="No variants for this strategy yet"
              />
            )}
          </div>
        );
      })}

      {openStrategy && (
        <CreateStrategyModal
          open={openStrategy}
          onClose={() => setOpenStrategy(false)}
          onCreated={() => { setToast('Strategy created'); refetch(); }}
        />
      )}

      {openVariant && selectedSystemId && (
        <CreateVariantModal
          open={openVariant}
          strategyId={selectedSystemId}
          onClose={() => setOpenVariant(false)}
          onCreated={() => setToast('Variant created')}
        />
      )}

      {toast && <Toast message={toast} onHide={() => setToast(null)} />}
    </div>
  );
}