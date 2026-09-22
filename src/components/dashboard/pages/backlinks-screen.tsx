import { Link2, Download, TrendingUp, TrendingDown, ArrowUpRight, Filter, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '../page-header';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { backlinkStats, backlinkTable, backlinkGrowth, anchorTextDistribution, followNofollow, topReferringDomains, type BacklinkRow } from '@/lib/seo-data';
import { cn } from '@/lib/utils';
import { useModal } from '../modals/modal-provider';

const typeColor: Record<BacklinkRow['type'], string> = {
  Follow: 'bg-success/10 text-success',
  Nofollow: 'bg-muted text-muted-foreground',
  UGC: 'bg-chart-4/10 text-chart-4',
};

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.75rem',
  fontSize: '0.75rem',
};

export function BacklinksScreen() {
  const { open } = useModal();
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Backlinks"
        description="Monitor your inbound link profile and referring domains"
        icon={<Link2 className="h-5 w-5" />}
        actions={
          <>
            <button className="flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button
              onClick={() => open('add-backlink')}
              className="flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              Add Backlink
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {backlinkStats.map((s) => (
          <Card key={s.label} className="rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl p-5 shadow-sm lg:col-span-2">
          <h2 className="text-base font-semibold">New vs Lost Backlinks</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Monthly link acquisition trend</p>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={backlinkGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bl-new" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="new" name="New" fill="url(#bl-new)" radius={[4, 4, 0, 0]} barSize={22} />
                <Bar dataKey="lost" name="Lost" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold">Follow vs Nofollow</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Link type distribution</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-[180px] w-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={followNofollow} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3} stroke="none">
                    {followNofollow.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {followNofollow.map((f) => (
                <div key={f.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: f.fill }} />
                  <span className="flex-1 text-muted-foreground">{f.name}</span>
                  <span className="font-semibold">{f.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground">Anchor Text Distribution</p>
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
        </Card>
      </div>

      <Card className="rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-semibold">Top Referring Domains</h2>
        <div className="mt-4 space-y-2.5">
          {topReferringDomains.map((d) => (
            <div key={d.domain} className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3 transition-colors hover:bg-muted/60">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 text-xs font-bold text-primary">
                {d.domain[0].toUpperCase()}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.domain}</p>
                <p className="text-xs text-muted-foreground">DA {d.authority} · {d.backlinks.toLocaleString()} backlinks</p>
              </div>
              <span className={cn('text-xs font-semibold', d.change >= 0 ? 'text-success' : 'text-destructive')}>
                {d.change >= 0 ? '+' : ''}{d.change}%
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-semibold">All Backlinks</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{backlinkTable.length} links found</p>
        <div className="scrollbar-thin mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Source</th>
                <th className="pb-3 pr-4 font-medium">DA</th>
                <th className="pb-3 pr-4 font-medium">Target Page</th>
                <th className="pb-3 pr-4 font-medium">Anchor Text</th>
                <th className="pb-3 pr-4 font-medium">Type</th>
                <th className="pb-3 pr-4 font-medium">First Seen</th>
                <th className="pb-3 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {backlinkTable.map((row) => (
                <tr key={row.source + row.target} className="border-b transition-colors last:border-0 hover:bg-muted/40">
                  <td className="py-3 pr-4 font-medium">{row.source}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{row.authority}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{row.target}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{row.anchor}</td>
                  <td className="py-3 pr-4">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', typeColor[row.type])}>
                      {row.type}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{row.firstSeen}</td>
                  <td className="py-3">
                    <span className={cn('text-xs font-semibold', row.change >= 0 ? 'text-success' : 'text-destructive')}>
                      {row.change >= 0 ? '+' : ''}{row.change}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
