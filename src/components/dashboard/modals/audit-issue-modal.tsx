import { ModalFooter, CancelButton, PrimaryButton } from './modal-shell';
import { AlertCircle, AlertTriangle, Info, ExternalLink, Wrench } from 'lucide-react';
import { auditChecks } from '@/lib/seo-data';
import { cn } from '@/lib/utils';

const typeConfig = {
  error: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
  notice: { icon: Info, color: 'text-primary', bg: 'bg-primary/10' },
};

const mockPages = [
  { url: '/blog/old-post-1', status: '404', severity: 'High' },
  { url: '/products/discontinued', status: '404', severity: 'High' },
  { url: '/landing/campaign-2023', status: '500', severity: 'Critical' },
  { url: '/help/faq-old', status: '404', severity: 'Medium' },
];

export function AuditIssueModal({ onClose, issueTitle }: { onClose: () => void; issueTitle: string }) {
  const issue = auditChecks.find((c) => c.title === issueTitle) ?? auditChecks[0];
  const cfg = typeConfig[issue.type];
  const Icon = cfg.icon;

  const fixes = [
    'Run a full site crawl to identify all affected URLs',
    'Set up 301 redirects for broken links to relevant pages',
    'Update internal links pointing to removed pages',
    'Submit an updated XML sitemap to Google Search Console',
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', cfg.bg)}>
          <Icon className={cn('h-5 w-5', cfg.color)} />
        </span>
        <div>
          <p className="text-base font-semibold">{issue.title}</p>
          <p className="text-sm text-muted-foreground">{issue.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-muted/30 p-3 text-center">
          <p className="text-2xl font-bold">{issue.count}</p>
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
        <div className="mt-2 space-y-1.5">
          {mockPages.map((p) => (
            <div key={p.url} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1 truncate text-muted-foreground">{p.url}</span>
              <span className="text-xs font-semibold text-destructive">{p.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Recommended Fixes</p>
        </div>
        <ol className="mt-2 space-y-1.5">
          {fixes.map((f, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-primary">{i + 1}.</span>
              {f}
            </li>
          ))}
        </ol>
      </div>

      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton onClick={onClose}>Mark as Fixed</PrimaryButton>
      </ModalFooter>
    </div>
  );
}
