/**
 * ============================================================================
 * COMPOSE FOOTER COMPONENT
 * ============================================================================
 * Houses:
 *  - Priority selector menu
 *  - Attach-file button + attachment list with progress bars
 *  - Options menu (read receipt, delivery confirmation, schedule, labels)
 *  - Label chips
 *  - Discard / Save Draft / Send actions
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  Send, Paperclip, AlertCircle, CheckCircle, ChevronDown,
  MoreHorizontal, Clock, Tag, Save, X, Loader2, Phone,
  Check,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Attachment, ComposeMessage } from './composeTypes';
import { cn } from '../../../../../shared/utils/classNameUtils';

interface ComposeFooterProps {
  theme: 'light' | 'dark';
  message: ComposeMessage;
  isSending: boolean;
  isSaving: boolean;
  onPriorityChange: (p: 'low' | 'normal' | 'high') => void;
  onReadReceiptChange: (v: boolean) => void;
  onDeliveryConfirmChange: (v: boolean) => void;
  onScheduleClick: () => void;
  onAddLabel: (label: string) => void;
  onRemoveLabel: (label: string) => void;
  onAttachClick: () => void;
  onRemoveAttachment: (id: string) => void;
  onSaveDraft: () => void;
  onSend: () => void;
  onDiscard: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>; 
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/* ── Attachment chip ─────────────────────────────────────────────── */
const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('doc')) return '📝';
  if (type.includes('sheet') || type.includes('csv') || type.includes('excel')) return '📊';
  if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return '🗜️';
  return '📎';
};

