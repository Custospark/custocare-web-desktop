// MRPatientRecords.tsx
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, History, Eye, Calendar, FileText, ChevronRight } from 'lucide-react';
import { FOCUS_MODE_ROUTES } from '../../../../administration/onboarding/routes/focusModeRouteConstants';

interface MRPatientRecordsProps {
  theme?: 'light' | 'dark';
}

interface RecordCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  onClick: () => void;
  theme: 'light' | 'dark';
  delay?: number;
}

const RecordCard: React.FC<RecordCardProps> = ({
  icon,
  title,
  description,
  badge,
  badgeColor,
  onClick,
  theme,
  delay = 0,
}) => {
  const isDark = theme === 'dark';

  const colors = {
    bg: {
      card: isDark ? 'bg-gray-800/50' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50',
      icon: isDark ? 'bg-gray-700' : 'bg-gray-100',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
    },
  };

  const getBadgeColor = () => {
    if (badgeColor === 'blue') {
      return isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700';
    }
    return isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="h-full"
    >
      <div
        onClick={onClick}
        className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border transition-all duration-300 ${colors.border.primary} ${colors.bg.card} ${colors.bg.hover} hover:shadow-lg hover:scale-[1.02]`}
      >
        {/* Decorative gradient overlay */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
          isDark ? 'bg-gradient-to-br from-blue-500/5 to-transparent' : 'bg-gradient-to-br from-blue-500/10 to-transparent'
        }`} />
        
        <div className="relative p-6 flex flex-col items-center text-center flex-1">
          {/* Icon with container */}
          <div className={`mb-4 rounded-2xl p-4 transition-all duration-300 group-hover:scale-110 ${colors.bg.icon}`}>
            <div className="text-current">
              {icon}
            </div>
          </div>

          {/* Title and Badge */}
          <div className="flex items-center gap-2 mb-2 flex-wrap justify-center">
            <h3 className={`text-xl font-bold ${colors.text.primary}`}>
              {title}
            </h3>
            {badge && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getBadgeColor()}`}>
                {badge}
              </span>
            )}
          </div>

          {/* Description */}
          <p className={`text-sm ${colors.text.secondary} mb-4`}>
            {description}
          </p>

          {/* Action indicator */}
          <div className={`mt-auto flex items-center gap-1 text-sm font-medium transition-all duration-300 ${
            isDark ? 'text-blue-400' : 'text-blue-600'
          } group-hover:gap-2`}>
            <Eye className="h-4 w-4" />
            <span>View Details</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const MRPatientRecords: React.FC<MRPatientRecordsProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-gray-50',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-500',
    },
  };

  const handleLatestVisit = useCallback(() => {
    navigate(FOCUS_MODE_ROUTES.LATEST_VISIT_FOCUS);
  }, [navigate]);

  const handleMedicalHistory = useCallback(() => {
    navigate(FOCUS_MODE_ROUTES.MEDICAL_HISTORY_FOCUS);
  }, [navigate]);

  // Mock data for recent visits preview (will be replaced with real data later)
  const recentVisits = [
    { date: '2024-04-15', type: 'Consultation', doctor: 'Dr. Smith' },
    { date: '2024-04-10', type: 'Lab Results', doctor: 'Dr. Johnson' },
    { date: '2024-04-05', type: 'Follow-up', doctor: 'Dr. Williams' },
  ];

  // Mock stats (will be replaced with real data later)
  const stats = {
    totalVisits: 24,
    lastYearVisits: 12,
    conditions: ['Hypertension', 'Diabetes Type 2'],
  };

  return (
    <div className={`h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 ${colors.bg.primary}`}>
      {/* Header Section */}
      <div className="mb-6">
        <h2 className={`text-xl font-semibold ${colors.text.primary}`}>
          Patient Records
        </h2>
        <p className={`text-sm ${colors.text.secondary}`}>
          Access and manage patient clinical history
        </p>
      </div>

      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6 mb-8">
        {/* Latest Visit Card */}
        <RecordCard
          icon={<Clock className="h-8 w-8" />}
          title="Latest Visit"
          description="View the most recent patient encounter with complete clinical notes, diagnosis, and prescriptions"
          badge="Current"
          badgeColor="blue"
          onClick={handleLatestVisit}
          theme={theme}
          delay={0}
        />

        {/* Medical History Card */}
        <RecordCard
          icon={<History className="h-8 w-8" />}
          title="Medical History"
          description="Access complete patient history across all facilities including past diagnoses, treatments, and lab results"
          badge="Complete"
          badgeColor="purple"
          onClick={handleMedicalHistory}
          theme={theme}
          delay={0.05}
        />
      </div>

      {/* Quick Stats Section - Preview */}
      <div className={`mt-6 rounded-xl border p-4 ${colors.bg.primary === 'bg-gray-900' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-3">
          <FileText className={`h-4 w-4 ${colors.text.secondary}`} />
          <h3 className={`text-sm font-semibold ${colors.text.primary}`}>
            Quick Overview
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className={`text-2xl font-bold ${colors.text.primary}`}>
              {stats.totalVisits}
            </p>
            <p className={`text-xs ${colors.text.secondary}`}>
              Total Visits
            </p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${colors.text.primary}`}>
              {stats.lastYearVisits}
            </p>
            <p className={`text-xs ${colors.text.secondary}`}>
              Last 12 Months
            </p>
          </div>
          <div>
            <p className={`text-sm font-medium ${colors.text.primary}`}>
              {stats.conditions.join(', ')}
            </p>
            <p className={`text-xs ${colors.text.secondary}`}>
              Chronic Conditions
            </p>
          </div>
        </div>

        {/* Recent Visits Preview */}
        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-xs font-medium mb-2 ${colors.text.secondary}`}>
            Recent Activity
          </p>
          <div className="space-y-2">
            {recentVisits.map((visit, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className={`h-3 w-3 ${colors.text.secondary}`} />
                  <span className={`text-xs ${colors.text.secondary}`}>
                    {new Date(visit.date).toLocaleDateString()}
                  </span>
                  <span className={`text-xs font-medium ${colors.text.primary}`}>
                    {visit.type}
                  </span>
                </div>
                <span className={`text-xs ${colors.text.secondary}`}>
                  {visit.doctor}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MRPatientRecords;