import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { initialsOf } from '@/lib/utils';

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  plan: string;
  initials: string;
}

type Result = { ok: true; message?: string } | { ok: false; error: string };

interface AuthContextValue {
  user: AuthUser | null;
  /** True while an existing session is being restored on page load. */
  initializing: boolean;
  /** 'demo' accepts any credentials; 'supabase' uses real accounts. */
  mode: 'demo' | 'supabase';
  login: (email: string, password: string) => Promise<Result>;
  signUp: (name: string, email: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const demoUser: AuthUser = {
  name: 'Jamie Doe',
  email: 'jamie@acme.com',
  plan: 'Pro Plan',
  initials: 'JD',
};

const planLabels: Record<string, string> = { free: 'Free Plan', pro: 'Pro Plan', enterprise: 'Enterprise Plan' };

function validate(email: string, password: string): string | null {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Please enter a valid email address.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

async function loadSupabaseUser(user: User): Promise<AuthUser> {
  const fallbackName = (user.user_metadata?.name as string | undefined) || (user.email ?? '').split('@')[0];
  // The profile row is created by a database trigger on sign-up.
  const { data: profile } = await supabase!
    .from('profiles')
    .select('name, plan')
    .eq('id', user.id)
    .maybeSingle();
  const name = profile?.name || fallbackName;
  return {
    id: user.id,
    name,
    email: user.email ?? '',
    plan: planLabels[profile?.plan ?? 'free'] ?? 'Free Plan',
    initials: initialsOf(name),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(supabase !== null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    // Fires once with the restored session (INITIAL_SESSION), then on every sign-in/out.
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') queryClient.clear();
      if (!session?.user) {
        setUser(null);
        setInitializing(false);
        return;
      }
      if (event === 'TOKEN_REFRESHED') return;
      // Load the profile outside the auth callback, as Supabase recommends.
      setTimeout(async () => {
        let next: AuthUser;
        try {
          next = await loadSupabaseUser(session.user);
        } catch {
          const name = (session.user.email ?? '').split('@')[0];
          next = { id: session.user.id, name, email: session.user.email ?? '', plan: 'Free Plan', initials: initialsOf(name) };
        }
        if (active) {
          setUser(next);
          setInitializing(false);
        }
      }, 0);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [queryClient]);

  const login = useCallback(async (email: string, password: string): Promise<Result> => {
    const invalid = validate(email, password);
    if (invalid) return { ok: false, error: invalid };
    if (!supabase) {
      setUser({ ...demoUser, email: email.trim() });
      return { ok: true };
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? { ok: false, error: error.message } : { ok: true };
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string): Promise<Result> => {
    if (name.trim().length < 2) return { ok: false, error: 'Please enter your name.' };
    const invalid = validate(email, password);
    if (invalid) return { ok: false, error: invalid };
    if (!supabase) {
      setUser({ ...demoUser, name: name.trim(), email: email.trim(), initials: initialsOf(name) });
      return { ok: true };
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() }, emailRedirectTo: window.location.origin },
    });
    if (error) return { ok: false, error: error.message };
    // With "Confirm email" on (Supabase's default) there is no session until the link is clicked.
    if (!data.session) {
      return { ok: true, message: 'Check your inbox to confirm your email, then sign in.' };
    }
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    // Drop cached API data so the next user never sees the previous user's data.
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{ user, initializing, mode: supabase ? 'supabase' : 'demo', login, signUp, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
