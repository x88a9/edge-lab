import client from './client';
import { Run, MetricsSnapshot, EquityPoint, Trade, MonteCarloSummary, RiskOfRuinSummary, KellySimulationResult, WalkForwardWindow, RegimeDetectionResult } from '../types';

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
  // Normalize backend DataFrame-like response into EquityPoint[]
  if (Array.isArray(data)) {
    return data as EquityPoint[];
  }
  if (data && Array.isArray(data.equity)) {
    const eq: number[] = data.equity ?? [];
    const dd: number[] = Array.isArray(data.drawdown) ? data.drawdown : [];
    const lr: number[] = Array.isArray(data.log_return) ? data.log_return : [];
    return eq.map((y, i) => ({ time: i, equity: y, drawdown: dd[i], log_return: lr[i] }));
  }
  return [];
}

export async function getWalkForward(runId: string): Promise<WalkForwardWindow[]> {
  const { data } = await client.get(`/runs/${runId}/walk-forward`);
  return data;
}

export async function getRegimeDetection(runId: string): Promise<RegimeDetectionResult> {
  const { data } = await client.get(`/runs/${runId}/regime-detection`);
  return data;
}

export async function getMonteCarlo(runId: string): Promise<MonteCarloSummary> {
  const { data } = await client.get(`/runs/${runId}/monte-carlo`);
  return data;
}

export async function getRiskOfRuin(runId: string, params?: { position_fraction?: number; ruin_threshold?: number; simulations?: number; }): Promise<RiskOfRuinSummary> {
  const { data } = await client.get(`/runs/${runId}/risk-of-ruin`, { params });
  return data;
}

export async function getKellySimulation(runId: string): Promise<KellySimulationResult> {
  const { data } = await client.get(`/runs/${runId}/kelly-simulation`);
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