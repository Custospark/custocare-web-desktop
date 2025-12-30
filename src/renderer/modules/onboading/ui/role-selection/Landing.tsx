import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Shield, 
  Stethoscope, 
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Users,
  Lock,
  Sun,
  Moon,
  Building,
  UserCheck,
  Activity
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../app/store/slices/uiSlice';
import { cn } from '../../../../shared/types/cn';

/* ==========================================================================
   PROFESSIONAL HEALTHCARE IMAGES
   ========================================================================== */
const IMAGES = {
  heroMedical: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=800&fit=crop&q=80',
  doctorPatient: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&h=400&fit=crop&q=80',
  hospitalFacility: 'https://images.unsplash.com/photo-1519494140681-8b17d830a3e9?w-600&h=400&fit=crop&q=80',
  medicalDashboard: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop&q=80'
};

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const handleAction = async (action: 'login' | 'signup') => {
    setIsLoading(action);
    
    // Realistic loading with proper UX
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (action === 'login') {
        navigate('/login');
      } else {
        navigate('/signup');
      }
    } catch (error) {
      setIsLoading(null);
    }
  };

  const TrustBadges = () => (
    <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full">
        <Shield className="w-4 h-4 text-emerald-500" />
        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          HIPAA Compliant
        </span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full">
        <Lock className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          End-to-End Encrypted
        </span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full">
        <Users className="w-4 h-4 text-purple-500" />
        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
          10,000+ Healthcare Partners
        </span>
      </div>
    </div>
  );

  return (
    <div className={cn(
      "min-h-screen flex flex-col overflow-hidden",
      theme === 'dark' 
        ? "bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950" 
        : "bg-gradient-to-br from-gray-50 via-white to-blue-50"
    )}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl",
          theme === 'dark' ? "bg-blue-600" : "bg-blue-300"
        )} />
        <div className={cn(
          "absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl",
          theme === 'dark' ? "bg-emerald-600" : "bg-emerald-300"
        )} />
        
        {/* Subtle grid pattern */}
        <div className={cn(
          "absolute inset-0 opacity-5",
          theme === 'dark' ? "bg-grid-white/[0.02]" : "bg-grid-gray-900/[0.02]"
        )} />
      </div>

      {/* Header with Theme Toggle */}
      <header className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-sm",
        theme === 'dark' 
          ? "bg-gray-900/80 border-gray-800" 
          : "bg-white/80 border-gray-200"
      )}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  CustoCare AI
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Intelligent Healthcare Platform
                </div>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-300 hover:scale-105",
                "hover:shadow-md",
                theme === 'dark'
                  ? "hover:bg-gray-800 text-gray-300"
                  : "hover:bg-gray-100 text-gray-600"
              )}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className={cn(
        "flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10 transition-opacity duration-700",
        fadeIn ? "opacity-100" : "opacity-0"
      )}>
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Column - Hero Content */}
          <div className="lg:w-1/2 text-center lg:text-left space-y-10">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full mb-6 shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold text-white">
                  Trusted by Leading Healthcare Institutions
                </span>
              </div>
              
              <h1 className={cn(
                "text-5xl lg:text-6xl font-bold leading-tight mb-6",
                theme === 'dark' 
                  ? "text-white" 
                  : "text-gray-900"
              )}>
                Healthcare Intelligence,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                  Personalized Care
                </span>
              </h1>
              
              <p className={cn(
                "text-xl lg:text-2xl font-light mb-8",
                theme === 'dark' ? "text-gray-300" : "text-gray-700"
              )}>
                One platform connecting patients, healthcare professionals, 
                and medical facilities with AI-powered precision.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: UserCheck,
                  title: "For Patients",
                  description: "Personal health tracking & AI-powered insights"
                },
                {
                  icon: Stethoscope,
                  title: "For Professionals",
                  description: "Clinical decision support & patient management"
                },
                {
                  icon: Building,
                  title: "For Facilities",
                  description: "Operational efficiency & comprehensive analytics"
                }
              ].map((benefit, index) => (
                <div 
                  key={index}
                  className={cn(
                    "p-5 rounded-xl border transition-all duration-300",
                    theme === 'dark'
                      ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800/80"
                      : "bg-white/80 border-gray-200 hover:bg-white shadow-sm"
                  )}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/10 to-emerald-500/10 mb-4">
                    <benefit.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className={cn(
                    "font-bold mb-2",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>
                    {benefit.title}
                  </h3>
                  <p className={cn(
                    "text-sm",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>

            <TrustBadges />
          </div>

          {/* Right Column - Access Panel */}
          <div className="lg:w-1/2 w-full max-w-md">
            <div className="relative">
              {/* Elegant Card */}
              <div className={cn(
                "rounded-2xl p-8 backdrop-blur-sm border",
                "shadow-2xl",
                theme === 'dark'
                  ? "bg-gray-800/50 border-gray-700"
                  : "bg-white/90 border-gray-200"
              )}>
                {/* Welcome Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/10 to-emerald-500/10 mb-4">
                    <Heart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className={cn(
                    "text-2xl font-bold mb-2",
                    theme === 'dark' ? "text-white" : "text-gray-900"
                  )}>
                    Welcome to CustoCare AI
                  </h2>
                  <p className={cn(
                    "text-center",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}>
                    Select your role to continue
                  </p>
                </div>

                {/* Access Options */}
                <div className="space-y-4">
                  {/* New Account - Primary */}
                  <button
                    onClick={() => handleAction('signup')}
                    disabled={isLoading !== null}
                    onMouseEnter={() => setHoveredOption('signup')}
                    onMouseLeave={() => setHoveredOption(null)}
                    className={cn(
                      "w-full flex items-center justify-between p-5 rounded-xl transition-all duration-300",
                      "hover:shadow-xl disabled:opacity-70 group relative overflow-hidden",
                      theme === 'dark'
                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                        : "bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600"
                    )}
                  >
                    {/* Animated background effect */}
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                      "bg-gradient-to-r from-white/10 to-transparent"
                    )} />
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-white">
                          Begin Your Journey
                        </h3>
                        <p className="text-sm text-white/90">
                          Register as Patient, Professional, or Facility
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform relative z-10" />
                  </button>

                  {/* Existing Account - Secondary */}
                  <button
                    onClick={() => handleAction('login')}
                    disabled={isLoading !== null}
                    onMouseEnter={() => setHoveredOption('login')}
                    onMouseLeave={() => setHoveredOption(null)}
                    className={cn(
                      "w-full flex items-center justify-between p-5 rounded-xl border transition-all duration-300 group",
                      "hover:shadow-lg disabled:opacity-70",
                      theme === 'dark'
                        ? "bg-gray-800/30 border-gray-700 hover:bg-gray-800/50"
                        : "bg-white/50 border-gray-200 hover:bg-white"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        theme === 'dark' ? "bg-blue-500/20" : "bg-blue-100"
                      )}>
                        <Shield className={cn(
                          "w-6 h-6",
                          theme === 'dark' ? "text-blue-400" : "text-blue-600"
                        )} />
                      </div>
                      <div className="text-left">
                        <h3 className={cn(
                          "text-lg font-semibold",
                          theme === 'dark' ? "text-white" : "text-gray-900"
                        )}>
                          Access Your Account
                        </h3>
                        <p className={cn(
                          "text-sm",
                          theme === 'dark' ? "text-gray-300" : "text-gray-600"
                        )}>
                          Continue to your dashboard
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      "w-5 h-5",
                      theme === 'dark' ? "text-gray-300" : "text-gray-400",
                      "group-hover:translate-x-1 transition-transform"
                    )} />
                  </button>
                </div>

                {/* Security Assurance */}
                <div className="mt-8 pt-8 border-t border-gray-700 dark:border-gray-700">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span className={cn(
                      "text-sm font-medium",
                      theme === 'dark' ? "text-gray-300" : "text-gray-700"
                    )}>
                      Enterprise-Grade Security
                    </span>
                  </div>
                  <p className={cn(
                    "text-center text-xs",
                    theme === 'dark' ? "text-gray-400" : "text-gray-500"
                  )}>
                    All health data is encrypted, HIPAA compliant, and never shared 
                    without explicit consent.
                  </p>
                </div>
              </div>

              {/* Floating Image Element */}
              <div className={cn(
                "absolute -bottom-8 -right-8 w-32 h-32 rounded-2xl overflow-hidden border-4",
                "shadow-2xl",
                theme === 'dark' 
                  ? "border-gray-800" 
                  : "border-white"
              )}>
                <img
                  src={IMAGES.doctorPatient}
                  alt="Doctor consulting with patient"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className={cn(
          "mt-16 w-full max-w-4xl mx-auto p-8 rounded-2xl border",
          theme === 'dark'
            ? "bg-gray-800/30 border-gray-700"
            : "bg-white/50 border-gray-200"
        )}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { value: "50K+", label: "Active Patients", icon: Users },
              { value: "98.7%", label: "Satisfaction Rate", icon: Heart },
              { value: "24/7", label: "AI Monitoring", icon: Activity }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/10 to-emerald-500/10 mb-3">
                  <stat.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className={cn(
                  "text-3xl font-bold mb-1",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {stat.value}
                </div>
                <div className={cn(
                  "text-sm",
                  theme === 'dark' ? "text-gray-400" : "text-gray-600"
                )}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Elegant Footer */}
      <footer className={cn(
        "py-8 px-4 border-t backdrop-blur-sm",
        theme === 'dark' 
          ? "bg-gray-900/50 border-gray-800" 
          : "bg-white/50 border-gray-200"
      )}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <span className={cn(
                  "text-lg font-bold",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  CustoCare AI
                </span>
              </div>
              <p className={cn(
                "text-sm max-w-md",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Transforming healthcare through AI-powered intelligence 
                and compassionate care delivery.
              </p>
            </div>
            
            <div className="flex items-center gap-8">
              {['Privacy Policy', 'Terms of Service', 'HIPAA Compliance', 'Contact'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className={cn(
                    "text-sm transition-colors hover:text-blue-500",
                    theme === 'dark' ? "text-gray-400" : "text-gray-600"
                  )}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
          
          <div className={cn(
            "pt-6 border-t text-center text-xs",
            theme === 'dark' ? "border-gray-800 text-gray-500" : "border-gray-200 text-gray-400"
          )}>
            <p>
              © 2024 CustoCare AI Health Platform. All healthcare data is protected under HIPAA regulations. 
              This platform is intended for legitimate healthcare use only.
            </p>
          </div>
        </div>
      </footer>

      {/* Elegant Loading Overlay */}
      {isLoading && (
        <div 
          role="status"
          aria-live="polite"
          aria-label="Loading"
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div 
            className={cn(
              "p-8 rounded-2xl flex flex-col items-center gap-5 animate-in fade-in zoom-in",
              "shadow-2xl",
              theme === 'dark' 
                ? "bg-gray-800 border border-gray-700" 
                : "bg-white border border-gray-200"
            )}
          >
            <div className="relative">
              <div className={cn(
                "w-14 h-14 border-[3px] rounded-full animate-spin",
                theme === 'dark' 
                  ? "border-blue-500/30 border-t-blue-500" 
                  : "border-blue-500/30 border-t-blue-600"
              )} />
              <Heart className="w-7 h-7 text-emerald-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <div className="text-center">
              <p className={cn(
                "font-semibold mb-2",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {isLoading === 'login' 
                  ? 'Accessing your secure dashboard...' 
                  : 'Preparing your healthcare journey...'}
              </p>
              <p className={cn(
                "text-sm animate-pulse",
                theme === 'dark' ? "text-gray-400" : "text-gray-600"
              )}>
                Securely connecting to CustoCare AI...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;