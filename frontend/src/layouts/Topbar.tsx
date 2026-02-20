import logo from '../assets/edge-logo.svg';

export default function Topbar() {
  return (
    <header className="bg-neutral-950 border-b border-neutral-800 p-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src={logo} alt="Edge Lab" className="w-4 h-4 opacity-80" />
        <span className="text-text-muted text-sm">Research Platform</span>
      </div>
      <div className="flex items-center gap-2">
        <input className="input w-64" placeholder="Quick search (runs, trades)" />
      </div>
    </header>
  );
}