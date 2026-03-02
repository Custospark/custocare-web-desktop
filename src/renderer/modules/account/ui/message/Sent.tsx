/**
 * ============================================================================
 * SENT COMPONENT  –  Live API Integration
 * ============================================================================
 *
 * Sent folder: displays messages from folder='sent'.
 * All designs are preserved exactly.  Mock data removed entirely.
 *
 * @component Sent
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Star,
  Trash2,
  Archive,
  AlertCircle,
  X,
  Forward,
  MoreHorizontal,
  ChevronLeft,
  Tag,
  Paperclip,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Send,
  Users,
  Eye,
  CheckCheck,
} from 'lucide-react';
import { cn } from '../../../../shared/utils/classNameUtils';
import { motion, AnimatePresence } from 'framer-motion';

import {
  useSentMessages,
  useToggleStarMessage,
  useArchiveMessage,
  useUnarchiveMessage,
  useTrashMessage,
  useSendDraftMessage,
} from '../../api/messages/MessageQueries';

import {
  buildMessagePreview,
  safeDate,
  type MessageStateWithMessage,
  type Message,
  type MessageRecipient,
} from '../../api/messages/MessageTypes';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface SentProps {
  theme: 'light' | 'dark';
}

interface SentMessage {
  id: string;
  subject: string;
  recipients: Array<{ name: string; email: string }>;
  preview: string;
  body: string;
  timestamp: string;
  date: Date;
  read: boolean;
  starred: boolean;
  archived: boolean;
  deleted: boolean;
  labels: string[];
  attachments?: Array<{ name: string; size: string; type: string }>;
  priority: 'low' | 'normal' | 'high';
  cc?: Array<{ name: string; email: string }>;
  bcc?: Array<{ name: string; email: string }>;
  readReceipt?: boolean;
  deliveryStatus: 'sent' | 'delivered' | 'failed';
}

type FilterType = 'all' | 'starred' | 'archived' | 'failed';
type SortType = 'newest' | 'oldest';

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

const formatRelativeTime = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString();
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getRecipientsByType = (msg: Message, type: 'to' | 'cc' | 'bcc'): MessageRecipient[] => {
  if (type === 'to') {
    if (msg.toRecipients?.length) return msg.toRecipients;
    if (msg.to_recipients?.length) return msg.to_recipients;
  }
  if (type === 'cc') {
    if (msg.ccRecipients?.length) return msg.ccRecipients;
    if (msg.cc_recipients?.length) return msg.cc_recipients;
  }
  if (type === 'bcc') {
    if (msg.bccRecipients?.length) return msg.bccRecipients;
    if (msg.bcc_recipients?.length) return msg.bcc_recipients;
  }
  return (msg.recipients ?? []).filter(r => r.type === type);
};

const mapStateToSentMessage = (state: MessageStateWithMessage): SentMessage => {
  const msg = state.message;

  const toList = getRecipientsByType(msg, 'to').map(r => ({
    name: r.name || r.email,
    email: r.email,
  }));
  const ccList = getRecipientsByType(msg, 'cc').map(r => ({
    name: r.name || r.email,
    email: r.email,
  }));
  const bccList = getRecipientsByType(msg, 'bcc').map(r => ({
    name: r.name || r.email,
    email: r.email,
  }));

  const deliveryStatus: SentMessage['deliveryStatus'] =
    msg.status === 'failed'
      ? 'failed'
      : msg.status === 'sent'
      ? 'delivered'
      : 'sent';

  const sentAt = msg.sent_at || msg.created_at;

  return {
    id: String(msg.id),
    subject: msg.subject || '(No Subject)',
    recipients: toList,
    cc: ccList.length > 0 ? ccList : undefined,
    bcc: bccList.length > 0 ? bccList : undefined,
    preview: buildMessagePreview(msg.body),
    body: msg.body || '',
    timestamp: formatRelativeTime(sentAt),
    date: safeDate(sentAt) ?? new Date(msg.created_at),
    read: state.is_read,
    starred: state.is_starred,
    archived: state.is_archived,
    deleted: !!state.trashed_at,
    labels: (msg.labels ?? []).map(l => l.label),
    attachments: msg.attachments?.map(a => ({
      name: a.original_name,
      size: a.size_formatted ?? formatFileSize(a.size_bytes),
      type: a.mime_type ?? 'unknown',
    })),
    priority: msg.priority,
    deliveryStatus,
    readReceipt: msg.read_receipt_requested,
  };
};

/* -------------------------------------------------------------------------- */
/*                             LOADING SKELETON                               */
/* -------------------------------------------------------------------------- */

const MessageListSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <>
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className={cn(
          'p-4 animate-pulse border-b-2',
          isDark ? 'border-gray-700' : 'border-gray-200'
        )}
      >
        <div className="flex items-start gap-2 mb-3">
          <div className={cn('w-8 h-8 rounded-full flex-shrink-0', isDark ? 'bg-gray-700' : 'bg-gray-200')} />
          <div className="flex-1 space-y-2">
            <div className={cn('h-3.5 rounded w-28', isDark ? 'bg-gray-700' : 'bg-gray-200')} />
            <div className={cn('h-3 rounded w-44', isDark ? 'bg-gray-700' : 'bg-gray-200')} />
          </div>
          <div className={cn('h-3 rounded w-14', isDark ? 'bg-gray-700' : 'bg-gray-200')} />
        </div>
        <div className={cn('h-3.5 rounded w-3/4 mb-2', isDark ? 'bg-gray-700' : 'bg-gray-200')} />
        <div className={cn('h-3 rounded w-full', isDark ? 'bg-gray-700' : 'bg-gray-200')} />
      </div>
    ))}
  </>
);

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export const Sent: React.FC<SentProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  /* -------------------------------- UI state -------------------------------- */
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const hasInitialized = useRef(false);

  /* -------------------------------- API -------------------------------- */
  const { data, isLoading, isError, isFetching, refetch } = useSentMessages({ per_page: 100 });

  const toggleStar = useToggleStarMessage();
  const archiveMsg = useArchiveMessage();
  const unarchiveMsg = useUnarchiveMessage();
  const trashMsg = useTrashMessage();
  const sendDraftMsg = useSendDraftMessage();

  /* ----------------------- Map API → display type ----------------------- */
  const allMessages = useMemo(
    () => (data?.data ?? []).map(mapStateToSentMessage),
    [data]
  );

  /* Auto-select first message on initial load */
  useEffect(() => {
    if (!hasInitialized.current && allMessages.length > 0) {
      setSelectedMessageId(allMessages[0].id);
      hasInitialized.current = true;
    }
  }, [allMessages]);

  /* ---------------------------- Derived Data ------------------------------ */
  const selectedMessage = useMemo(
    () => allMessages.find(m => m.id === selectedMessageId) ?? null,
    [allMessages, selectedMessageId]
  );

  const filteredMessages = useMemo(() => {
    let filtered = [...allMessages];

    switch (filter) {
      case 'starred':
        filtered = filtered.filter(m => m.starred && !m.deleted);
        break;
      case 'archived':
        filtered = filtered.filter(m => m.archived && !m.deleted);
        break;
      case 'failed':
        filtered = filtered.filter(m => m.deliveryStatus === 'failed' && !m.deleted);
        break;
      default:
        filtered = filtered.filter(m => !m.deleted);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        m =>
          m.subject.toLowerCase().includes(term) ||
          m.recipients.some(
            r => r.name.toLowerCase().includes(term) || r.email.toLowerCase().includes(term)
          ) ||
          m.body.toLowerCase().includes(term) ||
          m.preview.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) =>
      sort === 'newest'
        ? b.date.getTime() - a.date.getTime()
        : a.date.getTime() - b.date.getTime()
    );

    return filtered;
  }, [allMessages, filter, searchTerm, sort]);

  const stats = useMemo(() => ({
    total: data?.total ?? allMessages.length,
    starred: allMessages.filter(m => m.starred && !m.deleted).length,
    archived: allMessages.filter(m => m.archived && !m.deleted).length,
    failed: allMessages.filter(m => m.deliveryStatus === 'failed' && !m.deleted).length,
  }), [allMessages, data?.total]);

  /* ---------------------------- Action Handlers ---------------------------- */
  const handleRefresh = useCallback(() => { refetch(); }, [refetch]);

  const handleToggleStar = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toggleStar.mutate({ id: parseInt(id, 10) });
  }, [toggleStar]);

  const handleArchive = useCallback((id: string) => {
    archiveMsg.mutate({ id: parseInt(id, 10) });
    if (selectedMessageId === id) {
      const next = filteredMessages.find(m => m.id !== id);
      setSelectedMessageId(next?.id ?? null);
    }
  }, [archiveMsg, selectedMessageId, filteredMessages]);

  const handleUnarchive = useCallback((id: string) => {
    unarchiveMsg.mutate({ id: parseInt(id, 10) });
  }, [unarchiveMsg]);

  const handleDelete = useCallback((id: string) => {
    const next = filteredMessages.find(m => m.id !== id);
    trashMsg.mutate({ id: parseInt(id, 10) });
    if (selectedMessageId === id) {
      setSelectedMessageId(next?.id ?? null);
    }
  }, [trashMsg, selectedMessageId, filteredMessages]);

  const handleResend = useCallback((id: string) => {
    sendDraftMsg.mutate({ id: parseInt(id, 10) });
  }, [sendDraftMsg]);

  const handleSelectMessage = useCallback((id: string) => {
    setSelectedMessageId(id);
    if (window.innerWidth < 768) setShowMobileList(false);
  }, []);

  const handleBackToList = useCallback(() => { setShowMobileList(true); }, []);
  const handleClearSearch = useCallback(() => { setSearchTerm(''); }, []);

  /* ----------------------------- Render Helpers ---------------------------- */
  const getDeliveryStatusIcon = (status: SentMessage['deliveryStatus']) => {
    switch (status) {
      case 'sent':      return <Send className="w-3 h-3 text-blue-500" />;
      case 'delivered': return <CheckCheck className="w-3 h-3 text-green-500" />;
      case 'failed':    return <AlertCircle className="w-3 h-3 text-red-500" />;
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                 RENDER                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="h-full flex flex-col">

      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative overflow-hidden rounded-xl border-2 mb-4 transition-all duration-300',
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/30 hover:border-purple-500/50'
            : 'bg-gradient-to-br from-white to-purple-50/50 border-purple-200 hover:border-purple-400',
          'group'
        )}
      >
        <div className={cn(
          'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity opacity-0',
          isDark ? 'bg-purple-500/10 group-hover:opacity-100' : 'bg-purple-500/5 group-hover:opacity-100'
        )} />
        <div className="relative p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-3 rounded-xl transition-all duration-300',
                isDark
                  ? 'bg-purple-500/20 group-hover:bg-purple-500/30 group-hover:scale-110'
                  : 'bg-purple-100 group-hover:bg-purple-200 group-hover:scale-110'
              )}>
                <Send className={cn('w-6 h-6', isDark ? 'text-purple-400' : 'text-purple-600')} />
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Sent Messages
                  <span className={cn(
                    'text-sm font-medium px-2.5 py-1 rounded-full',
                    isDark
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-purple-100 text-purple-700 border border-purple-200'
                  )}>
                    {stats.total} sent
                  </span>
                </h2>
                <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  {stats.failed > 0 && (
                    <span className="text-red-500 mr-2">{stats.failed} failed</span>
                  )}
                  {stats.starred} starred • {stats.archived} archived
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isFetching}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all disabled:opacity-50 cursor-pointer',
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                )}
              >
                <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
                <span className="hidden sm:inline">Refresh</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all md:hidden cursor-pointer',
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                )}
              >
                <Filter className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Desktop Search + Filters ─── */}
      <div className="hidden md:block mb-4">
        <div className={cn(
          'relative overflow-hidden rounded-xl border-2 transition-all duration-300',
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 hover:border-gray-600'
            : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-gray-300'
        )}>
          <div className="p-3">
            <div className="flex items-center gap-3">

              {/* Search */}
              <div className="flex-1 relative">
                <motion.div
                  className="absolute inset-0 rounded-lg z-0"
                  style={{ background: 'linear-gradient(90deg, #a855f7, #ec4899, #8b5cf6, #a855f7)', backgroundSize: '300% 100%' }}
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ duration: isFocused ? 2 : 6, repeat: Infinity, ease: 'linear' }}
                />
                <div className="relative z-10 m-[2px] rounded-[6px] overflow-hidden">
                  <Search className={cn(
                    'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
                    isFocused ? 'text-purple-500' : isDark ? 'text-gray-500' : 'text-gray-400'
                  )} />
                  <input
                    type="text"
                    placeholder="Search sent messages..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={cn(
                      'w-full pl-10 pr-10 py-2 text-sm border-transparent focus:outline-none focus:ring-0 transition-colors',
                      isDark ? 'bg-gray-900 text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
                    )}
                  />
                  {searchTerm && (
                    <motion.button
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      onClick={handleClearSearch}
                      className={cn(
                        'absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors cursor-pointer',
                        isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1">
                {(['all', 'starred', 'archived', 'failed'] as FilterType[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 cursor-pointer capitalize',
                      filter === f
                        ? f === 'failed'
                          ? 'bg-red-600 border-red-500 text-white'
                          : isDark
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-purple-600 border-purple-400 text-white'
                        : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {f === 'all' && `All (${stats.total})`}
                    {f === 'starred' && `Starred (${stats.starred})`}
                    {f === 'archived' && `Archived (${stats.archived})`}
                    {f === 'failed' && `Failed (${stats.failed})`}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortType)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm border-2 cursor-pointer',
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                )}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Filters ─── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden mb-4 overflow-hidden"
          >
            <div className={cn('rounded-xl border-2 p-3', isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
              <div className="space-y-3">
                <div className="relative">
                  <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
                  <input
                    type="text"
                    placeholder="Search sent messages..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-10 py-2 rounded-lg text-sm border-2 focus:outline-none focus:ring-2 focus:ring-purple-500',
                      isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    )}
                  />
                  {searchTerm && <button onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'starred', 'archived', 'failed'] as FilterType[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border-2 capitalize',
                        filter === f
                          ? f === 'failed'
                            ? 'bg-red-600 border-red-500 text-white'
                            : isDark ? 'bg-purple-600 border-purple-500 text-white' : 'bg-purple-600 border-purple-400 text-white'
                          : isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                      )}
                    >
                      {f === 'all' && `All (${stats.total})`}
                      {f === 'starred' && `Starred (${stats.starred})`}
                      {f === 'archived' && `Archived (${stats.archived})`}
                      {f === 'failed' && `Failed (${stats.failed})`}
                    </button>
                  ))}
                </div>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortType)}
                  className={cn('w-full px-3 py-2 rounded-lg text-sm border-2', isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900')}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─── */}
      <div className="flex-1 min-h-0 flex gap-4">

        {/* ── Message List ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className={cn(
            'w-full md:w-96 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all',
            !showMobileList && 'hidden md:block',
            isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
          )}
        >
          <div className="h-full flex flex-col">
            <div className={cn('p-3 border-b-2 flex items-center justify-between', isDark ? 'border-gray-700' : 'border-gray-200')}>
              <span className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
                {isLoading ? 'Loading…' : `${filteredMessages.length} messages`}
              </span>
              {searchTerm && <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>Filtered</span>}
            </div>

            <div className="flex-1 overflow-y-auto divide-y-2">
              {isLoading ? (
                <MessageListSkeleton isDark={isDark} />
              ) : isError ? (
                <div className="p-8 text-center">
                  <AlertCircle className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-red-400' : 'text-red-500')} />
                  <p className={cn('text-sm font-medium mb-3', isDark ? 'text-gray-300' : 'text-gray-700')}>Failed to load messages</p>
                  <button onClick={handleRefresh} className={cn('text-xs px-3 py-1.5 rounded-lg', isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600')}>
                    Try again
                  </button>
                </div>
              ) : filteredMessages.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center">
                  <Send className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-gray-700' : 'text-gray-300')} />
                  <p className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>No sent messages found</p>
                  <p className={cn('text-xs mt-1', isDark ? 'text-gray-500' : 'text-gray-500')}>
                    {searchTerm ? 'Try adjusting your search' : 'Your sent folder is empty'}
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredMessages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }} transition={{ delay: index * 0.02 }}
                      onClick={() => handleSelectMessage(message.id)}
                      className={cn(
                        'p-4 cursor-pointer transition-all relative group',
                        selectedMessageId === message.id
                          ? isDark ? 'bg-purple-900/20 border-l-4 border-purple-500' : 'bg-purple-50 border-l-4 border-purple-500'
                          : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50',
                        message.deliveryStatus === 'failed'
                          ? isDark ? 'bg-red-900/10 border-l-4 border-red-500' : 'bg-red-50/50 border-l-4 border-red-500'
                          : '',
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', isDark ? 'bg-gray-700' : 'bg-gray-200')}>
                            <Users className={cn('w-4 h-4', isDark ? 'text-gray-400' : 'text-gray-600')} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn('text-sm font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>
                              To: {message.recipients.map(r => r.name).join(', ')}
                            </p>
                            <p className={cn('text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-600')}>
                              {message.recipients.map(r => r.email).join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {getDeliveryStatusIcon(message.deliveryStatus)}
                          <span className={cn('text-xs whitespace-nowrap', isDark ? 'text-gray-500' : 'text-gray-500')}>{message.timestamp}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 mb-1">
                        {message.readReceipt && message.read && <CheckCheck className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />}
                        {message.readReceipt && !message.read && <CheckCheck className="w-3 h-3 text-gray-400 mt-1 flex-shrink-0" />}
                        <p className={cn('text-sm truncate flex-1', isDark ? 'text-white' : 'text-gray-900')}>{message.subject}</p>
                      </div>

                      <p className={cn('text-xs truncate mb-2', isDark ? 'text-gray-400' : 'text-gray-600')}>{message.preview}</p>

                      <div className="flex flex-wrap items-center gap-1">
                        {message.labels.map(label => (
                          <span key={label} className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs', isDark ? 'bg-gray-700 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-700 border border-gray-200')}>
                            <Tag className="w-3 h-3" />{label}
                          </span>
                        ))}
                        {message.attachments && (
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs', isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}>
                            <Paperclip className="w-3 h-3" />{message.attachments.length}
                          </span>
                        )}
                        {message.deliveryStatus === 'failed' && (
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs', isDark ? 'bg-red-900/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-600 border border-red-200')}>
                            <AlertCircle className="w-3 h-3" />Failed
                          </span>
                        )}
                        {message.cc && message.cc.length > 0 && (
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs', isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}>
                            <Users className="w-3 h-3" />CC: {message.cc.length}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={e => handleToggleStar(message.id, e)}
                        className={cn(
                          'absolute top-4 right-4 p-1 rounded-full transition-all',
                          'opacity-0 group-hover:opacity-100',
                          message.starred && 'opacity-100',
                          isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                        )}
                      >
                        <Star className={cn('w-4 h-4', message.starred ? 'fill-yellow-400 text-yellow-400' : isDark ? 'text-gray-500' : 'text-gray-400')} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Message Detail ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className={cn(
            'flex-1 min-w-0 overflow-hidden rounded-xl border-2 transition-all',
            showMobileList ? 'hidden md:block' : 'block',
            isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
          )}
        >
          {selectedMessage ? (
            <div className="h-full flex flex-col">
              {/* Detail header */}
              <div className={cn('p-4 border-b-2 flex items-center justify-between', isDark ? 'border-gray-700' : 'border-gray-200')}>
                <div className="flex items-center gap-2">
                  <button onClick={handleBackToList} className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-semibold truncate max-w-md">{selectedMessage.subject}</h3>
                  {selectedMessage.priority === 'high' && (
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', isDark ? 'bg-red-900/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-600 border border-red-200')}>
                      High Priority
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleToggleStar(selectedMessage.id)} className={cn('p-2 rounded-lg transition-colors cursor-pointer', isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200')} title={selectedMessage.starred ? 'Remove star' : 'Add star'}>
                    <Star className={cn('w-5 h-5', selectedMessage.starred ? 'fill-yellow-400 text-yellow-400' : isDark ? 'text-gray-500' : 'text-gray-400')} />
                  </motion.button>

                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => selectedMessage.archived ? handleUnarchive(selectedMessage.id) : handleArchive(selectedMessage.id)}
                    className={cn('p-2 rounded-lg transition-colors cursor-pointer', isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200')}
                    title={selectedMessage.archived ? 'Unarchive' : 'Archive'}
                  >
                    <Archive className="w-5 h-5" />
                  </motion.button>

                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleDelete(selectedMessage.id)} className={cn('p-2 rounded-lg transition-colors cursor-pointer', isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200')} title="Delete">
                    <Trash2 className="w-5 h-5" />
                  </motion.button>

                  {selectedMessage.deliveryStatus === 'failed' && (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleResend(selectedMessage.id)}
                      disabled={sendDraftMsg.isPending}
                      className={cn('px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50', isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white')}
                    >
                      {sendDraftMsg.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                      Resend
                    </motion.button>
                  )}

                  <div className="relative group">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={cn('p-2 rounded-lg transition-colors cursor-pointer', isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200')}>
                      <MoreHorizontal className="w-5 h-5" />
                    </motion.button>
                    <div className={cn('absolute right-0 top-full mt-1 w-48 rounded-lg border-2 shadow-lg overflow-hidden z-10 hidden group-hover:block', isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
                      <button className={cn('w-full text-left px-4 py-2 text-sm flex items-center gap-2', isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}>
                        <Forward className="w-4 h-4" />Forward
                      </button>
                      <button className={cn('w-full text-left px-4 py-2 text-sm flex items-center gap-2', isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}>
                        <Eye className="w-4 h-4" />View source
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', isDark ? 'bg-gray-700' : 'bg-gray-200')}>
                      <Send className={cn('w-6 h-6', isDark ? 'text-gray-400' : 'text-gray-600')} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                            To: {selectedMessage.recipients.map(r => r.name).join(', ')}
                          </h4>
                          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                            {selectedMessage.recipients.map(r => r.email).join(', ')}
                          </p>
                        </div>
                        <div className={cn('text-sm flex items-center gap-2', isDark ? 'text-gray-400' : 'text-gray-600')}>
                          <Calendar className="w-4 h-4" />
                          {selectedMessage.date.toLocaleDateString()} at {selectedMessage.date.toLocaleTimeString()}
                        </div>
                      </div>

                      {selectedMessage.cc && selectedMessage.cc.length > 0 && (
                        <div className="mt-2">
                          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                            <span className="font-medium">CC:</span>{' '}
                            {selectedMessage.cc.map(c => `${c.name} (${c.email})`).join(', ')}
                          </p>
                        </div>
                      )}
                      {selectedMessage.bcc && selectedMessage.bcc.length > 0 && (
                        <div className="mt-1">
                          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                            <span className="font-medium">BCC:</span>{' '}
                            {selectedMessage.bcc.map(b => `${b.name} (${b.email})`).join(', ')}
                          </p>
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-2">
                        {getDeliveryStatusIcon(selectedMessage.deliveryStatus)}
                        <span className={cn('text-sm', selectedMessage.deliveryStatus === 'failed' ? 'text-red-500' : selectedMessage.deliveryStatus === 'delivered' ? 'text-green-500' : 'text-blue-500')}>
                          {selectedMessage.deliveryStatus === 'sent' && 'Sent'}
                          {selectedMessage.deliveryStatus === 'delivered' && 'Delivered'}
                          {selectedMessage.deliveryStatus === 'failed' && 'Failed to send'}
                        </span>
                        {selectedMessage.readReceipt && selectedMessage.read && (
                          <><span className="text-gray-400">•</span><CheckCheck className="w-4 h-4 text-green-500" /><span className="text-sm text-green-500">Read</span></>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={cn('prose max-w-none mb-8 whitespace-pre-wrap text-sm leading-relaxed', isDark ? 'prose-invert text-gray-300' : 'text-gray-700')}>
                  {selectedMessage.body}
                </div>

                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="mt-6">
                    <h5 className={cn('text-sm font-medium mb-3 flex items-center gap-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
                      <Paperclip className="w-4 h-4" />Attachments ({selectedMessage.attachments.length})
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedMessage.attachments.map((att, idx) => (
                        <div key={idx} className={cn('p-3 rounded-lg border-2 flex items-center gap-3', isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200')}>
                          <div className={cn('p-2 rounded-lg', isDark ? 'bg-gray-600' : 'bg-white')}><Paperclip className="w-4 h-4" /></div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>{att.name}</p>
                            <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>{att.size}</p>
                          </div>
                          <button className={cn('p-2 rounded-lg transition-colors cursor-pointer', isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600')}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center">
                <Send className={cn('w-16 h-16 mx-auto mb-4', isDark ? 'text-gray-700' : 'text-gray-300')} />
                <h3 className={cn('text-lg font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>No message selected</h3>
                <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>Select a sent message from the list to view it</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Sent;
