/**
 * ============================================================================
 * INBOX COMPONENT — REWRITTEN
 * ============================================================================
 *
 * Changes made:
 * - Removed bottom quick reply section entirely
 * - Kept three-dots actions menu in the detail header
 * - Reply / Forward are intentionally left as TODO stubs for later implementation
 * - Improved attachment download UI/feel
 * - Added per-attachment loading state for cleaner UX
 */

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  Mail,
  Star,
  Trash2,
  Archive,
  AlertCircle,
  X,
  Reply,
  Forward,
  // MoreHorizontal,
  ChevronLeft,
  Tag,
  User,
  Paperclip,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Download,
  File,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '../../../../shared/utils/classNameUtils';
import { motion, AnimatePresence } from 'framer-motion';

import {
  useGetMessages,
  useGetMessageStats,
  useMarkReadMessage,
  useMarkUnreadMessage,
  useToggleStarMessage,
  useArchiveMessage,
  useUnarchiveMessage,
  useTrashMessage,
  useDownloadMessageAttachment,
} from '../../api/messages/MessageQueries';

import type {
  MessageStateWithMessage,
  MessageSender,
  MessageRecipient,
  MessageFilter as ApiFilter,
  MessageSort,
} from '../../api/messages/MessageTypes';

import { buildMessagePreview } from '../../api/messages/MessageTypes';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface InboxProps {
  theme: 'light' | 'dark';
}

interface DisplayAttachment {
  id: number;
  name: string;
  size: string;
  type: string;
  downloadUrl?: string;
}

interface DisplayMessage {
  id: number;
  subject: string;
  senderName: string;
  senderLabel: string;
  recipientNames: string;
  preview: string;
  body: string;
  timestamp: string;
  date: Date;
  read: boolean;
  starred: boolean;
  archived: boolean;
  labels: string[];
  attachments: DisplayAttachment[];
  priority: 'low' | 'normal' | 'high';
}

type LocalFilter = 'all' | 'unread' | 'starred' | 'archived';
type LocalSort = 'newest' | 'oldest';

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

const getSenderName = (sender?: MessageSender | null): string => {
  if (!sender) return 'Unknown';

  return (
    sender.display_name ||
    [sender.first_name, sender.last_name].filter(Boolean).join(' ') ||
    `User #${sender.id}`
  );
};

const formatRelativeTime = (iso?: string | null): string => {
  if (!iso) return '';

  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;

  return d.toLocaleDateString();
};

const getToRecipients = (
  msg: MessageStateWithMessage['message'],
): MessageRecipient[] =>
  msg.toRecipients ??
  msg.to_recipients ??
  (msg.recipients?.filter((r) => r.type === 'to') ?? []);

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
};

const getAttachmentIcon = (mimeType: string) => {
  const type = mimeType.toLowerCase();

  if (type.includes('image')) return ImageIcon;
  if (
    type.includes('pdf') ||
    type.includes('text') ||
    type.includes('word') ||
    type.includes('document')
  ) {
    return FileText;
  }
  if (
    type.includes('sheet') ||
    type.includes('excel') ||
    type.includes('csv') ||
    type.includes('spreadsheet')
  ) {
    return FileSpreadsheet;
  }
  if (
    type.includes('zip') ||
    type.includes('rar') ||
    type.includes('archive') ||
    type.includes('compressed')
  ) {
    return FileArchive;
  }

  return File;
};

const getAttachmentBadge = (mimeType: string): string => {
  const type = mimeType.toLowerCase();

  if (type.includes('image')) return 'Image';
  if (type.includes('pdf')) return 'PDF';
  if (type.includes('word') || type.includes('document')) return 'Document';
  if (
    type.includes('sheet') ||
    type.includes('excel') ||
    type.includes('csv') ||
    type.includes('spreadsheet')
  ) {
    return 'Spreadsheet';
  }
  if (
    type.includes('zip') ||
    type.includes('rar') ||
    type.includes('archive') ||
    type.includes('compressed')
  ) {
    return 'Archive';
  }

  return 'File';
};

