import { useState } from 'react';
import { ModalFooter, CancelButton, PrimaryButton } from './modal-shell';
import { TrendingUp, TrendingDown, Minus, Trash2, Loader2 } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDeleteKeyword, useKeywords } from '@/lib/api/queries';
import { QueryFallback } from '../query-fallback';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatNumber, NO_VALUE, rankChange } from '@/lib/utils';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.75rem',
  fontSize: '0.75rem',
};

/** `keyword` is the keyword's id (or its text for older links). */
export function KeywordDetailModal({ onClose, keyword }: { onClose: () => void; keyword: string }) {
  const keywordsQuery = useKeywords();
  const deleteKeyword = useDeleteKeyword();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  if (!keywordsQuery.data) return <QueryFallback query={keywordsQuery} skeleton={<Skeleton className="h-48 rounded-xl" />} />;
  const data = keywordsQuery.data.find((k) => k.id === keyword || k.keyword === keyword);
  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">This keyword is no longer tracked.</p>
        <ModalFooter>
          <CancelButton onClose={onClose} />
        </ModalFooter>
      </div>
    );
  }
  const trendData = data.trend30.map((v, i) => ({ day: `D${i + 1}`, rank: v }));
  const change = rankChange(data);

  const handleDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    if (data.id) deleteKeyword.mutate(data.id, { onSuccess: onClose });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">{data.keyword}</p>
          <p className="text-sm text-muted-foreground">
            {data.rank === null
              ? 'No ranking data yet'
              : `Current rank: #${data.rank}${data.previousRank !== null ? ` (was #${data.previousRank})` : ''}`}
            {data.searchEngine && ` · ${data.searchEngine} · ${data.device}`}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-semibold',
            change !== null && change > 0 ? 'bg-success/10 text-success' : change !== null && change < 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
          )}
        >
          {change === null ? <Minus className="h-3 w-3" /> : change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {change === null ? NO_VALUE : change > 0 ? `+${change}` : change}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Search Volume', value: formatNumber(data.volume) },
          { label: 'Difficulty', value: data.difficulty === null ? NO_VALUE : String(data.difficulty) },
          { label: 'CPC', value: data.cpc },
          { label: 'Intent', value: data.intent ?? NO_VALUE },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-sm font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-sm font-semibold">30-Day Ranking History</p>
        <div className="mt-2 h-40 rounded-xl border bg-muted/30 p-3">
          {trendData.length < 2 ? (
            <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
              Ranking history needs a rank-tracking data provider, which isn't connected yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="kd-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis reversed tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="rank" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#kd-grad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-muted/30 p-3.5">
        <p className="text-sm font-medium">Ranking URL</p>
        <p className="text-xs text-muted-foreground">{data.url}</p>
        <div className="mt-2 border-t pt-2">
          <p className="text-xs text-muted-foreground">SERP Feature: <span className="font-medium text-foreground">{data.serp}</span></p>
        </div>
      </div>

      {deleteKeyword.error && (
        <div role="alert" className="rounded-xl border bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {deleteKeyword.error.message}
        </div>
      )}

      <ModalFooter>
        {data.id && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteKeyword.isPending}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-destructive/30 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60 sm:mr-auto"
          >
            {deleteKeyword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {confirmingDelete ? 'Click again to stop tracking' : 'Stop tracking'}
          </button>
        )}
        <CancelButton onClose={onClose} />
        <PrimaryButton onClick={onClose}>Close</PrimaryButton>
      </ModalFooter>
    </div>
  );
}
