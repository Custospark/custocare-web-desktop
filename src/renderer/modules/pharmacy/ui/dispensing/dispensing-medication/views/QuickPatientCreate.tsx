import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Pill, Info, Sparkles, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

import PatientCreate from './PatientCreate';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { PatientSearchResult } from '../../../../api/dispensing/patient-search/usePatientTypes';
import { PHARMACY_ROUTES } from '../../../../../../app/routes/routeConstants';

interface QuickPatientCreateProps {
  theme: 'light' | 'dark';
  className?: string;
}

const QuickPatientCreate: React.FC<QuickPatientCreateProps> = ({ theme, className }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handleSuccess = useCallback(
    (patient: PatientSearchResult) => {
      // Handle immediate success (e.g., analytics, logging)
      console.log('Patient created successfully for pharmacy:', patient.patient_number);
    },
    []
  );

  const handleProceed = useCallback(
    (patient: PatientSearchResult) => {
      // Navigate to prescription search after user clicks "Continue" in modal
      navigate(`${PHARMACY_ROUTES.PRESCRIPTIONS_SEARCH}?patientId=${patient.patient_number}`, {
        replace: true,
      });
    },
    [navigate]
  );

  const handleCancel = useCallback(() => {
    navigate(PHARMACY_ROUTES.PATIENTS_SEARCH, { replace: true });
  }, [navigate]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'min-h-screen w-full',
        isDark ? 'bg-gray-900' : 'bg-gray-50',
        className
      )}
    >
      {/* Full-width header with gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'w-full border-b-2 transition-all duration-300',
          isDark 
            ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-blue-500/30' 
            : 'bg-gradient-to-r from-white to-blue-50/50 border-blue-200'
        )}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            {/* Back button */}
            <motion.button
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              className={cn(
                'p-2.5 rounded-xl transition-all duration-200',
                'border-2 flex items-center justify-center',
                isDark
                  ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
                'cursor-pointer'
              )}
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  'p-2.5 rounded-xl',
                  isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                )}>
                  <Pill className={cn(
                    'w-6 h-6',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )} />
                </div>
                <h1 className={cn(
                  'text-3xl font-bold',
                  isDark ? 'text-white' : 'text-gray-900'
                )}>
                  Pharmacy Patient Registration
                </h1>
              </div>
              <p className={cn(
                'text-base ml-14',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                Register a new patient to proceed with medication dispensing
              </p>
            </div>

            {/* Decorative element */}
            <div className={cn(
              'hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl border-2',
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}>
              <Sparkles className={cn(
                'w-4 h-4',
                isDark ? 'text-yellow-400' : 'text-yellow-500'
              )} />
              <span className={cn(
                'text-sm font-medium',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}>
                Quick Registration
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content - PatientCreate now takes full width */}
      <div className="w-full">
        <PatientCreate 
          theme={theme} 
          title="" // Title removed as we have header above
          subtitle="" // Subtitle removed as we have description above
          onSuccess={handleSuccess} 
          onProceed={handleProceed}
          onCancel={handleCancel}
          className="w-full" 
        />
      </div>

      {/* Full-width info banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full border-t-2 mt-8"
        style={{
          borderColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className={cn(
              'relative overflow-hidden rounded-xl border-2 p-6',
              isDark 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20' 
                : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20',
              'transition-all duration-300 group cursor-default'
            )}
          >
            {/* Background decoration */}
            <div className={cn(
              'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity',
              isDark ? 'bg-blue-500/10 group-hover:opacity-100' : 'bg-blue-500/5 group-hover:opacity-100',
              'opacity-0'
            )} />

            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className={cn(
                  'p-3 rounded-xl transition-all duration-300',
                  isDark 
                    ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110' 
                    : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
                )}>
                  <Info className={cn(
                    'w-5 h-5',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )} />
                </div>
                
                <div className="flex-1">
                  <h3 className={cn(
                    'text-lg font-semibold mb-1',
                    isDark ? 'text-white' : 'text-gray-900'
                  )}>
                    Next Steps After Registration
                  </h3>
                  <p className={cn(
                    'text-sm max-w-2xl',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    After successful registration, you'll see a confirmation modal with the generated patient number. 
                    Click the "Continue" button to automatically proceed to prescription search for dispensing.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium',
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                )}>
                  Patient Number Ready
                </div>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={cn(
                    'p-2 rounded-lg',
                    isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                  )}
                >
                  <ArrowRight className={cn(
                    'w-5 h-5',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )} />
                </motion.div>
              </div>
            </div>

            {/* Workflow steps */}
            <div className="relative mt-6 pt-6 border-t-2"
              style={{
                borderColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)'
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { step: '1', title: 'Fill Patient Details', description: 'Enter patient information in the form above' },
                  { step: '2', title: 'Review & Confirm', description: 'Verify details and create the patient record' },
                  { step: '3', title: 'Proceed to Dispensing', description: 'Continue to prescription search with patient number' }
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm',
                      isDark 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    )}>
                      {item.step}
                    </div>
                    <div>
                      <h4 className={cn(
                        'text-sm font-medium mb-1',
                        isDark ? 'text-gray-200' : 'text-gray-800'
                      )}>
                        {item.title}
                      </h4>
                      <p className={cn(
                        'text-xs',
                        isDark ? 'text-gray-500' : 'text-gray-500'
                      )}>
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Full-width footer with subtle gradient */}
      <div className={cn(
        'w-full border-t-2 mt-8 py-4',
        isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50/50'
      )}>
        <div className="max-w-7xl mx-auto px-6">
          <p className={cn(
            'text-xs text-center',
            isDark ? 'text-gray-600' : 'text-gray-400'
          )}>
            ⚕️ Patient registration is required before dispensing any medications
          </p>
        </div>
      </div>
    </motion.div>
  );
};

QuickPatientCreate.displayName = 'QuickPatientCreate';

export default QuickPatientCreate;