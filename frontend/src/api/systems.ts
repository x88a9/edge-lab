import apiClient from './apiClient';
import { System, Variant } from '../types';

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