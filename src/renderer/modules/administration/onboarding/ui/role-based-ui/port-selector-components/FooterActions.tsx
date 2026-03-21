/**
 * ============================================================================
 * FOOTER ACTIONS COMPONENT
 * ============================================================================
 * Registration links and copyright footer
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Stethoscope } from 'lucide-react';
import { cn } from '../../../../../../shared/types/cn';
interface FooterActionsProps {
  isPatient: boolean;
  isStaff: boolean;
  theme: 'light' | 'dark';
  onRegisterFacility: () => void;
  onActivatePatientPortal: () => void;
  onRegisterMedicalStaff: () => void;
}

export const FooterActions: React.FC<FooterActionsProps> = ({
  // isPatient,
  isStaff,
  theme,
  onRegisterFacility,
  // onActivatePatientPortal,
  onRegisterMedicalStaff,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pb-6 sm:pb-8"
    >
      {/* Action Buttons */}
      <div className="flex flex-col xs:flex-row flex-wrap items-stretch xs:items-center gap-3 sm:gap-4 flex-1">
        <button
          onClick={onRegisterFacility}
          className={cn(
            'flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium cursor-pointer',
            'transition-all duration-200',
            'hover:scale-105 active:scale-95',
            theme === 'dark'
              ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          )}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Register New Facility</span>
        </button>

        {/* {!isPatient && (
          <button
            onClick={onActivatePatientPortal}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium cursor-pointer',
              'transition-all duration-200',
              'hover:scale-105 active:scale-95',
              theme === 'dark'
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <Heart className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Activate Patient Portal</span>
          </button>
        )} */}

        {!isStaff && (
          <button
            onClick={onRegisterMedicalStaff}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium cursor-pointer',
              'transition-all duration-200',
              'hover:scale-105 active:scale-95',
              theme === 'dark'
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <Stethoscope className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Register as Medical Staff</span>
          </button>
        )}
      </div>

      {/* Copyright */}
      <div className="text-xs text-center sm:text-left text-gray-500 dark:text-gray-600 sm:ml-auto">
        © {new Date().getFullYear()} Custocare. All rights reserved.
      </div>
    </motion.div>
  );
};
