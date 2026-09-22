import { useState } from 'react';
import { Settings, User, Bell, Plug, CreditCard, Palette, Code, Check, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '../page-header';
import { useTheme } from '@/components/theme-provider';
import { settingsSections, integrations, notificationSettings, planInfo } from '@/lib/seo-data';
import { cn } from '@/lib/utils';

const iconMap: Record<string, typeof User> = {
  User,
  Bell,
  Plug,
  CreditCard,
  Palette,
  Code,
};

export function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('profile');
  const [notifState, setNotifState] = useState(notificationSettings);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account, preferences, and integrations"
        icon={<Settings className="h-5 w-5" />}
      />

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit rounded-2xl p-3 shadow-sm">
          <nav className="space-y-1">
            {settingsSections.map((s) => {
              const Icon = iconMap[s.icon] ?? User;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </Card>

        <div className="space-y-4">
          {activeSection === 'profile' && (
            <Card className="rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold">Profile</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Update your personal information</p>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-chart-4 to-chart-5 text-xl font-bold text-white">
                  JD
                </div>
                <button className="rounded-xl border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
                  Change Avatar
                </button>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  { label: 'Full Name', value: 'Jamie Doe' },
                  { label: 'Email', value: 'jamie@acme.com' },
                  { label: 'Company', value: 'Acme Corporation' },
                  { label: 'Role', value: 'SEO Manager' },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                    <input
                      type="text"
                      defaultValue={f.value}
                      className="mt-1 h-10 w-full rounded-xl border bg-muted/40 px-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end gap-2.5">
                <button className="rounded-xl border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">Cancel</button>
                <button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90">Save Changes</button>
              </div>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card className="rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold">Notifications</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Choose how you want to be notified</p>
              <div className="mt-5 space-y-1">
                <div className="grid grid-cols-[1fr_80px_80px] gap-2 border-b pb-2 text-xs font-medium text-muted-foreground">
                  <span>Event</span>
                  <span className="text-center">Email</span>
                  <span className="text-center">Push</span>
                </div>
                {notifState.map((n, i) => (
                  <div key={n.label} className="grid grid-cols-[1fr_80px_80px] items-center gap-2 border-b py-3 last:border-0">
                    <span className="text-sm">{n.label}</span>
                    <div className="flex justify-center">
                      <button
                        onClick={() => setNotifState((prev) => prev.map((item, idx) => idx === i ? { ...item, email: !item.email } : item))}
                        className={cn('relative h-6 w-11 rounded-full transition-colors', n.email ? 'bg-primary' : 'bg-muted')}
                      >
                        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', n.email ? 'translate-x-5' : 'translate-x-0.5')} />
                      </button>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => setNotifState((prev) => prev.map((item, idx) => idx === i ? { ...item, push: !item.push } : item))}
                        className={cn('relative h-6 w-11 rounded-full transition-colors', n.push ? 'bg-primary' : 'bg-muted')}
                      >
                        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', n.push ? 'translate-x-5' : 'translate-x-0.5')} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeSection === 'integrations' && (
            <Card className="rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold">Integrations</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Connect your tools and services</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {integrations.map((int) => (
                  <div key={int.name} className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4 transition-colors hover:bg-muted/60">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-sm font-bold text-primary shadow-sm">
                      {int.name[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{int.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{int.description}</p>
                    </div>
                    {int.connected ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                        <Check className="h-3 w-3" />
                        Connected
                      </span>
                    ) : (
                      <button className="rounded-lg border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted">
                        Connect
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeSection === 'billing' && (
            <div className="space-y-4">
              <Card className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-6 shadow-sm">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <Check className="h-3.5 w-3.5" />
                      {planInfo.name}
                    </span>
                    <p className="mt-3 text-3xl font-bold">{planInfo.price}<span className="text-base font-normal text-muted-foreground">{planInfo.cycle}</span></p>
                    <p className="mt-1 text-sm text-muted-foreground">Renews on {planInfo.renewal}</p>
                  </div>
                  <div className="flex gap-2.5">
                    <button className="rounded-xl border bg-background/60 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-muted">Change Plan</button>
                    <button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90">Upgrade</button>
                  </div>
                </div>
                <div className="relative mt-5 grid grid-cols-3 gap-3 border-t pt-4">
                  <div><p className="text-xs text-muted-foreground">Projects</p><p className="text-sm font-semibold">{planInfo.projects}</p></div>
                  <div><p className="text-xs text-muted-foreground">Keywords</p><p className="text-sm font-semibold">{planInfo.keywords}</p></div>
                  <div><p className="text-xs text-muted-foreground">Audits</p><p className="text-sm font-semibold">{planInfo.audits}</p></div>
                </div>
              </Card>
              <Card className="rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-semibold">Billing History</h2>
                <div className="mt-4 space-y-2">
                  {['Jul 15, 2025', 'Jun 15, 2025', 'May 15, 2025'].map((d) => (
                    <div key={d} className="flex items-center justify-between rounded-xl border bg-muted/30 p-3.5 text-sm">
                      <span className="font-medium">{planInfo.name}</span>
                      <span className="text-muted-foreground">{d}</span>
                      <span className="font-semibold">{planInfo.price}</span>
                      <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-primary">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'appearance' && (
            <Card className="rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold">Appearance</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Customize how RankPulse looks</p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                {[
                  { key: 'light', label: 'Light', bg: 'bg-background border-border' },
                  { key: 'dark', label: 'Dark', bg: 'bg-zinc-900 border-zinc-800' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { if ((opt.key === 'dark') !== (theme === 'dark')) toggleTheme(); }}
                    className={cn(
                      'rounded-2xl border-2 p-4 text-left transition-all',
                      theme === opt.key ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className={cn('h-24 rounded-xl border', opt.bg)}>
                      <div className="flex h-full items-center justify-center">
                        <span className={cn('text-sm font-medium', opt.key === 'dark' ? 'text-zinc-100' : 'text-foreground')}>
                          {opt.label} Mode
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={cn('h-4 w-4 rounded-full border-2', theme === opt.key ? 'border-primary bg-primary' : 'border-muted')} />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {activeSection === 'api' && (
            <Card className="rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold">API Access</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Manage your API keys for programmatic access</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Production API Key</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">sk-prod-••••••••••••••••••••••••3f2a</p>
                    </div>
                    <button className="rounded-lg border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted">Reveal</button>
                  </div>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Webhook URL</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">https://acme.com/webhooks/rankpulse</p>
                    </div>
                    <button className="rounded-lg border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted">Edit</button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90">
                    Generate New Key
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
