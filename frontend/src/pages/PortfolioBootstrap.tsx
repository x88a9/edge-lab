import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';

export default function PortfolioBootstrap() {
  const { portfolioList, loading, error } = usePortfolio();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (error) return;
    if (portfolioList.length === 0) {
      navigate('/portfolio', { replace: true });
    } else if (portfolioList.length === 1) {
      navigate(`/portfolio/${portfolioList[0].id}`, { replace: true });
    } else {
      navigate('/portfolio', { replace: true });
    }
  }, [portfolioList, loading, error, navigate]);

  return <div className="card p-4"><div className="meta">Initializing…</div></div>;
}
