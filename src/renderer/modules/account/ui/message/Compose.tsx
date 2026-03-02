/**
 * ============================================================================
 * COMPOSE — MAIN ENTRY POINT  (REWRITE)
 * ============================================================================
 * Fixes applied:
 *  1. Outer modal no longer hides footer content.
 *     `overflow-hidden` is kept for rounded-corner clipping but the
 *     footer is now wrapped in `shrink-0 overflow-x-auto` so its action
 *     bar scrolls horizontally instead of being clipped when the compose
 *     window is narrower than the full button row.
 *
 *  2. The scrollable body area uses `flex-1 min-h-0 overflow-y-auto`
 *     which correctly yields space to the fixed-height footer — without
 *     `min-h-0` a flex child refuses to shrink below its content height,
 *     potentially pushing the footer off screen.
 *
 *  3. `onEditorModeChange` is wired to the new `handleEditorModeChange`
 *     (exposed as `setEditorMode` from the hook) so body_type is always
 *     correct even after switching to preview mode.
 *
 *  4. All footer / dialog dropdowns that must escape the overflow-hidden
 *     boundary should use `position: fixed` in their own implementations
 *     (ComposeFooter, ComposeDialogs).  The layout here makes no further
 *     assumptions about those internals.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Send, X, Maximize2, Save, Paperclip,
} from 'lucide-react';
import { cn } from '../../../../shared/utils/classNameUtils';

import { useComposeState }   from './compose/useComposeState';
import { ComposeHeader }     from './compose/ComposeHeader';
import { ComposeRecipients } from './compose/ComposeRecipients';
import { ComposeEditor }     from './compose/ComposeEditor';
import { ComposeFooter }     from './compose/ComposeFooter';
import { DiscardDialog, ScheduleDialog } from './compose/ComposeDialogs';

import type { ComposeProps } from './compose/composeTypes';

/* ─────────────────────────────────────────────────────────────────
   COMPOSE
───────────────────────────────────────────────────────────────── */
export const Compose: React.FC<ComposeProps> = props => {
  const { theme, replyTo, forwardOf } = props;
  const isDark = theme === 'dark';

  const {
    message,
    setMessage,
    windowState,
    showCc,
    setShowCc,
    showBcc,
    setShowBcc,
    editorMode,
    setEditorMode,       // ← this is now handleEditorModeChange (FIX 3)
    isSaving,
    lastSaved,
    validationErrors,
    isSending,
    dragActive,
    showDiscardConfirm,
    setShowDiscardConfirm,
    showSchedulePicker,
    setShowSchedulePicker,
    fileInputRef,
    saveDraft,
    handleSend,
    handleAddRecipient,
    handleRemoveRecipient,
    handleFileSelect,
    handleRemoveAttachment,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleDiscard,
    handleConfirmDiscard,
    handleMinimize,
    handleMaximize,
    handleRestore,
  } = useComposeState(props);

  /* ═══════════════════════════════════════════════════════════
     MINIMISED STATE
  ═══════════════════════════════════════════════════════════ */
  if (windowState === 'minimized') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={cn(
          'fixed bottom-4 right-4 w-80 rounded-2xl border-2 shadow-2xl overflow-hidden z-50',
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        )}
      >
        {/* Mini header */}
        <div className={cn('flex items-center justify-between px-3 py-2.5 border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-semibold truncate">
              {message.subject || 'New Message'}
            </h3>
            {message.to.length > 0 && (
              <span className="text-xs text-gray-500 shrink-0">
                {message.to.length} recipient{message.to.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0 ml-2">
            <button
              onClick={handleRestore}
              title="Restore"
              className={cn('p-1.5 rounded-lg cursor-pointer transition-colors', isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDiscard}
              title="Close"
              className={cn('p-1.5 rounded-lg cursor-pointer transition-colors', isDark ? 'hover:bg-red-900/30 text-gray-400' : 'hover:bg-red-50 text-gray-500')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body preview */}
        <div
          className={cn('px-3 py-2 text-xs cursor-pointer', isDark ? 'text-gray-400' : 'text-gray-500')}
          onClick={handleRestore}
        >
          {message.body
            ? <p className="truncate line-clamp-2">{message.body.replace(/<[^>]*>/g, '').substring(0, 120)}</p>
            : <p className="italic">No content — click to continue writing</p>}
        </div>

        {/* Mini footer */}
        <div className={cn('flex items-center justify-between px-2 py-2 border-t', isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50')}>
          <button
            onClick={saveDraft}
            className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-colors', isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600')}
          >
            <Save className="w-3 h-3" /> Save
          </button>

          <div className="flex items-center gap-1">
            {message.attachments.length > 0 && (
              <span className={cn('flex items-center gap-0.5 text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                <Paperclip className="w-3 h-3" /> {message.attachments.length}
              </span>
            )}
            <button
              onClick={handleSend}
              disabled={isSending}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-60 transition-colors"
            >
              <Send className="w-3 h-3" />
              {message.scheduledSend ? 'Schedule' : 'Send'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     FULL COMPOSE
  ═══════════════════════════════════════════════════════════ */
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={cn(
          /*
           * FIX 1 — `overflow-hidden` is intentionally kept here so that
           * border-radius clips the inner content to the rounded shape.
           * All pop-ups that must escape this clipping context (toolbar
           * dropdowns, footer menus) use z-[9999] with position:fixed or
           * the document-level mousedown handler, not position:absolute.
           */
          'fixed flex flex-col rounded-2xl border-2 shadow-2xl overflow-hidden z-50',
          windowState === 'maximized'
            ? 'inset-0 rounded-none'
            : 'inset-3 md:inset-8 lg:inset-12',
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        )}
      >
        {/* ── Header (fixed height) ────────────────────────────── */}
        <ComposeHeader
          theme={theme}
          windowState={windowState}
          isSaving={isSaving}
          lastSaved={lastSaved}
          scheduledSend={message.scheduledSend}
          isReply={!!replyTo}
          isForward={!!forwardOf}
          subject={message.subject}
          onMinimize={handleMinimize}
          onMaximize={handleMaximize}
          onDiscard={handleDiscard}
        />

        {/*
         * ── Scrollable compose area ────────────────────────────
         * FIX 2 — `flex-1 min-h-0` forces this section to shrink
         * when the window is short so the footer is never pushed
         * off screen.  `overflow-y-auto` lets the user scroll
         * through long content.
         */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          {/* Subject row */}
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2 border-b shrink-0',
              validationErrors.subject
                ? 'border-red-400'
                : isDark ? 'border-gray-700' : 'border-gray-200',
            )}
          >
            <span className={cn('text-xs font-semibold uppercase tracking-wide w-14 shrink-0', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Subject
            </span>
            <input
              type="text"
              value={message.subject}
              onChange={e => setMessage(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter subject…"
              className={cn(
                'flex-1 bg-transparent outline-none text-sm',
                isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400',
              )}
            />
            {validationErrors.subject && (
              <span className="text-xs text-red-500 shrink-0">{validationErrors.subject}</span>
            )}
          </div>

          {/* Recipients */}
          <ComposeRecipients
            theme={theme}
            to={message.to}
            cc={message.cc}
            bcc={message.bcc}
            showCc={showCc}
            showBcc={showBcc}
            validationErrors={validationErrors}
            onAddRecipient={handleAddRecipient}
            onRemoveRecipient={handleRemoveRecipient}
            onToggleCc={() => setShowCc(v => !v)}
            onToggleBcc={() => setShowBcc(v => !v)}
          />

          {/* Editor — flex-1 so it fills remaining vertical space */}
          <div className="flex flex-col flex-1 min-h-0">
            <ComposeEditor
              theme={theme}
              body={message.body}
              editorMode={editorMode}
              validationError={validationErrors.body}
              dragActive={dragActive}
              onChange={body => setMessage(prev => ({ ...prev, body }))}
              onEditorModeChange={setEditorMode}  // ← FIX 3
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onAttachFile={() => fileInputRef.current?.click()}
            />
          </div>
        </div>

        {/*
         * ── Footer ──────────────────────────────────────────────
         * FIX 1 — `shrink-0` prevents the footer from being
         * compressed by the scrollable area above.
         * `overflow-x-auto` lets the footer's action row scroll
         * horizontally when the compose window is narrow instead
         * of being silently cropped by the outer overflow-hidden.
         *
         * If ComposeFooter contains dropdowns that open upward,
         * those should use `position: fixed` internally so they
         * escape the overflow-hidden clip boundary.
         */}
        <div className="shrink-0 overflow-x-auto">
          <ComposeFooter
            theme={theme}
            message={message}
            isSending={isSending}
            isSaving={isSaving}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onPriorityChange={p   => setMessage(prev => ({ ...prev, priority: p }))}
            onReadReceiptChange={v => setMessage(prev => ({ ...prev, readReceipt: v }))}
            onDeliveryConfirmChange={v => setMessage(prev => ({ ...prev, deliveryConfirmation: v }))}
            onScheduleClick={() => setShowSchedulePicker(true)}
            onAddLabel={label =>
              setMessage(prev => ({
                ...prev,
                labels: prev.labels.includes(label) ? prev.labels : [...prev.labels, label],
              }))
            }
            onRemoveLabel={label =>
              setMessage(prev => ({ ...prev, labels: prev.labels.filter(l => l !== label) }))
            }
            onAttachClick={() => fileInputRef.current?.click()}
            onRemoveAttachment={handleRemoveAttachment}
            onSaveDraft={saveDraft}
            onSend={handleSend}
            onDiscard={handleDiscard}
          />
        </div>
      </motion.div>

      {/* ── Discard confirmation ─────────────────────────────── */}
      <DiscardDialog
        theme={theme}
        open={showDiscardConfirm}
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
      />

      {/* ── Schedule picker ──────────────────────────────────── */}
      <ScheduleDialog
        theme={theme}
        open={showSchedulePicker}
        currentSchedule={message.scheduledSend}
        onSchedule={date => {
          setMessage(prev => ({ ...prev, scheduledSend: date }));
          setShowSchedulePicker(false);
          saveDraft();
        }}
        onRemoveSchedule={() => {
          setMessage(prev => ({ ...prev, scheduledSend: null }));
          setShowSchedulePicker(false);
        }}
        onCancel={() => setShowSchedulePicker(false)}
      />
    </>
  );
};

export default Compose;