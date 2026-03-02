/**
 * ============================================================================
 * SENT COMPONENT
 * ============================================================================
 * 
 * Sent component for displaying sent messages with left sidebar list and right
 * detail view with actions. Uses mock data for demonstration.
 * 
 * @component Sent
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Star,
  Trash2,
  Archive,
  AlertCircle,
  CheckCircle,
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

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface SentProps {
  theme: 'light' | 'dark';
}

interface SentMessage {
  id: string;
  subject: string;
  recipients: Array<{
    name: string;
    email: string;
  }>;
  preview: string;
  body: string;
  timestamp: string;
  date: Date;
  read: boolean;
  starred: boolean;
  archived: boolean;
  deleted: boolean;
  labels: string[];
  attachments?: Array<{
    name: string;
    size: string;
    type: string;
  }>;
  priority: 'low' | 'normal' | 'high';
  cc?: Array<{
    name: string;
    email: string;
  }>;
  bcc?: Array<{
    name: string;
    email: string;
  }>;
  readReceipt?: boolean;
  deliveryStatus: 'sent' | 'delivered' | 'failed';
}

type FilterType = 'all' | 'starred' | 'archived' | 'failed';
type SortType = 'newest' | 'oldest';

/* -------------------------------------------------------------------------- */
/*                                 MOCK DATA                                  */
/* -------------------------------------------------------------------------- */

