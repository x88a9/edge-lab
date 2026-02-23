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

export async function createPortfolio(payload: {
  name: string;
  allocation_mode: 'equal_weight' | 'kelly_weighted' | 'fixed_weight';
  allocation_config?: Record<string, any> | null;
}): Promise<{ id: string }> {
  const { data } = await apiClient.post('/portfolio/', payload);
  return data;
}
