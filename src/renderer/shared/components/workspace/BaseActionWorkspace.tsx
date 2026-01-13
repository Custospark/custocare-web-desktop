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

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store/rootReducer';

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
}

export function BaseActionWorkspace<TActionId extends string>({
  title,
  icon,
  theme,
  actions,
  defaultAction,
  renderAction,
}: BaseActionWorkspaceProps<TActionId>) {
  const isDark = theme === 'dark';
  
  // Get current navigation state from Redux
  const navigationState = useSelector((state: RootState) => 
    state.moduleNavigation.current
  );
  
  const [internalActiveAction, setInternalActiveAction] = useState<TActionId>(defaultAction);

  // Use action from Redux if available, otherwise use internal state
  const activeAction = navigationState.action 
    ? (navigationState.action as TActionId)
    : internalActiveAction;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className={`rounded-xl p-6 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h2>

        {/* Action Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {actions.map(action => {
            const isActive = activeAction === action.key;

            return (
              <button
                key={action.key}
                onClick={() => setInternalActiveAction(action.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isDark
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {action.icon}
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Panel */}
      <div
        className={`rounded-xl p-6 border min-h-[300px] ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        {renderAction(activeAction)}
      </div>
    </div>
  );
}