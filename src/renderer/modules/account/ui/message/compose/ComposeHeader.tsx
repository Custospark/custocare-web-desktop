/**
 * ============================================================================
 * COMPOSE HEADER COMPONENT
 * ============================================================================
 * Displays the window title-bar with:
 *  - Message type label (New / Reply / Forward)
 *  - Scheduled-send badge
 *  - Auto-save indicator
 *  - Window controls: minimize / maximize / close
 */

import React from 'react';
import {
  X, Minimize2, Maximize2, Save, Clock,
} from 'lucide-react';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { type WindowState } from './composeTypes';
interface ComposeHeaderProps {
  theme: 'light' | 'dark';
  windowState: WindowState;
  isSaving: boolean;
  lastSaved: Date | null;
  scheduledSend?: Date | null;
  isReply?: boolean;
  isForward?: boolean;
  subject?: string;
  onMinimize: () => void;
  onMaximize: () => void;
  onDiscard: () => void;
}

export const ComposeHeader: React.FC<ComposeHeaderProps> = ({
  theme,
  windowState,
  isSaving,
  lastSaved,
  scheduledSend,
  isReply,
  isForward,
  subject,
  onMinimize,
  onMaximize,
  onDiscard,
}) => {
  const isDark = theme === 'dark';

  const title = isReply ? 'Reply' : isForward ? 'Forward' : 'New Message';

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 border-b-2 select-none',
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white',
      )}
    >
      {/* Left: title + badges */}
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="text-base font-semibold truncate">{title}</h2>

        {subject && (
          <span
            className={cn(
              'hidden sm:block text-xs truncate max-w-[220px] italic',
              isDark ? 'text-gray-400' : 'text-gray-500',
            )}
          >
            {subject}
          </span>
        )}

        {scheduledSend && (
          <span
            className={cn(
              'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border whitespace-nowrap',
              isDark
                ? 'bg-blue-900/20 text-blue-300 border-blue-500/30'
                : 'bg-blue-50 text-blue-600 border-blue-200',
            )}
          >
            <Clock className="w-3 h-3" />
            {scheduledSend.toLocaleDateString()} {scheduledSend.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Right: save status + window controls */}
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {/* Save indicator */}
        {isSaving && (
          <span
            className={cn(
              'flex items-center gap-1 text-xs mr-1',
              isDark ? 'text-gray-400' : 'text-gray-500',
            )}
          >
            <Save className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Saving…</span>
          </span>
        )}
        {!isSaving && lastSaved && (
          <span
            className={cn(
              'text-xs mr-1',
              isDark ? 'text-gray-500' : 'text-gray-400',
            )}
          >
            Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        {/* Minimize */}
        <button
          onClick={onMinimize}
          title="Minimize"
          className={cn(
            'p-1.5 rounded-lg transition-colors cursor-pointer',
            isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900',
          )}
        >
          <Minimize2 className="w-4 h-4" />
        </button>

        {/* Maximize / Restore */}
        <button
          onClick={onMaximize}
          title={windowState === 'maximized' ? 'Restore' : 'Maximize'}
          className={cn(
            'p-1.5 rounded-lg transition-colors cursor-pointer',
            isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900',
          )}
        >
          {windowState === 'maximized' ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>

        {/* Close */}
        <button
          onClick={onDiscard}
          title="Close"
          className={cn(
            'p-1.5 rounded-lg transition-colors cursor-pointer',
            isDark
              ? 'hover:bg-red-900/30 text-gray-400 hover:text-red-300'
              : 'hover:bg-red-50 text-gray-500 hover:text-red-600',
          )}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ComposeHeader;
