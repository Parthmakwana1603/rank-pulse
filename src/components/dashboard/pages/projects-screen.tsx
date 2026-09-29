import { FolderKanban, Plus, MoreHorizontal, TrendingUp, TrendingDown, Minus, Sparkles, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '../page-header';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import type { ProjectItem } from '@/lib/seo-data';
import { useAddSampleProjects, useProjects } from '@/lib/api/queries';
import { useAuth } from '@/lib/auth-context';
import { cn, formatCompactNumber, parseCompactNumber } from '@/lib/utils';
import { useModal } from '../modals/modal-provider';
import { QueryFallback } from '../query-fallback';

const statusConfig: Record<ProjectItem['status'], { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-success', bg: 'bg-success/10' },
  paused: { label: 'Paused', color: 'text-muted-foreground', bg: 'bg-muted' },
  warning: { label: 'Needs Attention', color: 'text-warning', bg: 'bg-warning/10' },
};

function summarize(projects: ProjectItem[]) {
  const traffic = projects.map((p) => parseCompactNumber(p.traffic)).filter((n): n is number => n !== null);
  const audited = projects.filter((p) => p.health > 0);
  return [
    { label: 'Total Projects', value: String(projects.length) },
    { label: 'Active', value: String(projects.filter((p) => p.status === 'active').length) },
    { label: 'Total Traffic', value: traffic.length ? formatCompactNumber(traffic.reduce((a, b) => a + b, 0)) : '—' },
    {
      label: 'Avg. Health',
      value: audited.length ? `${Math.round(audited.reduce((a, p) => a + p.health, 0) / audited.length)}%` : '—',
    },
  ];
}

export function ProjectsScreen() {
  const { open } = useModal();
  const { mode } = useAuth();
  const projectsQuery = useProjects();
  const addSamples = useAddSampleProjects();
  if (!projectsQuery.data) return <QueryFallback query={projectsQuery} />;
  const projectList = projectsQuery.data;
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
        {summarize(projectList).map((stat) => (
          <Card key={stat.label} className="rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </Card>
        ))}
      </div>

      {projectList.length === 0 && (
        <Card className="flex flex-col items-center gap-3 rounded-2xl p-10 text-center shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FolderKanban className="h-6 w-6" />
          </span>
          <div>
            <p className="font-semibold">No projects yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add the website you want to track, or load sample projects to explore the dashboard.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            <button
              onClick={() => open('new-project')}
              className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
            {mode === 'supabase' && (
              <button
                onClick={() => addSamples.mutate()}
                disabled={addSamples.isPending}
                className="flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
              >
                {addSamples.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Add sample projects
              </button>
            )}
          </div>
          {addSamples.error && (
            <p role="alert" className="text-sm text-destructive">
              {addSamples.error.message}
            </p>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projectList.map((p, index) => {
          const status = statusConfig[p.status];
          const hasTrend = p.trend.length > 1;
          const trendUp = hasTrend && p.trend[p.trend.length - 1] >= p.trend[0];
          const TrendIcon = !hasTrend ? Minus : trendUp ? TrendingUp : TrendingDown;
          const data = p.trend.map((v, i) => ({ i, v }));
          const gradientId = `pg-${index}`;
          return (
            <Card
              key={p.id ?? p.name}
              onClick={() => open('project-detail', p.id ?? p.name)}
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
                {!hasTrend ? (
                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                    No traffic data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                      <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill={`url(#${gradientId})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
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
                    !hasTrend ? 'text-muted-foreground' : trendUp ? 'text-success' : 'text-destructive'
                  )}
                >
                  <TrendIcon className="h-3 w-3" />
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
