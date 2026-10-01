import { useRef, useState } from 'react';
import { Settings, User, Bell, Plug, CreditCard, Palette, Code, Check, Download, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '../page-header';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/lib/auth-context';
import { settingsSections } from '@/lib/seo-data';
import type * as seo from '@/lib/seo-data';
import { useSetNotificationPreference, useSettingsData, useUpdateProfile, useUploadAvatar } from '@/lib/api/queries';
import type { ProfileDto } from '@/lib/api/types';
import { dataMode } from '@/lib/api/client';
import { EmptyState } from '../empty-state';
import { QueryFallback } from '../query-fallback';
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
  const screenQuery = useSettingsData();
  if (!screenQuery.data) return <QueryFallback query={screenQuery} />;
  const { notificationSettings, integrations, billing, profile } = screenQuery.data;
  return (
    <SettingsView notificationSettings={notificationSettings} integrations={integrations} planInfo={billing} profile={profile} />
  );
}

interface SettingsViewProps {
  notificationSettings: typeof seo.notificationSettings;
  integrations: typeof seo.integrations;
  planInfo: typeof seo.planInfo;
  profile: ProfileDto;
}

const inputClass =
  'mt-1 h-10 w-full rounded-xl border bg-muted/40 px-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 disabled:opacity-60';

