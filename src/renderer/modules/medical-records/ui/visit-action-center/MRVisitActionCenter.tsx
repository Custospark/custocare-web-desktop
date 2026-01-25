// components/medical-records/MRVisitActionCenter.tsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  User, 
  Calendar, 
  Clock, 
  AlertCircle, 
  ArrowLeft,
  Activity,
  ClipboardList,
  Stethoscope,
  Shield,
  Pill,
  Thermometer
} from 'lucide-react';

import { cn } from '../../../../shared/utils/classNameUtils';
import { MEDICAL_RECORDS_ROUTES } from '../../../../app/routes/routeConstants';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

// FIXED: Correct import path - adjust based on your project structure
import { 
  selectActiveVisit,
  selectActiveVisitInfo,
  selectHasActiveVisit,
  selectVisitContext,
  clearActiveVisit,
  selectActivePatient,
  selectActiveVisitPhase,
  selectActiveVisitUuid
} from '../../../../app/store/slices/visitSlice'; // Adjust this path!
import { RootState } from '../../../../app/store/rootReducer';
/* -------------------------------------------------------------------------- */
/*                               TYPE DEFINITIONS                             */
/* -------------------------------------------------------------------------- */

type Theme = 'light' | 'dark';

export interface MRVisitActionCenterProps {
  theme: Theme;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*                              HELPER FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

const getPhaseDisplayName = (phase: string): string => 
  phase.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const getTypeDisplayName = (type: string): string => 
  type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
};

const calculateAge = (dob: string | null): string => {
  if (!dob) return 'N/A';
  try {
    const birthDate = new Date(dob);
    const ageDiff = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    return `${years} years`;
  } catch {
    return 'N/A';
  }
};

/* -------------------------------------------------------------------------- */
/*                            MAIN COMPONENT                                  */
/* -------------------------------------------------------------------------- */

