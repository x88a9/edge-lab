import { Link } from 'react-router-dom';

interface Crumb {
  label: string;
  to?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="meta flex items-center gap-2 mb-2">
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-2">
          {c.to ? <Link className="hover:underline" to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
          {i < items.length - 1 ? <span className="opacity-50">/</span> : null}
        </span>
      ))}
    </nav>
  );
}
