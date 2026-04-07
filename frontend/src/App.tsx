import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import CategoryPage from './pages/CategoryPage';
import CodeManagePage from './pages/CodeManagePage';
import PayerManagePage from './pages/PayerManagePage';
import LoginPage from './pages/LoginPage';
import { authService } from './api/authService';

function App() {
  const [role, setRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [activePage, setActivePage] = useState('categories');

  useEffect(() => {
    authService.me()
      .then((res) => setRole(res.data.role))
      .catch(() => setRole(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!role) {
    return <LoginPage onLoginSuccess={(r) => setRole(r)} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'categories': return <CategoryPage />;
      case 'codes': return <CodeManagePage />;
      case 'payers': return <PayerManagePage />;
      default: return (
        <div className="flex items-center justify-center h-full">
          <p className="text-slate-400 dark:text-slate-500 text-lg">준비 중인 페이지입니다.</p>
        </div>
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={() => authService.logout().finally(() => setRole(null))}
      />
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
        <header className="h-16 glass border-b border-white/10 dark:border-slate-800/50 flex items-center px-10 relative z-10">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-slate-800 to-slate-500 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">SAM Account Manager</h2>
        </header>
        <div className="p-10 h-[calc(100vh-4rem)] overflow-y-auto relative z-10">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
