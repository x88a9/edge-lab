import client from './client';
import { Trade } from '../types';

export async function listTrades(): Promise<Trade[]> {
  const { data } = await client.get('/trades/');
  return data;
}

export async function getTrade(tradeId: string): Promise<Trade> {
  const { data } = await client.get(`/trades/${tradeId}`);
  return data;
}

export async function createTrade(input: {
  run_id: string;
  entry_price: number;
  exit_price: number;
  size: number;
  direction: 'long' | 'short';
}): Promise<{ id: string }> {
  const { data } = await client.post('/trades/', null, {
    params: input,
  });
  return data;
}

export async function updateTrade(
  tradeId: string,
  input: {
    entry_price: number;
    exit_price: number;
    size: number;
    direction: 'long' | 'short';
  }
): Promise<{ status: string }> {
  const { data } = await client.put(`/trades/${tradeId}`, null, {
    params: input,
  });
  return data;
}

export async function deleteTrade(tradeId: string): Promise<{ status: string }> {
  const { data } = await client.delete(`/trades/${tradeId}`);
  return data;
}