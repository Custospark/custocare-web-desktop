import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, Shield, Activity } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../app/store/slices/uiSlice';
import { cn } from '../../../../shared/types/cn';

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
  image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80',
  headline: 'Intelligent Medical Decision Support',
  subtext: 'Empowering healthcare professionals with AI-driven insights for better patient outcomes.',
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
      'min-h-screen flex',
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
    )}>
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative overflow-hidden">
        <div className={cn(
          'absolute inset-0 z-10',
          theme === 'dark'
            ? 'bg-gradient-to-br from-cyan-900/40 via-blue-900/30 to-purple-900/40'
            : 'bg-gradient-to-br from-blue-600/20 via-cyan-600/10 to-purple-600/15'
        )} />
        
        <img
          src={heroImage}
          alt="Healthcare professionals"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="relative z-20 flex flex-col justify-between p-8 xl:p-12 text-white w-full">
          <Link to="/" className="inline-flex items-center gap-3 group w-fit">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Custocare AI</h1>
              <p className="text-[11px] text-cyan-100/90 font-medium">Medical Decision Support</p>
            </div>
          </Link>

          <div className="space-y-4 max-w-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent rounded-full" />
              <Shield className="w-5 h-5 text-cyan-300" />
            </div>
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight">{heroHeadline}</h2>
            <p className="text-base text-cyan-50/90 leading-relaxed">{heroSubtext}</p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              {['HIPAA Compliant', '256-bit Encryption', 'SOC 2 Certified'].map((badge) => (
                <div key={badge} className="flex items-center gap-1.5 text-xs bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <Shield className="w-3 h-3 text-emerald-300" />
                  <span className="text-cyan-50">{badge}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-cyan-100/60">
            © {new Date().getFullYear()} Custocare AI. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col lg:w-[55%] xl:w-1/2">
        {/* Compact Header */}
        <header className="flex items-center justify-between px-5 py-3 lg:px-8 lg:py-4">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2">
            <div className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center',
              theme === 'dark'
                ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                : 'bg-gradient-to-br from-blue-500 to-cyan-600'
            )}>
              <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className={cn(
              'text-base font-bold',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Custocare AI
            </span>
          </Link>

          <button
            onClick={() => dispatch(toggleTheme())}
            className={cn(
              'ml-auto p-2 rounded-lg transition-all duration-200',
              'hover:scale-105 focus:outline-none focus:ring-2',
              theme === 'dark'
                ? 'bg-gray-800/60 hover:bg-gray-700/60 text-amber-300 focus:ring-cyan-500/50'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 focus:ring-blue-500/50'
            )}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        {/* Main Content - Starts immediately after header */}
        <main className="flex-1 flex items-start lg:items-center justify-center px-5 py-4 lg:px-8 lg:py-6 overflow-y-auto">
          <div className="w-full max-w-[420px]">
            {/* Title Section */}
            <div className="text-center mb-5">
              <h2 className={cn(
                'text-2xl lg:text-3xl font-bold tracking-tight',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {title}
              </h2>
              {subtitle && (
                <p className={cn(
                  'text-sm mt-1.5',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {subtitle}
                </p>
              )}
            </div>

            {/* Form Content */}
            {children}

            {/* Back to Login */}
            {showBackToLogin && (
              <div className="text-center mt-4">
                <Link
                  to="/login"
                  className={cn(
                    'text-sm font-medium inline-flex items-center gap-1.5 transition-colors',
                    theme === 'dark'
                      ? 'text-cyan-400 hover:text-cyan-300'
                      : 'text-blue-600 hover:text-blue-700'
                  )}
                >
                  ← Back to Login
                </Link>
              </div>
            )}

            {/* Security Badge */}
            <div className={cn(
              'flex items-center justify-center gap-1.5 text-[11px] mt-5',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            )}>
              <Shield className="w-3 h-3" />
              <span>Secured by enterprise-grade encryption</span>
            </div>
          </div>
        </main>

        {/* Compact Footer */}
        <footer className={cn(
          'px-5 py-3 text-center text-xs',
          theme === 'dark' ? 'text-gray-600' : 'text-gray-500'
        )}>
          Need help?{' '}
          <Link
            to="/help"
            className={cn(
              'font-medium transition-colors',
              theme === 'dark' ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
            )}
          >
            Contact Support
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default AuthLayout;
