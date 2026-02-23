import { useEffect, useState } from 'react';
import { Run } from '../types';
import { listRuns } from '../api/runs';
import { useAdminInspection } from '../context/AdminInspectionContext';
import { listUserRuns } from '../api/admin';

export function useRuns() {
  const [data, setData] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { inspectionMode, inspectedUserId } = useAdminInspection();

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      let runs: any[] = [];
      if (inspectionMode && inspectedUserId) {
        runs = await listUserRuns(inspectedUserId);
      } else {
        runs = await listRuns();
      }
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
  }, [inspectionMode, inspectedUserId]);

  return { data, loading, error, refetch: fetch };
}
