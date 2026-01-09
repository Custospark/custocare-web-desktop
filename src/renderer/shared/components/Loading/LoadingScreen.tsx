import React, { useEffect, useState } from 'react';
import { Shield, Zap, Cpu, Database, Activity, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../../../app/store/hooks/useApp';
import { cn } from '../../utils/classNameUtils';

interface LoadingPhase {
  icon: React.ComponentType<{ className: string }>;
  text: string;
  color: string;
  gradient: string;
}

interface LoadingScreenProps {
  duration?: number;
  message?: string;
}

/**
 * Full-Screen Loading Component - Theme Aware
 * 
 * Used for:
 * - Initial app load
 * - Authentication flows
 * - Critical data fetching
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const theme = useAppSelector((state) => state.ui.theme);
  const [progress, setProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState(0);

  const phases: LoadingPhase[] = [
    { 
      icon: Cpu, 
      text: 'Initializing AI Engine', 
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600'
    },
    { 
      icon: Database, 
      text: 'Syncing database', 
      color: 'cyan',
      gradient: 'from-cyan-500 to-cyan-600'
    },
    { 
      icon: Zap, 
      text: 'Setting Up Analytics', 
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    { 
      icon: Shield, 
      text: 'Securing Connection', 
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600'
    },
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
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500",
      theme === 'dark'
        ? "bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950"
        : "bg-gradient-to-br from-slate-50 via-white to-blue-50/40"
    )}>
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            'absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl',
            theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-400/15'
          )}
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className={cn(
            'absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl',
            theme === 'dark' ? 'bg-cyan-500/20' : 'bg-cyan-400/15'
          )}
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl',
            theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-400/10'
          )}
        />

        {/* Grid pattern */}
        <div 
          className={cn(
            'absolute inset-0',
            theme === 'dark' ? 'opacity-[0.02]' : 'opacity-[0.015]'
          )}
          style={{
            backgroundSize: '48px 48px',
            backgroundImage: theme === 'dark' 
              ? 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)'
              : 'linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Container */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mb-12"
        >
          {/* Rotating borders */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className={cn(
              "absolute -inset-8 border-2 rounded-3xl",
              theme === 'dark' ? "border-cyan-500/20" : "border-cyan-500/30"
            )}
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className={cn(
              "absolute -inset-6 border-2 rounded-3xl",
              theme === 'dark' ? "border-blue-500/20" : "border-blue-500/30"
            )}
          />

          {/* Main logo */}
          <div className="relative w-28 h-28">
            <motion.div 
              animate={{ 
                boxShadow: theme === 'dark'
                  ? ['0 0 20px rgba(59, 130, 246, 0.3)', '0 0 40px rgba(59, 130, 246, 0.5)', '0 0 20px rgba(59, 130, 246, 0.3)']
                  : ['0 0 20px rgba(59, 130, 246, 0.2)', '0 0 40px rgba(59, 130, 246, 0.4)', '0 0 20px rgba(59, 130, 246, 0.2)']
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-600 rounded-2xl"
            />
            <div className={cn(
              "absolute inset-0.5 rounded-2xl backdrop-blur-sm",
              theme === 'dark' 
                ? "bg-gradient-to-br from-blue-500/20 to-transparent" 
                : "bg-gradient-to-br from-blue-400/30 to-transparent"
            )} />
            <motion.div 
              animate={{ 
                y: [-5, 5, -5],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Heart className="w-14 h-14 text-white drop-shadow-2xl" />
            </motion.div>
          </div>

          {/* Orbiting particles */}
          {[
            { delay: 0, className: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2', color: 'cyan' },
            { delay: 0.5, className: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2', color: 'blue' },
            { delay: 1, className: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2', color: 'purple' },
          ].map((particle, index) => (
            <motion.div
              key={index}
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 3, repeat: Infinity, ease: "linear", delay: particle.delay },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              className={`absolute ${particle.className} w-3 h-3 rounded-full shadow-lg ${
                particle.color === 'cyan' ? 'bg-cyan-400 shadow-cyan-400/50' :
                particle.color === 'blue' ? 'bg-blue-400 shadow-blue-400/50' :
                'bg-purple-400 shadow-purple-400/50'
              }`}
            />
          ))}
        </motion.div>

        {/* Title */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className={cn(
            "text-4xl font-black mb-2 bg-gradient-to-r bg-clip-text text-transparent",
            theme === 'dark'
              ? "from-white via-cyan-200 to-blue-200"
              : "from-slate-900 via-blue-700 to-cyan-700"
          )}>
            Custocare AI
          </h1>
          <p className={cn(
            "text-sm font-medium tracking-wide",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Healthcare Intelligence Platform
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="w-80 mb-10"
        >
          <div className={cn(
            "relative h-2 rounded-full overflow-hidden backdrop-blur-sm border shadow-inner",
            theme === 'dark'
              ? "bg-slate-800/50 border-slate-700/50"
              : "bg-slate-200/80 border-slate-300/60"
          )}>
            <motion.div
              className={cn(
                "h-full rounded-full relative overflow-hidden transition-all duration-300 ease-out",
                "bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"
              )}
              style={{ width: `${progress}%` }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-fast" />
            </motion.div>
            
            {/* Glow effect */}
            <motion.div
              className={cn(
                "absolute top-0 h-full blur-md transition-all duration-300",
                theme === 'dark' ? "opacity-60" : "opacity-40"
              )}
              style={{ 
                width: `${progress}%`,
                background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(34, 211, 238))'
              }}
            />
          </div>

          <div className="flex justify-between items-center mt-3">
            <span className={cn(
              "text-xs font-medium",
              theme === 'dark' ? "text-gray-500" : "text-gray-600"
            )}>
              {message || 'Loading...'}
            </span>
            <motion.span 
              key={progress}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={cn(
                "text-sm font-bold",
                theme === 'dark' ? "text-cyan-400" : "text-blue-600"
              )}
            >
              {progress}%
            </motion.span>
          </div>
        </motion.div>

        {/* Loading Phases */}
        <div className="flex flex-col items-center gap-6 min-h-[140px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={loadingPhase}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-4 min-w-[300px]"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                }}
                className={cn(
                  'p-4 rounded-xl border-2 shadow-lg',
                  `bg-gradient-to-br ${currentPhase.gradient}`,
                  theme === 'dark' ? 'border-white/10' : 'border-white/50'
                )}
              >
                <currentPhase.icon className="w-7 h-7 text-white" />
              </motion.div>
              
              <div>
                <p className={cn(
                  "text-base font-semibold",
                  theme === 'dark' ? "text-gray-200" : "text-gray-800"
                )}>
                  {currentPhase.text}
                </p>
                <p className={cn(
                  "text-xs mt-1",
                  theme === 'dark' ? "text-gray-500" : "text-gray-600"
                )}>
                  Please wait...
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Phase progress dots */}
          <div className="flex items-center gap-2">
            {phases.map((phase, index) => (
              <motion.div
                key={index}
                animate={{
                  width: index === loadingPhase ? 32 : 8,
                  opacity: index <= loadingPhase ? 1 : 0.3
                }}
                transition={{ duration: 0.5 }}
                className={cn(
                  'h-2 rounded-full shadow-lg',
                  `bg-gradient-to-r ${phase.gradient}`,
                  index === loadingPhase && `shadow-${phase.color}-400/50`
                )}
              />
            ))}
          </div>
        </div>

        {/* System Status */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs"
        >
          {[
            { label: 'API Connected', color: 'emerald', delay: 0 },
            { label: 'Database Synced', color: 'cyan', delay: 500 },
            { label: 'AI Ready', color: 'blue', delay: 1000 },
          ].map((status, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              className="flex items-center gap-2"
            >
              <motion.div 
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: status.delay / 1000
                }}
                className={`w-2 h-2 rounded-full shadow-lg ${
                  status.color === 'emerald' ? 'bg-emerald-400 shadow-emerald-400/50' :
                  status.color === 'cyan' ? 'bg-cyan-400 shadow-cyan-400/50' :
                  'bg-blue-400 shadow-blue-400/50'
                }`}
              />
              <span className={cn(
                "font-medium",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                {status.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom decoration */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
      >
        <p className={cn(
          "text-xs font-medium flex items-center gap-2",
          theme === 'dark' ? "text-gray-600" : "text-gray-500"
        )}>
          <Activity className="w-3.5 h-3.5" />
          Powered by Advanced Medical Intelligence
        </p>
      </motion.div>
    </div>
  );
};

LoadingScreen.displayName = 'LoadingScreen';

export default LoadingScreen;
