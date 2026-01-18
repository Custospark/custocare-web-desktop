// BaseActionWorkspace.tsx
/**
 * ============================================================================
 * BASE ACTION WORKSPACE (ROUTER-DRIVEN)
 * ============================================================================
 *
 * - Action tabs map to nested routes
 * - URL is source of truth
 * - Content renders via <Outlet />
 *
 * Design preserved.
 */

import React, { useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

export interface ActionConfig<TActionId extends string> {
  key: TActionId;
  label: string;
  icon: React.ReactNode;
  to: string; // absolute or relative path for navigation
}

interface BaseActionWorkspaceProps<TActionId extends string> {
  title: string;
  icon: React.ReactNode;
  theme: 'light' | 'dark';
  actions: ActionConfig<TActionId>[];
  defaultActionTo: string; // where to go when route is missing action
}

export function BaseActionWorkspace<TActionId extends string>({
  title,
  icon,
  theme,
  actions,
  defaultActionTo,
}: BaseActionWorkspaceProps<TActionId>) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const location = useLocation();

  const activeActionKey = useMemo(() => {
    // determine active action by matching current pathname with `to`
    const current = location.pathname;
    const matched = actions.find(a => current === a.to || current.startsWith(a.to + '/'));
    return matched?.key;
  }, [location.pathname, actions]);

  const handleActionClick = useCallback(
    (to: string) => {
      navigate(to);
    },
    [navigate]
  );

  if (!actions || actions.length === 0) {
    return (
      <div className="space-y-4">
        <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <div className="mt-4 p-4 text-center text-gray-500">No actions available for this module.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`rounded-xl p-6 border transition-opacity duration-200 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h2>

        {/* Action Tabs */}
        <div className="flex flex-wrap gap-2 mt-4 cursor-pointer">
          {actions.map(action => {
            const isActive = activeActionKey === action.key;

            return (
              <button
                key={String(action.key)}
                onClick={() => handleActionClick(action.to)}
                className={`inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  ${
                    isActive
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : isDark
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-gray-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                  }
                `}
                aria-pressed={isActive}
                title={action.label}
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

      {/* Active Panel */}
      <div className={`rounded-xl p-6 border min-h-[300px] transition-colors duration-200 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        {/* Nested action route content */}
        <Outlet context={{ theme, defaultActionTo }} />
      </div>
    </div>
  );
}
