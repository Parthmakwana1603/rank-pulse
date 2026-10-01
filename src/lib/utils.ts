import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function matchesQuery(query: string, fields: (string | number)[]) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => String(f).toLowerCase().includes(q));
}

/** "Jamie Doe" → "JD", "jamie" → "JA". */
export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2);
  return letters.toUpperCase();
}

/** "248.5K" → 248500, "1.2M" → 1200000; null for anything else (e.g. "—"). */
export function parseCompactNumber(value: string): number | null {
  const match = /^\s*([\d.,]+)\s*([KMB])?\s*$/i.exec(value);
  if (!match) return null;
  const n = Number(match[1].replace(/,/g, ''));
  if (!Number.isFinite(n)) return null;
  const scale = { K: 1e3, M: 1e6, B: 1e9 }[(match[2] ?? '').toUpperCase() as 'K' | 'M' | 'B'] ?? 1;
  return n * scale;
}

/** 742300 → "742.3K". */
export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

/** Placeholder for values no data source provides yet. */
export const NO_VALUE = '—';

/** 18420 → "18,420"; null → "—". */
export function formatNumber(value: number | null | undefined) {
  return value === null || value === undefined ? NO_VALUE : value.toLocaleString('en');
}

/** Positions gained since the previous check (positive = better); null when unknown. */
export function rankChange(row: { rank: number | null; previousRank: number | null }) {
  return row.rank === null || row.previousRank === null ? null : row.previousRank - row.rank;
}

/** 2_400_000 → "2.3 MB". */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
