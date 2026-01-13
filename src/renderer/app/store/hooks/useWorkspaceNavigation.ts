import { useDispatch, useSelector } from 'react-redux';
import { 
  navigate, 
  back, 
  resetNavigation,
  navigateBackToOperation,
  setLoading,
  updatePayload,
  clearPayload,
} from '../slices/moduleNavigationSlice';
import type { RootState } from '../rootReducer';
import { useCallback } from 'react';

export const useWorkspaceNavigation = () => {
  const dispatch = useDispatch();
  const { current, history, isLoading } = useSelector(
    (state: RootState) => state.moduleNavigation
  );

  /**
   * Navigate to an operation/action with optional payload
   */
  const navigateTo = useCallback((
    operation: string,
    action?: string,
    payload?: unknown
  ) => {
    dispatch(navigate({ operation, action, payload }));
  }, [dispatch]);

  /**
   * Navigate to a specific view within an operation
   * (Convenience method for better readability)
   */
  const navigateToView = useCallback((
    view: string,
    payload?: unknown
  ) => {
    // Assuming view includes both operation and action, e.g., 'inventory:stock_overview'
    const [operation, action] = view.includes(':') 
      ? view.split(':')
      : [current.operation, view];
    
    dispatch(navigate({ operation, action, payload }));
  }, [dispatch, current.operation]);

  /**
   * Navigate to an operation (without specific action)
   */
  const navigateToOperation = useCallback((
    operation: string,
    payload?: unknown
  ) => {
    dispatch(navigate({ operation, payload }));
  }, [dispatch]);

  /**
   * Go back to previous state
   */
  const goBack = useCallback(() => {
    dispatch(back());
  }, [dispatch]);

  /**
   * Go back to a specific operation
   */
  const goBackToOperation = useCallback((operation: string) => {
    dispatch(navigateBackToOperation(operation));
  }, [dispatch]);

  /**
   * Go back multiple steps
   */
  const goBackMultiple = useCallback((steps: number = 1) => {
    for (let i = 0; i < steps; i++) {
      dispatch(back());
    }
  }, [dispatch]);

  /**
   * Reset navigation to overview
   */
  const resetToOverview = useCallback(() => {
    dispatch(resetNavigation());
  }, [dispatch]);

  /**
   * Check if currently in a specific operation
   */
  const isCurrentOperation = useCallback((operation: string): boolean => {
    return current.operation === operation;
  }, [current.operation]);

  /**
   * Check if currently in a specific view
   */
  const isCurrentView = useCallback((operation: string, action?: string): boolean => {
    if (!action) {
      return current.operation === operation;
    }
    return current.operation === operation && current.action === action;
  }, [current.operation, current.action]);

  /**
   * Get current payload
   */
  const getCurrentPayload = useCallback(<T = unknown>(): T | undefined => {
    return current.payload as T | undefined;
  }, [current.payload]);

  /**
   * Update current payload
   */
  const updateCurrentPayload = useCallback((payload: unknown) => {
    dispatch(updatePayload(payload));
  }, [dispatch]);

  /**
   * Clear current payload
   */
  const clearCurrentPayload = useCallback(() => {
    dispatch(clearPayload());
  }, [dispatch]);

  /**
   * Set loading state
   */
  const setNavigationLoading = useCallback((loading: boolean) => {
    dispatch(setLoading(loading));
  }, [dispatch]);

  /**
   * Get the last N history items
   */
  const getRecentHistory = useCallback((limit: number = 5) => {
    return history.slice(-limit);
  }, [history]);

  /**
   * Check if can go back
   */
  const canGoBack = useCallback(() => {
    return history.length > 0;
  }, [history.length]);

  return {
    // State
    current,
    history,
    isLoading,
    
    // Navigation actions
    navigateTo,
    navigateToView,
    navigateToOperation,
    goBack,
    goBackToOperation,
    goBackMultiple,
    resetToOverview,
    
    // State queries
    isCurrentOperation,
    isCurrentView,
    canGoBack,
    getRecentHistory,
    
    // Payload management
    getCurrentPayload,
    updateCurrentPayload,
    clearCurrentPayload,
    
    // Loading state
    setNavigationLoading,
    
    // Legacy/compatibility methods
    getContextData: getCurrentPayload, // Alias for compatibility
    clearContextData: clearCurrentPayload, // Alias for compatibility
  };
};

// Type exports for convenience
export type { NavigationState } from '../slices/moduleNavigationSlice';