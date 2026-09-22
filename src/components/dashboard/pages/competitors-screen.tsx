import { Users, Download, TrendingUp, Crown, Target, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '../page-header';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { competitors, competitorKeywords, competitorGap } from '@/lib/seo-data';
import { cn } from '@/lib/utils';
import { useModal } from '../modals/modal-provider';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.75rem',
  fontSize: '0.75rem',
};

const metrics = [
  { key: 'traffic', label: 'Organic Traffic' },
  { key: 'keywords', label: 'Keywords' },
  { key: 'backlinks', label: 'Backlinks' },
  { key: 'trafficValue', label: 'Traffic Value' },
] as const;

export function CompetitorsScreen() {
  const { open } = useModal();
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Competitors"
        description="Benchmark your performance against competitors"
        icon={<Users className="h-5 w-5" />}
        actions={
          <div className="flex gap-2.5">
            <button
              onClick={() => open('add-competitor')}
              className="flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              Add Competitor
            </button>
            <button
              onClick={() => open('export-pdf')}
              className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        }
      />

      <div className="scrollbar-thin overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-4 gap-4">
          {competitors.map((c) => (
            <Card
              key={c.name}
              className={cn(
                'flex flex-col rounded-2xl p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                c.isYou && 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold',
                    c.isYou ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {c.name[0]}
                </span>
                <div>
                  <p className="text-sm font-semibold">{c.name}</p>
                  {c.isYou && <span className="text-[11px] font-medium text-primary">Your site</span>}
                </div>
              </div>

              <div className="mt-4 mb-4">
                <div className="flex items-end justify-between">
                  <span className="text-xs text-muted-foreground">Authority Score</span>
                  <span className="text-2xl font-bold">{c.authority}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full', c.isYou ? 'bg-gradient-to-r from-primary to-accent' : 'bg-gradient-to-r from-chart-4 to-chart-5')}
                    style={{ width: `${c.authority}%` }}
                  />
                </div>
              </div>

              <div className="mt-auto space-y-2.5 border-t pt-3">
                {metrics.map((m) => (
                  <div key={m.key} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                    <span className="text-sm font-semibold">{c[m.key]}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl p-5 shadow-sm lg:col-span-2">
          <h2 className="text-base font-semibold">Keyword Position Comparison</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">SERP rankings across shared keywords</p>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={competitorKeywords} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="keyword" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="you" name="You" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} barSize={14} />
                <Bar dataKey="compA" name="Competitor A" fill="hsl(var(--chart-4))" radius={[3, 3, 0, 0]} barSize={14} />
                <Bar dataKey="compB" name="Competitor B" fill="hsl(var(--chart-5))" radius={[3, 3, 0, 0]} barSize={14} />
                <Bar dataKey="compC" name="Competitor C" fill="hsl(var(--chart-3))" radius={[3, 3, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold">Keyword Gap Analysis</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Opportunities vs competitors</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Unique to You</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-primary">{competitorGap.unique.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Keywords only you rank for</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                <p className="text-sm font-medium">Shared</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-accent">{competitorGap.shared.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Keywords all competitors rank for</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-warning" />
                <p className="text-sm font-medium">Missed Opportunities</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-warning">{competitorGap.missed.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Keywords competitors rank for, you don't</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
