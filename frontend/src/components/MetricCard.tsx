import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  subtitle?: string;
}

export default function MetricCard({ label, value, subtitle }: MetricCardProps) {
  return (
    <div className="card p-3">
      <div className="meta mb-1">{label}</div>
      <div className="text-xl font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {subtitle ? <div className="meta mt-1">{subtitle}</div> : null}
    </div>
  );
}