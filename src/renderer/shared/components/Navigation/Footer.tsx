import React from 'react';
import { 
  Copyright,
} from 'lucide-react';
import { type FooterProps } from '../../types/index';
import { cn } from '../../types/cn';
import LogoImage from '../../assets/LogoImage';

/**
 * Premium Footer Component
 * 
 * After 80 years of design evolution, this footer embodies:
 * - Timeless brand presence
 * - Perfect information architecture
 * - Exceptional social proof
 * - Unobtrusive sophistication
 * - Seamless user journey completion
 */
export const Footer: React.FC<FooterProps> = ({
  theme = 'dark',
  className,
  showCopyright = true,
}) => {
  const isDark = theme === 'dark';
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn(
      'relative py-4 px-6',
      'border-t backdrop-blur-xl',
      'transition-all duration-300',
      isDark 
        ? 'bg-gray-900/95 border-gray-800/50' 
        : 'bg-white/95 border-gray-200/60',
      className
    )}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
        {/* Brand */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start">
          <div className="flex items-center gap-2">
            <LogoImage/>
            <span
              className={cn(
                'text-base sm:text-lg font-bold bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent',
              )}
            >
              Custocare AI
            </span>
        
          </div>
          
          {/* Company attribution */}
          <span className="text-xs text-gray-500 dark:text-gray-400 sm:ml-2">
            is a product of{' '}
            <a
              href="https://www.custospark.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-300 hover:underline"
            >
              Custospark company Ltd.
            </a>
          </span>
        </div>

        {/* Copyright */}
        <div className="flex items-center gap-4">
          {showCopyright && (
            <div className="flex items-center gap-1.5 text-xs">
              <Copyright className={cn(
                'w-3 h-3',
                isDark ? 'text-gray-500' : 'text-gray-400'
              )} />
              <span className={cn(
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                {currentYear} Custocare AI
              </span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;