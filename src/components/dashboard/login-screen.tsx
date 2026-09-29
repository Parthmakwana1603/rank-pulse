import { useState } from 'react';
import { TrendingUp, Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/components/theme-provider';

const inputClass =
  'h-11 w-full rounded-xl border bg-muted/40 pl-10 pr-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20';

export function LoginScreen() {
  const { login, signUp, mode: authMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDemo = authMode === 'demo';
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(isDemo ? 'jamie@acme.com' : '');
  const [password, setPassword] = useState(isDemo ? 'rankpulse' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === 'signup';

  const switchMode = () => {
    setMode(isSignUp ? 'signin' : 'signup');
    setError('');
    setNotice('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    const result = isSignUp ? await signUp(name, email, password) : await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
    } else if (result.message) {
      setNotice(result.message);
      setMode('signin');
      setPassword('');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

      <button
        onClick={toggleTheme}
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl border bg-card transition-colors hover:bg-muted"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30">
            <TrendingUp className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignUp ? 'Start tracking your SEO with RankPulse' : 'Sign in to your RankPulse SEO Suite'}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-xl sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {isSignUp && (
              <div>
                <label htmlFor="name" className="text-xs font-medium text-muted-foreground">Full name</label>
                <div className="relative mt-1">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jamie Doe"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email address</label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password</label>
              <div className="relative mt-1">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? 'At least 6 characters' : 'Enter your password'}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-xl border bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}
            {notice && (
              <div role="status" className="rounded-xl border bg-success/5 px-3 py-2.5 text-sm text-success">
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={switchMode} className="font-medium text-primary transition-opacity hover:opacity-80">
              {isSignUp ? 'Sign in' : 'Create one'}
            </button>
          </div>

          {isDemo && (
            <div className="mt-4 rounded-xl border bg-muted/30 px-3 py-2.5 text-center text-xs text-muted-foreground">
              Demo mode — use any email and a 6+ character password. Connect Supabase to use real accounts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
