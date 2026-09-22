import { Sparkles, Download, TrendingUp, Brain, Globe, Quote, Cpu, Code, FileCheck, Zap, Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '../page-header';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { aiSeoFullMetrics, aiMentionsByPlatform, aiTrend, aiRecommendations } from '@/lib/seo-data';
import { cn } from '@/lib/utils';
import { useModal } from '../modals/modal-provider';

const iconMap: Record<string, typeof Brain> = {
  'AI Visibility Score': Brain,
  'GEO Score': Globe,
  'AI Search Mentions': Sparkles,
  'Citation Score': Quote,
  'LLM Readiness': Cpu,
  'Structured Data Score': Code,
  'Content Quality Score': FileCheck,
  'Entity Recognition': Zap,
};

const accentBg: Record<string, string> = {
  primary: 'from-primary/20 to-primary/5 text-primary',
  accent: 'from-accent/20 to-accent/5 text-accent',
  'chart-4': 'from-chart-4/20 to-chart-4/5 text-chart-4',
};

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.75rem',
  fontSize: '0.75rem',
};

const impactColor: Record<string, string> = {
  High: 'bg-destructive/10 text-destructive',
  Medium: 'bg-warning/10 text-warning',
  Low: 'bg-success/10 text-success',
};

export function AiSeoScreen() {
  const { open } = useModal();
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="AI SEO & GEO"
        description="Optimize for generative engines and AI-powered search"
        icon={<Sparkles className="h-5 w-5" />}
        actions={
          <button
            onClick={() => open('export-pdf')}
            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {aiSeoFullMetrics.slice(0, 4).map((m, idx) => {
          const Icon = iconMap[m.label] ?? Sparkles;
          const isCount = m.value > 100;
          const accent = (['primary', 'accent', 'chart-4', 'primary'] as const)[idx];
          return (
            <Card key={m.label} className="rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br', accentBg[accent])}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-success">
                  <TrendingUp className="h-3 w-3" />+{m.change}%
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{m.label}</p>
              <p className="mt-1 text-2xl font-bold">{isCount ? m.value.toLocaleString() : m.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-chart-4/5 via-card to-primary/5 p-5 shadow-sm lg:col-span-2">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-chart-4/10 blur-3xl" />
          <h2 className="text-base font-semibold">AI Visibility Trend</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Visibility score & mentions over 7 weeks</p>
          <div className="relative mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aiTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ai-vis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-4))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ai-men" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="visibility" name="Visibility Score" stroke="hsl(var(--chart-4))" strokeWidth={2.5} fill="url(#ai-vis)" />
                <Area type="monotone" dataKey="mentions" name="Mentions" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#ai-men)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold">Mentions by Platform</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Where AI cites your content</p>
          <div className="mt-4 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiMentionsByPlatform} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="platform" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={100} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                <Bar dataKey="mentions" fill="hsl(var(--chart-4))" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1.5 border-t pt-3">
            {aiMentionsByPlatform.map((p) => (
              <div key={p.platform} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{p.platform}</span>
                <span className="font-semibold">{p.share}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold">All AI Metrics</h2>
          <div className="mt-4 space-y-3">
            {aiSeoFullMetrics.map((m, idx) => {
              const Icon = iconMap[m.label] ?? Sparkles;
              const isCount = m.value > 100;
              const pct = isCount ? (m.value / m.target) * 100 : m.value;
              const accent = (['primary', 'accent', 'chart-4', 'primary', 'accent', 'chart-4', 'primary', 'accent'] as const)[idx];
              return (
                <div key={m.label} className="rounded-xl border bg-muted/30 p-3.5 transition-colors hover:bg-muted/60">
                  <div className="flex items-center gap-3">
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br', accentBg[accent])}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{isCount ? m.value.toLocaleString() : m.value}</p>
                      <span className="text-xs font-semibold text-success">+{m.change}%</span>
                    </div>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-warning" />
            <h2 className="text-base font-semibold">AI Optimization Recommendations</h2>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">Actionable steps to improve AI visibility</p>
          <div className="mt-4 space-y-3">
            {aiRecommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3.5 transition-colors hover:bg-muted/60">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="mt-0.5 text-xs text-success">{r.score}</p>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', impactColor[r.impact])}>
                  {r.impact}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
