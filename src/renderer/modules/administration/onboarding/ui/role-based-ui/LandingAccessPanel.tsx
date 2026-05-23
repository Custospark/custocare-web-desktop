import React from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Shield,
  UserCheck,
  ChevronRight,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../../../../../shared/types/cn';
import { floatingVariants } from '../../../../../shared/components/animations/motionVariants';
import { BRAND_NAME_LCASE } from '../../../../../shared/utils/BrandName';
import { IMAGES } from './landingImages';

export interface AccessPanelProps {
  theme: string;
  isLoading: string | null;
  hoveredOption: string | null;
  setHoveredOption: (option: string | null) => void;
  handleAction: (action: 'login' | 'signup') => Promise<void>;
}

export const AccessPanel: React.FC<AccessPanelProps> = ({
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
          className="w-full h-full object-cover object-top"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </motion.div>

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
            Welcome to {BRAND_NAME_LCASE}
          </h2>
          <p className={cn(
            "text-sm sm:text-base font-medium",
            theme === 'dark' ? "text-slate-400" : "text-slate-600"
          )}>
            Choose how you'd like to proceed
          </p>
        </motion.div>

        <div className="space-y-4" role="group" aria-label="Account access options">
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
              "w-full flex items-center justify-between cursor-pointer rounded-xl sm:rounded-2xl transition-all duration-300 group relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-4",
              "shadow-xl hover:shadow-2xl",
              "p-3 sm:p-4 md:p-5 lg:p-6",
              theme === 'dark'
                ? "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 focus:ring-blue-500/50"
                : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 focus:ring-blue-400/50"
            )}
            aria-label="Create new account - Register as patient, medical professional, or health facility"
          >
            <motion.div
              className="absolute inset-0 opacity-0 cursor-pointer group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
              }}
              animate={hoveredOption === 'signup' ? { x: ['-100%', '200%'] } : {}}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            />

            <div className="flex items-center gap-2 sm:gap-3 relative z-10">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.7 }}
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg"
                aria-hidden="true"
              >
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white drop-shadow-sm" />
              </motion.div>
              <div className="text-left">
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-extrabold text-white mb-0.5 tracking-tight">
                  Begin Your Journey
                </h3>
                <p className="text-xs sm:text-sm text-white/95 leading-snug font-medium hidden lg:block">
                  Register as Patient, Medical Professional or Health Facility
                </p>
                <p className="text-xs sm:text-sm text-white/95 leading-snug font-medium lg:hidden">
                  Create Account
                </p>
              </div>
            </div>
            <motion.div
              animate={hoveredOption === 'signup' ? { x: 6 } : { x: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              aria-hidden="true"
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white shrink-0 drop-shadow-sm" />
            </motion.div>
          </motion.button>

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
              "w-full flex items-center justify-between cursor-pointer rounded-xl sm:rounded-2xl border-2 transition-all duration-300 group disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-4",
              "hover:shadow-2xl",
              "p-3 sm:p-4 md:p-5 lg:p-6",
              theme === 'dark'
                ? "bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-blue-500/60 focus:ring-blue-500/50"
                : "bg-white/60 border-slate-300 hover:bg-white hover:border-blue-500/60 focus:ring-blue-400/50"
            )}
            aria-label="Access existing account - Continue to your dashboard"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.7 }}
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                  theme === 'dark' ? "bg-blue-500/25" : "bg-blue-100"
                )}
                aria-hidden="true"
              >
                <Shield className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 drop-shadow-sm",
                  theme === 'dark' ? "text-blue-400" : "text-blue-600"
                )} />
              </motion.div>
              <div className="text-left">
                <h3 className={cn(
                  "text-sm sm:text-base md:text-lg lg:text-xl font-extrabold mb-0.5 tracking-tight",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>
                  Access Your Account
                </h3>
                <p className={cn(
                  "text-xs sm:text-sm leading-snug font-medium hidden md:block",
                  theme === 'dark' ? "text-slate-400" : "text-slate-600"
                )}>
                  Continue to your dashboard
                </p>
                <p className={cn(
                  "text-xs sm:text-sm leading-snug font-medium md:hidden",
                  theme === 'dark' ? "text-slate-400" : "text-slate-600"
                )}>
                  Sign In
                </p>
              </div>
            </div>
            <motion.div
              animate={hoveredOption === 'login' ? { x: 6 } : { x: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              aria-hidden="true"
            >
              <ChevronRight className={cn(
                "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 shrink-0",
                theme === 'dark' ? "text-slate-400" : "text-slate-500"
              )} />
            </motion.div>
          </motion.button>
        </div>

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
            and ISO 27001 Compliant. Privacy guaranteed.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
