import { Gauge } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionHeader } from './section-header';
import { coreWebVitals } from '@/lib/seo-data';
import { cn } from '@/lib/utils';

const scoreConfig = {
  good: { color: 'text-success', bg: 'bg-success/10', ring: 'ring-success/30', label: 'Good' },
  'needs-improvement': { color: 'text-warning', bg: 'bg-warning/10', ring: 'ring-warning/30', label: 'Needs Work' },
  poor: { color: 'text-destructive', bg: 'bg-destructive/10', ring: 'ring-destructive/30', label: 'Poor' },
} as const;

export function CoreWebVitalsSection() {
  return (
    <Card className="rounded-2xl p-5 shadow-sm">
      <SectionHeader
        title="Core Web Vitals"
        description="Real-user performance metrics"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
            <Gauge className="h-3.5 w-3.5" />
            CrUX Data
          </span>
        }
      />
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {coreWebVitals.map((v) => {
          const cfg = scoreConfig[v.score as keyof typeof scoreConfig];
          return (
            <div
              key={v.metric}
              className={cn(
                'group rounded-xl border bg-muted/30 p-4 ring-1 ring-inset transition-all hover:-translate-y-0.5 hover:shadow-md',
                cfg.ring
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {v.metric}
                </span>
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    cfg.bg,
                    cfg.color
                  )}
                />
              </div>
              <p className="mt-2 text-2xl font-bold">{v.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{v.label}</p>
              <div className="mt-3 flex items-center justify-between border-t pt-2.5">
                <span className={cn('text-xs font-semibold', cfg.color)}>
                  {cfg.label}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Target {v.target}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
