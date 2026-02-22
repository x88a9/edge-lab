import { useEffect, useState } from 'react';
import { useSystems } from '../hooks/useSystems';
import CreateStrategyModal from '../components/modals/CreateStrategyModal';
import CreateVariantModal from '../components/modals/CreateVariantModal';
import Toast from '../components/Toast';
import DataTable from '../components/DataTable';
import { listVariantsForSystem } from '../api/systems';
import type { Variant, System } from '../types';
import { useNavigate } from 'react-router-dom';
import { useRuns } from '../hooks/useRuns';
import Button from '../components/Button';

export default function SystemsPage() {
  const { data, loading, error, refetch } = useSystems();
  const [openStrategy, setOpenStrategy] = useState(false);
  const [openVariant, setOpenVariant] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: runsData } = useRuns();

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

  // Treat a specific "No systems found" error as an empty-state
  const isEmptyError = !!error && /no systems found/i.test(error);
  const showEmptyCard = data.length === 0 || isEmptyError;

  return (
    <div>
      <div className="page-title mb-1">Systems</div>
      <div className="subline">All systems in the workspace</div>
      <div className="border-b border-neutral-800 mb-4"></div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card p-3"><div className="meta">Total Systems</div><div className="text-lg font-semibold">{data.length}</div></div>
        <div className="card p-3"><div className="meta">Total Runs</div><div className="text-lg font-semibold">{(runsData || []).length}</div></div>
        <div className="card p-3"><div className="meta">Active Runs</div><div className="text-lg font-semibold">{(runsData || []).filter((r: any) => r.status === 'open').length}</div></div>
      </div>
      <div className="mb-3 flex justify-end">
        <Button variant="primary" onClick={() => setOpenStrategy(true)}>+ Create System</Button>
      </div>

      {loading ? (
        <div className="card p-4"><div className="meta">Loading systems…</div></div>
      ) : !isEmptyError && error ? (
        <div className="card p-4"><div className="meta text-danger">{error}</div></div>
      ) : showEmptyCard ? (
        <div className="card p-4 flex items-center justify-between">
          <div className="meta text-danger">No systems found</div>
        </div>
      ) : (
        <DataTable
          columns={[
            { key: 'display_name', label: 'System', render: (s: any) => s.display_name || s.name },
            { key: 'id', label: 'ID', muted: true },
            { key: 'asset', label: 'Asset' },
            { key: 'description', label: 'Description', render: (s: any) => s.description || '' },
            { key: 'created_at', label: 'Created', muted: true },
            { key: 'actions', label: 'Actions', render: (s: any) => (
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={(e: any) => { e.stopPropagation(); setSelectedSystemId(s.id); setOpenVariant(true); }}>+ New Variant</Button>
                <Button variant="ghost" onClick={(e: any) => { e.stopPropagation(); toggleVariants(s); }}>{expanded.has(s.id) ? 'Hide Variants' : 'Show Variants'}</Button>
              </div>
            ), align: 'right' },
          ]}
          rows={data}
          rowKey={(s: any) => s.id}
          onRowClick={(s: any) => navigate(`/systems/${s.id}`)}
        />
      )}

      {!loading && (!error || isEmptyError) && [...expanded].map((systemId) => {
        const variants = variantsBySystem[systemId] || [];
        const sys = data.find((s) => s.id === systemId);
        return (
          <div key={systemId} className="mt-4">
            <div className="section-title mb-2">Variants for {sys?.display_name || sys?.name || systemId}</div>
            { loadingVariants[systemId] ? (
              <div className="card p-4"><div className="meta">Loading variants…</div></div>
            ) : (
              <DataTable
                columns={[
                  { key: 'display_name', label: 'Variant', render: (v: any) => v.display_name || v.name },
                  { key: 'id', label: 'ID', muted: true },
                  { key: 'version', label: 'Version', render: (v: any) => v.version ?? v.version_number },
                  { key: 'description', label: 'Description' },
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
          onCreated={async () => {
            setToast('Variant created');
            try {
              const variants = await listVariantsForSystem(selectedSystemId);
              setVariantsBySystem((prev) => ({ ...prev, [selectedSystemId]: variants }));
            } catch {}
          }}
        />
      )}

      {toast && <Toast message={toast} onHide={() => setToast(null)} />}
    </div>
  );
}
