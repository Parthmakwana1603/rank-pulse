import { ModalFooter, CancelButton, PrimaryButton, FieldLabel, FormAlert, SelectInput } from './modal-shell';
import { FileText, ShieldCheck, Search, Link2, Users, Sparkles, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useCreateReport, useReportTemplates, type CreateReportInput } from '@/lib/api/queries';
import { useSelectedProject } from '@/lib/project-context';
import { QueryFallback } from '../query-fallback';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const iconMap: Record<string, typeof FileText> = {
  FileText,
  ShieldCheck,
  Search,
  Link2,
  Users,
  Sparkles,
};

const reportSections = ['KPIs', 'Traffic', 'Keywords', 'Backlinks', 'Site Audit', 'Competitors', 'AI SEO'];

/** `initialTemplate` (a template key or name) preselects a template. */
export function GenerateReportModal({ onClose, initialTemplate }: { onClose: () => void; initialTemplate?: string }) {
  const templatesQuery = useReportTemplates();
  if (!templatesQuery.data) return <QueryFallback query={templatesQuery} skeleton={<Skeleton className="h-48 rounded-xl" />} />;
  const templates = templatesQuery.data;
  const start = Math.max(0, templates.findIndex((t) => t.key === initialTemplate || t.name === initialTemplate));
  return <ReportForm onClose={onClose} templates={templates} initialIndex={start} />;
}

function ReportForm({
  onClose,
  templates,
  initialIndex,
}: {
  onClose: () => void;
  templates: NonNullable<ReturnType<typeof useReportTemplates>['data']>;
  initialIndex: number;
}) {
  const { projectId } = useSelectedProject();
  const [selected, setSelected] = useState(initialIndex);
  const [dateRange, setDateRange] = useState<CreateReportInput['dateRangeDays']>(30);
  const [format, setFormat] = useState<CreateReportInput['format']>('pdf');
  const [sections, setSections] = useState<string[]>(templates[initialIndex]?.defaultSections ?? reportSections);
  const [formError, setFormError] = useState('');
  const createReport = useCreateReport();

  const chooseTemplate = (i: number) => {
    setSelected(i);
    if (templates[i].defaultSections) setSections(templates[i].defaultSections!);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const template = templates[selected];
    if (sections.length === 0) return setFormError('Choose at least one section.');
    if (!projectId || !template?.key) return setFormError('Choose a project and a template.');
    createReport.mutate({ projectId, template: template.key, format, dateRangeDays: dateRange, sections }, { onSuccess: onClose });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <FieldLabel>Report Template</FieldLabel>
        <div className="mt-1 grid grid-cols-2 gap-2.5">
          {templates.map((t, i) => {
            const Icon = iconMap[t.icon] ?? FileText;
            const isActive = selected === i;
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => chooseTemplate(i)}
                aria-pressed={isActive}
                className={cn(
                  'flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all',
                  isActive ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:bg-muted/50'
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
                {isActive && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="rep-range">Date Range</FieldLabel>
          <SelectInput id="rep-range" value={dateRange} onChange={(e) => setDateRange(Number(e.target.value) as CreateReportInput['dateRangeDays'])}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel htmlFor="rep-format">Format</FieldLabel>
          <SelectInput id="rep-format" value={format} onChange={(e) => setFormat(e.target.value as CreateReportInput['format'])}>
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
          </SelectInput>
        </div>
      </div>

      <div>
        <FieldLabel>Include Sections</FieldLabel>
        <div className="mt-1 flex flex-wrap gap-2">
          {reportSections.map((s) => (
            <label key={s} className="flex items-center gap-1.5 rounded-lg border bg-muted/30 px-3 py-1.5 text-sm">
              <input
                type="checkbox"
                checked={sections.includes(s)}
                onChange={(e) => setSections((prev) => (e.target.checked ? [...prev, s] : prev.filter((x) => x !== s)))}
                className="accent-primary"
              />
              {s}
            </label>
          ))}
        </div>
      </div>

      <FormAlert>{formError || createReport.error?.message}</FormAlert>

      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton type="submit" disabled={createReport.isPending}>
          {createReport.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Generate Report
        </PrimaryButton>
      </ModalFooter>
    </form>
  );
}
