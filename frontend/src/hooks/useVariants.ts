import { useEffect, useState } from 'react';
import { Variant } from '../types';
import { listVariants } from '../api/variants';
import { useAdminInspection } from '../context/AdminInspectionContext';
import { listUserVariants } from '../api/admin';

export function useVariants() {
  const [data, setData] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { inspectionMode, inspectedUserId } = useAdminInspection();

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      let variants: any[] = [];
      if (inspectionMode && inspectedUserId) {
        variants = await listUserVariants(inspectedUserId);
      } else {
        variants = await listVariants();
      }
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
  }, [inspectionMode, inspectedUserId]);

  return { data, loading, error, refetch: fetch };
}
