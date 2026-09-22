import { useState } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Calendar,
  Check,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/lib/auth-context';
import { projects, notifications } from '@/lib/seo-data';

interface TopbarProps {
  onNavigate: (label: string) => void;
}

export function Topbar({ onNavigate }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [projectOpen, setProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <div className="relative hidden flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search projects, keywords, reports…"
          className="h-9 w-full max-w-md rounded-xl border bg-muted/50 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <div className="relative">
          <button
            onClick={() => setProjectOpen((v) => !v)}
            className="flex h-9 items-center gap-2 rounded-xl border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-[11px] font-bold text-primary-foreground">
              {selectedProject.favicon}
            </span>
            <span className="hidden max-w-[140px] truncate sm:block">
              {selectedProject.name}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          {projectOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setProjectOpen(false)}
              />
              <div className="absolute right-0 top-11 z-20 w-64 rounded-xl border bg-popover p-2 shadow-xl">
                {projects.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setSelectedProject(p);
                      setProjectOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-[11px] font-bold text-primary-foreground">
                      {p.favicon}
                    </span>
                    <span className="flex-1 text-left">{p.name}</span>
                    {selectedProject.name === p.name && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button className="hidden h-9 items-center gap-2 rounded-xl border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted lg:flex">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>Last 30 days</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border bg-card transition-colors hover:bg-muted"
          >
            <Bell className="h-[18px] w-[18px] text-muted-foreground" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
          </button>
          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 top-11 z-20 w-80 rounded-xl border bg-popover p-2 shadow-xl">
                <p className="px-2.5 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Notifications
                </p>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-muted"
                  >
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {n.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{n.time}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border bg-card transition-colors hover:bg-muted"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-[18px] w-[18px] text-muted-foreground" />
          ) : (
            <Moon className="h-[18px] w-[18px] text-muted-foreground" />
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setUserOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-xl border bg-card py-1 pl-1 pr-3 transition-colors hover:bg-muted"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-chart-4 to-chart-5 text-xs font-bold text-white">
              {user?.initials ?? 'JD'}
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-xs font-semibold">{user?.name ?? 'Jamie Doe'}</p>
              <p className="text-[10px] text-muted-foreground">{user?.plan ?? 'Pro Plan'}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {userOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
              <div className="absolute right-0 top-12 z-20 w-60 rounded-xl border bg-popover p-2 shadow-xl">
                <div className="flex items-center gap-3 rounded-lg px-2.5 py-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-chart-4 to-chart-5 text-xs font-bold text-white">
                    {user?.initials ?? 'JD'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user?.name ?? 'Jamie Doe'}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email ?? 'jamie@acme.com'}</p>
                  </div>
                </div>
                <div className="my-1.5 border-t" />
                <button
                  onClick={() => {
                    onNavigate('Settings');
                    setUserOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Profile
                </button>
                <button
                  onClick={() => {
                    onNavigate('Settings');
                    setUserOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Settings
                </button>
                <div className="my-1.5 border-t" />
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
