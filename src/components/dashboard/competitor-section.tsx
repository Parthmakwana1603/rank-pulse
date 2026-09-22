import { Card } from '@/components/ui/card';
import { SectionHeader } from './section-header';
import { competitors } from '@/lib/seo-data';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const metrics = [
  { key: 'traffic', label: 'Organic Traffic' },
  { key: 'keywords', label: 'Keywords' },
  { key: 'backlinks', label: 'Backlinks' },
  { key: 'trafficValue', label: 'Traffic Value' },
] as const;

export function CompetitorSection() {
  return (
    <Card className="rounded-2xl p-5 shadow-sm">
      <SectionHeader
        title="Competitor Analysis"
        description="Side-by-side performance comparison"
      />
      <div className="scrollbar-thin mt-4 overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-4 gap-4">
          {competitors.map((c) => (
            <div
              key={c.name}
              className={cn(
                'flex flex-col rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md',
                c.isYou
                  ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                  : 'bg-muted/30'
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold',
                    c.isYou
                      ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {c.name[0]}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-tight">{c.name}</p>
                  {c.isYou && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary">
                      <Check className="h-3 w-3" /> You
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 mb-4">
                <div className="flex items-end justify-between">
                  <span className="text-xs text-muted-foreground">Authority</span>
                  <span className="text-lg font-bold">{c.authority}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      c.isYou
                        ? 'bg-gradient-to-r from-primary to-accent'
                        : 'bg-gradient-to-r from-chart-4 to-chart-5'
                    )}
                    style={{ width: `${c.authority}%` }}
                  />
                </div>
              </div>

              <div className="mt-auto space-y-2.5 border-t pt-3">
                {metrics.map((m) => (
                  <div key={m.key} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                    <span className="text-sm font-semibold">
                      {c[m.key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
