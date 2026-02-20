import { useEffect } from 'react';

export default function Toast({ message, onHide, duration = 3000 }: { message: string; onHide: () => void; duration?: number }) {
  useEffect(() => {
    const t = setTimeout(onHide, duration);
    return () => clearTimeout(t);
  }, [onHide, duration]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="card px-4 py-2 shadow-lg">
        <div className="meta">{message}</div>
      </div>
    </div>
  );
}