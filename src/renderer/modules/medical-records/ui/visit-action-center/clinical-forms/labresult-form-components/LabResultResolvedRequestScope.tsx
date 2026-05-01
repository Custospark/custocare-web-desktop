import React from 'react';
import { useSelector } from 'react-redux';
import {
  useGetRequestWithItemsModified,
  useGetRequestsByVisit,
} from '../../../../api/lab/LabQueries';
import type { LabResultResolvedRequestScopeRenderPayload } from './labResultForm.types';
import { LabResultEmptyState } from './LabResultEmptyState';
import { LabResultErrorState } from './LabResultErrorState';
import { LabResultLoadingState } from './LabResultLoadingState';
import { selectActiveVisitId } from '../../../../../../app/store/slices/visitSlice';
import { selectTheme } from '../../../../../../app/store/slices/uiSlice';

interface LabResultResolvedRequestScopeProps {
  /** Optional explicit request UUID – if provided, it takes precedence */
  requestUuid?: string | null;
  children: (payload: LabResultResolvedRequestScopeRenderPayload) => React.ReactNode;
}

export const LabResultResolvedRequestScope: React.FC<
  LabResultResolvedRequestScopeProps
> = ({ requestUuid: explicitRequestUuid, children }) => {
  // 1. Get active visit ID and theme from Redux
  const activeVisitId = useSelector(selectActiveVisitId);
  const globalTheme = useSelector(selectTheme);
  const isDark = globalTheme === 'dark';

  // 2. If no explicit UUID, fetch all lab requests for the active visit
  const {
    data: visitRequests,
    isLoading: isLoadingVisitRequests,
    isError: isErrorVisitRequests,
    refetch: refetchVisitRequests,
  } = useGetRequestsByVisit(activeVisitId ?? 0, {
    enabled: !explicitRequestUuid && !!activeVisitId,
  });

  // Extract the first request's UUID from the visit's requests
  const derivedRequestUuid = visitRequests && visitRequests.length > 0 
    ? visitRequests[0].request_uuid 
    : null;

  // Final UUID: explicit takes precedence, otherwise derived from visit
  const resolvedRequestUuid = explicitRequestUuid ?? derivedRequestUuid;

  // 3. Fetch the full request details (with items and results)
  const {
    data: request,
    isLoading: isLoadingRequest,
    isFetching,
    isError: isErrorRequest,
    refetch: refetchRequest,
    error,
  } = useGetRequestWithItemsModified(resolvedRequestUuid || '', {
    // Only enable if we have a valid UUID string
    enabled: !!resolvedRequestUuid && resolvedRequestUuid.length > 0,
  });

  // --- Loading states ---
  // If we are resolving from visit and the visit requests are still loading
  if (!explicitRequestUuid && isLoadingVisitRequests) {
    return (
      <LabResultLoadingState
        message="Loading active visit and lab requests..."
        theme={isDark ? 'dark' : 'light'}
      />
    );
  }

  // If the main request is loading (and we have a UUID to fetch)
  if (!!resolvedRequestUuid && isLoadingRequest) {
    return (
      <LabResultLoadingState
        message="Loading lab request and requested tests..."
        theme={isDark ? 'dark' : 'light'}
      />
    );
  }

  // --- Error states ---
  // No active visit and no explicit UUID
  if (!explicitRequestUuid && !activeVisitId) {
    return (
      <LabResultEmptyState
        title="No active visit selected"
        description="Please select a patient visit from the queue before accessing lab results."
      />
    );
  }

  // No explicit UUID, visit has no lab requests, and we're done loading
  if (!explicitRequestUuid && (!visitRequests || visitRequests.length === 0) && !isLoadingVisitRequests) {
    return (
      <LabResultEmptyState
        title="No lab requests found for this visit"
        description="No lab tests have been requested for the current active visit."
      />
    );
  }

  // Error fetching visit requests
  if (!explicitRequestUuid && isErrorVisitRequests) {
    return (
      <LabResultErrorState
        title="Unable to load lab requests for this visit"
        description="There was a problem fetching the visit's lab requests."
        onRetry={() => void refetchVisitRequests()}
      />
    );
  }

  // We have a resolved UUID but no request data (error or empty)
  if (resolvedRequestUuid && (isErrorRequest || !request)) {
    return (
      <LabResultErrorState
        title="Unable to load lab request"
        description={error?.message || 'The selected request could not be resolved.'}
        onRetry={() => void refetchRequest()}
      />
    );
  }

  // No request data when we expected some
  if (resolvedRequestUuid && !request && !isLoadingRequest) {
    return (
      <LabResultEmptyState
        title="Lab request not found"
        description="The requested lab request could not be found or you may not have permission to view it."
      />
    );
  }

  // If we have no UUID at all (explicit nor derived) and not in any loading/error state
  if (!resolvedRequestUuid && !isLoadingVisitRequests && !isLoadingRequest) {
    return (
      <LabResultEmptyState
        title="No lab request available"
        description="There is no active lab request for this visit. Please create one first."
      />
    );
  }

  // --- Success: we have a valid request ---
  if (request) {
    return <>{children({ request, refetch: refetchRequest, isFetching })}</>;
  }

  // Fallback: should not reach here, but just in case
  return (
    <LabResultEmptyState
      title="Unable to load lab request"
      description="An unexpected error occurred. Please try again."
    />
  );
};

export default LabResultResolvedRequestScope;