const AttachmentChip: React.FC<{
  att: Attachment;
  isDark: boolean;
  onRemove: () => void;
}> = ({ att, isDark, onRemove }) => (
  <div
    className={cn(
      'relative group flex items-center gap-2 p-2 pr-7 rounded-lg border-2 min-w-0 max-w-[180px]',
      att.error
        ? isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'
        : isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200',
    )}
  >
    <span className="text-base shrink-0">{getFileIcon(att.type)}</span>
    <div className="min-w-0">
      <p className="text-xs font-medium truncate">{att.name}</p>
      <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{att.size}</p>
      {att.error && <p className="text-xs text-red-500">{att.error}</p>}
      {att.progress !== undefined && att.progress < 100 && !att.error && (
        <p className="text-xs text-blue-500">{att.progress}%</p>
      )}
    </div>

    {/* Progress bar */}
    {att.progress !== undefined && att.progress < 100 && !att.error && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300 rounded-b-lg overflow-hidden">
        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${att.progress}%` }} />
      </div>
    )}

    <button
      onClick={onRemove}
      className={cn(
        'absolute right-1 top-1 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer',
        isDark ? 'hover:bg-gray-600 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500',
      )}
    >
      <X className="w-3 h-3" />
    </button>
  </div>
);

/* ── Priority button ─────────────────────────────────────────────── */
const PRIORITY_CONFIG = {
  high: { label: 'High', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-500/30', icon: <AlertCircle className="w-4 h-4" /> },
  normal: { label: 'Normal', color: '', bg: '', border: '', icon: null },
  low: { label: 'Low', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-500/30', icon: <CheckCircle className="w-4 h-4" /> },
};

/* ── Main component ──────────────────────────────────────────────── */
export const ComposeFooter: React.FC<ComposeFooterProps> = ({
  theme, message, isSending, isSaving,
  onPriorityChange, onReadReceiptChange, onDeliveryConfirmChange,
  onScheduleClick, onAddLabel, onRemoveLabel,
  onAttachClick, onRemoveAttachment,
  onSaveDraft, onSend, onDiscard,
  fileInputRef, onFileSelect,
}) => {
  const isDark = theme === 'dark';
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);

  const hasPhoneOnly = [...message.to, ...message.cc, ...message.bcc]
    .some(r => r.contactType === 'phone');

  const priorityCfg = PRIORITY_CONFIG[message.priority];

  const submitLabel = useCallback(() => {
    if (labelInput.trim()) {
      onAddLabel(labelInput.trim().toLowerCase());
      setLabelInput('');
    }
    setShowLabelInput(false);
  }, [labelInput, onAddLabel]);

  return (
    <div
      className={cn(
        'border-t-2',
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50',
      )}
    >
      {/* Attachments area */}
      {message.attachments.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-2">
          {message.attachments.map(att => (
            <AttachmentChip
              key={att.id}
              att={att}
              isDark={isDark}
              onRemove={() => onRemoveAttachment(att.id)}
            />
          ))}
        </div>
      )}

      {/* Labels */}
      {(message.labels.length > 0 || showLabelInput) && (
        <div className="px-4 pt-2 flex flex-wrap items-center gap-1.5">
          {message.labels.map(label => (
            <span
              key={label}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border',
                isDark ? 'bg-purple-900/20 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200',
              )}
            >
              <Tag className="w-2.5 h-2.5" />
              {label}
              <button
                onClick={() => onRemoveLabel(label)}
                className="ml-0.5 cursor-pointer hover:text-red-500"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          {showLabelInput && (
            <input
              ref={labelInputRef}
              type="text"
              value={labelInput}
              onChange={e => setLabelInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') submitLabel();
                if (e.key === 'Escape') setShowLabelInput(false);
              }}
              onBlur={submitLabel}
              placeholder="Label name…"
              autoFocus
              className={cn(
                'px-2 py-0.5 rounded-full text-xs border outline-none w-24',
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900',
              )}
            />
          )}
        </div>
      )}

      {/* Phone warning */}
      {hasPhoneOnly && (
        <div className={cn('mx-4 mt-2 flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border',
          isDark ? 'bg-amber-900/10 border-amber-700/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700')}>
          <Phone className="w-3 h-3 shrink-0" />
          Some recipients are phone-only. Email will be sent to email recipients only.
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between p-3 gap-2">
        {/* Left tools */}
        <div className="flex items-center gap-1">
          {/* Priority */}
          <div className="relative">
            <button
              onClick={() => setShowPriorityMenu(s => !s)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border-2 cursor-pointer transition-colors',
                message.priority !== 'normal'
                  ? `${priorityCfg.color} ${priorityCfg.bg} ${priorityCfg.border}`
                  : isDark
                    ? 'border-gray-700 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-100',
              )}
            >
              {priorityCfg.icon}
              <span className="hidden sm:inline">{priorityCfg.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            <AnimatePresence>
              {showPriorityMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={cn(
                    'absolute bottom-full mb-2 left-0 w-40 rounded-xl border-2 shadow-xl overflow-hidden z-20',
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
                  )}
                >
                  {(['high', 'normal', 'low'] as const).map(p => {
                    const cfg = PRIORITY_CONFIG[p];
                    return (
                      <button
                        key={p}
                        onClick={() => { onPriorityChange(p); setShowPriorityMenu(false); }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm flex items-center gap-2 cursor-pointer',
                          cfg.color,
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
                          message.priority === p && (isDark ? 'bg-gray-700' : 'bg-gray-100'),
                        )}
                      >
                        {cfg.icon}
                        {cfg.label} Priority
                        {message.priority === p && <Check className="w-3.5 h-3.5 ml-auto" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Attach */}
          <button
            onClick={onAttachClick}
            className={cn(
              'p-2 rounded-lg cursor-pointer transition-colors',
              isDark ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900',
            )}
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Add Label */}
          <button
            onClick={() => { setShowLabelInput(true); setTimeout(() => labelInputRef.current?.focus(), 50); }}
            className={cn(
              'p-2 rounded-lg cursor-pointer transition-colors',
              isDark ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900',
            )}
            title="Add label"
          >
            <Tag className="w-4 h-4" />
          </button>

          {/* Options menu */}
          <div className="relative">
            <button
              onClick={() => setShowOptionsMenu(s => !s)}
              className={cn(
                'p-2 rounded-lg cursor-pointer transition-colors',
                isDark ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900',
              )}
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showOptionsMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={cn(
                    'absolute bottom-full mb-2 right-0 w-64 rounded-xl border-2 shadow-xl overflow-hidden z-20',
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
                  )}
                >
                  <div className="p-2">
                    {/* Read receipt */}
                    <label className={cn('flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer select-none', isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}>
                      <input
                        type="checkbox"
                        checked={message.readReceipt ?? false}
                        onChange={e => onReadReceiptChange(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                      />
                      <span className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>Request read receipt</span>
                    </label>

                    {/* Delivery confirmation */}
                    <label className={cn('flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer select-none', isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}>
                      <input
                        type="checkbox"
                        checked={message.deliveryConfirmation ?? false}
                        onChange={e => onDeliveryConfirmChange(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                      />
                      <span className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>Request delivery confirmation</span>
                    </label>

                    <div className={cn('h-px my-1', isDark ? 'bg-gray-700' : 'bg-gray-200')} />

                    {/* Schedule send */}
                    <button
                      onClick={() => { onScheduleClick(); setShowOptionsMenu(false); }}
                      className={cn('w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 cursor-pointer', isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}
                    >
                      <Clock className="w-4 h-4" />
                      {message.scheduledSend ? 'Change schedule' : 'Schedule send'}
                      {message.scheduledSend && (
                        <span className="ml-auto text-xs text-blue-500">Scheduled</span>
                      )}
                    </button>

                    {/* Save draft now */}
                    <button
                      onClick={() => { onSaveDraft(); setShowOptionsMenu(false); }}
                      className={cn('w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 cursor-pointer', isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}
                    >
                      <Save className="w-4 h-4" />
                      Save draft now
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDiscard}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium border-2 cursor-pointer transition-colors',
              isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-100',
            )}
          >
            Discard
          </button>

          <button
            onClick={onSaveDraft}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium border-2 cursor-pointer transition-colors',
              isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-100',
            )}
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
              </span>
            ) : (
              'Save Draft'
            )}
          </button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSend}
            disabled={isSending}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors',
              'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed',
            )}
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {message.scheduledSend ? 'Schedule' : 'Send'}
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={onFileSelect}
        className="hidden"
        accept="*/*"
      />

      {/* Click-away for menus */}
      {(showPriorityMenu || showOptionsMenu) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => { setShowPriorityMenu(false); setShowOptionsMenu(false); }}
        />
      )}
    </div>
  );
};

export default ComposeFooter;
