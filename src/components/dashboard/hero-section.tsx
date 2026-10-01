import { Download, RefreshCw, Sparkles } from 'lucide-react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { useModal } from './modals/modal-provider';
import { useAuth } from '@/lib/auth-context';
import type { ProjectItem } from '@/lib/seo-data';
import { cn } from '@/lib/utils';

export function HeroSection({ project }: { project: ProjectItem | undefined }) {
  const { open } = useModal();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const refreshing = useIsFetching() > 0;
  const firstName = user?.name.split(' ')[0] || 'there';
  const details = project
    ? [
        project.websiteUrl,
        `Tracking ${project.keywords.toLocaleString()} keyword${project.keywords === 1 ? '' : 's'}`,
        project.lastAudit === 'not run yet' ? 'No site audit yet' : `Last audit ${project.lastAudit}`,
      ].filter(Boolean)
    : [];

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-6 md:p-8">
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Welcome back, {firstName}
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {project?.name ?? 'Your project'}
          </h1>
          {details.length > 0 && <p className="mt-1.5 text-sm text-muted-foreground">{details.join(' · ')}</p>}
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => void queryClient.invalidateQueries()}
            disabled={refreshing}
            className="flex h-10 items-center gap-2 rounded-xl border bg-background/60 px-4 text-sm font-medium backdrop-blur transition-colors hover:bg-muted disabled:opacity-60"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh Data
          </button>
          <button
            onClick={() => open('export-pdf', 'executive-summary')}
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
