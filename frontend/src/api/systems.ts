import client from './client';
import { System, Variant } from '../types';

export async function listSystems(): Promise<System[]> {
  const { data } = await client.get('/systems');
  return data;
}

export async function getSystem(systemId: string): Promise<System> {
  const { data } = await client.get(`/systems/${systemId}`);
  return data;
}

export async function listVariantsForSystem(systemId: string): Promise<Variant[]> {
  const { data } = await client.get(`/systems/${systemId}/variants`);
  return data;
}

export async function createSystem(payload: {
  user_id: string;
  name: string;
  display_name: string;
  asset: string;
}): Promise<System> {
  const { data } = await client.post('/systems', payload);
  return data;
}