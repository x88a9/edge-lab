import { useState, ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function CollapsibleSection({ title, children, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="section-title">{title}</div>
        <button className="btn" onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Show'}</button>
      </div>
      {open ? (
        <div>{children}</div>
      ) : null}
    </div>
  );
}