// MRPatientWalkIn.tsx (Simplified)
import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Loader2 } from 'lucide-react';

import WalkInSessionCreator from '../../../../pharmacy/ui/dispensing/dispensing-medication/views/WalkInSessionCreator';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../app/routes/routeConstants';
import { type WalkInSession } from '../../../../pharmacy/api/dispensing/customer-walkin/useCustomerWalkInTypes';
import { clearAll } from '../../visit-action-center/billing-space';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';

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
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const isDark = theme === 'dark';
  const [createdSession, setCreatedSession] = useState<WalkInSession | null>(null);
  const [isProceeding, setIsProceeding] = useState(false);

  const handleSessionCreated = (session: WalkInSession) => {
    setCreatedSession(session);
  };

  const handleProceed = useCallback(async () => {
    if (!createdSession) return;
    
    setIsProceeding(true);

    try {
      // ✅ CLEAR EXISTING DATA FIRST 
      
      // Clear billing slice state
      dispatch(clearAll());
      
      // Clear any existing billing draft from session storage
      const billingDraftKey = `billing_draft_${createdSession.visit?.visit_uuid || createdSession.walkin.patient_uuid}`;
      sessionStorage.removeItem(billingDraftKey);
      
      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Show success message
      showToast('success', `✨ Ready to care for ${createdSession.walkin.display_name || 'patient'}!`, 3000);
      
      // Navigate directly to action center - the visit is already persisted in Redux
      navigate(MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER, { replace: true });
    } catch (error) {
      console.error('Error clearing previous data:', error);
      showToast('error', 'Failed to prepare workspace. Please try again.', 4000);
    } finally {
      setIsProceeding(false);
    }
  }, [createdSession, dispatch, navigate, showToast]);

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
              <h3 className="text-xl font-semibold mb-2">✓ Walk-in Ready</h3>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Patient is ready for clinical care
              </p>
              <p className={`mt-2 text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                Patient: {createdSession.walkin.display_name || 'Walk-in Patient'}
              </p>
            </div>
            
            <button
              onClick={handleProceed}
              disabled={isProceeding}
              style={{ cursor: isProceeding ? 'wait' : 'pointer' }}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30'
                  : 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30'
              } ${isProceeding ? 'opacity-70 cursor-wait' : 'active:scale-[0.98] transform hover:-translate-y-0.5 cursor-pointer'}`}
            >
              {isProceeding ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Preparing Workspace...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Proceed to Action Center
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
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