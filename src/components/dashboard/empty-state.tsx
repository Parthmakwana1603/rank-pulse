import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Placeholder for a section with no data yet (new project, or a data source not connected). */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center', className)}>
      {icon && <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">{icon}</span>}
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-md text-xs text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

/** Table row version of EmptyState. */
export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-8 text-center text-sm text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}
