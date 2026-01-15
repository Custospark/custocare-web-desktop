/**
 * ============================================================================
 * BASE ACTION WORKSPACE
 * ============================================================================
 *
 * Handles:
 * - Action tabs (sub-views)
 * - Active action state from Redux
 * - Shared header + panel layout
 *
 * Designed for Inventory, Billing, Dispensing, etc.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../../app/store/rootReducer';
import { type AppDispatch } from '../../../app/store/store';

export interface ActionConfig<TActionId extends string> {
  key: TActionId;
  label: string;
  icon: React.ReactNode;
}

interface BaseActionWorkspaceProps<TActionId extends string> {
  title: string;
  icon: React.ReactNode;
  theme: 'light' | 'dark';
  actions: ActionConfig<TActionId>[];
  defaultAction: TActionId;
  renderAction: (action: TActionId) => React.ReactNode;
  moduleId: string; // Which operation this workspace belongs to
  initialPayload?: unknown; // Optional initial payload when module loads
  onActionChange?: (action: TActionId, payload?: unknown) => void; // Callback when action changes
}

export function BaseActionWorkspace<TActionId extends string>({
  title,
  icon,
  theme,
  actions,
  defaultAction,
  renderAction,
  moduleId,
  initialPayload,
  onActionChange,
}: BaseActionWorkspaceProps<TActionId>) {
  const dispatch = useDispatch<AppDispatch>();
  const isDark = theme === 'dark';
  
  // Get current navigation state from Redux
  const navigationState = useSelector((state: RootState) => 
    state.moduleNavigation.current
  );
  
  const [internalActiveAction, setInternalActiveAction] = useState<TActionId>(defaultAction);
  const [currentPayload, setCurrentPayload] = useState<unknown>(initialPayload);
  
  // Use refs to track previous values to avoid unnecessary updates
  const prevModuleRef = useRef<string>(moduleId);
  const prevNavigationActionRef = useRef<string | undefined>(navigationState.action);
  const prevNavigationOperationRef = useRef<string | undefined>(navigationState.operation);

  // Initialize payload from Redux when module becomes active
  useEffect(() => {
    if (navigationState.operation === moduleId && navigationState.payload) {
      // Defer state update to next animation frame
      const animationFrameId = requestAnimationFrame(() => {
        setCurrentPayload(navigationState.payload);
      });
      
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [navigationState.operation, moduleId, navigationState.payload]);

  // Reset internal state when module changes
  useEffect(() => {
    if (navigationState.operation !== moduleId) {
      // Defer state update to avoid cascading renders
      const animationFrameId = requestAnimationFrame(() => {
        setInternalActiveAction(defaultAction);
      });
      
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [navigationState.operation, moduleId, defaultAction]);

  // Update internal state when Redux state changes for THIS module
  useEffect(() => {
    // Only proceed if we're in the correct module
    if (navigationState.operation !== moduleId) {
      prevModuleRef.current = moduleId;
      prevNavigationActionRef.current = navigationState.action;
      prevNavigationOperationRef.current = navigationState.operation;
      return;
    }

    const currentAction = navigationState.action as TActionId | undefined;
    
    // Check if action actually changed to avoid unnecessary updates
    const actionChanged = currentAction !== prevNavigationActionRef.current;
    const operationChanged = navigationState.operation !== prevNavigationOperationRef.current;
    
    // Update refs for next comparison
    prevNavigationActionRef.current = navigationState.action;
    prevNavigationOperationRef.current = navigationState.operation;
    
    // If nothing changed, bail out
    if (!actionChanged && !operationChanged) {
      return;
    }

    // If there's an action in Redux state
    if (currentAction) {
      const isValidAction = actions.some(a => a.key === currentAction);
      
      // Only update if it's a valid action and different from current
      if (isValidAction && currentAction !== internalActiveAction) {
        // Defer state update
        const animationFrameId = requestAnimationFrame(() => {
          setInternalActiveAction(currentAction);
        });
        
        return () => cancelAnimationFrame(animationFrameId);
      } else if (!isValidAction && internalActiveAction !== defaultAction) {
        // If action from Redux is not valid, fall back to default
        const animationFrameId = requestAnimationFrame(() => {
          setInternalActiveAction(defaultAction);
        });
        
        return () => cancelAnimationFrame(animationFrameId);
      }
    } else if (internalActiveAction !== defaultAction) {
      // No action in Redux for this module, use default
      const animationFrameId = requestAnimationFrame(() => {
        setInternalActiveAction(defaultAction);
      });
      
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [navigationState.action, navigationState.operation, moduleId, actions, internalActiveAction, defaultAction]);

  // Determine which action to show
  const isModuleActive = navigationState.operation === moduleId;
  const activeAction = isModuleActive 
    ? (navigationState.action as TActionId) || internalActiveAction
    : internalActiveAction;

  const handleActionClick = useCallback((actionKey: TActionId, payload?: unknown) => {
    // Use provided payload or current payload or undefined
    const actionPayload = payload !== undefined ? payload : currentPayload;
    
    // Update internal state immediately for responsive UI
    // This is okay because it's in a click handler, not an effect
    setInternalActiveAction(actionKey);
    
    // Create timestamp outside of dispatch
    const timestamp = Date.now();
    
    // Dispatch navigation action to update Redux state
    dispatch({
      type: 'moduleNavigation/navigate',
      payload: {
        operation: moduleId,
        action: actionKey,
        payload: actionPayload,
        timestamp,
      },
    });

    // Call optional callback
    if (onActionChange) {
      onActionChange(actionKey, actionPayload);
    }
  }, [dispatch, moduleId, currentPayload, onActionChange]);

  // Early return if there are no actions
  if (!actions || actions.length === 0) {
    return (
      <div className="space-y-4">
        <div className={`rounded-xl p-6 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <div className="mt-4 p-4 text-center text-gray-500">
            No actions available for this module.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className={`rounded-xl p-6 border transition-opacity duration-200 ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        } ${!isModuleActive ? 'opacity-60' : ''}`}
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {icon}
          {title}
          {!isModuleActive && (
            <span className="text-xs text-gray-500 ml-2">(Inactive)</span>
          )}
        </h2>

        {/* Action Tabs */}
        <div className="flex flex-wrap gap-2 mt-4 cursor-pointer">
          {actions.map(action => {
            const isActive = isModuleActive && activeAction === action.key;

            return (
              <button
                key={String(action.key)}
                onClick={() => {
                  if (isModuleActive) {
                    handleActionClick(action.key);
                  }
                }}
                disabled={!isModuleActive}
                className={`inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:cursor-not-allowed
                  ${
                    isActive
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : !isModuleActive
                      ? isDark
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : isDark
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-gray-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                  }
                `}
                aria-pressed={isActive}
                aria-disabled={!isModuleActive}
                title={!isModuleActive ? `Switch to ${title} to use this action` : action.label}
              >
                {action.icon && (
                  <span className="flex-shrink-0" aria-hidden="true">
                    {action.icon}
                  </span>
                )}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Panel - Only show content if this module is active */}
      {isModuleActive ? (
        <div
          className={`rounded-xl p-6 border min-h-[300px] transition-colors duration-200 ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}
        >
          {renderAction(activeAction)}
        </div>
      ) : (
        <div
          className={`rounded-xl p-6 border min-h-[300px] flex items-center justify-center transition-colors duration-200 ${
            isDark ? 'bg-gray-900/50 border-gray-800/50' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="text-center">
            <p className={`text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {title} module is not active
            </p>
            <p className="text-sm mt-2 text-gray-500">
              Switch to {title} to use these actions
            </p>
          </div>
        </div>
      )}
    </div>
  );
}