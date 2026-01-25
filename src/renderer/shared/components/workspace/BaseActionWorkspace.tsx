import React, { useCallback, useMemo, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

export interface ActionConfig<TActionId extends string> {
  key: TActionId;
  label: string;
  icon?: React.ReactNode;
  to: string;
}

interface BaseActionWorkspaceProps<TActionId extends string> {
  title: string;
  icon?: React.ReactNode;
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

  const shellBg = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const titleColor = isDark ? 'text-blue-400' : 'text-blue-600';

  const activeAction = useMemo(() => {
    return actions?.find(
      (a) => location.pathname === a.to || location.pathname.startsWith(a.to + '/')
    );
  }, [actions, location.pathname]);

  // If user lands on the workspace root (or an unknown subpath), push them to the default action.
  useEffect(() => {
    if (!actions?.length) return;

    const isOnAnyAction =
      actions.some((a) => location.pathname === a.to || location.pathname.startsWith(a.to + '/'));

    if (!isOnAnyAction && defaultActionTo) {
      navigate(defaultActionTo, { replace: true });
    }
  }, [actions, defaultActionTo, location.pathname, navigate]);

  const handleActionClick = useCallback(
    (to: string) => {
      if (!to) return;
      if (location.pathname === to || location.pathname.startsWith(to + '/')) return;
      navigate(to);
    },
    [navigate, location.pathname]
  );

  if (!actions?.length) {
    return (
      <div className={`rounded-xl p-6 border ${shellBg}`}>
        <h2 className={`text-xl font-bold ${titleColor} flex items-center gap-2`}>
          {icon && <span aria-hidden="true">{icon}</span>}
          <span>{title}</span>
        </h2>

        <div className="mt-4 p-4 text-center text-gray-500">No actions available.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-6 border ${shellBg}`}>
        {/* ✅ Actions title is BLUE */}
        <h2 className={`text-xl font-bold ${titleColor} flex items-center gap-2`}>
          {icon && <span aria-hidden="true">{icon}</span>}
          <span>{title}</span>
        </h2>

        <div className="flex flex-wrap gap-2 mt-4">
          {actions.map((action) => {
            const isActive = activeAction?.key === action.key;

            const activeClass = isActive
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : isDark
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-gray-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900';

            return (
              <button
                key={String(action.key)}
                type="button"
                onClick={() => handleActionClick(action.to)}
                className={[
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                  'transition-colors duration-200 cursor-pointer',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white',
                  activeClass,
                ].join(' ')}
                aria-pressed={isActive}
                aria-current={isActive ? 'page' : undefined}
                title={action.label}
              >
                {action.icon && <span aria-hidden="true">{action.icon}</span>}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`rounded-xl p-6 border min-h-[300px] ${shellBg}`}>
        <Outlet context={{ theme, defaultActionTo }} />
      </div>
    </div>
  );
}
