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
  ChevronRight,
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

  // Show options if no active visit
  if (!hasActiveVisit) {
    return (
      <NoActiveVisitView theme={theme} navigate={navigate} />
    );
  }

  return (
    <div className="space-y-6">
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
        navigate={navigate}
      />
    </div>
  );
};

// No Active Visit View Component
interface NoActiveVisitViewProps {
  theme: 'light' | 'dark';
  navigate: (path: string) => void;
}

const NoActiveVisitView: React.FC<NoActiveVisitViewProps> = ({ theme, navigate }) => {
  const isDark = theme === 'dark';
  
  const actionCards = [
    {
      title: "Select from Queue",
      description: "Choose a patient from your waiting queue",
      icon: <Users className="w-8 h-8" />,
      onClick: () => navigate(MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE),
      color: isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200',
      iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
      buttonText: "View Queue"
    },
    {
      title: "Create New Patient",
      description: "Register a new patient and start visit",
      icon: <UserPlus className="w-8 h-8" />,
      onClick: () => navigate(MEDICAL_RECORDS_ROUTES.PATIENTS_REGISTER), // Adjust this route as needed
      color: isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200',
      iconColor: isDark ? 'text-green-400' : 'text-green-600',
      buttonText: "Create Patient"
    },
    {
      title: "Search Patient",
      description: "Find existing patient by name or ID",
      icon: <Search className="w-8 h-8" />,
      onClick: () => navigate(MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH), // Adjust this route as needed
      color: isDark ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200',
      iconColor: isDark ? 'text-purple-400' : 'text-purple-600',
      buttonText: "Search"
    }
  ];

  return (
    <div className={`min-h-screen p-4 md:p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className={`inline-flex p-4 rounded-2xl mb-6 ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
            <FileText className={`w-16 h-16 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
          <h1 className={`text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Medical Records Action Center
          </h1>
          <p className={`text-lg mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No active patient visit selected
          </p>
          <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Choose one of the options below to get started
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {actionCards.map((card, index) => (
            <div 
              key={index}
              className={`p-6 rounded-xl border-2 ${card.color} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer`}
              onClick={card.onClick}
            >
              <div className="flex flex-col items-center text-center h-full">
                <div className={`p-4 rounded-full ${isDark ? 'bg-gray-800' : 'bg-white'} mb-6`}>
                  <div className={card.iconColor}>
                    {card.icon}
                  </div>
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {card.title}
                </h3>
                <p className={`mb-6 flex-grow ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {card.description}
                </p>
                <button
                  className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
                >
                  {card.buttonText}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats/Info Section */}
        <div className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Quick Tips
            </h3>
            <div className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              Getting Started
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3 mb-2">
                <Users className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Queue Management</span>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Patients in queue are sorted by acuity and wait time
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3 mb-2">
                <FileText className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Documentation</span>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Start with Get Complaints for efficient note-taking
              </p>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3 mb-2">
                <Activity className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Active Visits</span>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Return to active visits from the queue anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Patient Context Section with "Work on Another Patient" button
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
  navigate: (path: string) => void;
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
  getPhaseDisplayName,
  navigate
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
        
        <div className="flex items-center gap-3">
          <div className={`text-xs px-2 py-1 rounded ${
            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
          }`}>
            ID: {visitUuid?.substring(0, 8) || 'N/A'}
          </div>
          
          {/* Work on Another Patient Button */}
          <button
            onClick={() => navigate(MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Work on Another Patient
          </button>
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