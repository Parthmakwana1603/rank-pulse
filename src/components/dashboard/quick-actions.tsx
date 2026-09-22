import {
  ShieldCheck,
  Search,
  FileText,
  Users,
  Download,
  type LucideIcon,
} from 'lucide-react';
import { quickActions } from '@/lib/seo-data';
import { useModal } from './modals/modal-provider';

const iconMap: Record<string, LucideIcon> = {
  ShieldCheck,
  Search,
  FileText,
  Users,
  Download,
};

const actionToModal: Record<string, string> = {
  'Run Site Audit': 'run-audit',
  'Track Keywords': 'add-keyword',
  'Generate SEO Report': 'generate-report',
  'Analyse Competitor': 'add-competitor',
  'Export PDF': 'export-pdf',
};

export function QuickActions() {
  const { open } = useModal();
  return (
    <div className="flex flex-wrap gap-2.5">
      {quickActions.map((action) => {
        const Icon = iconMap[action.icon];
        return (
          <button
            key={action.label}
            onClick={() => open(actionToModal[action.label] as never)}
            className="group flex h-10 items-center gap-2 rounded-xl border bg-card px-3.5 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <Icon className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
