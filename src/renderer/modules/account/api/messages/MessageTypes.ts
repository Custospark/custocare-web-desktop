/**
 * ============================================================================
 * MESSAGE MODULE TYPE DEFINITIONS
 * ============================================================================
 *
 * This file centralizes ALL type responsibilities for the messaging module.
 *
 * Backend routes (auth:sanctum, prefix=/api/messages):
 *   GET    /messages
 *   GET    /messages/stats
 *   POST   /messages
 *   POST   /messages/bulk
 *   DELETE /messages/trash/empty
 *
 *   GET    /messages/{id}
 *   PUT    /messages/{id}
 *   DELETE /messages/{id}
 *
 *   POST   /messages/{id}/send
 *   POST   /messages/{id}/restore
 *   DELETE /messages/{id}/permanent
 *
 *   PATCH  /messages/{id}/read
 *   PATCH  /messages/{id}/unread
 *   PATCH  /messages/{id}/star
 *   PATCH  /messages/{id}/archive
 *   PATCH  /messages/{id}/unarchive
 *
 *   POST   /messages/{id}/labels
 *   DELETE /messages/{id}/labels/{label}
 *
 *   POST   /messages/{id}/attachments
 *   DELETE /messages/attachments/{attachmentId}
 */

/* -------------------------------------------------------------------------- */
/*                                  Enums                                     */
/* -------------------------------------------------------------------------- */

export type MessageFolder = 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash';

export type MessageFilter =
  | 'all'
  | 'unread'
  | 'starred'
  | 'archived'
  | 'incomplete'
  | 'failed';

export type MessageSort =
  | 'newest'
  | 'oldest'
  | 'alphabetical'
  | 'recentlyDeleted'
  | 'oldestDeleted'
  | 'originalDate';

export type MessageStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
export type MessagePriority = 'low' | 'normal' | 'high';
export type MessageBodyType = 'plain' | 'html' | 'markdown';

export type RecipientType = 'to' | 'cc' | 'bcc';
export type RecipientDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';

export type AttachmentUploadStatus = 'pending' | 'uploading' | 'complete' | 'failed';

/* -------------------------------------------------------------------------- */
/*                                Common Types                                */
/* -------------------------------------------------------------------------- */

/**
 * API error envelope (matches patterns used in other modules).
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Generic mutation callbacks (same style as SecurityTypes.ts).
 */
export type AxiosApiError = import('axios').AxiosError<ApiErrorResponse>;

export interface MutationCallbacks<TData, TError = AxiosApiError> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/**
 * Laravel paginator response shape (index endpoint returns paginator directly).
 * Typical structure:
 * {
 *   data: [...],
 *   current_page: 1,
 *   per_page: 20,
 *   total: 234,
 *   ...
 * }
 */
export interface LaravelPaginator<T> {
  current_page: number;
  data: T[];
  first_page_url?: string | null;
  from?: number | null;
  last_page: number;
  last_page_url?: string | null;
  links?: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url?: string | null;
  path?: string;
  per_page: number;
  prev_page_url?: string | null;
  to?: number | null;
  total: number;
}

/* -------------------------------------------------------------------------- */
/*                             Backend Model Shapes                            */
/* -------------------------------------------------------------------------- */

/**
 * Sender shape returned by backend relations:
 * message.sender:id,first_name,last_name,display_name,email_hash
 */
export interface MessageSender {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  email_hash?: string | null;
}

/**
 * Message recipient model (message_recipients).
 */
export interface MessageRecipient {
  id: number;
  message_id: number;
  user_id: number | null;
  name: string | null;
  email: string;
  type: RecipientType;
  delivery_status: RecipientDeliveryStatus;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Attachment model (message_attachments).
 */
export interface MessageAttachment {
  id: number;
  message_id: number;
  original_name: string;
  stored_name: string;
  disk: string;
  path: string;
  mime_type: string | null;
  size_bytes: number;
  size_formatted: string | null;
  uploaded_by: number | null;
  upload_status: AttachmentUploadStatus;
  upload_progress: number;
  created_at: string;
  updated_at: string;

