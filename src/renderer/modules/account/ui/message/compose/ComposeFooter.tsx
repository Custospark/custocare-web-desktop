/**
 * ============================================================================
 * COMPOSE FOOTER — ACTIONS, PRIORITY, LABELS, ATTACHMENTS
 * ============================================================================
 * Features:
 *  - Priority selector (low, normal, high)
 *  - Labels (add/remove)
 *  - Read receipt & delivery confirmation toggles
 *  - Attachment list with progress/error states
 *  - Schedule send button
 *  - Save draft, send, discard actions
 *  - FIXED: Footer no longer cropped, proper flex layout
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Paperclip, Send, Save, X, AlertCircle, CheckCircle,
  Clock, Tag, Flag, MailCheck, BellRing, Trash2,
  ChevronUp, ChevronDown, Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../../shared/utils/classNameUtils';
import type { ComposeMessage } from './composeTypes';
import type { MessagePriority } from '../../../api/messages/MessageTypes';

interface ComposeFooterProps {
  theme: 'light' | 'dark';
  message: ComposeMessage;
  isSending: boolean;
  isSaving: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>; // FIXED: Added null to type
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPriorityChange: (priority: MessagePriority) => void;
  onReadReceiptChange: (value: boolean) => void;
  onDeliveryConfirmChange: (value: boolean) => void;
  onScheduleClick: () => void;
  onAddLabel: (label: string) => void;
  onRemoveLabel: (label: string) => void;
  onAttachClick: () => void;
  onRemoveAttachment: (id: string) => void;
  onSaveDraft: () => void;
  onSend: () => void;
  onDiscard: () => void;
}

const PRIORITY_OPTIONS: Array<{ value: MessagePriority; label: string; icon: any; color: string }> = [
  { value: 'low', label: 'Low', icon: ChevronDown, color: 'text-green-500' },
  { value: 'normal', label: 'Normal', icon: Flag, color: 'text-blue-500' },
  { value: 'high', label: 'High', icon: ChevronUp, color: 'text-red-500' },
];

const COMMON_LABELS = ['Work', 'Personal', 'Invoice', 'Meeting', 'Urgent', 'Follow-up'];

export const ComposeFooter: React.FC<ComposeFooterProps> = ({
  theme, message, isSending, isSaving, fileInputRef,
  onFileSelect, onPriorityChange, onReadReceiptChange, onDeliveryConfirmChange,
  onScheduleClick, onAddLabel, onRemoveLabel, onAttachClick,
  onRemoveAttachment, onSaveDraft, onSend, onDiscard,
}) => {
  const isDark = theme === 'dark';
  const [showLabels, setShowLabels] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [showPriority, setShowPriority] = useState(false);
  const labelsRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (labelsRef.current && !labelsRef.current.contains(e.target as Node)) {
        setShowLabels(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setShowPriority(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddNewLabel = () => {
    if (newLabel.trim() && !message.labels.includes(newLabel.trim())) {
      onAddLabel(newLabel.trim());
      setNewLabel('');
    }
  };

  const currentPriority = PRIORITY_OPTIONS.find(p => p.value === message.priority) || PRIORITY_OPTIONS[1];
  const PriorityIcon = currentPriority.icon;

  return (
    <div className={cn(
      'border-t-2 flex-shrink-0', // FIXED: Added flex-shrink-0 to prevent cropping
      isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
    )}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        multiple
        className="hidden"
      />

      {/* Attachments list - scrollable if many */}
      {message.attachments.length > 0 && (
        <div className={cn(
          'px-4 py-2 border-b overflow-x-auto flex gap-2',
          isDark ? 'border-gray-700' : 'border-gray-200',
        )}>
          <AnimatePresence>
            {message.attachments.map(att => (
              <motion.div
                key={att.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  'flex items-center gap-2 px-2 py-1 rounded-lg border text-sm whitespace-nowrap',
                  att.error 
                    ? isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                    : att.progress === 100
                      ? isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
                      : isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
                )}
              >
                <Paperclip className={cn(
                  'w-3.5 h-3.5',
                  att.error ? 'text-red-500' : att.progress === 100 ? 'text-green-500' : 'text-gray-400'
                )} />
                <span className="max-w-[150px] truncate">{att.name}</span>
                <span className="text-xs text-gray-500">({att.size})</span>
                
                {att.progress !== undefined && att.progress < 100 && (
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${att.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{att.progress}%</span>
                  </div>
                )}

                {att.error && (
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" title={att.error} />
                )}

                {att.progress === 100 && !att.error && (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                )}

                <button
                  onClick={() => onRemoveAttachment(att.id)}
                  className={cn(
                    'p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer',
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  )}
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Main footer bar - FIXED: Now uses flex-wrap to prevent overflow */}
      <div className="flex flex-wrap items-center gap-1 p-2">
        {/* Left side actions */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Attach button */}
          <button
            onClick={onAttachClick}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors cursor-pointer',
              isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600',
            )}
            title="Attach files"
          >
            <Paperclip className="w-4 h-4" />
            <span className="hidden sm:inline">Attach</span>
          </button>

          {/* Priority dropdown */}
          <div className="relative" ref={priorityRef}>
            <button
              onClick={() => setShowPriority(v => !v)}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors cursor-pointer',
                isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600',
              )}
              title="Set priority"
            >
              <PriorityIcon className={cn('w-4 h-4', currentPriority.color)} />
              <span className="hidden sm:inline">{currentPriority.label}</span>
            </button>

            <AnimatePresence>
              {showPriority && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={cn(
                    'absolute bottom-full left-0 mb-1 rounded-lg border shadow-lg overflow-hidden z-10',
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
                  )}
                >
                  {PRIORITY_OPTIONS.map(p => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.value}
                        onClick={() => { onPriorityChange(p.value); setShowPriority(false); }}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 text-sm w-full whitespace-nowrap transition-colors cursor-pointer',
                          message.priority === p.value
                            ? isDark ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-50 text-blue-700'
                            : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700',
                        )}
                      >
                        <Icon className={cn('w-4 h-4', p.color)} />
                        {p.label}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Labels dropdown */}
          <div className="relative" ref={labelsRef}>
            <button
              onClick={() => setShowLabels(v => !v)}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors cursor-pointer',
                isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600',
              )}
              title="Add labels"
            >
              <Tag className="w-4 h-4" />
              {message.labels.length > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 min-w-[20px] text-center">
                  {message.labels.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showLabels && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={cn(
                    'absolute bottom-full left-0 mb-1 rounded-lg border shadow-lg overflow-hidden z-10 w-64',
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
                  )}
                >
                  <div className="p-2">
                    <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      Current labels
                    </p>
                    {message.labels.length === 0 ? (
                      <p className={cn('text-xs italic mb-2', isDark ? 'text-gray-500' : 'text-gray-400')}>
                        No labels yet
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {message.labels.map(label => (
                          <span
                            key={label}
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                              isDark ? 'bg-blue-900/30 text-blue-300 border border-blue-800' : 'bg-blue-100 text-blue-700 border border-blue-200',
                            )}
                          >
                            {label}
                            <button
                              onClick={() => onRemoveLabel(label)}
                              className="hover:text-red-500 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      Add label
                    </p>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newLabel}
                        onChange={e => setNewLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddNewLabel()}
                        placeholder="New label..."
                        className={cn(
                          'flex-1 px-2 py-1 text-xs rounded border outline-none',
                          isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900',
                        )}
                      />
                      <button
                        onClick={handleAddNewLabel}
                        disabled={!newLabel.trim()}
                        className={cn(
                          'p-1 rounded cursor-pointer disabled:opacity-50',
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
                        )}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-2">
                      <p className={cn('text-xs font-semibold mb-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
                        Common labels
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {COMMON_LABELS.filter(l => !message.labels.includes(l)).map(label => (
                          <button
                            key={label}
                            onClick={() => onAddLabel(label)}
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs cursor-pointer transition-colors',
                              isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
                            )}
                          >
                            + {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Schedule button */}
          <button
            onClick={onScheduleClick}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors cursor-pointer',
              message.scheduledSend
                ? isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-50 text-purple-700'
                : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600',
            )}
            title="Schedule send"
          >
            <Clock className="w-4 h-4" />
            {message.scheduledSend ? (
              <span className="hidden sm:inline">
                {message.scheduledSend.toLocaleDateString()} {message.scheduledSend.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : (
              <span className="hidden sm:inline">Schedule</span>
            )}
          </button>

          {/* Read receipt toggle */}
          <button
            onClick={() => onReadReceiptChange(!message.readReceipt)}
            className={cn(
              'p-1.5 rounded-lg transition-colors cursor-pointer',
              message.readReceipt
                ? isDark ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                : isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500',
            )}
            title="Request read receipt"
          >
            <MailCheck className="w-4 h-4" />
          </button>

          {/* Delivery confirmation toggle */}
          <button
            onClick={() => onDeliveryConfirmChange(!message.deliveryConfirmation)}
            className={cn(
              'p-1.5 rounded-lg transition-colors cursor-pointer',
              message.deliveryConfirmation
                ? isDark ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                : isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500',
            )}
            title="Request delivery confirmation"
          >
            <BellRing className="w-4 h-4" />
          </button>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 ml-auto flex-wrap">
          {/* Save status */}
          {isSaving && (
            <span className={cn('text-xs mr-2', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Saving...
            </span>
          )}

          {/* Save draft button */}
          <button
            onClick={onSaveDraft}
            disabled={isSaving}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-50',
              isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600',
            )}
            title="Save draft"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Discard button */}
          <button
            onClick={onDiscard}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer',
              isDark ? 'hover:bg-red-900/30 text-gray-300' : 'hover:bg-red-50 text-gray-600',
            )}
            title="Discard"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Discard</span>
          </button>

          {/* Send button */}
          <button
            onClick={onSend}
            disabled={isSending}
            className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-60 transition-colors"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{message.scheduledSend ? 'Schedule' : 'Send'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComposeFooter;