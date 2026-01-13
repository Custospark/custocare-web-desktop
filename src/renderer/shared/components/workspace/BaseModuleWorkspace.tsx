/**
 * ============================================================================
 * BASE MODULE WORKSPACE
 * ============================================================================
 *
 * A reusable, operation-driven module container.
 * Handles:
 * - Active operation state
 * - Operation switching
 * - Shared layout rendering
 *
 * This component is intentionally generic and domain-agnostic.
 */

import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { ContentLayout, Operation } from '../content/ContentLayout';
import type { RootState } from '../../../app/store/rootReducer';

export interface ModuleWorkspaceProps<TOperationId extends string> {
  contextTitle: string;
  operations: Operation[];
  defaultOperation: TOperationId;
  renderOperation: (operationId: TOperationId, theme: 'light' | 'dark') => React.ReactNode;
}

export function BaseModuleWorkspace<TOperationId extends string>({
  contextTitle,
  operations,
  defaultOperation,
  renderOperation,
}: ModuleWorkspaceProps<TOperationId>) {
  /**
   * --------------------------------------------------------------------------
   * GLOBAL STATE
   * --------------------------------------------------------------------------
   */
  const theme = useSelector((state: RootState) => state.ui.theme);
  
  // Get current navigation state from Redux
  const navigationState = useSelector((state: RootState) => 
    state.moduleNavigation.current
  );

  /**
   * --------------------------------------------------------------------------
   * LOCAL STATE
   * --------------------------------------------------------------------------
   */
  const [internalActiveOperation, setInternalActiveOperation] =
    useState<TOperationId>(defaultOperation);

  /**
   * --------------------------------------------------------------------------
   * COMPUTED STATE
   * --------------------------------------------------------------------------
   */
  // Use operation from Redux if available, otherwise use internal state
  const activeOperation = navigationState.operation 
    ? (navigationState.operation as TOperationId)
    : internalActiveOperation;

  /**
   * --------------------------------------------------------------------------
   * HANDLERS
   * --------------------------------------------------------------------------
   */
  const handleOperationChange = useCallback((operationId: string) => {
    setInternalActiveOperation(operationId as TOperationId);
  }, []);

  /**
   * --------------------------------------------------------------------------
   * RENDER
   * --------------------------------------------------------------------------
   */
  return (
    <ContentLayout
      operations={operations}
      activeOperation={activeOperation}
      onOperationChange={handleOperationChange}
      defaultOperation={defaultOperation}
      contextTitle={contextTitle}
    >
      {renderOperation(activeOperation, theme)}
    </ContentLayout>
  );
}