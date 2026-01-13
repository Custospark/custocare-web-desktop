/**
 * ============================================================================
 * BASE ACTION WORKSPACE
 * ============================================================================
 *
 * Handles:
 * - Action tabs (sub-views)
 * - Active action state
 * - Shared header + panel layout
 *
 * Designed for Inventory, Billing, Dispensing, etc.
 */

import React, { useState } from 'react';

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
  const [activeAction, setActiveAction] = useState<TActionId>(defaultAction);

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
                onClick={() => setActiveAction(action.key)}
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
