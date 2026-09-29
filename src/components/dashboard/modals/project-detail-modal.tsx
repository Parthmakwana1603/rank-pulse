import { ModalFooter, CancelButton, PrimaryButton } from './modal-shell';
import { useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Link2, Search, ShieldCheck, Trash2, Loader2 } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useDeleteProject, useProjects } from '@/lib/api/queries';
import { QueryFallback } from '../query-fallback';
import { Skeleton } from '@/components/ui/skeleton';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.75rem',
  fontSize: '0.75rem',
};

export function ProjectDetailModal({ onClose, project }: { onClose: () => void; project: string }) {
  const projectsQuery = useProjects();
  const deleteProject = useDeleteProject();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  if (!projectsQuery.data) return <QueryFallback query={projectsQuery} skeleton={<Skeleton className="h-48 rounded-xl" />} />;
  const projectList = projectsQuery.data;
  // `project` is the project's id, or its name for demo projects without one.
  const data = projectList.find((p) => p.id === project || (!p.id && p.name === project));
  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">This project no longer exists.</p>
        <ModalFooter>
          <CancelButton onClose={onClose} />
        </ModalFooter>
      </div>
    );
  }
  const trendData = data.trend.map((v, i) => ({ i, v }));
  const hasTrend = data.trend.length > 1;
  const trendUp = hasTrend && data.trend[data.trend.length - 1] >= data.trend[0];

  const handleDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteProject.mutate(data, { onSuccess: onClose });
  };

  const stats = [
    { icon: Activity, label: 'Organic Traffic', value: data.traffic, color: 'text-primary' },
    { icon: Search, label: 'Keywords', value: data.keywords.toLocaleString(), color: 'text-accent' },
    { icon: ShieldCheck, label: 'Site Health', value: `${data.health}%`, color: 'text-success' },
    { icon: Link2, label: 'Authority', value: String(data.authority), color: 'text-chart-4' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-lg font-bold text-primary-foreground">
          {data.favicon}
        </span>
        <div>
          <p className="text-lg font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">Last audit {data.lastAudit}</p>
        </div>
      </div>

      <div className="h-32 rounded-xl border bg-muted/30 p-3">
        {!hasTrend ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Traffic history will appear once data starts coming in.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, bottom: 0, left: 0, right: 0 }}>
              <defs>
                <linearGradient id="pd-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#pd-grad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border bg-muted/30 p-3">
              <Icon className={`h-4 w-4 ${s.color}`} />
              <p className="mt-2 text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {hasTrend && (
        <div className="flex items-center gap-2 rounded-xl border bg-muted/30 p-3 text-sm">
          {trendUp ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
          <span className="text-muted-foreground">
            Traffic is {trendUp ? 'trending upward' : 'declining'} over the last {data.trend.length} data points.
          </span>
        </div>
      )}

      {deleteProject.error && (
        <div role="alert" className="rounded-xl border bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {deleteProject.error.message}
        </div>
      )}

      <ModalFooter>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteProject.isPending}
          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-destructive/30 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60 sm:mr-auto"
        >
          {deleteProject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {confirmingDelete ? 'Click again to delete' : 'Delete project'}
        </button>
        <CancelButton onClose={onClose} />
        <PrimaryButton onClick={onClose}>View Full Report</PrimaryButton>
      </ModalFooter>
    </div>
  );
}
