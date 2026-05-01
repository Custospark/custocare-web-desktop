import { useEffect, useMemo, useRef } from 'react';
import { useGetResultsByLabRequestItem } from '../../../../../../api/lab/LabQueries';
import type { LabResult } from '../../../../../../api/lab/LabTypes';
import { extractResultsFromResponse } from '../utils/labResultTableUtils';

export const useLabResultItems = (
  itemUuid: string,
  onResultsHydrated?: (itemUuid: string, results: LabResult[]) => void,
  refreshToken?: number
) => {
  const resultsQuery = useGetResultsByLabRequestItem(itemUuid, {
    enabled: !!itemUuid,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Store the latest results in a ref to avoid unnecessary re-renders
  const resultsRef = useRef<LabResult[]>([]);
  
  const results = useMemo(
    () => extractResultsFromResponse(resultsQuery.data),
    [resultsQuery.data]
  );

  // Update ref when results change
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  // Track if we've already hydrated to prevent multiple calls
  const hasHydratedRef = useRef<string>('');
  
  useEffect(() => {
    // Only call onResultsHydrated if:
    // 1. We have results
    // 2. The itemUuid has changed (new item)
    // 3. The results length has changed
    if (onResultsHydrated && results.length > 0 && hasHydratedRef.current !== `${itemUuid}-${results.length}`) {
      hasHydratedRef.current = `${itemUuid}-${results.length}`;
      onResultsHydrated(itemUuid, results);
    }
  }, [itemUuid, onResultsHydrated, results]);

  // Use a ref to track the previous refresh token
  const previousRefreshTokenRef = useRef<number | undefined>(undefined);
  
  useEffect(() => {
    // Only refetch when refreshToken actually changes
    if (refreshToken && refreshToken > 0 && refreshToken !== previousRefreshTokenRef.current) {
      previousRefreshTokenRef.current = refreshToken;
      void resultsQuery.refetch();
    }
  }, [refreshToken, resultsQuery]);

  return {
    results,
    loading: resultsQuery.isLoading || resultsQuery.isFetching,
    refetch: resultsQuery.refetch,
    query: resultsQuery,
  };
};