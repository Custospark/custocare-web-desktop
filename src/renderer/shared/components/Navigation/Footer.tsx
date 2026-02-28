// Footer.tsx
import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useSelector } from 'react-redux';
import { type FooterProps } from '../../types/index';
import { cn } from '../../types/cn';
import LogoImage from '../../assets/LogoImage';
import type { RootState } from '../../../app/store/store';

export const Footer: React.FC<FooterProps> = ({
  className,
  showCopyright = true,
}) => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const isDark = theme === 'dark';
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'relative w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4',
        'border-t backdrop-blur-xl',
        'transition-all duration-300',
        isDark
          ? 'bg-gray-900/95 border-gray-800/50'
          : 'bg-white/95 border-gray-200/60',
        className
      )}
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-4 max-w-7xl mx-auto">
        {/* Left side - All text content */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-2 gap-y-1">
          {/* Brand with logo */}
          <div className="flex items-center gap-1.5">
            <LogoImage />
            <span className="text-base sm:text-lg font-bold bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent leading-none whitespace-nowrap">
              Custocare AI
            </span>
          </div>
          <span className={cn(
            'text-xs sm:text-sm whitespace-nowrap',
            isDark ? 'text-gray-500' : 'text-gray-500'
          )}>
           is a product of
          </span>

          <a
            href="https://www.custospark.com"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-1 text-xs sm:text-sm font-semibold',
              'transition-colors duration-200',
              'hover:underline focus:outline-none focus-visible:underline',
              'whitespace-nowrap',
              isDark
                ? 'text-blue-400 hover:text-blue-300'
                : 'text-blue-600 hover:text-blue-700'
            )}
          >
            Custospark Company Ltd
            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-60 flex-shrink-0" />
          </a>
        </div>

        {/* Right side - Copyright */}
        {showCopyright && (
          <p className={cn(
            'text-sm sm:text-base font-medium tabular-nums',
            isDark ? 'text-gray-600' : 'text-gray-400'
          )}>
            © {currentYear} Custocare AI
          </p>
        )}
      </div>
    </footer>
  );
};

export default Footer;