import { useEffect, useState } from 'react';
import { System } from '../types';
import { listSystems } from '../api/systems';

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
      setError(e?.response?.data?.detail ?? e.message);
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