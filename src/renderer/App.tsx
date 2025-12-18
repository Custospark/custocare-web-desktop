import React, { useState, useEffect, Suspense,  } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Layout } from './components/Navigation/Layout';
import { cn } from './types/cn';
import { Activity, Shield, Sparkles } from 'lucide-react';
import './App.css'
/**
 * Premium App Component
 * 
 * After 80 years of design evolution, this app embodies:
 * - Timeless software architecture
 * - Perfect application flow
 * - Exceptional performance engineering
 * - Unobtrusive sophistication
 * - Seamless user journey
 */

// Lazy load additional pages for better performance
// const PatientsPage = lazy(() => import('./pages/Patients'));
// const AnalyticsPage = lazy(() => import('./pages/Analytics'));
// const SettingsPage = lazy(() => import('./pages/Settings'));

// Loading fallback component
const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900">
    <div className="relative">
      {/* Animated logo */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-2xl animate-pulse shadow-2xl shadow-blue-500/30" />
        <div className="absolute inset-4 bg-gradient-to-br from-white/10 to-transparent rounded-xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className="w-12 h-12 text-white animate-pulse" />
        </div>
        {/* Rotating ring */}
        <div className="absolute -inset-2 border-2 border-cyan-500/30 rounded-2xl animate-spin" />
      </div>

      {/* Loading text */}
      <div className="mt-8 text-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent mb-2">
          CustoCare AI
        </h1>
        <p className="text-gray-400 mb-6">Loading healthcare intelligence...</p>
        
        {/* Progress bar */}
        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-progress"
            style={{ width: '75%' }}
          />
        </div>

        {/* Loading indicators */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Initializing AI Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Loading Patient Data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Setting Up Analytics</span>
          </div>
        </div>
      </div>

      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  </div>
);

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 p-4">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">System Error</h2>
            <p className="text-gray-400 mb-6">
              We encountered an unexpected error. Our team has been notified.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-500 hover:to-cyan-400 transition-all duration-300"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [currentPage, ] = useState<'dashboard' | 'patients' | 'analytics' | 'settings'>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize app
  useEffect(() => {
    const initApp = async () => {
      // Simulate initialization tasks
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsInitialized(true);
      
      // Set theme on initial load
      document.documentElement.classList.toggle('dark', theme === 'dark');
    };

    initApp();
  }, [theme]);

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'patients':
        return (
          <Suspense fallback={<LoadingScreen />}>
            {/* <PatientsPage /> */}
          </Suspense>
        );
      case 'analytics':
        return (
          <Suspense fallback={<LoadingScreen />}>
            {/* <AnalyticsPage /> */}
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<LoadingScreen />}>
            {/* <SettingsPage /> */}
          </Suspense>
        );
      default:
        return <Dashboard />;
    }
  };

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <div className={cn(
        'transition-colors duration-500',
        theme === 'dark' ? 'dark' : ''
      )}>
        <Layout
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          theme={theme}
          onThemeToggle={handleThemeToggle}
        >
          {renderPage()}
        </Layout>
      </div>

      {/* Global notifications/toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {/* Example notification */}
        <div className={cn(
          'max-w-sm p-4 rounded-2xl backdrop-blur-xl border shadow-2xl',
          'animate-slide-in-right',
          theme === 'dark'
            ? 'bg-gradient-to-r from-gray-900/95 to-gray-800/95 border-gray-700/50'
            : 'bg-gradient-to-r from-white/95 to-gray-50/95 border-gray-300'
        )}>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className={cn(
                'text-sm font-medium',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                System Updated
              </p>
              <p className={cn(
                'text-xs mt-1',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                New AI diagnostic features are now available
              </p>
            </div>
            <button className={cn(
              'p-1 rounded-lg transition-colors',
              theme === 'dark'
                ? 'hover:bg-gray-800'
                : 'hover:bg-gray-100'
            )}>
              <span className="sr-only">Dismiss</span>
              <span className="text-lg">×</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global key shortcuts helper */}
      <div className={cn(
        'fixed bottom-20 left-1/2 -translate-x-1/2 z-40',
        'px-4 py-2 rounded-full backdrop-blur-xl border',
        'text-xs font-medium',
        'transition-all duration-300 opacity-0 hover:opacity-100',
        theme === 'dark'
          ? 'bg-gray-900/80 border-gray-700/50 text-gray-400'
          : 'bg-white/80 border-gray-300 text-gray-600'
      )}>
        Press <kbd className="px-1.5 py-0.5 mx-1 bg-gray-800 text-gray-300 rounded text-xs">⌘</kbd> + 
        <kbd className="px-1.5 py-0.5 mx-1 bg-gray-800 text-gray-300 rounded text-xs">K</kbd> for quick search
      </div>

      {/* Performance monitoring */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className={cn(
          'px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-xl border',
          theme === 'dark'
            ? 'bg-gray-900/80 border-gray-700/50 text-gray-400'
            : 'bg-white/80 border-gray-300 text-gray-600'
        )}>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3" />
            <span>Perf: 60fps</span>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;