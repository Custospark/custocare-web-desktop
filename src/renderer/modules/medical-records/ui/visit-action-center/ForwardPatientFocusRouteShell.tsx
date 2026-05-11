import React, { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { parseForwardPatientFocusState } from '../../../../app/routes/utils/forwardPatientFocus';
import FocusedModeLayout from '../../../../shared/components/Navigation/FocusedModeLayout';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

const ForwardPatientFocusFormLazy = React.lazy(() =>
  import('./clinical-forms/form-wrappers/ForwardPatientFocus').then((m) => ({
    default: m.ForwardPatientFocusForm,
  }))
);

export interface ForwardPatientFocusRouteShellProps {
  theme?: 'light' | 'dark';
  withPatientTitle: (baseTitle: string) => string;
}

export function ForwardPatientFocusRouteShell({
  theme = 'light',
  withPatientTitle,
}: ForwardPatientFocusRouteShellProps) {
  const location = useLocation();
  const { cancelTo, queueRedirectTo } = parseForwardPatientFocusState(location.state);

  return (
    <FocusedModeLayout title={withPatientTitle('Forward Patient')} onClose={cancelTo}>
      <Suspense fallback={<LoadingSkeleton variant="dashboard" theme={theme} />}>
        <ForwardPatientFocusFormLazy
          theme={theme}
          cancelTo={cancelTo}
          queueRedirectTo={queueRedirectTo}
        />
      </Suspense>
    </FocusedModeLayout>
  );
}
