import apiClient from './apiClient';
import { Variant, Run } from '../types';

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