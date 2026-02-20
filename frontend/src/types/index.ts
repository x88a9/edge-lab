export interface Run {
  id: string;
  variant_id: string;
  status: string; // 'open' | 'closed' etc
  run_type: string;
  initial_capital: number;
  trade_limit?: number;
  display_name?: string;
  created_at?: string;
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
  created_at?: string;
}

export interface System {
  id: string;
  name: string;
  asset: string;
  display_name?: string;
  created_at?: string;
}

export interface Variant {
  id: string;
  strategy_id: string;
  name: string;
  display_name?: string;
  version: number;
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