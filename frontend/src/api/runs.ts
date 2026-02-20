import client from './client';
import { Run, MetricsSnapshot, EquityPoint, Trade } from '../types';

export async function listRuns(): Promise<Run[]> {
  const { data } = await client.get('/runs/');
  return data;
}

export async function getRun(runId: string): Promise<Run> {
  const { data } = await client.get(`/runs/${runId}`);
  return data;
}

export async function listTradesForRun(runId: string): Promise<Trade[]> {
  const { data } = await client.get(`/runs/${runId}/trades`);
  return data;
}

export async function getMetrics(runId: string): Promise<MetricsSnapshot> {
  const { data } = await client.get(`/runs/${runId}/metrics`);
  return data;
}

export async function getEquity(runId: string): Promise<EquityPoint[]> {
  const { data } = await client.get(`/runs/${runId}/equity`);
  return data;
}

export async function getWalkForward(runId: string): Promise<any> {
  const { data } = await client.get(`/runs/${runId}/walk-forward`);
  return data;
}

export async function getRegimeDetection(runId: string): Promise<any> {
  const { data } = await client.get(`/runs/${runId}/regime-detection`);
  return data;
}

export async function getMonteCarlo(runId: string): Promise<any> {
  const { data } = await client.get(`/runs/${runId}/monte-carlo`);
  return data;
}

export async function createRun(payload: {
  variant_id: string;
  display_name: string;
  initial_capital: number;
  run_type: 'backtest' | 'forward' | 'montecarlo';
}): Promise<Run> {
  const { data } = await client.post('/runs', payload);
  return data;
}

// Helper to mark a run as finished (best-effort based on backend style)
export async function finishRun(runId: string): Promise<{ status: string }> {
  const { data } = await client.put(`/runs/${runId}`, null, {
    params: { status: 'finished' },
  });
  return data;
}