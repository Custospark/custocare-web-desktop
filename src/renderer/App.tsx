import React, { Suspense, useEffect, useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Layout } from './components/Navigation/Layout';
import { cn } from './types/cn';
import { Shield, Zap, Cpu, Database } from 'lucide-react';
import { AppProvider } from './store/state/AppContext';
import './App.css';

/**
 * Ultra-Modern Loading Screen - 8 Decades of Design Excellence
 * 
 * Features:
 * - Mesmerizing 3D-style animations
 * - Multi-layered visual hierarchy
 * - Smooth progress indicators
 * - Professional micro-interactions
 */
const LoadingScreen = React.memo(() => {
  const [progress, setProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState(0);

  const phases = [
    { icon: Cpu, text: 'Initializing AI Engine', color: 'emerald' },
    { icon: Database, text: 'Loading Patient Data', color: 'cyan' },
    { icon: Zap, text: 'Setting Up Analytics', color: 'blue' },
    { icon: Shield, text: 'Securing Connection', color: 'purple' },
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 30);

    const phaseInterval = setInterval(() => {
      setLoadingPhase(prev => (prev + 1) % phases.length);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(phaseInterval);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)] opacity-20" />
      
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-slow animation-delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Container with 3D effect */}
        <div className="relative mb-8">
          {/* Rotating rings */}
          <div className="absolute -inset-8 border-2 border-cyan-500/20 rounded-3xl animate-spin-slow" />
          <div className="absolute -inset-6 border-2 border-blue-500/20 rounded-3xl animate-spin-reverse" />
          
          {/* Main logo */}
          <div className="relative w-28 h-28 perspective-1000">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-600 rounded-2xl animate-gradient shadow-2xl shadow-blue-500/40 transform-gpu hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0.5 bg-gradient-to-br from-blue-500/20 to-transparent rounded-2xl backdrop-blur-sm" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-14 h-14 text-white drop-shadow-2xl animate-float" />
            </div>
            
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-3xl blur-2xl animate-pulse" />
          </div>

          {/* Orbiting particles */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-400 rounded-full animate-orbit shadow-lg shadow-cyan-400/50" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full animate-orbit-reverse shadow-lg shadow-blue-400/50" />
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-purple-400 rounded-full animate-orbit-slow shadow-lg shadow-purple-400/50" />
        </div>

        {/* Title with gradient animation */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent animate-gradient bg-300%">
            CustoCare AI
          </h1>
          <p className="text-gray-400 text-sm font-medium tracking-wide">
            Healthcare Intelligence Platform
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-80 mb-8">
          {/* Progress bar */}
          <div className="relative h-2 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-gray-700/50">
            {/* Animated background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            
            {/* Actual progress */}
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full relative overflow-hidden transition-all duration-300 ease-out animate-gradient bg-300%"
              style={{ width: `${progress}%` }}
            >
              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-fast" />
            </div>
            
            {/* Glow effect */}
            <div 
              className="absolute top-0 h-full bg-gradient-to-r from-blue-400/50 to-cyan-400/50 blur-md transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Progress percentage */}
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-500 font-medium">Loading...</span>
            <span className="text-sm font-bold text-cyan-400">{progress}%</span>
          </div>
        </div>

        {/* Loading Phases */}
        <div className="flex flex-col items-center gap-4 min-h-[120px]">
          {/* Current phase indicator */}
          <div className="flex items-center gap-3 min-w-[280px]">
            <div className={cn(
              "p-3 rounded-xl border-2 bg-gradient-to-br transition-all duration-500",
              `from-${phases[loadingPhase].color}-500/10 to-${phases[loadingPhase].color}-500/5`,
              `border-${phases[loadingPhase].color}-500/20`,
              "shadow-lg animate-pulse-subtle"
            )}>
              {React.createElement(phases[loadingPhase].icon, {
                className: cn("w-6 h-6", `text-${phases[loadingPhase].color}-400`)
              })}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200">
                {phases[loadingPhase].text}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Please wait...
              </p>
            </div>
          </div>

          {/* Phase dots indicator */}
          <div className="flex items-center gap-2">
            {phases.map((phase, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-full transition-all duration-500",
                  index === loadingPhase
                    ? `w-8 h-2 bg-${phase.color}-400 shadow-lg shadow-${phase.color}-400/50`
                    : index < loadingPhase
                    ? `w-2 h-2 bg-${phase.color}-600`
                    : "w-2 h-2 bg-gray-700"
                )}
              />
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
            <span className="text-gray-400">API Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse animation-delay-500 shadow-lg shadow-cyan-400/50" />
            <span className="text-gray-400">Database Synced</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-1000 shadow-lg shadow-blue-400/50" />
            <span className="text-gray-400">AI Ready</span>
          </div>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-xs text-gray-600 font-medium">
          Powered by Advanced Medical Intelligence
        </p>
      </div>
    </div>
  );
});

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
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/30">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">System Error</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              We encountered an unexpected error. Our team has been notified and is working on a fix.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105"
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
      await new Promise(resolve => setTimeout(resolve, 3000));
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
      <div className="fixed top-20 right-4 z-50 space-y-2" />

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
