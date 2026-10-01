import { BarChart3, Download, Plus, FileText, ShieldCheck, Search, Link2, Users, Sparkles, Calendar, Clock, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '../page-header';
import type { ReportItem } from '@/lib/seo-data';
import { useDownloadReport, useReportsData } from '@/lib/api/queries';
import { dataMode } from '@/lib/api/client';
import { scheduledReports } from '@/lib/seo-data';
import { EmptyState } from '../empty-state';
import { cn } from '@/lib/utils';
import { useModal } from '../modals/modal-provider';
import { QueryFallback } from '../query-fallback';

const typeIcon: Record<string, typeof FileText> = {
  FileText,
  ShieldCheck,
  Search,
  Link2,
  Users,
  Sparkles,
};

const statusConfig: Record<ReportItem['status'], { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  Ready: { color: 'text-success', bg: 'bg-success/10', icon: CheckCircle2 },
  Generating: { color: 'text-primary', bg: 'bg-primary/10', icon: Loader2 },
  Scheduled: { color: 'text-muted-foreground', bg: 'bg-muted', icon: Clock },
  Failed: { color: 'text-destructive', bg: 'bg-destructive/10', icon: XCircle },
};

export function ReportsScreen() {
  const { open } = useModal();
  const screenQuery = useReportsData();
  const download = useDownloadReport();
  if (!screenQuery.data) return <QueryFallback query={screenQuery} />;
  const { reports: reportList, templates: reportTemplates } = screenQuery.data;
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Reports"
        description="Generate, schedule, and download SEO reports"
        icon={<BarChart3 className="h-5 w-5" />}
        actions={
          <button
            onClick={() => open('generate-report')}
            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Report
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="min-w-0 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <h2 className="text-base font-semibold">Recent Reports</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{reportList.length} reports</p>
          {download.error && (
            <p role="alert" className="mt-3 rounded-xl border bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {download.error.message}
            </p>
          )}
          <div className="mt-4 space-y-2">
            {reportList.length === 0 && (
              <EmptyState title="No reports yet" description="Generate a report from a template. Finished files can be downloaded here." />
            )}
            {reportList.map((r) => {
              const status = statusConfig[r.status];
              const StatusIcon = status.icon;
              return (
                <div
                  key={r.id ?? r.name}
                  className="group flex items-center gap-3 rounded-xl border bg-muted/30 p-3.5 transition-colors hover:bg-muted/60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm">
                    <FileText className="h-5 w-5 text-primary" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {r.date}
                      </span>
                      <span>{r.type}</span>
                      {r.size !== '—' && <span>{r.size}</span>}
                      {r.status === 'Failed' && r.errorMessage && <span className="text-destructive">{r.errorMessage}</span>}
                    </div>
                  </div>
                  <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', status.bg, status.color)}>
                    <StatusIcon className={cn('h-3 w-3', r.status === 'Generating' && 'animate-spin')} />
                    {r.status}
                  </span>
                  {r.status === 'Ready' && (
                    <button
                      onClick={() => r.id && download.mutate(r.id)}
                      disabled={download.isPending}
                      aria-label={`Download ${r.name}`}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-background hover:text-primary disabled:opacity-60"
                    >
                      {download.isPending && download.variables === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold">Report Templates</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Quick-start with a template</p>
          <div className="mt-4 space-y-2.5">
            {reportTemplates.map((t) => {
              const Icon = typeIcon[t.icon] ?? FileText;
              return (
                <button
                  key={t.name}
                  onClick={() => open('generate-report', t.key ?? t.name)}
                  className="group flex w-full items-center gap-3 rounded-xl border bg-muted/30 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-semibold">Scheduled Reports</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Automated report delivery</p>
        {dataMode === 'api' && (
          <EmptyState
            className="mt-4"
            icon={<Clock className="h-5 w-5" />}
            title="Scheduled delivery isn't available yet"
            description="Reports can be generated and downloaded on demand. Scheduling and emailing them needs an email provider, which hasn't been set up."
          />
        )}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {(dataMode === 'demo' ? scheduledReports : []).map((s) => (
            <div key={s.name} className="rounded-xl border bg-muted/30 p-4 transition-colors hover:bg-muted/60">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">{s.name}</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{s.schedule}</p>
              <p className="mt-1 text-xs text-muted-foreground">To: {s.recipients}</p>
              <div className="mt-3 flex items-center justify-between border-t pt-2.5">
                <span className="text-xs text-muted-foreground">Next: {s.next}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
