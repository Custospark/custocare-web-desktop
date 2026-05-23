import React from 'react';
import { motion } from 'framer-motion';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { cn } from '../../../../../shared/types/cn';
import { pulseGlowVariants } from '../../../../../shared/components/animations/motionVariants';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';

interface LandingLayoutProps {
  children: React.ReactNode;
}

export const LandingLayout: React.FC<LandingLayoutProps> = ({ children }) => {
  const theme = useAppSelector((state) => state.ui.theme);

  return (
    <div className={cn(
      "min-h-screen flex flex-col overflow-hidden relative font-sans antialiased",
      theme === 'dark'
        ? "bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950"
        : "bg-gradient-to-br from-slate-50 via-white to-blue-50/40"
    )}>
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <motion.div
          variants={pulseGlowVariants}
          animate="animate"
          className={cn(
            "absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full blur-3xl",
            theme === 'dark' ? "bg-blue-600/25" : "bg-blue-400/20"
          )}
        />
        <motion.div
          variants={pulseGlowVariants}
          animate="animate"
          style={{ animationDelay: '2s' }}
          className={cn(
            "absolute -bottom-32 -left-32 w-[700px] h-[700px] rounded-full blur-3xl",
            theme === 'dark' ? "bg-emerald-600/25" : "bg-emerald-400/20"
          )}
        />
        <div
          className={cn(
            "absolute inset-0",
            theme === 'dark' ? "opacity-[0.02]" : "opacity-[0.015]"
          )}
          style={{
            backgroundSize: '48px 48px',
            backgroundImage: theme === 'dark'
              ? 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)'
              : 'linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)'
          }}
        />
      </div>

      <LandingHeader theme={theme} />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 lg:py-6 relative z-10">
        {children}
      </main>

      <LandingFooter theme={theme} />
    </div>
  );
};
