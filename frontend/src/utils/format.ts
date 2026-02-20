export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && isFinite(value);
}

export function formatFloat(value: any, decimals = 2): string {
  if (!isValidNumber(value)) return '—';
  return value.toFixed(decimals);
}

export function formatPercent(value: any, decimals = 2): string {
  if (!isValidNumber(value)) return '—';
  return `${(value * 100).toFixed(decimals)} %`;
}

export function formatSharpe(value: any): string {
  if (!isValidNumber(value)) return '—';
  return Number(value).toFixed(2);
}

export function formatDate(value: any): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

export function formatCurrency(value: any, currency: string = 'USD'): string {
  if (!isValidNumber(value)) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return value.toFixed(0);
  }
}