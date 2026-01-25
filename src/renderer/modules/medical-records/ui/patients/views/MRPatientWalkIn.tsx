import React, { useState } from 'react';
import { ArrowRight, Stethoscope, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import WalkInSessionCreator from '../../../../pharmacy/ui/dispensing/dispensing-medication/views/WalkInSessionCreator';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../app/routes/routeConstants';
import { type WalkInSession } from '../../../../pharmacy/api/dispensing/customer-walkin/useCustomerWalkInTypes';

interface MRPatientWalkInProps {
  theme?: 'light' | 'dark';
  customFacilityId?: number;
  className?: string;
}

const MRPatientWalkIn: React.FC<MRPatientWalkInProps> = ({
  theme = 'light',
  customFacilityId,
  className,
}) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [createdSession, setCreatedSession] = useState<WalkInSession | null>(null);

  const handleSessionCreated = (session: WalkInSession) => {
    setCreatedSession(session);
  };

  const handleProceed = () => {
    if (!createdSession) return;
    
    const { patient_id, visit_id } = createdSession.ui_next.params;
    
    navigate(MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER, {
      state: {
        patientId: patient_id,
        visitId: visit_id,
        isWalkIn: true,
        sessionData: createdSession,
        department: 'medical_records',
      },
    });
  };

  const handleNewSession = () => {
    setCreatedSession(null);
  };

  // After session creation
  if (createdSession) {
    return (
      <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} ${className}`}>
        <div className="max-w-2xl mx-auto">
          <div className={`rounded-xl border p-8 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                isDark ? 'bg-green-900/30' : 'bg-green-100'
              }`}>
                <Stethoscope className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Medical Walk-in Ready</h3>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Patient is ready for medical records management
              </p>
            </div>
            
            <button
              onClick={handleProceed}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } active:scale-[0.98]`}
            >
              <FileText className="w-5 h-5" />
              Proceed to Medical Records
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleNewSession}
              className={`w-full mt-4 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              } active:scale-[0.98]`}
            >
              Start Another Walk-in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Before session creation
  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} ${className}`}>
      <div className="max-w-2xl mx-auto">
        <WalkInSessionCreator
          theme={theme}
          onSessionCreated={handleSessionCreated}
          createButtonText="Start Medical Walk-in"
          customFacilityId={customFacilityId}
        />
      </div>
    </div>
  );
};

export default MRPatientWalkIn;