import { createContext, useContext, useEffect, useState } from 'react';
import { listPortfolios } from '../api/portfolio';
import { useAdminInspection } from './AdminInspectionContext';
import { listUserPortfolios } from '../api/admin';
import { useAuth } from '../auth/AuthContext';

interface PortfolioSummary {
  id: string;
  name: string;
  is_default: boolean;
  is_dirty: boolean;
  updated_at?: string;
}

interface PortfolioState {
  portfolioList: PortfolioSummary[];
  currentPortfolioId: string | null;
  setCurrentPortfolioId: (id: string | null) => void;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const Ctx = createContext<PortfolioState | null>(null);

export function PortfolioProvider({ children }: { children: any }) {
  const [portfolioList, setList] = useState<PortfolioSummary[]>([]);
  const [currentPortfolioId, setCurrentPortfolioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { inspectionMode, inspectedUserId } = useAdminInspection();
  const { token } = useAuth();

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setList([]);
        setError(null);
        return;
      }
      let list: PortfolioSummary[] = [];
      if (inspectionMode && inspectedUserId) {
        list = await listUserPortfolios(inspectedUserId);
      } else {
        list = await listPortfolios();
      }
      setList(list);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 400) setError('Ungültige Anfrage');
      else if (status === 409) setError('Integritätskonflikt');
      else setError(e?.response?.data?.detail ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [inspectionMode, inspectedUserId, token]);

  return (
    <Ctx.Provider value={{ portfolioList, currentPortfolioId, setCurrentPortfolioId, loading, error, refetch: fetch }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}
