import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { ModalProvider } from '@/components/dashboard/modals/modal-provider';
import { Dashboard } from '@/components/dashboard/dashboard';
import { LoginScreen } from '@/components/dashboard/login-screen';

function AppContent() {
  const { user, initializing } = useAuth();
  // Restoring a saved session takes a moment; render nothing rather than flashing the login form.
  if (initializing) return <div className="min-h-screen bg-background" />;
  return user ? (
    <ModalProvider>
      <Dashboard />
    </ModalProvider>
  ) : (
    <LoginScreen />
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
