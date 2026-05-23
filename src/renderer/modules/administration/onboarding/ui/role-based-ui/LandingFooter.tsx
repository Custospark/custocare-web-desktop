import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../../../shared/types/cn';
import LogoImage from '../../../../../shared/assets/LogoImage';
import { BrandName } from '../../../../../shared/utils/BrandName';

interface LandingFooterProps {
  theme: string;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ theme }) => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
      className={cn(
        "py-8 px-4 border-t-2 backdrop-blur-xl mt-auto",
        theme === 'dark'
          ? "bg-slate-900/60 border-slate-800/60"
          : "bg-white/60 border-slate-200/60"
      )}
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
              <LogoImage></LogoImage>
              <span className={cn(
                "text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent",
              )}>
                Custocare
              </span>
            </div>
            <p
              className={cn(
                "text-sm max-w-md leading-relaxed",
                theme === 'dark' ? "text-slate-400" : "text-slate-600"
              )}
            >
              Enabling continuous, coordinated care through intelligent workflows
              and operational clarity.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <BrandName></BrandName>{' '}
              is a product of{' '}
              <a
                href="https://www.custospark.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-300 hover:underline font-medium"
              >
                Custospark company Ltd
              </a>
            </span>
          </div>
        </div>

        <div className={cn(
          "pt-6 border-t-2 text-center text-xs leading-relaxed",
          theme === 'dark'
            ? "border-slate-800 text-slate-500"
            : "border-slate-200 text-slate-500"
        )}>
          <p>
            © {new Date().getFullYear()} Custocare Health Operations Platform. HIPAA-compliant healthcare data protection.
            For authorized healthcare use only.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};
