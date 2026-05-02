import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Shield, Home, Lock, CheckCircle2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../../app/store/slices/uiSlice';
import { cn } from '../../../../../shared/types/cn';
import LogoImage from '../../../../../shared/assets/LogoImage';
import { BrandName } from '../../../../../shared/utils/BrandName';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  heroImage?: string;
  heroHeadline?: string;
  heroSubtext?: string;
  showBackToLogin?: boolean;
}

const DEFAULT_HERO = {
  image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1200&q=80',
  headline: 'Continuous Care. Clinical Excellence.',
  subtext: 'Unifying clinical workflows, financial operations, and patient engagement into one scalable healthcare platform.',
};

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  heroImage = DEFAULT_HERO.image,
  heroHeadline = DEFAULT_HERO.headline,
  heroSubtext = DEFAULT_HERO.subtext,
  showBackToLogin = false,
}) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);

  return (
    <div className={cn(
      'min-h-screen flex overflow-hidden relative font-sans antialiased',
      theme === 'dark'
        ? 'bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950'
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50/40'
    )}>
      {/* Enhanced Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={cn(
            "absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full blur-3xl",
            theme === 'dark' ? "bg-blue-600/25" : "bg-blue-400/20"
          )}
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.4, 0.3]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className={cn(
            "absolute -bottom-32 -left-32 w-[700px] h-[700px] rounded-full blur-3xl",
            theme === 'dark' ? "bg-emerald-600/25" : "bg-emerald-400/20"
          )}
        />
        
        {/* Subtle grid pattern */}
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

      {/* Left Panel - Hero Section */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative overflow-hidden">
        {/* Gradient Overlay */}
        <div className={cn(
          'absolute inset-0 z-10',
          theme === 'dark'
            ? 'bg-linear-to-br from-cyan-900/50 via-blue-900/40 to-purple-900/50'
            : 'bg-linear-to-br from-blue-600/30 via-cyan-600/20 to-purple-600/25'
        )} />
        
        {/* Hero Image */}
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          src={heroImage}
          alt="Healthcare professionals"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Hero Content */}
        <div className="relative z-20 flex flex-col justify-between p-8 xl:p-12 text-white w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
          </motion.div>

          {/* Hero Message */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-5 max-w-md"
          >
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ scaleX: [0, 1] }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent rounded-full origin-left" 
              />
              <Shield className="w-5 h-5 text-cyan-300" />
            </div>
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight">
              {heroHeadline}
            </h2>
            <p className="text-base text-cyan-50/95 leading-relaxed font-medium">
              {heroSubtext}
            </p>
            
            {/* Security Badges */}
            <div className="flex flex-wrap gap-3 pt-3">
              {[
                { label: 'HIPAA Compliant', icon: Shield },
                { label: '256-bit Encryption', icon: Lock },
                { label: 'SOC 2 Compliant', icon: CheckCircle2 }
              ].map((badge, index) => (
                <motion.div 
                  key={badge.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                  className="flex items-center gap-2 text-xs bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg"
                >
                  <badge.icon className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-cyan-50 font-semibold">{badge.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="text-xs text-cyan-100/60 font-medium"
          >
            © {new Date().getFullYear()} <BrandName/>. All rights reserved.
          </motion.p>
        </div>
      </div>

      {/* Right Panel - Form Section */}
      <div className="flex-1 flex flex-col lg:w-[55%] xl:w-1/2 relative z-10">
        {/* Premium Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "flex items-center justify-between px-5 py-4 lg:px-8 lg:py-5 border-b backdrop-blur-xl",
            theme === 'dark'
              ? 'bg-slate-900/60 border-slate-800/60'
              : 'bg-white/60 border-slate-200/60'
          )}
        >
          {/* Mobile Logo */}
            <div className="flex items-center gap-2">
            <LogoImage/>
             <BrandName></BrandName>

              </div>

          {/* Action Buttons */}
          <div className="ml-auto flex items-center gap-2.5">
            {/* Home Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/"
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-300 border-2 shadow-sm',
                  'hover:shadow-md focus:outline-none focus:ring-2',
                  theme === 'dark'
                    ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300 focus:ring-cyan-500/50'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 focus:ring-blue-500/50'
                )}
                aria-label="Go to Home"
                title="Return to Home"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm font-semibold hidden sm:inline">Home</span>
              </Link>
            </motion.div>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dispatch(toggleTheme())}
              className={cn(
                'flex items-center cursor-pointer gap-2 px-3.5 py-2.5 rounded-xl transition-all duration-300 border-2 shadow-sm',
                'hover:shadow-md focus:outline-none focus:ring-2',
                theme === 'dark'
                  ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-amber-300 focus:ring-cyan-500/50'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 focus:ring-blue-500/50'
              )}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title="Toggle Theme"
            >
              <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Sun className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Moon className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
              <span className="text-sm font-semibold hidden sm:inline">Theme</span>
            </motion.button>
          </div>
        </motion.header>

        {/* Main Content Area */}
        <main className="flex-1 flex items-center justify-center px-5 py-8 lg:px-8 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-[460px]"
          >
            {/* Title Section */}
            <div className="text-center mb-7">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className={cn(
                  'text-3xl lg:text-4xl font-extrabold tracking-tight mb-2',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  {title}
                </h2>
                {subtitle && (
                  <p className={cn(
                    'text-sm font-medium',
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  )}>
                    {subtitle}
                  </p>
                )}
              </motion.div>
            </div>

            {/* Form Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {children}
            </motion.div>

            {/* Back to Login Link */}
            {showBackToLogin && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="text-center mt-6"
              >
                <Link
                  to="/login"
                  className={cn(
                    'text-sm font-semibold inline-flex items-center gap-2 transition-colors',
                    theme === 'dark'
                      ? 'text-cyan-400 hover:text-cyan-300'
                      : 'text-blue-600 hover:text-blue-700'
                  )}
                >
                  ← Back to Login
                </Link>
              </motion.div>
            )}

            {/* Security Badge */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className={cn(
                'flex items-center justify-center gap-2 text-xs mt-8 px-4 py-3 rounded-xl border-2',
                theme === 'dark' 
                  ? 'bg-slate-800/40 border-slate-700/60 text-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              )}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Shield className="w-4 h-4 text-emerald-500" />
              </motion.div>
              <span className="font-semibold">Secured by enterprise-grade encryption</span>
            </motion.div>
          </motion.div>
        </main>

        {/* Premium Footer */}
        <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className={cn(
          'px-5 py-4 text-center text-xs border-t backdrop-blur-xl',
          theme === 'dark' 
            ? 'bg-slate-900/60 border-slate-800/60 text-slate-500'
            : 'bg-white/60 border-slate-200/60 text-slate-500'
        )}
          >
            Need help?{' '}
            <a
              href="mailto:support@custospark.com"
              className={cn(
                'font-semibold transition-colors',
                theme === 'dark' 
                  ? 'text-cyan-400 hover:text-cyan-300' 
                  : 'text-blue-600 hover:text-blue-700'
              )}
            >
              Contact Support
            </a>
          </motion.footer>
      </div>
    </div>
  );
};

export default AuthLayout;
