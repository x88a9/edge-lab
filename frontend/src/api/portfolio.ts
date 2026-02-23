import apiClient from './apiClient';
import { PortfolioSnapshot } from '../types';

export async function listPortfolios(): Promise<Array<{
  id: string;
  name: string;
  allocation_mode: string;
  strategy_count: number;
  is_dirty: boolean;
  updated_at?: string;
}>> {
  const { data } = await apiClient.get('/portfolio/');
  return data;
}

export async function getPortfolio(portfolioId: string): Promise<PortfolioSnapshot> {
  const { data } = await apiClient.get(`/portfolio/${portfolioId}`);
  return {
    name: data?.name,
    allocation_mode: data?.allocation_mode,
    allocation_config: data?.allocation_config ?? null,
    combined_metrics: data?.combined_metrics,
    combined_equity: data?.combined_equity,
    strategy_count: data?.strategy_count ?? 0,
    is_dirty: !!data?.is_dirty,
    updated_at: data?.updated_at,
  };
}

export async function computePortfolio(portfolioId: string): Promise<{ status: string }> {
  const { data } = await apiClient.post(`/portfolio/${portfolioId}/compute`);
  return data;
}
