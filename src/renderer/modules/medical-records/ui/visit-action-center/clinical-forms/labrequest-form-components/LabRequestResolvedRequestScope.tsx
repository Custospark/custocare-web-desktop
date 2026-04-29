import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';

import type { LabRequest } from '../../../../api/lab/LabTypes';
import { LabRequestStatus } from '../../../../api/lab/LabTypes';
import {
  useGetRequestWithItems,
  useGetRequestsByVisit,
} from '../../../../api/lab/LabQueries';

interface LabRequestResolvedRequestScopeProps {
  existingRequest: LabRequest | null;
  visitNumericId: number;
  createdRequestUuid: string | null;
  children: React.ReactNode;
}

interface LabRequestResolvedRequestContextValue {
  currentRequest: LabRequest | null;
  currentRequestUuid: string;
  resolvedExistingRequest: LabRequest | null;
  isLoadingInitial: boolean;
  refetchVisitRequests: () => Promise<void>;
  refetchCurrentRequest: () => Promise<void>;
}

const LabRequestResolvedRequestContext =
  createContext<LabRequestResolvedRequestContextValue | null>(null);

const extractLabRequest = (payload: unknown): LabRequest | null => {
  if (!payload || typeof payload !== 'object') return null;

  const directCandidate = payload as Partial<LabRequest>;
  if (typeof directCandidate.request_uuid === 'string') {
    return directCandidate as LabRequest;
  }

  const nestedCandidate = payload as { data?: Partial<LabRequest> };
  if (nestedCandidate.data && typeof nestedCandidate.data.request_uuid === 'string') {
    return nestedCandidate.data as LabRequest;
  }

  return null;
};

export const LabRequestResolvedRequestScope: React.FC<
  LabRequestResolvedRequestScopeProps
> = ({ existingRequest, visitNumericId, createdRequestUuid, children }) => {
  const visitRequestsQuery = useGetRequestsByVisit(visitNumericId, {
    enabled: !!visitNumericId && !existingRequest,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const resolvedExistingRequest = useMemo<LabRequest | null>(() => {
    if (existingRequest) return existingRequest;

    const requests = visitRequestsQuery.data ?? [];
    if (requests.length === 0) return null;

    const activeStatuses = [
      LabRequestStatus.PENDING,
      LabRequestStatus.IN_PROGRESS,
    ];

    const activeRequests = requests.filter((request) =>
      activeStatuses.includes(request.status)
    );

    const candidatePool = activeRequests.length > 0 ? activeRequests : requests;

    const sorted = [...candidatePool].sort((a, b) => {
      const aTime = new Date(a.updated_at ?? a.created_at).getTime();
      const bTime = new Date(b.updated_at ?? b.created_at).getTime();
      return bTime - aTime;
    });

    return sorted[0] ?? null;
  }, [existingRequest, visitRequestsQuery.data]);

  const currentRequestUuid = useMemo(
    () =>
      existingRequest?.request_uuid ||
      createdRequestUuid ||
      resolvedExistingRequest?.request_uuid ||
      '',
    [
      createdRequestUuid,
      existingRequest?.request_uuid,
      resolvedExistingRequest?.request_uuid,
    ]
  );

  const currentRequestQuery = useGetRequestWithItems(currentRequestUuid, {
    enabled: !!currentRequestUuid,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const currentRequest = useMemo<LabRequest | null>(() => {
    return (
      extractLabRequest(currentRequestQuery.data) ||
      existingRequest ||
      resolvedExistingRequest ||
      null
    );
  }, [currentRequestQuery.data, existingRequest, resolvedExistingRequest]);

  const isLoadingInitial =
    visitRequestsQuery.isLoading ||
    (!!currentRequestUuid && currentRequestQuery.isLoading);

  const refetchVisitRequests = useCallback(async () => {
    if (!visitNumericId) return;
    await visitRequestsQuery.refetch();
  }, [visitNumericId, visitRequestsQuery]);

  const refetchCurrentRequest = useCallback(async () => {
    if (!currentRequestUuid) return;
    await currentRequestQuery.refetch();
  }, [currentRequestQuery, currentRequestUuid]);

  const value = useMemo<LabRequestResolvedRequestContextValue>(
    () => ({
      currentRequest,
      currentRequestUuid,
      resolvedExistingRequest,
      isLoadingInitial,
      refetchVisitRequests,
      refetchCurrentRequest,
    }),
    [
      currentRequest,
      currentRequestUuid,
      resolvedExistingRequest,
      isLoadingInitial,
      refetchVisitRequests,
      refetchCurrentRequest,
    ]
  );

  return (
    <LabRequestResolvedRequestContext.Provider value={value}>
      {children}
    </LabRequestResolvedRequestContext.Provider>
  );
};

export const useLabRequestResolvedRequest = (): LabRequestResolvedRequestContextValue => {
  const context = useContext(LabRequestResolvedRequestContext);

  if (!context) {
    throw new Error(
      'useLabRequestResolvedRequest must be used within LabRequestResolvedRequestScope'
    );
  }

  return context;
};