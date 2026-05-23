/**
 * ============================================================================
 * WELCOME SECTION COMPONENT
 * ============================================================================
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Globe, Sun, Sunrise, Sunset, Heart, Briefcase } from 'lucide-react';
import { cn } from '../../../../../../shared/types/cn';

interface WelcomeSectionProps {
  userName?: string;
  isStaffWithFacility: boolean;
  isStaffWithoutFacility: boolean;
  isPatient: boolean;
  isPatientOnly: boolean;
  hasGlobalCapabilities: boolean;
  theme: 'light' | 'dark';
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  userName,
  isStaffWithFacility,
  isStaffWithoutFacility,
  isPatient,
  hasGlobalCapabilities,
  theme,
}) => {
  // Get time-based greeting using browser local time
  const timeGreeting = (() => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return { text: 'Good Morning', emoji: '☀️', icon: Sunrise };
    }
    if (hour >= 12 && hour < 17) {
      return { text: 'Good Afternoon', emoji: '🌤️', icon: Sun };
    }
    return { text: 'Good Evening', emoji: '🌙', icon: Sunset };
  })();

  const getWelcomeMessage = () => {
    if (isStaffWithFacility) {
      return 'Your facilities are ready. Pick one to start your day.';
    }
    if (isStaffWithoutFacility) {
      return 'You\'re on the team. Check your invitations and join a facility.';
    }
    if (isPatient) {
      return 'Your health records are waiting. See results, track appointments, stay informed.';
    }
    if (hasGlobalCapabilities) {
      return 'Platform leadership access. Choose where you want to go.';
    }
    return 'Complete your profile to unlock healthcare services.';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 sm:mb-8"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={cn(
            'p-2 sm:p-3 rounded-xl',
            'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
            'border border-blue-500/20'
          )}
        >
          {hasGlobalCapabilities ? (
            <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          ) : isStaffWithFacility || isStaffWithoutFacility ? (
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          ) : isPatient ? (
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          ) : (
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1
            className={cn(
              'text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2 flex-wrap',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}
          >
            <span>{timeGreeting.text}, {userName || 'there'} 👋</span>
          </h1>
          <p
            className={cn(
              'text-sm sm:text-base leading-relaxed',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            )}
          >
            {getWelcomeMessage()}
          </p>
        </div>
      </div>
    </motion.div>
  );
};