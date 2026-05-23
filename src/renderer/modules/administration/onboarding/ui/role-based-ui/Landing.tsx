import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Stethoscope,
  CheckCircle2,
  Building,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { cn } from '../../../../../shared/types/cn';
import { containerVariants, itemVariants, pulseGlowVariants, cardHoverVariants } from '../../../../../shared/components/animations/motionVariants';
import TrustBadges from '../shared/TrustBadges';
import { LandingHeader } from './LandingHeader';
import { AccessPanel } from './LandingAccessPanel';
import { LandingStats } from './LandingStats';
import { LandingFooter } from './LandingFooter';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const theme = useAppSelector((state) => state.ui.theme);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

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
      console.log(error);
      setIsLoading(null);
    }
  };

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

      <LandingHeader theme={theme} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 lg:py-6 relative z-10">
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left Column - Hero Content */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center lg:text-left space-y-8 order-2 lg:order-1"
            >
              <div className="space-y-3 lg:space-y-3">
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
                      Built for Continuous Care & Clinical Excellence.
                    </span>
                  </motion.div>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                  variants={itemVariants}
                  className={cn(
                    "text-[2.5rem] sm:text-4xl lg:text-5xl xl:text-7xl font-extrabold leading-[1.08] tracking-tight",
                    theme === 'dark' ? "text-white" : "text-slate-900"
                  )}
                >
                  Healthcare Intelligence,{' '}
                  <span className="relative inline-block">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-600">
                      Continuous Care.
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
                  Powering Continuity of Care and Clinical Excellence in Healthcare.
                </motion.p>
              </div>

              {/* MOBILE ONLY: Access Panel After Description */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="lg:hidden pt-2"
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
                className="hidden lg:grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2"
              >
                {[
                  {
                    icon: Stethoscope,
                    title: "For Care Teams",
                    description: "Stop toggling between systems. One login gives doctors, nurses, and pharmacists unified access to clinical, pharmacy, lab, and billing.",
                    gradient: "from-blue-500 to-blue-600",
                    color: "blue",
                  },
                  {
                    icon: UserCheck,
                    title: "For Patients",
                    description: "No more repeating your history. One centralized record follows you across every department and facility — every visit.",
                    gradient: "from-emerald-500 to-emerald-600",
                    color: "emerald",
                  },
                  {
                    icon: Building,
                    title: "For Health Facilities",
                    description: "Single facility or 50 locations. Digital queues cut wait times. Integrated billing stops revenue leakage. One platform, full visibility.",
                    gradient: "from-purple-500 to-purple-600",
                    color: "purple",
                  }
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover="hover"
                    initial="rest"
                    animate="rest"
                    className={cn(
                      "group relative p-5 rounded-2xl border transition-all duration-400 cursor-pointer overflow-hidden",
                      "min-h-[220px]",
                      benefit.color === 'blue' && "border-blue-100/30 dark:border-blue-900/20",
                      benefit.color === 'emerald' && "border-emerald-100/30 dark:border-emerald-900/20",
                      benefit.color === 'purple' && "border-purple-100/30 dark:border-purple-900/20",
                      theme === 'dark'
                        ? "bg-gradient-to-br from-slate-800/50 via-slate-800/40 to-slate-900/50 hover:from-slate-800/70 hover:via-slate-800/60 hover:to-slate-900/70"
                        : "bg-white hover:bg-white",
                      benefit.color === 'blue' && "hover:border-blue-300 dark:hover:border-blue-500/50",
                      benefit.color === 'emerald' && "hover:border-emerald-300 dark:hover:border-emerald-500/50",
                      benefit.color === 'purple' && "hover:border-purple-300 dark:hover:border-purple-500/50",
                      benefit.color === 'blue' && "hover:ring-2 hover:ring-blue-100/60 hover:ring-offset-2 dark:hover:ring-4 dark:hover:ring-blue-900/30 dark:hover:ring-offset-slate-900",
                      benefit.color === 'emerald' && "hover:ring-2 hover:ring-emerald-100/60 hover:ring-offset-2 dark:hover:ring-4 dark:hover:ring-emerald-900/30 dark:hover:ring-offset-slate-900",
                      benefit.color === 'purple' && "hover:ring-2 hover:ring-purple-100/60 hover:ring-offset-2 dark:hover:ring-4 dark:hover:ring-purple-900/30 dark:hover:ring-offset-slate-900",
                      theme === 'dark'
                        ? "shadow-lg hover:shadow-xl shadow-slate-900/40 hover:shadow-slate-800/60"
                        : "shadow-sm hover:shadow-md shadow-slate-200/40 hover:shadow-slate-300/50"
                    )}
                    role="article"
                    aria-labelledby={`benefit-${index}-title`}
                  >
                    {theme === 'dark' && (
                      <div className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl",
                        benefit.color === 'blue' && "bg-blue-500/5",
                        benefit.color === 'emerald' && "bg-emerald-500/5",
                        benefit.color === 'purple' && "bg-purple-500/5"
                      )} />
                    )}

                    {theme === 'dark' && (
                      <div className="absolute inset-0 rounded-2xl pointer-events-none shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.05)]" />
                    )}

                    <motion.div
                      variants={cardHoverVariants}
                      className={cn(
                        "inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 bg-gradient-to-br shadow relative z-10",
                        benefit.gradient,
                        theme === 'dark'
                          ? "shadow-md group-hover:shadow-lg"
                          : "shadow-sm group-hover:shadow",
                        benefit.color === 'blue' && "group-hover:shadow-blue-200/30 dark:group-hover:shadow-blue-900/20",
                        benefit.color === 'emerald' && "group-hover:shadow-emerald-200/30 dark:group-hover:shadow-emerald-900/20",
                        benefit.color === 'purple' && "group-hover:shadow-purple-200/30 dark:group-hover:shadow-purple-900/20"
                      )}
                      aria-hidden="true"
                    >
                      <benefit.icon className="w-5 h-5 text-white drop-shadow-sm" />
                    </motion.div>

                    <h3
                      id={`benefit-${index}-title`}
                      className={cn(
                        "font-bold mb-2 text-base sm:text-lg relative z-10 transition-colors duration-300",
                        theme === 'dark'
                          ? cn(
                              benefit.color === 'blue' && "group-hover:text-blue-300",
                              benefit.color === 'emerald' && "group-hover:text-emerald-300",
                              benefit.color === 'purple' && "group-hover:text-purple-300",
                              "text-white"
                            )
                          : cn(
                              benefit.color === 'blue' && "group-hover:text-blue-800",
                              benefit.color === 'emerald' && "group-hover:text-emerald-800",
                              benefit.color === 'purple' && "group-hover:text-purple-800",
                              "text-slate-900"
                            )
                      )}
                    >
                      {benefit.title}
                    </h3>

                    <p className={cn(
                      "text-sm leading-relaxed relative z-10 transition-colors duration-300",
                      theme === 'dark'
                        ? "text-slate-400 group-hover:text-slate-300"
                        : "text-slate-600 group-hover:text-slate-700"
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
                  <div
                    className="flex -space-x-2.5"
                    role="img"
                    aria-label="Platform trust indicators"
                  >
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
                    <div
                      className={cn(
                        "text-sm font-bold tracking-tight",
                        theme === "dark" ? "text-white" : "text-slate-900"
                      )}
                    >
                      Built for Healthcare Teams
                    </div>

                    <div className="flex items-center gap-1.5">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.1 + i * 0.04, type: "spring" }}
                        >
                          <CheckCircle2
                            className="w-3.5 h-3.5 text-emerald-500"
                            aria-hidden="true"
                          />
                        </motion.div>
                      ))}

                      <span
                        className={cn(
                          "text-xs font-semibold ml-1",
                          theme === "dark" ? "text-slate-400" : "text-slate-600"
                        )}
                      >
                        Secure • Intelligent • Scalable
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

          <LandingStats theme={theme} />
        </div>
      </main>

      <LandingFooter theme={theme} />

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
              <div className="text-center space-y-2">
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

export default Landing;
