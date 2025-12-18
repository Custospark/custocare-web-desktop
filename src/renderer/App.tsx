import React, { Suspense, useEffect, useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Layout } from './components/Navigation/Layout';
import { cn } from './types/cn';
import { Activity, Shield } from 'lucide-react';
import { AppProvider } from './store/state/AppContext';
import './App.css';

// Loading fallback component
const LoadingScreen = React.memo(() => (
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
));

LoadingScreen.displayName = 'LoadingScreen';

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

function AppContent() {
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize app
  useEffect(() => {
    const initApp = async () => {
      // Simulate initialization tasks
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsInitialized(true);
    };

    initApp();
  }, []);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <div className="transition-colors duration-500">
      <Layout>
        <Dashboard />
      </Layout>

      {/* Global notifications/toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {/* Example notification */}
        <div className={cn(
          'max-w-sm p-4 rounded-2xl backdrop-blur-xl border shadow-2xl',
          'animate-slide-in-right'
        )}>
        
        </div>
      </div>

      {/* Global key shortcuts helper */}
      <div className={cn(
        'fixed bottom-20 left-1/2 -translate-x-1/2 z-40',
        'px-4 py-2 rounded-full backdrop-blur-xl border',
        'text-xs font-medium',
        'transition-all duration-300 opacity-0 hover:opacity-100',
        'bg-gray-900/80 border-gray-700/50 text-gray-400'
      )}>
        Press <kbd className="px-1.5 py-0.5 mx-1 bg-gray-800 text-gray-300 rounded text-xs">⌘</kbd> + 
        <kbd className="px-1.5 py-0.5 mx-1 bg-gray-800 text-gray-300 rounded text-xs">K</kbd> for quick search
      </div>

      {/* Performance monitoring */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className={cn(
          'px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-xl border',
          'bg-gray-900/80 border-gray-700/50 text-gray-400'
        )}>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3" />
            <span>Perf: 60fps</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Suspense fallback={<LoadingScreen />}>
          <AppContent />
        </Suspense>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;