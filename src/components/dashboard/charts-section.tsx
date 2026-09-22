import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { SectionHeader } from './section-header';
import {
  trafficTrend,
  keywordDistribution,
  trafficSources,
  countryTraffic,
  deviceBreakdown,
  monthlyGrowth,
  topLandingPages,
} from '@/lib/seo-data';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.75rem',
  fontSize: '0.75rem',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
};

function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('rounded-2xl p-5 shadow-sm', className)}>
      <SectionHeader title={title} description={description} />
      <div className="mt-4">{children}</div>
    </Card>
  );
}

export function ChartsSection() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <ChartCard
        title="Organic Traffic Trend"
        description="Monthly sessions by channel"
        className="lg:col-span-2"
      >
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-organic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-direct" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area type="monotone" dataKey="organic" stroke="hsl(var(--chart-1))" strokeWidth={2.5} fill="url(#grad-organic)" />
              <Area type="monotone" dataKey="direct" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#grad-direct)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Keyword Position Distribution" description="Rankings by SERP position">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={keywordDistribution} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} width={60} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                {keywordDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Traffic Sources" description="By acquisition channel">
        <div className="flex items-center gap-4">
          <div className="h-[200px] w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={trafficSources} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                  {trafficSources.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {trafficSources.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.fill }} />
                <span className="flex-1 text-muted-foreground">{s.name}</span>
                <span className="font-semibold">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Country-wise Traffic" description="Top regions by visits">
        <div className="space-y-3">
          {countryTraffic.map((c) => (
            <div key={c.code} className="flex items-center gap-3">
              <span className="w-7 text-center text-xs font-semibold text-muted-foreground">{c.code}</span>
              <span className="w-28 truncate text-sm">{c.country}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{ width: `${c.traffic}%` }}
                />
              </div>
              <span className="w-12 text-right text-xs font-semibold">{c.visits}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Device Breakdown" description="Sessions by device">
        <div className="flex items-center gap-4">
          <div className="h-[200px] w-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deviceBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3} stroke="none">
                  {deviceBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {deviceBreakdown.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                <span className="flex-1 text-muted-foreground">{d.name}</span>
                <span className="font-semibold">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Monthly Growth" description="Growth rate %" className="lg:col-span-2">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Line type="monotone" dataKey="traffic" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="keywords" stroke="hsl(var(--chart-2))" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="backlinks" stroke="hsl(var(--chart-3))" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Search Visibility" description="SERP visibility index" className="lg:col-span-3">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={trafficTrend.slice(-6)}>
                <PolarAngleAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Radar dataKey="organic" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.3} strokeWidth={2} />
                <Radar dataKey="direct" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Your overall SERP visibility index has improved by <span className="font-semibold text-success">+18.4%</span> over the last 6 months, driven by strong organic gains in competitive keywords.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Visibility Index</p>
                <p className="mt-1 text-xl font-bold">68.4</p>
              </div>
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Avg. Position</p>
                <p className="mt-1 text-xl font-bold">14.2</p>
              </div>
            </div>
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Top Landing Pages" description="Best performing pages" className="lg:col-span-3">
        <div className="space-y-2">
          {topLandingPages.map((page) => (
            <div
              key={page.page}
              className="flex items-center gap-4 rounded-xl border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
            >
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-sm font-medium">{page.page}</span>
              <div className="hidden gap-6 text-sm sm:flex">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Traffic</p>
                  <p className="font-semibold">{page.traffic.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Keywords</p>
                  <p className="font-semibold">{page.keywords}</p>
                </div>
              </div>
              <span
                className={cn(
                  'flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold',
                  page.change >= 0
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                )}
              >
                {page.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(page.change)}%
              </span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