const MRVisitActionCenter: React.FC<MRVisitActionCenterProps> = ({ 
  theme, 
  className = '' 
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Select data from Redux store - FIXED: Add type annotation for useSelector
  const activeVisit = useSelector((state: RootState) => selectActiveVisit(state));
  const hasActiveVisit = useSelector((state: RootState) => selectHasActiveVisit(state));
  const visitInfo = useSelector((state: RootState) => selectActiveVisitInfo(state));
  const visitContext = useSelector((state: RootState) => selectVisitContext(state));
  const patient = useSelector((state: RootState) => selectActivePatient(state));
  const visitPhase = useSelector((state: RootState) => selectActiveVisitPhase(state));
  const visitUuid = useSelector((state: RootState) => selectActiveVisitUuid(state));
  
  const isDark = theme === 'dark';
  
  // Redirect if no active visit
  useEffect(() => {
    if (!hasActiveVisit) {
      console.log('⚠️ No active visit, redirecting to queue...');
      navigate(MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE);
    }
  }, [hasActiveVisit, navigate]);
  
  const handleBackToQueue = () => {
    dispatch(clearActiveVisit());
    navigate(MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE);
  };
  
  const handleCompleteAction = () => {
    dispatch(clearActiveVisit());
    navigate(MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE);
  };
  
  // Loading state
  if (!hasActiveVisit) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center p-8",
        isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900",
        className
      )}>
        <div className="text-center max-w-md">
          <FileText className={`w-16 h-16 mx-auto mb-6 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
          <h2 className="text-2xl font-bold mb-4">No Active Visit</h2>
          <p className={`mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Please select a visit from the queue to begin medical records documentation.
          </p>
          <button
            onClick={() => navigate(MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE)}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer mx-auto focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              isDark 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Go to Patient Queue
          </button>
        </div>
      </div>
    );
  }
  
  // Show loading if visit data is not available
  if (!activeVisit || !visitInfo) {
    return (
      <div className={cn(
        "min-h-screen p-8",
        isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900",
        className
      )}>
        <LoadingSkeleton 
          theme={theme} 
          variant="default" 
          message="Loading visit data..." 
        />
      </div>
    );
  }
  
  // Safely extract data with null checks
  const patientName = patient?.name || 'Patient';
  const patientNumber = patient?.patient_number || 'N/A';
  const patientDob = patient?.date_of_birth || null;
  const patientSex = patient?.biological_sex || 'Not specified';
  const patientBloodType = patient?.blood_type || 'Unknown';
  const requiresIsolation = patient?.requires_isolation || false;
  
  // Main content - when we have an active visit
  return (
    <div className={cn(
      "min-h-screen p-4 md:p-6 lg:p-8",
      isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900",
      className
    )}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <button
                onClick={handleBackToQueue}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 mb-4 ${
                  isDark 
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-gray-100" 
                    : "bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Queue
              </button>
              
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${isDark ? "bg-blue-900/30" : "bg-blue-100"}`}>
                  <FileText className={`w-6 h-6 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    Medical Records - {patientName}
                  </h1>
                  <p className={`mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Visit Documentation Center • {getPhaseDisplayName(visitInfo.phase)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
              <div className="text-sm font-medium mb-2">Visit Information</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Visit UUID</div>
                  <div className="font-mono text-sm truncate" title={visitInfo.uuid}>
                    {visitInfo.uuid.substring(0, 8)}...
                  </div>
                </div>
                <div>
                  <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Staff ID</div>
                  <div className="font-medium">{visitContext.staffId || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Patient Card */}
          <div className={`rounded-xl p-6 mb-6 ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Patient Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                    <User className={`w-5 h-5 ${isDark ? "text-gray-300" : "text-gray-700"}`} />
                  </div>
                  <h2 className="text-xl font-bold">Patient Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <div className={`text-sm font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Full Name</div>
                    <div className="text-lg font-semibold">{patientName}</div>
                  </div>
                  
                  <div>
                    <div className={`text-sm font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Patient Number</div>
                    <div className="text-lg font-mono">{patientNumber}</div>
                  </div>
                  
                  <div>
                    <div className={`text-sm font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Date of Birth</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(patientDob)}</span>
                      <span className={`px-2 py-1 rounded text-xs ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
                        {calculateAge(patientDob)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className={`text-sm font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Biological Sex</div>
                    <div>{patientSex}</div>
                  </div>
                  
                  <div>
                    <div className={`text-sm font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Blood Type</div>
                    <div className={`px-3 py-1 rounded-full inline-flex items-center gap-2 ${
                      patientBloodType !== 'Unknown'
                        ? isDark ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-800"
                        : isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                    }`}>
                      <Activity className="w-3 h-3" />
                      {patientBloodType}
                    </div>
                  </div>
                  
                  {requiresIsolation && (
                    <div>
                      <div className={`text-sm font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Isolation Status</div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                        isDark ? "bg-yellow-900/30 text-yellow-300" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        <Shield className="w-3 h-3" />
                        Isolation Required
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Visit Status */}
              <div className="lg:w-96">
                <div className={`p-4 rounded-lg h-full ${isDark ? "bg-gray-750" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${isDark ? "bg-purple-900/30" : "bg-purple-100"}`}>
                      <ClipboardList className={`w-5 h-5 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                    </div>
                    <h3 className="text-lg font-bold">Visit Details</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={isDark ? "text-gray-400" : "text-gray-600"}>Visit Type</span>
                      <span className="font-medium">{getTypeDisplayName(visitInfo.type)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className={isDark ? "text-gray-400" : "text-gray-600"}>Current Phase</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-800"
                      }`}>
                        {getPhaseDisplayName(visitInfo.phase)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className={isDark ? "text-gray-400" : "text-gray-600"}>Status</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        visitInfo.status === 'active' 
                          ? isDark ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-800"
                          : isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                      }`}>
                        {visitInfo.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className={isDark ? "text-gray-400" : "text-gray-600"}>Acuity Score</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                        isDark ? "bg-orange-900/30 text-orange-300" : "bg-orange-100 text-orange-800"
                      }`}>
                        <Activity className="w-3 h-3" />
                        {visitInfo.acuity}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className={isDark ? "text-gray-400" : "text-gray-600"}>Arrival Time</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(visitInfo.arrivedAt)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className={isDark ? "text-gray-400" : "text-gray-600"}>Wait Time</span>
                      <span className={`flex items-center gap-1 ${
                        activeVisit.waiting_since ? isDark ? "text-yellow-300" : "text-yellow-700" : ""
                      }`}>
                        <Clock className="w-3 h-3" />
                        {activeVisit.waiting_since ? 'Waiting...' : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Medical Records Documentation Area */}
        <div className={`rounded-xl p-6 mb-8 ${isDark ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${isDark ? "bg-green-900/30" : "bg-green-100"}`}>
              <Stethoscope className={`w-5 h-5 ${isDark ? "text-green-400" : "text-green-600"}`} />
            </div>
            <h2 className="text-xl font-bold">Medical Records Documentation</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Left Column - Clinical Notes */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Clinical Notes
              </h3>
              <div className={`rounded-lg border p-4 min-h-[200px] ${
                isDark ? "border-gray-700 bg-gray-900" : "border-gray-300 bg-gray-50"
              }`}>
                <textarea
                  placeholder="Enter clinical notes, observations, and findings..."
                  className={`w-full h-full bg-transparent border-none resize-none focus:outline-none ${
                    isDark ? "text-gray-100 placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                  }`}
                  rows={8}
                />
              </div>
            </div>
            
            {/* Right Column - Assessments */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Thermometer className="w-5 h-5" />
                Assessments & Vitals
              </h3>
              <div className={`rounded-lg border p-4 ${
                isDark ? "border-gray-700 bg-gray-900" : "border-gray-300 bg-gray-50"
              }`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Blood Pressure
                    </label>
                    <input
                      type="text"
                      placeholder="120/80"
                      className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        isDark 
                          ? "bg-gray-800 border-gray-700 text-gray-100" 
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Heart Rate
                    </label>
                    <input
                      type="text"
                      placeholder="72 bpm"
                      className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        isDark 
                          ? "bg-gray-800 border-gray-700 text-gray-100" 
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Temperature
                    </label>
                    <input
                      type="text"
                      placeholder="98.6°F"
                      className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        isDark 
                          ? "bg-gray-800 border-gray-700 text-gray-100" 
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Respiratory Rate
                    </label>
                    <input
                      type="text"
                      placeholder="16/min"
                      className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        isDark 
                          ? "bg-gray-800 border-gray-700 text-gray-100" 
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Medication Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Medications & Prescriptions
            </h3>
            <div className={`rounded-lg border p-4 ${
              isDark ? "border-gray-700 bg-gray-900" : "border-gray-300 bg-gray-50"
            }`}>
              <textarea
                placeholder="Enter medications, dosages, and administration instructions..."
                className={`w-full bg-transparent border-none resize-none focus:outline-none ${
                  isDark ? "text-gray-100 placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                }`}
                rows={4}
              />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <AlertCircle className={`w-5 h-5 ${isDark ? "text-yellow-400" : "text-yellow-600"}`} />
              <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                All changes are auto-saved. Visit will remain active until completed.
              </span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleBackToQueue}
                className={`px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500/20 ${
                  isDark 
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-gray-100" 
                    : "bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-300"
                }`}
              >
                Cancel & Return
              </button>
              
              <button
                onClick={handleCompleteAction}
                className={`px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500/20 ${
                  isDark 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                Complete Documentation
              </button>
            </div>
          </div>
        </div>
        
        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className={`mt-8 p-4 rounded-lg text-sm font-mono ${
            isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
          }`}>
            <div className="font-bold mb-2">Debug Info:</div>
            <div>Visit UUID: {visitUuid}</div>
            <div>Phase: {visitPhase}</div>
            <div>Staff Context: {visitContext.staffId}</div>
            <div>Entered at: {formatTime(visitContext.enteredAt)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MRVisitActionCenter;