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

  /**
   * --------------------------------------------------------------------------
   * LOCAL STATE
   * --------------------------------------------------------------------------
   */
  const [activeOperation, setActiveOperation] =
    useState<TOperationId>(defaultOperation);

  /**
   * --------------------------------------------------------------------------
   * HANDLERS
   * --------------------------------------------------------------------------
   */
  const handleOperationChange = useCallback((operationId: string) => {
    setActiveOperation(operationId as TOperationId);
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
