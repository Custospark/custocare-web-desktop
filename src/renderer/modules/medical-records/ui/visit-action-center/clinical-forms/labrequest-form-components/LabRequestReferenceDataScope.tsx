import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';

import type {
  ActiveTemplatesResponse,
  ApiResponse,
  LabTemplate,
  LabTest,
  LabTestFilters,
  PaginatedResponse,
} from '../../../../api/lab/LabTypes';
import {
  useGetActiveTemplates,
  useGetLabTests,
  useGetPopularTests,
} from '../../../../api/lab/LabQueries';

interface LabRequestReferenceDataScopeProps {
  facilityId?: number | null;
  children: React.ReactNode;
}

interface LabRequestReferenceDataContextValue {
  templates: LabTemplate[];
  labItems: LabTest[];
  popularLabItems: LabTest[];
  refetchReferenceData: () => Promise<void>;
}

const LabRequestReferenceDataContext =
  createContext<LabRequestReferenceDataContextValue | null>(null);

const extractTemplates = (payload: unknown): LabTemplate[] => {
  if (!payload || typeof payload !== 'object') return [];

  const direct = payload as ActiveTemplatesResponse;
  if (Array.isArray(direct.templates)) return direct.templates;

  const apiPayload = payload as ApiResponse<ActiveTemplatesResponse>;
  if (Array.isArray(apiPayload.data?.templates)) return apiPayload.data.templates;

  return [];
};

const extractLabItems = (payload: unknown): LabTest[] => {
  // Return empty array if payload is falsy or not an object
  if (!payload || typeof payload !== 'object') return [];

  // Case 1: payload is already an array
  if (Array.isArray(payload)) return payload as LabTest[];

  // Case 2: payload has direct data array: { data: LabTest[], meta: {...} }
  const withDirectData = payload as { data: LabTest[]; meta?: unknown };
  if (Array.isArray(withDirectData.data)) {
    return withDirectData.data;
  }

  // Case 3: ApiResponse with nested paginated data
  const paginatedPayload = payload as ApiResponse<PaginatedResponse<LabTest>>;
  if (Array.isArray(paginatedPayload.data?.data)) {
    console.log("Extracted paginated data:", paginatedPayload.data.data.length);
    return paginatedPayload.data.data;
  }

  // Case 4: payload has nested tests array: { data: { tests: LabTest[] } }
  const testsPayload = payload as { data?: { tests?: LabTest[] } };
  if (Array.isArray(testsPayload.data?.tests)) {
    console.log("Extracted tests array:", testsPayload.data.tests.length);
    return testsPayload.data.tests;
  }

  console.log("No matching structure found for payload:", payload);
  return [];
};

const extractPopularLabItems = (payload: unknown): LabTest[] => {
  if (Array.isArray(payload)) return payload as LabTest[];
  if (!payload || typeof payload !== 'object') return [];

  const apiPayload = payload as ApiResponse<LabTest[]>;
  if (Array.isArray(apiPayload.data)) return apiPayload.data;

  // Handle direct array in data property
  const withData = payload as { data: LabTest[] };
  if (Array.isArray(withData.data)) return withData.data;

  return [];
};

export const LabRequestReferenceDataScope: React.FC<
  LabRequestReferenceDataScopeProps
> = ({ facilityId, children }) => {
  const labTestFilters = useMemo<LabTestFilters>(
    () => ({
      facility_id: facilityId || undefined,
      is_active: true,
      per_page: 100,
      order_by: 'name',
      order_direction: 'asc',
    }),
    [facilityId]
  );

  const templatesQuery = useGetActiveTemplates(facilityId || undefined, {
    enabled: !!facilityId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const labItemsQuery = useGetLabTests(labTestFilters, {
    enabled: !!facilityId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const popularLabItemsQuery = useGetPopularTests(facilityId || 0, 12, {
    enabled: !!facilityId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const templates = useMemo(
    () => extractTemplates(templatesQuery.data),
    [templatesQuery.data]
  );

  const labItems = useMemo(
    () => extractLabItems(labItemsQuery.data),
    [labItemsQuery.data]
  );

  const popularLabItems = useMemo(
    () => extractPopularLabItems(popularLabItemsQuery.data),
    [popularLabItemsQuery.data]
  );

  const refetchReferenceData = useCallback(async () => {
    if (!facilityId) return;

    await Promise.all([
      templatesQuery.refetch(),
      labItemsQuery.refetch(),
      popularLabItemsQuery.refetch(),
    ]);
  }, [facilityId, labItemsQuery, popularLabItemsQuery, templatesQuery]);

  const value = useMemo<LabRequestReferenceDataContextValue>(
    () => ({
      templates,
      labItems,
      popularLabItems,
      refetchReferenceData,
    }),
    [templates, labItems, popularLabItems, refetchReferenceData]
  );

  return (
    <LabRequestReferenceDataContext.Provider value={value}>
      {children}
    </LabRequestReferenceDataContext.Provider>
  );
};

export const useLabRequestReferenceData = (): LabRequestReferenceDataContextValue => {
  const context = useContext(LabRequestReferenceDataContext);

  if (!context) {
    throw new Error(
      'useLabRequestReferenceData must be used within LabRequestReferenceDataScope'
    );
  }

  return context;
};