// ContentLayout.tsx
import React, {
  useCallback,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { RootState, AppDispatch } from '../../../app/store/store';
import { MoreVertical, X, Sparkles } from 'lucide-react';
import { cn } from '../../utils/classNameUtils';
import { LayoutMainContent } from './LayoutMainContent';
import { QuickActionsSidebar, type DockSide } from './QuickActionsSidebar';
import { useWorkspaceSectionKeyboardShortcuts } from '../../hooks/useWorkspaceSectionKeyboardShortcuts';
import { workspaceShortcutLabelForDigit, slotToKey } from '../../keyboard/workspaceShortcutLabels';
...
                const digitHint = slotToKey(opIndex + 1) ? workspaceShortcutLabelForDigit(opIndex + 1) : null;

                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => (!disabled ? onSelectOperation(op.id) : undefined)}
                    disabled={disabled}
                    aria-current={isActive ? 'page' : undefined}
                    title={
                      digitHint ? `${digitHint} — ${op.description || op.label}` : op.description || op.label
                    }
                    className={cn(
                      'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl mb-2',
                      'text-sm font-medium transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-offset-0',
                      theme === 'dark' ? 'focus:ring-cyan-500/50' : 'focus:ring-blue-500/50',
                      isActive &&
                        (theme === 'dark'
                          ? 'bg-gray-900 text-cyan-300 border-r-4 border-cyan-500/90'
                          : 'bg-white text-blue-700 border-r-4 border-blue-500/90'),
                      !isActive &&
                        !disabled &&
                        (theme === 'dark'
                          ? 'text-gray-400 bg-gray-900/30 hover:text-gray-200 hover:bg-gray-800/40'
                          : 'text-gray-600 bg-gray-100/30 hover:text-gray-900 hover:bg-gray-100/50'),
                      disabled && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    {op.icon && (
                      <span className="w-5 h-5 flex items-center justify-center">{op.icon}</span>
                    )}
                    <span className="flex-1 truncate text-left">{op.label}</span>
                    {digitHint && (
                      <kbd
                        className={cn(
                          'shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border',
                          theme === 'dark'
                            ? 'border-gray-600 bg-gray-800/80 text-gray-300'
                            : 'border-gray-200 bg-gray-50 text-gray-600',
                        )}
                      >
                        {digitHint}
                      </kbd>
                    )}
                    {isLoading && isActive && (
                      <span className="animate-pulse text-xs text-gray-500">(loading...)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

ContentLayout.displayName = 'ContentLayout';
export default ContentLayout;
