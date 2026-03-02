/**
 * ============================================================================
 * TRASH COMPONENT — REAL API INTEGRATION
 * ============================================================================
 *
 * Replaces all mock data with live backend calls:
 *   • useTrashMessages      – folder listing
 *   • useGetMessageStats    – folder counts
 *   • useRestoreMessage     – restore one
 *   • usePermanentDeleteMessage – hard-delete one
 *   • useEmptyTrash         – hard-delete all
 *   • useBulkMessageAction  – bulk restore / permanent-delete
 *   • useToggleStarMessage  – star toggle
 *
 * All original designs, animations, select-mode, filter-pills and modals are
 * kept exactly as they were.
 *
 * @component Trash
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Mail,
  Trash2,
  Archive,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  ChevronLeft,
  Tag,
  User,
  Paperclip,
  Filter,
  Search,
  RefreshCw,
  Send,
  Users,
  FileText,
  RotateCcw,
  AlertTriangle,
  Info,
  Star,
} from 'lucide-react';
import { cn } from '../../../../shared/utils/classNameUtils';
import { motion, AnimatePresence } from 'framer-motion';

import {
  useTrashMessages,
  useGetMessageStats,
  useRestoreMessage,
  usePermanentDeleteMessage,
  useEmptyTrash,
  useBulkMessageAction,
  useToggleStarMessage,
} from '../../api/messages/MessageQueries';
import type {
  MessageStateWithMessage,
  MessageSender,
  MessageRecipient,
  MessageFolder,
} from '../../api/messages/MessageTypes';
import { buildMessagePreview } from '../../api/messages/MessageTypes';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface TrashProps {
  theme: 'light' | 'dark';
}

/** Normalised display shape for one trashed item */
interface DisplayTrashMessage {
  id: number;
  originalFolder: Exclude<MessageFolder, 'trash'>;
  subject: string;
  senderName: string;
  recipientNames: string;
  /** True when the original folder was sent/drafts (we are the author) */
  isByMe: boolean;
  preview: string;
  body: string;
  deletedAt: string;
  deletedDate: Date;
  originalDate: Date;
  starred: boolean;
  labels: string[];
  attachments: Array<{ id: number; name: string; size: string; type: string }>;
  priority: 'low' | 'normal' | 'high';
  expiresAt: Date | null;
  expiresIn: string;
  recoveryPossible: boolean;
}

type FolderFilter = 'all' | 'starred' | 'inbox' | 'sent' | 'drafts' | 'archive';
type TrashSort  = 'recentlyDeleted' | 'oldestDeleted' | 'originalDate';
type TimeRange  = 'all' | 'today' | 'week' | 'month';

/* -------------------------------------------------------------------------- */
/*                               HELPERS                                      */
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
  const mins  = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days  = Math.floor(diffMs / 86_400_000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  === 1) return 'yesterday';
  if (days  < 7)  return `${days} days ago`;
  if (days  < 30) return `${days} days ago`;
  return d.toLocaleDateString();
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1_048_576)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
};

const getToRecipients = (msg: MessageStateWithMessage['message']): MessageRecipient[] =>
  msg.toRecipients ?? msg.to_recipients ?? (msg.recipients?.filter(r => r.type === 'to') ?? []);

const computeExpiresIn = (expiresAt: Date | null): { text: string; recoverable: boolean } => {
  if (!expiresAt) return { text: 'No expiry', recoverable: true };
  const now = new Date();
  if (expiresAt <= now) return { text: 'Expired', recoverable: false };
  const days = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { text: `${days} day${days !== 1 ? 's' : ''}`, recoverable: true };
};