  /**
   * Backend MAY choose to append URLs; keep optional to avoid TS breaks.
   */
  download_url?: string;
}

/**
 * Label model (message_labels) - labels are per-user.
 */
export interface MessageLabel {
  id: number;
  message_id: number;
  user_id: number;
  label: string;
  created_at: string;
}

/**
 * Core message model (messages).
 */
export interface Message {
  id: number;
  uuid: string;
  sender_id: number;

  subject: string | null;
  body: string | null;
  body_type: MessageBodyType;

  status: MessageStatus;
  priority: MessagePriority;

  scheduled_send_at: string | null;
  sent_at: string | null;

  read_receipt_requested: boolean;
  delivery_confirmation_requested: boolean;

  parent_id: number | null;
  thread_root_id: number | null;

  word_count: number | null;
  character_count: number | null;
  last_auto_saved_at: string | null;

  metadata: Record<string, unknown> | null;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  /* Relations (loaded by service) */
  sender?: MessageSender;
  recipients?: MessageRecipient[];
  to_recipients?: MessageRecipient[]; // sometimes snake vs camel depends on serializer
  cc_recipients?: MessageRecipient[];
  bcc_recipients?: MessageRecipient[];

  toRecipients?: MessageRecipient[]; // your backend uses toRecipients() relation
  ccRecipients?: MessageRecipient[];
  bccRecipients?: MessageRecipient[];

  attachments?: MessageAttachment[];
  labels?: MessageLabel[];

  parent?: Message;
}

/**
 * Per-user mailbox state (message_user_states).
 * index endpoint returns message_user_states.* joined with messages and with('message...').
 */
export interface MessageUserState {
  id: number;
  message_id: number;
  user_id: number;

  folder: MessageFolder;
  original_folder: Exclude<MessageFolder, 'trash'> | null;

  is_read: boolean;
  read_at: string | null;

  is_starred: boolean;
  starred_at: string | null;

  is_archived: boolean;
  archived_at: string | null;

  trashed_at: string | null;
  trash_expires_at: string | null;

  created_at: string;
  updated_at: string;

  message?: Message; // loaded by service via ->with('message...')
}

export type MessageStateWithMessage = MessageUserState & {
  message: Message;
};

/* -------------------------------------------------------------------------- */
/*                             Query Param Types                               */
/* -------------------------------------------------------------------------- */

export interface GetMessagesParams {
  folder?: MessageFolder; // default inbox
  filter?: MessageFilter;
  sort?: MessageSort;
  search?: string;
  per_page?: number; // default 20, max 100
  page?: number; // Laravel pagination
}

export type GetMessagesResponse = LaravelPaginator<MessageStateWithMessage>;

/* -------------------------------------------------------------------------- */
/*                             Action / Mutation Types                         */
/* -------------------------------------------------------------------------- */

/**
 * Recipient input payload used by store/update endpoints:
 * to.*.name, to.*.email, cc.*..., bcc.*...
 */
export interface RecipientInput {
  name?: string | null;
  email: string;
}

export interface StoreMessageRequest {
  save_draft?: boolean;

  /**
   * Used by backend to attach send operation to an existing message (per controller).
   * NOTE: This is NOT required for normal "new compose".
   */
  message_id?: number;

  subject?: string | null;
  body?: string | null;
  body_type?: MessageBodyType;
  priority?: MessagePriority;

  scheduled_send_at?: string | null;

  read_receipt?: boolean;
  delivery_confirmation?: boolean;

  parent_id?: number | null;
  labels?: string[];

  to?: RecipientInput[];
  cc?: RecipientInput[];
  bcc?: RecipientInput[];
}

/**
 * PUT /messages/{id}
 */
export interface UpdateMessageRequest {
  subject?: string | null;
  body?: string | null;
  body_type?: MessageBodyType;
  priority?: MessagePriority;

  scheduled_send_at?: string | null;

  read_receipt?: boolean;
  delivery_confirmation?: boolean;

