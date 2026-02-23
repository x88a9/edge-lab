import { useEffect, useState } from 'react';
import { listAdminUsers, createAdminUser, activateUser, deactivateUser, resetUserPassword } from '../api/admin';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import { useAuth } from '../auth/AuthContext';
import { useAdminInspection } from '../context/AdminInspectionContext';

export default function AdminUsersPage() {
  const { currentUser } = useAuth();
  const { inspectionMode, startInspection, endInspection } = useAdminInspection();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalId, setModalId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminUsers();
      setRows(res);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refetch(); }, []);

  if (!currentUser?.is_admin) return null;

  return (
    <div>
      <div className="page-title mb-1">Admin Users</div>
      <div className="subline">Manage user accounts</div>
      <div className="border-b border-neutral-800 mb-4"></div>

      <div className="card p-4 mb-4">
        <div className="section-title mb-2">Create User</div>
        {error ? <div className="meta text-danger mb-2">{error}</div> : null}
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="meta">Email</label>
            <input className="input w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="meta">Password</label>
            <input className="input w-full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input id="isAdmin" type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
            <label htmlFor="isAdmin" className="meta">Admin</label>
          </div>
          <div className="flex items-center gap-2">
            <input id="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <label htmlFor="isActive" className="meta">Active</label>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            variant="primary"
            disabled={saving || inspectionMode}
            onClick={async () => {
              setSaving(true);
              try {
                await createAdminUser({ email, password, is_admin: isAdmin, is_active: isActive });
                setEmail(''); setPassword(''); setIsAdmin(false); setIsActive(true);
                await refetch();
              } catch (e: any) {
                setError(e?.response?.data?.detail ?? e.message);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'email', label: 'Email', render: (u: any) => (<div className="flex items-center gap-2"><span>{u.email}</span>{currentUser?.email === u.email ? <span className="badge">current user</span> : null}</div>) },
          { key: 'is_admin', label: 'Admin' },
          { key: 'is_active', label: 'Active' },
          { key: 'created_at', label: 'Created' },
          {
            key: 'actions',
            label: 'Actions',
            render: (u: any) => (
              <div className="flex gap-2 justify-end">
                <Button
                  variant="secondary"
                  disabled={inspectionMode}
                  onClick={async () => {
                    try {
                      if (u.is_active) await deactivateUser(u.id);
                      else await activateUser(u.id);
                      await refetch();
                    } catch (e: any) {
                      setError(e?.response?.data?.detail ?? e.message);
                    }
                  }}
                >
                  {u.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="ghost" disabled={inspectionMode} onClick={() => { setModalId(u.id); setNewPassword(''); }}>Reset Password</Button>
                {currentUser?.email !== u.email ? (
                  <Button variant="ghost" onClick={() => startInspection(u.id, u.email)}>Inspect</Button>
                ) : null}
              </div>
            )
          }
        ]}
        rows={rows}
        rowKey={(u: any) => u.id}
      />

      {modalId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="card p-4 w-[420px] relative z-50">
            <div className="section-title mb-2">Reset Password</div>
            <input className="input w-full" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setModalId(null)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={async () => {
                  try {
                    await resetUserPassword(modalId, newPassword);
                    setModalId(null);
                  } catch (e: any) {
                    setError(e?.response?.data?.detail ?? e.message);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
