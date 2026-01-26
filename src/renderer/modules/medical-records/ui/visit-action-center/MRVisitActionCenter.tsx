// components/medical-records/MRVisitActionCenter.tsx
import React, { useEffect } from 'react';
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

  // Redirect only if there's no active visit at all
  useEffect(() => {
    if (!hasActiveVisit) {
      console.log('No active visit found, redirecting to queue...');
      navigate(MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE, { replace: true });
    }
  }, [hasActiveVisit, navigate]);

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

  // Show loading/redirect state if no active visit
  if (!hasActiveVisit) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-8 ${
        theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="text-center max-w-md">
          <FileText className={`w-16 h-16 mx-auto mb-6 ${
            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h2 className="text-2xl font-bold mb-4">No Active Visit</h2>
          <p className={`mb-6 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Redirecting to patient queue...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BaseActionWorkspace
        title="Medical Records"
        icon={<FileText className="w-6 h-6" />}
        theme={theme}
        defaultActionTo={MEDICAL_RECORDS_ROUTES.GET_COMPLAINTS} // Changed to start with Get Complaints
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
      <PatientContextSection 
        theme={theme}
        patient={patient}
        visitInfo={visitInfo}
        visitContext={visitContext}
        visitPhase={visitPhase}
        visitUuid={visitUuid}
        formatTime={formatTime}
        calculateWaitTime={calculateWaitTime}
        getPhaseDisplayName={getPhaseDisplayName}
      />
    </div>
  );
};

// Patient Context Sub-component (keep the same as before)
interface PatientContextSectionProps {
  theme: 'light' | 'dark';
  patient: ReturnType<typeof selectActivePatient>;
  visitInfo: ReturnType<typeof selectActiveVisitInfo>;
  visitContext: ReturnType<typeof selectVisitContext>;
  visitPhase: ReturnType<typeof selectActiveVisitPhase>;
  visitUuid: ReturnType<typeof selectActiveVisitUuid>;
  formatTime: (dateString: string | null) => string;
  calculateWaitTime: (arrivedAt: string | null) => string;
  getPhaseDisplayName: (phase: string) => string;
}

const PatientContextSection: React.FC<PatientContextSectionProps> = ({
  theme,
  patient,
  visitInfo,
  visitContext,
  visitPhase,
  visitUuid,
  formatTime,
  calculateWaitTime,
  getPhaseDisplayName
}) => {
  const isDark = theme === 'dark';
  
  // Check if we have patient data
  const hasPatientData = patient && patient.name;
  const hasVisitData = visitInfo && visitInfo.uuid;
  
  if (!hasPatientData || !hasVisitData) {
    return (
      <div className={`rounded-lg p-4 mb-6 ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="text-center py-4">
          <div className={`p-3 rounded-lg inline-flex mb-3 ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <User className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
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
    <div className={`rounded-lg p-4 mb-6 ${
      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isDark ? 'bg-blue-900/30' : 'bg-blue-100'
          }`}>
            <User className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Active Patient</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {getPhaseDisplayName(visitPhase || '')} • {formatTime(visitInfo.arrivedAt)}
            </p>
          </div>
        </div>
        <div className={`text-xs px-2 py-1 rounded ${
          isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
        }`}>
          ID: {visitUuid?.substring(0, 8) || 'N/A'}
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Patient Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Patient Name
            </div>
            <div className="font-semibold text-lg">{patient.name}</div>
          </div>
          
          <div>
            <div className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Patient Number
            </div>
            <div className="font-mono font-semibold">{patient.patient_number || 'N/A'}</div>
          </div>
        </div>
        
        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <Calendar className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>DOB</div>
              <div className="text-sm font-medium">
                {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
          
          <div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sex</div>
            <div className="text-sm font-medium">{patient.biological_sex || 'N/A'}</div>
          </div>
          
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
            <div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Blood Type</div>
              <div className="text-sm font-medium">{patient.blood_type || 'Unknown'}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
            <div>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Wait Time</div>
              <div className="text-sm font-medium">{calculateWaitTime(visitInfo.arrivedAt)}</div>
            </div>
          </div>
        </div>
        
        {/* Status Indicators */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-700">
          {patient.requires_isolation && (
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
              isDark 
                ? 'bg-yellow-900/30 text-yellow-300' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              <Shield className="w-3 h-3" />
              Isolation Required
            </div>
          )}
          
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
            isDark 
              ? 'bg-orange-900/30 text-orange-300' 
              : 'bg-orange-100 text-orange-800'
          }`}>
            <Activity className="w-3 h-3" />
            Acuity: {visitInfo.acuity || 'N/A'}
          </div>
          
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
            isDark 
              ? 'bg-purple-900/30 text-purple-300' 
              : 'bg-purple-100 text-purple-800'
          }`}>
            <FileText className="w-3 h-3" />
            {visitInfo.type ? visitInfo.type.replace('_', ' ') : 'N/A'}
          </div>
        </div>
        
        {/* Staff Context */}
        {visitContext?.staffId && (
          <div className={`text-xs pt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Attending: {visitContext.staffId}
          </div>
        )}
      </div>
    </div>
  );
};

export default MRVisitActionCenter;