const mapToDisplayTrash = (item: MessageStateWithMessage): DisplayTrashMessage => {
  const msg       = item.message;
  const toRec     = getToRecipients(msg);
  const expiresAt = item.trash_expires_at ? new Date(item.trash_expires_at) : null;
  const { text: expiresIn, recoverable } = computeExpiresIn(expiresAt);
  const originalFolder =
    (item.original_folder as Exclude<MessageFolder, 'trash'>) ?? 'inbox';
  const isByMe = originalFolder === 'sent' || originalFolder === 'drafts';

  return {
    id:             msg.id,
    originalFolder,
    subject:        msg.subject ?? '(No Subject)',
    senderName:     getSenderName(msg.sender),
    recipientNames: toRec.map(r => r.name ?? r.email).join(', ') || 'You',
    isByMe,
    preview:        buildMessagePreview(msg.body),
    body:           msg.body ?? '',
    deletedAt:      formatRelativeTime(item.trashed_at ?? item.updated_at),
    deletedDate:    new Date(item.trashed_at ?? item.updated_at),
    originalDate:   new Date(msg.sent_at ?? msg.created_at),
    starred:        item.is_starred,
    labels:         msg.labels?.map(l => l.label) ?? [],
    attachments:    msg.attachments?.map(a => ({
      id:   a.id,
      name: a.original_name,
      size: a.size_formatted ?? formatBytes(a.size_bytes),
      type: a.mime_type ?? 'unknown',
    })) ?? [],
    priority:         msg.priority,
    expiresAt,
    expiresIn,
    recoveryPossible: recoverable,
  };
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export const Trash: React.FC<TrashProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  /* ─── Local UI State ───────────────────────────────────────────── */
  const [selectedId,   setSelectedId]   = useState<number | null>(null);
  const [folderFilter, setFolderFilter] = useState<FolderFilter>('all');
  const [trashSort,    setTrashSort]    = useState<TrashSort>('recentlyDeleted');
  const [timeRange,    setTimeRange]    = useState<TimeRange>('all');
  const [searchTerm,   setSearchTerm]   = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showMobileList,  setShowMobileList]  = useState(true);
  const [showFilters,     setShowFilters]     = useState(false);
  const [isFocused,       setIsFocused]       = useState(false);
  const [selectMode,      setSelectMode]      = useState(false);
  const [selectedItems,   setSelectedItems]   = useState<Set<number>>(new Set());
  const [deleteConfirm,   setDeleteConfirm]   = useState<'single' | 'multiple' | 'all' | null>(null);
  const [confirmTargetId, setConfirmTargetId] = useState<number | null>(null);

  /* ─── Debounce ─────────────────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /* ─── API params – server handles sort, we handle folder/time on client ─ */
  const apiParams = useMemo(() => ({
    folder:   'trash' as MessageFolder,
    sort:     trashSort,
    search:   debouncedSearch || undefined,
    per_page: 100,
  }), [trashSort, debouncedSearch]);

  /* ─── Queries ──────────────────────────────────────────────────── */
  const { data, isLoading, isFetching, error, refetch } = useTrashMessages(apiParams);
  const { data: statsData } = useGetMessageStats();

  const rawMessages = useMemo(() => (data?.data ?? []).map(mapToDisplayTrash), [data]);

  /* ─── Client-side filtering (folder + time range) ──────────────── */
  const messages = useMemo(() => {
    let list = [...rawMessages];

    /* Folder filter */
    if (folderFilter === 'starred') {
      list = list.filter(m => m.starred);
    } else if (folderFilter !== 'all') {
      list = list.filter(m => m.originalFolder === folderFilter);
    }

    /* Time range */
    if (timeRange !== 'all') {
      const now  = Date.now();
      const cuts: Record<Exclude<TimeRange, 'all'>, number> = {
        today: now - 24 * 60 * 60 * 1000,
        week:  now - 7  * 24 * 60 * 60 * 1000,
        month: now - 30 * 24 * 60 * 60 * 1000,
      };
      list = list.filter(m => m.deletedDate.getTime() >= cuts[timeRange]);
    }

    return list;
  }, [rawMessages, folderFilter, timeRange]);

  /* ─── Mutations ────────────────────────────────────────────────── */
  const restore     = useRestoreMessage();
  const permDelete  = usePermanentDeleteMessage();
  const emptyTrash  = useEmptyTrash();
  const bulkAction  = useBulkMessageAction();
  const toggleStar  = useToggleStarMessage();

  /* ─── Derived stats ────────────────────────────────────────────── */
  const totalCount = statsData?.trash.total ?? rawMessages.length;

  const stats = useMemo(() => ({
    total:         rawMessages.length,
    starred:       rawMessages.filter(m => m.starred).length,
    inbox:         rawMessages.filter(m => m.originalFolder === 'inbox').length,
    sent:          rawMessages.filter(m => m.originalFolder === 'sent').length,
    drafts:        rawMessages.filter(m => m.originalFolder === 'drafts').length,
    archive:       rawMessages.filter(m => m.originalFolder === 'archive').length,
    expiringSoon:  rawMessages.filter(m => {
      if (!m.expiresAt || !m.recoveryPossible) return false;
      const daysLeft = Math.ceil((m.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7;
    }).length,
    expired:       rawMessages.filter(m => !m.recoveryPossible).length,
  }), [rawMessages]);

  const selectedMessage = useMemo(
    () => messages.find(m => m.id === selectedId) ?? null,
    [messages, selectedId],
  );

  /* ─── Select mode helpers ──────────────────────────────────────── */
  const toggleSelectMode = useCallback(() => {
    setSelectMode(prev => !prev);
    setSelectedItems(new Set());
  }, []);

  const toggleItem = useCallback((id: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedItems.size === messages.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(messages.map(m => m.id)));
    }
  }, [messages, selectedItems.size]);

  /* ─── Action handlers ──────────────────────────────────────────── */
  const handleRefresh = useCallback(() => refetch(), [refetch]);

  const handleSelectMessage = useCallback((id: number) => {
    if (selectMode) { toggleItem(id); return; }
    setSelectedId(id);
    if (window.innerWidth < 768) setShowMobileList(false);
  }, [selectMode, toggleItem]);

  const handleToggleStar = useCallback((id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toggleStar.mutate({ id });
  }, [toggleStar]);

  /** Restore a single message */
  const handleRestore = useCallback((id: number) => {
    restore.mutate({ id }, {
      onSuccess: () => {
        if (selectedId === id) setSelectedId(null);
        if (selectedItems.has(id)) {
          setSelectedItems(prev => { const n = new Set(prev); n.delete(id); return n; });
        }
      },
    });
  }, [restore, selectedId, selectedItems]);

  /** Bulk restore selected */
  const handleBulkRestore = useCallback(() => {
    bulkAction.mutate(
      { action: 'restore', message_ids: Array.from(selectedItems) },
      {
        onSuccess: () => {
          setSelectedItems(new Set());
          setSelectMode(false);
          setSelectedId(null);
        },
      },
    );
  }, [bulkAction, selectedItems]);

  /** Permanently delete single – shows confirm first */
  const openSingleDeleteConfirm = useCallback((id: number) => {
    setConfirmTargetId(id);
    setDeleteConfirm('single');
  }, []);

  const handlePermDelete = useCallback(() => {
    if (deleteConfirm === 'single' && confirmTargetId !== null) {
      permDelete.mutate({ id: confirmTargetId }, {
        onSuccess: () => {
          if (selectedId === confirmTargetId) setSelectedId(null);
          setDeleteConfirm(null);
          setConfirmTargetId(null);
        },
      });
    } else if (deleteConfirm === 'multiple') {
      bulkAction.mutate(
        { action: 'permanentDelete', message_ids: Array.from(selectedItems) },
        {
          onSuccess: () => {
            setSelectedItems(new Set());
            setSelectMode(false);
            setSelectedId(null);
            setDeleteConfirm(null);
          },
        },
      );
    } else if (deleteConfirm === 'all') {
      emptyTrash.mutate(undefined, {
        onSuccess: () => {
          setSelectedId(null);
          setSelectedItems(new Set());
          setSelectMode(false);
          setDeleteConfirm(null);
        },
      });
    }
  }, [deleteConfirm, confirmTargetId, permDelete, bulkAction, emptyTrash, selectedId, selectedItems]);

  const handleBackToList  = useCallback(() => setShowMobileList(true), []);
  const handleClearSearch = useCallback(() => setSearchTerm(''), []);

  const isMutating =
    restore.isPending    ||
    permDelete.isPending ||
    emptyTrash.isPending ||
    bulkAction.isPending;

  /* ─── Render helpers ───────────────────────────────────────────── */
  const folderIcon = (folder: string) => {
    switch (folder) {
      case 'inbox':   return <Mail    className="w-3 h-3" />;
      case 'sent':    return <Send    className="w-3 h-3" />;
      case 'drafts':  return <FileText className="w-3 h-3" />;
      case 'archive': return <Archive  className="w-3 h-3" />;
      default:        return <Mail    className="w-3 h-3" />;
    }
  };
  const folderColor = (folder: string) => {
    switch (folder) {
      case 'inbox':   return 'text-blue-500';
      case 'sent':    return 'text-purple-500';
      case 'drafts':  return 'text-amber-500';
      case 'archive': return 'text-green-500';
      default:        return 'text-gray-500';
    }
  };

  /* ================================================================ */
  /*                              RENDER                              */
  /* ================================================================ */
  return (
    <div className="h-full flex flex-col">

      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative overflow-hidden rounded-xl border-2 mb-4 transition-all duration-300 group',
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-red-500/30 hover:border-red-500/50'
            : 'bg-gradient-to-br from-white to-red-50/50 border-red-200 hover:border-red-400',
        )}>
        <div className={cn(
          'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity opacity-0',
          isDark ? 'bg-red-500/10 group-hover:opacity-100' : 'bg-red-500/5 group-hover:opacity-100',
        )} />
        <div className="relative p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-3 rounded-xl transition-all duration-300',
                isDark
                  ? 'bg-red-500/20 group-hover:bg-red-500/30 group-hover:scale-110'
                  : 'bg-red-100 group-hover:bg-red-200 group-hover:scale-110',
              )}>
                <Trash2 className={cn('w-6 h-6', isDark ? 'text-red-400' : 'text-red-600')} />
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Trash
                  <span className={cn(
                    'text-sm font-medium px-2.5 py-1 rounded-full',
                    isDark
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-red-100 text-red-700 border border-red-200',
                  )}>
                    {totalCount} items
                  </span>
                </h2>
                <p className={cn('mt-1 text-sm flex items-center gap-2 flex-wrap', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  {stats.expiringSoon > 0 && (
                    <span className="text-amber-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {stats.expiringSoon} expiring soon
                    </span>
                  )}
                  {stats.expired > 0 && (
                    <span className="text-gray-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {stats.expired} expired
                    </span>
                  )}
                  {stats.starred > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {stats.starred} starred
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-2">
              {/* Select mode toggle */}
              {rawMessages.length > 0 && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={toggleSelectMode}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all cursor-pointer',
                    selectMode
                      ? isDark ? 'bg-red-600 border-red-500 text-white' : 'bg-red-600 border-red-400 text-white'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
                  )}>
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">{selectMode ? 'Cancel' : 'Select'}</span>
                </motion.button>
              )}

              {/* Bulk restore */}
              <AnimatePresence>
                {selectMode && selectedItems.size > 0 && (
                  <>
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={handleBulkRestore} disabled={isMutating}
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all cursor-pointer disabled:opacity-50',
                        isDark
                          ? 'bg-green-600 border-green-500 text-white hover:bg-green-700'
                          : 'bg-green-600 border-green-400 text-white hover:bg-green-700',
                      )}>
                      <RotateCcw className="w-4 h-4" />
                      <span className="hidden sm:inline">Restore ({selectedItems.size})</span>
                    </motion.button>
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setDeleteConfirm('multiple')} disabled={isMutating}
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all cursor-pointer disabled:opacity-50',
                        isDark
                          ? 'bg-red-600 border-red-500 text-white hover:bg-red-700'
                          : 'bg-red-600 border-red-400 text-white hover:bg-red-700',
                      )}>
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete ({selectedItems.size})</span>
                    </motion.button>
                  </>
                )}
              </AnimatePresence>

              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleRefresh} disabled={isFetching}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all disabled:opacity-50 cursor-pointer',
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
                )}>
                <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
                <span className="hidden sm:inline">Refresh</span>
              </motion.button>

              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all md:hidden cursor-pointer',
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
                )}>
                <Filter className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Search & Filters — Desktop ──────────────────────────── */}
      <div className="hidden md:block mb-4">
        <div className={cn(
          'relative overflow-hidden rounded-xl border-2 transition-all duration-300',
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 hover:border-gray-600'
            : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-gray-300',
        )}>
          <div className="p-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="flex-1 min-w-[200px] relative">
                <motion.div
                  className="absolute inset-0 rounded-lg z-0"
                  style={{ background: 'linear-gradient(90deg,#ef4444,#f97316,#f59e0b,#ef4444)', backgroundSize: '300% 100%' }}
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ duration: isFocused ? 2 : 6, repeat: Infinity, ease: 'linear' }}
                />
                <div className="relative z-10 m-[2px] rounded-[6px] overflow-hidden">
                  <Search className={cn(
                    'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
                    isFocused ? 'text-red-500' : isDark ? 'text-gray-500' : 'text-gray-400',
                  )} />
                  <input type="text" placeholder="Search trash…" value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
                    className={cn(
                      'w-full pl-10 pr-10 py-2 text-sm border-transparent focus:outline-none focus:ring-0 transition-colors',
                      isDark ? 'bg-gray-900 text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400',
                    )}
                  />
                  {searchTerm && (
                    <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      onClick={handleClearSearch}
                      className={cn(
                        'absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors cursor-pointer',
                        isDark
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                      )}>
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Folder filter pills */}
              <div className="flex items-center gap-1 flex-wrap">
                {([
                  { key: 'all',     label: `All (${stats.total})`,         icon: null,                           active: 'bg-red-600 border-red-500' },
                  { key: 'starred', label: `Starred (${stats.starred})`,   icon: <Star className="w-3.5 h-3.5" />,   active: 'bg-yellow-500 border-yellow-400' },
                  { key: 'inbox',   label: `Inbox (${stats.inbox})`,       icon: <Mail className="w-3.5 h-3.5" />,   active: 'bg-blue-600 border-blue-500' },
                  { key: 'sent',    label: `Sent (${stats.sent})`,         icon: <Send className="w-3.5 h-3.5" />,   active: 'bg-purple-600 border-purple-500' },
                  { key: 'drafts',  label: `Drafts (${stats.drafts})`,     icon: <FileText className="w-3.5 h-3.5" />, active: 'bg-amber-600 border-amber-500' },
                  { key: 'archive', label: `Archive (${stats.archive})`,   icon: <Archive className="w-3.5 h-3.5" />, active: 'bg-green-600 border-green-500' },
                ] as { key: FolderFilter; label: string; icon: React.ReactNode; active: string }[])
                  .map(({ key, label, icon, active }) => (
                    <button key={key} onClick={() => setFolderFilter(key)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 cursor-pointer flex items-center gap-1.5',
                        folderFilter === key
                          ? `${active} text-white`
                          : isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100',
                      )}>
                      {icon}
                      {label}
                    </button>
                  ))}
              </div>

              {/* Time range */}
              <select value={timeRange} onChange={e => setTimeRange(e.target.value as TimeRange)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm border-2 cursor-pointer',
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900',
                )}>
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>

              {/* Sort */}
              <select value={trashSort} onChange={e => setTrashSort(e.target.value as TrashSort)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm border-2 cursor-pointer',
                  isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900',
                )}>
                <option value="recentlyDeleted">Recently deleted</option>
                <option value="oldestDeleted">Oldest deleted</option>
                <option value="originalDate">Original date</option>
              </select>

              {/* Empty Trash */}
              {rawMessages.length > 0 && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setDeleteConfirm('all')} disabled={isMutating}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border-2 transition-all cursor-pointer disabled:opacity-50',
                    isDark
                      ? 'bg-red-600 border-red-500 text-white hover:bg-red-700'
                      : 'bg-red-600 border-red-400 text-white hover:bg-red-700',
                  )}>
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden xl:inline">Empty Trash</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Filters ─────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="md:hidden mb-4 overflow-hidden">
            <div className={cn('rounded-xl border-2 p-3', isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
              <div className="space-y-3">
                <div className="relative">
                  <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
                  <input type="text" placeholder="Search trash…" value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-10 py-2 rounded-lg text-sm border-2 focus:outline-none focus:ring-2 focus:ring-red-500',
                      isDark
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
                    )}
                  />
                  {searchTerm && (
                    <button onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: 'all',     label: `All (${stats.total})`,       activeClass: isDark ? 'bg-red-600 border-red-500' : 'bg-red-600 border-red-400' },
                    { key: 'starred', label: `Starred (${stats.starred})`, activeClass: isDark ? 'bg-yellow-600 border-yellow-500' : 'bg-yellow-500 border-yellow-400' },
                    { key: 'inbox',   label: `Inbox (${stats.inbox})`,     activeClass: isDark ? 'bg-blue-600 border-blue-500' : 'bg-blue-600 border-blue-400' },
                    { key: 'sent',    label: `Sent (${stats.sent})`,       activeClass: isDark ? 'bg-purple-600 border-purple-500' : 'bg-purple-600 border-purple-400' },
                    { key: 'drafts',  label: `Drafts (${stats.drafts})`,   activeClass: isDark ? 'bg-amber-600 border-amber-500' : 'bg-amber-600 border-amber-400' },
                    { key: 'archive', label: `Archive (${stats.archive})`, activeClass: isDark ? 'bg-green-600 border-green-500' : 'bg-green-600 border-green-400' },
                  ] as { key: FolderFilter; label: string; activeClass: string }[]).map(({ key, label, activeClass }) => (
                    <button key={key} onClick={() => setFolderFilter(key)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border-2',
                        folderFilter === key
                          ? `${activeClass} text-white`
                          : isDark
                            ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200',
                      )}>
                      {label}
                    </button>
                  ))}
                </div>
                <select value={timeRange} onChange={e => setTimeRange(e.target.value as TimeRange)}
                  className={cn('w-full px-3 py-2 rounded-lg text-sm border-2', isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900')}>
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                </select>
                <select value={trashSort} onChange={e => setTrashSort(e.target.value as TrashSort)}
                  className={cn('w-full px-3 py-2 rounded-lg text-sm border-2', isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900')}>
                  <option value="recentlyDeleted">Recently deleted</option>
                  <option value="oldestDeleted">Oldest deleted</option>
                  <option value="originalDate">Original date</option>
                </select>
                {rawMessages.length > 0 && (
                  <button onClick={() => setDeleteConfirm('all')}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border-2',
                      isDark ? 'bg-red-600 border-red-500 text-white' : 'bg-red-600 border-red-400 text-white',
                    )}>
                    <Trash2 className="w-4 h-4" /> Empty Trash
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ───────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex gap-4">

        {/* List panel */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className={cn(
            'w-full md:w-96 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all',
            !showMobileList && 'hidden md:block',
            isDark
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50'
              : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200',
          )}>
          <div className="h-full flex flex-col">
            {/* List header */}
            <div className={cn('p-3 border-b-2 flex items-center justify-between', isDark ? 'border-gray-700' : 'border-gray-200')}>
              <div className="flex items-center gap-2">
                {selectMode && (
                  <input type="checkbox"
                    checked={selectedItems.size === messages.length && messages.length > 0}
                    onChange={selectAll}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                )}
                <span className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  {selectMode ? `${selectedItems.size} selected` : `${messages.length} items`}
                </span>
              </div>
              {debouncedSearch && (
                <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>Filtered</span>
              )}
            </div>

            {/* List items */}
            <div className="flex-1 overflow-y-auto divide-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className={cn('w-8 h-8 border-2 rounded-full animate-spin', isDark ? 'border-red-400 border-t-transparent' : 'border-red-500 border-t-transparent')} />
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <AlertCircle className={cn('w-8 h-8 mx-auto mb-2', isDark ? 'text-red-400' : 'text-red-500')} />
                  <p className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>Failed to load trash</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {messages.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center">
                      <Trash2 className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-gray-700' : 'text-gray-300')} />
                      <p className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>Trash is empty</p>
                      <p className={cn('text-xs mt-1', isDark ? 'text-gray-500' : 'text-gray-500')}>
                        {debouncedSearch ? 'No items match your search' : 'Deleted messages appear here'}
                      </p>
                    </motion.div>
                  ) : (
                    messages.map((msg, index) => (
                      <motion.div key={msg.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }} transition={{ delay: index * 0.02 }}
                        onClick={() => handleSelectMessage(msg.id)}
                        className={cn(
                          'p-4 cursor-pointer transition-all relative group',
                          selectedId === msg.id && !selectMode
                            ? isDark ? 'bg-red-900/20 border-l-4 border-red-500' : 'bg-red-50 border-l-4 border-red-500'
                            : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50',
                          !msg.recoveryPossible && 'opacity-50',
                          selectMode && selectedItems.has(msg.id) && (isDark ? 'bg-red-900/10' : 'bg-red-50/50'),
                          isDark ? 'border-gray-700' : 'border-gray-200',
                        )}>
                        {/* Checkbox */}
                        {selectMode && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={selectedItems.has(msg.id)}
                              onChange={() => toggleItem(msg.id)}
                              className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                            />
                          </div>
                        )}

                        {/* Sender / recipient + time */}
                        <div className={cn('flex items-start justify-between gap-2 mb-2', selectMode && 'pl-8')}>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', isDark ? 'bg-gray-700' : 'bg-gray-200')}>
                              {msg.isByMe
                                ? <Users className={cn('w-4 h-4', isDark ? 'text-gray-400' : 'text-gray-600')} />
                                : <User  className={cn('w-4 h-4', isDark ? 'text-gray-400' : 'text-gray-600')} />
                              }
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={cn('text-sm font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>
                                {msg.isByMe ? `To: ${msg.recipientNames}` : msg.senderName}
                              </p>
                              <p className={cn('text-xs truncate flex items-center gap-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
                                <span className={folderColor(msg.originalFolder)}>
                                  {folderIcon(msg.originalFolder)}
                                </span>
                                <span className={folderColor(msg.originalFolder)}>{msg.originalFolder}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!msg.recoveryPossible && <AlertTriangle className="w-3 h-3 text-gray-500" />}
                            {msg.starred && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                            <span className={cn('text-xs whitespace-nowrap', isDark ? 'text-gray-500' : 'text-gray-500')}>
                              {msg.deletedAt}
                            </span>
                          </div>
                        </div>

                        {/* Subject */}
                        <p className={cn('text-sm truncate flex-1 font-medium mb-1', selectMode && 'pl-8', isDark ? 'text-white' : 'text-gray-900')}>
                          {msg.subject}
                        </p>

                        {/* Preview */}
                        <p className={cn('text-xs truncate mb-2', selectMode && 'pl-8', isDark ? 'text-gray-400' : 'text-gray-600')}>
                          {msg.preview}
                        </p>

                        {/* Labels + expiry */}
                        <div className={cn('flex flex-wrap items-center gap-1', selectMode && 'pl-8')}>
                          {msg.labels.map(label => (
                            <span key={label} className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                              isDark
                                ? 'bg-gray-700 text-gray-300 border border-gray-600'
                                : 'bg-gray-100 text-gray-700 border border-gray-200',
                            )}>
                              <Tag className="w-3 h-3" /> {label}
                            </span>
                          ))}
                          {msg.attachments.length > 0 && (
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700',
                            )}>
                              <Paperclip className="w-3 h-3" /> {msg.attachments.length}
                            </span>
                          )}
                          {msg.expiresIn !== 'No expiry' && (
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                              msg.expiresIn === 'Expired'
                                ? isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-500'
                                : msg.expiresAt && Math.ceil((msg.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 7
                                  ? isDark
                                    ? 'bg-amber-900/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                                  : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700',
                            )}>
                              <Clock className="w-3 h-3" />
                              {msg.expiresIn === 'Expired' ? 'Expired' : `${msg.expiresIn} left`}
                            </span>
                          )}
                        </div>

                        {/* Hover actions */}
                        {!selectMode && msg.recoveryPossible && (
                          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={e => { e.stopPropagation(); handleRestore(msg.id); }}
                              disabled={restore.isPending}
                              className={cn(
                                'p-1.5 rounded-full transition-colors disabled:opacity-50',
                                isDark ? 'hover:bg-green-600/20 text-green-400' : 'hover:bg-green-100 text-green-600',
                              )}
                              title="Restore">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); openSingleDeleteConfirm(msg.id); }}
                              className={cn(
                                'p-1.5 rounded-full transition-colors',
                                isDark ? 'hover:bg-red-600/20 text-red-400' : 'hover:bg-red-100 text-red-600',
                              )}
                              title="Delete permanently">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>

        {/* Detail panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className={cn(
            'flex-1 min-w-0 overflow-hidden rounded-xl border-2 transition-all',
            showMobileList ? 'hidden md:block' : 'block',
            isDark
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50'
              : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200',
          )}>
          {selectedMessage && !selectMode ? (
            <div className="h-full flex flex-col">
              {/* Detail header */}
              <div className={cn('p-4 border-b-2 flex items-center justify-between', isDark ? 'border-gray-700' : 'border-gray-200')}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button onClick={handleBackToList}
                    className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-semibold truncate">{selectedMessage.subject}</h3>
                  {selectedMessage.priority === 'high' && (
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                      isDark
                        ? 'bg-red-900/20 text-red-300 border border-red-500/30'
                        : 'bg-red-50 text-red-600 border border-red-200',
                    )}>
                      High Priority
                    </span>
                  )}
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0',
                    folderColor(selectedMessage.originalFolder),
                    isDark ? 'bg-gray-700/50' : 'bg-gray-100',
                  )}>
                    {folderIcon(selectedMessage.originalFolder)}
                    {selectedMessage.originalFolder}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {/* Star */}
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleStar(selectedMessage.id)}
                    className={cn('p-2 rounded-lg transition-colors cursor-pointer', isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200')}>
                    <Star className={cn(
                      'w-5 h-5',
                      selectedMessage.starred
                        ? 'fill-yellow-400 text-yellow-400'
                        : isDark ? 'text-gray-500' : 'text-gray-400',
                    )} />
                  </motion.button>

                  {selectedMessage.recoveryPossible ? (
                    <>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleRestore(selectedMessage.id)}
                        disabled={restore.isPending}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50',
                          isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white',
                        )}>
                        {restore.isPending
                          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <RotateCcw className="w-4 h-4" />
                        }
                        Restore
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => openSingleDeleteConfirm(selectedMessage.id)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer',
                          isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white',
                        )}>
                        <Trash2 className="w-4 h-4" />
                        Delete Permanently
                      </motion.button>
                    </>
                  ) : (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => openSingleDeleteConfirm(selectedMessage.id)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer',
                        isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white',
                      )}>
                      <Trash2 className="w-4 h-4" />
                      Delete Permanently
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Expired notice */}
                {!selectedMessage.recoveryPossible && (
                  <div className={cn(
                    'mb-4 p-3 rounded-lg flex items-start gap-2',
                    isDark
                      ? 'bg-gray-700 text-gray-300 border border-gray-600'
                      : 'bg-gray-100 text-gray-700 border border-gray-200',
                  )}>
                    <AlertTriangle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">This message has expired</p>
                      <p className="text-sm">Expired messages cannot be restored and will be automatically removed.</p>
                    </div>
                  </div>
                )}

                {/* Expiring soon notice */}
                {selectedMessage.recoveryPossible && selectedMessage.expiresAt &&
                  Math.ceil((selectedMessage.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 7 && (
                  <div className={cn(
                    'mb-4 p-3 rounded-lg flex items-start gap-2',
                    isDark
                      ? 'bg-amber-900/20 text-amber-300 border border-amber-500/30'
                      : 'bg-amber-50 text-amber-700 border border-amber-200',
                  )}>
                    <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Expiring soon</p>
                      <p className="text-sm">
                        This message will be permanently deleted in {selectedMessage.expiresIn}.
                      </p>
                    </div>
                  </div>
                )}

                {/* Deletion info */}
                <div className={cn(
                  'mb-4 p-3 rounded-lg flex items-start gap-2',
                  isDark
                    ? 'bg-gray-700/50 text-gray-300 border border-gray-600'
                    : 'bg-gray-50 text-gray-700 border border-gray-200',
                )}>
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Deleted {selectedMessage.deletedAt}</p>
                    <p className="text-sm">
                      Originally from{' '}
                      <span className={folderColor(selectedMessage.originalFolder)}>
                        {selectedMessage.originalFolder}
                      </span>{' '}
                      folder • Original date: {selectedMessage.originalDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Sender / recipient */}
                <div className="mb-6 flex items-start gap-3">
                  <div className={cn('w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0', isDark ? 'bg-gray-700' : 'bg-gray-200')}>
                    {selectedMessage.isByMe
                      ? <Users className={cn('w-6 h-6', isDark ? 'text-gray-400' : 'text-gray-600')} />
                      : <User  className={cn('w-6 h-6', isDark ? 'text-gray-400' : 'text-gray-600')} />
                    }
                  </div>
                  <div className="flex-1">
                    {selectedMessage.isByMe ? (
                      <>
                        <h4 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                          To: {selectedMessage.recipientNames}
                        </h4>
                        <p className={cn('text-sm mt-0.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
                          Sent by you
                        </p>
                      </>
                    ) : (
                      <>
                        <h4 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                          From: {selectedMessage.senderName}
                        </h4>
                        <p className={cn('text-sm mt-0.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
                          To: {selectedMessage.recipientNames}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className={cn('prose max-w-none mb-8 whitespace-pre-wrap', isDark ? 'prose-invert' : '')}>
                  {selectedMessage.body}
                </div>

                {/* Attachments */}
                {selectedMessage.attachments.length > 0 && (
                  <div className="mt-6">
                    <h5 className={cn('text-sm font-medium mb-3 flex items-center gap-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
                      <Paperclip className="w-4 h-4" />
                      Attachments ({selectedMessage.attachments.length})
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedMessage.attachments.map((att) => (
                        <div key={att.id} className={cn(
                          'p-3 rounded-lg border-2 flex items-center gap-3',
                          isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200',
                        )}>
                          <div className={cn('p-2 rounded-lg', isDark ? 'bg-gray-600' : 'bg-white')}>
                            <Paperclip className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>{att.name}</p>
                            <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>{att.size}</p>
                          </div>
                          <button className={cn(
                            'p-2 rounded-lg transition-colors cursor-pointer',
                            isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600',
                          )}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
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
                <Trash2 className={cn('w-16 h-16 mx-auto mb-4', isDark ? 'text-gray-700' : 'text-gray-300')} />
                <h3 className={cn('text-lg font-semibold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                  {selectMode ? 'Select messages to manage' : 'No message selected'}
                </h3>
                <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  {selectMode
                    ? 'Choose messages to restore or permanently delete'
                    : 'Select a deleted message from the list to view it'}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Permanent Delete Confirmation Modal ─────────────────── */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className={cn('max-w-md w-full rounded-xl border-2 p-6', isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn('p-3 rounded-full', isDark ? 'bg-red-900/20' : 'bg-red-100')}>
                  <AlertTriangle className={cn('w-6 h-6', isDark ? 'text-red-400' : 'text-red-600')} />
                </div>
                <h3 className="text-lg font-semibold">Permanently Delete?</h3>
              </div>
              <p className={cn('mb-6', isDark ? 'text-gray-300' : 'text-gray-700')}>
                {deleteConfirm === 'all'
                  ? 'Are you sure you want to empty the trash? All messages will be permanently deleted and cannot be recovered.'
                  : deleteConfirm === 'multiple'
                    ? `Are you sure you want to permanently delete ${selectedItems.size} message${selectedItems.size > 1 ? 's' : ''}? This action cannot be undone.`
                    : 'Are you sure you want to permanently delete this message? This action cannot be undone.'}
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium border-2 cursor-pointer',
                    isDark
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-100',
                  )}>
                  Cancel
                </button>
                <button onClick={handlePermDelete} disabled={isMutating}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50',
                    isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white',
                  )}>
                  {isMutating
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                  {isMutating ? 'Deleting…' : 'Delete Permanently'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Trash;
