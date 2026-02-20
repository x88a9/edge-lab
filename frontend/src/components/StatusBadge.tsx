export default function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  const cls = s === 'open' ? 'badge badge-open' : 'badge badge-closed';
  return <span className={cls}>{status}</span>;
}