const generateMockSentMessages = (): SentMessage[] => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  return [
    {
      id: 's1',
      subject: 'Credentialing Documents Submitted',
      recipients: [
        { name: 'Sarah Johnson', email: 'sarah.johnson@hospital.org' }
      ],
      cc: [
        { name: 'Credentialing Dept', email: 'credentialing@hospital.org' }
      ],
      preview: 'I have submitted all required credentialing documents for your review...',
      body: `Dear Sarah,

I have submitted all required credentialing documents for your review. Please find attached:

- Current license (updated)
- DEA certificate
- Board certifications
- Malpractice insurance

Please let me know if you need any additional information or documents.

Best regards,
John Doe`,
      timestamp: '2 hours ago',
      date: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      read: true,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['credentialing', 'documents'],
      priority: 'high',
      attachments: [
        { name: 'license_2025.pdf', size: '1.2 MB', type: 'pdf' },
        { name: 'dea_certificate.pdf', size: '0.8 MB', type: 'pdf' }
      ],
      deliveryStatus: 'delivered',
      readReceipt: true,
    },
    {
      id: 's2',
      subject: 'Re: Facility Policy Update - Effective Immediately',
      recipients: [
        { name: 'Administration', email: 'admin@facility.com' }
      ],
      preview: 'Thank you for the policy update. I have reviewed and acknowledged the changes...',
      body: `Dear Administration,

Thank you for the policy update. I have reviewed and acknowledged the changes to:

1. Two-factor authentication requirements
2. Patient consent forms
3. Breach notification procedures

I have completed the required training and acknowledged receipt in the system.

Best regards,
John Doe`,
      timestamp: '5 hours ago',
      date: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      read: true,
      starred: true,
      archived: false,
      deleted: false,
      labels: ['policy', 'acknowledged'],
      priority: 'high',
      deliveryStatus: 'delivered',
    },
    {
      id: 's3',
      subject: 'Availability for Monthly Staff Meeting',
      recipients: [
        { name: 'Dr. Michael Chen', email: 'm.chen@facility.com' }
      ],
      preview: 'I confirm my availability for the monthly staff meeting on June 15th...',
      body: `Dear Dr. Chen,

I confirm my availability for the monthly staff meeting on June 15th at 2:00 PM.

I will attend in person at Conference Room A.

Looking forward to the meeting.

Best regards,
John Doe`,
      timestamp: 'yesterday',
      date: yesterday,
      read: true,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['meeting', 'rsvp'],
      priority: 'normal',
      deliveryStatus: 'delivered',
    },
    {
      id: 's4',
      subject: 'Question About Timesheet',
      recipients: [
        { name: 'Payroll Department', email: 'payroll@facility.com' }
      ],
      preview: 'I have a question about my timesheet for the period of May 15-31...',
      body: `Dear Payroll Department,

I have a question about my timesheet for the period of May 15-31.

I noticed that my overtime hours for May 20th were not included. Could you please verify?

Attached is my timesheet for reference.

Thank you,
John Doe`,
      timestamp: 'yesterday',
      date: yesterday,
      read: false,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['payroll', 'question'],
      priority: 'normal',
      attachments: [
        { name: 'timesheet_may.xlsx', size: '0.5 MB', type: 'xlsx' }
      ],
      deliveryStatus: 'delivered',
    },
    {
      id: 's5',
      subject: 'CME Course Registration Confirmation',
      recipients: [
        { name: 'Education Department', email: 'education@facility.com' }
      ],
      preview: 'I would like to register for the following CME courses...',
      body: `Dear Education Department,

I would like to register for the following CME courses:

1. "Advances in Cardiac Care" - 8 credits
2. "Patient Safety Protocols" - 4 credits

Please confirm my registration and provide access details.

Thank you,
John Doe`,
      timestamp: '2 days ago',
      date: twoDaysAgo,
      read: true,
      starred: true,
      archived: false,
      deleted: false,
      labels: ['education', 'cme', 'registration'],
      priority: 'low',
      deliveryStatus: 'delivered',
    },
    {
      id: 's6',
      subject: 'IT Support Request: Login Issue',
      recipients: [
        { name: 'IT Services', email: 'it@facility.com' }
      ],
      preview: 'I am experiencing issues logging into the EHR system...',
      body: `Dear IT Services,

I am experiencing issues logging into the EHR system from my workstation. The error message says "Authentication failed" even though I'm using the correct credentials.

I've already tried:
- Clearing browser cache
- Resetting password
- Using a different browser

Please assist.

Workstation: WS-342
Employee ID: EMP-12345

Thank you,
John Doe`,
      timestamp: '3 days ago',
      date: threeDaysAgo,
      read: true,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['it', 'support'],
      priority: 'high',
      deliveryStatus: 'delivered',
    },
    {
      id: 's7',
      subject: 'Completed Self-Assessment Form',
      recipients: [
        { name: 'HR Department', email: 'hr@facility.com' }
      ],
      cc: [
        { name: 'Lisa Thompson', email: 'l.thompson@facility.com' }
      ],
      preview: 'Please find attached my completed self-assessment form for the quarterly review...',
      body: `Dear HR Department,

Please find attached my completed self-assessment form for the quarterly review scheduled for June 12th.

I have completed all sections and am looking forward to discussing my performance.

Regards,
John Doe`,
      timestamp: '4 days ago',
      date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      read: true,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['hr', 'review'],
      priority: 'high',
      attachments: [
        { name: 'self_assessment_john_doe.pdf', size: '1.1 MB', type: 'pdf' }
      ],
      deliveryStatus: 'delivered',
    },
    {
      id: 's8',
      subject: 'Welcome and Introduction',
      recipients: [
        { name: 'All Staff', email: 'all-staff@facility.com' }
      ],
      preview: 'Hello everyone, I wanted to introduce myself as the new staff member...',
      body: `Hello everyone,

I wanted to introduce myself as the new staff member joining the team. My name is John Doe and I'll be working as a healthcare professional in the facility.

A bit about me:
- 5 years of experience in healthcare
- Specialized in patient care
- Excited to contribute to the team

Looking forward to meeting everyone!

Best regards,
John Doe`,
      timestamp: '5 days ago',
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      read: true,
      starred: false,
      archived: true,
      deleted: false,
      labels: ['introduction'],
      priority: 'normal',
      deliveryStatus: 'delivered',
    },
    {
      id: 's9',
      subject: 'Security Alert Acknowledgment',
      recipients: [
        { name: 'Security Team', email: 'security@facility.com' }
      ],
      preview: 'I acknowledge the security alert regarding the new login...',
      body: `Dear Security Team,

I acknowledge the security alert regarding the new login from an unrecognized device. This was me logging in from my personal device.

Device: iPhone 15 Pro
Location: Chicago, IL

Please let me know if you need any additional information.

Stay safe,
John Doe`,
      timestamp: '1 week ago',
      date: lastWeek,
      read: true,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['security', 'acknowledgment'],
      priority: 'high',
      deliveryStatus: 'delivered',
    },
    {
      id: 's10',
      subject: 'Holiday Time Off Request',
      recipients: [
        { name: 'Operations', email: 'ops@facility.com' }
      ],
      preview: 'I would like to request time off for Independence Day...',
      body: `Dear Operations,

I would like to request time off for Independence Day (July 4th, 2025).

Request details:
- Date: July 4th, 2025
- Type: Holiday
- Coverage: I have arranged coverage with my team

Please let me know if this request can be approved.

Thank you,
John Doe`,
      timestamp: '1 week ago',
      date: lastWeek,
      read: false,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['holiday', 'request'],
      priority: 'normal',
      deliveryStatus: 'delivered',
    },
    {
      id: 's11',
      subject: 'Urgent: System Access Required',
      recipients: [
        { name: 'IT Services', email: 'it@facility.com' }
      ],
      preview: 'I need immediate access to the patient records system for an emergency...',
      body: `Dear IT Services,

I need immediate access to the patient records system for an emergency case. My access seems to be restricted.

Patient ID: EMERGENCY-789
Time: Immediate

Please grant temporary access or contact me urgently.

Thank you,
John Doe`,
      timestamp: '3 days ago',
      date: threeDaysAgo,
      read: false,
      starred: true,
      archived: false,
      deleted: false,
      labels: ['urgent', 'it', 'emergency'],
      priority: 'high',
      deliveryStatus: 'failed',
    },
    {
      id: 's12',
      subject: 'Schedule Change Request',
      recipients: [
        { name: 'Scheduling Department', email: 'scheduling@facility.com' }
      ],
      preview: 'I would like to request a schedule change for next week...',
      body: `Dear Scheduling Department,

I would like to request a schedule change for next week due to a personal appointment.

Current shift: Wednesday, June 12th - 7:00 AM to 3:00 PM
Requested change: Thursday, June 13th - 3:00 PM to 11:00 PM

I have already discussed this with my supervisor.

Thank you,
John Doe`,
      timestamp: '2 days ago',
      date: twoDaysAgo,
      read: false,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['schedule', 'request'],
      priority: 'normal',
      deliveryStatus: 'failed',
    }
  ];
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export const Sent: React.FC<SentProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  
  /* -------------------------------- State --------------------------------- */
  
  const [messages, setMessages] = useState<SentMessage[]>(generateMockSentMessages);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(messages[0]?.id || null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  /* ---------------------------- Derived Data ------------------------------ */
  
  const selectedMessage = useMemo(
    () => messages.find(m => m.id === selectedMessageId) || null,
    [messages, selectedMessageId]
  );
  
  const filteredMessages = useMemo(() => {
    let filtered = [...messages];
    
    // Apply filter
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
      case 'all':
      default:
        filtered = filtered.filter(m => !m.deleted);
        break;
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.subject.toLowerCase().includes(term) ||
        m.recipients.some(r => r.name.toLowerCase().includes(term) || r.email.toLowerCase().includes(term)) ||
        m.body.toLowerCase().includes(term) ||
        m.preview.toLowerCase().includes(term)
      );
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      if (sort === 'newest') {
        return b.date.getTime() - a.date.getTime();
      } else {
        return a.date.getTime() - b.date.getTime();
      }
    });
    
    return filtered;
  }, [messages, filter, searchTerm, sort]);
  
  const stats = useMemo(() => {
    const total = messages.filter(m => !m.deleted).length;
    const starred = messages.filter(m => m.starred && !m.deleted).length;
    const archived = messages.filter(m => m.archived && !m.deleted).length;
    const failed = messages.filter(m => m.deliveryStatus === 'failed' && !m.deleted).length;
    
    return { total, starred, archived, failed };
  }, [messages]);
  
  /* ---------------------------- Action Handlers ---------------------------- */
  
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setMessages(generateMockSentMessages());
      setIsRefreshing(false);
    }, 800);
  }, []);
  
  const handleToggleStar = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMessages(prev => 
      prev.map(m => 
        m.id === id ? { ...m, starred: !m.starred } : m
      )
    );
  }, []);
  
  const handleArchive = useCallback((id: string) => {
    setMessages(prev => 
      prev.map(m => 
        m.id === id ? { ...m, archived: true } : m
      )
    );
    if (selectedMessageId === id) {
      const nextMessage = filteredMessages.find(m => m.id !== id);
      setSelectedMessageId(nextMessage?.id || null);
    }
  }, [selectedMessageId, filteredMessages]);
  
  const handleUnarchive = useCallback((id: string) => {
    setMessages(prev => 
      prev.map(m => 
        m.id === id ? { ...m, archived: false } : m
      )
    );
  }, []);
  
  const handleDelete = useCallback((id: string) => {
    setMessages(prev => 
      prev.map(m => 
        m.id === id ? { ...m, deleted: true } : m
      )
    );
    if (selectedMessageId === id) {
      const nextMessage = filteredMessages.find(m => m.id !== id);
      setSelectedMessageId(nextMessage?.id || null);
    }
  }, [selectedMessageId, filteredMessages]);
  
  const handleRestore = useCallback((id: string) => {
    setMessages(prev => 
      prev.map(m => 
        m.id === id ? { ...m, deleted: false } : m
      )
    );
  }, []);
  
  const handleResend = useCallback((id: string) => {
    // Simulate resending failed message
    setMessages(prev => 
      prev.map(m => 
        m.id === id ? { ...m, deliveryStatus: 'sent' } : m
      )
    );
    // Show some feedback (in a real app, this would trigger an API call)
    console.log('Resending message:', id);
  }, []);
  
  const handleSelectMessage = useCallback((id: string) => {
    setSelectedMessageId(id);
    if (window.innerWidth < 768) {
      setShowMobileList(false);
    }
  }, []);
  
  const handleBackToList = useCallback(() => {
    setShowMobileList(true);
  }, []);
  
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);
  
  /* ----------------------------- Render Helpers ---------------------------- */
  
  const getPriorityBadge = (priority: SentMessage['priority']) => {
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
  
  const getDeliveryStatusIcon = (status: SentMessage['deliveryStatus']) => {
    switch (status) {
      case 'sent':
        return <Send className="w-3 h-3 text-blue-500" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
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
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/30 hover:border-purple-500/50' 
            : 'bg-gradient-to-br from-white to-purple-50/50 border-purple-200 hover:border-purple-400',
          'group'
        )}
      >
        {/* Background decoration */}
        <div className={cn(
          'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity',
          isDark ? 'bg-purple-500/10 group-hover:opacity-100' : 'bg-purple-500/5 group-hover:opacity-100',
          'opacity-0'
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
                <Send className={cn(
                  'w-6 h-6',
                  isDark ? 'text-purple-400' : 'text-purple-600'
                )} />
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Sent Messages
                  <span className={cn(
                    'text-sm font-medium px-2.5 py-1 rounded-full',
                    isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-700 border border-purple-200'
                  )}>
                    {stats.total} sent
                  </span>
                </h2>
                <p className={cn(
                  'mt-1 text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {stats.failed > 0 && (
                    <span className="text-red-500 mr-2">{stats.failed} failed</span>
                  )}
                  {stats.starred} starred • {stats.archived} archived
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
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
                    background: 'linear-gradient(90deg, #a855f7, #ec4899, #8b5cf6, #a855f7)',
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
                        ? 'text-purple-500' 
                        : isDark 
                          ? 'text-gray-500' 
                          : 'text-gray-400'
                    )}
                  />
                  <input
                    type="text"
                    placeholder="Search sent messages..."
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
              
              {/* Filter Tabs */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilter('all')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    'border-2 cursor-pointer',
                    filter === 'all'
                      ? isDark
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-purple-600 border-purple-400 text-white'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  All ({stats.total})
                </button>
                <button
                  onClick={() => setFilter('starred')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    'border-2 cursor-pointer',
                    filter === 'starred'
                      ? isDark
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-purple-600 border-purple-400 text-white'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  Starred ({stats.starred})
                </button>
                <button
                  onClick={() => setFilter('archived')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    'border-2 cursor-pointer',
                    filter === 'archived'
                      ? isDark
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-purple-600 border-purple-400 text-white'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  Archived ({stats.archived})
                </button>
                <button
                  onClick={() => setFilter('failed')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    'border-2 cursor-pointer',
                    filter === 'failed'
                      ? isDark
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-red-600 border-red-400 text-white'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  Failed ({stats.failed})
                </button>
              </div>
              
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
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
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
                    placeholder="Search sent messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-10 py-2 rounded-lg text-sm border-2',
                      'focus:outline-none focus:ring-2 focus:ring-purple-500',
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
                
                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border-2',
                      filter === 'all'
                        ? isDark
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-purple-600 border-purple-400 text-white'
                        : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                    )}
                  >
                    All ({stats.total})
                  </button>
                  <button
                    onClick={() => setFilter('starred')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border-2',
                      filter === 'starred'
                        ? isDark
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-purple-600 border-purple-400 text-white'
                        : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                    )}
                  >
                    Starred ({stats.starred})
                  </button>
                  <button
                    onClick={() => setFilter('archived')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border-2',
                      filter === 'archived'
                        ? isDark
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-purple-600 border-purple-400 text-white'
                        : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                    )}
                  >
                    Archived ({stats.archived})
                  </button>
                  <button
                    onClick={() => setFilter('failed')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border-2',
                      filter === 'failed'
                        ? isDark
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-red-600 border-red-400 text-white'
                        : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                    )}
                  >
                    Failed ({stats.failed})
                  </button>
                </div>
                
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
              <span className={cn(
                'text-sm font-medium',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}>
                {filteredMessages.length} messages
              </span>
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
                    <Send className={cn(
                      'w-12 h-12 mx-auto mb-3',
                      isDark ? 'text-gray-700' : 'text-gray-300'
                    )} />
                    <p className={cn(
                      'text-sm font-medium',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      No sent messages found
                    </p>
                    <p className={cn(
                      'text-xs mt-1',
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    )}>
                      {searchTerm ? 'Try adjusting your search' : 'Your sent folder is empty'}
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
                        selectedMessageId === message.id
                          ? isDark
                            ? 'bg-purple-900/20 border-l-4 border-purple-500'
                            : 'bg-purple-50 border-l-4 border-purple-500'
                          : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50',
                        message.deliveryStatus === 'failed' && (
                          isDark
                            ? 'bg-red-900/10 border-l-4 border-red-500'
                            : 'bg-red-50/50 border-l-4 border-red-500'
                        ),
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      )}
                    >
                      {/* Recipients and Date */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            isDark ? 'bg-gray-700' : 'bg-gray-200'
                          )}>
                            <Users className={cn(
                              'w-4 h-4',
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            )} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              'text-sm font-medium truncate',
                              isDark ? 'text-white' : 'text-gray-900'
                            )}>
                              To: {message.recipients.map(r => r.name).join(', ')}
                            </p>
                            <p className={cn(
                              'text-xs truncate',
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              {message.recipients.map(r => r.email).join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {getDeliveryStatusIcon(message.deliveryStatus)}
                          <span className={cn(
                            'text-xs whitespace-nowrap',
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          )}>
                            {message.timestamp}
                          </span>
                        </div>
                      </div>
                      
                      {/* Subject */}
                      <div className="flex items-start gap-2 mb-1">
                        {message.readReceipt && message.read && (
                          <CheckCheck className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                        )}
                        {message.readReceipt && !message.read && (
                          <CheckCheck className="w-3 h-3 text-gray-400 mt-1 flex-shrink-0" />
                        )}
                        <p className={cn(
                          'text-sm truncate flex-1',
                          isDark ? 'text-white' : 'text-gray-900'
                        )}>
                          {message.subject}
                        </p>
                      </div>
                      
                      {/* Preview */}
                      <p className={cn(
                        'text-xs truncate mb-2',
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        {message.preview}
                      </p>
                      
                      {/* Labels and Status */}
                      <div className="flex flex-wrap items-center gap-1">
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
                        {message.attachments && (
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
                        {message.deliveryStatus === 'failed' && (
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                            isDark
                              ? 'bg-red-900/20 text-red-300 border border-red-500/30'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          )}>
                            <AlertCircle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                        {message.cc && message.cc.length > 0 && (
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                            isDark
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-100 text-gray-700'
                          )}>
                            <Users className="w-3 h-3" />
                            CC: {message.cc.length}
                          </span>
                        )}
                      </div>
                      
                      {/* Star button */}
                      <button
                        onClick={(e) => handleToggleStar(message.id, e)}
                        className={cn(
                          'absolute top-4 right-4 p-1 rounded-full transition-all',
                          'opacity-0 group-hover:opacity-100',
                          message.starred && 'opacity-100',
                          isDark
                            ? 'hover:bg-gray-600'
                            : 'hover:bg-gray-200'
                        )}
                      >
                        <Star
                          className={cn(
                            'w-4 h-4',
                            message.starred
                              ? 'fill-yellow-400 text-yellow-400'
                              : isDark
                                ? 'text-gray-500'
                                : 'text-gray-400'
                          )}
                        />
                      </button>
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
          {selectedMessage ? (
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
                  {selectedMessage.priority === 'high' && (
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      isDark
                        ? 'bg-red-900/20 text-red-300 border border-red-500/30'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    )}>
                      High Priority
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleStar(selectedMessage.id)}
                    className={cn(
                      'p-2 rounded-lg transition-colors cursor-pointer',
                      isDark
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-200'
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
                            : 'text-gray-400'
                      )}
                    />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => selectedMessage.archived 
                      ? handleUnarchive(selectedMessage.id)
                      : handleArchive(selectedMessage.id)
                    }
                    className={cn(
                      'p-2 rounded-lg transition-colors cursor-pointer',
                      isDark
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-200'
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
                      isDark
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-200'
                    )}
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                  
                  {selectedMessage.deliveryStatus === 'failed' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleResend(selectedMessage.id)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2',
                        isDark
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white',
                        'cursor-pointer'
                      )}
                      title="Resend"
                    >
                      <Send className="w-4 h-4" />
                      Resend
                    </motion.button>
                  )}
                  
                  <div className="relative group">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'p-2 rounded-lg transition-colors cursor-pointer',
                        isDark
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-200'
                      )}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </motion.button>
                    
                    {/* Dropdown menu */}
                    <div className={cn(
                      'absolute right-0 top-full mt-1 w-48 rounded-lg border-2 shadow-lg overflow-hidden z-10',
                      'hidden group-hover:block',
                      isDark
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                    )}>
                      <button
                        onClick={() => {/* Simulate forward */}}
                        className={cn(
                          'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                          isDark
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        )}
                      >
                        <Forward className="w-4 h-4" />
                        Forward
                      </button>
                      <button
                        onClick={() => {/* Simulate view source */}}
                        className={cn(
                          'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                          isDark
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        )}
                      >
                        <Eye className="w-4 h-4" />
                        View source
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Message Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Recipients Info */}
                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center',
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    )}>
                      <Send className={cn(
                        'w-6 h-6',
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={cn(
                            'text-lg font-semibold',
                            isDark ? 'text-white' : 'text-gray-900'
                          )}>
                            To: {selectedMessage.recipients.map(r => r.name).join(', ')}
                          </h4>
                          <p className={cn(
                            'text-sm',
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            {selectedMessage.recipients.map(r => r.email).join(', ')}
                          </p>
                        </div>
                        <div className={cn(
                          'text-sm flex items-center gap-2',
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          <Calendar className="w-4 h-4" />
                          {selectedMessage.date.toLocaleDateString()} at {selectedMessage.date.toLocaleTimeString()}
                        </div>
                      </div>
                      
                      {/* CC and BCC */}
                      {selectedMessage.cc && selectedMessage.cc.length > 0 && (
                        <div className="mt-2">
                          <p className={cn(
                            'text-sm',
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            <span className="font-medium">CC:</span> {selectedMessage.cc.map(c => `${c.name} (${c.email})`).join(', ')}
                          </p>
                        </div>
                      )}
                      
                      {selectedMessage.bcc && selectedMessage.bcc.length > 0 && (
                        <div className="mt-1">
                          <p className={cn(
                            'text-sm',
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            <span className="font-medium">BCC:</span> {selectedMessage.bcc.map(b => `${b.name} (${b.email})`).join(', ')}
                          </p>
                        </div>
                      )}
                      
                      {/* Delivery Status */}
                      <div className="mt-2 flex items-center gap-2">
                        {getDeliveryStatusIcon(selectedMessage.deliveryStatus)}
                        <span className={cn(
                          'text-sm',
                          selectedMessage.deliveryStatus === 'failed'
                            ? 'text-red-500'
                            : selectedMessage.deliveryStatus === 'delivered'
                              ? 'text-green-500'
                              : 'text-blue-500'
                        )}>
                          {selectedMessage.deliveryStatus === 'sent' && 'Sent'}
                          {selectedMessage.deliveryStatus === 'delivered' && 'Delivered'}
                          {selectedMessage.deliveryStatus === 'failed' && 'Failed to send'}
                        </span>
                        {selectedMessage.readReceipt && selectedMessage.read && (
                          <>
                            <span className="text-gray-400">•</span>
                            <CheckCheck className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-500">Read</span>
                          </>
                        )}
                      </div>
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
                <Send className={cn(
                  'w-16 h-16 mx-auto mb-4',
                  isDark ? 'text-gray-700' : 'text-gray-300'
                )} />
                <h3 className={cn(
                  'text-lg font-semibold mb-2',
                  isDark ? 'text-white' : 'text-gray-900'
                )}>
                  No message selected
                </h3>
                <p className={cn(
                  'text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Select a sent message from the list to view it
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Sent;