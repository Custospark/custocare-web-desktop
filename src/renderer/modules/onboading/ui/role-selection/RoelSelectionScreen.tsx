import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Stethoscope, 
  User, 
  ChevronRight,
  LogOut,
  Quote,
  Shield,
  Activity,
  Moon,
  Sun
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../app/store/slices/uiSlice';
import { cn } from '../../../../shared/types/cn';

interface RoleOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const RoleSelectionScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roleOptions: RoleOption[] = [
    {
      id: 'facility-owner',
      title: 'Facility Owner',
      description: 'For administrators managing clinics, hospitals, or care facilities.',
      icon: <Building2 className="w-5 h-5" />
    },
    {
      id: 'medical-professional',
      title: 'Medical Professional',
      description: 'For doctors, nurses, and support staff providing direct care.',
      icon: <Stethoscope className="w-5 h-5" />
    },
    {
      id: 'patient',
      title: 'Patient',
      description: 'For individuals seeking care, monitoring health, or managing appointments.',
      icon: <User className="w-5 h-5" />
    }
  ];

  const testimonialImage = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1200&q=80';
  const backgroundImage = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80';

  const handleContinue = () => {
    if (selectedRole) {
      // Redirect to role-specific setup portal
      console.log(`Redirecting to ${selectedRole} setup portal`);
      // You would typically use navigate() here
      // navigate(`/onboarding/${selectedRole}`);
    }
  };

  return (
    <div className={cn(
      'min-h-screen flex flex-col lg:flex-row',
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-50'
    )}>
      {/* Left Panel - Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 lg:px-8 lg:py-6">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105',
              theme === 'dark'
                ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                : 'bg-gradient-to-br from-blue-500 to-cyan-600'
            )}>
              <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className={cn(
                'text-lg font-bold leading-tight',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                CustoCare AI
              </span>
              <span className="text-xs text-gray-500">Medical Decision Support</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch(toggleTheme())}
              className={cn(
                'p-2 rounded-lg transition-all duration-200',
                'hover:scale-105 focus:outline-none focus:ring-2',
                theme === 'dark'
                  ? 'bg-gray-800/60 hover:bg-gray-700/60 text-amber-300 focus:ring-cyan-500/50'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 focus:ring-blue-500/50'
              )}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                theme === 'dark'
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-5 py-4 lg:px-8 lg:py-6 overflow-y-auto">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-10">
              <h1 className={cn(
                'text-3xl lg:text-4xl font-bold mb-3',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                Test
              </h1>
              <h2 className={cn(
                'text-xl lg:text-2xl font-semibold',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                Tell us who you are
              </h2>
              <p className={cn(
                'mt-2 text-base',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Select your primary role below so we can customize your onboarding experience.
              </p>
            </div>

            {/* Role Selection Cards */}
            <div className="space-y-4 mb-10">
              {roleOptions.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={cn(
                    'w-full text-left p-5 rounded-xl border transition-all duration-200',
                    'hover:scale-[1.02] focus:outline-none focus:ring-2',
                    selectedRole === role.id
                      ? theme === 'dark'
                        ? 'bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-cyan-500/50 ring-2 ring-cyan-500/50'
                        : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-500 ring-2 ring-blue-500/50'
                      : theme === 'dark'
                        ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600 focus:ring-cyan-500/30'
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:ring-blue-500/30'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                      selectedRole === role.id
                        ? theme === 'dark'
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                          : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                        : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-100 text-gray-600'
                    )}>
                      {role.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={cn(
                          'text-lg font-semibold',
                          selectedRole === role.id
                            ? theme === 'dark'
                              ? 'text-cyan-300'
                              : 'text-blue-700'
                            : theme === 'dark'
                              ? 'text-white'
                              : 'text-gray-900'
                        )}>
                          {role.title}
                        </h3>
                        <ChevronRight className={cn(
                          'w-5 h-5 transition-transform',
                          selectedRole === role.id
                            ? theme === 'dark'
                              ? 'text-cyan-400'
                              : 'text-blue-600'
                            : 'text-gray-400',
                          selectedRole === role.id && 'translate-x-1'
                        )} />
                      </div>
                      <p className={cn(
                        'mt-1.5 text-sm',
                        selectedRole === role.id
                          ? theme === 'dark'
                            ? 'text-cyan-100/80'
                            : 'text-blue-600/90'
                          : theme === 'dark'
                            ? 'text-gray-400'
                            : 'text-gray-600'
                      )}>
                        {role.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className={cn(
                  'w-full border-t',
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                )} />
              </div>
            </div>

            {/* Continue Button */}
            <div className="text-center">
              <button
                onClick={handleContinue}
                disabled={!selectedRole}
                className={cn(
                  'w-full max-w-sm mx-auto px-6 py-3 rounded-lg font-semibold',
                  'transition-all duration-200 transform hover:scale-[1.02]',
                  'focus:outline-none focus:ring-2',
                  selectedRole
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white focus:ring-cyan-500/50'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white focus:ring-blue-500/50'
                    : theme === 'dark'
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                Continue
              </button>
              <p className={cn(
                'mt-3 text-sm',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
              )}>
                You will be redirected to the specific setup portal for your selected role.
              </p>
            </div>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className={cn(
                  'w-full border-t',
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                )} />
              </div>
            </div>

            {/* Help Section */}
            <div className="text-center">
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                <span className="font-medium">Need Help?</span>{' '}
                <Link
                  to="/help"
                  className={cn(
                    'font-medium transition-colors',
                    theme === 'dark'
                      ? 'text-cyan-400 hover:text-cyan-300'
                      : 'text-blue-600 hover:text-blue-700'
                  )}
                >
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-5 py-4 lg:px-8 lg:py-6">
          <div className={cn(
            'text-center text-xs',
            theme === 'dark' ? 'text-gray-600' : 'text-gray-500'
          )}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4">
              <span>© 2023 CustoCare AI. All rights reserved.</span>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-4">
                <Link
                  to="/privacy"
                  className={cn(
                    'transition-colors',
                    theme === 'dark'
                      ? 'text-gray-500 hover:text-gray-400'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  Privacy Policy
                </Link>
                <span>•</span>
                <Link
                  to="/terms"
                  className={cn(
                    'transition-colors',
                    theme === 'dark'
                      ? 'text-gray-500 hover:text-gray-400'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Right Panel - Testimonial */}
      <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden">
        <div className={cn(
          'absolute inset-0 z-10',
          theme === 'dark'
            ? 'bg-gradient-to-br from-cyan-900/40 via-blue-900/30 to-purple-900/40'
            : 'bg-gradient-to-br from-blue-600/20 via-cyan-600/10 to-purple-600/15'
        )} />
        
        <img
          src={backgroundImage}
          alt="Healthcare background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="relative z-20 flex flex-col justify-between p-8 xl:p-12 text-white w-full">
          {/* Top Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-cyan-300" />
              <span className="text-sm font-medium">HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-300" />
              <span className="text-xs text-cyan-100/80">SOC 2 Certified</span>
            </div>
          </div>

          {/* Testimonial Section */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 xl:p-8">
            <Quote className="w-8 h-8 text-cyan-300 mb-4" />
            <p className="text-lg xl:text-xl italic leading-relaxed mb-6">
              "CustoCare AI has streamlined how our entire facility operates, connecting doctors and patients seamlessly."
            </p>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20">
                <img
                  src={testimonialImage}
                  alt="Dr. Sarah Jansen"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold text-lg">Dr. Sarah Jansen</h4>
                <p className="text-sm text-cyan-100/90">Chief of Medicine</p>
              </div>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-cyan-100/80">
              <div className="w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent rounded-full" />
              <span>Connecting Care</span>
              <div className="w-8 h-0.5 bg-gradient-to-l from-cyan-400 to-transparent rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionScreen;