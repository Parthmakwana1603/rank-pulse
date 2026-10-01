import { ModalFooter, CancelButton, PrimaryButton } from './modal-shell';
import { TrendingUp, Lightbulb } from 'lucide-react';
import { useContent } from '@/lib/api/queries';
import { QueryFallback } from '../query-fallback';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, NO_VALUE } from '@/lib/utils';
import { useModal } from './modal-context';

// General on-page advice (not measured for this page).
const tips = [
  'Add more internal links from high-authority pages',
  'Update the content freshness date to improve crawl frequency',
  'Add FAQ schema to capture more SERP features',
  'Improve title tag CTR with a number or power word',
];

/** `title` is the content item's id (or its title for older links). */
export function ContentDetailModal({ onClose, title }: { onClose: () => void; title: string }) {
  const { open } = useModal();
  const contentQuery = useContent();
  if (!contentQuery.data) return <QueryFallback query={contentQuery} skeleton={<Skeleton className="h-48 rounded-xl" />} />;
  const item = contentQuery.data.find((c) => c.id === title || c.title === title);
  if (!item) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">This content no longer exists.</p>
        <ModalFooter>
          <CancelButton onClose={onClose} />
        </ModalFooter>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-base font-semibold">{item.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{item.url}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Traffic', value: formatNumber(item.traffic) },
          { label: 'Keywords', value: formatNumber(item.keywords) },
          { label: 'Content Score', value: item.score > 0 ? String(item.score) : NO_VALUE },
          { label: 'Type', value: item.type },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-sm font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {item.traffic !== null && item.keywords !== null ? (
        <div className="flex items-center gap-2 rounded-xl border bg-muted/30 p-3 text-sm">
          <TrendingUp className="h-4 w-4 text-success" />
          <span className="text-muted-foreground">
            This page drives <span className="font-semibold text-foreground">{item.traffic.toLocaleString()}</span> monthly visits from <span className="font-semibold text-foreground">{item.keywords}</span> keywords.
          </span>
        </div>
      ) : (
        <div className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
          {item.primaryKeyword && (
            <p>
              Primary keyword: <span className="font-medium text-foreground">{item.primaryKeyword}</span>
            </p>
          )}
          {item.targetKeywords && item.targetKeywords.length > 0 && <p className="mt-1">Target keywords: {item.targetKeywords.join(', ')}</p>}
          {item.metaDescription && <p className="mt-1">Meta description: {item.metaDescription}</p>}
          <p className="mt-1 text-xs">Traffic and ranking keywords appear once an analytics integration is connected.</p>
        </div>
      )}

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
        <PrimaryButton onClick={() => (item.id ? open('new-content', item.id) : onClose())}>Edit Content</PrimaryButton>
      </ModalFooter>
    </div>
  );
}
