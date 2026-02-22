import { NavLink } from 'react-router-dom';
import logo from '../assets/edge-logo.svg';

export default function Sidebar() {
  const linkClass = ({ isActive }: { isActive: boolean }) => [
    'block px-4 py-2.5 transition-all duration-150',
    'border-b border-neutral-900',
    isActive
      ? 'bg-neutral-900 text-text relative'
      : 'text-text-muted hover:text-text hover:bg-neutral-900/60',
    isActive ? 'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-sky-800' : ''
  ].join(' ');

  return (
    <aside className="bg-neutral-950 border-r border-neutral-800 w-56 min-w-56">
      <div className="p-4 flex items-center gap-2">
        <img src={logo} alt="Edge Lab" className="w-5 h-5 opacity-90" />
        <span className="h1">Edge Lab</span>
      </div>
      <div className="border-b border-neutral-900" />
      <nav className="text-sm">
        <NavLink to="/systems" className={linkClass}>Systems</NavLink>
        <NavLink to="/variants" className={linkClass}>Variants</NavLink>
        <NavLink to="/runs" className={linkClass}>Runs</NavLink>
      </nav>
    </aside>
  );
}