const mapToDisplay = (item: MessageStateWithMessage): DisplayMessage => {
  const msg = item.message;
  const toRec = getToRecipients(msg);

  return {
    id: msg.id,
    subject: msg.subject ?? '(No Subject)',
    senderName: getSenderName(msg.sender),
    senderLabel: getSenderName(msg.sender),
    recipientNames: toRec.map((r) => r.name ?? r.email).join(', ') || 'You',
    preview: buildMessagePreview(msg.body),
    body: msg.body ?? '',
    timestamp: formatRelativeTime(msg.sent_at ?? msg.created_at),
    date: new Date(msg.sent_at ?? msg.created_at),
    read: item.is_read,
    starred: item.is_starred,
    archived: item.is_archived,
    labels: msg.labels?.map((l) => l.label) ?? [],
    attachments:
      msg.attachments?.map((a) => ({
        id: a.id,
        name: a.original_name,
        size: a.size_formatted ?? formatBytes(a.size_bytes),
        type: a.mime_type ?? 'unknown',
        downloadUrl: a.download_url ?? undefined,
      })) ?? [],
    priority: msg.priority,
  };
};

const resolveApiParams = (
  filter: LocalFilter,
  sort: LocalSort,
  search: string,
): Parameters<typeof useGetMessages>[0] => {
  const base = {
    sort: sort as MessageSort,
    search: search || undefined,
    per_page: 50,
  };

  if (filter === 'archived') return { ...base, folder: 'archive' };

  return {
    ...base,
    folder: 'inbox',
    filter: (filter === 'all' ? 'all' : filter) as ApiFilter,
  };
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export const Inbox: React.FC<InboxProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [filter, setFilter] = useState<LocalFilter>('all');
  const [sort, setSort] = useState<LocalSort>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<number | null>(null);

  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setShowActionMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const apiParams = useMemo(
    () => resolveApiParams(filter, sort, debouncedSearch),
    [filter, sort, debouncedSearch],
  );

  const { data, isLoading, isFetching, error, refetch } = useGetMessages(apiParams);
  const { data: statsData } = useGetMessageStats();

  const messages = useMemo(() => (data?.data ?? []).map(mapToDisplay), [data]);

  const markRead = useMarkReadMessage();
  const markUnread = useMarkUnreadMessage();
  const toggleStar = useToggleStarMessage();
  const archive = useArchiveMessage();
  const unarchive = useUnarchiveMessage();
  const trash = useTrashMessage();
  const downloadAttachment = useDownloadMessageAttachment();

  const selectedMessage = useMemo(
    () => messages.find((m) => m.id === selectedMessageId) ?? null,
    [messages, selectedMessageId],
  );

  useEffect(() => {
    if (!messages.length) {
      setSelectedMessageId(null);
      return;
    }

    if (!selectedMessageId || !messages.some((m) => m.id === selectedMessageId)) {
      setSelectedMessageId(messages[0].id);
    }
  }, [messages, selectedMessageId]);

  const totalCount = statsData?.inbox.total ?? data?.total ?? 0;
  const unreadCount = statsData?.inbox.unread ?? 0;
  const archivedCount = statsData?.archive.total ?? 0;
  const starredCount = messages.filter((m) => m.starred).length;

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSelectMessage = useCallback(
    (id: number) => {
      setSelectedMessageId(id);
      setShowActionMenu(false);

      const rawItem = data?.data?.find((d) => d.message.id === id);
      if (rawItem && !rawItem.is_read) {
        markRead.mutate({ id });
      }

      if (window.innerWidth < 768) setShowMobileList(false);
    },
    [data, markRead],
  );

  const handleToggleStar = useCallback(
    (id: number, e?: React.MouseEvent) => {
      e?.stopPropagation();
      toggleStar.mutate({ id });
    },
    [toggleStar],
  );

  const handleArchiveToggle = useCallback(
    (id: number, isArchived: boolean) => {
      if (isArchived) unarchive.mutate({ id });
      else archive.mutate({ id });

      setShowActionMenu(false);
    },
    [archive, unarchive],
  );

  const handleDelete = useCallback(
    (id: number) => {
      trash.mutate({ id });
      setShowActionMenu(false);
    },
    [trash],
  );

  const handleMarkUnread = useCallback(
    (id: number) => {
      markUnread.mutate({ id });
      setShowActionMenu(false);
    },
    [markUnread],
  );

  const handleBackToList = useCallback(() => {
    setShowMobileList(true);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const handleReply = useCallback(() => {
    if (!selectedMessage) return;

    // TODO: Implement reply flow here later.
    // Example future behavior:
    // - navigate to compose screen
    // - prefill recipient, subject, parent/thread relation
    setShowActionMenu(false);
  }, [selectedMessage]);

  const handleForward = useCallback(() => {
    if (!selectedMessage) return;

    // TODO: Implement forward flow here later.
    // Example future behavior:
    // - navigate to compose screen
    // - prefill subject/body/attachments as needed
    setShowActionMenu(false);
  }, [selectedMessage]);

  const handleDownloadAttachment = useCallback(
    async (att: DisplayAttachment) => {
      try {
        setDownloadingAttachmentId(att.id);

        await downloadAttachment.mutateAsync({
          attachmentId: att.id,
          fileName: att.name,
          downloadUrl: att.downloadUrl,
        });
      } finally {
        setDownloadingAttachmentId(null);
      }
    },
    [downloadAttachment],
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative overflow-hidden rounded-xl border-2 mb-4 transition-all duration-300 group',
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50'
            : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400',
        )}
      >
        <div
          className={cn(
            'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity opacity-0',
            isDark
              ? 'bg-blue-500/10 group-hover:opacity-100'
              : 'bg-blue-500/5 group-hover:opacity-100',
          )}
        />
        <div className="relative p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-3 rounded-xl transition-all duration-300',
                  isDark
                    ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110'
                    : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110',
                )}
              >
                <Mail className={cn('w-6 h-6', isDark ? 'text-blue-400' : 'text-blue-600')} />
              </div>

              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Inbox
                  <span
                    className={cn(
                      'text-sm font-medium px-2.5 py-1 rounded-full',
                      isDark
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-blue-100 text-blue-700 border border-blue-200',
                    )}
                  >
                    {totalCount} messages
                  </span>
                </h2>
                <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  {unreadCount} unread • {starredCount} starred
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isFetching}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all disabled:opacity-50 cursor-pointer',
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
                )}
              >
                <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
                <span className="hidden sm:inline">Refresh</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters((prev) => !prev)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all md:hidden cursor-pointer',
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
                )}
              >
                <Filter className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Desktop Search + Filters */}
      <div className="hidden md:block mb-4">
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border-2 transition-all duration-300',
            isDark
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 hover:border-gray-600'
              : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-gray-300',
          )}
        >
          <div className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <motion.div
                  className="absolute inset-0 rounded-lg z-0"
                  style={{
                    background:
                      'linear-gradient(90deg,#3b82f6,#10b981,#6366f1,#3b82f6)',
                    backgroundSize: '300% 100%',
                  }}
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{
                    duration: isFocused ? 2 : 6,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
                <div className="relative z-10 m-[2px] rounded-[6px] overflow-hidden">
                  <Search
                    className={cn(
                      'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
                      isFocused
                        ? 'text-blue-500'
                        : isDark
                        ? 'text-gray-500'
                        : 'text-gray-400',
                    )}
                  />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={cn(
                      'w-full pl-10 pr-10 py-2 text-sm border-transparent focus:outline-none focus:ring-0 transition-colors',
                      isDark
                        ? 'bg-gray-900 text-white placeholder-gray-500'
                        : 'bg-white text-gray-900 placeholder-gray-400',
                    )}
                  />
                  {searchTerm && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      onClick={handleClearSearch}
                      className={cn(
                        'absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors cursor-pointer',
                        isDark
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                      )}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {([
                  { key: 'all', label: `All (${totalCount})` },
                  { key: 'unread', label: `Unread (${unreadCount})` },
                  { key: 'starred', label: `Starred (${starredCount})` },
                  { key: 'archived', label: `Archived (${archivedCount})` },
                ] as { key: LocalFilter; label: string }[]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 cursor-pointer',
                      filter === key
                        ? isDark
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-blue-600 border-blue-400 text-white'
                        : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as LocalSort)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm border-2 cursor-pointer',
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900',
                )}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mb-4 overflow-hidden"
          >
            <div
              className={cn(
                'rounded-xl border-2 p-3',
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
              )}
            >
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    className={cn(
                      'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                      isDark ? 'text-gray-500' : 'text-gray-400',
                    )}
                  />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-10 py-2 rounded-lg text-sm border-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
                      isDark
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
                    )}
                  />
                  {searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {([
                    { key: 'all', label: `All (${totalCount})` },
                    { key: 'unread', label: `Unread (${unreadCount})` },
                    { key: 'starred', label: `Starred (${starredCount})` },
                    { key: 'archived', label: `Archived (${archivedCount})` },
                  ] as { key: LocalFilter; label: string }[]).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border-2',
                        filter === key
                          ? isDark
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-blue-600 border-blue-400 text-white'
                          : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-700',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as LocalSort)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-sm border-2',
                    isDark
                      ? 'bg-gray-900 border-gray-700 text-white'
                      : 'bg-white border-gray-200 text-gray-900',
                  )}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex gap-4">
        {/* List Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            'w-full md:w-96 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all',
            !showMobileList && 'hidden md:block',
            isDark
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50'
              : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200',
          )}
        >
          <div className="h-full flex flex-col">
            <div
              className={cn(
                'p-3 border-b-2 flex items-center justify-between',
                isDark ? 'border-gray-700' : 'border-gray-200',
              )}
            >
              <span className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
                {messages.length} messages
              </span>
              {debouncedSearch && (
                <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
                  Filtered
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto divide-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div
                    className={cn(
                      'w-8 h-8 border-2 rounded-full animate-spin',
                      isDark
                        ? 'border-blue-400 border-t-transparent'
                        : 'border-blue-500 border-t-transparent',
                    )}
                  />
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <AlertCircle
                    className={cn(
                      'w-8 h-8 mx-auto mb-2',
                      isDark ? 'text-red-400' : 'text-red-500',
                    )}
                  />
                  <p className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>
                    Failed to load messages
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-8 text-center"
                    >
                      <Mail
                        className={cn(
                          'w-12 h-12 mx-auto mb-3',
                          isDark ? 'text-gray-700' : 'text-gray-300',
                        )}
                      />
                      <p className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
                        No messages found
                      </p>
                      <p className={cn('text-xs mt-1', isDark ? 'text-gray-500' : 'text-gray-500')}>
                        {searchTerm ? 'Try adjusting your search' : 'Your inbox is empty'}
                      </p>
                    </motion.div>
                  ) : (
                    messages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => handleSelectMessage(msg.id)}
                        className={cn(
                          'p-4 cursor-pointer transition-all relative group',
                          selectedMessageId === msg.id
                            ? isDark
                              ? 'bg-blue-900/20 border-l-4 border-blue-500'
                              : 'bg-blue-50 border-l-4 border-blue-500'
                            : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50',
                          isDark ? 'border-gray-700' : 'border-gray-200',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                                isDark ? 'bg-gray-700' : 'bg-gray-200',
                              )}
                            >
                              <User
                                className={cn(
                                  'w-4 h-4',
                                  isDark ? 'text-gray-400' : 'text-gray-600',
                                )}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  'text-sm truncate',
                                  !msg.read && 'font-semibold',
                                  isDark ? 'text-white' : 'text-gray-900',
                                )}
                              >
                                {msg.senderName}
                              </p>
                              <p className={cn('text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-600')}>
                                {msg.senderLabel}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {msg.priority === 'high' && (
                              <AlertCircle
                                className={cn(
                                  'w-3 h-3',
                                  isDark ? 'text-red-400' : 'text-red-500',
                                )}
                              />
                            )}
                            <span className={cn('text-xs whitespace-nowrap', isDark ? 'text-gray-500' : 'text-gray-500')}>
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 mb-1">
                          {!msg.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                          )}
                          <p
                            className={cn(
                              'text-sm truncate flex-1',
                              !msg.read && 'font-semibold',
                              isDark ? 'text-white' : 'text-gray-900',
                            )}
                          >
                            {msg.subject}
                          </p>
                        </div>

                        <p className={cn('text-xs truncate mb-2', isDark ? 'text-gray-400' : 'text-gray-600')}>
                          {msg.preview}
                        </p>

                        <div className="flex flex-wrap items-center gap-1">
                          {msg.labels.map((label) => (
                            <span
                              key={label}
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                                isDark
                                  ? 'bg-gray-700 text-gray-300 border border-gray-600'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200',
                              )}
                            >
                              <Tag className="w-3 h-3" />
                              {label}
                            </span>
                          ))}

                          {msg.attachments.length > 0 && (
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                                isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700',
                              )}
                            >
                              <Paperclip className="w-3 h-3" />
                              {msg.attachments.length}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => handleToggleStar(msg.id, e)}
                          className={cn(
                            'absolute top-4 right-4 p-1 rounded-full transition-all opacity-0 group-hover:opacity-100',
                            msg.starred && 'opacity-100',
                            isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200',
                          )}
                        >
                          <Star
                            className={cn(
                              'w-4 h-4',
                              msg.starred
                                ? 'fill-yellow-400 text-yellow-400'
                                : isDark
                                ? 'text-gray-500'
                                : 'text-gray-400',
                            )}
                          />
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>

        {/* Detail Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            'flex-1 min-w-0 overflow-hidden rounded-xl border-2 transition-all',
            showMobileList ? 'hidden md:block' : 'block',
            isDark
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50'
              : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200',
          )}
        >
          {selectedMessage ? (
            <div className="h-full flex flex-col">
              {/* Detail Header */}
              <div
                className={cn(
                  'p-4 border-b-2 flex items-center justify-between',
                  isDark ? 'border-gray-700' : 'border-gray-200',
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={handleBackToList}
                    className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <h3 className="text-lg font-semibold truncate max-w-md">
                    {selectedMessage.subject}
                  </h3>

                  {selectedMessage.priority === 'high' && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        isDark
                          ? 'bg-red-900/20 text-red-300 border border-red-500/30'
                          : 'bg-red-50 text-red-600 border border-red-200',
                      )}
                    >
                      High Priority
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 relative" ref={actionMenuRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleStar(selectedMessage.id)}
                    className={cn(
                      'p-2 rounded-lg transition-colors cursor-pointer',
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200',
                    )}
                    title={selectedMessage.starred ? 'Remove star' : 'Add star'}
                  >
                    <Star
                      className={cn(
                        'w-5 h-5',
                        selectedMessage.starred
                          ? 'fill-yellow-400 text-yellow-400'
                          : isDark
                          ? 'text-gray-500'
                          : 'text-gray-400',
                      )}
                    />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      handleArchiveToggle(selectedMessage.id, selectedMessage.archived)
                    }
                    className={cn(
                      'p-2 rounded-lg transition-colors cursor-pointer',
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200',
                    )}
                    title={selectedMessage.archived ? 'Unarchive' : 'Archive'}
                  >
                    <Archive className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(selectedMessage.id)}
                    className={cn(
                      'p-2 rounded-lg transition-colors cursor-pointer',
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200',
                    )}
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>

                  {/* <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowActionMenu((prev) => !prev)}
                    className={cn(
                      'p-2 rounded-lg transition-colors cursor-pointer',
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200',
                    )}
                    title="More actions"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </motion.button> */}

                  <AnimatePresence>
                    {showActionMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        className={cn(
                          'absolute right-0 top-full mt-2 w-52 rounded-xl border-2 shadow-xl overflow-hidden z-20',
                          isDark
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200',
                        )}
                      >
                        <button
                          onClick={() => handleMarkUnread(selectedMessage.id)}
                          className={cn(
                            'w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors',
                            isDark
                              ? 'hover:bg-gray-700 text-gray-300'
                              : 'hover:bg-gray-100 text-gray-700',
                          )}
                        >
                          <Mail className="w-4 h-4" />
                          Mark as unread
                        </button>

                        <button
                          onClick={handleReply}
                          className={cn(
                            'w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors',
                            isDark
                              ? 'hover:bg-gray-700 text-gray-300'
                              : 'hover:bg-gray-100 text-gray-700',
                          )}
                        >
                          <Reply className="w-4 h-4" />
                          Reply
                        </button>

                        <button
                          onClick={handleForward}
                          className={cn(
                            'w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors',
                            isDark
                              ? 'hover:bg-gray-700 text-gray-300'
                              : 'hover:bg-gray-100 text-gray-700',
                          )}
                        >
                          <Forward className="w-4 h-4" />
                          Forward
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Detail Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-start justify-between mb-6 gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                        isDark ? 'bg-gray-700' : 'bg-gray-200',
                      )}
                    >
                      <User className={cn('w-6 h-6', isDark ? 'text-gray-400' : 'text-gray-600')} />
                    </div>

                    <div className="min-w-0">
                      <h4 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                        {selectedMessage.senderName}
                      </h4>
                      <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                        {selectedMessage.senderLabel}
                      </p>
                      <p className={cn('text-xs mt-1', isDark ? 'text-gray-500' : 'text-gray-500')}>
                        To: {selectedMessage.recipientNames}
                      </p>
                    </div>
                  </div>

                  <div className={cn('text-sm flex items-center gap-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
                    <Calendar className="w-4 h-4" />
                    {selectedMessage.date.toLocaleDateString()} at{' '}
                    {selectedMessage.date.toLocaleTimeString()}
                  </div>
                </div>

                <div
                  className={cn(
                    'prose max-w-none mb-8 whitespace-pre-wrap',
                    isDark ? 'prose-invert' : '',
                  )}
                >
                  {selectedMessage.body}
                </div>

                {selectedMessage.attachments.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4 gap-3">
                      <h5
                        className={cn(
                          'text-sm font-medium flex items-center gap-2',
                          isDark ? 'text-gray-300' : 'text-gray-700',
                        )}
                      >
                        <Paperclip className="w-4 h-4" />
                        Attachments ({selectedMessage.attachments.length})
                      </h5>

                      <span
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-full',
                          isDark
                            ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                            : 'bg-blue-50 text-blue-700 border border-blue-100',
                        )}
                      >
                        Secure download
                      </span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      {selectedMessage.attachments.map((att) => {
                        const AttachmentIcon = getAttachmentIcon(att.type);
                        const isDownloading = downloadingAttachmentId === att.id;

                        return (
                          <div
                            key={att.id}
                            className={cn(
                              'rounded-2xl border-2 p-4 transition-all',
                              isDark
                                ? 'bg-gradient-to-br from-gray-800 to-gray-700/60 border-gray-700 hover:border-blue-500/40'
                                : 'bg-gradient-to-br from-white to-blue-50/40 border-gray-200 hover:border-blue-300',
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                                  isDark
                                    ? 'bg-blue-500/15 text-blue-300'
                                    : 'bg-blue-100 text-blue-700',
                                )}
                              >
                                <AttachmentIcon className="w-5 h-5" />
                              </div> 

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p
                                      className={cn(
                                        'text-sm font-semibold truncate',
                                        isDark ? 'text-white' : 'text-gray-900',
                                      )}
                                    >
                                      {att.name}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                      <span
                                        className={cn(
                                          'text-[11px] px-2 py-1 rounded-full',
                                          isDark
                                            ? 'bg-gray-700 text-gray-300 border border-gray-600'
                                            : 'bg-white text-gray-700 border border-gray-200',
                                        )}
                                      >
                                        {getAttachmentBadge(att.type)}
                                      </span>
                                      <span
                                        className={cn(
                                          'text-xs',
                                          isDark ? 'text-gray-400' : 'text-gray-600',
                                        )}
                                      >
                                        {att.size}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-3">
                                  <p
                                    className={cn(
                                      'text-xs',
                                      isDark ? 'text-gray-500' : 'text-gray-500',
                                    )}
                                  >
                                    Click download to save the original file
                                  </p>

                                  <button
                                    onClick={() => handleDownloadAttachment(att)}
                                    disabled={isDownloading}
                                    className={cn(
                                      'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60',
                                      isDownloading 
                                        ? 'cursor-progress'  // Shows loading cursor when downloading
                                        : 'cursor-pointer',   // Shows hand cursor when clickable
                                      isDark
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white',
                                    )}
                                  >
                                    {isDownloading ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                                        Downloading...
                                      </>
                                    ) : (
                                      <>
                                        <Download className="w-4 h-4" />
                                        Download
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom quick reply intentionally removed */}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center">
                <Mail className={cn('w-16 h-16 mx-auto mb-4', isDark ? 'text-gray-700' : 'text-gray-300')} />
                <h3 className={cn('text-lg font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                  No message selected
                </h3>
                <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  Select a message from the list to view it
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Inbox;
