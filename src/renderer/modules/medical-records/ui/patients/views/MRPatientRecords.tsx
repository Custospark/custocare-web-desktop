// MRPatientRecords.tsx
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, History } from 'lucide-react';
import { FOCUS_MODE_ROUTES } from '../../../../administration/onboarding/routes/focusModeRouteConstants';

interface MRPatientRecordsProps {
  theme?: 'light' | 'dark';
}

export const MRPatientRecords: React.FC<MRPatientRecordsProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-gray-50',
      secondary: isDark ? 'bg-gray-800' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
    },
  };

  const handleLatestVisit = useCallback(() => {
    navigate(FOCUS_MODE_ROUTES.LATEST_VISIT_FOCUS);
  }, [navigate]);

  const handleMedicalHistory = useCallback(() => {
    navigate(FOCUS_MODE_ROUTES.MEDICAL_HISTORY_FOCUS);
  }, [navigate]);

  return (
    <div className={`h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 ${colors.bg.primary}`}>
      <div className="grid h-full grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
        {/* Latest Visit Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          <div
            onClick={handleLatestVisit}
            className={`flex h-full cursor-pointer flex-col items-center justify-center rounded-xl border p-8 text-center transition-all duration-200 ${colors.border.primary} ${colors.bg.secondary} ${colors.bg.hover}`}
          >
            <div className={`mb-4 rounded-full p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Clock className={`h-12 w-12 ${colors.text.primary}`} />
            </div>
            <h3 className={`mb-2 text-xl font-bold ${colors.text.primary}`}>
              Latest Visit
            </h3>
            <p className={`text-sm ${colors.text.secondary}`}>
              View the most recent patient encounter
            </p>
          </div>
        </motion.div>

        {/* Medical History Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="h-full"
        >
          <div
            onClick={handleMedicalHistory}
            className={`flex h-full cursor-pointer flex-col items-center justify-center rounded-xl border p-8 text-center transition-all duration-200 ${colors.border.primary} ${colors.bg.secondary} ${colors.bg.hover}`}
          >
            <div className={`mb-4 rounded-full p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <History className={`h-12 w-12 ${colors.text.primary}`} />
            </div>
            <h3 className={`mb-2 text-xl font-bold ${colors.text.primary}`}>
              Medical History
            </h3>
            <p className={`text-sm ${colors.text.secondary}`}>
              View all past visits across facilities
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MRPatientRecords;