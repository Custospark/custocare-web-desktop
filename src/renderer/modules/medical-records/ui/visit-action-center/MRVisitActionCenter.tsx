// components/medical-records/MRVisitActionCenter.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ArrowRight, 
  ClipboardList,
  MessageSquare,
  User,
  Calendar,
  Clock,
  Activity,
  Shield,
  Users,
  UserPlus,
  Search,
  ArrowLeftRight,
} from 'lucide-react';
import { FaNotesMedical } from 'react-icons/fa';
import { type RootState } from '../../../../app/store/rootReducer';
import { MEDICAL_RECORDS_ROUTES } from '../../../../app/routes/routeConstants';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { 
  selectActivePatient,
  selectActiveVisitInfo,
  selectVisitContext,
  selectActiveVisitPhase,
  selectActiveVisitUuid,
  selectHasActiveVisit
} from '../../../../app/store/slices/visitSlice';

interface MRVisitActionCenterProps {
  theme: 'light' | 'dark';
}

const MRVisitActionCenter: React.FC<MRVisitActionCenterProps> = ({ theme }) => {
  const navigate = useNavigate();
  
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

  // Show empty state if no active visit
  if (!hasActiveVisit) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-8 ${
        theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="text-center max-w-2xl">
          <div className={`inline-flex p-6 rounded-full mb-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-lg'
          }`}>
            <Users className={`w-16 h-16 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-500'
            }`} />
          </div>
          
          <h2 className="text-3xl font-bold mb-3">No Active Patient Visit</h2>
          <p className={`text-lg mb-8 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Select a patient from the queue to begin or create a new patient record
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE)}
              className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Users className="w-5 h-5" />
              Go to Patient Queue
            </button>

            <button
              onClick={() => navigate(MEDICAL_RECORDS_ROUTES.PATIENTS_REGISTER)}
              className={`cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              Create New Patient
            </button>

            <button
              onClick={() => navigate(MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH)}
              className={`cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
              }`}
            >
              <Search className="w-5 h-5" />
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
              navigate={navigate}
            />
          </div>

          {/* Right Main Content - Action Center */}
          <div className="lg:col-span-8 xl:col-span-9">
            <BaseActionWorkspace
              title="Patient Visit Action Center"
              icon={<FileText className="w-6 h-6" />}
              theme={theme}
              defaultActionTo={MEDICAL_RECORDS_ROUTES.GET_COMPLAINTS}
              actions={[
                { 
                  key: 'get-complaints', 
                  label: 'Get Complaints', 
                  icon: <MessageSquare className="w-4 h-4" />, 
                  to: MEDICAL_RECORDS_ROUTES.GET_COMPLAINTS 
                },
                { 
                  key: 'clinical-notes', 
                  label: 'Clinical Notes', 
                  icon: <ClipboardList className="w-4 h-4" />, 
                  to: MEDICAL_RECORDS_ROUTES.CLINICAL_NOTES 
                },
                { 
                  key: 'patient-history', 
                  label: 'Patient History', 
                  icon: <FaNotesMedical className="w-4 h-4" />, 
                  to: MEDICAL_RECORDS_ROUTES.PATIENT_HISTORY 
                },
                { 
                  key: 'forward-patient', 
                  label: 'Forward Patient', 
                  icon: <ArrowRight className="w-4 h-4" />, 
                  to: MEDICAL_RECORDS_ROUTES.FORWARD_PATIENT 
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
  navigate: (path: string) => void;
}

const PatientInfoCard: React.FC<PatientInfoCardProps> = ({
  theme,
  patient,
  visitInfo,
  visitPhase,
  visitUuid,
  calculateWaitTime,
  getPhaseDisplayName,
  navigate
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
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm uppercase tracking-wide truncate">
              Current Patient
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {getPhaseDisplayName(visitPhase || '')}
            </p>
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
            <div className={`text-xs font-medium mb-1 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Visit No.
            </div>
            <div className="font-mono text-xs">
              {visitUuid || 'N/A'}
            </div>
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
          onClick={() => navigate(MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE)}
          className={`cursor-pointer w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
            isDark
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          title="Switch to work on another patient"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Work on Another Patient
        </button>
      </div>
    </div>
  );
};

export default MRVisitActionCenter;
