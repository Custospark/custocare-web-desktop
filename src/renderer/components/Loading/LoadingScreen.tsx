import React, { useEffect, useState } from 'react';
import { Shield, Zap, Cpu, Database } from 'lucide-react';
import { cn } from '../../utils/classNameUtils'

interface LoadingPhase {
  icon: React.ComponentType<{ className: string }>;
  text: string;
  color: string;
}

interface LoadingScreenProps {
  duration?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = () => {
  const [progress, setProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState(0);

  const phases: LoadingPhase[] = [
    { icon: Cpu, text: 'Initializing AI Engine', color: 'emerald' },
    { icon: Database, text: 'Loading Patient Data', color: 'cyan' },
    { icon: Zap, text: 'Setting Up Analytics', color: 'blue' },
    { icon: Shield, text: 'Securing Connection', color: 'purple' },
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 2;
      });
    }, 30);

    const phaseInterval = setInterval(() => {
      setLoadingPhase((prev) => (prev + 1) % phases.length);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(phaseInterval);
    };
  }, []);

  const currentPhase = phases[loadingPhase];

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
        {/* Logo Container */}
        <div className="relative mb-8">
          <div className="absolute -inset-8 border-2 border-cyan-500/20 rounded-3xl animate-spin-slow" />
          <div className="absolute -inset-6 border-2 border-blue-500/20 rounded-3xl animate-spin-reverse" />

          <div className="relative w-28 h-28">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-600 rounded-2xl animate-gradient shadow-2xl shadow-blue-500/40 transform-gpu hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0.5 bg-gradient-to-br from-blue-500/20 to-transparent rounded-2xl backdrop-blur-sm" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-14 h-14 text-white drop-shadow-2xl animate-float" />
            </div>
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-3xl blur-2xl animate-pulse" />
          </div>

          {/* Orbiting particles */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-400 rounded-full animate-orbit shadow-lg shadow-cyan-400/50" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full animate-orbit-reverse shadow-lg shadow-blue-400/50" />
          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-purple-400 rounded-full animate-orbit-slow shadow-lg shadow-purple-400/50" />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent animate-gradient bg-300%">
            CustoCare AI
          </h1>
          <p className="text-gray-400 text-sm font-medium tracking-wide">
            Healthcare Intelligence Platform
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-80 mb-8">
          <div className="relative h-2 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-gray-700/50">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full relative overflow-hidden transition-all duration-300 ease-out animate-gradient bg-300%"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-fast" />
            </div>
            <div
              className="absolute top-0 h-full bg-gradient-to-r from-blue-400/50 to-cyan-400/50 blur-md transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-500 font-medium">Loading...</span>
            <span className="text-sm font-bold text-cyan-400">{progress}%</span>
          </div>
        </div>

        {/* Loading Phases */}
        <div className="flex flex-col items-center gap-4 min-h-[120px]">
          <div className="flex items-center gap-3 min-w-[280px]">
            <div
              className={cn(
                'p-3 rounded-xl border-2 bg-gradient-to-br transition-all duration-500',
                `from-${currentPhase.color}-500/10 to-${currentPhase.color}-500/5`,
                `border-${currentPhase.color}-500/20`,
                'shadow-lg animate-pulse-subtle'
              )}
            >
              <currentPhase.icon
                className={cn('w-6 h-6', `text-${currentPhase.color}-400`)}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200">
                {currentPhase.text}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Please wait...</p>
            </div>
          </div>

          {/* Phase dots */}
          <div className="flex items-center gap-2">
            {phases.map((phase, index) => (
              <div
                key={index}
                className={cn(
                  'rounded-full transition-all duration-500',
                  index === loadingPhase
                    ? `w-8 h-2 bg-${phase.color}-400 shadow-lg shadow-${phase.color}-400/50`
                    : index < loadingPhase
                      ? `w-2 h-2 bg-${phase.color}-600`
                      : 'w-2 h-2 bg-gray-700'
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
};

LoadingScreen.displayName = 'LoadingScreen';

export default LoadingScreen;