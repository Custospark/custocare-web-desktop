import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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
  Activity,
  Download,
  Monitor,
  ArrowRight,
  TrendingUp,
  Award,
  Zap
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
  hospitalFacility: 'https://images.unsplash.com/photo-1519494140681-8b17d830a3e9?w=600&h=400&fit=crop&q=80',
  medicalDashboard: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop&q=80'
};

/* ==========================================================================
   ENHANCED ANIMATION VARIANTS
   ========================================================================== */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 18
    }
  }
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.03,
    y: -6,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20
    }
  }
};

const floatingVariants = {
  animate: {
    y: [-12, 12, -12],
    transition: {
      duration: 7,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const pulseGlowVariants = {
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.4, 0.7, 0.4],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const shimmerVariants = {
  animate: {
    x: ['-100%', '200%'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
      repeatDelay: 3
    }
  }
};

/* ==========================================================================
   MAIN LANDING COMPONENT
   ========================================================================== */
export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0.96]);
  const headerBlur = useTransform(scrollYProgress, [0, 0.15], [8, 12]);

  const handleAction = async (action: 'login' | 'signup') => {
    setIsLoading(action);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (action === 'login') {
        navigate('/login');
      } else {
        navigate('/signup');
      }
    } catch (error) {
      setIsLoading(null);
    }
  };

  const handleDownloadWindows = () => {
    console.log('Initiating Windows download...');
    // window.location.href = '/downloads/custocare-windows-installer.exe';
  };

  /* ========================================================================
     TRUST BADGES COMPONENT
     ======================================================================== */
  const TrustBadges = () => (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap items-center justify-center lg:justify-start gap-3"
      role="list"
      aria-label="Security certifications"
    >
      {[
        { 
          icon: Shield, 
          text: "HIPAA Compliant", 
          color: "emerald",
          description: "Health Insurance Portability and Accountability Act certified"
        },
        { 
          icon: Lock, 
          text: "256-bit Encrypted", 
          color: "blue",
          description: "Military-grade encryption for all data"
        },
        { 
          icon: Award, 
          text: "ISO 27001 Certified", 
          color: "purple",
          description: "International information security standard"
        }
      ].map((badge, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          whileHover={{ scale: 1.06, y: -2 }}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-sm border-2 transition-all duration-300 cursor-default",
            badge.color === 'emerald' && "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15 hover:border-emerald-500/40",
            badge.color === 'blue' && "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/15 hover:border-blue-500/40",
            badge.color === 'purple' && "bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/15 hover:border-purple-500/40"
          )}
          role="listitem"
          title={badge.description}
          aria-label={`${badge.text}: ${badge.description}`}
        >
          <badge.icon 
            className={cn(
              "w-4 h-4",
              badge.color === 'emerald' && "text-emerald-600 dark:text-emerald-400",
              badge.color === 'blue' && "text-blue-600 dark:text-blue-400",
              badge.color === 'purple' && "text-purple-600 dark:text-purple-400"
            )}
            aria-hidden="true"
          />
          <span className={cn(
            "text-sm font-bold tracking-tight",
            badge.color === 'emerald' && "text-emerald-800 dark:text-emerald-200",
            badge.color === 'blue' && "text-blue-800 dark:text-blue-200",
            badge.color === 'purple' && "text-purple-800 dark:text-purple-200"
          )}>
            {badge.text}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );

  /* ========================================================================
     MAIN RENDER
     ======================================================================== */
  return (
    <div className={cn(
      "min-h-screen flex flex-col overflow-hidden relative font-sans antialiased",
      theme === 'dark' 
        ? "bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950" 
        : "bg-gradient-to-br from-slate-50 via-white to-blue-50/40"
    )}>
      {/* Enhanced Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <motion.div 
          variants={pulseGlowVariants}
          animate="animate"
          className={cn(
            "absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full blur-3xl",
            theme === 'dark' ? "bg-blue-600/25" : "bg-blue-400/20"
          )}
        />
        <motion.div 
          variants={pulseGlowVariants}
          animate="animate"
          style={{ animationDelay: '2s' }}
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

      {/* Premium Header */}
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
            {/* Logo */}
            <motion.div 
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center gap-3"
            >
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.12 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-white/10"
                aria-hidden="true"
              >
                <Heart className="w-6 h-6 text-white drop-shadow-sm" />
              </motion.div>
              <div className="hidden sm:block">
                <div className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-600 bg-clip-text text-transparent">
                  CustoCare AI
                </div>
                <div className={cn(
                  "text-[11px] font-semibold tracking-wide uppercase",
                  theme === 'dark' ? "text-slate-500" : "text-slate-500"
                )}>
                  Enterprise Healthcare Platform
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center gap-2 sm:gap-3"
            >
              {/* Windows Download Button */}
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleDownloadWindows}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 border-2 shadow-sm",
                  theme === 'dark'
                    ? "bg-blue-600/10 border-blue-500/40 text-blue-300 hover:bg-blue-600/20 hover:border-blue-400/60 hover:shadow-blue-500/20"
                    : "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400 hover:shadow-blue-200/50"
                )}
                aria-label="Download Windows version"
                title="Download CustoCare AI for Windows"
              >
                <Monitor className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Windows</span>
                <Download className="w-4 h-4" aria-hidden="true" />
              </motion.button>

              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.06, rotate: 15 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => dispatch(toggleTheme())}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-300 border-2 shadow-sm",
                  theme === 'dark'
                    ? "bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:border-slate-300"
                )}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
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
                      <Sun className="w-5 h-5" aria-hidden="true" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 180, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -180, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Moon className="w-5 h-5" aria-hidden="true" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          </div>
        </nav>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 lg:py-16 relative z-10">
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            
            {/* Left Column - Hero Content */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center lg:text-left space-y-8 order-2 lg:order-1"
            >
              <div className="space-y-6 lg:space-y-7">
                {/* Badge */}
                <motion.div variants={itemVariants} className="flex justify-center lg:justify-start">
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="inline-flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full shadow-lg shadow-blue-500/30 cursor-default"
                    role="status"
                    aria-label="Trusted by over 10,000 healthcare institutions"
                  >
                    <Sparkles className="w-4 h-4 text-white animate-pulse" aria-hidden="true" />
                    <span className="text-sm font-bold text-white tracking-tight">
                      Trusted by 10,000+ Healthcare Institutions
                    </span>
                  </motion.div>
                </motion.div>
                
                {/* Main Headline */}
                <motion.h1 
                  variants={itemVariants}
                  className={cn(
                    "text-[2.5rem] sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.08] tracking-tight",
                    theme === 'dark' ? "text-white" : "text-slate-900"
                  )}
                >
                  Healthcare Intelligence,{' '}
                  <span className="relative inline-block">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-600">
                      Personalized Care
                    </span>
                    <motion.div
                      className="absolute -bottom-2 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-600 rounded-full shadow-lg"
                      initial={{ scaleX: 0, originX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
                    />
                  </span>
                </motion.h1>
                
                {/* Subtitle */}
                <motion.p 
                  variants={itemVariants}
                  className={cn(
                    "text-lg sm:text-xl lg:text-2xl font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0",
                    theme === 'dark' ? "text-slate-300" : "text-slate-700"
                  )}
                >
                  Transforming healthcare through AI-powered intelligence 
                  and compassionate care delivery.
                </motion.p>
              </div>

              {/* MOBILE ONLY: Access Panel After Description */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="lg:hidden pt-4"
              >
                <AccessPanel 
                  theme={theme}
                  isLoading={isLoading}
                  hoveredOption={hoveredOption}
                  setHoveredOption={setHoveredOption}
                  handleAction={handleAction}
                />
              </motion.div>

              {/* Key Benefits Grid - Hidden on Mobile */}
              <motion.div 
                variants={containerVariants}
                className="lg:grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2"
              >
                {[
                  {
                    icon: UserCheck,
                    title: "For Patients",
                    description: "Personal health monitoring & AI-powered insights",
                    gradient: "from-blue-500 to-blue-600",
                    color: "blue"
                  },
                  {
                    icon: Stethoscope,
                    title: "For Professionals",
                    description: "Clinical decision support & patient management",
                    gradient: "from-emerald-500 to-emerald-600",
                    color: "emerald"
                  },
                  {
                    icon: Building,
                    title: "For Facilities",
                    description: "Operational efficiency & comprehensive analytics",
                    gradient: "from-purple-500 to-purple-600",
                    color: "purple"
                  }
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover="hover"
                    initial="rest"
                    animate="rest"
                    className={cn(
                      "group p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer",
                      theme === 'dark'
                        ? "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600 hover:shadow-xl hover:shadow-slate-900/20"
                        : "bg-white/80 border-slate-200 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 hover:border-slate-300"
                    )}
                    role="article"
                    aria-labelledby={`benefit-${index}-title`}
                  >
                    <motion.div 
                      variants={cardHoverVariants}
                      className={cn(
                        "inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-gradient-to-br shadow-lg",
                        benefit.gradient
                      )}
                      aria-hidden="true"
                    >
                      <benefit.icon className="w-6 h-6 text-white drop-shadow-sm" />
                    </motion.div>
                    <h3 
                      id={`benefit-${index}-title`}
                      className={cn(
                        "font-bold mb-2 text-base sm:text-lg transition-colors",
                        "group-hover:text-blue-600 dark:group-hover:text-blue-400",
                        theme === 'dark' ? "text-white" : "text-slate-900"
                      )}
                    >
                      {benefit.title}
                    </h3>
                    <p className={cn(
                      "text-sm leading-relaxed",
                      theme === 'dark' ? "text-slate-400" : "text-slate-600"
                    )}>
                      {benefit.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Trust Badges - Hidden on Mobile */}
              <div className="hidden lg:block pt-2">
                <TrustBadges />
              </div>

              {/* Social Proof - Hidden on Mobile */}
              <motion.div 
                variants={itemVariants}
                className="hidden lg:flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2.5" role="img" aria-label="User avatars">
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0, x: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ delay: 0.9 + i * 0.08, type: "spring" }}
                        className="w-11 h-11 rounded-full border-[3px] border-white dark:border-slate-900 bg-gradient-to-br from-blue-400 to-emerald-400 shadow-md"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <div className="text-left">
                    <div className={cn(
                      "text-sm font-bold tracking-tight",
                      theme === 'dark' ? "text-white" : "text-slate-900"
                    )}>
                      50,000+ Active Users
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.1 + i * 0.04, type: "spring" }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                        </motion.div>
                      ))}
                      <span className={cn(
                        "text-xs font-semibold ml-1",
                        theme === 'dark' ? "text-slate-400" : "text-slate-600"
                      )}>
                        4.9/5 Rating
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* DESKTOP ONLY: Access Panel */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="hidden lg:block w-full max-w-md mx-auto order-2"
            >
              <AccessPanel 
                theme={theme}
                isLoading={isLoading}
                hoveredOption={hoveredOption}
                setHoveredOption={setHoveredOption}
                handleAction={handleAction}
              />
            </motion.div>
          </div>

          {/* Enhanced Stats Section */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className={cn(
              "mt-12 sm:mt-16 lg:mt-24 p-6 sm:p-8 lg:p-12 rounded-3xl border-2 backdrop-blur-sm",
              theme === 'dark'
                ? "bg-slate-800/40 border-slate-700/60 shadow-2xl shadow-slate-900/30"
                : "bg-white/70 border-slate-200/60 shadow-2xl shadow-slate-200/50"
            )}
            aria-label="Platform statistics"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
              {[
                { 
                  value: "50K+", 
                  label: "Active Patients", 
                  sublabel: "Growing daily", 
                  icon: Users, 
                  color: "blue",
                  description: "Over 50,000 active patients trust our platform"
                },
                { 
                  value: "98.7%", 
                  label: "Satisfaction Rate", 
                  sublabel: "Verified reviews", 
                  icon: Heart, 
                  color: "emerald",
                  description: "98.7% patient satisfaction rate from verified reviews"
                },
                { 
                  value: "24/7", 
                  label: "AI Monitoring", 
                  sublabel: "Real-time alerts", 
                  icon: Activity, 
                  color: "purple",
                  description: "24/7 AI-powered health monitoring with real-time alerts"
                },
                { 
                  value: "47%", 
                  label: "Efficiency Boost", 
                  sublabel: "Average improvement", 
                  icon: TrendingUp, 
                  color: "orange",
                  description: "47% average efficiency improvement for healthcare facilities"
                }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + index * 0.12, type: "spring", stiffness: 100 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="text-center group cursor-pointer"
                  role="figure"
                  aria-label={stat.description}
                  title={stat.description}
                >
                  <motion.div 
                    whileHover={{ rotate: 360, scale: 1.15 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    className={cn(
                      "inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-xl",
                      stat.color === 'blue' && "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/40",
                      stat.color === 'emerald' && "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/40",
                      stat.color === 'purple' && "bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/40",
                      stat.color === 'orange' && "bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/40"
                    )}
                    aria-hidden="true"
                  >
                    <stat.icon className="w-7 h-7 text-white drop-shadow-md" />
                  </motion.div>
                  <motion.div 
                    className={cn(
                      "text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-2 tracking-tight group-hover:scale-110 transition-transform",
                      theme === 'dark' ? "text-white" : "text-slate-900"
                    )}
                  >
                    {stat.value}
                  </motion.div>
                  <div className={cn(
                    "text-sm font-bold mb-1 tracking-tight",
                    theme === 'dark' ? "text-slate-300" : "text-slate-700"
                  )}>
                    {stat.label}
                  </div>
                  <div className={cn(
                    "text-xs font-medium",
                    theme === 'dark' ? "text-slate-500" : "text-slate-500"
                  )}>
                    {stat.sublabel}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </main>

      {/* Premium Footer */}
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
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center shadow-lg ring-2 ring-white/10">
                  <Heart className="w-5 h-5 text-white drop-shadow-sm" aria-hidden="true" />
                </div>
                <span className={cn(
                  "text-lg font-bold tracking-tight",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>
                  CustoCare AI
                </span>
              </div>
              <p className={cn(
                "text-sm max-w-md leading-relaxed",
                theme === 'dark' ? "text-slate-400" : "text-slate-600"
              )}>
                Delivering measurable healthcare outcomes through 
                AI-powered intelligence and compassionate innovation.
              </p>
            </div>
            
            <nav className="flex flex-wrap items-center justify-center gap-6" aria-label="Footer navigation">
              {['Privacy Policy', 'Terms of Service', 'HIPAA Compliance', 'Contact Us'].map((item) => (
                <motion.a
                  key={item}
                  whileHover={{ y: -2, scale: 1.03 }}
                  href="#"
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    theme === 'dark' 
                      ? "text-slate-400 hover:text-blue-400" 
                      : "text-slate-600 hover:text-blue-600"
                  )}
                >
                  {item}
                </motion.a>
              ))}
            </nav>
          </div>
          
          <div className={cn(
            "pt-6 border-t-2 text-center text-xs leading-relaxed",
            theme === 'dark' 
              ? "border-slate-800 text-slate-500" 
              : "border-slate-200 text-slate-500"
          )}>
            <p>
              © 2024 CustoCare AI Health Platform. HIPAA-compliant healthcare data protection. 
              For authorized healthcare use only.
            </p>
          </div>
        </div>
      </motion.footer>

      {/* Premium Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            role="status"
            aria-live="assertive"
            aria-label="Loading"
            className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              className={cn(
                "p-10 rounded-3xl flex flex-col items-center gap-6 border-2 shadow-2xl max-w-sm mx-4",
                theme === 'dark' 
                  ? "bg-slate-900/95 border-slate-700" 
                  : "bg-white/95 border-slate-200"
              )}
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  className={cn(
                    "w-20 h-20 border-[4px] rounded-full",
                    theme === 'dark' 
                      ? "border-blue-500/30 border-t-blue-500 shadow-lg shadow-blue-500/20" 
                      : "border-blue-500/30 border-t-blue-600 shadow-lg shadow-blue-500/30"
                  )}
                  aria-hidden="true"
                />
                <motion.div
                  animate={{ 
                    scale: [1, 1.25, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <Heart className="w-9 h-9 text-emerald-500 drop-shadow-lg" aria-hidden="true" />
                </motion.div>
              </div>
              <div className="text-center space-y-3">
                <motion.p 
                  className={cn(
                    "font-bold text-xl tracking-tight",
                    theme === 'dark' ? "text-white" : "text-slate-900"
                  )}
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                >
                  {isLoading === 'login' 
                    ? 'Accessing Your Dashboard' 
                    : 'Preparing Your Healthcare Journey'}
                </motion.p>
                <p className={cn(
                  "text-sm font-medium",
                  theme === 'dark' ? "text-slate-400" : "text-slate-600"
                )}>
                  Establishing secure connection...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ==========================================================================
   ACCESS PANEL COMPONENT
   ========================================================================== */
interface AccessPanelProps {
  theme: string;
  isLoading: string | null;
  hoveredOption: string | null;
  setHoveredOption: (option: string | null) => void;
  handleAction: (action: 'login' | 'signup') => Promise<void>;
}

const AccessPanel: React.FC<AccessPanelProps> = ({
  theme,
  isLoading,
  hoveredOption,
  setHoveredOption,
  handleAction
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative"
    >
      {/* Floating Image Element */}
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className={cn(
          "absolute -top-8 -right-8 w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-4 shadow-2xl z-10",
          theme === 'dark' ? "border-slate-800 shadow-slate-900/40" : "border-white shadow-slate-200/60"
        )}
        role="img"
        aria-label="Healthcare professional consulting"
      >
        <img
          src={IMAGES.doctorPatient}
          alt="Healthcare professional consulting with patient"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </motion.div>

      {/* Main Card */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "rounded-3xl p-7 sm:p-9 lg:p-11 backdrop-blur-xl border-2 shadow-2xl",
          theme === 'dark'
            ? "bg-slate-800/85 border-slate-700/60 shadow-slate-900/40"
            : "bg-white/90 border-slate-200/60 shadow-slate-200/60"
        )}
      >
        {/* Welcome Header */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ease: "easeOut" }}
          className="text-center mb-9"
        >
          <motion.div 
            whileHover={{ scale: 1.12, rotate: 360 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="inline-flex items-center justify-center w-18 h-18 rounded-2xl bg-gradient-to-br from-blue-500/15 to-emerald-500/15 mb-6 border-2 border-blue-500/30 shadow-lg"
            aria-hidden="true"
          >
            <Heart className="w-9 h-9 text-blue-600 dark:text-blue-400 drop-shadow-sm" />
          </motion.div>
          <h2 className={cn(
            "text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 tracking-tight",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}>
            Welcome to CustoCare AI
          </h2>
          <p className={cn(
            "text-sm sm:text-base font-medium",
            theme === 'dark' ? "text-slate-400" : "text-slate-600"
          )}>
            Choose how you'd like to proceed
          </p>
        </motion.div>

        {/* Access Options */}
        <div className="space-y-4" role="group" aria-label="Account access options">
          {/* Create Account - Primary CTA */}
          <motion.button
            onClick={() => handleAction('signup')}
            disabled={isLoading !== null}
            onMouseEnter={() => setHoveredOption('signup')}
            onMouseLeave={() => setHoveredOption(null)}
            onFocus={() => setHoveredOption('signup')}
            onBlur={() => setHoveredOption(null)}
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full flex items-center justify-between p-6 sm:p-7 rounded-2xl transition-all duration-300 group relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-4",
              "shadow-xl hover:shadow-2xl",
              theme === 'dark'
                ? "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 focus:ring-blue-500/50"
                : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 focus:ring-blue-400/50"
            )}
            aria-label="Create new account - Register as patient, medical professional, or health facility"
          >
            {/* Animated shimmer effect */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
              }}
              animate={hoveredOption === 'signup' ? { x: ['-100%', '200%'] } : {}}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            />
            
            <div className="flex items-center gap-4 relative z-10">
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.7 }}
                className="w-16 h-16 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg"
                aria-hidden="true"
              >
                <UserCheck className="w-8 h-8 text-white drop-shadow-sm" />
              </motion.div>
              <div className="text-left">
                <h3 className="text-lg sm:text-xl font-extrabold text-white mb-1 tracking-tight">
                  Begin Your Journey
                </h3>
                <p className="text-sm text-white/95 leading-snug font-medium">
                  Register as Patient, Medical Professional or Health Facility
                </p>
              </div>
            </div>
            <motion.div
              animate={hoveredOption === 'signup' ? { x: 6 } : { x: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              aria-hidden="true"
            >
              <ArrowRight className="w-7 h-7 text-white shrink-0 drop-shadow-sm" />
            </motion.div>
          </motion.button>

          {/* Access Existing Account - Secondary */}
          <motion.button
            onClick={() => handleAction('login')}
            disabled={isLoading !== null}
            onMouseEnter={() => setHoveredOption('login')}
            onMouseLeave={() => setHoveredOption(null)}
            onFocus={() => setHoveredOption('login')}
            onBlur={() => setHoveredOption(null)}
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full flex items-center justify-between p-6 sm:p-7 rounded-2xl border-2 transition-all duration-300 group disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-4",
              "hover:shadow-2xl",
              theme === 'dark'
                ? "bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-blue-500/60 focus:ring-blue-500/50"
                : "bg-white/60 border-slate-300 hover:bg-white hover:border-blue-500/60 focus:ring-blue-400/50"
            )}
            aria-label="Access existing account - Continue to your dashboard"
          >
            <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.7 }}
                className={cn(
                  "w-16 h-16 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                  theme === 'dark' ? "bg-blue-500/25" : "bg-blue-100"
                )}
                aria-hidden="true"
              >
                <Shield className={cn(
                  "w-8 h-8 drop-shadow-sm",
                  theme === 'dark' ? "text-blue-400" : "text-blue-600"
                )} />
              </motion.div>
              <div className="text-left">
                <h3 className={cn(
                  "text-lg sm:text-xl font-extrabold mb-1 tracking-tight",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>
                  Access Your Account
                </h3>
                <p className={cn(
                  "text-sm leading-snug font-medium",
                  theme === 'dark' ? "text-slate-400" : "text-slate-600"
                )}>
                  Continue to your dashboard
                </p>
              </div>
            </div>
            <motion.div
              animate={hoveredOption === 'login' ? { x: 6 } : { x: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              aria-hidden="true"
            >
              <ChevronRight className={cn(
                "w-7 h-7 shrink-0",
                theme === 'dark' ? "text-slate-400" : "text-slate-500"
              )} />
            </motion.div>
          </motion.button>
        </div>

        {/* Security Assurance */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className={cn(
            "mt-9 pt-8 border-t-2",
            theme === 'dark' ? "border-slate-700" : "border-slate-200"
          )}
        >
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            >
              <Lock className="w-5 h-5 text-emerald-500 drop-shadow-sm" />
            </motion.div>
            <span className={cn(
              "text-sm font-extrabold tracking-tight",
              theme === 'dark' ? "text-slate-200" : "text-slate-800"
            )}>
              Enterprise-Grade Security
            </span>
          </div>
          <p className={cn(
            "text-center text-xs leading-relaxed max-w-sm mx-auto font-medium",
            theme === 'dark' ? "text-slate-500" : "text-slate-600"
          )}>
            Your healthcare data is protected with 256-bit encryption, HIPAA compliance, 
            and ISO 27001 certification. Privacy guaranteed.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Landing;
