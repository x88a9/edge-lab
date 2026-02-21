import apiClient from './apiClient';
import { Run, MetricsSnapshot, EquityPoint, Trade, MonteCarloSummary, RiskOfRuinSummary, KellySimulationResult, WalkForwardWindow, RegimeDetectionResult } from '../types';

export async function listRuns(): Promise<Run[]> {
  const { data } = await apiClient.get('/runs/');
  return data;
}

export async function getRun(runId: string): Promise<Run> {
  const { data } = await apiClient.get(`/runs/${runId}`);
  return data;
}

export async function getMetrics(runId: string): Promise<MetricsSnapshot> {
  const { data } = await apiClient.get(`/runs/${runId}/metrics`);
  return data;
}

export async function getEquity(runId: string): Promise<EquityPoint[]> {
  const { data } = await apiClient.get(`/runs/${runId}/equity`);
  // Backend returns { equity: number[]; drawdown: number[] }. Map to EquityPoint[].
  if (Array.isArray(data)) {
    // Fallback: server already returns array of points
    return data as EquityPoint[];
  }
  const eq = Array.isArray(data?.equity) ? data.equity : [];
  const dd = Array.isArray(data?.drawdown) ? data.drawdown : [];
  return eq.map((e: number, i: number) => ({ time: i, equity: e, drawdown: dd[i] }));
}

export async function listTradesForRun(runId: string): Promise<Trade[]> {
  const { data } = await apiClient.get(`/runs/${runId}/trades`);
  return data;
}

export async function getMonteCarlo(runId: string): Promise<MonteCarloSummary> {
  const { data } = await apiClient.get(`/runs/${runId}/monte-carlo`);
  return data;
}

export async function getRiskOfRuin(
  runId: string,
  opts?: { position_fraction?: number; ruin_threshold?: number; simulations?: number }
): Promise<RiskOfRuinSummary> {
  const { data } = await apiClient.get(`/runs/${runId}/risk-of-ruin`, { params: opts });
  return data;
}

export async function getWalkForward(runId: string): Promise<WalkForwardWindow[]> {
  const { data } = await apiClient.get(`/runs/${runId}/walk-forward`);
  return data;
}

export async function getRegimeDetection(runId: string): Promise<RegimeDetectionResult> {
  const { data } = await apiClient.get(`/runs/${runId}/regime-detection`);
  return data;
}

export async function getKellySimulation(runId: string): Promise<KellySimulationResult> {
  const { data } = await apiClient.get(`/runs/${runId}/kelly-simulation`);
  return data;
}

export async function createRun(payload: {
  variant_id: string;
  display_name: string;
  initial_capital: number;
  run_type: 'backtest' | 'forward' | 'montecarlo';
  description?: string;
}): Promise<Run> {
  const { data } = await apiClient.post('/runs/', payload);
  return data;
}

export async function finishRun(runId: string): Promise<{ status: string }> {
  const { data } = await apiClient.put(`/runs/${runId}`, { status: 'finished' });
  return data;
}