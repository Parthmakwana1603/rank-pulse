import { ModalFooter, CancelButton, PrimaryButton, FormAlert } from './modal-shell';
import { AlertCircle, AlertTriangle, Info, ExternalLink, Wrench, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuditIssue, useSetIssueStatus } from '@/lib/api/queries';
import { dataMode } from '@/lib/api/client';
import { QueryFallback } from '../query-fallback';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const typeConfig = {
  error: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
  notice: { icon: Info, color: 'text-primary', bg: 'bg-primary/10' },
};

/** `issueTitle` is the issue's id. */
export function AuditIssueModal({ onClose, issueTitle: issueId }: { onClose: () => void; issueTitle: string }) {
  const issueQuery = useAuditIssue(issueId);
  const setStatus = useSetIssueStatus();
  if (!issueQuery.data) return <QueryFallback query={issueQuery} skeleton={<Skeleton className="h-48 rounded-xl" />} />;
  const issue = issueQuery.data;
  const cfg = typeConfig[issue.type];
  const Icon = cfg.icon;
  const fixed = issue.status === 'fixed';

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', cfg.bg)}>
          <Icon className={cn('h-5 w-5', cfg.color)} />
        </span>
        <div>
          <p className="text-base font-semibold">
            {issue.title}
            {fixed && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 align-middle text-[11px] font-semibold text-success">
                <CheckCircle2 className="h-3 w-3" /> Marked fixed
              </span>
            )}
          </p>
          <p className="text-sm text-muted-foreground">{issue.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-muted/30 p-3 text-center">
          <p className="text-2xl font-bold">{issue.occurrences}</p>
          <p className="text-xs text-muted-foreground">Issues</p>
        </div>
        <div className="rounded-xl border bg-muted/30 p-3 text-center">
          <p className="text-2xl font-bold">{issue.pages}</p>
          <p className="text-xs text-muted-foreground">Pages affected</p>
        </div>
        <div className="rounded-xl border bg-muted/30 p-3 text-center">
          <p className={cn('text-2xl font-bold capitalize', cfg.color)}>{issue.type}</p>
          <p className="text-xs text-muted-foreground">Severity</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold">Affected Pages</p>
        <div className="mt-2 max-h-60 space-y-1.5 overflow-y-auto">
          {issue.affectedPages.map((p) => (
            <div key={p.url + (p.detail ?? '')} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-muted-foreground">{p.url}</p>
                {p.detail && <p className="truncate text-xs text-muted-foreground/80">{p.detail}</p>}
              </div>
              {p.statusCode !== null && (
                <span className={cn('text-xs font-semibold', p.statusCode >= 400 ? 'text-destructive' : 'text-muted-foreground')}>{p.statusCode}</span>
              )}
            </div>
          ))}
        </div>
        {issue.pages > issue.affectedPages.length && (
          <p className="mt-1.5 text-xs text-muted-foreground">Showing the first {issue.affectedPages.length} of {issue.pages} pages.</p>
        )}
      </div>

      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Recommended Fixes</p>
        </div>
        <ol className="mt-2 space-y-1.5">
          {issue.recommendations.map((f, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-primary">{i + 1}.</span>
              {f}
            </li>
          ))}
        </ol>
      </div>

      <FormAlert>{setStatus.error?.message}</FormAlert>

      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton
          disabled={setStatus.isPending || dataMode === 'demo'}
          onClick={() => setStatus.mutate({ id: issue.id, status: fixed ? 'open' : 'fixed' })}
        >
          {setStatus.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {fixed ? 'Reopen Issue' : 'Mark as Fixed'}
        </PrimaryButton>
      </ModalFooter>
    </div>
  );
}
