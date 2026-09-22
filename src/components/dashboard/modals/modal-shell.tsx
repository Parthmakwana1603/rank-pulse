import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type ModalName =
  | 'new-project'
  | 'import-project'
  | 'project-detail'
  | 'add-keyword'
  | 'keyword-detail'
  | 'run-audit'
  | 'audit-issue'
  | 'add-backlink'
  | 'add-competitor'
  | 'new-content'
  | 'content-detail'
  | 'generate-report'
  | 'export-pdf';

interface ModalShellProps {
  name: ModalName;
  onClose: () => void;
  children: React.ReactNode;
}

const titles: Record<ModalName, { title: string; description: string; size: string }> = {
  'new-project': { title: 'Create New Project', description: 'Set up a new SEO project to track', size: 'max-w-lg' },
  'import-project': { title: 'Import Project', description: 'Import from Search Console or CSV', size: 'max-w-lg' },
  'project-detail': { title: 'Project Details', description: 'Detailed performance overview', size: 'max-w-2xl' },
  'add-keyword': { title: 'Add Keywords', description: 'Track new keywords to monitor', size: 'max-w-lg' },
  'keyword-detail': { title: 'Keyword Details', description: 'Ranking history and SERP analysis', size: 'max-w-2xl' },
  'run-audit': { title: 'Run Site Audit', description: 'Configure and start a new crawl', size: 'max-w-lg' },
  'audit-issue': { title: 'Issue Details', description: 'Affected pages and fix suggestions', size: 'max-w-2xl' },
  'add-backlink': { title: 'Add Backlink', description: 'Manually add or disavow a backlink', size: 'max-w-lg' },
  'add-competitor': { title: 'Add Competitor', description: 'Track a new competitor domain', size: 'max-w-lg' },
  'new-content': { title: 'Create Content', description: 'Add a new page or article to track', size: 'max-w-lg' },
  'content-detail': { title: 'Content Details', description: 'Performance and optimization tips', size: 'max-w-2xl' },
  'generate-report': { title: 'Generate Report', description: 'Choose a template and date range', size: 'max-w-lg' },
  'export-pdf': { title: 'Export as PDF', description: 'Select sections to include', size: 'max-w-md' },
};

export function ModalShell({ name, onClose, children }: ModalShellProps) {
  const meta = titles[name];
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={cn('max-h-[90vh] overflow-y-auto gap-0 p-0 sm:rounded-2xl', meta.size)}>
        <DialogHeader className="border-b p-5 pr-12">
          <DialogTitle className="text-lg">{meta.title}</DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>
        <div className="p-5">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
      {children}
    </div>
  );
}

export function CancelButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="h-10 rounded-xl border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted"
    >
      Cancel
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90"
    >
      {children}
    </button>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-muted-foreground">{children}</label>;
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="mt-1 h-10 w-full rounded-xl border bg-muted/40 px-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="mt-1 w-full rounded-xl border bg-muted/40 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
    />
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="mt-1 h-10 w-full rounded-xl border bg-muted/40 px-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
    />
  );
}
