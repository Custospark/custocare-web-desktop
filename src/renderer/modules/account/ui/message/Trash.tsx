/**
 * ============================================================================
 * TRASH COMPONENT
 * ============================================================================
 * 
 * Trash component for displaying deleted messages with left sidebar list and right
 * detail view with restore and permanent delete actions. Uses mock data for demonstration.
 * 
 * @component Trash
 */

import React, { useState, useMemo, useCallback } from 'react';
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

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface TrashProps {
  theme: 'light' | 'dark';
}

interface TrashMessage {
  id: string;
  originalFolder: 'inbox' | 'sent' | 'drafts' | 'archive';
  subject: string;
  sender?: {
    name: string;
    email: string;
    avatar?: string;
  };
  recipients?: Array<{
    name: string;
    email: string;
  }>;
  preview: string;
  body: string;
  deletedAt: string;
  deletedDate: Date;
  originalDate: Date;
  starred: boolean;
  labels: string[];
  attachments?: Array<{
    name: string;
    size: string;
    type: string;
  }>;
  priority: 'low' | 'normal' | 'high';
  expiresIn?: string;
  autoDelete?: boolean;
  recoveryPossible?: boolean;
}

type FilterType = 'all' | 'starred' | 'inbox' | 'sent' | 'drafts' | 'archive';
type SortType = 'recentlyDeleted' | 'oldestDeleted' | 'originalDate';
type TimeRangeType = 'all' | 'today' | 'week' | 'month';

/* -------------------------------------------------------------------------- */
/*                                 MOCK DATA                                  */
/* -------------------------------------------------------------------------- */

