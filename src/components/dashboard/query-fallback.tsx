import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageSkeleton } from './page-skeleton';

interface QueryFallbackProps {
  query: { error: Error | null; refetch: () => void };
  /** Placeholder shown while loading; defaults to the full-page skeleton. */
  skeleton?: ReactNode;
}

/** Loading/error view for a query that has no data yet. */
export function QueryFallback({ query, skeleton = <PageSkeleton /> }: QueryFallbackProps) {
  // Only show the skeleton if loading takes noticeably long, so fast responses don't flicker.
  const [showSkeleton, setShowSkeleton] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(true), 150);
    return () => clearTimeout(timer);
  }, []);

  if (query.error) {
    return (
      <Card role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl p-8 text-center shadow-sm">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold">Couldn't load this data</p>
          <p className="mt-1 text-sm text-muted-foreground">{query.error.message}</p>
        </div>
        <button
          onClick={query.refetch}
          className="flex h-9 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          <RotateCw className="h-4 w-4" />
          Try again
        </button>
      </Card>
    );
  }

  return showSkeleton ? <>{skeleton}</> : null;
}
