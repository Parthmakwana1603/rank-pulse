import { TrendingUp, TrendingDown } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import type { Kpi } from '@/lib/seo-data';

const accentMap: Record<Kpi['accent'], string> = {
  primary: 'hsl(var(--chart-1))',
  accent: 'hsl(var(--chart-2))',
  warning: 'hsl(var(--chart-3))',
  destructive: 'hsl(var(--destructive))',
  'chart-4': 'hsl(var(--chart-4))',
};

export function KpiCard({ kpi, index }: { kpi: Kpi; index: number }) {
  const positive = kpi.change >= 0;
  const color = accentMap[kpi.accent];
  const data = kpi.trend.map((v, i) => ({ i, v }));

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
        <span
          className={cn(
            'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
            positive
              ? 'bg-success/10 text-success'
              : 'bg-destructive/10 text-destructive'
          )}
        >
          {positive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {Math.abs(kpi.change)}%
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{kpi.value}</p>
      <div className="mt-3 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
            <defs>
              <linearGradient id={`grad-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${kpi.id})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
