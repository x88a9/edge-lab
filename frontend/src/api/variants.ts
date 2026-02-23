import apiClient from './apiClient';
import { Variant, Run, VariantAnalyticsSnapshot } from '../types';

export async function listVariants(): Promise<Variant[]> {
  const { data } = await apiClient.get('/variants/');
  return data;
}

export async function getVariant(variantId: string): Promise<Variant> {
  const { data } = await apiClient.get(`/variants/${variantId}`);
  return data;
}

export async function listRunsForVariant(variantId: string): Promise<Run[]> {
  const { data } = await apiClient.get(`/variants/${variantId}/runs`);
  return data;
}

export async function createVariant(payload: {
  strategy_id: string;
  name: string;
  display_name: string;
  version_number: number;
  parameter_hash: string;
  parameter_json: string;
  description?: string;
}): Promise<Variant> {
  const { data } = await apiClient.post('/variants/', payload);
  return data;
}

export async function getVariantAnalytics(variantId: string): Promise<VariantAnalyticsSnapshot> {
  const { data } = await apiClient.get(`/variants/${variantId}/analytics`);
  return {
    aggregated_metrics: {
      mean_expectancy: data?.aggregated_metrics?.mean_expectancy ?? null,
      mean_log_growth: data?.aggregated_metrics?.mean_log_growth ?? null,
      mean_sharpe: data?.aggregated_metrics?.mean_sharpe ?? null,
      mean_max_drawdown: data?.aggregated_metrics?.mean_max_drawdown ?? null,
      std_expectancy: data?.aggregated_metrics?.std_expectancy ?? null,
      best_run_expectancy: data?.aggregated_metrics?.best_run_expectancy ?? null,
      worst_run_expectancy: data?.aggregated_metrics?.worst_run_expectancy ?? null,
    },
    run_count: data?.run_count ?? 0,
    is_dirty: !!data?.is_dirty,
    updated_at: data?.updated_at,
  };
}

export async function computeVariantAnalytics(variantId: string): Promise<{ status: string }> {
  const { data } = await apiClient.post(`/variants/${variantId}/compute-analytics`);
  return data;
}
