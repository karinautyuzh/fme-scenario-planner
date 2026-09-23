export function formatEurM(value: number, decimals = 1): string {
  return `€${value.toFixed(decimals)}M`;
}

export function formatPct(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatMonths(months: number): string {
  if (months === 1) return '1 month';
  return `${months} months`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function generateId(): string {
  return `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
