import React from 'react';
import { cn } from '../../types/cn';
import type { SidebarPosition, ThemeMode } from './StatusBar';

export interface DecorativeBackgroundProps {
  theme: ThemeMode;
  sidebarPosition: SidebarPosition;
}

export const DecorativeBackground: React.FC<DecorativeBackgroundProps> = ({ theme, sidebarPosition }) => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <div
        className={cn(
          'absolute top-0 w-64 h-64 rounded-full blur-3xl',
          'transition-all duration-700 ease-in-out',
          sidebarPosition === 'left' ? 'left-1/4' : 'right-1/4',
          theme === 'dark'
            ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-15'
            : 'bg-gradient-to-r from-blue-200/20 to-cyan-200/20 opacity-15'
        )}
        style={{ animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
      />

      <div
        className={cn(
          'absolute bottom-0 w-64 h-64 rounded-full blur-3xl',
          'transition-all duration-700 ease-in-out',
          sidebarPosition === 'left' ? 'right-1/4' : 'left-1/4',
          theme === 'dark'
            ? 'bg-gradient-to-l from-purple-500/20 to-pink-500/20 opacity-10'
            : 'bg-gradient-to-l from-purple-200/20 to-pink-200/20 opacity-10'
        )}
        style={{ animation: 'pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
      />
    </div>
  );
};

DecorativeBackground.displayName = 'DecorativeBackground';
export default DecorativeBackground;
