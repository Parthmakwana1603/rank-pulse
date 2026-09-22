import { ModalFooter, CancelButton, PrimaryButton, FieldLabel, SelectInput } from './modal-shell';
import { FileText, ShieldCheck, Search, Link2, Users, Sparkles, Check } from 'lucide-react';
import { useState } from 'react';
import { reportTemplates } from '@/lib/seo-data';
import { cn } from '@/lib/utils';

const iconMap: Record<string, typeof FileText> = {
  FileText,
  ShieldCheck,
  Search,
  Link2,
  Users,
  Sparkles,
};

export function GenerateReportModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState(0);

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Report Template</FieldLabel>
        <div className="mt-1 grid grid-cols-2 gap-2.5">
          {reportTemplates.map((t, i) => {
            const Icon = iconMap[t.icon] ?? FileText;
            const isActive = selected === i;
            return (
              <button
                key={t.name}
                onClick={() => setSelected(i)}
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
          <FieldLabel>Date Range</FieldLabel>
          <SelectInput defaultValue="30">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="custom">Custom range</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel>Format</FieldLabel>
          <SelectInput defaultValue="pdf">
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
          </SelectInput>
        </div>
      </div>

      <div>
        <FieldLabel>Include Sections</FieldLabel>
        <div className="mt-1 flex flex-wrap gap-2">
          {['KPIs', 'Traffic', 'Keywords', 'Backlinks', 'Site Audit', 'Competitors', 'AI SEO'].map((s) => (
            <label key={s} className="flex items-center gap-1.5 rounded-lg border bg-muted/30 px-3 py-1.5 text-sm">
              <input type="checkbox" defaultChecked className="accent-primary" />
              {s}
            </label>
          ))}
        </div>
      </div>

      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton onClick={onClose}>Generate Report</PrimaryButton>
      </ModalFooter>
    </div>
  );
}
