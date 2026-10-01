import { TrendingUp, TrendingDown, Minus, ArrowUpDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionHeader } from './section-header';
import type { DashboardSummary } from '@/lib/api/queries';
import { cn, formatNumber, NO_VALUE, rankChange } from '@/lib/utils';
import { EmptyRow } from './empty-state';

function difficultyColor(d: number | null) {
  if (d === null) return 'bg-muted text-muted-foreground';
  if (d >= 70) return 'bg-destructive/10 text-destructive';
  if (d >= 45) return 'bg-warning/10 text-warning';
  return 'bg-success/10 text-success';
}

function rankColor(rank: number | null) {
  if (rank === null) return 'bg-muted text-muted-foreground';
  if (rank <= 3) return 'bg-primary/10 text-primary';
  if (rank <= 10) return 'bg-accent/10 text-accent';
  if (rank <= 20) return 'bg-warning/10 text-warning';
  return 'bg-muted text-muted-foreground';
}

export function KeywordSection({ keywordTable }: Pick<DashboardSummary, 'keywordTable'>) {
  return (
    <Card className="rounded-2xl p-5 shadow-sm">
      <SectionHeader
        title="Keyword Rankings"
        description="Tracked keywords with live SERP positions"
        action={
          <button className="flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted">
            <ArrowUpDown className="h-4 w-4" />
            Sort
          </button>
        }
      />
      <div className="scrollbar-thin mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-3 pr-4 font-medium">Keyword</th>
              <th className="pb-3 pr-4 font-medium">Volume</th>
              <th className="pb-3 pr-4 font-medium">Difficulty</th>
              <th className="pb-3 pr-4 font-medium">CPC</th>
              <th className="pb-3 pr-4 font-medium">Rank</th>
              <th className="pb-3 pr-4 font-medium">Prev</th>
              <th className="pb-3 pr-4 font-medium">Change</th>
              <th className="pb-3 font-medium">URL</th>
            </tr>
          </thead>
          <tbody>
            {keywordTable.length === 0 && (
              <EmptyRow colSpan={8}>No tracked keywords yet. Add keywords to start tracking them.</EmptyRow>
            )}
            {keywordTable.map((row) => {
              const change = rankChange(row);
              return (
                <tr
                  key={row.id ?? row.keyword}
                  className="border-b transition-colors last:border-0 hover:bg-muted/40"
                >
                  <td className="py-3 pr-4 font-medium">{row.keyword}</td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {formatNumber(row.volume)}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-semibold',
                        difficultyColor(row.difficulty)
                      )}
                    >
                      {row.difficulty ?? NO_VALUE}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{row.cpc}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        'inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold',
                        rankColor(row.rank)
                      )}
                    >
                      {row.rank ?? NO_VALUE}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{row.previousRank ?? NO_VALUE}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                        change !== null && change > 0
                          ? 'bg-success/10 text-success'
                          : change !== null && change < 0
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {change !== null && change > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : change !== null && change < 0 ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                      {change === null ? NO_VALUE : change > 0 ? `+${change}` : change}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="max-w-[120px] truncate">{row.url}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
