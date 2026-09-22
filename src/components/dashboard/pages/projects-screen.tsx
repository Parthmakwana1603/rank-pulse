import { FolderKanban, Plus, MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '../page-header';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { projectList, type ProjectItem } from '@/lib/seo-data';
import { cn } from '@/lib/utils';
import { useModal } from '../modals/modal-provider';

const statusConfig: Record<ProjectItem['status'], { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-success', bg: 'bg-success/10' },
  paused: { label: 'Paused', color: 'text-muted-foreground', bg: 'bg-muted' },
  warning: { label: 'Needs Attention', color: 'text-warning', bg: 'bg-warning/10' },
};

export function ProjectsScreen() {
  const { open } = useModal();
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Projects"
        description="Manage and monitor all your SEO projects"
        icon={<FolderKanban className="h-5 w-5" />}
        actions={
          <>
            <button
              onClick={() => open('import-project')}
              className="flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Import
            </button>
            <button
              onClick={() => open('new-project')}
              className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Projects', value: '6' },
          { label: 'Active', value: '4' },
          { label: 'Total Traffic', value: '742.3K' },
          { label: 'Avg. Health', value: '87%' },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projectList.map((p) => {
          const status = statusConfig[p.status];
          const trendUp = p.trend[p.trend.length - 1] >= p.trend[0];
          const data = p.trend.map((v, i) => ({ i, v }));
          return (
            <Card
              key={p.name}
              onClick={() => open('project-detail', p.name)}
              className="group cursor-pointer rounded-2xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground">
                    {p.favicon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <span
                      className={cn(
                        'mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        status.bg,
                        status.color
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {status.label}
                    </span>
                  </div>
                </div>
                <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                    <defs>
                      <linearGradient id={`pg-${p.favicon}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill={`url(#pg-${p.favicon})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 border-t pt-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Traffic</p>
                  <p className="text-sm font-semibold">{p.traffic}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Keywords</p>
                  <p className="text-sm font-semibold">{p.keywords.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Health</p>
                  <p className="text-sm font-semibold">{p.health}%</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Last audit {p.lastAudit}</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-semibold',
                    trendUp ? 'text-success' : 'text-destructive'
                  )}
                >
                  {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  DA {p.authority}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
