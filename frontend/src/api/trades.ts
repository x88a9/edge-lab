import apiClient from './apiClient';
import { Trade } from '../types';

export async function listTrades(): Promise<Trade[]> {
  const { data } = await apiClient.get('/trades/');
  return data;
}

export async function getTrade(tradeId: string): Promise<Trade> {
  const { data } = await apiClient.get(`/trades/${tradeId}`);
  return data;
}

export async function createTrade(input: {
  run_id: string;
  entry_price: number;
  exit_price: number;
  stop_loss: number;
  size: number;
  direction: 'long' | 'short';
  timestamp?: string;
  timeframe?: 'H1' | 'H4' | 'D1';
}): Promise<{ id: string }> {
  const { data } = await apiClient.post('/trades/', input);
  return data;
}

export async function updateTrade(
  tradeId: string,
  input: {
    entry_price: number;
    exit_price: number;
    stop_loss: number;
    size: number;
    direction: 'long' | 'short';
    timestamp?: string;
    timeframe?: 'H1' | 'H4' | 'D1';
  }
): Promise<{ status: string }> {
  const { data } = await apiClient.put(`/trades/${tradeId}`, input);
  return data;
}

export async function deleteTrade(tradeId: string): Promise<{ status: string }> {
  const { data } = await apiClient.delete(`/trades/${tradeId}`);
  return data;
}