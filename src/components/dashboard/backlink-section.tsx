import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionHeader } from './section-header';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import {
  backlinkStats,
  anchorTextDistribution,
  followNofollow,
  topReferringDomains,
} from '@/lib/seo-data';
import { cn } from '@/lib/utils';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.75rem',
  fontSize: '0.75rem',
};

export function BacklinkSection() {
  return (
    <Card className="rounded-2xl p-5 shadow-sm">
      <SectionHeader
        title="Backlink Analytics"
        description="Inbound link profile overview"
      />
      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        <div className="grid grid-cols-2 gap-3 lg:col-span-1 lg:grid-cols-1">
          {backlinkStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border bg-muted/30 p-3.5 transition-colors hover:bg-muted/60"
            >
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-xl font-bold">{stat.value}</p>
              <span
                className={cn(
                  'mt-1 inline-flex items-center gap-0.5 text-xs font-semibold',
                  stat.change >= 0 ? 'text-success' : 'text-destructive'
                )}
              >
                {stat.change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(stat.change)}%
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-sm font-semibold">Anchor Text Distribution</p>
          <div className="mt-3 h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={anchorTextDistribution} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2} stroke="none">
                  {anchorTextDistribution.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {anchorTextDistribution.map((a) => (
              <div key={a.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: a.fill }} />
                <span className="flex-1 text-muted-foreground">{a.name}</span>
                <span className="font-semibold">{a.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-sm font-semibold">Follow vs Nofollow</p>
          <div className="mt-3 h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={followNofollow} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2} stroke="none">
                  {followNofollow.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {followNofollow.map((f) => (
              <div key={f.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: f.fill }} />
                <span className="flex-1 text-muted-foreground">{f.name}</span>
                <span className="font-semibold">{f.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-sm font-semibold">Top Referring Domains</p>
          <div className="mt-3 space-y-2.5">
            {topReferringDomains.map((d) => (
              <div key={d.domain} className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 text-xs font-bold text-primary">
                  {d.domain[0].toUpperCase()}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-tight">{d.domain}</p>
                  <p className="text-xs text-muted-foreground">
                    DA {d.authority} · {d.backlinks.toLocaleString()} links
                  </p>
                </div>
                <span
                  className={cn(
                    'text-xs font-semibold',
                    d.change >= 0 ? 'text-success' : 'text-destructive'
                  )}
                >
                  {d.change >= 0 ? '+' : ''}
                  {d.change}%
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
