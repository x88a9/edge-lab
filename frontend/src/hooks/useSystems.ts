import { useEffect, useState } from 'react';
import { System } from '../types';
import { listSystems } from '../api/systems';

function toErrorMessage(e: any): string {
  const detail = e?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    // FastAPI/Pydantic-style validation errors
    return detail.map((d: any) => d?.msg ?? JSON.stringify(d)).join('; ');
  }
  if (detail && typeof detail === 'object') return JSON.stringify(detail);
  return e?.message ?? 'Unknown error';
}

export function useSystems() {
  const [data, setData] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const systems = await listSystems();
      setData(systems);
    } catch (e: any) {
      setError(toErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error, refetch: fetch };
}