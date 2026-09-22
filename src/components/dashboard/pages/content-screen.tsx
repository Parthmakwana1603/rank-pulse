import { FileText, Plus, TrendingUp, TrendingDown, MoreHorizontal, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '../page-header';
import { contentList, contentStats, type ContentItem } from '@/lib/seo-data';
import { cn } from '@/lib/utils';
import { useModal } from '../modals/modal-provider';

const statusConfig: Record<ContentItem['status'], { color: string; bg: string }> = {
  Published: { color: 'text-success', bg: 'bg-success/10' },
  Draft: { color: 'text-muted-foreground', bg: 'bg-muted' },
  'Needs Update': { color: 'text-warning', bg: 'bg-warning/10' },
  Outdated: { color: 'text-destructive', bg: 'bg-destructive/10' },
};

const typeColor: Record<ContentItem['type'], string> = {
  Blog: 'bg-primary/10 text-primary',
  Landing: 'bg-accent/10 text-accent',
  Tool: 'bg-chart-4/10 text-chart-4',
  Guide: 'bg-chart-5/10 text-chart-5',
};

function scoreColor(s: number) {
  if (s >= 85) return 'text-success';
  if (s >= 70) return 'text-warning';
  return 'text-destructive';
}

export function ContentScreen() {
  const { open } = useModal();
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Content"
        description="Manage and evaluate your content performance"
        icon={<FileText className="h-5 w-5" />}
        actions={
          <>
            <button className="flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button
              onClick={() => open('new-content')}
              className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Content
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {contentStats.map((s) => (
          <Card key={s.label} className="rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
            <span
              className={cn(
                'mt-1 inline-flex items-center gap-0.5 text-xs font-semibold',
                s.change >= 0 ? 'text-success' : 'text-destructive'
              )}
            >
              {s.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(s.change)}%
            </span>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Content Library</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{contentList.length} pages tracked</p>
          </div>
        </div>
        <div className="scrollbar-thin mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Title</th>
                <th className="pb-3 pr-4 font-medium">Type</th>
                <th className="pb-3 pr-4 font-medium">Traffic</th>
                <th className="pb-3 pr-4 font-medium">Keywords</th>
                <th className="pb-3 pr-4 font-medium">Score</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Updated</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {contentList.map((item) => {
                const status = statusConfig[item.status];
                return (
                  <tr key={item.url} onClick={() => open('content-detail', item.title)} className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.url}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', typeColor[item.type])}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{item.traffic.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{item.keywords}</td>
                    <td className="py-3 pr-4">
                      {item.score > 0 ? (
                        <span className={cn('text-sm font-bold', scoreColor(item.score))}>{item.score}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', status.bg, status.color)}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{item.updated}</td>
                    <td className="py-3">
                      <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
