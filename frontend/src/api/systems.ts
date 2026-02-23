import apiClient from './apiClient';
import { System, Variant, SystemAnalyticsSnapshot } from '../types';

export async function listSystems(): Promise<System[]> {
  const { data } = await apiClient.get('/systems');
  return data;
}

export async function getSystem(systemId: string): Promise<System> {
  const { data } = await apiClient.get(`/systems/${systemId}`);
  return data;
}

export async function listVariantsForSystem(systemId: string): Promise<Variant[]> {
  const { data } = await apiClient.get(`/systems/${systemId}/variants`);
  return data;
}

export async function createSystem(payload: {
  name: string;
  display_name: string;
  asset: string;
  description?: string;
}): Promise<System> {
  const { data } = await apiClient.post('/systems/', payload);
  return data;
}

export async function getSystemAnalytics(systemId: string): Promise<SystemAnalyticsSnapshot> {
  const { data } = await apiClient.get(`/systems/${systemId}/analytics`);
  return {
    aggregated_metrics: {
      mean_expectancy: data?.aggregated_metrics?.mean_expectancy ?? null,
      mean_log_growth: data?.aggregated_metrics?.mean_log_growth ?? null,
    },
    variant_count: data?.variant_count ?? 0,
    is_dirty: !!data?.is_dirty,
    updated_at: data?.updated_at,
  };
}

export async function computeSystemAnalytics(systemId: string): Promise<{ status: string }> {
  const { data } = await apiClient.post(`/systems/${systemId}/compute-analytics`);
  return data;
}
