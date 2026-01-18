import React, { useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

export interface ActionConfig<TActionId extends string> {
  key: TActionId;
  label: string;
  icon: React.ReactNode;
  to: string;
}

interface BaseActionWorkspaceProps<TActionId extends string> {
  title: string;
  icon: React.ReactNode;
  theme: 'light' | 'dark';
  actions: ActionConfig<TActionId>[];
  defaultActionTo: string;
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

  const activeActionKey = useMemo(() => 
    actions.find(a => 
      location.pathname === a.to || 
      location.pathname.startsWith(a.to + '/')
    )?.key,
    [location.pathname, actions]
  );

  const handleActionClick = useCallback(
    (to: string) => navigate(to),
    [navigate]
  );

  if (!actions?.length) {
    return (
      <div className={`rounded-xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <div className="mt-4 p-4 text-center text-gray-500">No actions available.</div>
      </div>
    );
  }

  const bg = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-6 border ${bg}`}>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h2>

        <div className="flex flex-wrap gap-2 mt-4">
          {actions.map(action => {
            const isActive = activeActionKey === action.key;
            const activeClass = isActive 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : isDark 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-gray-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900';

            return (
              <button
                key={String(action.key)}
                onClick={() => handleActionClick(action.to)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${activeClass}`}
                aria-pressed={isActive}
                title={action.label}
              >
                {action.icon && <span aria-hidden="true">{action.icon}</span>}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`rounded-xl p-6 border min-h-[300px] ${bg}`}>
        <Outlet context={{ theme, defaultActionTo }} />
      </div>
    </div>
  );
}