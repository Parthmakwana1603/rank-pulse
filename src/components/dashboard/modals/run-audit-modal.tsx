import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModalFooter, CancelButton, PrimaryButton, FieldLabel, SelectInput, TextInput } from './modal-shell';
import { ShieldCheck, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuditOverview, useAuditRun, useRefreshAfterAudit, useStartAudit, type StartAuditInput } from '@/lib/api/queries';
import type { AuditRunDto } from '@/lib/api/types';
import { useSelectedProject } from '@/lib/project-context';

const steps = ['Configuring', 'Crawling pages', 'Analyzing issues', 'Complete'] as const;
const depthLimits = { quick: 100, standard: 500, full: 1000 } as const;

function stepOf(run: AuditRunDto) {
  if (run.status === 'completed') return 3;
  if (run.phase === 'analyzing') return 2;
  if (run.phase === 'crawling') return 1;
  return 0;
}

export function RunAuditModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { project, projectId } = useSelectedProject();
  const [crawlDepth, setCrawlDepth] = useState<StartAuditInput['crawlDepth']>('standard');
  const [maxPages, setMaxPages] = useState('500');
  const [userAgent, setUserAgent] = useState<StartAuditInput['userAgent']>('desktop');
  const [formError, setFormError] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const start = useStartAudit();
  const overview = useAuditOverview();
  // An audit that's already running (e.g. started earlier) is shown instead of the form.
  const activeId = runId ?? overview.data?.runningId ?? null;
  const runQuery = useAuditRun(activeId);
  const run = runQuery.data;
  const refreshAfterAudit = useRefreshAfterAudit();
  const refreshed = useRef(false);

  useEffect(() => {
    if (run && (run.status === 'completed' || run.status === 'failed') && !refreshed.current) {
      refreshed.current = true;
      void refreshAfterAudit();
    }
  }, [run, refreshAfterAudit]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!projectId) return setFormError('Create a project first.');
    const pages = Number(maxPages);
    if (!Number.isInteger(pages) || pages < 1 || pages > 1000) return setFormError('Max pages must be a whole number from 1 to 1,000.');
    start.mutate(
      { projectId, crawlDepth, maxPages: Math.min(pages, depthLimits[crawlDepth]), userAgent },
      { onSuccess: (created) => setRunId(created.id) }
    );
  };

  if (!activeId) {
    const error = formError || start.error?.message;
    return (
      <form onSubmit={handleStart} className="space-y-4" noValidate>
        {project && (
          <p className="text-xs text-muted-foreground">
            Crawls <span className="font-medium text-foreground">{project.websiteUrl ?? project.name}</span>, following links on the same site and respecting robots.txt.
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="audit-depth">Crawl Depth</FieldLabel>
            <SelectInput
              id="audit-depth"
              value={crawlDepth}
              onChange={(e) => {
                const depth = e.target.value as StartAuditInput['crawlDepth'];
                setCrawlDepth(depth);
                setMaxPages(String(depthLimits[depth]));
              }}
            >
              <option value="quick">Quick (top 100 pages)</option>
              <option value="standard">Standard (top 500 pages)</option>
              <option value="full">Full (up to 1,000 pages)</option>
            </SelectInput>
          </div>
          <div>
            <FieldLabel htmlFor="audit-max">Max Pages</FieldLabel>
            <TextInput id="audit-max" type="number" min={1} max={depthLimits[crawlDepth]} value={maxPages} onChange={(e) => setMaxPages(e.target.value)} />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="audit-agent">User Agent</FieldLabel>
          <SelectInput id="audit-agent" value={userAgent} onChange={(e) => setUserAgent(e.target.value as StartAuditInput['userAgent'])}>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
            <option value="googlebot">Googlebot</option>
          </SelectInput>
        </div>
        {error && (
          <div role="alert" className="rounded-xl border bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}
        <ModalFooter>
          <CancelButton onClose={onClose} />
          <PrimaryButton type="submit" disabled={start.isPending}>
            {start.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Start Audit
          </PrimaryButton>
        </ModalFooter>
      </form>
    );
  }

  const phase = run ? stepOf(run) : 0;
  const isDone = run?.status === 'completed';
  const failed = run?.status === 'failed';
  const progress = isDone
    ? 100
    : run && run.phase === 'crawling'
      ? 25 + Math.min(50, (run.pagesCrawled / run.maxPages) * 50)
      : ((phase + 1) / 4) * 100;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          {isDone ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : failed ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          <p className="text-sm font-semibold">
            {isDone ? 'Audit Complete' : failed ? 'Audit Failed' : `Audit in progress — ${steps[phase]}…`}
          </p>
        </div>
        {!failed && (
          <>
            <div className="mt-3 space-y-2">
              {steps.map((step, i) => {
                const done = i <= phase;
                return (
                  <div key={step} className="flex items-center gap-2.5 text-sm">
                    {done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <div className="h-4 w-4 rounded-full border-2 border-muted" />}
                    <span className={done ? 'text-foreground' : 'text-muted-foreground'}>
                      {step}
                      {i === 1 && run && run.pagesCrawled > 0 && ` (${run.pagesCrawled} of up to ${run.maxPages})`}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </>
        )}
      </div>

      {runQuery.error && (
        <div role="alert" className="rounded-xl border bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {runQuery.error.message}
        </div>
      )}
      {failed && (
        <div role="alert" className="rounded-xl border bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {run?.errorMessage ?? 'The audit failed.'}
        </div>
      )}
      {isDone && run && (
        <div className="flex items-center gap-2 rounded-xl border bg-success/10 p-3 text-sm text-success">
          <ShieldCheck className="h-4 w-4" />
          {run.healthScore}% site health · {run.errors} errors · {run.warnings} warnings · {run.notices} notices across {run.pagesCrawled} pages.
        </div>
      )}

      <ModalFooter>
        <CancelButton onClose={onClose} />
        {failed ? (
          <PrimaryButton
            onClick={() => {
              setRunId(null);
              refreshed.current = false;
            }}
          >
            Try Again
          </PrimaryButton>
        ) : (
          <PrimaryButton
            onClick={() => {
              onClose();
              if (isDone) navigate('/site-audit');
            }}
          >
            {isDone ? 'View Results' : 'Run in Background'}
          </PrimaryButton>
        )}
      </ModalFooter>
    </div>
  );
}
