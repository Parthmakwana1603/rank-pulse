import { AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionHeader } from './section-header';
import { auditIssues, type AuditIssue } from '@/lib/seo-data';
import { cn } from '@/lib/utils';

const typeConfig: Record<
  AuditIssue['type'],
  { icon: typeof AlertCircle; color: string; bg: string; ring: string }
> = {
  error: {
    icon: AlertCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    ring: 'ring-destructive/20',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bg: 'bg-warning/10',
    ring: 'ring-warning/20',
  },
  notice: {
    icon: Info,
    color: 'text-primary',
    bg: 'bg-primary/10',
    ring: 'ring-primary/20',
  },
};

export function SiteAuditSection() {
  const errors = auditIssues.filter((i) => i.type === 'error');
  const warnings = auditIssues.filter((i) => i.type === 'warning');
  const notices = auditIssues.filter((i) => i.type === 'notice');

  const groups = [
    { label: 'Errors', items: errors, type: 'error' as const },
    { label: 'Warnings', items: warnings, type: 'warning' as const },
    { label: 'Notices', items: notices, type: 'notice' as const },
  ];

  return (
    <Card className="rounded-2xl p-5 shadow-sm">
      <SectionHeader
        title="Site Audit"
        description="Technical issues detected on your site"
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1.5 text-xs font-semibold text-success">
              <span className="h-2 w-2 rounded-full bg-success" />
              94% Healthy
            </div>
          </div>
        }
      />
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {groups.map((group) => {
          const config = typeConfig[group.type];
          const Icon = config.icon;
          const total = group.items.reduce((sum, i) => sum + i.count, 0);
          return (
            <div
              key={group.label}
              className={cn(
                'rounded-xl border bg-muted/30 p-4 ring-1 ring-inset',
                config.ring
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg',
                      config.bg
                    )}
                  >
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </span>
                  <span className="text-sm font-semibold">{group.label}</span>
                </div>
                <span className={cn('text-lg font-bold', config.color)}>
                  {total}
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                {group.items.map((item) => (
                  <button
                    key={item.title}
                    className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-background"
                  >
                    <span className="flex-1 text-left text-muted-foreground">
                      {item.title}
                    </span>
                    <span className="text-xs font-semibold">{item.count}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
