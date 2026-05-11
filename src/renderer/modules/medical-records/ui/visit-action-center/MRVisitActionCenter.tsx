// components/medical-records/MRVisitActionCenter.tsx
import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ArrowRight, 
  // MessageSquare,
  User,
  Calendar,
  Clock,
  Activity,
  Shield,
  Users,
  UserPlus,
  Search,
  ArrowLeftRight,
  Receipt,
  Stethoscope,
} from 'lucide-react';
import { type RootState } from '../../../../app/store/rootReducer';
import { CLINICAL_ROUTES, MEDICAL_RECORDS_ROUTES } from '../../../../app/routes/routeConstants';
import { FOCUS_MODE_ROUTES } from '../../../../app/routes/utils/forwardPatientFocus';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { 
  selectActivePatient,
  selectActiveVisitInfo,
  selectVisitContext,
  selectActiveVisitPhase,
  selectActiveVisitUuid,
  selectHasActiveVisit,
  emergencyClearVisit
} from '../../../../app/store/slices/visitSlice';
import { clearAll } from '../visit-action-center/billing-space';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import {
  getPatientIntakeRoutes,
  type PatientIntakeModule,
} from '../../../../app/routes/utils/patientIntakeRoutes';

interface MRVisitActionCenterProps {
  theme: 'light' | 'dark';
  intakeModule?: PatientIntakeModule;
}

