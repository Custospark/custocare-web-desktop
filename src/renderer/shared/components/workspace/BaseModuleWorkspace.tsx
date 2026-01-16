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

import React, { useState} from 'react';
import { useSelector } from 'react-redux';
import { ContentLayout, type Operation } from '../content/ContentLayout';
import type { RootState } from '../../../app/store/rootReducer';
import { useDispatch } from 'react-redux';
import { navigate } from '../../../app/store/slices/moduleNavigationSlice';
import { type AppDispatch } from '../../../app/store/store';
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
  const [internalActiveOperation,setInternalActiveOperation] =useState<TOperationId>(defaultOperation);

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

    const dispatch = useDispatch<AppDispatch>();

 const handleInternalOperationChange = (operationId: string) => {
    const newOperation = operationId as TOperationId;
    setInternalActiveOperation(newOperation);

  };

    const handleOperationChange = () => {
    handleInternalOperationChange(activeOperation);
    // Update redux state.
    dispatch(navigate({
      operation: activeOperation,
      timestamp: Date.now(),
    }));
    console.log('Navigation dispatched');
  };


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