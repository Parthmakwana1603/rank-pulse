import { Search, TrendingUp, TrendingDown, Minus, Download, Filter, ArrowUpDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '../page-header';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { keywordFullTable, keywordSummary, type KeywordFull } from '@/lib/seo-data';
import { cn } from '@/lib/utils';
import { useModal } from '../modals/modal-provider';

const intentColor: Record<KeywordFull['intent'], string> = {
  Informational: 'bg-primary/10 text-primary',
  Commercial: 'bg-accent/10 text-accent',
  Transactional: 'bg-warning/10 text-warning',
  Navigational: 'bg-chart-4/10 text-chart-4',
};

function difficultyColor(d: number) {
  if (d >= 70) return 'bg-destructive/10 text-destructive';
  if (d >= 45) return 'bg-warning/10 text-warning';
  return 'bg-success/10 text-success';
}

function rankColor(rank: number) {
  if (rank <= 3) return 'bg-primary/10 text-primary';
  if (rank <= 10) return 'bg-accent/10 text-accent';
  if (rank <= 20) return 'bg-warning/10 text-warning';
  return 'bg-muted text-muted-foreground';
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.75rem',
  fontSize: '0.75rem',
};

export function KeywordRankingsScreen() {
  const { open } = useModal();
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Keyword Rankings"
        description="Track and analyze your keyword positions in SERPs"
        icon={<Search className="h-5 w-5" />}
        actions={
          <>
            <button
              onClick={() => open('add-keyword')}
              className="flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button
              onClick={() => open('export-pdf')}
              className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {keywordSummary.map((s) => (
          <Card key={s.label} className="rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-xl font-bold">{s.value}</p>
            <span
              className={cn(
                'mt-1 inline-flex items-center gap-0.5 text-xs font-semibold',
                s.change >= 0 ? 'text-success' : 'text-destructive'
              )}
            >
              {s.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(s.change)}%
            </span>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">All Keywords</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {keywordFullTable.length} tracked keywords
            </p>
          </div>
          <button className="flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted">
            <ArrowUpDown className="h-4 w-4" />
            Sort
          </button>
        </div>
        <div className="scrollbar-thin mt-4 overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Keyword</th>
                <th className="pb-3 pr-4 font-medium">Intent</th>
                <th className="pb-3 pr-4 font-medium">Volume</th>
                <th className="pb-3 pr-4 font-medium">KD</th>
                <th className="pb-3 pr-4 font-medium">CPC</th>
                <th className="pb-3 pr-4 font-medium">Rank</th>
                <th className="pb-3 pr-4 font-medium">Change</th>
                <th className="pb-3 pr-4 font-medium">30-Day Trend</th>
                <th className="pb-3 pr-4 font-medium">SERP Feature</th>
                <th className="pb-3 font-medium">URL</th>
              </tr>
            </thead>
            <tbody>
              {keywordFullTable.map((row) => {
                const change = row.previousRank - row.rank;
                return (
                  <tr key={row.keyword} onClick={() => open('keyword-detail', row.keyword)} className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40">
                    <td className="py-3 pr-4 font-medium">{row.keyword}</td>
                    <td className="py-3 pr-4">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', intentColor[row.intent])}>
                        {row.intent}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{row.volume.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', difficultyColor(row.difficulty))}>
                        {row.difficulty}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{row.cpc}</td>
                    <td className="py-3 pr-4">
                      <span className={cn('inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold', rankColor(row.rank))}>
                        {row.rank}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                          change > 0 ? 'bg-success/10 text-success' : change < 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {change > 0 ? <TrendingUp className="h-3 w-3" /> : change < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        {change > 0 ? `+${change}` : change}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="h-8 w-24">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={row.trend30.map((v, i) => ({ i, v }))} margin={{ top: 1, bottom: 1, left: 0, right: 0 }}>
                            <defs>
                              <linearGradient id={`kw-${row.keyword}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} fill={`url(#kw-${row.keyword})`} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">{row.serp}</td>
                    <td className="py-3 text-xs text-muted-foreground">{row.url}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
