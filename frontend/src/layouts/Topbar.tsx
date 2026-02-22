import logo from '../assets/edge-logo.svg';

export default function Topbar() {
  return (
    <header className="bg-neutral-950 border-b border-neutral-800 px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src={logo} alt="Edge Lab" className="w-4 h-4 opacity-80" />
        <span className="text-text-muted text-sm">Research Platform</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          className="input w-64 rounded-lg border-neutral-800 placeholder:opacity-50 px-3 py-2"
          placeholder="Quick search (runs, trades)"
        />
      </div>
    </header>
  );
}
