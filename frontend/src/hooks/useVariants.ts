import { useEffect, useState } from 'react';
import { Variant } from '../types';
import { listVariants } from '../api/variants';

export function useVariants() {
  const [data, setData] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const variants = await listVariants();
      setData(variants);
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