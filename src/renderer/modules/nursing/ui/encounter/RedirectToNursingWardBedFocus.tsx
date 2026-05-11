import React, { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ThemeProp } from '../../../../app/routes/modules/shared/routeUtils';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import { FOCUS_MODE_ROUTES } from '../../../../app/routes/utils/forwardPatientFocus';

/**
 * Replaces `/nursing/nursing-encounter/ward-bed` with the Ward & Bed focus route so the UI only appears in {@link FocusedModeLayout}.
 */
export const RedirectToNursingWardBedFocus: React.FC<ThemeProp> = ({ theme }) => {
  const navigate = useNavigate();

  useLayoutEffect(() => {
    navigate(FOCUS_MODE_ROUTES.NURSING_WARD_BED_FOCUS, { replace: true });
  }, [navigate]);

  return <LoadingSkeleton variant="default" theme={theme} message="Opening Ward & Bed…" />;
};

export default RedirectToNursingWardBedFocus;
