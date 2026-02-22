/**
 * ============================================================================
 * WELCOME SECTION COMPONENT
 * ============================================================================
 * Time-based greeting with context-aware subtitle
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../../../../shared/types/cn';
interface WelcomeSectionProps {
  userName?: string;
  isStaffWithFacility: boolean;
  isStaffWithoutFacility: boolean;
  isPatient: boolean;
  isPatientOnly: boolean;
  theme: 'light' | 'dark';
}

interface Greeting {
  text: string;
  emoji: string;
}

const getTimeGreeting = (): Greeting => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return { text: 'Good morning', emoji: '👋' };
  }
  if (hour < 18) {
    return { text: 'Good afternoon', emoji: '🤝' };
  }
  return { text: 'Good evening', emoji: '🙌' };
};

const capitalizeName = (name?: string): string => {
  if (!name) return 'User';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  userName,
  isStaffWithFacility,
  isStaffWithoutFacility,
  isPatient,
  isPatientOnly,
  theme,
}) => {
  const { text, emoji } = useMemo(() => getTimeGreeting(), []);

  const subtitle = useMemo(() => {
    if (isStaffWithFacility && isPatient) {
      return 'Select a professional workspace or access your personal patient portal.';
    }
    if (isStaffWithFacility) {
      return 'Please select a workspace to continue.';
    }
    if (isStaffWithoutFacility) {
      return 'Manage your invitations, profile, and register new facilities.';
    }
    if (isPatientOnly) {
      return 'Access your personal health portal below.';
    }
    return 'Please complete your account setup to get started.';
  }, [isStaffWithFacility, isStaffWithoutFacility, isPatient, isPatientOnly]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-2 sm:mb-4"
    >
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 flex flex-wrap items-center gap-2">
        <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
          {text}
        </span>
        <span className="text-emerald-500">{capitalizeName(userName)}</span>
        <span className="text-xl sm:text-2xl leading-none">{emoji}</span>
      </h1>

      <p
        className={cn(
          'text-sm sm:text-base',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}
      >
        {subtitle}
      </p>
    </motion.div>
  );
};
