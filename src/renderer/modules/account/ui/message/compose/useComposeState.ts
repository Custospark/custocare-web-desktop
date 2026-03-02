/**
 * ============================================================================
 * COMPOSE MODULE — CENTRAL STATE HOOK
 * ============================================================================
 * Manages all business logic: drafts, sends, attachments, validation,
 * optimistic updates, and auto-save.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACCOUNT_ROUTES } from '../../../../../app/routes/routeConstants';
import {
  useStoreMessage,
  useUpdateMessage,
  useSendDraftMessage,
  useUploadMessageAttachment,
  useRemoveMessageAttachment,
}   from '../../../api/messages/MessageQueries';
import type {
  StoreMessageRequest,
  UpdateMessageRequest,
  MessageBodyType,
  MessagePriority,
}  from '../../../api/messages/MessageTypes';
import type {
  ComposeMessage,
  ComposeProps,
  Recipient,
  Attachment,
  EditorMode,
  WindowState,
  StoredContact,
}  from './composeTypes';

/* ─── helpers ─────────────────────────────────────────────────── */
const generateId = () =>
  `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePhone = (phone: string) =>
  /^\+?[\d\s\-().]{7,20}$/.test(phone.trim());

/* ─── contact storage helpers ─────────────────────────────────── */
const CONTACTS_KEY = 'compose_contacts_v1';

export const loadStoredContacts = (): StoredContact[] => {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    return raw ? (JSON.parse(raw) as StoredContact[]) : [];
  } catch {
    return [];
  }
};

export const saveStoredContacts = (contacts: StoredContact[]): void => {
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  } catch { /* quota exceeded — ignore */ }
};

export const recordContactUse = (recipient: Recipient): void => {
  const contacts = loadStoredContacts();
  const existing = contacts.find(
    c => c.email && c.email === recipient.email,
  );
  if (existing) {
    existing.useCount += 1;
    existing.lastUsed = Date.now();
    existing.name = recipient.name || existing.name;
  } else {
    contacts.push({
      id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: recipient.name || '',
      email: recipient.email,
      phone: recipient.phone,
      useCount: 1,
      lastUsed: Date.now(),
    });
  }
  // keep top 200 by use count
  contacts.sort((a, b) => b.useCount - a.useCount);
  saveStoredContacts(contacts.slice(0, 200));
};

/* ─── hook ────────────────────────────────────────────────────── */
export const useComposeState = ({
  onClose,
  onSend,
  onSaveDraft,
  replyTo,
  forwardOf,
  draft,
}: ComposeProps) => {
  const navigate = useNavigate();

  /* ── API mutations ─────────────────────────────────────────── */
  const storeMessage = useStoreMessage();
  const updateMessage = useUpdateMessage();
  const sendDraft = useSendDraftMessage();
  const uploadAttachment = useUploadMessageAttachment();
  const removeAttachment = useRemoveMessageAttachment();

  /* ── backend draft id ──────────────────────────────────────── */
  const [draftMessageId, setDraftMessageId] = useState<number | null>(
    draft?.id && !isNaN(parseInt(draft.id, 10))
      ? parseInt(draft.id, 10)
      : null,
  );

  /* ── initial message ───────────────────────────────────────── */
  const [message, setMessage] = useState<ComposeMessage>(() => {
    if (draft) return draft;

    if (replyTo) {
      return {
        id: generateId(),
        to: [{
          id: `r_${Date.now()}`,
          name: replyTo.sender.name,
          email: replyTo.sender.email,
          contactType: 'email',
          isValid: true,
        }],
        cc: [], bcc: [],
        subject: `Re: ${replyTo.subject}`,
        body: `\n\n─── Original Message ───\nFrom: ${replyTo.sender.name} <${replyTo.sender.email}>\nSubject: ${replyTo.subject}\n\n${replyTo.body.split('\n').map(l => `> ${l}`).join('\n')}`,
        attachments: [], priority: 'normal', labels: [],
        readReceipt: false, deliveryConfirmation: false, scheduledSend: null,
      };
    }

    if (forwardOf) {
      return {
        id: generateId(),
        to: [], cc: [], bcc: [],
        subject: `Fwd: ${forwardOf.subject}`,
        body: `\n\n─── Forwarded Message ───\nFrom: ${forwardOf.sender.name} <${forwardOf.sender.email}>\nSubject: ${forwardOf.subject}\n\n${forwardOf.body}`,
        attachments: forwardOf.attachments?.map(att => ({
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: att.name, size: att.size, type: att.type,
        })) || [],
        priority: 'normal', labels: [],
        readReceipt: false, deliveryConfirmation: false, scheduledSend: null,
      };
    }

    return {
      id: generateId(), to: [], cc: [], bcc: [],
      subject: '', body: '', attachments: [],
      priority: 'normal', labels: [],
      readReceipt: false, deliveryConfirmation: false, scheduledSend: null,
    };
  });

  /* ── UI state ─────────────────────────────────────────────── */
  const [windowState, setWindowState] = useState<WindowState>('normal');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('rich');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [, setOptimisticSent] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── body type helper ─────────────────────────────────────── */
  const getBodyType = useCallback((): MessageBodyType => {
    if (editorMode === 'plain') return 'plain';
    if (editorMode === 'rich') return 'html';
    return 'markdown';
  }, [editorMode]);

  /* ── payload builders ─────────────────────────────────────── */
  const buildPayload = useCallback(
    (saveDraftFlag?: boolean): StoreMessageRequest => ({
      save_draft: saveDraftFlag,
      subject: message.subject || null,
      body: message.body || null,
      body_type: getBodyType(),
      priority: message.priority as MessagePriority,
      to: message.to
        .filter(r => r.email && validateEmail(r.email))
        .map(r => ({ name: r.name, email: r.email })),
      cc: message.cc
        .filter(r => r.email && validateEmail(r.email))
        .map(r => ({ name: r.name, email: r.email })),
      bcc: message.bcc
        .filter(r => r.email && validateEmail(r.email))
        .map(r => ({ name: r.name, email: r.email })),
      labels: message.labels,
      scheduled_send_at: message.scheduledSend?.toISOString() ?? null,
      read_receipt: message.readReceipt,
      delivery_confirmation: message.deliveryConfirmation,
      parent_id: replyTo ? parseInt(replyTo.id, 10) : null,
    }),
    [message, getBodyType, replyTo],
  );

  const buildUpdatePayload = useCallback((): UpdateMessageRequest => ({
    subject: message.subject || null,
    body: message.body || null,
    body_type: getBodyType(),
    priority: message.priority as MessagePriority,
    to: message.to
      .filter(r => r.email && validateEmail(r.email))
      .map(r => ({ name: r.name, email: r.email })),
    cc: message.cc
      .filter(r => r.email && validateEmail(r.email))
      .map(r => ({ name: r.name, email: r.email })),
    bcc: message.bcc
      .filter(r => r.email && validateEmail(r.email))
      .map(r => ({ name: r.name, email: r.email })),
    labels: message.labels,
    scheduled_send_at: message.scheduledSend?.toISOString() ?? null,
    read_receipt: message.readReceipt,
    delivery_confirmation: message.deliveryConfirmation,
  }), [message, getBodyType]);

  /* ── validation ───────────────────────────────────────────── */
  const validateMessage = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    const allRecipients = [...message.to, ...message.cc, ...message.bcc];
    if (allRecipients.length === 0)
      errors.recipients = 'Add at least one recipient';
    allRecipients.forEach(r => {
      if (r.contactType === 'email' && !validateEmail(r.email))
        errors[`email_${r.id}`] = 'Invalid email';
      if (r.contactType === 'phone' && r.phone && !validatePhone(r.phone))
        errors[`phone_${r.id}`] = 'Invalid phone';
    });
    if (!message.subject.trim()) errors.subject = 'Subject is required';
    if (!message.body.trim()) errors.body = 'Message body is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [message]);

  /* ── save draft ───────────────────────────────────────────── */
  const saveDraft = useCallback(() => {
    if (
      message.to.length === 0 &&
      message.cc.length === 0 &&
      message.bcc.length === 0 &&
      !message.subject &&
      !message.body
    ) return;

    // Optimistic update
    setIsSaving(true);
    setLastSaved(new Date());

    if (draftMessageId) {
      updateMessage.mutate(
        { id: draftMessageId, data: buildUpdatePayload() },
        {
          onSuccess: () => {
            setIsSaving(false);
            setLastSaved(new Date());
            onSaveDraft?.(message);
          },
          onError: () => {
            setIsSaving(false);
          },
        },
      );
    } else {
      storeMessage.mutate(buildPayload(true), {
        onSuccess: data => {
          setDraftMessageId(data.message.id);
          setIsSaving(false);
          setLastSaved(new Date());
          onSaveDraft?.(message);
        },
        onError: () => setIsSaving(false),
      });
    }
  }, [
    message, draftMessageId, buildPayload, buildUpdatePayload,
    storeMessage, updateMessage, onSaveDraft,
  ]);

  /* ── auto-save every 30 s ─────────────────────────────────── */
  useEffect(() => {
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setInterval(saveDraft, 30_000);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [saveDraft]);

  /* save on unmount */
  useEffect(() => () => { saveDraft(); }, []); // eslint-disable-line

  /* ── send ─────────────────────────────────────────────────── */
  const handleSend = useCallback(() => {
    if (!validateMessage()) {
      document.querySelector('[data-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSending(true);

    // Optimistic navigation
    setOptimisticSent(true);

    const rollback = () => {
      setIsSending(false);
      setOptimisticSent(false);
    };

    const onSuccess = () => {
      setIsSending(false);
      // Record all recipients for future suggestions
      [...message.to, ...message.cc, ...message.bcc].forEach(recordContactUse);
      onSend?.(message);
      navigate(ACCOUNT_ROUTES.MESSAGES_INBOX);
    };

    if (draftMessageId) {
      updateMessage.mutate(
        { id: draftMessageId, data: buildUpdatePayload() },
        {
          onSuccess: () => {
            sendDraft.mutate({ id: draftMessageId! }, { onSuccess, onError: rollback });
          },
          onError: rollback,
        },
      );
    } else {
      storeMessage.mutate(buildPayload(false), { onSuccess, onError: rollback });
    }
  }, [
    message, draftMessageId, validateMessage, buildPayload, buildUpdatePayload,
    storeMessage, updateMessage, sendDraft, onSend, navigate,
  ]);

  /* ── schedule send ────────────────────────────────────────── */
  const handleScheduleSend = useCallback(() => {
    if (!scheduleDate) return;
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const scheduled = new Date(scheduleDate);
    scheduled.setHours(hours, minutes, 0, 0);
    setMessage(prev => ({ ...prev, scheduledSend: scheduled }));
    setShowSchedulePicker(false);
    saveDraft();
  }, [scheduleDate, scheduleTime, saveDraft]);

  /* ── recipients ───────────────────────────────────────────── */
  const handleAddRecipient = useCallback(
    (type: 'to' | 'cc' | 'bcc', input: string, name?: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      const isPhone = validatePhone(trimmed) && !validateEmail(trimmed);
      const newR: Recipient = isPhone
        ? {
            id: `r_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: name || trimmed,
            email: '',
            phone: trimmed,
            contactType: 'phone',
            isValid: true,
          }
        : {
            id: `r_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: name || trimmed.split('@')[0],
            email: trimmed,
            contactType: 'email',
            isValid: validateEmail(trimmed),
          };

      // Optimistic update
      setMessage(prev => ({ ...prev, [type]: [...prev[type], newR] }));
      // Clear validation error for this field
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next.recipients;
        return next;
      });
    },
    [],
  );

  const handleRemoveRecipient = useCallback(
    (type: 'to' | 'cc' | 'bcc', id: string) =>
      setMessage(prev => ({ ...prev, [type]: prev[type].filter(r => r.id !== id) })),
    [],
  );

  /* ── file upload ──────────────────────────────────────────── */
  const uploadFile = useCallback(
    async (file: File, attachmentId: string) => {
      let msgId = draftMessageId;
      if (!msgId) {
        try {
          const result = await new Promise<number>((resolve, reject) => {
            storeMessage.mutate(buildPayload(true), {
              onSuccess: data => { setDraftMessageId(data.message.id); resolve(data.message.id); },
              onError: reject,
            });
          });
          msgId = result;
        } catch {
          setMessage(prev => ({
            ...prev,
            attachments: prev.attachments.map(a =>
              a.id === attachmentId ? { ...a, error: 'Could not create draft' } : a,
            ),
          }));
          return;
        }
      }

      uploadAttachment.mutate(
        {
          id: msgId,
          file,
          onProgress: pct =>
            setMessage(prev => ({
              ...prev,
              attachments: prev.attachments.map(a =>
                a.id === attachmentId ? { ...a, progress: pct } : a,
              ),
            })),
        },
        {
          onSuccess: data =>
            setMessage(prev => ({
              ...prev,
              attachments: prev.attachments.map(a =>
                a.id === attachmentId
                  ? { ...a, progress: 100, uploadedAttachmentId: data.attachment.id }
                  : a,
              ),
            })),
          onError: () =>
            setMessage(prev => ({
              ...prev,
              attachments: prev.attachments.map(a =>
                a.id === attachmentId ? { ...a, error: 'Upload failed' } : a,
              ),
            })),
        },
      );
    },
    [draftMessageId, buildPayload, storeMessage, uploadAttachment],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      Array.from(e.target.files ?? []).forEach(file => {
        const newAtt: Attachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type || 'unknown',
          file,
          progress: 0,
        };
        // Optimistic add
        setMessage(prev => ({ ...prev, attachments: [...prev.attachments, newAtt] }));
        uploadFile(file, newAtt.id);
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [uploadFile],
  );

  const handleRemoveAttachment = useCallback(
    (id: string) => {
      const att = message.attachments.find(a => a.id === id);
      // Optimistic remove
      setMessage(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== id) }));
      if (att?.uploadedAttachmentId) {
        removeAttachment.mutate({ attachmentId: att.uploadedAttachmentId });
      }
    },
    [message.attachments, removeAttachment],
  );

  /* ── drag & drop ──────────────────────────────────────────── */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation(); setDragActive(false);
      Array.from(e.dataTransfer.files).forEach(file => {
        const newAtt: Attachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name, size: formatFileSize(file.size),
          type: file.type || 'unknown', file, progress: 0,
        };
        setMessage(prev => ({ ...prev, attachments: [...prev.attachments, newAtt] }));
        uploadFile(file, newAtt.id);
      });
    },
    [uploadFile],
  );

  /* ── discard ──────────────────────────────────────────────── */
  const handleDiscard = useCallback(() => {
    const hasContent =
      message.to.length > 0 || message.subject || message.body || message.attachments.length > 0;
    if (hasContent) {
      setShowDiscardConfirm(true);
    } else {
      navigate(ACCOUNT_ROUTES.MESSAGES_INBOX);
      onClose?.();
    }
  }, [message, navigate, onClose]);

  const handleConfirmDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
    navigate(ACCOUNT_ROUTES.MESSAGES_INBOX);
    onClose?.();
  }, [navigate, onClose]);

  /* ── window control ───────────────────────────────────────── */
  const handleMinimize = useCallback(() => setWindowState('minimized'), []);
  const handleMaximize = useCallback(
    () => setWindowState(s => (s === 'maximized' ? 'normal' : 'maximized')),
    [],
  );
  const handleRestore = useCallback(() => setWindowState('normal'), []);

  return {
    /* state */
    message, setMessage,
    windowState,
    showCc, setShowCc,
    showBcc, setShowBcc,
    editorMode, setEditorMode,
    isSaving, lastSaved,
    validationErrors, setValidationErrors,
    isSending,
    dragActive,
    showDiscardConfirm, setShowDiscardConfirm,
    showSchedulePicker, setShowSchedulePicker,
    scheduleDate, setScheduleDate,
    scheduleTime, setScheduleTime,
    draftMessageId,
    fileInputRef,
    /* handlers */
    saveDraft,
    handleSend,
    handleScheduleSend,
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
    validateEmail,
    validatePhone,
  };
};
