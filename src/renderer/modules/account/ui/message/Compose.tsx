/**
 * ============================================================================
 * COMPOSE COMPONENT
 * ============================================================================
 * 
 * Compose component for creating new messages with rich text editing,
 * recipient management, attachments, and auto-save functionality.
 * Includes window state management (normal/minimized/maximized) and
 * navigation to inbox on close/discard.
 * 
 * @component Compose
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Send,
  X,
  Paperclip,
  AlertCircle,
  CheckCircle,
  User,
  Plus,
  Maximize2,
  Minimize2,
  Save,
  Clock,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  Smile,
  MoreHorizontal,
  ChevronDown,
  Tag,
} from 'lucide-react';
import { cn } from '../../../../shared/utils/classNameUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ACCOUNT_ROUTES } from '../../../../app/routes/routeConstants';
/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface ComposeProps {
  theme: 'light' | 'dark';
  onClose?: () => void;
  onSend?: (message: ComposeMessage) => void;
  onSaveDraft?: (message: ComposeMessage) => void;
  replyTo?: {
    id: string;
    subject: string;
    sender: {
      name: string;
      email: string;
    };
    recipients: Array<{
      name: string;
      email: string;
    }>;
    body: string;
  };
  forwardOf?: {
    id: string;
    subject: string;
    sender: {
      name: string;
      email: string;
    };
    body: string;
    attachments?: Array<{
      name: string;
      size: string;
      type: string;
    }>;
  };
  draft?: ComposeMessage;
}

interface ComposeMessage {
  id: string;
  to: Recipient[];
  cc: Recipient[];
  bcc: Recipient[];
  subject: string;
  body: string;
  attachments: Attachment[];
  priority: 'low' | 'normal' | 'high';
  labels: string[];
  isHtml?: boolean;
  saveDraft?: boolean;
  scheduledSend?: Date | null;
  readReceipt?: boolean;
  deliveryConfirmation?: boolean;
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  isValid?: boolean;
}

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  file?: File;
  progress?: number;
  error?: string;
}

type EditorMode = 'rich' | 'plain' | 'preview';

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export const Compose: React.FC<ComposeProps> = ({ 
  theme, 
  onClose, 
  onSend, 
  onSaveDraft,
  replyTo,
  forwardOf,
  draft 
}) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  
  /* -------------------------------- State --------------------------------- */
  
  // Window state
  const [windowState, setWindowState] = useState<'normal' | 'minimized' | 'maximized'>('normal');
  
  // Generate a unique ID for new messages
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Message state
  const [message, setMessage] = useState<ComposeMessage>(() => {
    if (draft) return draft;
    
    if (replyTo) {
      return {
        id: generateId(),
        to: [{
          id: `recipient_${Date.now()}_1`,
          name: replyTo.sender.name,
          email: replyTo.sender.email,
          isValid: true
        }],
        cc: [],
        bcc: [],
        subject: `Re: ${replyTo.subject}`,
        body: `\n\n--- Original Message ---\nFrom: ${replyTo.sender.name} <${replyTo.sender.email}>\nTo: ${replyTo.recipients.map(r => r.name).join(', ')}\nSubject: ${replyTo.subject}\n\n${replyTo.body.split('\n').map(line => `> ${line}`).join('\n')}`,
        attachments: [],
        priority: 'normal',
        labels: [],
        readReceipt: false,
        deliveryConfirmation: false,
        scheduledSend: null,
      };
    }
    
    if (forwardOf) {
      return {
        id: generateId(),
        to: [],
        cc: [],
        bcc: [],
        subject: `Fwd: ${forwardOf.subject}`,
        body: `\n\n--- Forwarded Message ---\nFrom: ${forwardOf.sender.name} <${forwardOf.sender.email}>\nSubject: ${forwardOf.subject}\n\n${forwardOf.body}`,
        attachments: forwardOf.attachments?.map(att => ({
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: att.name,
          size: att.size,
          type: att.type,
        })) || [],
        priority: 'normal',
        labels: [],
        readReceipt: false,
        deliveryConfirmation: false,
        scheduledSend: null,
      };
    }
    
    // New message
    return {
      id: generateId(),
      to: [],
      cc: [],
      bcc: [],
      subject: '',
      body: '',
      attachments: [],
      priority: 'normal',
      labels: [],
      readReceipt: false,
      deliveryConfirmation: false,
      scheduledSend: null,
    };
  });
  
  // UI state
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('rich');
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isSending, setIsSending] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [dragActive, setDragActive] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const bodyInputRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>(null);
  const composeRef = useRef<HTMLDivElement>(null);
  
  /* ---------------------------- Navigation Handlers ---------------------------- */
  
  const handleClose = useCallback(() => {
    // Save draft before closing if there's content
    if (message.to.length > 0 || message.subject || message.body) {
      saveDraft();
    }
    
    // Navigate to inbox
    navigate(ACCOUNT_ROUTES.MESSAGES_INBOX);
    
    // Call onClose prop if provided
    if (onClose) {
      onClose();
    }
  }, [message, navigate, onClose]);
  
  const handleDiscard = useCallback(() => {
    // Check if there's unsaved content
    const hasContent = message.to.length > 0 || message.subject || message.body || message.attachments.length > 0;
    
    if (hasContent) {
      setShowDiscardConfirm(true);
    } else {
      // Navigate to inbox without saving
      navigate(ACCOUNT_ROUTES.MESSAGES_INBOX);
      
      // Call onClose prop if provided
      if (onClose) {
        onClose();
      }
    }
  }, [message, navigate, onClose]);
  
  const handleConfirmDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
    navigate(ACCOUNT_ROUTES.MESSAGES_INBOX);
    if (onClose) {
      onClose();
    }
  }, [navigate, onClose]);
  
  /* ---------------------------- Window Control Handlers ---------------------------- */
  
  const handleMinimize = useCallback(() => {
    setWindowState('minimized');
  }, []);
  
  const handleMaximize = useCallback(() => {
    setWindowState(windowState === 'maximized' ? 'normal' : 'maximized');
  }, [windowState]);
  
  const handleRestore = useCallback(() => {
    setWindowState('normal');
  }, []);
  
  /* ---------------------------- Auto-save Logic ---------------------------- */
  
  const saveDraft = useCallback(() => {
    if (message.to.length === 0 && !message.subject && !message.body) {
      // Don't save empty drafts
      return;
    }
    
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      if (onSaveDraft) {
        onSaveDraft(message);
      }
      console.log('Draft saved:', message.id);
    }, 500);
  }, [message, onSaveDraft]);
  
  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setInterval(() => {
      saveDraft();
    }, 30000);
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [saveDraft]);
  
  // Save draft on unmount
  useEffect(() => {
    return () => {
      saveDraft();
    };
  }, [saveDraft]);
  
  /* ---------------------------- Validation ---------------------------- */
  
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  const validateMessage = useCallback((): boolean => {
    const errors: {[key: string]: string} = {};
    
    // Validate at least one recipient
    if (message.to.length === 0 && message.cc.length === 0 && message.bcc.length === 0) {
      errors.recipients = 'Add at least one recipient';
    }
    
    // Validate email formats
    [...message.to, ...message.cc, ...message.bcc].forEach(recipient => {
      if (!validateEmail(recipient.email)) {
        errors[`email_${recipient.id}`] = 'Invalid email format';
      }
    });
    
    // Validate subject
    if (!message.subject.trim()) {
      errors.subject = 'Subject is required';
    }
    
    // Validate body
    if (!message.body.trim()) {
      errors.body = 'Message body is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [message]);
  
  /* ---------------------------- Event Handlers ---------------------------- */
  
  const handleAddRecipient = useCallback((type: 'to' | 'cc' | 'bcc', email: string, name?: string) => {
    if (!email.trim()) return;
    
    const newRecipient: Recipient = {
      id: `recipient_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: name || email.split('@')[0],
      email: email.trim(),
      isValid: validateEmail(email.trim()),
    };
    
    setMessage(prev => ({
      ...prev,
      [type]: [...prev[type], newRecipient],
    }));
  }, []);
  
  const handleRemoveRecipient = useCallback((type: 'to' | 'cc' | 'bcc', id: string) => {
    setMessage(prev => ({
      ...prev,
      [type]: prev[type].filter(r => r.id !== id),
    }));
  }, []);
  
  const handleRecipientKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, type: 'to' | 'cc' | 'bcc') => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      const input = e.currentTarget;
      const value = input.value.trim();
      
      if (value) {
        // Handle multiple emails separated by commas or semicolons
        const emails = value.split(/[,;]/).map(v => v.trim()).filter(v => v);
        emails.forEach(email => {
          handleAddRecipient(type, email);
        });
        input.value = '';
      }
    }
  }, [handleAddRecipient]);
  
  const handleRecipientBlur = useCallback((e: React.FocusEvent<HTMLInputElement>, type: 'to' | 'cc' | 'bcc') => {
    const value = e.target.value.trim();
    if (value) {
      handleAddRecipient(type, value);
      e.target.value = '';
    }
  }, [handleAddRecipient]);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const newAttachment: Attachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || 'unknown',
        file,
        progress: 0,
      };
      
      // Simulate upload progress
      setMessage(prev => ({
        ...prev,
        attachments: [...prev.attachments, newAttachment],
      }));
      
      // Simulate upload progress updates
      simulateUpload(newAttachment.id);
    });
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);
  
  const simulateUpload = useCallback((attachmentId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      
      setMessage(prev => ({
        ...prev,
        attachments: prev.attachments.map(att =>
          att.id === attachmentId ? { ...att, progress } : att
        ),
      }));
    }, 200);
  }, []);
  
  const handleRemoveAttachment = useCallback((id: string) => {
    setMessage(prev => ({
      ...prev,
      attachments: prev.attachments.filter(a => a.id !== id),
    }));
  }, []);
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      const newAttachment: Attachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type || 'unknown',
        file,
        progress: 0,
      };
      
      setMessage(prev => ({
        ...prev,
        attachments: [...prev.attachments, newAttachment],
      }));
      
      simulateUpload(newAttachment.id);
    });
  }, [simulateUpload]);
  
  const handleSend = useCallback(() => {
    if (!validateMessage()) {
      // Scroll to first error
      const firstError = document.querySelector('.border-red-500');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    setIsSending(true);
    
    // Simulate sending
    setTimeout(() => {
      setIsSending(false);
      if (onSend) {
        onSend(message);
      }
      console.log('Message sent:', message);
      handleClose();
    }, 1500);
  }, [message, onSend, validateMessage, handleClose]);
  
  const handleScheduleSend = useCallback(() => {
    if (!scheduleDate) return;
    
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const scheduled = new Date(scheduleDate);
    scheduled.setHours(hours, minutes, 0, 0);
    
    setMessage(prev => ({
      ...prev,
      scheduledSend: scheduled,
    }));
    
    setShowSchedulePicker(false);
    
    // Show confirmation
    saveDraft();
  }, [scheduleDate, scheduleTime, saveDraft]);
  
  const insertTextAtCursor = useCallback((text: string) => {
    if (!editorRef.current) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const currentValue = editorRef.current.value;
    
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    
    setMessage(prev => ({
      ...prev,
      body: newValue,
    }));
    
    // Reset cursor position
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.selectionStart = start + text.length;
        editorRef.current.selectionEnd = start + text.length;
        editorRef.current.focus();
      }
    }, 0);
  }, []);
  
  const insertLink = useCallback(() => {
    if (linkUrl && linkText) {
      insertTextAtCursor(`[${linkText}](${linkUrl})`);
    } else if (linkUrl) {
      insertTextAtCursor(linkUrl);
    }
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  }, [linkUrl, linkText, insertTextAtCursor]);
  
  /* ---------------------------- Helper Functions ---------------------------- */
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const getRecipientDisplay = (recipient: Recipient): string => {
    return recipient.name !== recipient.email 
      ? `${recipient.name} <${recipient.email}>`
      : recipient.email;
  };
  
  /* ---------------------------- Render Helpers ---------------------------- */
  
  const renderRecipientGroup = (type: 'to' | 'cc' | 'bcc', recipients: Recipient[], show: boolean) => {
    if (!show && type !== 'to') return null;
    
    return (
      <div className="flex items-start gap-2 py-2 border-b-2 border-gray-200 dark:border-gray-700">
        <span className={cn(
          'w-12 text-sm font-medium pt-2',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}>
          {type.toUpperCase()}:
        </span>
        <div className="flex-1 flex flex-wrap items-center gap-2">
          {recipients.map(recipient => (
            <span
              key={recipient.id}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm group',
                !recipient.isValid
                  ? isDark
                    ? 'bg-red-900/20 text-red-300 border border-red-500/30'
                    : 'bg-red-50 text-red-600 border border-red-200'
                  : isDark
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-700'
              )}
            >
              <User className="w-3 h-3" />
              <span>{getRecipientDisplay(recipient)}</span>
              <button
                onClick={() => handleRemoveRecipient(type, recipient.id)}
                className={cn(
                  'ml-1 p-0.5 rounded-full hover:bg-gray-600/20',
                  isDark ? 'hover:text-white' : 'hover:text-gray-900'
                )}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder={recipients.length === 0 ? `Add ${type} recipients` : ''}
            onKeyDown={(e) => handleRecipientKeyDown(e, type)}
            onBlur={(e) => handleRecipientBlur(e, type)}
            className={cn(
              'flex-1 min-w-[200px] py-1 bg-transparent outline-none text-sm',
              isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            )}
          />
        </div>
        {type === 'to' && !showCc && !showBcc && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCc(true)}
              className={cn(
                'text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              Add CC
            </button>
            <button
              onClick={() => setShowBcc(true)}
              className={cn(
                'text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              Add BCC
            </button>
          </div>
        )}
      </div>
    );
  };
  
  const renderEditorToolbar = () => (
    <div className={cn(
      'flex items-center gap-1 p-2 border-b-2',
      isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
    )}>
      <button
        onClick={() => insertTextAtCursor('**' + '**')}
        className={cn(
          'p-2 rounded-lg transition-colors',
          isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
        )}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => insertTextAtCursor('*' + '*')}
        className={cn(
          'p-2 rounded-lg transition-colors',
          isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
        )}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => insertTextAtCursor('__' + '__')}
        className={cn(
          'p-2 rounded-lg transition-colors',
          isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
        )}
        title="Underline"
      >
        <Underline className="w-4 h-4" />
      </button>
      <span className={cn(
        'w-px h-6 mx-1',
        isDark ? 'bg-gray-700' : 'bg-gray-300'
      )} />
      <button
        onClick={() => insertTextAtCursor('- ')}
        className={cn(
          'p-2 rounded-lg transition-colors',
          isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
        )}
        title="Bullet list"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => insertTextAtCursor('1. ')}
        className={cn(
          'p-2 rounded-lg transition-colors',
          isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
        )}
        title="Numbered list"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <span className={cn(
        'w-px h-6 mx-1',
        isDark ? 'bg-gray-700' : 'bg-gray-300'
      )} />
      <button
        onClick={() => setShowLinkDialog(true)}
        className={cn(
          'p-2 rounded-lg transition-colors',
          isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
        )}
        title="Insert link"
      >
        <Link className="w-4 h-4" />
      </button>
      <button
        onClick={() => {/* Simulate image upload */}}
        className={cn(
          'p-2 rounded-lg transition-colors',
          isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
        )}
        title="Insert image"
      >
        <Image className="w-4 h-4" />
      </button>
      <button
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        className={cn(
          'p-2 rounded-lg transition-colors',
          isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
        )}
        title="Add emoji"
      >
        <Smile className="w-4 h-4" />
      </button>
      
      <div className="flex-1" />
      
      <select
        value={editorMode}
        onChange={(e) => setEditorMode(e.target.value as EditorMode)}
        className={cn(
          'px-2 py-1 rounded-lg text-sm border-2',
          isDark
            ? 'bg-gray-700 border-gray-600 text-white'
            : 'bg-white border-gray-200 text-gray-900'
        )}
      >
        <option value="rich">Rich Text</option>
        <option value="plain">Plain Text</option>
        <option value="preview">Preview</option>
      </select>
    </div>
  );
  
  const renderPriorityMenu = () => (
    <div className="relative">
      <button
        onClick={() => setShowPriorityMenu(!showPriorityMenu)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2',
          message.priority === 'high'
            ? isDark
              ? 'bg-red-900/20 text-red-300 border-red-500/30'
              : 'bg-red-50 text-red-600 border-red-200'
            : message.priority === 'low'
              ? isDark
                ? 'bg-green-900/20 text-green-300 border-green-500/30'
                : 'bg-green-50 text-green-600 border-green-200'
              : isDark
                ? 'bg-gray-800 border-gray-700 text-gray-300'
                : 'bg-gray-50 border-gray-200 text-gray-700'
        )}
      >
        {message.priority === 'high' && <AlertCircle className="w-4 h-4" />}
        {message.priority === 'low' && <CheckCircle className="w-4 h-4" />}
        Priority
        <ChevronDown className="w-4 h-4" />
      </button>
      
      <AnimatePresence>
        {showPriorityMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'absolute left-0 top-full mt-1 w-40 rounded-lg border-2 shadow-lg overflow-hidden z-10',
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            )}
          >
            <button
              onClick={() => {
                setMessage(prev => ({ ...prev, priority: 'normal' }));
                setShowPriorityMenu(false);
              }}
              className={cn(
                'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                isDark
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              )}
            >
              Normal
            </button>
            <button
              onClick={() => {
                setMessage(prev => ({ ...prev, priority: 'high' }));
                setShowPriorityMenu(false);
              }}
              className={cn(
                'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                isDark
                  ? 'hover:bg-gray-700 text-red-400'
                  : 'hover:bg-gray-100 text-red-600'
              )}
            >
              <AlertCircle className="w-4 h-4" />
              High
            </button>
            <button
              onClick={() => {
                setMessage(prev => ({ ...prev, priority: 'low' }));
                setShowPriorityMenu(false);
              }}
              className={cn(
                'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                isDark
                  ? 'hover:bg-gray-700 text-green-400'
                  : 'hover:bg-gray-100 text-green-600'
              )}
            >
              <CheckCircle className="w-4 h-4" />
              Low
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  
  const renderOptionsMenu = () => (
    <div className="relative">
      <button
        onClick={() => setShowOptionsMenu(!showOptionsMenu)}
        className={cn(
          'p-2 rounded-lg transition-colors',
          isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
        )}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
      
      <AnimatePresence>
        {showOptionsMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'absolute right-0 top-full mt-1 w-64 rounded-lg border-2 shadow-lg overflow-hidden z-10',
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            )}
          >
            <div className="p-2">
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={message.readReceipt}
                  onChange={(e) => setMessage(prev => ({ ...prev, readReceipt: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm">Request read receipt</span>
              </label>
              
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={message.deliveryConfirmation}
                  onChange={(e) => setMessage(prev => ({ ...prev, deliveryConfirmation: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm">Request delivery confirmation</span>
              </label>
              
              <div className={cn(
                'h-px my-2',
                isDark ? 'bg-gray-700' : 'bg-gray-200'
              )} />
              
              <button
                onClick={() => {
                  setShowSchedulePicker(true);
                  setShowOptionsMenu(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2',
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                )}
              >
                <Clock className="w-4 h-4" />
                Schedule send
              </button>
              
              <button
                onClick={() => {
                  setMessage(prev => ({
                    ...prev,
                    labels: [...prev.labels, 'important']
                  }));
                  setShowOptionsMenu(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2',
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                )}
              >
                <Tag className="w-4 h-4" />
                Add label
              </button>
              
              <button
                onClick={() => {
                  saveDraft();
                  setShowOptionsMenu(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2',
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                )}
              >
                <Save className="w-4 h-4" />
                Save draft now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  
  const renderAttachments = () => (
    <div className="p-3 border-t-2 border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap gap-2">
        {message.attachments.map(attachment => (
          <div
            key={attachment.id}
            className={cn(
              'relative group p-2 pr-8 rounded-lg border-2',
              isDark
                ? 'bg-gray-700 border-gray-600'
                : 'bg-gray-50 border-gray-200'
            )}
          >
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              <div>
                <p className="text-xs font-medium truncate max-w-[150px]">
                  {attachment.name}
                </p>
                <p className="text-xs text-gray-500">
                  {attachment.size}
                </p>
              </div>
            </div>
            
            {/* Upload progress */}
            {attachment.progress !== undefined && attachment.progress < 100 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600 rounded-b-lg overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${attachment.progress}%` }}
                />
              </div>
            )}
            
            {/* Remove button */}
            <button
              onClick={() => handleRemoveAttachment(attachment.id)}
              className={cn(
                'absolute right-1 top-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
                isDark
                  ? 'hover:bg-gray-600 text-gray-400'
                  : 'hover:bg-gray-200 text-gray-600'
              )}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'p-2 rounded-lg border-2 border-dashed flex items-center gap-2 text-sm',
            isDark
              ? 'border-gray-600 text-gray-400 hover:bg-gray-700'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          )}
        >
          <Plus className="w-4 h-4" />
          Add attachment
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
  
  /* -------------------------------------------------------------------------- */
  /*                                 RENDER                                     */
  /* -------------------------------------------------------------------------- */
  
  // If minimized, show a compact version
  if (windowState === 'minimized') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={cn(
          'fixed bottom-4 right-4 w-80 rounded-xl border-2 shadow-2xl overflow-hidden z-50',
          isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        )}
      >
        <div className={cn(
          'flex items-center justify-between p-3 border-b-2',
          isDark ? 'border-gray-700' : 'border-gray-200'
        )}>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate max-w-[150px]">
              {message.subject || 'New Message'}
            </h3>
            {message.to.length > 0 && (
              <span className="text-xs text-gray-500">
                To: {message.to.length} recipient(s)
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleRestore}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              )}
              title="Restore"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDiscard}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              )}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="p-3 text-sm text-gray-500">
          {message.body ? (
            <p className="truncate">{message.body.substring(0, 100)}</p>
          ) : (
            <p className="italic">No content</p>
          )}
        </div>
        
        <div className={cn(
          'flex items-center justify-between p-2 border-t-2',
          isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-100'
        )}>
          <button
            onClick={saveDraft}
            className={cn(
              'px-2 py-1 rounded text-xs font-medium flex items-center gap-1',
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            )}
          >
            <Save className="w-3 h-3" />
            Save
          </button>
          <button
            onClick={handleSend}
            className={cn(
              'px-2 py-1 rounded text-xs font-medium flex items-center gap-1 bg-blue-600 text-white',
              isDark ? 'hover:bg-blue-700' : 'hover:bg-blue-700'
            )}
          >
            <Send className="w-3 h-3" />
            Send
          </button>
        </div>
      </motion.div>
    );
  }
  
  return (
    <>
      <motion.div
        ref={composeRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={cn(
          'fixed inset-4 md:inset-10 flex flex-col rounded-xl border-2 shadow-2xl overflow-hidden z-50',
          windowState === 'maximized' ? 'md:inset-0' : 'md:inset-10',
          isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-4 border-b-2',
          isDark ? 'border-gray-700' : 'border-gray-200'
        )}>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              {replyTo ? 'Reply' : forwardOf ? 'Forward' : 'New Message'}
            </h2>
            {message.scheduledSend && (
              <span className={cn(
                'text-xs px-2 py-1 rounded-full flex items-center gap-1',
                isDark
                  ? 'bg-blue-900/20 text-blue-300 border border-blue-500/30'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
              )}>
                <Clock className="w-3 h-3" />
                Scheduled for {message.scheduledSend.toLocaleDateString()} at {message.scheduledSend.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Save status */}
            {isSaving && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Save className="w-4 h-4 animate-pulse" />
                Saving...
              </span>
            )}
            {lastSaved && !isSaving && (
              <span className="text-xs text-gray-500">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            
            {/* Minimize button */}
            <button
              onClick={handleMinimize}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              )}
              title="Minimize"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            
            {/* Maximize/Restore button */}
            <button
              onClick={handleMaximize}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              )}
              title={windowState === 'maximized' ? 'Restore' : 'Maximize'}
            >
              {windowState === 'maximized' ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
            
            {/* Close button */}
            <button
              onClick={handleDiscard}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              )}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Compose Area */}
        <div 
          className={cn(
            'flex-1 overflow-y-auto relative',
            dragActive && 'ring-2 ring-blue-500 ring-inset'
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Drag & drop overlay */}
          <AnimatePresence>
            {dragActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500 border-dashed rounded-lg m-4 pointer-events-none flex items-center justify-center"
              >
                <div className={cn(
                  'p-4 rounded-lg text-center',
                  isDark ? 'bg-gray-800' : 'bg-white'
                )}>
                  <Paperclip className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="font-medium">Drop files to attach</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Recipients */}
          <div className="p-4 space-y-2">
            {renderRecipientGroup('to', message.to, true)}
            {renderRecipientGroup('cc', message.cc, showCc)}
            {renderRecipientGroup('bcc', message.bcc, showBcc)}
            
            {/* Validation error */}
            {validationErrors.recipients && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.recipients}
              </p>
            )}
          </div>
          
          {/* Subject */}
          <div className={cn(
            'flex items-center gap-2 px-4 py-2 border-b-2 border-t-2',
            validationErrors.subject && 'border-red-500',
            isDark ? 'border-gray-700' : 'border-gray-200'
          )}>
            <span className={cn(
              'text-sm font-medium w-12',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
              Subject:
            </span>
            <input
              type="text"
              value={message.subject}
              onChange={(e) => setMessage(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter subject"
              className={cn(
                'flex-1 bg-transparent outline-none text-sm',
                isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
              )}
            />
            {validationErrors.subject && (
              <span className="text-xs text-red-500">{validationErrors.subject}</span>
            )}
          </div>
          
          {/* Editor Toolbar */}
          {editorMode !== 'preview' && renderEditorToolbar()}
          
          {/* Message Body */}
          <div className={cn(
            'p-4',
            validationErrors.body && 'border-2 border-red-500 rounded-lg mx-4'
          )}>
            {editorMode === 'preview' ? (
              <div className={cn(
                'prose max-w-none min-h-[300px]',
                isDark ? 'prose-invert' : ''
              )}>
                {message.body.split('\n').map((paragraph, i) => (
                  <p key={i}>{paragraph || <br />}</p>
                ))}
              </div>
            ) : (
              <textarea
                ref={editorRef}
                value={message.body}
                onChange={(e) => setMessage(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Write your message..."
                className={cn(
                  'w-full min-h-[300px] bg-transparent outline-none resize-none text-sm',
                  isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                )}
              />
            )}
            
            {validationErrors.body && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-2">
                <AlertCircle className="w-4 h-4" />
                {validationErrors.body}
              </p>
            )}
          </div>
          
          {/* Attachments */}
          {message.attachments.length > 0 && renderAttachments()}
          
          {/* Emoji Picker (simplified) */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={cn(
                  'absolute bottom-20 right-4 p-3 rounded-lg border-2 shadow-lg',
                  isDark
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-white border-gray-200'
                )}
              >
                <div className="grid grid-cols-8 gap-1">
                  {['😊', '😂', '😍', '👍', '🎉', '❤️', '😢', '😡'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        insertTextAtCursor(emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Link Dialog */}
          <AnimatePresence>
            {showLinkDialog && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center"
                onClick={() => setShowLinkDialog(false)}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className={cn(
                    'w-96 p-4 rounded-xl border-2',
                    isDark
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Link text (optional)"
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border-2 text-sm',
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                      )}
                    />
                    
                    <input
                      type="url"
                      placeholder="URL"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border-2 text-sm',
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setShowLinkDialog(false)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium',
                        isDark
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={insertLink}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium',
                        isDark
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      )}
                      disabled={!linkUrl}
                    >
                      Insert
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Schedule Picker Dialog */}
          <AnimatePresence>
            {showSchedulePicker && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center"
                onClick={() => setShowSchedulePicker(false)}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className={cn(
                    'w-96 p-4 rounded-xl border-2',
                    isDark
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-semibold mb-4">Schedule Send</h3>
                  
                  <div className="space-y-3">
                    <input
                      type="date"
                      value={scheduleDate ? scheduleDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setScheduleDate(e.target.value ? new Date(e.target.value) : null)}
                      min={new Date().toISOString().split('T')[0]}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border-2 text-sm',
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                      )}
                    />
                    
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border-2 text-sm',
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => {
                        setScheduleDate(null);
                        setMessage(prev => ({ ...prev, scheduledSend: null }));
                        setShowSchedulePicker(false);
                      }}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium',
                        isDark
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      )}
                    >
                      Remove
                    </button>
                    <button
                      onClick={handleScheduleSend}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium',
                        isDark
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      )}
                      disabled={!scheduleDate}
                    >
                      Schedule
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className={cn(
          'flex items-center justify-between p-4 border-t-2',
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        )}>
          <div className="flex items-center gap-2">
            {/* Priority menu */}
            {renderPriorityMenu()}
            
            {/* Attach file button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
              )}
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            {/* Options menu */}
            {renderOptionsMenu()}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Discard button */}
            <button
              onClick={handleDiscard}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium border-2',
                isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-100'
              )}
            >
              Discard
            </button>
            
            {/* Save Draft button */}
            <button
              onClick={saveDraft}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium border-2',
                isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-200 text-gray-700 hover:bg-gray-100'
              )}
            >
              Save Draft
            </button>
            
            {/* Send button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={isSending}
              className={cn(
                'px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2',
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white',
                'disabled:opacity-50 cursor-pointer'
              )}
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
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
      </motion.div>

      {/* Discard Confirmation Modal */}
      <AnimatePresence>
        {showDiscardConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowDiscardConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                'max-w-md w-full rounded-xl border-2 p-6',
                isDark
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  'p-3 rounded-full',
                  isDark ? 'bg-amber-900/20' : 'bg-amber-100'
                )}>
                  <AlertCircle className={cn(
                    'w-6 h-6',
                    isDark ? 'text-amber-400' : 'text-amber-600'
                  )} />
                </div>
                <h3 className="text-lg font-semibold">Discard Message?</h3>
              </div>
              
              <p className={cn(
                'mb-6',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}>
                You have unsaved changes. Are you sure you want to discard this message?
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDiscardConfirm(false)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium border-2',
                    isDark
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-100',
                    'cursor-pointer'
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDiscard}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium',
                    isDark
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white',
                    'cursor-pointer'
                  )}
                >
                  Discard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Compose;