const MRVisitActionCenter: React.FC<MRVisitActionCenterProps> = ({
  theme,
  intakeModule = 'medical-records',
}) => {
  const routes = getPatientIntakeRoutes(intakeModule);
  const actionCenterRoutes =
    intakeModule === 'clinical'
      ? {
          patientRecords: CLINICAL_ROUTES.PATIENT_RECORDS,
          clinicalCare: CLINICAL_ROUTES.CLINICAL_CARE,
          patientBillingSpace: CLINICAL_ROUTES.PATIENT_BILLING_SPACE,
          visitStatus: CLINICAL_ROUTES.VISIT_STATUS,
        }
      : {
          patientRecords: MEDICAL_RECORDS_ROUTES.PATIENT_RECORDS,
          clinicalCare: MEDICAL_RECORDS_ROUTES.CLINICAL_CARE,
          patientBillingSpace: MEDICAL_RECORDS_ROUTES.PATIENT_BILLING_SPACE,
          visitStatus: MEDICAL_RECORDS_ROUTES.VISIT_STATUS,
        };

  const forwardPatientNavigateState = useMemo(
    () =>
      intakeModule === 'clinical'
        ? {
            cancelTo: CLINICAL_ROUTES.PATIENT_RECORDS,
            queueRedirectTo: CLINICAL_ROUTES.PATIENT_QUEUE,
          }
        : {
            cancelTo: MEDICAL_RECORDS_ROUTES.PATIENT_RECORDS,
            queueRedirectTo: MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE,
          },
    [intakeModule]
  );

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Get data from Redux store
  const patient = useSelector((state: RootState) => selectActivePatient(state));
  const visitInfo = useSelector((state: RootState) => selectActiveVisitInfo(state));
  const visitContext = useSelector((state: RootState) => selectVisitContext(state));
  const visitPhase = useSelector((state: RootState) => selectActiveVisitPhase(state));
  const visitUuid = useSelector((state: RootState) => selectActiveVisitUuid(state));
  const hasActiveVisit = useSelector((state: RootState) => selectHasActiveVisit(state));

  const formatTime = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Invalid date';
    }
  };

  const calculateWaitTime = (arrivedAt: string | null): string => {
    if (!arrivedAt) return 'N/A';
    try {
      const arrivalTime = new Date(arrivedAt).getTime();
      const now = Date.now();
      const diffMinutes = Math.floor((now - arrivalTime) / (1000 * 60));
      
      if (diffMinutes < 60) {
        return `${diffMinutes} min`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `${hours}h ${minutes}m`;
      }
    } catch {
      return 'N/A';
    }
  };

  const getPhaseDisplayName = (phase: string): string => 
    phase.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  /**
   * Handle "Work on Another Patient" action
   * Clears both visit and billing slices before navigating to patient queue
   */
  const handleWorkOnAnotherPatient = async () => {
    try {
      setIsNavigating(true);
      
      // Clear any existing billing draft from session storage for current visit
      const currentVisitId = visitInfo?.uuid;
      if (currentVisitId) {
        const billingDraftKey = `billing_draft_${currentVisitId}`;
        sessionStorage.removeItem(billingDraftKey);
      }
      
      // Clear billing slice state
      dispatch(clearAll());
      
      // Clear visit slice state (force clear without storing as previous)
      dispatch(emergencyClearVisit());
      
      // Simulate minimum loading time for better UX (optional)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Navigate to patient queue
      navigate(routes.queue);
    } catch (error) {
      console.error('Error clearing patient data:', error);
      showToast('error', 'Failed to clear patient data. Please try again.', 4000);
      setIsNavigating(false);
      // Fallback navigation
      navigate(routes.queue);
    }
  };

  // Show loading skeleton while navigating
  if (isNavigating) {
    return (
    <LoadingSkeleton 
        variant="default"
        theme={theme}
        message="✨ Getting the queue ready for your next patient..."
      />
    );
  }

  // Show empty state if no active visit
  if (!hasActiveVisit) {
    return (
      <div className={`flex items-center justify-center p-8 ${
        theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="text-center max-w-2xl">
          <div className={`inline-flex p-4 rounded-full mb-4 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm'
          }`}>
            <Users className={`w-12 h-12 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-500'
            }`} />
          </div>
          
          <h2 className="text-2xl font-bold mb-3">
          Ready to Save Lives Today? 👋
          </h2>
          <p className={`text-base mb-6 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Select a patient from the queue, create a new record, or search for an existing patient to start their care journey.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(routes.queue)}
              className="cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Users className="w-4 h-4" />
              Go to Patient Queue
            </button>

            <button
              onClick={() => navigate(routes.register)}
              className={`cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Create New Patient
            </button>

            <button
              onClick={() => navigate(routes.search)}
              className={`cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
              }`}
            >
              <Search className="w-4 h-4" />
              Search Patient
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left Sidebar - Patient Info Card */}
          <div className="lg:col-span-4 xl:col-span-3">
            <PatientInfoCard
              theme={theme}
              patient={patient}
              visitInfo={visitInfo}
              visitContext={visitContext}
              visitPhase={visitPhase}
              visitUuid={visitUuid}
              formatTime={formatTime}
              calculateWaitTime={calculateWaitTime}
              getPhaseDisplayName={getPhaseDisplayName}
              onWorkOnAnotherPatient={handleWorkOnAnotherPatient}
              isNavigating={isNavigating}
            />
          </div>

          {/* Right Main Content - Action Center */}
          <div className="lg:col-span-8 xl:col-span-9">
            <BaseActionWorkspace
              title="Patient Encounter Hub"
              icon={<FileText className="w-6 h-6" />}
              theme={theme}
              defaultActionTo={actionCenterRoutes.patientRecords}
              actions={[
          // EXISTING ACTIONS
            { 
              key: 'patient-records', 
              label: 'Patient Records', 
              icon: <User className="w-4 h-4" />, 
              to: actionCenterRoutes.patientRecords
            },
              { 
                key: 'clinical-care', 
                label: 'Clinical Care', 
                icon: <Stethoscope className="w-4 h-4" />, 
                to: actionCenterRoutes.clinicalCare
              },

              // { 
              //   key: 'get-complaints', 
              //   label: 'Get Complaints', 
              //   icon: <MessageSquare className="w-4 h-4" />, 
              //   to: MEDICAL_RECORDS_ROUTES.GET_COMPLAINTS 
              // },
              { 
                key: 'forward-patient', 
                label: 'Forward Patient', 
                icon: <ArrowRight className="w-4 h-4" />, 
                to: FOCUS_MODE_ROUTES.FORWARD_PATIENT_FOCUS,
                navigateState: forwardPatientNavigateState,
              },
              { 
                key: 'billing-space', 
                label: 'Billing Space', 
                icon: <Receipt className="w-4 h-4" />, 
                to: actionCenterRoutes.patientBillingSpace
              },
              { 
                key: 'visit-status', 
                label: 'Visit Status', 
                icon: <Activity className="w-4 h-4" />, 
                to: actionCenterRoutes.visitStatus
              },
            ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Patient Info Card Component
interface PatientInfoCardProps {
  theme: 'light' | 'dark';
  patient: ReturnType<typeof selectActivePatient>;
  visitInfo: ReturnType<typeof selectActiveVisitInfo>;
  visitContext: ReturnType<typeof selectVisitContext>;
  visitPhase: ReturnType<typeof selectActiveVisitPhase>;
  visitUuid: ReturnType<typeof selectActiveVisitUuid>;
  formatTime: (dateString: string | null) => string;
  calculateWaitTime: (arrivedAt: string | null) => string;
  getPhaseDisplayName: (phase: string) => string;
  onWorkOnAnotherPatient: () => void;
  isNavigating?: boolean;
}

const PatientInfoCard: React.FC<PatientInfoCardProps> = ({
  theme,
  patient,
  visitInfo,
  calculateWaitTime,
  onWorkOnAnotherPatient,
  isNavigating = false
}) => {
  const isDark = theme === 'dark';
  
  // Check if we have patient data
  const hasPatientData = patient && patient.name;
  const hasVisitData = visitInfo && visitInfo.uuid;
  
  if (!hasPatientData || !hasVisitData) {
    return (
      <div className={`rounded-xl p-6 sticky top-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="text-center py-8">
          <div className={`p-4 rounded-lg inline-flex mb-4 ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <User className={`w-8 h-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <h3 className="font-bold text-lg mb-2">Loading Patient Data...</h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Please wait while we load the patient information
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`rounded-xl overflow-hidden sticky top-6 border ${
      isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    }`}>
      {/* Header - Compact */}
      <div className={`p-4 border-b ${
        isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isDark ? 'bg-blue-600/20' : 'bg-blue-50'
          }`}>
            <User className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm uppercase tracking-wide break-words text-center">
            Current Patient
          </h3>
        </div>
        </div>
      </div>

      {/* Patient Details - Compact */}
      <div className="p-4 space-y-3">
        {/* Patient Name */}
        <div>
          <div className={`text-xs font-medium mb-1 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Patient Name
          </div>
          <div className="text-lg font-bold truncate">{patient.name}</div>
        </div>

        {/* Patient Number & Visit ID - Inline */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className={`text-xs font-medium mb-1 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Patient No.
            </div>
            <div className="font-mono text-sm font-semibold">
              {patient.patient_number || 'N/A'}
            </div>
          </div>
          <div>
            {/* Empty for spacing */}
          </div>
        </div>

        <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`} />

        {/* Demographics - Compact Grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          <div className="flex items-start gap-2">
            <Calendar className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <div className="min-w-0">
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                DOB
              </div>
              <div className="text-xs font-medium truncate">
                {patient.date_of_birth 
                  ? new Date(patient.date_of_birth).toLocaleDateString() 
                  : 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <User className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <div className="min-w-0">
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Sex
              </div>
              <div className="text-xs font-medium truncate">
                {patient.biological_sex || 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Activity className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <div className="min-w-0">
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Blood Type
              </div>
              <div className="text-xs font-medium truncate">
                {patient.blood_type || 'Unknown'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <div className="min-w-0">
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Wait Time
              </div>
              <div className="text-xs font-semibold truncate">
                {calculateWaitTime(visitInfo.arrivedAt)}
              </div>
            </div>
          </div>
        </div>

        <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`} />

        {/* Status Badges - Compact */}
        <div className="space-y-2">
          {patient.requires_isolation && (
            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
              isDark 
                ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/30' 
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            }`}>
              <Shield className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Isolation Required</span>
            </div>
          )}
          
          {visitInfo.acuity && (
            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
              isDark 
                ? 'bg-gray-800 text-gray-300 border border-gray-700' 
                : 'bg-gray-50 text-gray-700 border border-gray-200'
            }`}>
              <Activity className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Acuity: {visitInfo.acuity}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Action - Prominent "Work on Another Patient" Button */}
      <div className={`p-4 border-t ${
        isDark ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
      }`}>
        <button
          onClick={onWorkOnAnotherPatient}
          disabled={isNavigating}
          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
            isNavigating
              ? 'bg-gray-400 cursor-not-allowed opacity-50'
              : isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
          }`}
          title={isNavigating ? 'Navigating to patient queue...' : 'Switch to work on another patient'}
        >
          {isNavigating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Navigating...
            </>
          ) : (
            <>
              <ArrowLeftRight className="w-4 h-4" />
              Work on Another Patient
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MRVisitActionCenter;