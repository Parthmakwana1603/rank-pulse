import { ModalFooter, CancelButton, PrimaryButton } from './modal-shell';
import { TrendingUp, TrendingDown, ExternalLink, Lightbulb } from 'lucide-react';
import { contentList } from '@/lib/seo-data';
import { cn } from '@/lib/utils';

export function ContentDetailModal({ onClose, title }: { onClose: () => void; title: string }) {
  const item = contentList.find((c) => c.title === title) ?? contentList[0];

  const tips = [
    'Add more internal links from high-authority pages',
    'Update the content freshness date to improve crawl frequency',
    'Add FAQ schema to capture more SERP features',
    'Improve title tag CTR with a number or power word',
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-base font-semibold">{item.title}</p>
        <a href="#" className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline">
          <ExternalLink className="h-3 w-3" />
          {item.url}
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Traffic', value: item.traffic.toLocaleString() },
          { label: 'Keywords', value: String(item.keywords) },
          { label: 'Content Score', value: item.score > 0 ? String(item.score) : '—' },
          { label: 'Type', value: item.type },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-sm font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl border bg-muted/30 p-3 text-sm">
        <TrendingUp className="h-4 w-4 text-success" />
        <span className="text-muted-foreground">
          This page drives <span className="font-semibold text-foreground">{item.traffic.toLocaleString()}</span> monthly visits from <span className="font-semibold text-foreground">{item.keywords}</span> keywords.
        </span>
      </div>

      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-warning" />
          <p className="text-sm font-semibold">Optimization Tips</p>
        </div>
        <ul className="mt-2 space-y-1.5">
          {tips.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="text-warning">•</span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      <ModalFooter>
        <CancelButton onClose={onClose} />
        <PrimaryButton onClick={onClose}>Edit Content</PrimaryButton>
      </ModalFooter>
    </div>
  );
}
