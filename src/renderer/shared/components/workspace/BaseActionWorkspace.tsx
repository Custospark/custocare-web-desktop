import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ActionConfig<TActionId extends string> {
  key: TActionId;
  label: string;
  icon?: React.ReactNode;
  to: string;
  description?: string;
  disabled?: boolean;
  disabledReason?: string;
}

interface BaseActionWorkspaceProps<TActionId extends string> {
  title: string;
  icon?: React.ReactNode;
  theme: 'light' | 'dark';
  actions: ActionConfig<TActionId>[];
  defaultActionTo: string;
  defaultCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  className?: string;
  testId?: string;
  'aria-label'?: string;
}

const cx = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export function BaseActionWorkspace<TActionId extends string>({
  title,
  icon,
  theme,
  actions,
  defaultActionTo,
  defaultCollapsed = false,
  onCollapseChange,
  className = '',
  testId,
  'aria-label': ariaLabel,
}: BaseActionWorkspaceProps<TActionId>) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const shellBg = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const titleColor = isDark ? 'text-blue-400' : 'text-blue-600';
  const iconColor = 'text-blue-500';

  const activeAction = useMemo(
    () => actions?.find((a) => location.pathname === a.to || location.pathname.startsWith(a.to + '/')),
    [actions, location.pathname]
  );

  useEffect(() => {
    if (!actions?.length) return;
    const isOnAnyAction = actions.some(
      (a) => location.pathname === a.to || location.pathname.startsWith(a.to + '/')
    );
    if (!isOnAnyAction && defaultActionTo) {
      const defaultAction = actions.find(a => a.to === defaultActionTo);
      if (defaultAction && !defaultAction.disabled) {
        navigate(defaultActionTo, { replace: true });
      } else {
        const firstEnabled = actions.find(a => !a.disabled);
        if (firstEnabled) navigate(firstEnabled.to, { replace: true });
      }
    }
  }, [actions, defaultActionTo, location.pathname, navigate]);

  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  const handleActionClick = useCallback(
    (to: string, disabled?: boolean) => {
      if (disabled || !to || location.pathname === to || location.pathname.startsWith(to + '/')) return;
      navigate(to);
    },
    [navigate, location.pathname]
  );

  const toggleCollapse = useCallback(() => setIsCollapsed(prev => !prev), []);
  const getActionTitle = (action: ActionConfig<TActionId>) => 
    action.disabled && action.disabledReason ? action.disabledReason : action.description || action.label;

  if (!actions?.length) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className={`rounded-xl p-6 border ${shellBg} ${className}`} data-testid={testId} role="region" aria-label={ariaLabel || title}>
        <h2 className={`text-xl font-bold ${titleColor} flex items-center gap-2`}>
          {icon && <span className={iconColor}>{icon}</span>}
          <span>{title}</span>
        </h2>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-4 p-4 text-center text-gray-500">
          No actions available.
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      className={`space-y-2 ${className}`} data-testid={testId} role="region" aria-label={ariaLabel || title}>
      
      <motion.div className={`rounded-xl border ${shellBg} overflow-hidden`} whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        
        {/* Header - Removed hover color change */}
        <div className={cx(
            'flex items-center justify-between p-3 cursor-pointer select-none',
            isCollapsed ? 'border-b-0' : `border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`
          )} onClick={toggleCollapse}
          role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCollapse(); } }}
          aria-expanded={!isCollapsed} aria-controls="actions-panel" title={isCollapsed ? 'Expand task bar' : 'Collapse task bar'}>
          
          <div className="flex items-center gap-3">
            <h2 className={`text-xl font-bold ${titleColor} flex items-center gap-2`}>
              {icon && <span className={iconColor}>{icon}</span>}
              <span>{title}</span>
            </h2>
            
            {isCollapsed && activeAction && (
              <span className={cx('text-xs px-2 py-1 rounded-full cursor-pointer',
                  isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                )} title={`Current: ${activeAction.label}`}
                onClick={(e) => { e.stopPropagation(); handleActionClick(activeAction.to); }}
                role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); handleActionClick(activeAction.to); } }}>
                {activeAction.label}
              </span>
            )}
          </div>

          <div className={cx('p-1.5 rounded-full', iconColor)}>
            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div id="actions-panel" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden">
              <motion.div className="p-4" initial={{ y: -20 }} animate={{ y: 0 }} transition={{ delay: 0.1 }}>
                <div className="flex flex-wrap gap-2">
                  {actions.map((action, idx) => {
                    const isActive = activeAction?.key === action.key;
                    const disabled = action.disabled;
                    const activeClass = isActive ? 'bg-blue-600 text-white'
                      : isDark ? 'bg-gray-800 text-gray-300'
                      : 'bg-gray-100 text-gray-700';
                    const disabledClass = isDark ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100/50 text-gray-400 cursor-not-allowed';

                    return (
                      <motion.div key={String(action.key)} initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: idx * 0.05, type: "spring", stiffness: 400, damping: 25 }}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <button type="button" onClick={() => handleActionClick(action.to, disabled)}
                          className={cx('inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                            'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                            isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white',
                            disabled ? disabledClass : 'cursor-pointer', disabled ? '' : activeClass
                          )} aria-pressed={isActive} aria-disabled={disabled} title={getActionTitle(action)}>
                          {action.icon && (
                            <span className={!isActive && !disabled ? iconColor : ''}>
                              {action.icon}
                            </span>
                          )}
                          <span>{action.label}</span>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div className={`rounded-xl p-6 border min-h-75 ${shellBg}`}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Outlet context={{ theme, defaultActionTo }} />
      </motion.div>
    </motion.div>
  );
}