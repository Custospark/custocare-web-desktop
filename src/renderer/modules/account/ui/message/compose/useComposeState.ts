/**
 * ============================================================================
 * COMPOSE MODULE — CENTRAL STATE HOOK
 * ============================================================================
 * Fix applied (mirrors the simple Compose component's approach):
 *
 *  ROOT CAUSE: ComposeEditor fires onChange(div.innerHTML), so message.body
 *  holds raw HTML like `<p><b>Hello</b></p>`. buildPayload was shipping this
 *  verbatim with body_type:'html'. The recipient viewer renders it as plain
 *  text → the user sees literal HTML tags.
 *
 *  THE FIX (same concept as the simple Compose's getBodyType returning
 *  'markdown' / 'plain' and capturing textarea value, never raw markup):
 *
 *  1.  htmlToPlainText() — converts rich innerHTML to structured plain text
 *      (preserves line-breaks, paragraphs, bullet points) by using a throw-
 *      away DOM element before stripping tags.
 *
 *  2.  buildPayload / buildUpdatePayload now call htmlToPlainText() when
 *      bodyType is 'html', and send body_type:'plain' to the API.
 *      Non-HTML modes (plain, markdown) pass through unchanged exactly as
 *      the simple Compose does.
 *
 *  3.  bodyType is now initialised to 'plain' and handleEditorModeChange
 *      maps 'rich' → 'plain' (matching the simple Compose's logic of
 *      always sending a renderable, tag-free body to the backend).
 *
 *  The rich contentEditable editor continues to work normally — it still
 *  stores HTML in message.body for its own display needs. The conversion
 *  only happens at the moment of API serialisation.
 * ============================================================================
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ACCOUNT_ROUTES } from '../../../../../app/routes/routeConstants';
import {
  useStoreMessage,
  useUpdateMessage,
  useSendDraftMessage,
  useUploadMessageAttachment,
  useRemoveMessageAttachment,
} from '../../../api/messages/MessageQueries';
import type {
  StoreMessageRequest,
  UpdateMessageRequest,
  MessageBodyType,
  MessagePriority,
  RecipientInput,
} from '../../../api/messages/MessageTypes';
import type {
  ComposeMessage,
  ComposeProps,
  Recipient,
  Attachment,
  EditorMode,
  WindowState,
  StoredContact,
} from './composeTypes';

/* ─── helpers ─────────────────────────────────────────────────── */
const generateId = () =>
  `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024)    return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

import {
  isValidInternationalPhone,
  normalizePhoneInput,
  validateEmail,
} from '../../../../../shared/utils/phoneNumber';

export { normalizePhoneInput } from '../../../../../shared/utils/phoneNumber';

/**
 * htmlToPlainText
 * ───────────────
 * Mirrors the simple Compose's approach of always sending clean, tag-free
 * text to the API instead of raw HTML markup.
 *
 * Steps:
 *  1. Quick-exit if the string contains no HTML tags (already plain/markdown).
 *  2. Pre-process common block elements into visible newline / bullet chars
 *     so the plain-text output retains paragraph & list structure.
 *  3. Assign to a throw-away div and read innerText, which the browser
 *     de-entities and trims for us.
 */
const htmlToPlainText = (html: string): string => {
  if (!html) return '';

  // Already plain text or markdown — pass through untouched
  if (!/<[a-zA-Z][\s\S]*?>/i.test(html)) return html;

  const withLineBreaks = html
    // Hard line-breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Paragraph / block close → double newline (visual paragraph gap)
    .replace(/<\/p>/gi,          '\n\n')
    .replace(/<\/div>/gi,        '\n')
    .replace(/<\/h[1-6]>/gi,     '\n\n')
    .replace(/<\/blockquote>/gi, '\n')
    .replace(/<\/pre>/gi,        '\n')
    // List items → bullet prefix + newline
    .replace(/<li[^>]*>/gi,  '• ')
    .replace(/<\/li>/gi,     '\n')
    .replace(/<\/ul>/gi,     '\n')
    .replace(/<\/ol>/gi,     '\n')
    // Table cells → tab-separated
    .replace(/<\/td>/gi,     '\t')
    .replace(/<\/tr>/gi,     '\n');

  const div = document.createElement('div');
  div.innerHTML = withLineBreaks;

  // innerText handles entity decoding (&amp; → &, &nbsp; → space, etc.)
  const plain = (div.innerText ?? div.textContent ?? '');

  // Collapse 3+ consecutive newlines down to 2 (keep paragraph spacing tidy)
  return plain.replace(/\n{3,}/g, '\n\n').trim();
};

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
  const existing = contacts.find(c =>
    (recipient.email && c.email === recipient.email) ||
    (recipient.phone && c.phone && normalizePhoneInput(c.phone) === normalizePhoneInput(recipient.phone)),
  );
  if (existing) {
    existing.useCount += 1;
    existing.lastUsed = Date.now();
    existing.name = recipient.name || existing.name;
  } else {
    contacts.push({
      id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: recipient.name || '',
      email: recipient.email || '',
      phone: recipient.phone,
      useCount: 1,
      lastUsed: Date.now(),
    });
  }
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
  const outlet = useOutletContext<{ messageInboxPath?: string }>();
  const messageInboxPath = outlet.messageInboxPath ?? ACCOUNT_ROUTES.MESSAGES_INBOX;

  /* ── API mutations ─────────────────────────────────────────── */
  const storeMessage     = useStoreMessage();
  const updateMessage    = useUpdateMessage();
  const sendDraft        = useSendDraftMessage();
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
  const [windowState,          setWindowState]          = useState<WindowState>('normal');
  const [showCc,               setShowCc]               = useState(false);
  const [showBcc,              setShowBcc]              = useState(false);
  const [editorMode,           setEditorMode]           = useState<EditorMode>('rich');
  const [isSaving,             setIsSaving]             = useState(false);
  const [lastSaved,            setLastSaved]            = useState<Date | null>(null);
  const [validationErrors,     setValidationErrors]     = useState<Record<string, string>>({});
  const [isSending,            setIsSending]            = useState(false);
  const [dragActive,           setDragActive]           = useState(false);
  const [showDiscardConfirm,   setShowDiscardConfirm]   = useState(false);
  const [showSchedulePicker,   setShowSchedulePicker]   = useState(false);
  const [scheduleDate,         setScheduleDate]         = useState<Date | null>(null);
  const [scheduleTime,         setScheduleTime]         = useState('09:00');
  const [,                     setOptimisticSent]       = useState(false);

  /*
   * bodyType — tracks the body format independently from the current view
   * mode so that switching to "preview" never corrupts what gets sent.
   *
   * FIX: Initialised to 'plain' (not 'html') to match the simple Compose's
   * philosophy of always shipping clean, renderable text to the backend.
   * The rich editor still stores HTML in message.body for its own display;
   * htmlToPlainText() converts it at serialisation time (buildPayload).
   */
  const [bodyType, setBodyType] = useState<MessageBodyType>('plain');

  const fileInputRef     = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── editor mode change ───────────────────────────────────── */
  /*
   * handleEditorModeChange — mirrors the simple Compose's getBodyType():
   *   plain   → 'plain'
   *   rich    → 'plain'    (body will be de-HTMLed before API call)
   *   markdown→ 'markdown'
   *   preview → unchanged  (read-only; body content was not re-encoded)
   */
  const handleEditorModeChange = useCallback((mode: EditorMode) => {
    setEditorMode(mode);
    if (mode === 'rich')         setBodyType('plain');
    else if (mode === 'plain')   setBodyType('plain');
    else if (mode === 'markdown')setBodyType('markdown');
    // 'preview' intentionally leaves bodyType unchanged
  }, []);


  /* ── payload builders ─────────────────────────────────────── */
  /*
   * Concept borrowed from the simple Compose component:
   *   The simple Compose always sends a clean, tag-free body with a
   *   renderable body_type ('plain' or 'markdown'), never raw HTML.
   *
   * Here we do the same: if the current bodyType is 'plain' AND the
   * stored body looks like HTML (rich editor innerHTML), we call
   * htmlToPlainText() to strip markup before sending.  Markdown and
   * already-plain bodies pass through untouched.
   */
  const getApiBody = useCallback((): string | null => {
    if (!message.body) return null;
    // If body contains HTML tags (rich editor output) convert to plain text
    if (/<[a-zA-Z][\s\S]*?>/i.test(message.body)) {
      return htmlToPlainText(message.body) || null;
    }
    return message.body;
  }, [message.body]);

  const getApiBodyType = useCallback((): MessageBodyType => {
    // If body has HTML tags we normalise to 'plain' regardless of bodyType
    if (/<[a-zA-Z][\s\S]*?>/i.test(message.body || '')) return 'plain';
    return bodyType;
  }, [message.body, bodyType]);

  const mapRecipientForApi = useCallback((r: Recipient): RecipientInput | null => {
    if (r.contactType === 'phone' && r.phone) {
      const normalized = normalizePhoneInput(r.phone);
      if (!isValidInternationalPhone(normalized)) return null;
      return { name: r.name || null, phone: normalized };
    }
    if (r.email && validateEmail(r.email)) {
      return { name: r.name || null, email: r.email };
    }
    return null;
  }, []);

  const buildPayload = useCallback(
    (saveDraftFlag?: boolean): StoreMessageRequest => ({
      save_draft: saveDraftFlag,
      subject:    message.subject || null,
      /*
       * THE CORE FIX:
       * Use getApiBody() instead of message.body directly.
       * This strips HTML tags when the rich editor produced markup,
       * ensuring the recipient never sees raw `<p><b>…</b></p>` text.
       */
      body:       getApiBody(),
      body_type:  getApiBodyType(),
      priority:   message.priority as MessagePriority,
      to: message.to.map(mapRecipientForApi).filter((x): x is RecipientInput => x !== null),
      cc: message.cc.map(mapRecipientForApi).filter((x): x is RecipientInput => x !== null),
      bcc: message.bcc.map(mapRecipientForApi).filter((x): x is RecipientInput => x !== null),
      labels:               message.labels,
      scheduled_send_at:    message.scheduledSend?.toISOString() ?? null,
      read_receipt:         message.readReceipt,
      delivery_confirmation: message.deliveryConfirmation,
      parent_id:            replyTo ? parseInt(replyTo.id, 10) : null,
    }),
    [message, getApiBody, getApiBodyType, replyTo, mapRecipientForApi],
  );

  const buildUpdatePayload = useCallback((): UpdateMessageRequest => ({
    subject:    message.subject || null,
    body:       getApiBody(),       // same fix — strip HTML before API call
    body_type:  getApiBodyType(),
    priority:   message.priority as MessagePriority,
    to: message.to.map(mapRecipientForApi).filter((x): x is RecipientInput => x !== null),
    cc: message.cc.map(mapRecipientForApi).filter((x): x is RecipientInput => x !== null),
    bcc: message.bcc.map(mapRecipientForApi).filter((x): x is RecipientInput => x !== null),
    labels:               message.labels,
    scheduled_send_at:    message.scheduledSend?.toISOString() ?? null,
    read_receipt:         message.readReceipt,
    delivery_confirmation: message.deliveryConfirmation,
  }), [message, getApiBody, getApiBodyType, mapRecipientForApi]);

  /* ── validation ───────────────────────────────────────────── */
  const validateMessage = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    const allRecipients = [...message.to, ...message.cc, ...message.bcc];
    if (allRecipients.length === 0)
      errors.recipients = 'Add at least one recipient';
    allRecipients.forEach(r => {
      if (r.contactType === 'phone') {
        if (!isValidInternationalPhone(r.phone || '')) {
          errors[`phone_${r.id}`] = 'Enter a valid phone with country code (e.g. +256701234567)';
        }
      } else if (!validateEmail(r.email)) {
        errors[`email_${r.id}`] = 'Invalid email';
      }
    });
    if (!message.subject.trim()) errors.subject = 'Subject is required';
    // Strip HTML tags when checking if body is empty (rich editor stores HTML)
    const bodyText = message.body.replace(/<[^>]*>/g, '').trim();
    if (!bodyText) errors.body = 'Message body is required';
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

    setIsSaving(true);
    setLastSaved(new Date());

    if (draftMessageId) {
      updateMessage.mutate(
        { id: draftMessageId, data: buildUpdatePayload() },
        {
          onSuccess: () => { setIsSaving(false); setLastSaved(new Date()); onSaveDraft?.(message); },
          onError:   () => setIsSaving(false),
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
  }, [message, draftMessageId, buildPayload, buildUpdatePayload, storeMessage, updateMessage, onSaveDraft]);

  /* ── auto-save every 30 s ─────────────────────────────────── */
  useEffect(() => {
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setInterval(saveDraft, 30_000);
    return () => { if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current); };
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
    setOptimisticSent(true);

    const rollback = () => { setIsSending(false); setOptimisticSent(false); };

    const onSuccess = () => {
      setIsSending(false);
      [...message.to, ...message.cc, ...message.bcc].forEach(recordContactUse);
      onSend?.(message);
      navigate(messageInboxPath);
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
  }, [message, draftMessageId, validateMessage, buildPayload, buildUpdatePayload, storeMessage, updateMessage, sendDraft, onSend, navigate, messageInboxPath]);

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

      const asEmail = validateEmail(trimmed);
      const normalizedPhone = normalizePhoneInput(trimmed);
      const isPhone = !asEmail && isValidInternationalPhone(normalizedPhone);

      const newR: Recipient = isPhone
        ? {
            id: `r_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: name || trimmed,
            email: '',
            phone: normalizedPhone,
            contactType: 'phone',
            isValid: isValidInternationalPhone(normalizedPhone),
          }
        : {
            id: `r_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: name || trimmed.split('@')[0],
            email: trimmed,
            contactType: 'email',
            isValid: asEmail,
          };

      setMessage(prev => ({ ...prev, [type]: [...prev[type], newR] }));
      setValidationErrors(prev => { const next = { ...prev }; delete next.recipients; return next; });
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
              a.id === attachmentId ? { ...a, error: 'Could not create draft' } : a),
          }));
          return;
        }
      }

      uploadAttachment.mutate(
        {
          id: msgId, file,
          onProgress: pct => setMessage(prev => ({
            ...prev,
            attachments: prev.attachments.map(a =>
              a.id === attachmentId ? { ...a, progress: pct } : a),
          })),
        },
        {
          onSuccess: data => setMessage(prev => ({
            ...prev,
            attachments: prev.attachments.map(a =>
              a.id === attachmentId
                ? { ...a, progress: 100, uploadedAttachmentId: data.attachment.id }
                : a),
          })),
          onError: () => setMessage(prev => ({
            ...prev,
            attachments: prev.attachments.map(a =>
              a.id === attachmentId ? { ...a, error: 'Upload failed' } : a),
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
          name: file.name, size: formatFileSize(file.size),
          type: file.type || 'unknown', file, progress: 0,
        };
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
      setMessage(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== id) }));
      if (att?.uploadedAttachmentId) {
        removeAttachment.mutate({
          attachmentId: att.uploadedAttachmentId,
          messageId: draftMessageId ?? undefined,
        });
      }
    },
    [message.attachments, removeAttachment, draftMessageId],
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
      navigate(messageInboxPath);
      onClose?.();
    }
  }, [message, navigate, onClose, messageInboxPath]);

  const handleConfirmDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
    navigate(messageInboxPath);
    onClose?.();
  }, [navigate, onClose, messageInboxPath]);

  /* ── window control ───────────────────────────────────────── */
  const handleMinimize = useCallback(() => setWindowState('minimized'), []);
  const handleMaximize = useCallback(
    () => setWindowState(s => (s === 'maximized' ? 'normal' : 'maximized')), []);
  const handleRestore  = useCallback(() => setWindowState('normal'), []);

  /* ── return ───────────────────────────────────────────────── */
  return {
    /* state */
    message, setMessage,
    windowState,
    showCc, setShowCc,
    showBcc, setShowBcc,
    editorMode,
    setEditorMode: handleEditorModeChange,
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
    normalizePhoneInput,
  };
};
