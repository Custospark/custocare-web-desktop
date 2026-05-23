/**
 * ============================================================================
 * PERSONAL ACCESS SECTION COMPONENT
 * ============================================================================
 * Patient portal access and activation options
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Heart,
  CheckCircle,
  Stethoscope,
  FileText,
  Calendar,
  Activity,
} from 'lucide-react';
import { cn } from '../../../../../../shared/types/cn';
import { WorkspaceCard } from './WorkspaceCard';

interface PersonalAccessSectionProps {
  isPatient: boolean;
  isStaff: boolean;
  patientUuid?: string;
  theme: 'light' | 'dark';
  onPatientPortal: () => void;
  onActivatePatientPortal: () => void;
  onRegisterMedicalStaff: () => void;
}

export const PersonalAccessSection: React.FC<PersonalAccessSectionProps> = ({
  isPatient,
  isStaff,
  patientUuid,
  theme,
  onPatientPortal,
  onActivatePatientPortal,
  onRegisterMedicalStaff,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mb-8 sm:mb-12"
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div
          className={cn(
            'w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center',
            'bg-purple-500/10'
          )}
        >
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h2
          className={cn(
            'text-lg sm:text-xl font-bold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}
        >
          Your Health
        </h2>
      </div>

      {/* Patient Portal Active */}
      {isPatient ? (
        <WorkspaceCard
          id="patient-portal"
          title="Your Health Portal"
          subtitle="Your records, always with you"
          description="See your test results as soon as they're ready. Track appointments. Review your history. Everything in one place."
          icon={Heart}
          iconGradient="bg-linear-to-br from-purple-500 to-pink-500"
          buttonText="Go to My Health"
          buttonGradient="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          features={[
            { icon: FileText, label: 'Test Results' },
            { icon: Calendar, label: 'Appointments' },
            { icon: Activity, label: 'Health Records' },
          ]}
          metadata={
            patientUuid
              ? [{ label: 'Patient Number', value: patientUuid }]
              : []
          }
          theme={theme}
          onClick={onPatientPortal}
        />
      ) : (
        /* Patient Portal Activation */
        <div
          className={cn(
            'rounded-xl border p-6 sm:p-8',
            'shadow-sm',
            theme === 'dark'
              ? 'bg-gray-900 border-gray-800'
              : 'bg-white border-gray-200'
          )}
        >
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div
              className={cn(
                'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0',
                'bg-purple-500/10'
              )}
            >
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  'text-base sm:text-lg font-bold mb-2',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}
              >
                Take Control of Your Health
              </h3>
              <p
                className={cn(
                  'text-xs sm:text-sm mb-4',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                See your results. Know your appointments. Own your story. Activate your patient portal — it takes less than a minute.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onActivatePatientPortal}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium',
                    'cursor-pointer transition-all duration-200',
                    'bg-linear-to-r from-purple-600 to-pink-600 text-white',
                    'hover:from-purple-700 hover:to-pink-700',
                    'hover:scale-105 active:scale-95',
                    'w-full sm:w-auto'
                  )}
                >
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Activate Portal</span>
                </button>

                {!isStaff && (
                  <button
                    type="button"
                    onClick={onRegisterMedicalStaff}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium',
                      'cursor-pointer transition-all duration-200',
                      'bg-linear-to-r from-blue-600 to-cyan-600 text-white',
                      'hover:from-blue-700 hover:to-cyan-700',
                      'hover:scale-105 active:scale-95',
                      'w-full sm:w-auto'
                    )}
                  >
                    <Stethoscope className="w-4 h-4 shrink-0" />
                    <span>Join as Medical Staff</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};