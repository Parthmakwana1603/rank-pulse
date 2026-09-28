import {
  LayoutDashboard,
  FolderKanban,
  Search,
  ShieldCheck,
  Link2,
  Users,
  FileText,
  Sparkles,
  BarChart3,
  Braces,
  TrendingUp,
  PanelLeftClose,
  PanelLeft,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sidebarItems } from '@/lib/seo-data';

const iconMap = {
  LayoutDashboard,
  FolderKanban,
  Search,
  ShieldCheck,
  Link2,
  Users,
  FileText,
  Sparkles,
  BarChart3,
  Braces,
};

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  active: string;
  onNavigate: (label: string) => void;
}

export function Sidebar({
  open: desktopOpen,
  onToggle,
  mobileOpen,
  onMobileClose,
  active,
  onNavigate,
}: SidebarProps) {
  // Below lg the sidebar is an off-canvas drawer that always shows labels.
  const open = desktopOpen || mobileOpen;
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-card transition-all duration-300',
          open ? 'w-64' : 'w-[76px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30">
            <TrendingUp className="h-5 w-5" />
          </div>
          {open && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold leading-tight">RankPulse</p>
              <p className="text-[11px] text-muted-foreground">SEO Suite</p>
            </div>
          )}
          <button
            onClick={onMobileClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-3">
          {sidebarItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const isActive = active === item.label;
            return (
              <button
                key={item.label}
                onClick={() => onNavigate(item.label)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                title={item.label}
              >
                <Icon
                  className={cn(
                    'h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110',
                    isActive && 'text-primary'
                  )}
                />
                {open && <span className="truncate">{item.label}</span>}
                {open && isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="hidden border-t p-3 lg:block">
          <button
            onClick={onToggle}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {open ? (
              <PanelLeftClose className="h-[18px] w-[18px]" />
            ) : (
              <PanelLeft className="h-[18px] w-[18px]" />
            )}
            {open && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
