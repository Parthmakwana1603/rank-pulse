import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, Download, Filter, ArrowUpDown, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '../page-header';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import type { KeywordFull } from '@/lib/seo-data';
import { useKeywordRankingsData } from '@/lib/api/queries';
import { cn, formatNumber, matchesQuery, NO_VALUE, rankChange } from '@/lib/utils';
import { EmptyRow } from '../empty-state';
import { useModal } from '../modals/modal-provider';
import { QueryFallback } from '../query-fallback';
import { StatChange } from '../stat-change';
import { TableFilter, NoMatchesRow } from '../table-filter';

const intentColor: Record<NonNullable<KeywordFull['intent']>, string> = {
  Informational: 'bg-primary/10 text-primary',
  Commercial: 'bg-accent/10 text-accent',
  Transactional: 'bg-warning/10 text-warning',
  Navigational: 'bg-chart-4/10 text-chart-4',
};

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

export function KeywordRankingsScreen() {
  const { open } = useModal();
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'added' | 'keyword' | 'rank'>('added');
  const screenQuery = useKeywordRankingsData();
  if (!screenQuery.data) return <QueryFallback query={screenQuery} />;
  const { keywords: keywordFullTable, summary: keywordSummary } = screenQuery.data;
  const rows = keywordFullTable
    .filter((row) => matchesQuery(query, [row.keyword, row.intent ?? '', row.serp, row.url]))
    .sort((a, b) =>
      sort === 'keyword'
        ? a.keyword.localeCompare(b.keyword)
        : sort === 'rank'
          ? (a.rank ?? Infinity) - (b.rank ?? Infinity)
          : 0
    );
  const sortLabels = { added: 'Newest first', keyword: 'Keyword A–Z', rank: 'Best rank' } as const;
  const nextSort = { added: 'keyword', keyword: 'rank', rank: 'added' } as const;
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Keyword Rankings"
        description="Track and analyze your keyword positions in SERPs"
        icon={<Search className="h-5 w-5" />}
        actions={
          <>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              aria-pressed={filterOpen}
              className={cn(
                'flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted',
                filterOpen && 'border-primary text-primary'
              )}
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button
              onClick={() => open('add-keyword')}
              className="flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              Add Keywords
            </button>
            <button
              onClick={() => open('export-pdf', 'keyword-performance')}
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
            <StatChange change={s.change} />
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">All Keywords</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {rows.length === keywordFullTable.length
                ? `${keywordFullTable.length} tracked keywords`
                : `${rows.length} of ${keywordFullTable.length} tracked keywords`}
            </p>
          </div>
          <button
            onClick={() => setSort(nextSort[sort])}
            title="Change sort order"
            className="flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortLabels[sort]}
          </button>
        </div>
        {filterOpen && (
          <TableFilter value={query} onChange={setQuery} placeholder="Filter by keyword, intent, SERP feature or URL…" />
        )}
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
              {keywordFullTable.length === 0 && (
                <EmptyRow colSpan={10}>No tracked keywords yet. Use “Add Keywords” to start tracking.</EmptyRow>
              )}
              {keywordFullTable.length > 0 && rows.length === 0 && <NoMatchesRow colSpan={10} />}
              {rows.map((row) => {
                const change = rankChange(row);
                return (
                  <tr key={row.id ?? row.keyword} onClick={() => open('keyword-detail', row.id ?? row.keyword)} className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40">
                    <td className="py-3 pr-4 font-medium">{row.keyword}</td>
                    <td className="py-3 pr-4">
                      {row.intent ? (
                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', intentColor[row.intent])}>
                          {row.intent}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{NO_VALUE}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{formatNumber(row.volume)}</td>
                    <td className="py-3 pr-4">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', difficultyColor(row.difficulty))}>
                        {row.difficulty ?? NO_VALUE}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{row.cpc}</td>
                    <td className="py-3 pr-4">
                      <span className={cn('inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold', rankColor(row.rank))}>
                        {row.rank ?? NO_VALUE}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                          change !== null && change > 0 ? 'bg-success/10 text-success' : change !== null && change < 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {change !== null && change > 0 ? <TrendingUp className="h-3 w-3" /> : change !== null && change < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        {change === null ? NO_VALUE : change > 0 ? `+${change}` : change}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="h-8 w-24">
                        {row.trend30.length < 2 ? (
                          <span className="text-xs text-muted-foreground">{NO_VALUE}</span>
                        ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={row.trend30.map((v, i) => ({ i, v }))} margin={{ top: 1, bottom: 1, left: 0, right: 0 }}>
                            <defs>
                              <linearGradient id={`kw-${row.id ?? row.keyword}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} fill={`url(#kw-${row.id ?? row.keyword})`} />
                          </AreaChart>
                        </ResponsiveContainer>
                        )}
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
