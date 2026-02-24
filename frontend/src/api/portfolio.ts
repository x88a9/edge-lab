import apiClient from './apiClient';
import { PortfolioSnapshot } from '../types';

export async function listPortfolios(): Promise<Array<{
  id: string;
  name: string;
  is_default: boolean;
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

export async function createPortfolio(payload: { name: string }): Promise<{ id: string }> {
  const { data } = await apiClient.post('/portfolio/', payload);
  return data;
}

export async function deletePortfolio(portfolioId: string): Promise<{ status: string }> {
  const { data } = await apiClient.delete(`/portfolio/${portfolioId}`);
  return data;
}

export async function moveSystemToPortfolio(portfolioId: string, strategyId: string): Promise<{ status: string }> {
  const { data } = await apiClient.put(`/portfolio/${portfolioId}/systems/${strategyId}`);
  return data;
}
