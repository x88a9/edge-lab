import { NavLink } from 'react-router-dom';
import logo from '../assets/edge-logo.svg';

export default function Sidebar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 border-b border-neutral-900 transition-colors ${isActive ? 'bg-neutral-900 text-text' : 'text-text-muted hover:text-text'} `;

  return (
    <aside className="bg-neutral-950 border-r border-neutral-800">
      <div className="p-4 flex items-center gap-2">
        <img src={logo} alt="Edge Lab" className="w-5 h-5 opacity-90" />
        <span className="h1">Edge Lab</span>
      </div>
      <nav className="text-sm animate-fade-in">
        <NavLink to="/systems" className={linkClass}>Systems</NavLink>
        <NavLink to="/variants" className={linkClass}>Variants</NavLink>
        <NavLink to="/runs" className={linkClass}>Runs</NavLink>
      </nav>
    </aside>
  );
}