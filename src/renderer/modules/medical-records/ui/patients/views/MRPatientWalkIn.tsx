// MRPatientWalkIn.tsx (Simplified)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';

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
    
    // Navigate directly to action center - the visit is already persisted in Redux
    navigate(MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER, { replace: true });
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
                <FileText className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Walk-in Ready</h3>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Patient is ready for medical records management
              </p>
              <p className={`mt-2 text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                Patient: {createdSession.walkin.display_name || 'Walk-in Patient'}
              </p>
            </div>
            
            <button
              onClick={handleProceed}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30'
                  : 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30'
              } active:scale-[0.98] transform hover:-translate-y-0.5`}
            >
              <FileText className="w-5 h-5" />
              Proceed
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Before session creation - pass autoPersistToRedux prop
  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} ${className}`}>
      <div className="max-w-2xl mx-auto">
        <WalkInSessionCreator
          theme={theme}
          onSessionCreated={handleSessionCreated}
          createButtonText="Quick Start"
          customFacilityId={customFacilityId}
          autoPersistToRedux={true} // This ensures the visit is persisted immediately
        />
      </div>
    </div>
  );
};

export default MRPatientWalkIn;