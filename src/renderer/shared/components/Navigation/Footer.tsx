// Footer.tsx
import React from 'react';
import { ExternalLink, Heart } from 'lucide-react';
import { useSelector } from 'react-redux';
import { type FooterProps } from '../../types/index';
import { cn } from '../../types/cn';
import LogoImage from '../../assets/LogoImage';
import type { RootState } from '../../../app/store/store';
import { BrandName } from '../../utils/BrandName';

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
        'relative w-full px-3 sm:px-4 md:px-6 py-2 sm:py-3',
        'border-t backdrop-blur-xl',
        'transition-all duration-300',
        isDark
          ? 'bg-gray-900/95 border-gray-800/50'
          : 'bg-white/95 border-gray-200/60',
        className
      )}
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-4 max-w-7xl mx-auto">
        {/* Left side - Brand & attribution */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-2 gap-y-1">
          <div className="flex items-center gap-1.5">
            <LogoImage />
           <BrandName/>
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

        {/* Right side - Copyright & tagline */}
        {showCopyright && (
          <div className="flex items-center gap-3">
            <span className={cn(
              'hidden sm:inline text-xs',
              isDark ? 'text-gray-600' : 'text-gray-400'
            )}>
              Continuous Care. Clinical Excellence.
            </span>
            <span className={cn(
              'hidden sm:inline text-xs',
              isDark ? 'text-gray-600' : 'text-gray-300'
            )}>
              |
            </span>
            <div className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              isDark
                ? 'bg-gray-800/80 text-gray-400 border border-gray-700/50'
                : 'bg-gray-100/80 text-gray-500 border border-gray-200/50'
            )}>
              <Heart className="w-3 h-3 text-blue-400" />
              <span>© {currentYear} Custocare</span>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;