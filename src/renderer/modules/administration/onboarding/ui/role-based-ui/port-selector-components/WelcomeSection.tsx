/**
 * ============================================================================
 * WELCOME SECTION COMPONENT
 * ============================================================================
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Globe, Sun, Sunrise, Sunset } from 'lucide-react';
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
  // Get time-based greeting
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return { text: 'Good Morning', emoji: '☀️', icon: Sunrise };
    }
    if (hour >= 12 && hour < 17) {
      return { text: 'Good Afternoon', emoji: '🌤️', icon: Sun };
    }
    return { text: 'Good Evening', emoji: '🌙', icon: Sunset };
  }, []);

  const getWelcomeMessage = () => {
    if (isStaffWithFacility) {
      return 'You have access to professional workspaces. Select a facility to continue.';
    }
    if (isStaffWithoutFacility) {
      return 'You are registered as medical staff. Access your dashboard to manage invitations.';
    }
    if (isPatient) {
      return 'Your patient portal is active. View your health records and appointments.';
    }
    if (hasGlobalCapabilities) {
      return 'You have platform capabilities. Select a workspace to continue.';
    }
    return 'Complete your profile to access healthcare services.';
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
            <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
          ) : (
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1
            className={cn(
              'text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}
          >
            <span>{timeGreeting.text}, {userName || 'User'}</span>
            <span className="text-2xl">{timeGreeting.emoji}</span>
          </h1>
          <p
            className={cn(
              'text-xs sm:text-sm',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}
          >
            {getWelcomeMessage()}
          </p>
        </div>
      </div>
    </motion.div>
  );
};