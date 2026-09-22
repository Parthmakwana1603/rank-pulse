import { useState, useEffect } from 'react';
import { ModalFooter, CancelButton, PrimaryButton } from './modal-shell';
import { FileText, Loader2, CheckCircle2, Download } from 'lucide-react';

export function ExportPdfModal({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<'preparing' | 'ready'>('preparing');

  useEffect(() => {
    const timer = setTimeout(() => setState('ready'), 1500);
    return () => clearTimeout(timer);
  }, []);

  const sections = [
    'Executive Summary',
    'KPI Overview',
    'Organic Traffic',
    'Keyword Rankings',
    'Backlink Profile',
    'Site Audit',
    'Competitor Analysis',
    'AI SEO Metrics',
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">SEO Dashboard Export</p>
          <p className="text-xs text-muted-foreground">PDF · ~2.4 MB · acme-corp.com</p>
        </div>
        {state === 'preparing' ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-success" />
        )}
      </div>

      {state === 'preparing' && (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-primary to-accent" />
        </div>
      )}

      <div>
        <p className="text-sm font-semibold">Included Sections</p>
        <div className="mt-2 space-y-1.5">
          {sections.map((s) => (
            <div key={s} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-muted-foreground">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton onClick={onClose}>
          <span className="flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            {state === 'ready' ? 'Download PDF' : 'Preparing…'}
          </span>
        </PrimaryButton>
      </ModalFooter>
    </div>
  );
}
