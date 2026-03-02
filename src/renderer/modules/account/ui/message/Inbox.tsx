/**
 * ============================================================================
 * INBOX COMPONENT
 * ============================================================================
 * 
 * Inbox component for displaying messages with left sidebar list and right
 * detail view with actions. Uses mock data for demonstration.
 * 
 * @component Inbox
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Mail,
  Star,
  Trash2,
  Archive,
  AlertCircle,
  CheckCircle,
  X,
  Reply,
  Forward,
  MoreHorizontal,
  ChevronLeft,
  Tag,
  User,
  Paperclip,
  Calendar,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../../../shared/utils/classNameUtils';
import { motion, AnimatePresence } from 'framer-motion';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface InboxProps {
  theme: 'light' | 'dark';
}

interface Message {
  id: string;
  subject: string;
  sender: {
    name: string;
    email: string;
    avatar?: string;
  };
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
}

type FilterType = 'all' | 'unread' | 'starred' | 'archived';
type SortType = 'newest' | 'oldest';

/* -------------------------------------------------------------------------- */
/*                                 MOCK DATA                                  */
/* -------------------------------------------------------------------------- */

const generateMockMessages = (): Message[] => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  return [
    {
      id: '1',
      subject: 'Urgent: Staff Credentialing Deadline Approaching',
      sender: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@hospital.org',
      },
      recipients: [
        { name: 'You', email: 'current.user@facility.com' }
      ],
      preview: 'This is a reminder that the credentialing deadline for Q3 is approaching...',
      body: `Dear Staff Member,

This is a reminder that the credentialing deadline for Q3 is approaching on June 30th, 2025.

Please ensure all your documents are uploaded and verified before the deadline. The following documents are required:
- Current license
- DEA certificate
- Board certifications
- Malpractice insurance

If you have any questions, please contact the credentialing department at credentialing@hospital.org.

Best regards,
Sarah Johnson
Credentialing Coordinator`,
      timestamp: '2 hours ago',
      date: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      read: false,
      starred: true,
      archived: false,
      deleted: false,
      labels: ['urgent', 'credentialing'],
      priority: 'high',
      attachments: [
        { name: 'credentialing_guide.pdf', size: '2.4 MB', type: 'pdf' }
      ]
    },
    {
      id: '2',
      subject: 'Facility Policy Update - Effective Immediately',
      sender: {
        name: 'Administration',
        email: 'admin@facility.com',
      },
      recipients: [
        { name: 'You', email: 'current.user@facility.com' }
      ],
      preview: 'Please review the updated facility policies regarding patient data handling...',
      body: `Dear Team,

We have updated our facility policies regarding patient data handling and privacy protocols. These changes are effective immediately.

Key updates include:
1. Two-factor authentication required for all EHR access
2. New patient consent forms for data sharing
3. Updated breach notification procedures

Please review the attached policy document and acknowledge receipt by end of week.

Thank you,
Administration`,
      timestamp: '5 hours ago',
      date: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      read: false,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['policy', 'important'],
      priority: 'high',
      attachments: [
        { name: 'policy_update_v2.pdf', size: '1.8 MB', type: 'pdf' }
      ]
    },
    {
      id: '3',
      subject: 'Invitation: Monthly Staff Meeting',
      sender: {
        name: 'Dr. Michael Chen',
        email: 'm.chen@facility.com',
      },
      recipients: [
        { name: 'You', email: 'current.user@facility.com' },
        { name: 'All Staff', email: 'all-staff@facility.com' }
      ],
      preview: 'You are invited to the monthly staff meeting scheduled for...',
      body: `Dear Colleagues,

You are invited to our monthly staff meeting.

Date: June 15, 2025
Time: 2:00 PM - 3:30 PM
Location: Conference Room A / Zoom link below

Agenda:
- Department updates
- New initiatives
- Q&A session

Please RSVP by June 10th.

Zoom: https://zoom.us/j/123456789

Best,
Dr. Michael Chen
Chief of Staff`,
      timestamp: 'yesterday',
      date: yesterday,
      read: true,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['meeting', 'invitation'],
      priority: 'normal',
    },
    {
      id: '4',
      subject: 'Your Timesheet Has Been Approved',
      sender: {
        name: 'Payroll Department',
        email: 'payroll@facility.com',
      },
      recipients: [
        { name: 'You', email: 'current.user@facility.com' }
      ],
      preview: 'Your timesheet for the period of May 15-31 has been approved...',
      body: `Dear Staff Member,

Your timesheet for the period of May 15-31, 2025 has been approved.

Payment will be processed on the next payroll date: June 15, 2025.

Summary:
- Regular hours: 80
- Overtime hours: 4
- Holiday hours: 0
- Total gross pay: $3,240.00

Please contact payroll@facility.com if you have any questions.

Thank you,
Payroll Department`,
      timestamp: 'yesterday',
      date: yesterday,
      read: true,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['payroll', 'approved'],
      priority: 'normal',
    },
    {
      id: '5',
      subject: 'New Continuing Education Courses Available',
      sender: {
        name: 'Education Department',
        email: 'education@facility.com',
      },
      recipients: [
        { name: 'You', email: 'current.user@facility.com' }
      ],
      preview: 'We are pleased to announce new CME/CE courses available for the upcoming quarter...',
      body: `Dear Staff,

We are pleased to announce new CME/CE courses available for the upcoming quarter:

1. "Advances in Cardiac Care" - 8 credits
2. "Patient Safety Protocols" - 4 credits
3. "Leadership in Healthcare" - 6 credits
4. "Ethics in Medical Practice" - 3 credits

Courses are available online and can be accessed through the learning portal.

To register: https://learning.facility.com

Best regards,
Education Department`,
      timestamp: '2 days ago',
      date: twoDaysAgo,
      read: false,
      starred: true,
      archived: false,
      deleted: false,
      labels: ['education', 'cme'],
      priority: 'low',
      attachments: [
        { name: 'course_catalog_q3.pdf', size: '3.1 MB', type: 'pdf' },
        { name: 'registration_guide.docx', size: '1.2 MB', type: 'docx' }
      ]
    },
    {
      id: '6',
      subject: 'System Maintenance Notification',
      sender: {
        name: 'IT Services',
        email: 'it@facility.com',
      },
      recipients: [
        { name: 'All Staff', email: 'all-staff@facility.com' }
      ],
      preview: 'The EHR system will be undergoing scheduled maintenance this weekend...',
      body: `Dear Staff,

The Electronic Health Records (EHR) system will undergo scheduled maintenance:

Date: Saturday, June 8, 2025
Time: 10:00 PM - 2:00 AM (Sunday)
Expected downtime: 4 hours

During this time, the system will be unavailable. Please plan accordingly and ensure all critical entries are completed before maintenance begins.

For emergencies during downtime, please use the manual backup procedures.

Thank you,
IT Services`,
      timestamp: '3 days ago',
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      read: true,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['maintenance', 'it'],
      priority: 'normal',
    },
    {
      id: '7',
      subject: 'Quarterly Performance Review Scheduled',
      sender: {
        name: 'HR Department',
        email: 'hr@facility.com',
      },
      recipients: [
        { name: 'You', email: 'current.user@facility.com' }
      ],
      preview: 'Your quarterly performance review has been scheduled for next week...',
      body: `Dear Staff Member,

Your quarterly performance review has been scheduled:

Date: June 12, 2025
Time: 10:00 AM - 11:00 AM
Location: HR Conference Room / Microsoft Teams
Reviewer: Lisa Thompson, HR Manager

Please complete the self-assessment form (attached) and return it by June 10th.

The meeting will cover:
- Performance highlights
- Areas for improvement
- Goal setting for next quarter

Regards,
HR Department`,
      timestamp: '4 days ago',
      date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      read: false,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['hr', 'review'],
      priority: 'high',
      attachments: [
        { name: 'self_assessment_form.docx', size: '0.8 MB', type: 'docx' }
      ]
    },
    {
      id: '8',
      subject: 'Welcome to the Team!',
      sender: {
        name: 'Onboarding Team',
        email: 'onboarding@facility.com',
      },
      recipients: [
        { name: 'You', email: 'current.user@facility.com' }
      ],
      preview: 'Welcome to the facility! We are excited to have you on board...',
      body: `Welcome to the team!

We are excited to have you on board. Please complete the following onboarding tasks:

1. Review employee handbook (attached)
2. Complete new hire forms (portal link below)
3. Schedule IT orientation
4. Set up your direct deposit

New Hire Portal: https://portal.facility.com/newhire

If you have any questions, please contact onboarding@facility.com.

Best regards,
Onboarding Team`,
      timestamp: '5 days ago',
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      read: true,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['onboarding'],
      priority: 'normal',
      attachments: [
        { name: 'employee_handbook_2025.pdf', size: '4.5 MB', type: 'pdf' }
      ]
    },
    {
      id: '9',
      subject: 'Security Alert: New Login Detected',
      sender: {
        name: 'Security Team',
        email: 'security@facility.com',
      },
      recipients: [
        { name: 'You', email: 'current.user@facility.com' }
      ],
      preview: 'A new login to your account was detected from an unrecognized device...',
      body: `Security Alert

A new login to your account was detected:

Device: iPhone 15 Pro
Location: Chicago, IL (approximate)
Time: June 3, 2025 8:45 PM

If this was you, no action is needed.

If you did not perform this login, please contact IT security immediately at security@facility.com or call ext. 5678.

Stay safe,
Security Team`,
      timestamp: '1 week ago',
      date: lastWeek,
      read: true,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['security', 'alert'],
      priority: 'high',
    },
    {
      id: '10',
      subject: 'Holiday Schedule for Independence Day',
      sender: {
        name: 'Operations',
        email: 'ops@facility.com',
      },
      recipients: [
        { name: 'All Staff', email: 'all-staff@facility.com' }
      ],
      preview: 'Please review the holiday schedule for Independence Day (July 4th)...',
      body: `Dear Staff,

Please review the holiday schedule for Independence Day (July 4th, 2025):

- Facility closed: July 4th
- Essential staff: As scheduled by department managers
- Holiday pay: Eligible staff will receive 1.5x base rate
- Deadline to request time off: June 20th

Please coordinate with your department manager for specific scheduling.

Thank you,
Operations`,
      timestamp: '1 week ago',
      date: lastWeek,
      read: false,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['holiday', 'schedule'],
      priority: 'low',
    }
  ];
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export const Inbox: React.FC<InboxProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  
  /* -------------------------------- State --------------------------------- */
  
  const [messages, setMessages] = useState<Message[]>(generateMockMessages);
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
      case 'unread':
        filtered = filtered.filter(m => !m.read && !m.deleted);
        break;
      case 'starred':
        filtered = filtered.filter(m => m.starred && !m.deleted);
        break;
      case 'archived':
        filtered = filtered.filter(m => m.archived && !m.deleted);
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
        m.sender.name.toLowerCase().includes(term) ||
        m.sender.email.toLowerCase().includes(term) ||
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
    const unread = messages.filter(m => !m.read && !m.deleted).length;
    const starred = messages.filter(m => m.starred && !m.deleted).length;
    const archived = messages.filter(m => m.archived && !m.deleted).length;
    
    return { total, unread, starred, archived };
  }, [messages]);
  
  /* ---------------------------- Action Handlers ---------------------------- */
  
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setMessages(generateMockMessages());
      setIsRefreshing(false);
    }, 800);
  }, []);
  
  const handleMarkAsRead = useCallback((id: string) => {
    setMessages(prev => 
      prev.map(m => 
        m.id === id ? { ...m, read: true } : m
      )
    );
  }, []);
  
  const handleMarkAsUnread = useCallback((id: string) => {
    setMessages(prev => 
      prev.map(m => 
        m.id === id ? { ...m, read: false } : m
      )
    );
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
  
  const handleSelectMessage = useCallback((id: string) => {
    setSelectedMessageId(id);
    handleMarkAsRead(id);
    if (window.innerWidth < 768) {
      setShowMobileList(false);
    }
  }, [handleMarkAsRead]);
  
  const handleBackToList = useCallback(() => {
    setShowMobileList(true);
  }, []);
  
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);
  
  /* ----------------------------- Render Helpers ---------------------------- */
  
  const getPriorityBadge = (priority: Message['priority']) => {
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
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50' 
            : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400',
          'group'
        )}
      >
        {/* Background decoration */}
        <div className={cn(
          'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity',
          isDark ? 'bg-blue-500/10 group-hover:opacity-100' : 'bg-blue-500/5 group-hover:opacity-100',
          'opacity-0'
        )} />
        
        <div className="relative p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-3 rounded-xl transition-all duration-300',
                isDark 
                  ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110' 
                  : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
              )}>
                <Mail className={cn(
                  'w-6 h-6',
                  isDark ? 'text-blue-400' : 'text-blue-600'
                )} />
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Inbox
                  <span className={cn(
                    'text-sm font-medium px-2.5 py-1 rounded-full',
                    isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-200'
                  )}>
                    {stats.total} messages
                  </span>
                </h2>
                <p className={cn(
                  'mt-1 text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {stats.unread} unread • {stats.starred} starred
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
                    background: 'linear-gradient(90deg, #3b82f6, #10b981, #6366f1, #3b82f6)',
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
                          : 'text-gray-400'
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
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-blue-600 border-blue-400 text-white'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  All ({stats.total})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    'border-2 cursor-pointer',
                    filter === 'unread'
                      ? isDark
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-blue-600 border-blue-400 text-white'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  Unread ({stats.unread})
                </button>
                <button
                  onClick={() => setFilter('starred')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    'border-2 cursor-pointer',
                    filter === 'starred'
                      ? isDark
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-blue-600 border-blue-400 text-white'
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
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-blue-600 border-blue-400 text-white'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  Archived ({stats.archived})
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
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-10 py-2 rounded-lg text-sm border-2',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
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
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-blue-600 border-blue-400 text-white'
                        : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                    )}
                  >
                    All ({stats.total})
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border-2',
                      filter === 'unread'
                        ? isDark
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-blue-600 border-blue-400 text-white'
                        : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                    )}
                  >
                    Unread ({stats.unread})
                  </button>
                  <button
                    onClick={() => setFilter('starred')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border-2',
                      filter === 'starred'
                        ? isDark
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-blue-600 border-blue-400 text-white'
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
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-blue-600 border-blue-400 text-white'
                        : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                    )}
                  >
                    Archived ({stats.archived})
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
                    <Mail className={cn(
                      'w-12 h-12 mx-auto mb-3',
                      isDark ? 'text-gray-700' : 'text-gray-300'
                    )} />
                    <p className={cn(
                      'text-sm font-medium',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      No messages found
                    </p>
                    <p className={cn(
                      'text-xs mt-1',
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    )}>
                      {searchTerm ? 'Try adjusting your search' : 'Your inbox is empty'}
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
                            ? 'bg-blue-900/20 border-l-4 border-blue-500'
                            : 'bg-blue-50 border-l-4 border-blue-500'
                          : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50',
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      )}
                    >
                      {/* Sender and Date */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            isDark ? 'bg-gray-700' : 'bg-gray-200'
                          )}>
                            <User className={cn(
                              'w-4 h-4',
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            )} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              'text-sm font-medium truncate',
                              !message.read && 'font-semibold',
                              isDark ? 'text-white' : 'text-gray-900'
                            )}>
                              {message.sender.name}
                            </p>
                            <p className={cn(
                              'text-xs truncate',
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              {message.sender.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {message.priority === 'high' && (
                            <AlertCircle className={cn(
                              'w-3 h-3',
                              isDark ? 'text-red-400' : 'text-red-500'
                            )} />
                          )}
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
                        {!message.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        )}
                        <p className={cn(
                          'text-sm truncate flex-1',
                          !message.read && 'font-semibold',
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
                      
                      {/* Labels */}
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
                        onClick={() => handleMarkAsUnread(selectedMessage.id)}
                        className={cn(
                          'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                          isDark
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        )}
                      >
                        <Mail className="w-4 h-4" />
                        Mark as unread
                      </button>
                      <button
                        onClick={() => {/* Simulate reply */}}
                        className={cn(
                          'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                          isDark
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        )}
                      >
                        <Reply className="w-4 h-4" />
                        Reply
                      </button>
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
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Message Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Sender Info */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center',
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    )}>
                      <User className={cn(
                        'w-6 h-6',
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )} />
                    </div>
                    <div>
                      <h4 className={cn(
                        'text-lg font-semibold',
                        isDark ? 'text-white' : 'text-gray-900'
                      )}>
                        {selectedMessage.sender.name}
                      </h4>
                      <p className={cn(
                        'text-sm',
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        {selectedMessage.sender.email}
                      </p>
                      <p className={cn(
                        'text-xs mt-1',
                        isDark ? 'text-gray-500' : 'text-gray-500'
                      )}>
                        To: {selectedMessage.recipients.map(r => r.name).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    'text-sm',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedMessage.date.toLocaleDateString()} at {selectedMessage.date.toLocaleTimeString()}
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
              
              {/* Reply Area */}
              <div className={cn(
                'p-4 border-t-2',
                isDark ? 'border-gray-700' : 'border-gray-200'
              )}>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Type your reply..."
                    className={cn(
                      'flex-1 px-4 py-2 rounded-lg border-2',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    )}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'px-4 py-2 rounded-lg font-medium',
                      isDark
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white',
                      'cursor-pointer'
                    )}
                  >
                    Send
                  </motion.button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center">
                <Mail className={cn(
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