const generateMockTrashMessages = (): TrashMessage[] => {
  const now = new Date();
  const oneHourAgo = new Date(now);
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  
  const threeHoursAgo = new Date(now);
  threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);
  
  const sixHoursAgo = new Date(now);
  sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const threeWeeksAgo = new Date(now);
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
  
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  return [
    {
      id: 't1',
      originalFolder: 'inbox',
      subject: 'Urgent: Staff Credentialing Deadline Approaching',
      sender: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@hospital.org',
      },
      preview: 'This is a reminder that the credentialing deadline for Q3 is approaching...',
      body: `Dear Staff Member,

This is a reminder that the credentialing deadline for Q3 is approaching on June 30th, 2025.

Please ensure all your documents are uploaded and verified before the deadline.

Best regards,
Sarah Johnson`,
      deletedAt: '1 hour ago',
      deletedDate: oneHourAgo,
      originalDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      starred: false,
      labels: ['urgent', 'credentialing'],
      priority: 'high',
      attachments: [
        { name: 'credentialing_guide.pdf', size: '2.4 MB', type: 'pdf' }
      ],
      expiresIn: '29 days',
      recoveryPossible: true,
    },
    {
      id: 't2',
      originalFolder: 'inbox',
      subject: 'Facility Policy Update - Effective Immediately',
      sender: {
        name: 'Administration',
        email: 'admin@facility.com',
      },
      preview: 'Please review the updated facility policies regarding patient data handling...',
      body: `Dear Team,

We have updated our facility policies regarding patient data handling and privacy protocols. These changes are effective immediately.

Thank you,
Administration`,
      deletedAt: '3 hours ago',
      deletedDate: threeHoursAgo,
      originalDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      starred: true,
      labels: ['policy', 'important'],
      priority: 'high',
      attachments: [
        { name: 'policy_update_v2.pdf', size: '1.8 MB', type: 'pdf' }
      ],
      expiresIn: '29 days',
      recoveryPossible: true,
    },
    {
      id: 't3',
      originalFolder: 'sent',
      subject: 'Credentialing Documents Submitted',
      recipients: [
        { name: 'Sarah Johnson', email: 'sarah.johnson@hospital.org' }
      ],
      preview: 'I have submitted all required credentialing documents for your review...',
      body: `Dear Sarah,

I have submitted all required credentialing documents for your review. Please find attached the necessary documents.

Best regards,
John Doe`,
      deletedAt: '6 hours ago',
      deletedDate: sixHoursAgo,
      originalDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      starred: false,
      labels: ['credentialing', 'sent'],
      priority: 'high',
      attachments: [
        { name: 'license_2025.pdf', size: '1.2 MB', type: 'pdf' }
      ],
      expiresIn: '29 days',
      recoveryPossible: true,
    },
    {
      id: 't4',
      originalFolder: 'drafts',
      subject: 'RE: Credentialing Documents - Additional Info',
      recipients: [
        { name: 'Sarah Johnson', email: 'sarah.johnson@hospital.org' }
      ],
      preview: 'Following up on the additional documents you requested...',
      body: `Hi Sarah,

Following up on the additional documents you requested for my credentialing application.

Thanks,
John`,
      deletedAt: 'yesterday',
      deletedDate: yesterday,
      originalDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      starred: false,
      labels: ['credentialing', 'draft'],
      priority: 'normal',
      attachments: [
        { name: 'cv_updated_2025.pdf', size: '1.5 MB', type: 'pdf' }
      ],
      expiresIn: '28 days',
      recoveryPossible: true,
    },
    {
      id: 't5',
      originalFolder: 'inbox',
      subject: 'Invitation: Monthly Staff Meeting',
      sender: {
        name: 'Dr. Michael Chen',
        email: 'm.chen@facility.com',
      },
      preview: 'You are invited to the monthly staff meeting scheduled for...',
      body: `Dear Colleagues,

You are invited to our monthly staff meeting.

Date: June 15, 2025
Time: 2:00 PM

Best,
Dr. Michael Chen`,
      deletedAt: '2 days ago',
      deletedDate: twoDaysAgo,
      originalDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      starred: false,
      labels: ['meeting', 'invitation'],
      priority: 'normal',
      expiresIn: '27 days',
      recoveryPossible: true,
    },
    {
      id: 't6',
      originalFolder: 'sent',
      subject: 'Re: Facility Policy Update',
      recipients: [
        { name: 'Administration', email: 'admin@facility.com' }
      ],
      preview: 'Thank you for the policy update. I have reviewed and acknowledged the changes...',
      body: `Dear Administration,

Thank you for the policy update. I have reviewed and acknowledged the changes.

Best regards,
John Doe`,
      deletedAt: '3 days ago',
      deletedDate: threeDaysAgo,
      originalDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      starred: false,
      labels: ['policy', 'acknowledged', 'sent'],
      priority: 'high',
      expiresIn: '26 days',
      recoveryPossible: true,
    },
    {
      id: 't7',
      originalFolder: 'drafts',
      subject: 'Monthly Staff Meeting - Agenda Item',
      recipients: [
        { name: 'Dr. Michael Chen', email: 'm.chen@facility.com' }
      ],
      preview: 'I would like to add an item to the agenda for the upcoming staff meeting...',
      body: `Dear Dr. Chen,

I would like to add an item to the agenda for the upcoming staff meeting.

Best regards,
John`,
      deletedAt: '5 days ago',
      deletedDate: fiveDaysAgo,
      originalDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      starred: true,
      labels: ['meeting', 'agenda', 'draft'],
      priority: 'normal',
      expiresIn: '24 days',
      recoveryPossible: true,
    },
    {
      id: 't8',
      originalFolder: 'archive',
      subject: 'Your Timesheet Has Been Approved',
      sender: {
        name: 'Payroll Department',
        email: 'payroll@facility.com',
      },
      preview: 'Your timesheet for the period of May 15-31 has been approved...',
      body: `Dear Staff Member,

Your timesheet for the period of May 15-31, 2025 has been approved.

Thank you,
Payroll Department`,
      deletedAt: '1 week ago',
      deletedDate: oneWeekAgo,
      originalDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      starred: false,
      labels: ['payroll', 'approved', 'archive'],
      priority: 'normal',
      expiresIn: '21 days',
      recoveryPossible: true,
    },
    {
      id: 't9',
      originalFolder: 'inbox',
      subject: 'New Continuing Education Courses Available',
      sender: {
        name: 'Education Department',
        email: 'education@facility.com',
      },
      preview: 'We are pleased to announce new CME/CE courses available for the upcoming quarter...',
      body: `Dear Staff,

We are pleased to announce new CME/CE courses available for the upcoming quarter.

Best regards,
Education Department`,
      deletedAt: '2 weeks ago',
      deletedDate: twoWeeksAgo,
      originalDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      starred: true,
      labels: ['education', 'cme'],
      priority: 'low',
      attachments: [
        { name: 'course_catalog_q3.pdf', size: '3.1 MB', type: 'pdf' }
      ],
      expiresIn: '14 days',
      recoveryPossible: true,
    },
    {
      id: 't10',
      originalFolder: 'sent',
      subject: 'Question About Timesheet',
      recipients: [
        { name: 'Payroll Department', email: 'payroll@facility.com' }
      ],
      preview: 'I have a question about my timesheet for the period of May 15-31...',
      body: `Dear Payroll Department,

I have a question about my timesheet for the period of May 15-31.

Thank you,
John Doe`,
      deletedAt: '3 weeks ago',
      deletedDate: threeWeeksAgo,
      originalDate: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
      starred: false,
      labels: ['payroll', 'question', 'sent'],
      priority: 'normal',
      attachments: [
        { name: 'timesheet_may.xlsx', size: '0.5 MB', type: 'xlsx' }
      ],
      expiresIn: '7 days',
      recoveryPossible: true,
    },
    {
      id: 't11',
      originalFolder: 'drafts',
      subject: 'CME Course Registration Confirmation',
      recipients: [
        { name: 'Education Department', email: 'education@facility.com' }
      ],
      preview: 'I would like to register for the following CME courses...',
      body: `Dear Education Department,

I would like to register for CME courses.

Thank you,
John Doe`,
      deletedAt: '1 month ago',
      deletedDate: oneMonthAgo,
      originalDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      starred: false,
      labels: ['education', 'cme', 'registration', 'draft'],
      priority: 'low',
      expiresIn: 'Expired',
      recoveryPossible: false,
      autoDelete: true,
    },
    {
      id: 't12',
      originalFolder: 'archive',
      subject: 'System Maintenance Notification',
      sender: {
        name: 'IT Services',
        email: 'it@facility.com',
      },
      preview: 'The EHR system will be undergoing scheduled maintenance this weekend...',
      body: `Dear Staff,

The EHR system will undergo scheduled maintenance this weekend.

Thank you,
IT Services`,
      deletedAt: '1 month ago',
      deletedDate: oneMonthAgo,
      originalDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      starred: false,
      labels: ['maintenance', 'it', 'archive'],
      priority: 'normal',
      expiresIn: 'Expired',
      recoveryPossible: false,
      autoDelete: true,
    }
  ];
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export const Trash: React.FC<TrashProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  
  /* -------------------------------- State --------------------------------- */
  
  const [messages, setMessages] = useState<TrashMessage[]>(generateMockTrashMessages);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(messages[0]?.id || null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recentlyDeleted');
  const [timeRange, setTimeRange] = useState<TimeRangeType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  
  /* ---------------------------- Derived Data ------------------------------ */
  
  const selectedMessage = useMemo(
    () => messages.find(m => m.id === selectedMessageId) || null,
    [messages, selectedMessageId]
  );
  
  const filteredMessages = useMemo(() => {
    let filtered = [...messages];
    
    // Apply folder filter
    if (filter !== 'all') {
      if (filter === 'starred') {
        filtered = filtered.filter(m => m.starred);
      } else {
        filtered = filtered.filter(m => m.originalFolder === filter);
      }
    }
    
    // Apply time range filter
    const now = new Date();
    if (timeRange === 'today') {
      const today = new Date(now.setHours(0, 0, 0, 0));
      filtered = filtered.filter(m => m.deletedDate >= today);
    } else if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(m => m.deletedDate >= weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(m => m.deletedDate >= monthAgo);
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.subject.toLowerCase().includes(term) ||
        (m.sender?.name.toLowerCase().includes(term) || false) ||
        (m.sender?.email.toLowerCase().includes(term) || false) ||
        (m.recipients?.some(r => r.name.toLowerCase().includes(term) || r.email.toLowerCase().includes(term)) || false) ||
        m.body.toLowerCase().includes(term) ||
        m.preview.toLowerCase().includes(term) ||
        m.labels.some(l => l.toLowerCase().includes(term)) ||
        m.originalFolder.toLowerCase().includes(term)
      );
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      if (sort === 'recentlyDeleted') {
        return b.deletedDate.getTime() - a.deletedDate.getTime();
      } else if (sort === 'oldestDeleted') {
        return a.deletedDate.getTime() - b.deletedDate.getTime();
      } else if (sort === 'originalDate') {
        return b.originalDate.getTime() - a.originalDate.getTime();
      }
      return 0;
    });
    
    return filtered;
  }, [messages, filter, sort, timeRange, searchTerm]);
  
  const stats = useMemo(() => {
    const total = messages.length;
    const starred = messages.filter(m => m.starred).length;
    const inbox = messages.filter(m => m.originalFolder === 'inbox').length;
    const sent = messages.filter(m => m.originalFolder === 'sent').length;
    const drafts = messages.filter(m => m.originalFolder === 'drafts').length;
    const archive = messages.filter(m => m.originalFolder === 'archive').length;
    const expiringSoon = messages.filter(m => m.expiresIn && m.expiresIn !== 'Expired' && parseInt(m.expiresIn) <= 7).length;
    const expired = messages.filter(m => !m.recoveryPossible).length;
    
    return { total, starred, inbox, sent, drafts, archive, expiringSoon, expired };
  }, [messages]);
  
  /* ---------------------------- Action Handlers ---------------------------- */
  
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setMessages(generateMockTrashMessages());
      setIsRefreshing(false);
    }, 800);
  }, []);
  
  const handleRestore = useCallback((id: string) => {
    // Simulate restoring message
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selectedMessageId === id) {
      const nextMessage = filteredMessages.find(m => m.id !== id);
      setSelectedMessageId(nextMessage?.id || null);
    }
    // Remove from selected messages if in select mode
    if (selectedMessages.has(id)) {
      const newSelected = new Set(selectedMessages);
      newSelected.delete(id);
      setSelectedMessages(newSelected);
    }
    // Show success message (in a real app)
    console.log('Restored message:', id);
  }, [selectedMessageId, filteredMessages, selectedMessages]);
  
  const handleRestoreMultiple = useCallback(() => {
    // Restore all selected messages
    setMessages(prev => prev.filter(m => !selectedMessages.has(m.id)));
    setSelectedMessages(new Set());
    setSelectMode(false);
    setSelectedMessageId(null);
    console.log('Restored multiple messages:', Array.from(selectedMessages));
  }, [selectedMessages]);
  
  const handlePermanentDelete = useCallback((id: string) => {
    // Permanently delete message
    setMessages(prev => prev.filter(m => m.id !== id));
    setShowPermanentDeleteConfirm(null);
    if (selectedMessageId === id) {
      const nextMessage = filteredMessages.find(m => m.id !== id);
      setSelectedMessageId(nextMessage?.id || null);
    }
    // Remove from selected messages if in select mode
    if (selectedMessages.has(id)) {
      const newSelected = new Set(selectedMessages);
      newSelected.delete(id);
      setSelectedMessages(newSelected);
    }
    console.log('Permanently deleted message:', id);
  }, [selectedMessageId, filteredMessages, selectedMessages]);
  
  const handlePermanentDeleteMultiple = useCallback(() => {
    // Permanently delete all selected messages
    setMessages(prev => prev.filter(m => !selectedMessages.has(m.id)));
    setSelectedMessages(new Set());
    setSelectMode(false);
    setSelectedMessageId(null);
    setShowPermanentDeleteConfirm(null);
    console.log('Permanently deleted multiple messages:', Array.from(selectedMessages));
  }, [selectedMessages]);
  
  const handleEmptyTrash = useCallback(() => {
    // Empty entire trash
    setMessages([]);
    setSelectedMessageId(null);
    setSelectedMessages(new Set());
    setSelectMode(false);
    console.log('Trash emptied');
  }, []);
  
  const handleSelectMessage = useCallback((id: string) => {
    if (selectMode) {
      const newSelected = new Set(selectedMessages);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedMessages(newSelected);
    } else {
      setSelectedMessageId(id);
      if (window.innerWidth < 768) {
        setShowMobileList(false);
      }
    }
  }, [selectMode, selectedMessages]);
  
  const handleSelectAll = useCallback(() => {
    if (selectedMessages.size === filteredMessages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(filteredMessages.map(m => m.id)));
    }
  }, [filteredMessages, selectedMessages]);
  
  const handleBackToList = useCallback(() => {
    setShowMobileList(true);
  }, []);
  
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);
  
  const toggleSelectMode = useCallback(() => {
    setSelectMode(!selectMode);
    setSelectedMessages(new Set());
  }, [selectMode]);
  
  /* ----------------------------- Render Helpers ---------------------------- */
  
  const getFolderIcon = (folder: string) => {
    switch (folder) {
      case 'inbox':
        return <Mail className="w-3 h-3" />;
      case 'sent':
        return <Send className="w-3 h-3" />;
      case 'drafts':
        return <FileText className="w-3 h-3" />;
      case 'archive':
        return <Archive className="w-3 h-3" />;
      default:
        return <Mail className="w-3 h-3" />;
    }
  };
  
  const getFolderColor = (folder: string) => {
    switch (folder) {
      case 'inbox':
        return 'text-blue-500';
      case 'sent':
        return 'text-purple-500';
      case 'drafts':
        return 'text-amber-500';
      case 'archive':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };
  
  const getPriorityBadge = (priority: TrashMessage['priority']) => {
    switch (priority) {
      case 'high':
        return (
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
            isDark
              ? 'bg-red-900/20 text-red-300 border border-red-500/30'
              : 'bg-red-50 text-red-600 border border-red-200'
          )}>
            <AlertCircle className="w-3 h-3" />
            High
          </span>
        );
      case 'low':
        return (
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
            isDark
              ? 'bg-green-900/20 text-green-300 border border-green-500/30'
              : 'bg-green-50 text-green-600 border border-green-200'
          )}>
            <CheckCircle className="w-3 h-3" />
            Low
          </span>
        );
      default:
        return null;
    }
  };
  
  /* -------------------------------------------------------------------------- */
  /*                                 RENDER                                     */
  /* -------------------------------------------------------------------------- */
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative overflow-hidden rounded-xl border-2 mb-4 transition-all duration-300',
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-red-500/30 hover:border-red-500/50' 
            : 'bg-gradient-to-br from-white to-red-50/50 border-red-200 hover:border-red-400',
          'group'
        )}
      >
        {/* Background decoration */}
        <div className={cn(
          'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity',
          isDark ? 'bg-red-500/10 group-hover:opacity-100' : 'bg-red-500/5 group-hover:opacity-100',
          'opacity-0'
        )} />
        
        <div className="relative p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-3 rounded-xl transition-all duration-300',
                isDark 
                  ? 'bg-red-500/20 group-hover:bg-red-500/30 group-hover:scale-110' 
                  : 'bg-red-100 group-hover:bg-red-200 group-hover:scale-110'
              )}>
                <Trash2 className={cn(
                  'w-6 h-6',
                  isDark ? 'text-red-400' : 'text-red-600'
                )} />
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Trash
                  <span className={cn(
                    'text-sm font-medium px-2.5 py-1 rounded-full',
                    isDark ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-100 text-red-700 border border-red-200'
                  )}>
                    {stats.total} items
                  </span>
                </h2>
                <p className={cn(
                  'mt-1 text-sm flex items-center gap-2 flex-wrap',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {stats.expiringSoon > 0 && (
                    <span className="text-amber-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {stats.expiringSoon} expiring soon
                    </span>
                  )}
                  {stats.expired > 0 && (
                    <span className="text-gray-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {stats.expired} expired
                    </span>
                  )}
                  {stats.starred > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {stats.starred} starred
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleSelectMode}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                      'border-2 transition-all',
                      selectMode
                        ? isDark
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-red-600 border-red-400 text-white'
                        : isDark
                          ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
                      'cursor-pointer'
                    )}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">{selectMode ? 'Cancel' : 'Select'}</span>
                  </motion.button>
                  
                  {selectMode && selectedMessages.size > 0 && (
                    <>
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRestoreMultiple}
                        className={cn(
                          'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                          'border-2 transition-all',
                          isDark
                            ? 'bg-green-600 border-green-500 text-white hover:bg-green-700'
                            : 'bg-green-600 border-green-400 text-white hover:bg-green-700',
                          'cursor-pointer'
                        )}
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="hidden sm:inline">Restore ({selectedMessages.size})</span>
                      </motion.button>
                      
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowPermanentDeleteConfirm('multiple')}
                        className={cn(
                          'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                          'border-2 transition-all',
                          isDark
                            ? 'bg-red-600 border-red-500 text-white hover:bg-red-700'
                            : 'bg-red-600 border-red-400 text-white hover:bg-red-700',
                          'cursor-pointer'
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete ({selectedMessages.size})</span>
                      </motion.button>
                    </>
                  )}
                </>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                  'border-2 transition-all',
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
                  'disabled:opacity-50 cursor-pointer'
                )}
              >
                <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
                <span className="hidden sm:inline">Refresh</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                  'border-2 transition-all md:hidden',
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
                  'cursor-pointer'
                )}
              >
                <Filter className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Search and Filters - Desktop */}
      <div className="hidden md:block mb-4">
        <div className={cn(
          'relative overflow-hidden rounded-xl border-2 transition-all duration-300',
          isDark 
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50 hover:border-gray-600' 
            : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-gray-300'
        )}>
          <div className="p-3">
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <motion.div
                  className="absolute inset-0 rounded-lg z-0"
                  style={{
                    background: 'linear-gradient(90deg, #ef4444, #f97316, #f59e0b, #ef4444)',
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
                        ? 'text-red-500' 
                        : isDark 
                          ? 'text-gray-500' 
                          : 'text-gray-400'
                    )}
                  />
                  <input
                    type="text"
                    placeholder="Search trash..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={cn(
                      'w-full pl-10 pr-10 py-2 text-sm border-transparent',
                      'focus:outline-none focus:ring-0',
                      'transition-colors',
                      isDark
                        ? 'bg-gray-900 text-white placeholder-gray-500'
                        : 'bg-white text-gray-900 placeholder-gray-400'
                    )}
                  />
                  {searchTerm && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      onClick={handleClearSearch}
                      className={cn(
                        'absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full',
                        'transition-colors cursor-pointer',
                        isDark
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>
              
              {/* Filter Tabs - Original Folder */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilter('all')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    'border-2 cursor-pointer',
                    filter === 'all'
                      ? isDark
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-red-600 border-red-400 text-white'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                  )}
                >
                  All ({stats.total})
                </button>
                <button
                  onClick={() => setFilter('starred')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    'border-2 cursor-pointer flex items-center gap-1',
                    filter === 'starred'
                      ? isDark
                        ? 'bg-yellow-600 border-yellow-500 text-white'
                        : 'bg-yellow-500 border-yellow-400 text-white'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                  )}
                >
                  <Star className={cn(
                    'w-4 h-4',
                    filter === 'starred' ? 'fill-white' : ''
                  )} />
                  Starred ({stats.starred})
                </button>
                <button
                  onClick={() => setFilter('inbox')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    'border-2 cursor-pointer flex items-center gap-1',
                    filter === 'inbox'
                      ? isDark
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-blue-600 border-blue-400 text-white'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                  )}
                >
                  <Mail className="w-4 h-4" />
                  Inbox ({stats.inbox})
                </button>
                <button
                  onClick={() => setFilter('sent')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    'border-2 cursor-pointer flex items-center gap-1',
                    filter === 'sent'
                      ? isDark
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-purple-600 border-purple-400 text-white'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                  )}
                >
                  <Send className="w-4 h-4" />
                  Sent ({stats.sent})
                </button>
                <button
                  onClick={() => setFilter('drafts')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    'border-2 cursor-pointer flex items-center gap-1',
                    filter === 'drafts'
                      ? isDark
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-amber-600 border-amber-400 text-white'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                  )}
                >
                  <FileText className="w-4 h-4" />
                  Drafts ({stats.drafts})
                </button>
                <button
                  onClick={() => setFilter('archive')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    'border-2 cursor-pointer flex items-center gap-1',
                    filter === 'archive'
                      ? isDark
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'bg-green-600 border-green-400 text-white'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                  )}
                >
                  <Archive className="w-4 h-4" />
                  Archive ({stats.archive})
                </button>
              </div>
              
              {/* Time Range Filter */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRangeType)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm border-2 cursor-pointer',
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                )}
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
              
              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm border-2 cursor-pointer',
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                )}
              >
                <option value="recentlyDeleted">Recently deleted</option>
                <option value="oldestDeleted">Oldest deleted</option>
                <option value="originalDate">Original date</option>
              </select>
              
              {/* Empty Trash Button */}
              {messages.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPermanentDeleteConfirm('all')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2',
                    'border-2 transition-all',
                    isDark
                      ? 'bg-red-600 border-red-500 text-white hover:bg-red-700'
                      : 'bg-red-600 border-red-400 text-white hover:bg-red-700',
                    'cursor-pointer'
                  )}
                  title="Empty trash"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden xl:inline">Empty Trash</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Filters - Collapsible */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mb-4 overflow-hidden"
          >
            <div className={cn(
              'rounded-xl border-2 p-3',
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            )}>
              <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className={cn(
                    'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  )} />
                  <input
                    type="text"
                    placeholder="Search trash..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-10 py-2 rounded-lg text-sm border-2',
                      'focus:outline-none focus:ring-2 focus:ring-red-500',
                      isDark
                        ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
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
                
                {/* Filter Pills - Original Folder */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border-2',
                      filter === 'all'
                        ? isDark
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-red-600 border-red-400 text-white'
                        : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    All ({stats.total})
                  </button>
                  <button
                    onClick={() => setFilter('starred')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border-2 flex items-center gap-1',
                      filter === 'starred'
                        ? isDark
                          ? 'bg-yellow-600 border-yellow-500 text-white'
                          : 'bg-yellow-500 border-yellow-400 text-white'
                        : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    <Star className={cn(
                      'w-3 h-3',
                      filter === 'starred' ? 'fill-white' : ''
                    )} />
                    Starred ({stats.starred})
                  </button>
                  <button
                    onClick={() => setFilter('inbox')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border-2 flex items-center gap-1',
                      filter === 'inbox'
                        ? isDark
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-blue-600 border-blue-400 text-white'
                        : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    <Mail className="w-3 h-3" />
                    Inbox ({stats.inbox})
                  </button>
                  <button
                    onClick={() => setFilter('sent')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border-2 flex items-center gap-1',
                      filter === 'sent'
                        ? isDark
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-purple-600 border-purple-400 text-white'
                        : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    <Send className="w-3 h-3" />
                    Sent ({stats.sent})
                  </button>
                  <button
                    onClick={() => setFilter('drafts')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border-2 flex items-center gap-1',
                      filter === 'drafts'
                        ? isDark
                          ? 'bg-amber-600 border-amber-500 text-white'
                          : 'bg-amber-600 border-amber-400 text-white'
                        : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    <FileText className="w-3 h-3" />
                    Drafts ({stats.drafts})
                  </button>
                  <button
                    onClick={() => setFilter('archive')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border-2 flex items-center gap-1',
                      filter === 'archive'
                        ? isDark
                          ? 'bg-green-600 border-green-500 text-white'
                          : 'bg-green-600 border-green-400 text-white'
                        : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    <Archive className="w-3 h-3" />
                    Archive ({stats.archive})
                  </button>
                </div>
                
                {/* Time Range */}
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRangeType)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-sm border-2',
                    isDark
                      ? 'bg-gray-900 border-gray-700 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  )}
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                </select>
                
                {/* Sort */}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortType)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-sm border-2',
                    isDark
                      ? 'bg-gray-900 border-gray-700 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  )}
                >
                  <option value="recentlyDeleted">Recently deleted</option>
                  <option value="oldestDeleted">Oldest deleted</option>
                  <option value="originalDate">Original date</option>
                </select>
                
                {/* Empty Trash Button - Mobile */}
                {messages.length > 0 && (
                  <button
                    onClick={() => setShowPermanentDeleteConfirm('all')}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2',
                      'border-2',
                      isDark
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-red-600 border-red-400 text-white'
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                    Empty Trash
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <div className="flex-1 min-h-0 flex gap-4">
        {/* Message List - Left Side */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            'w-full md:w-96 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all',
            !showMobileList && 'hidden md:block',
            isDark
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50'
              : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
          )}
        >
          <div className="h-full flex flex-col">
            {/* List Header */}
            <div className={cn(
              'p-3 border-b-2 flex items-center justify-between',
              isDark ? 'border-gray-700' : 'border-gray-200'
            )}>
              <div className="flex items-center gap-2">
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={selectedMessages.size === filteredMessages.length && filteredMessages.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                )}
                <span className={cn(
                  'text-sm font-medium',
                  isDark ? 'text-gray-300' : 'text-gray-700'
                )}>
                  {selectMode 
                    ? `${selectedMessages.size} selected` 
                    : `${filteredMessages.length} items`
                  }
                </span>
              </div>
              {searchTerm && (
                <span className={cn(
                  'text-xs',
                  isDark ? 'text-gray-500' : 'text-gray-500'
                )}>
                  Filtered
                </span>
              )}
            </div>
            
            {/* Message Items */}
            <div className="flex-1 overflow-y-auto divide-y-2">
              <AnimatePresence mode="popLayout">
                {filteredMessages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 text-center"
                  >
                    <Trash2 className={cn(
                      'w-12 h-12 mx-auto mb-3',
                      isDark ? 'text-gray-700' : 'text-gray-300'
                    )} />
                    <p className={cn(
                      'text-sm font-medium',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Trash is empty
                    </p>
                    <p className={cn(
                      'text-xs mt-1',
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    )}>
                      {searchTerm ? 'No items match your search' : 'Deleted messages appear here'}
                    </p>
                  </motion.div>
                ) : (
                  filteredMessages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleSelectMessage(message.id)}
                      className={cn(
                        'p-4 cursor-pointer transition-all relative group',
                        selectedMessageId === message.id && !selectMode
                          ? isDark
                            ? 'bg-red-900/20 border-l-4 border-red-500'
                            : 'bg-red-50 border-l-4 border-red-500'
                          : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50',
                        !message.recoveryPossible && 'opacity-50',
                        selectMode && selectedMessages.has(message.id) && (
                          isDark
                            ? 'bg-red-900/10'
                            : 'bg-red-50/50'
                        ),
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      )}
                    >
                      {/* Selection checkbox */}
                      {selectMode && (
                        <div 
                          className="absolute left-2 top-1/2 -translate-y-1/2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedMessages.has(message.id)}
                            onChange={() => handleSelectMessage(message.id)}
                            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                          />
                        </div>
                      )}
                      
                      {/* Sender/Recipient and Deleted Time */}
                      <div className={cn(
                        "flex items-start justify-between gap-2 mb-2",
                        selectMode && "pl-8"
                      )}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            isDark ? 'bg-gray-700' : 'bg-gray-200'
                          )}>
                            {message.sender ? (
                              <User className={cn(
                                'w-4 h-4',
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              )} />
                            ) : (
                              <Users className={cn(
                                'w-4 h-4',
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              )} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              'text-sm font-medium truncate',
                              isDark ? 'text-white' : 'text-gray-900'
                            )}>
                              {message.sender ? message.sender.name : message.recipients?.[0]?.name || 'Unknown'}
                            </p>
                            <p className={cn(
                              'text-xs truncate flex items-center gap-1',
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              {getFolderIcon(message.originalFolder)}
                              <span className={getFolderColor(message.originalFolder)}>
                                {message.originalFolder}
                              </span>
                              <span className="text-gray-400">
                                {message.sender ? ' →' : ' from:'}
                              </span>
                              <span className="truncate">
                                {message.sender ? message.sender.email : message.recipients?.[0]?.email}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!message.recoveryPossible && (
                            <AlertTriangle className="w-3 h-3 text-gray-500" />
                          )}
                          {message.starred && (
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          )}
                          <span className={cn(
                            'text-xs whitespace-nowrap',
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          )}>
                            {message.deletedAt}
                          </span>
                        </div>
                      </div>
                      
                      {/* Subject */}
                      <div className={cn(
                        "flex items-start gap-2 mb-1",
                        selectMode && "pl-8"
                      )}>
                        <p className={cn(
                          'text-sm truncate flex-1 font-medium',
                          isDark ? 'text-white' : 'text-gray-900'
                        )}>
                          {message.subject}
                        </p>
                      </div>
                      
                      {/* Preview */}
                      <p className={cn(
                        'text-xs truncate mb-2',
                        selectMode && "pl-8",
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        {message.preview}
                      </p>
                      
                      {/* Labels and Expiry */}
                      <div className={cn(
                        "flex flex-wrap items-center gap-1",
                        selectMode && "pl-8"
                      )}>
                        {message.labels.map(label => (
                          <span
                            key={label}
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                              isDark
                                ? 'bg-gray-700 text-gray-300 border border-gray-600'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            )}
                          >
                            <Tag className="w-3 h-3" />
                            {label}
                          </span>
                        ))}
                        {message.attachments && message.attachments.length > 0 && (
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                            isDark
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-100 text-gray-700'
                          )}>
                            <Paperclip className="w-3 h-3" />
                            {message.attachments.length}
                          </span>
                        )}
                        {message.expiresIn && (
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                            message.expiresIn === 'Expired'
                              ? isDark
                                ? 'bg-gray-700 text-gray-500'
                                : 'bg-gray-100 text-gray-500'
                              : parseInt(message.expiresIn) <= 7
                                ? isDark
                                  ? 'bg-amber-900/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-amber-50 text-amber-600 border border-amber-200'
                                : isDark
                                  ? 'bg-gray-700 text-gray-300'
                                  : 'bg-gray-100 text-gray-700'
                          )}>
                            <Clock className="w-3 h-3" />
                            {message.expiresIn === 'Expired' ? 'Expired' : `${message.expiresIn} left`}
                          </span>
                        )}
                      </div>
                      
                      {/* Action buttons - appear on hover */}
                      {!selectMode && message.recoveryPossible && (
                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(message.id);
                            }}
                            className={cn(
                              'p-1.5 rounded-full transition-colors',
                              isDark
                                ? 'hover:bg-green-600/20 text-green-400'
                                : 'hover:bg-green-100 text-green-600'
                            )}
                            title="Restore"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPermanentDeleteConfirm(message.id);
                            }}
                            className={cn(
                              'p-1.5 rounded-full transition-colors',
                              isDark
                                ? 'hover:bg-red-600/20 text-red-400'
                                : 'hover:bg-red-100 text-red-600'
                            )}
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
        
        {/* Message Detail - Right Side */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            'flex-1 min-w-0 overflow-hidden rounded-xl border-2 transition-all',
            showMobileList ? 'hidden md:block' : 'block',
            isDark
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50'
              : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200'
          )}
        >
          {selectedMessage && !selectMode ? (
            <div className="h-full flex flex-col">
              {/* Detail Header with Actions */}
              <div className={cn(
                'p-4 border-b-2 flex items-center justify-between',
                isDark ? 'border-gray-700' : 'border-gray-200'
              )}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBackToList}
                    className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-semibold truncate max-w-md">
                    {selectedMessage.subject}
                  </h3>
                  {selectedMessage.priority === 'high' && getPriorityBadge('high')}
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1',
                    getFolderColor(selectedMessage.originalFolder),
                    isDark ? 'bg-opacity-20' : 'bg-opacity-10'
                  )}>
                    {getFolderIcon(selectedMessage.originalFolder)}
                    {selectedMessage.originalFolder}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedMessage.recoveryPossible ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRestore(selectedMessage.id)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2',
                          isDark
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white',
                          'cursor-pointer'
                        )}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowPermanentDeleteConfirm(selectedMessage.id)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2',
                          isDark
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white',
                          'cursor-pointer'
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Permanently
                      </motion.button>
                    </>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowPermanentDeleteConfirm(selectedMessage.id)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2',
                        isDark
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white',
                        'cursor-pointer'
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Permanently
                    </motion.button>
                  )}
                </div>
              </div>
              
              {/* Message Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Expiry Warning */}
                {selectedMessage.expiresIn === 'Expired' && (
                  <div className={cn(
                    'mb-4 p-3 rounded-lg flex items-center gap-2',
                    isDark
                      ? 'bg-gray-700 text-gray-300 border border-gray-600'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  )}>
                    <AlertTriangle className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">This message has expired</p>
                      <p className="text-sm">Expired messages cannot be restored and will be automatically removed.</p>
                    </div>
                  </div>
                )}
                
                {selectedMessage.expiresIn && selectedMessage.expiresIn !== 'Expired' && parseInt(selectedMessage.expiresIn) <= 7 && (
                  <div className={cn(
                    'mb-4 p-3 rounded-lg flex items-center gap-2',
                    isDark
                      ? 'bg-amber-900/20 text-amber-300 border border-amber-500/30'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  )}>
                    <Clock className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Expiring soon</p>
                      <p className="text-sm">This message will be permanently deleted in {selectedMessage.expiresIn}.</p>
                    </div>
                  </div>
                )}
                
                {/* Deletion Info */}
                <div className={cn(
                  'mb-4 p-3 rounded-lg flex items-center gap-2',
                  isDark
                    ? 'bg-gray-700/50 text-gray-300 border border-gray-600'
                    : 'bg-gray-50 text-gray-700 border border-gray-200'
                )}>
                  <Info className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Deleted {selectedMessage.deletedAt}</p>
                    <p className="text-sm">
                      Originally from {selectedMessage.originalFolder} folder • 
                      Original date: {selectedMessage.originalDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {/* Sender/Recipient Info */}
                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center',
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    )}>
                      {selectedMessage.sender ? (
                        <User className={cn(
                          'w-6 h-6',
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        )} />
                      ) : (
                        <Users className={cn(
                          'w-6 h-6',
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        )} />
                      )}
                    </div>
                    <div className="flex-1">
                      {selectedMessage.sender ? (
                        <>
                          <h4 className={cn(
                            'text-lg font-semibold',
                            isDark ? 'text-white' : 'text-gray-900'
                          )}>
                            From: {selectedMessage.sender.name}
                          </h4>
                          <p className={cn(
                            'text-sm',
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            {selectedMessage.sender.email}
                          </p>
                          {selectedMessage.recipients && selectedMessage.recipients.length > 0 && (
                            <p className={cn(
                              'text-xs mt-1',
                              isDark ? 'text-gray-500' : 'text-gray-500'
                            )}>
                              To: {selectedMessage.recipients.map(r => r.name).join(', ')}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <h4 className={cn(
                            'text-lg font-semibold',
                            isDark ? 'text-white' : 'text-gray-900'
                          )}>
                            To: {selectedMessage.recipients?.[0]?.name || 'Unknown'}
                          </h4>
                          <p className={cn(
                            'text-sm',
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            {selectedMessage.recipients?.[0]?.email || ''}
                          </p>
                          {selectedMessage.recipients && selectedMessage.recipients.length > 1 && (
                            <p className={cn(
                              'text-xs mt-1',
                              isDark ? 'text-gray-500' : 'text-gray-500'
                            )}>
                              +{selectedMessage.recipients.length - 1} more recipients
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Message Body */}
                <div className={cn(
                  'prose max-w-none mb-8 whitespace-pre-wrap',
                  isDark ? 'prose-invert' : ''
                )}>
                  {selectedMessage.body}
                </div>
                
                {/* Attachments */}
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="mt-6">
                    <h5 className={cn(
                      'text-sm font-medium mb-3 flex items-center gap-2',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      <Paperclip className="w-4 h-4" />
                      Attachments ({selectedMessage.attachments.length})
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedMessage.attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'p-3 rounded-lg border-2 flex items-center gap-3',
                            isDark
                              ? 'bg-gray-700/50 border-gray-600'
                              : 'bg-gray-50 border-gray-200'
                          )}
                        >
                          <div className={cn(
                            'p-2 rounded-lg',
                            isDark ? 'bg-gray-600' : 'bg-white'
                          )}>
                            <Paperclip className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-sm font-medium truncate',
                              isDark ? 'text-white' : 'text-gray-900'
                            )}>
                              {att.name}
                            </p>
                            <p className={cn(
                              'text-xs',
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              {att.size}
                            </p>
                          </div>
                          <button
                            onClick={() => {/* Simulate download */}}
                            className={cn(
                              'p-2 rounded-lg transition-colors cursor-pointer',
                              isDark
                                ? 'hover:bg-gray-600 text-gray-300'
                                : 'hover:bg-gray-200 text-gray-600'
                            )}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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
                <Trash2 className={cn(
                  'w-16 h-16 mx-auto mb-4',
                  isDark ? 'text-gray-700' : 'text-gray-300'
                )} />
                <h3 className={cn(
                  'text-lg font-semibold mb-2',
                  isDark ? 'text-white' : 'text-gray-900'
                )}>
                  {selectMode ? 'Select messages to delete' : 'No message selected'}
                </h3>
                <p className={cn(
                  'text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {selectMode 
                    ? 'Choose messages to restore or permanently delete'
                    : 'Select a deleted message from the list to view it'
                  }
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Permanent Delete Confirmation Modal */}
      <AnimatePresence>
        {showPermanentDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPermanentDeleteConfirm(null)}
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
                  isDark ? 'bg-red-900/20' : 'bg-red-100'
                )}>
                  <AlertTriangle className={cn(
                    'w-6 h-6',
                    isDark ? 'text-red-400' : 'text-red-600'
                  )} />
                </div>
                <h3 className="text-lg font-semibold">Permanently Delete?</h3>
              </div>
              
              <p className={cn(
                'mb-6',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}>
                {showPermanentDeleteConfirm === 'all' && 'Are you sure you want to empty the trash? All messages will be permanently deleted and cannot be recovered.'}
                {showPermanentDeleteConfirm === 'multiple' && `Are you sure you want to permanently delete ${selectedMessages.size} message${selectedMessages.size > 1 ? 's' : ''}? This action cannot be undone.`}
                {showPermanentDeleteConfirm !== 'all' && showPermanentDeleteConfirm !== 'multiple' && 'Are you sure you want to permanently delete this message? This action cannot be undone.'}
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowPermanentDeleteConfirm(null)}
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
                  onClick={() => {
                    if (showPermanentDeleteConfirm === 'all') {
                      handleEmptyTrash();
                    } else if (showPermanentDeleteConfirm === 'multiple') {
                      handlePermanentDeleteMultiple();
                    } else {
                      handlePermanentDelete(showPermanentDeleteConfirm);
                    }
                  }}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium',
                    isDark
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white',
                    'cursor-pointer'
                  )}
                >
                  Delete Permanently
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