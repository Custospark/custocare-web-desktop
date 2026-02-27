import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Monitor,
  LogIn,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import AuthLayout from './AuthLayout';
import { cn } from '../../../../../shared/types/cn';
import { ROUTES } from '../../../../../app/routes/routeConstants';

/**
 * ============================================================================
 * POST-RESET REDIRECT COMPONENT
 * ============================================================================
 *
 * This component is shown after a successful password reset.
 * It gives users two simple options:
 * 1. Continue on Browser (mobile or desktop)
 * 2. Continue on Desktop App
 *
 * If no action is taken within 60 seconds, they are automatically
 * redirected to the login page.
 */

interface RedirectOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  primary?: boolean;
}

export const PasswordResetSuccess: React.FC = () => {
  const navigate = useNavigate();
  const theme = useAppSelector((state) => state.ui.theme);
  const [countdown, setCountdown] = useState(60);

  // Auto-redirect to login after 60 seconds
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigate(ROUTES.LANDING);
    }
  }, [countdown, navigate]);

  // Handle continue in browser
  const handleContinueInBrowser = () => {
    navigate(ROUTES.LANDING);
  };

  // Handle continue on desktop app
  const handleDesktopApp = () => {
    // You can implement custom protocol handling here if needed
    // For now, just a message or you can close the tab
    window.close();
  };

  // Simple redirect options
  const redirectOptions: RedirectOption[] = [
    {
      id: 'browser',
      title: 'Continue on Browser',
      description: 'Use Custocare AI on your mobile or desktop browser',
      icon: <Globe className="w-6 h-6" />,
      action: handleContinueInBrowser,
      primary: true,
    },
    {
      id: 'desktop',
      title: 'Continue on Desktop App',
      description: 'Switch to your Custocare AI desktop application',
      icon: <Monitor className="w-6 h-6" />,
      action: handleDesktopApp,
    },
  ];

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AuthLayout
      title="Password Reset Successful!"
      subtitle="Choose where you'd like to continue"
      heroImage="https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80"
      heroHeadline="Your password has been updated"
      heroSubtext="Your account is now secure. Continue using Custocare AI on your preferred platform."
      showBackToLogin={false}
    >
      <div className="space-y-6">
        {/* Two simple options - optimized for mobile buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {redirectOptions.map((option) => (
            <button
              key={option.id}
              onClick={option.action}
              className={cn(
                // Base styles
                'w-full p-5 sm:p-6 rounded-xl border-2',
                'transition-all duration-200 active:scale-[0.98]', 
                'hover:scale-[1.02] hover:shadow-lg',
                'focus:outline-none focus:ring-4',
                'cursor-pointer touch-manipulation', 
                'min-h-40 sm:min-h-45', 
                
                // Primary option styles
                option.primary
                  ? theme === 'dark'
                    ? 'border-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20 active:bg-cyan-500/30 focus:ring-cyan-500/30'
                    : 'border-blue-500 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 focus:ring-blue-200'
                  : theme === 'dark'
                  ? 'border-gray-800 bg-gray-900/50 hover:bg-gray-800 active:bg-gray-700 focus:ring-gray-700'
                  : 'border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 focus:ring-gray-200'
              )}
            >
              <div className="flex flex-col items-center text-center gap-3 h-full justify-between">
                {/* Icon with enhanced visibility on mobile */}
                <div
                  className={cn(
                    'p-3 sm:p-3 rounded-full',
                    'transition-colors duration-200',
                    option.primary
                      ? theme === 'dark'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-blue-100 text-blue-600'
                      : theme === 'dark'
                      ? 'bg-gray-800 text-gray-400'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {option.icon}
                </div>
                
                {/* Text content - optimized for mobile reading */}
                <div className="flex-1">
                  <h3
                    className={cn(
                      'font-semibold text-base sm:text-lg mb-1.5',
                      'px-2', // Added horizontal padding for text
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}
                  >
                    {option.title}
                  </h3>
                  <p
                    className={cn(
                      'text-xs sm:text-sm',
                      'px-2', // Added horizontal padding for text
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}
                  >
                    {option.description}
                  </p>
                </div>
                
                {/* Arrow indicator - larger touch-friendly */}
                <ArrowRight
                  className={cn(
                    'w-5 h-5 sm:w-5 sm:h-5',
                    'mt-2 sm:mt-2',
                    'transition-transform group-active:translate-x-1', // Added active animation
                    option.primary
                      ? theme === 'dark'
                        ? 'text-cyan-400'
                        : 'text-blue-600'
                      : theme === 'dark'
                      ? 'text-gray-600'
                      : 'text-gray-400'
                  )}
                />
              </div>
            </button>
          ))}
        </div>        

        {/* Auto-redirect countdown with enhanced mobile touch targets */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleContinueInBrowser}
              className={cn(
                'text-sm font-medium hover:underline flex items-center gap-1.5',
                'px-4 py-3 sm:px-3 sm:py-1.5 rounded-lg', // Larger touch target on mobile
                'transition-colors duration-200',
                'cursor-pointer touch-manipulation', // Better mobile handling
                'active:bg-opacity-75', // Active state feedback
                theme === 'dark' 
                  ? 'text-cyan-400 hover:bg-cyan-500/10 active:bg-cyan-500/20' 
                  : 'text-cyan-600 hover:bg-cyan-50 active:bg-cyan-100'
              )}
            >
              <LogIn className="w-4 h-4 sm:w-4 sm:h-4" />
              <span>Go to Home</span>
            </button>
            
            <div className={cn(
              'flex items-center gap-2 px-4 py-3 sm:px-3 sm:py-1.5 rounded-lg',
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            )}>
              <Clock className={cn(
                'w-4 h-4 sm:w-4 sm:h-4',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
              )} />
              <span
                className={cn(
                  'text-sm font-mono font-medium',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                {formatTime(countdown)}
              </span>
            </div>
          </div>
          
          {/* Progress bar - slightly taller for better visibility on mobile */}
          <div className="w-full h-1.5 sm:h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={cn(
                'h-full transition-all duration-1000 ease-linear',
                theme === 'dark' ? 'bg-cyan-500' : 'bg-cyan-600'
              )}
              style={{ width: `${(countdown / 60) * 100}%` }}
            />
          </div>
          
          <p className={cn(
            'text-xs sm:text-xs text-center',
            'px-2', // Added padding for better mobile readability
            theme === 'dark' ? 'text-gray-600' : 'text-gray-500'
          )}>
            Redirecting to Home in {countdown} seconds
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default PasswordResetSuccess;