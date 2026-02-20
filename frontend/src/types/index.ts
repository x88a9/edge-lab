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
  expectancy: number;
  win_rate: number;
  sharpe: number;
  volatility: number;
  max_drawdown: number;
  total_return: number;
}

export interface EquityPoint {
  time: string | number;
  equity: number;
  drawdown?: number;
  log_return?: number;
}