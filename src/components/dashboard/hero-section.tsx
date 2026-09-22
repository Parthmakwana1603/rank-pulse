import { Download, RefreshCw, Sparkles } from 'lucide-react';
import { projects } from '@/lib/seo-data';
import { useModal } from './modals/modal-provider';

export function HeroSection() {
  const { open } = useModal();
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-6 md:p-8">
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Welcome back, Jamie
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {projects[0].name}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Last updated 2 minutes ago · Tracking 18,420 keywords across 4,820 pages
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button className="flex h-10 items-center gap-2 rounded-xl border bg-background/60 px-4 text-sm font-medium backdrop-blur transition-colors hover:bg-muted">
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </button>
          <button
            onClick={() => open('export-pdf')}
            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/40"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
}