  labels?: string[];

  to?: RecipientInput[];
  cc?: RecipientInput[];
  bcc?: RecipientInput[];
}

/**
 * POST /messages  response variants:
 * - draft save: { message, status: 'draft_saved' }
 * - send:       { message, status: 'sent'|'scheduled' }
 */
export interface StoreMessageResponse {
  message: Message;
  status: 'draft_saved' | 'sent' | 'scheduled';
}

/**
 * GET /messages/{id} returns:
 * { state: MessageUserState, message: Message }
 */
export interface ShowMessageResponse {
  state: MessageUserState;
  message: Message;
}

/**
 * PUT /messages/{id} returns: { message: Message }
 */
export interface UpdateMessageResponse {
  message: Message;
}

/**
 * DELETE /messages/{id} returns: { status: 'trashed' }
 */
export interface TrashMessageResponse {
  status: 'trashed';
}

/**
 * POST /messages/{id}/send returns: { message, status: 'sent' }
 */
export interface SendDraftResponse {
  message: Message;
  status: 'sent';
}

/**
 * POST /messages/{id}/restore returns: { status: 'restored' }
 */
export interface RestoreMessageResponse {
  status: 'restored';
}

/**
 * DELETE /messages/{id}/permanent returns: { status: 'permanently_deleted' }
 */
export interface PermanentDeleteResponse {
  status: 'permanently_deleted';
}

/**
 * PATCH /messages/{id}/read|unread returns: { status: 'read'|'unread' }
 */
export interface ReadStateResponse {
  status: 'read' | 'unread';
}

/**
 * PATCH /messages/{id}/archive|unarchive returns: { status: 'archived'|'unarchived' }
 */
export interface ArchiveStateResponse {
  status: 'archived' | 'unarchived';
}

/**
 * PATCH /messages/{id}/star returns: { starred: boolean }
 */
export interface StarToggleResponse {
  starred: boolean;
}

/**
 * POST /messages/{id}/labels { label } -> { status: 'label_added' }
 */
export interface AddLabelRequest {
  label: string;
}
export interface LabelActionResponse {
  status: 'label_added' | 'label_removed';
}

/**
 * POST /messages/{id}/attachments (multipart) -> { attachment }
 */
export interface UploadAttachmentResponse {
  attachment: MessageAttachment;
}
export interface RemoveAttachmentResponse {
  status: 'attachment_removed';
}

/**
 * GET /messages/stats returns:
 * {
 *   inbox: { total, unread },
 *   sent: { total, unread },
 *   drafts: { total, unread },
 *   archive: { total, unread },
 *   trash: { total, unread }
 * }
 */
export type MessageFolderStats = Record<MessageFolder, { total: number; unread: number }>;

/**
 * POST /messages/bulk body:
 *  { action, message_ids }
 */
export type BulkAction =
  | 'trash'
  | 'restore'
  | 'star'
  | 'archive'
  | 'unarchive'
  | 'markRead'
  | 'markUnread'
  | 'permanentDelete';

export interface BulkActionRequest {
  action: BulkAction;
  message_ids: number[];
}

export interface BulkActionResponse {
  status: 'bulk_action_complete';
  action: BulkAction;
  affected: number;
}

/**
 * DELETE /messages/trash/empty -> { status, deleted }
 */
export interface EmptyTrashResponse {
  status: 'trash_emptied';
  deleted: number;
}

/* -------------------------------------------------------------------------- */
/*                                  Utilities                                  */
/* -------------------------------------------------------------------------- */

/**
 * Safely build a short preview from body text (plain/html/markdown).
 */
export function buildMessagePreview(body: string | null | undefined, maxLen = 160): string {
  if (!body) return '';
  const stripped = body.replace(/<[^>]*>/g, ''); // basic HTML strip
  const normalized = stripped.replace(/\s+/g, ' ').trim();
  return normalized.length > maxLen ? normalized.slice(0, maxLen).trimEnd() + '…' : normalized;
}

/**
 * Convert ISO string into Date safely.
 */
export function safeDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}
