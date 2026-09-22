import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { ModalProvider } from '@/components/dashboard/modals/modal-provider';
import { Dashboard } from '@/components/dashboard/dashboard';
import { LoginScreen } from '@/components/dashboard/login-screen';

function AppContent() {
  const { user } = useAuth();
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
