import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveVisitId } from '../../../../../../../app/store/slices/visitSlice';
import { useGetRequestWithItems, useGetRequestsByVisit } from '../../../../../api/lab/LabQueries';
import { LabRequestStatus, type LabRequest } from '../../../../../api/lab/LabTypes';
import { LabRequestResultsPreviewModal } from '../../labrequest-form-components/LabRequestResultsPreviewModal';
import type { LabResultHydratedMap } from '../../labresult-form-components/labResultForm.types';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';

interface LabResultReportLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: 'preview' | 'print' | 'download';
  theme?: 'light' | 'dark';
}

export const LabResultReportLauncher: React.FC<LabResultReportLauncherProps> = ({
  isOpen,
  onClose,
  initialAction = 'preview',
}) => {
  const activeVisitId = useSelector(selectActiveVisitId);
  const { showToast } = useToast();

  const visitNumericId = activeVisitId ? Number(activeVisitId) : 0;
  const visitRequestsQuery = useGetRequestsByVisit(visitNumericId, {
    enabled: !!visitNumericId && isOpen,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  const resolvedRequest = useMemo<LabRequest | null>(() => {
    const requests = visitRequestsQuery.data ?? [];
    if (!requests.length) return null;

    const activeStatuses = [LabRequestStatus.IN_PROGRESS, LabRequestStatus.COMPLETED];
    const activeRequests = requests.filter((request) => activeStatuses.includes(request.status));
    const candidatePool = activeRequests.length ? activeRequests : requests;

    const sorted = [...candidatePool].sort((a, b) => {
      const aTime = new Date(a.updated_at ?? a.created_at).getTime();
      const bTime = new Date(b.updated_at ?? b.created_at).getTime();
      return bTime - aTime;
    });

    return sorted[0] ?? null;
  }, [visitRequestsQuery.data]);

  const requestUuid = resolvedRequest?.request_uuid ?? '';

  const requestQuery = useGetRequestWithItems(requestUuid, {
    enabled: !!requestUuid && isOpen,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  const request = useMemo<LabRequest | null>(() => {
    // Unwrap payload if it's an ApiResponse<LabRequest>
    const unwrap = (payload: unknown): LabRequest | null => {
      if (!payload || typeof payload !== 'object') return null;
      const candidate = payload as Partial<LabRequest>;
      if (typeof candidate.request_uuid === 'string') return candidate as LabRequest;
      const nested = payload as { data?: Partial<LabRequest> };
      if (nested.data && typeof nested.data.request_uuid === 'string') {
        return nested.data as LabRequest;
      }
      return null;
    };
    return unwrap(requestQuery.data) ?? resolvedRequest;
  }, [requestQuery.data, resolvedRequest]);
  const isLoading =
    visitRequestsQuery.isLoading ||
    requestQuery.isLoading ||
    visitRequestsQuery.isFetching ||
    requestQuery.isFetching;

  const resultsMap = useMemo<LabResultHydratedMap>(() => {
    const map: LabResultHydratedMap = {};
    if (!request?.items || !Array.isArray(request.items)) return map;

    request.items.forEach((item) => {
      map[item.item_uuid] = Array.isArray(item.results) ? item.results : [];
    });

    return map;
  }, [request]);

  useEffect(() => {
    if ((visitRequestsQuery.isError || requestQuery.isError) && isOpen) {
      const errorMessage =
        (visitRequestsQuery.error as Error)?.message ||
        (requestQuery.error as Error)?.message ||
        'Failed to load lab result data';
      showToast('error', errorMessage, 3000);
    }
  }, [isOpen, requestQuery.error, requestQuery.isError, showToast, visitRequestsQuery.error, visitRequestsQuery.isError]);

  if (!activeVisitId) {
    if (isOpen) {
      showToast('warning', 'No active visit selected', 3000);
      onClose();
    }
    return null;
  }

  return (
    <LabRequestResultsPreviewModal
      open={isOpen}
      onClose={onClose}
      request={request}
      resultsMap={resultsMap}
      initialAction={initialAction}
      isLoading={isLoading}
    />
  );
};

export default LabResultReportLauncher;
