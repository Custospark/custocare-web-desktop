/**
 * ============================================================================
 * COMPOSE MODULE — SHARED TYPES
 * ============================================================================
 */

export interface ComposeMessage {
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
  scheduledSend?: Date | null;
  readReceipt?: boolean;
  deliveryConfirmation?: boolean;
}

export interface Recipient {
  id: string;
  name: string;
  email: string;          // email OR empty string for phone-only
  phone?: string;         // optional phone number
  contactType: 'email' | 'phone' | 'both';
  isValid?: boolean;
  avatar?: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  file?: File;
  progress?: number;
  error?: string;
  uploadedAttachmentId?: number;
}

export interface StoredContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  useCount: number;
  lastUsed: number; // timestamp
  avatar?: string;
}

export type EditorMode = 'rich' | 'plain' | 'markdown' | 'preview';
export type WindowState = 'normal' | 'minimized' | 'maximized';

export interface ComposeProps {
  theme: 'light' | 'dark';
  onClose?: () => void;
  onSend?: (message: ComposeMessage) => void;
  onSaveDraft?: (message: ComposeMessage) => void;
  replyTo?: {
    id: string;
    subject: string;
    sender: { name: string; email: string };
    recipients: Array<{ name: string; email: string }>;
    body: string;
  };
  forwardOf?: {
    id: string;
    subject: string;
    sender: { name: string; email: string };
    body: string;
    attachments?: Array<{ name: string; size: string; type: string }>;
  };
  draft?: ComposeMessage;
}

/* ---- Toolbar action descriptor ---- */
export interface ToolbarAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  command?: string;
  commandValue?: string;
  action?: () => void;
  isActive?: boolean;
  isDropdown?: boolean;
}

/* ---- Emoji category ---- */
export interface EmojiCategory {
  name: string;
  emojis: string[];
}
