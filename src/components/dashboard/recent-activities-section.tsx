import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Link2,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionHeader } from './section-header';
import { recentActivities, type Activity } from '@/lib/seo-data';
import { cn } from '@/lib/utils';

const typeConfig: Record<
  Activity['type'],
  { icon: LucideIcon; color: string; bg: string }
> = {
  ranked: { icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
  lost: { icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive/10' },
  audit: { icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary/10' },
  backlink: { icon: Link2, color: 'text-accent', bg: 'bg-accent/10' },
  ai: { icon: Sparkles, color: 'text-chart-4', bg: 'bg-chart-4/10' },
};

export function RecentActivitiesSection() {
  return (
    <Card className="rounded-2xl p-5 shadow-sm">
      <SectionHeader
        title="Recent Activities"
        description="Latest changes and events"
      />
      <div className="relative mt-5">
        <div className="absolute bottom-0 left-[15px] top-2 w-px bg-border" />
        <div className="space-y-5">
          {recentActivities.map((a) => {
            const cfg = typeConfig[a.type];
            const Icon = cfg.icon;
            return (
              <div key={a.id} className="relative flex gap-4">
                <span
                  className={cn(
                    'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background',
                    cfg.bg
                  )}
                >
                  <Icon className={cn('h-4 w-4', cfg.color)} />
                </span>
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {a.time}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {a.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
