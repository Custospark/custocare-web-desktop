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
  ArrowLeft,
} from 'lucide-react';
import { FaNotesMedical } from 'react-icons/fa';
import { RootState } from '../../../../app/store/rootReducer';
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
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              Go to Patient Queue
            </button>

            <button
              onClick={() => navigate(MEDICAL_RECORDS_ROUTES.PATIENTS_REGISTER)}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              Create New Patient
            </button>

            <button
              onClick={() => navigate(MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH)}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300'
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
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
  visitContext,
  visitPhase,
  visitUuid,
  formatTime,
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
      <div className={`rounded-xl p-6 sticky top-6 ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-lg'
      }`}>
        <div className="text-center py-8">
          <div className={`p-4 rounded-lg inline-flex mb-4 ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
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
    <div className={`rounded-xl overflow-hidden sticky top-6 ${
      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-lg'
    }`}>
      {/* Header with gradient */}
      <div className={`p-5 ${
        isDark 
          ? 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-b border-gray-700' 
          : 'bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2.5 rounded-lg ${
            isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'
          }`}>
            <User className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm uppercase tracking-wide opacity-70">Current Patient</h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {getPhaseDisplayName(visitPhase || '')}
            </p>
          </div>
        </div>
        
        {/* Visit ID Badge */}
        <div className={`inline-flex text-xs px-2.5 py-1 rounded-full font-mono ${
          isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-white/60 text-gray-700'
        }`}>
          ID: {visitUuid?.substring(0, 8) || 'N/A'}
        </div>
      </div>

      {/* Patient Details */}
      <div className="p-5 space-y-4">
        {/* Patient Name */}
        <div>
          <div className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Patient Name
          </div>
          <div className="text-xl font-bold">{patient.name}</div>
        </div>

        {/* Patient Number */}
        <div>
          <div className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Patient Number
          </div>
          <div className="font-mono font-semibold text-lg">{patient.patient_number || 'N/A'}</div>
        </div>

        <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />

        {/* Demographics Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <div className="flex-1">
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Date of Birth</div>
              <div className="text-sm font-medium mt-0.5">
                {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <div className="flex-1">
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sex</div>
              <div className="text-sm font-medium mt-0.5">{patient.biological_sex || 'N/A'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Activity className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
            <div className="flex-1">
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Blood Type</div>
              <div className="text-sm font-medium mt-0.5">{patient.blood_type || 'Unknown'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
            <div className="flex-1">
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Wait Time</div>
              <div className="text-sm font-semibold mt-0.5">{calculateWaitTime(visitInfo.arrivedAt)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
            <div className="flex-1">
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Arrival Time</div>
              <div className="text-sm font-medium mt-0.5">{formatTime(visitInfo.arrivedAt)}</div>
            </div>
          </div>
        </div>

        <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />

        {/* Status Badges */}
        <div className="space-y-2">
          {patient.requires_isolation && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              isDark 
                ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/50' 
                : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            }`}>
              <Shield className="w-4 h-4" />
              Isolation Required
            </div>
          )}
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
            isDark 
              ? 'bg-orange-900/30 text-orange-300 border border-orange-700/50' 
              : 'bg-orange-50 text-orange-800 border border-orange-200'
          }`}>
            <Activity className="w-4 h-4" />
            Acuity Level: {visitInfo.acuity || 'N/A'}
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
            isDark 
              ? 'bg-purple-900/30 text-purple-300 border border-purple-700/50' 
              : 'bg-purple-50 text-purple-800 border border-purple-200'
          }`}>
            <FileText className="w-4 h-4" />
            {visitInfo.type ? visitInfo.type.replace('_', ' ') : 'N/A'}
          </div>
        </div>

        {/* Staff Context */}
        {visitContext?.staffId && (
          <div className={`pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Attending Staff
            </div>
            <div className="text-sm font-medium mt-1">{visitContext.staffId}</div>
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
        <button
          onClick={() => navigate(MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE)}
          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            isDark
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title="Switch to another patient"
        >
          <ArrowLeft className="w-4 h-4" />
          Switch Patient
        </button>
      </div>
    </div>
  );
};

export default MRVisitActionCenter;