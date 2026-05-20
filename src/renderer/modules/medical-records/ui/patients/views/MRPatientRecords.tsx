// MRPatientRecords.tsx
import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Clock, History, Eye, FileText, ChevronRight, Activity, Stethoscope, AlertCircle } from 'lucide-react';
import { FOCUS_MODE_ROUTES } from '../../../../administration/onboarding/routes/focusModeRouteConstants';
import { selectActiveVisitId, selectActiveVisitPatientId } from '../../../../../app/store/slices/visitSlice';

// Import queries for status indicators
import { usePatientMedicalHistory } from '../../../api/patient-medical-history/patientMedicalHistoryQueries';
import { useGetAllergies } from '../../../api/allergies/AllergyQueries';
import { normalizeAllergyResponse } from '../../visit-action-center/clinical-forms/allergies-form-components';

export type MRPatientRecordsPresentation = 'clinical-encounter' | 'nursing' | 'laboratory' | 'ambulance' | 'referral';

interface MRPatientRecordsProps {
  theme?: 'light' | 'dark';
  /** Nursing encounter uses the same UI with nursing-oriented labels. */
  presentation?: MRPatientRecordsPresentation;
}

interface RecordCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  badgeIcon?: React.ReactNode;
  statusInfo?: {
    hasData: boolean;
    message: string;
  };
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
  badgeIcon,
  statusInfo,
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
    if (badgeColor === 'amber') {
      return isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700';
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
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${getBadgeColor()}`}>
                {badgeIcon}
                {badge}
              </span>
            )}
          </div>

          {/* Description */}
          <p className={`text-sm ${colors.text.secondary} mb-3`}>
            {description}
          </p>

          {/* Status Info */}
          {statusInfo && (
            <div className={`mb-4 text-xs ${statusInfo.hasData ? 'text-emerald-500' : 'text-amber-500'}`}>
              {statusInfo.message}
            </div>
          )}

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

const presentationCopy: Record<
  MRPatientRecordsPresentation,
  {
    pageTitle: string;
    pageSubtitle: string;
    latestVisitTitle: string;
    latestVisitDescription: string;
    medicalHistoryTitle: string;
    medicalHistoryDescription: string;
    lifetimeBadge: string;
    summaryHeading: string;
    statVisitLabel: string;
    statAllergiesLabel: string;
    statModeLabel: string;
    alertNoVisit: string;
    visitBadgeActive: string;
    visitBadgeInactive: string;
  }
> = {
  'clinical-encounter': {
    pageTitle: 'Patient Records',
    pageSubtitle: 'Access and manage patient clinical history',
    latestVisitTitle: 'Latest Visit',
    latestVisitDescription:
      'View and document the current patient encounter with complete clinical notes, diagnosis, and prescriptions',
    medicalHistoryTitle: 'Medical History',
    medicalHistoryDescription:
      'Access complete patient history across all facilities including past diagnoses, treatments, allergies, and lab results',
    lifetimeBadge: 'Lifetime Record',
    summaryHeading: 'Clinical Summary',
    statVisitLabel: 'Current Visit Status',
    statAllergiesLabel: 'Known Allergies',
    statModeLabel: 'Data Mode',
    alertNoVisit:
      'No active visit selected. Latest visit data will be read-only. Select or start a visit to enable documentation.',
    visitBadgeActive: 'Current',
    visitBadgeInactive: 'No Active Visit',
  },
  nursing: {
    pageTitle: 'Patient Info',
    pageSubtitle: 'Review clinical context and history to inform nursing care',
    latestVisitTitle: 'This visit',
    latestVisitDescription:
      'Review and contribute to this encounter—clinical notes, orders, care plans, and tasks relevant to bedside nursing',
    medicalHistoryTitle: 'Patient history',
    medicalHistoryDescription:
      'Full clinical picture across time—allergies, prior care, labs, and diagnoses to keep nursing interventions safe',
    lifetimeBadge: 'Full record',
    summaryHeading: 'Care snapshot',
    statVisitLabel: 'Visit status',
    statAllergiesLabel: 'Known allergies',
    statModeLabel: 'Documentation mode',
    alertNoVisit:
      'No active visit is selected. Current-visit views may be limited. Select or continue a visit from the queue when ready.',
    visitBadgeActive: 'This visit',
    visitBadgeInactive: 'No active visit',
  },
  laboratory: {
    pageTitle: 'Patient Info',
    pageSubtitle: 'Review current visit context and full medical history for safe diagnostics',
    latestVisitTitle: 'Current Visit',
    latestVisitDescription:
      'Open current encounter context, review ongoing notes, and inspect active visit details before processing lab work',
    medicalHistoryTitle: 'Medical History',
    medicalHistoryDescription:
      'Inspect historical diagnoses, prior labs, allergies, and treatment patterns to guide laboratory interpretation',
    lifetimeBadge: 'Patient History',
    summaryHeading: 'Laboratory Context',
    statVisitLabel: 'Current Visit Status',
    statAllergiesLabel: 'Known Allergies',
    statModeLabel: 'Exploration Mode',
    alertNoVisit:
      'No active visit selected. You can still review historical records, but visit-scoped context may be limited.',
    visitBadgeActive: 'Current',
    visitBadgeInactive: 'No Active Visit',
  },
  ambulance: {
    pageTitle: 'Patient Info',
    pageSubtitle: 'Review visit and chart context before dispatch and transport documentation',
    latestVisitTitle: 'Current Visit',
    latestVisitDescription:
      'Open encounter context for the patient linked to an active or planned ambulance trip',
    medicalHistoryTitle: 'Medical History',
    medicalHistoryDescription:
      'Review allergies, diagnoses, and prior care to support safe transport and handoff',
    lifetimeBadge: 'Patient History',
    summaryHeading: 'Transport Context',
    statVisitLabel: 'Current Visit Status',
    statAllergiesLabel: 'Known Allergies',
    statModeLabel: 'Exploration Mode',
    alertNoVisit:
      'No active visit selected. Select a patient from the transport queue to load visit context.',
    visitBadgeActive: 'Current',
    visitBadgeInactive: 'No Active Visit',
  },
  referral: {
    pageTitle: 'Patient Info',
    pageSubtitle: 'Review visit and chart context before creating or tracking referrals',
    latestVisitTitle: 'Current Visit',
    latestVisitDescription:
      'Open encounter context for the patient linked to referral coordination',
    medicalHistoryTitle: 'Medical History',
    medicalHistoryDescription:
      'Review allergies, diagnoses, and prior care to support referral decisions',
    lifetimeBadge: 'Patient History',
    summaryHeading: 'Referral Context',
    statVisitLabel: 'Current Visit Status',
    statAllergiesLabel: 'Known Allergies',
    statModeLabel: 'Exploration Mode',
    alertNoVisit:
      'No active visit selected. Select a patient from the referral queue to load visit context.',
    visitBadgeActive: 'Current',
    visitBadgeInactive: 'No Active Visit',
  },
};

export const MRPatientRecords: React.FC<MRPatientRecordsProps> = ({
  theme = 'light',
  presentation = 'clinical-encounter',
}) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const copy = presentationCopy[presentation];
  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatientId = useSelector(selectActiveVisitPatientId);

  // Fetch data for status indicators
  const patientIdNum = Number(activePatientId);
  const medicalHistoryQuery = usePatientMedicalHistory(patientIdNum, {
    enabled: patientIdNum > 0,
  });

  const allergiesQuery = useGetAllergies(activePatientId ?? '', {}, {
    enabled: !!activePatientId,
  });

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-gray-50',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-500',
    },
  };

  // Determine latest visit status from all clinical forms
  const latestVisitStatus = useMemo(() => {
    const mh = medicalHistoryQuery.data;
    const categories = [
      { name: 'Clinical Notes',    hasData: (mh?.clinical_notes?.length  || 0) > 0 },
      { name: 'Diagnoses',         hasData: (mh?.diagnoses?.length      || 0) > 0 },
      { name: 'Consultations',     hasData: (mh?.consultations?.length  || 0) > 0 },
      { name: 'Vitals',            hasData: (mh?.vitals?.length         || 0) > 0 },
      { name: 'Allergies',         hasData: (mh?.allergies?.length      || 0) > 0 },
      { name: 'Prescriptions',     hasData: (mh?.prescriptions?.length  || 0) > 0 },
      { name: 'Lab Requests',      hasData: (mh?.lab_requests?.length   || 0) > 0 },
      { name: 'Lab Results',       hasData: (mh?.lab_results?.length    || 0) > 0 },
    ];
    const documentedCount = categories.filter(c => c.hasData).length;
    const total = categories.length;

    if (activePatientId) {
      if (documentedCount === total) {
        return { hasData: true, message: '✓ All clinical forms documented' };
      }
      if (documentedCount > 0) {
        return { hasData: true, message: `⚠️ ${documentedCount}/${total} clinical forms have data` };
      }
      return { hasData: false, message: 'No clinical data recorded' };
    }
    return { hasData: false, message: 'No patient selected' };
  }, [activePatientId, medicalHistoryQuery.data]);

  // Determine medical history status
  const medicalHistoryStatus = useMemo(() => {
    const mh = medicalHistoryQuery.data;
    const categories = [
      (mh?.clinical_notes?.length  || 0) > 0,
      (mh?.diagnoses?.length       || 0) > 0,
      (mh?.consultations?.length   || 0) > 0,
      (mh?.vitals?.length          || 0) > 0,
      (mh?.allergies?.length       || 0) > 0,
      (mh?.prescriptions?.length   || 0) > 0,
      (mh?.lab_requests?.length    || 0) > 0,
      (mh?.lab_results?.length     || 0) > 0,
    ];
    const documentedCount = categories.filter(Boolean).length;

    if (activePatientId) {
      if (documentedCount > 0) {
        return {
          hasData: true,
          message: `Historical data exists (${documentedCount} of ${categories.length} clinical categories)`,
        };
      }
      return {
        hasData: false,
        message: 'No historical data recorded',
      };
    }
    return {
      hasData: false,
      message: 'No patient selected',
    };
  }, [activePatientId, medicalHistoryQuery.data]);

  // Handler for Latest Visit
  const handleLatestVisit = useCallback(() => {
    navigate(FOCUS_MODE_ROUTES.LATEST_VISIT_FOCUS);
  }, [navigate]);

  // Handler for Medical History - Navigate to historical records view
  const handleMedicalHistory = useCallback(() => {
    // Navigate to a read-only historical view
    navigate(FOCUS_MODE_ROUTES.MEDICAL_HISTORY_FOCUS);
  }, [navigate]);

  // Quick stats based on real data
  const stats = useMemo(() => {
    const normalizedAllergies = normalizeAllergyResponse(allergiesQuery.data);
    const allergiesCount = normalizedAllergies.meta.total;
    const hasActiveVisit = !!activeVisitId;

    return {
      hasActiveVisit,
      activeVisitId: activeVisitId || 'none',
      allergiesCount,
      hasAllergies: allergiesCount > 0,
    };
  }, [allergiesQuery.data, activeVisitId]);

  return (
    <div className={`h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 ${colors.bg.primary}`}>
      {/* Header Section */}
      <div className="mb-6">
        <h2 className={`text-xl font-semibold ${colors.text.primary}`}>
          {copy.pageTitle}
        </h2>
        <p className={`text-sm ${colors.text.secondary}`}>
          {copy.pageSubtitle}
        </p>
      </div>

      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6 mb-8">
        {/* Latest Visit Card - Active/Current Episode */}
        <RecordCard
          icon={<Clock className="h-8 w-8" />}
          title={copy.latestVisitTitle}
          description={copy.latestVisitDescription}
          badge={activeVisitId ? copy.visitBadgeActive : copy.visitBadgeInactive}
          badgeColor={activeVisitId ? "blue" : "amber"}
          badgeIcon={activeVisitId ? <Activity className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          statusInfo={latestVisitStatus}
          onClick={handleLatestVisit}
          theme={theme}
          delay={0}
        />

        {/* Medical History Card - Historical/Lifetime View */}
        <RecordCard
          icon={<History className="h-8 w-8" />}
          title={copy.medicalHistoryTitle}
          description={copy.medicalHistoryDescription}
          badge={copy.lifetimeBadge}
          badgeColor="purple"
          badgeIcon={<Stethoscope className="h-3 w-3" />}
          statusInfo={medicalHistoryStatus}
          onClick={handleMedicalHistory}
          theme={theme}
          delay={0.05}
        />
      </div>

      {/* Quick Stats Section - Data-driven */}
      <div className={`mt-6 rounded-xl border p-4 ${isDark ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-3">
          <FileText className={`h-4 w-4 ${colors.text.secondary}`} />
          <h3 className={`text-sm font-semibold ${colors.text.primary}`}>
            {copy.summaryHeading}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className={`text-2xl font-bold ${colors.text.primary}`}>
              {stats.hasActiveVisit ? 'Active' : 'None'}
            </p>
            <p className={`text-xs ${colors.text.secondary}`}>
              {copy.statVisitLabel}
            </p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${colors.text.primary}`}>
              {stats.allergiesCount}
            </p>
            <p className={`text-xs ${colors.text.secondary}`}>
              {copy.statAllergiesLabel}
            </p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${colors.text.primary}`}>
              {stats.hasActiveVisit ? 'Editable' : 'Read-only'}
            </p>
            <p className={`text-xs ${colors.text.secondary}`}>
              {copy.statModeLabel}
            </p>
          </div>
        </div>

        {/* Info Alert */}
        {!activeVisitId && (
          <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-amber-900/20 border border-amber-800' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center gap-2">
              <AlertCircle className={`h-4 w-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                {copy.alertNoVisit}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MRPatientRecords;