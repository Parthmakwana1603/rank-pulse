import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/** "+4.2%" / "−3.1%" badge under a stat; renders nothing when there is no change to report. */
export function StatChange({ change }: { change: number | null }) {
  if (change === null) return null;
  return (
    <span
      className={cn(
        'mt-1 inline-flex items-center gap-0.5 text-xs font-semibold',
        change >= 0 ? 'text-success' : 'text-destructive'
      )}
    >
      {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(change)}%
    </span>
  );
}
