import { createContext, useContext, useEffect, useState } from 'react';
import { listPortfolios } from '../api/portfolio';

interface PortfolioSummary {
  id: string;
  name: string;
  allocation_mode: string;
  strategy_count: number;
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

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listPortfolios();
      setList(list);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

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
