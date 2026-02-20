import { useEffect, useState } from 'react';
import { Run } from '../types';
import { listRuns } from '../api/runs';

export function useRuns() {
  const [data, setData] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const runs = await listRuns();
      setData(runs);
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