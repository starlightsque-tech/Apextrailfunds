function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') return Number(value) || 0;
  // Prisma Decimal and similar wrappers
  const n = Number(value as { toString(): string });
  return Number.isFinite(n) ? n : 0;
}

export function money(value: unknown, currency = 'USD', max = 2) {
  const n = toNumber(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: max,
    minimumFractionDigits: max === 0 ? 0 : 2
  }).format(Number.isFinite(n) ? n : 0);
}

export function num(value: unknown, digits = 2) {
  const n = toNumber(value);
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(Number.isFinite(n) ? n : 0);
}

export function pct(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined) return '—';
  return `${value > 0 ? '+' : ''}${num(value, digits)}%`;
}

export function date(value: Date | string | null | undefined) {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(new Date(Date.UTC(y, m - 1, 1)));
}
