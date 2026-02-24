import apiClient from './apiClient';

export async function getAdminOverview(): Promise<{
  total_users: number;
  total_strategies: number;
  total_variants: number;
  total_runs: number;
  total_trades: number;
  total_portfolios: number;
}> {
  const { data } = await apiClient.get('/admin/overview');
  return data;
}

export async function listAdminUsers(): Promise<Array<{
  id: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}>> {
  const { data } = await apiClient.get('/admin/users');
  return data;
}

export async function createAdminUser(input: { email: string; password: string; is_admin: boolean; is_active: boolean }): Promise<{ id: string }> {
  const { data } = await apiClient.post('/admin/users', input);
  return data;
}

export async function activateUser(userId: string): Promise<{ status: string }> {
  const { data } = await apiClient.put(`/admin/users/${userId}/activate`);
  return data;
}

export async function deactivateUser(userId: string): Promise<{ status: string }> {
  const { data } = await apiClient.put(`/admin/users/${userId}/deactivate`);
  return data;
}

export async function resetUserPassword(userId: string, new_password: string): Promise<{ status: string }> {
  const { data } = await apiClient.put(`/admin/users/${userId}/reset-password`, { new_password });
  return data;
}

export async function listUserSystems(userId: string): Promise<any[]> {
  const { data } = await apiClient.get(`/admin/users/${userId}/systems`);
  return data;
}

export async function listUserVariants(userId: string): Promise<any[]> {
  const { data } = await apiClient.get(`/admin/users/${userId}/variants`);
  return data;
}

export async function listUserRuns(userId: string): Promise<any[]> {
  const { data } = await apiClient.get(`/admin/users/${userId}/runs`);
  return data;
}

export async function listUserRunTrades(userId: string, runId: string): Promise<any[]> {
  const { data } = await apiClient.get(`/admin/users/${userId}/runs/${runId}/trades`);
  return data;
}

export async function listUserPortfolios(userId: string): Promise<Array<{
  id: string;
  name: string;
  is_default: boolean;
  is_dirty: boolean;
  updated_at?: string;
}>> {
  const { data } = await apiClient.get(`/admin/users/${userId}/portfolios`);
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    is_default: !!p.is_default,
    is_dirty: !!p.is_dirty,
    updated_at: p.updated_at,
  }));
}
