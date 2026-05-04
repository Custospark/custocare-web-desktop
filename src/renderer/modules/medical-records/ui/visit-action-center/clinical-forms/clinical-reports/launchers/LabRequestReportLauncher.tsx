import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveVisitId } from '../../../../../../../app/store/slices/visitSlice';
import { useGetRequestWithItems, useGetRequestsByVisit } from '../../../../../api/lab/LabQueries';
import { LabRequestStatus, type LabRequest } from '../../../../../api/lab/LabTypes';
import { LabRequestPreviewModal } from '../../labrequest-form-components/LabRequestPreviewModal';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';

interface LabRequestReportLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: 'preview' | 'print' | 'download';
  theme?: 'light' | 'dark';
}

export const LabRequestReportLauncher: React.FC<LabRequestReportLauncherProps> = ({
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

    const activeStatuses = [LabRequestStatus.PENDING, LabRequestStatus.IN_PROGRESS];
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

  const request = useMemo<LabRequest | null>(
    () => requestQuery.data ?? resolvedRequest,
    [requestQuery.data, resolvedRequest]
  );

  useEffect(() => {
    if ((visitRequestsQuery.isError || requestQuery.isError) && isOpen) {
      const errorMessage =
        (visitRequestsQuery.error as Error)?.message ||
        (requestQuery.error as Error)?.message ||
        'Failed to load lab request data';
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
    <LabRequestPreviewModal
      open={isOpen}
      onClose={onClose}
      request={request}
      initialAction={initialAction}
    />
  );
};

export default LabRequestReportLauncher;
