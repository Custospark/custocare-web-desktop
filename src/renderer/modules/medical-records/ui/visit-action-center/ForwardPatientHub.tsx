import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, UserPlus } from 'lucide-react';

import { FOCUS_MODE_ROUTES } from '../../../../app/routes/utils/forwardPatientFocus';
import { MEDICAL_RECORDS_ROUTES } from '../../../../app/routes/routeConstants';
import {
  selectActiveVisit,
  selectActiveVisitId,
} from '../../../../app/store/slices/visitSlice';
import { getForwardPatientColors } from './billing-space/forward-patient-components/constants';

interface ForwardPatientHubProps {
  theme?: 'light' | 'dark';
}

/**
 * In-layout entry: opens the full forward flow in focus mode (team queue or a specific person).
 */
export const ForwardPatientHub: React.FC<ForwardPatientHubProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();
  const visitId = useSelector(selectActiveVisitId);
  const activeVisit = useSelector(selectActiveVisit);

  const isDark = theme === 'dark';
  const colors = useMemo(() => getForwardPatientColors(theme), [theme]);

  const handleOpenForwardFocus = () => {
    navigate(FOCUS_MODE_ROUTES.FORWARD_PATIENT_FOCUS, {
      state: {
        cancelTo: MEDICAL_RECORDS_ROUTES.PATIENT_RECORDS,
        queueRedirectTo: MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE,
      },
    });
  };

  if (!visitId || !activeVisit) {
    return (
      <div className={`rounded-xl p-8 text-center ${colors.bg.secondary}`}>
        <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${colors.text.tertiary}`} />
        <h3 className={`text-lg font-medium mb-2 ${colors.text.primary}`}>No patient selected</h3>
        <p className={colors.text.secondary}>
          Select a patient from the queue or search first, then you can forward them to another team
          or colleague.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border ${colors.border.primary} ${colors.bg.primary} overflow-hidden`}
    >
      <div className={`p-6 border-b ${colors.border.primary}`}>
        <div className="flex items-center gap-3 mb-2">
          <UserPlus className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <div className="flex-1">
            <h2 className={`text-xl font-bold ${colors.text.primary}`}>Forward Patient</h2>
            <p className={`text-sm mt-1 ${colors.text.secondary}`}>
              Send this patient to the next step (pharmacy, lab, billing, and more) or assign them to
              a specific staff member.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          <p className={`text-sm ${colors.text.secondary}`}>
            Opens the focused workspace so you can choose a team queue or pick someone from the
            directory, with billing prompts when needed.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleOpenForwardFocus}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors cursor-pointer ${colors.bg.accent} ${colors.bg.accentHover} ${colors.text.accent}`}
            >
              Continue
              <ArrowRight className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForwardPatientHub;
