import { Sparkles, TrendingUp, Brain, Globe, Quote, Cpu, Code, FileCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SectionHeader } from './section-header';
import { aiSeoMetrics } from '@/lib/seo-data';
import { cn } from '@/lib/utils';

const iconMap = {
  'AI Visibility Score': Brain,
  'GEO Score': Globe,
  'AI Search Mentions': Sparkles,
  'Citation Score': Quote,
  'LLM Readiness': Cpu,
  'Structured Data Score': Code,
  'Content Quality Score': FileCheck,
};

const accentBg: Record<string, string> = {
  primary: 'from-primary/20 to-primary/5 text-primary',
  accent: 'from-accent/20 to-accent/5 text-accent',
  'chart-4': 'from-chart-4/20 to-chart-4/5 text-chart-4',
};

export function AiSeoSection() {
  return (
    <Card className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-chart-4/5 via-card to-primary/5 p-5 shadow-sm">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-chart-4/10 blur-3xl" />
      <SectionHeader
        title="AI SEO & GEO"
        description="Generative engine optimization metrics"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-chart-4/10 px-3 py-1 text-xs font-semibold text-chart-4">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered
          </span>
        }
      />
      <div className="relative mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {aiSeoMetrics.map((m) => {
          const Icon = iconMap[m.label as keyof typeof iconMap] ?? Sparkles;
          const isCount = m.value > 100;
          return (
            <div
              key={m.label}
              className="group rounded-xl border bg-card/80 p-3.5 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br',
                  accentBg[m.accent]
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-2.5 text-xs text-muted-foreground">{m.label}</p>
              <p className="mt-0.5 text-xl font-bold">
                {isCount ? m.value.toLocaleString() : m.value}
              </p>
              <span className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold text-success">
                <TrendingUp className="h-3 w-3" />+{m.change}%
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
