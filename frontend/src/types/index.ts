export interface Run {
  id: string;
  variant_id: string;
  status: string; // 'open' | 'closed' etc
  run_type: string;
  initial_capital: number;
  trade_limit?: number;
  display_name?: string;
  created_at?: string;
  description?: string;
}

export interface Trade {
  id: string;
  run_id: string;
  entry_price: number;
  exit_price: number;
  size: number;
  direction: 'long' | 'short';
  raw_return: number;
  log_return: number;
  r_multiple?: number;
  timestamp?: string;
  timeframe?: 'H1' | 'H4' | 'D1';
  created_at?: string;
}

export interface System {
  id: string;
  name: string;
  asset: string;
  display_name?: string;
  description?: string;
  created_at?: string;
}

export interface Variant {
  id: string;
  strategy_id: string;
  name: string;
  display_name?: string;
  version: number;
  description?: string;
}

export interface MetricsSnapshot {
  // Legacy fields (other endpoints may return these)
  expectancy?: number;
  sharpe?: number;
  volatility?: number;
  total_return?: number;
  volatility_drag?: number;
  win_rate?: number;
  max_drawdown?: number;

  // R-based run metrics from /runs/{id}/metrics
  total_trades?: number;
  wins?: number;
  losses?: number;
  total_R?: number;
  avg_R?: number;
  avg_win_R?: number;
  avg_loss_R?: number;
  expectancy_R?: number;
  volatility_R?: number;
  kelly_f?: number;
  log_growth?: number;
  max_drawdown_R?: number;
}

export interface EquityPoint {
  time: string | number;
  equity: number;
  drawdown?: number;
  log_return?: number;
}

export interface MonteCarloSummary {
  mean_final_return: number;
  median_final_return: number;
  p5_final_return: number;
  p95_final_return: number;
  mean_max_dd: number;
  worst_case_dd: number;
  p95_dd: number;
}

export interface RiskOfRuinSummary {
  ruin_probability: number;
  mean_final_capital: number;
  median_final_capital: number;
  mean_max_drawdown: number;
  worst_case_drawdown: number;
}

export interface KellyResultPoint {
  fraction: number;
  mean_final_capital: number;
  ruin_probability: number;
  mean_max_drawdown: number;
}

export interface KellySimulationResult {
  all_results: KellyResultPoint[];
  growth_optimal: KellyResultPoint | null;
  safe_fraction: KellyResultPoint | null;
}

export interface WalkForwardWindow {
  train_expectancy: number;
  test_expectancy: number;
  train_sharpe: number;
  test_sharpe: number;
}

export interface RegimeDetectionResult {
  labels: number[];
  centroids: number[][];
}