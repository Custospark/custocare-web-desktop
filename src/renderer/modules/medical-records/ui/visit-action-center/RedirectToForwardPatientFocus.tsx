import React, { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import { FOCUS_MODE_ROUTES } from '../../../../app/routes/utils/forwardPatientFocus';

export interface RedirectToForwardPatientFocusProps {
  theme?: 'light' | 'dark';
  cancelTo: string;
  queueRedirectTo: string;
}

/**
 * Replaces the current URL with the shared Forward Patient focus route,
 * passing cancel + queue targets via `location.state`.
 */
export const RedirectToForwardPatientFocus: React.FC<RedirectToForwardPatientFocusProps> = ({
  theme = 'light',
  cancelTo,
  queueRedirectTo,
}) => {
  const navigate = useNavigate();

  useLayoutEffect(() => {
    navigate(FOCUS_MODE_ROUTES.FORWARD_PATIENT_FOCUS, {
      replace: true,
      state: { cancelTo, queueRedirectTo },
    });
  }, [navigate, cancelTo, queueRedirectTo]);

  return <LoadingSkeleton variant="default" theme={theme} message="Opening Forward Patient…" />;
};

export default RedirectToForwardPatientFocus;
