import logo from '../assets/edge-logo.svg';
import { useAdminInspection } from '../context/AdminInspectionContext';
import { useAuth } from '../auth/AuthContext';
import Button from '../components/Button';

export default function Topbar() {
  const { inspectionMode, inspectedUserEmail, endInspection } = useAdminInspection();
  const { logout } = useAuth();
  return (
    <header className="bg-neutral-950 border-b border-neutral-800 px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src={logo} alt="Edge Lab" className="w-4 h-4 opacity-80" />
        <span className="text-text-muted text-sm">Research Platform</span>
      </div>
      <div className="flex items-center gap-2">
        {inspectionMode ? (
          <div className="flex items-center gap-2">
            <span className="badge bg-neutral-800 text-text">Inspecting user: {inspectedUserEmail}</span>
            <button className="text-xs text-text-muted hover:text-text underline" onClick={endInspection}>Exit</button>
            <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
          </div>
        ) : (
          <input
            className="input w-64 rounded-lg border-neutral-800 placeholder:opacity-50 px-3 py-2"
            placeholder="Quick search (runs, trades)"
          />
        )}
        {!inspectionMode ? <Button variant="ghost" size="sm" onClick={logout}>Logout</Button> : null}
      </div>
    </header>
  );
}