function ProfileSection({ profile }: { profile: ProfileDto }) {
  const { user, refreshUser } = useAuth();
  const initial = { name: profile.name, company: profile.company ?? '', jobTitle: profile.jobTitle ?? '' };
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);
  const update = useUpdateProfile();
  const upload = useUploadAvatar();
  const fileInput = useRef<HTMLInputElement>(null);
  const dirty = form.name !== initial.name || form.company !== initial.company || form.jobTitle !== initial.jobTitle;

  const save = () => {
    setSaved(false);
    update.mutate(
      { name: form.name.trim(), company: form.company.trim() || null, jobTitle: form.jobTitle.trim() || null },
      {
        onSuccess: async () => {
          setSaved(true);
          await refreshUser();
        },
      }
    );
  };

  const fields = [
    { key: 'name' as const, label: 'Full Name', autoComplete: 'name' },
    { key: 'company' as const, label: 'Company', autoComplete: 'organization' },
    { key: 'jobTitle' as const, label: 'Job Title', autoComplete: 'organization-title' },
  ];
  const error = update.error ?? upload.error;

  return (
    <Card className="rounded-2xl p-6 shadow-sm">
      <h2 className="text-base font-semibold">Profile</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Update your personal information</p>
      <div className="mt-5 flex items-center gap-4">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-chart-4 to-chart-5 text-xl font-bold text-white">
            {user?.initials ?? 'JD'}
          </div>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => fileInput.current?.click()}
          disabled={upload.isPending}
          className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
        >
          {upload.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Change Avatar
        </button>
        <span className="text-xs text-muted-foreground">PNG, JPEG, WebP or GIF, up to 2 MB</span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label htmlFor={`profile-${f.key}`} className="text-xs font-medium text-muted-foreground">{f.label}</label>
            <input
              id={`profile-${f.key}`}
              type="text"
              autoComplete={f.autoComplete}
              value={form[f.key]}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, [f.key]: e.target.value }));
                setSaved(false);
              }}
              className={inputClass}
            />
          </div>
        ))}
        <div>
          <label htmlFor="profile-email" className="text-xs font-medium text-muted-foreground">Email</label>
          <input id="profile-email" type="email" value={profile.email || user?.email || ''} disabled className={inputClass} />
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-xl border bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error.message}
        </p>
      )}
      {saved && !dirty && (
        <p role="status" className="mt-4 text-sm text-success">
          Profile saved.
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2.5">
        <button
          onClick={() => setForm(initial)}
          disabled={!dirty || update.isPending}
          className="rounded-xl border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={!dirty || update.isPending}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 disabled:opacity-60"
        >
          {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </button>
      </div>
    </Card>
  );
}

function SettingsView({ notificationSettings, integrations, planInfo, profile }: SettingsViewProps) {
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('profile');
  const [notifState, setNotifState] = useState(notificationSettings);
  const setPreference = useSetNotificationPreference();

  /** Flips one channel and saves it; the switch reverts if saving fails. */
  const togglePreference = (index: number, channel: 'email' | 'push') => {
    const before = notifState;
    const next = before.map((item, idx) => (idx === index ? { ...item, [channel]: !item[channel] } : item));
    setNotifState(next);
    const changed = next[index];
    if (dataMode === 'api' && changed.key) {
      setPreference.mutate({ key: changed.key, email: changed.email, push: changed.push }, { onError: () => setNotifState(before) });
    }
  };

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
          {activeSection === 'profile' && <ProfileSection profile={profile} />}

          {activeSection === 'notifications' && (
            <Card className="rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold">Notifications</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Choose how you want to be notified</p>
              {dataMode === 'api' && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Your choices are saved. In-app notifications appear in the bell menu; email and push delivery aren't available yet.
                </p>
              )}
              {setPreference.error && (
                <p role="alert" className="mt-2 text-sm text-destructive">{setPreference.error.message}</p>
              )}
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
                        onClick={() => togglePreference(i, 'email')}
                        aria-label={`Email: ${n.label}`}
                        aria-pressed={n.email}
                        className={cn('relative h-6 w-11 rounded-full transition-colors', n.email ? 'bg-primary' : 'bg-muted')}
                      >
                        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', n.email ? 'translate-x-5' : 'translate-x-0.5')} />
                      </button>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => togglePreference(i, 'push')}
                        aria-label={`Push: ${n.label}`}
                        aria-pressed={n.push}
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
              {integrations.some((i) => i.available === false) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Connecting third-party services needs OAuth apps and API credentials that haven't been set up yet.
                </p>
              )}
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
                      <button
                        disabled={int.available === false}
                        title={int.available === false ? 'Not available yet' : undefined}
                        className="rounded-lg border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {int.available === false ? 'Coming soon' : 'Connect'}
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
                    {planInfo.price !== null && (
                      <p className="mt-3 text-3xl font-bold">{planInfo.price}<span className="text-base font-normal text-muted-foreground">{planInfo.cycle}</span></p>
                    )}
                    {planInfo.renewal && <p className="mt-1 text-sm text-muted-foreground">Renews on {planInfo.renewal}</p>}
                    {!planInfo.billingAvailable && (
                      <p className="mt-2 text-sm text-muted-foreground">Plan changes and payments aren't available yet.</p>
                    )}
                  </div>
                  <div className="flex gap-2.5">
                    <button disabled={!planInfo.billingAvailable} className="rounded-xl border bg-background/60 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60">Change Plan</button>
                    <button disabled={!planInfo.billingAvailable} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">Upgrade</button>
                  </div>
                </div>
                <div className="relative mt-5 grid grid-cols-3 gap-3 border-t pt-4">
                  {planInfo.limits.map((l) => (
                    <div key={l.label}><p className="text-xs text-muted-foreground">{l.label}</p><p className="text-sm font-semibold">{l.value}</p></div>
                  ))}
                </div>
              </Card>
              <Card className="rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-semibold">Billing History</h2>
                <div className="mt-4 space-y-2">
                  {planInfo.invoices.length === 0 && <EmptyState title="No invoices" description="Invoices will appear here once billing is set up." />}
                  {planInfo.invoices.map(({ date: d }) => (
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
              {dataMode === 'api' && (
                <EmptyState
                  className="mt-5"
                  icon={<Code className="h-5 w-5" />}
                  title="API keys and webhooks aren't available yet"
                  description="Programmatic access for third parties hasn't been built. The app itself signs requests with your account session."
                />
              )}
              <div className={cn('mt-5 space-y-4', dataMode === 'api' && 'hidden')}>
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
