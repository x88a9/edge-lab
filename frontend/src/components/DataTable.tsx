import { ReactNode } from 'react';

type Align = 'left' | 'right';

interface Column<Row> {
  key: string;
  label: string;
  align?: Align;
  muted?: boolean;
  render?: (row: Row) => ReactNode;
}

interface Props<Row> {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  onRowClick?: (row: Row) => void;
  emptyMessage?: string;
}

export default function DataTable<Row>({ columns, rows, rowKey, onRowClick, emptyMessage = 'No data available' }: Props<Row>) {
  if (!rows?.length) {
    return (
      <div className="card p-6 text-center">
        <div className="meta">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.align === 'right' ? 'text-right' : 'text-left'}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className={onRowClick ? 'cursor-pointer' : ''} onClick={() => onRowClick?.(row)}>
              {columns.map((col) => {
                const content = col.render ? col.render(row) : (row as any)[col.key];
                const alignClass = col.align === 'right' ? 'text-right font-mono' : '';
                const mutedClass = col.muted ? 'text-text-muted' : '';
                return (
                  <td key={col.key} className={`${alignClass} ${mutedClass}`}>{content}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}