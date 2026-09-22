import { ShieldCheck, AlertCircle, AlertTriangle, Info, RefreshCw, Download, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '../page-header';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { auditChecks, auditHistory, type AuditCheck } from '@/lib/seo-data';
import { cn } from '@/lib/utils';
import { useModal } from '../modals/modal-provider';

const typeConfig: Record<AuditCheck['type'], { icon: typeof AlertCircle; color: string; bg: string; ring: string }> = {
  error: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', ring: 'ring-destructive/20' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', ring: 'ring-warning/20' },
  notice: { icon: Info, color: 'text-primary', bg: 'bg-primary/10', ring: 'ring-primary/20' },
};

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.75rem',
  fontSize: '0.75rem',
};

export function SiteAuditScreen() {
  const { open } = useModal();
  const errors = auditChecks.filter((c) => c.type === 'error');
  const warnings = auditChecks.filter((c) => c.type === 'warning');
  const notices = auditChecks.filter((c) => c.type === 'notice');
  const totalErrors = errors.reduce((s, c) => s + c.count, 0);
  const totalWarnings = warnings.reduce((s, c) => s + c.count, 0);
  const totalNotices = notices.reduce((s, c) => s + c.count, 0);

  const summary = [
    { label: 'Errors', value: totalErrors, type: 'error' as const },
    { label: 'Warnings', value: totalWarnings, type: 'warning' as const },
    { label: 'Notices', value: totalNotices, type: 'notice' as const },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Site Audit"
        description="Technical health and crawl diagnostics"
        icon={<ShieldCheck className="h-5 w-5" />}
        actions={
          <>
            <button
              onClick={() => open('run-audit')}
              className="flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              <RefreshCw className="h-4 w-4" />
              Re-run Audit
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Site Health</p>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <ShieldCheck className="h-5 w-5 text-success" />
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-success">94%</p>
          <p className="mt-1 text-xs text-muted-foreground">+1.8% from last audit</p>
        </Card>
        {summary.map((s) => {
          const cfg = typeConfig[s.type];
          const Icon = cfg.icon;
          return (
            <Card key={s.label} className="rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', cfg.bg)}>
                  <Icon className={cn('h-5 w-5', cfg.color)} />
                </span>
              </div>
              <p className={cn('mt-2 text-3xl font-bold', cfg.color)}>{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {s.type === 'error' ? 'Critical issues' : s.type === 'warning' ? 'Should fix' : 'Good to know'}
              </p>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-semibold">Audit History</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Issue counts over the last 7 audits</p>
        <div className="mt-4 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={auditHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="errors" name="Errors" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar dataKey="warnings" name="Warnings" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar dataKey="notices" name="Notices" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {(['error', 'warning', 'notice'] as const).map((type) => {
          const cfg = typeConfig[type];
          const Icon = cfg.icon;
          const items = auditChecks.filter((c) => c.type === type);
          return (
            <Card key={type} className={cn('rounded-2xl p-5 shadow-sm ring-1 ring-inset', cfg.ring)}>
              <div className="flex items-center gap-2">
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', cfg.bg)}>
                  <Icon className={cn('h-4 w-4', cfg.color)} />
                </span>
                <div>
                  <p className="text-sm font-semibold capitalize">{type}s</p>
                  <p className="text-xs text-muted-foreground">{items.length} check types</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {items.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => open('audit-issue', item.title)}
                    className="group flex w-full items-center gap-3 rounded-xl border bg-muted/30 p-3 text-left transition-colors hover:bg-muted/60"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{item.title}</p>
                        <span className={cn('text-lg font-bold', cfg.color)}>{item.count}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{item.pages} pages affected</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
