import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Download, Sun, Moon } from 'lucide-react';
import { useAppDispatch } from '../../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../../app/store/slices/uiSlice';
import { cn } from '../../../../../shared/types/cn';
import LogoImage from '../../../../../shared/assets/LogoImage';
import { BrandName } from '../../../../../shared/utils/BrandName';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';

interface LandingHeaderProps {
  theme: string;
}

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Privacy', path: '/privacy' },
];

export const LandingHeader: React.FC<LandingHeaderProps> = ({ theme }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0.96]);
  const headerBlur = useTransform(scrollYProgress, [0, 0.15], [8, 12]);
  const { showToast } = useToast();

  const handleDownloadWindows = () => {
    const downloadUrl = 'https://github.com/Custospark/custocare-web-desktop/releases/download/v2.13.11/Custocare-Setup-2.13.11.exe';

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'Custocare-Setup-2.13.11.exe';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("info", "Custocare Desktop download started...", 5000);
  };

  return (
    <motion.header
      style={{
        opacity: headerOpacity,
        backdropFilter: `blur(${headerBlur}px)`
      }}
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        theme === 'dark'
          ? "bg-slate-900/75 border-slate-800/60"
          : "bg-white/75 border-slate-200/60"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4" aria-label="Main navigation">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            <Link to="/">
              <LogoImage />
            </Link>

            <div className="hidden sm:block">
              <Link to="/">
                <BrandName />
              </Link>
              <div className={cn(
                "text-[11px] font-bold tracking-wide uppercase",
                theme === 'dark' ? "text-slate-500" : "text-slate-500"
              )}>
                Continuous Care. Clinical Excellence.
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center gap-1 sm:gap-2"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300",
                  location.pathname === link.path
                    ? theme === 'dark'
                      ? "text-blue-400 bg-blue-500/10"
                      : "text-blue-600 bg-blue-50"
                    : theme === 'dark'
                      ? "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="w-px h-6 mx-1 sm:mx-2 bg-slate-300/50 dark:bg-slate-700/50" />

            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleDownloadWindows}
              className={cn(
                "flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl font-bold text-xs transition-all duration-300 border-2 shadow-sm",
                theme === 'dark'
                  ? "bg-blue-600/10 border-blue-500/40 text-blue-300 hover:bg-blue-600/20 hover:border-blue-400/60"
                  : "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400"
              )}
              aria-label="Download Windows version"
              title="Download Custocare for Windows"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline text-xs">Windows</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => dispatch(toggleTheme())}
              className={cn(
                "flex items-center gap-1.5 cursor-pointer px-2.5 sm:px-3 py-2 rounded-xl transition-all duration-300 border-2 shadow-sm",
                theme === 'dark'
                  ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
              )}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                  <motion.span
                    key="sun"
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center"
                  >
                    <Sun className="w-4 h-4" aria-hidden="true" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="moon"
                    initial={{ rotate: 180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center"
                  >
                    <Moon className="w-4 h-4" aria-hidden="true" />
                  </motion.span>
                )}
              </AnimatePresence>

              <span className="hidden sm:inline font-semibold text-xs">
                Theme
              </span>
            </motion.button>
          </motion.div>
        </div>
      </nav>
    </motion.header>
  );
};
