/**
 * ============================================================================
 * DRAFT COMPONENT
 * ============================================================================
 * 
 * Draft component for displaying saved draft messages with left sidebar list 
 * and right detail view with editing capabilities. Uses mock data for demonstration.
 * 
 * @component Draft
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Star,
  Trash2,
  Archive,
  AlertCircle,
  CheckCircle,
  X,
  ChevronLeft,
  Tag,
  Paperclip,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Send,
  Users,
  Edit,
  Save,
  FileText,
  Plus,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { cn } from '../../../../shared/utils/classNameUtils';
import { motion, AnimatePresence } from 'framer-motion';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface DraftProps {
  theme: 'light' | 'dark';
}

interface DraftMessage {
  id: string;
  subject: string;
  recipients: Array<{
    name: string;
    email: string;
  }>;
  cc?: Array<{
    name: string;
    email: string;
  }>;
  bcc?: Array<{
    name: string;
    email: string;
  }>;
  preview: string;
  body: string;
  lastEdited: string;
  lastEditedDate: Date;
  created: Date;
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
  isEditing?: boolean;
  autoSaved?: boolean;
  autoSaveTime?: string;
  wordCount?: number;
  characterCount?: number;
  incompleteFields?: string[];
}

type FilterType = 'all' | 'starred' | 'archived' | 'incomplete';
type SortType = 'recent' | 'oldest' | 'alphabetical';

/* -------------------------------------------------------------------------- */
/*                                 MOCK DATA                                  */
/* -------------------------------------------------------------------------- */

const generateMockDraftMessages = (): DraftMessage[] => {
  const now = new Date();
  const oneHourAgo = new Date(now);
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  
  const threeHoursAgo = new Date(now);
  threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);
  
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
      id: 'd1',
      subject: 'RE: Credentialing Documents - Additional Info',
      recipients: [
        { name: 'Sarah Johnson', email: 'sarah.johnson@hospital.org' }
      ],
      cc: [
        { name: 'Credentialing Dept', email: 'credentialing@hospital.org' }
      ],
      preview: 'Following up on the additional documents you requested...',
      body: `Hi Sarah,

Following up on the additional documents you requested for my credentialing application:

I've attached the following:
- Updated CV with recent publications
- Additional reference letters
- Continuing education certificates

Please let me know if you need anything else.

Thanks,
John`,
      lastEdited: '1 hour ago',
      lastEditedDate: oneHourAgo,
      created: oneHourAgo,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['credentialing', 'pending'],
      priority: 'high',
      attachments: [
        { name: 'cv_updated_2025.pdf', size: '1.5 MB', type: 'pdf' },
        { name: 'reference_letters.pdf', size: '2.1 MB', type: 'pdf' }
      ],
      autoSaved: true,
      autoSaveTime: '2 minutes ago',
      wordCount: 85,
      characterCount: 512,
    },
    {
      id: 'd2',
      subject: 'Monthly Staff Meeting - Agenda Item',
      recipients: [
        { name: 'Dr. Michael Chen', email: 'm.chen@facility.com' }
      ],
      preview: 'I would like to add an item to the agenda for the upcoming staff meeting...',
      body: `Dear Dr. Chen,

I would like to add an item to the agenda for the upcoming staff meeting:

Topic: New patient intake process improvement
Time needed: 10-15 minutes
Key points to discuss:
1. Current bottlenecks in intake process
2. Proposed workflow changes
3. Technology solutions to consider

Please let me know if this can be accommodated.

Best regards,
John`,
      lastEdited: '3 hours ago',
      lastEditedDate: threeHoursAgo,
      created: threeHoursAgo,
      starred: true,
      archived: false,
      deleted: false,
      labels: ['meeting', 'agenda', 'draft'],
      priority: 'normal',
      wordCount: 78,
      characterCount: 468,
      incompleteFields: ['attachments'],
    },
    {
      id: 'd3',
      subject: '',
      recipients: [],
      preview: 'No subject - Draft in progress...',
      body: `Dear Team,

I'm writing to propose a new initiative for improving patient satisfaction scores...

[Still working on the details]`,
      lastEdited: 'yesterday',
      lastEditedDate: yesterday,
      created: yesterday,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['draft', 'incomplete'],
      priority: 'normal',
      wordCount: 23,
      characterCount: 142,
      incompleteFields: ['subject', 'recipients'],
    },
    {
      id: 'd4',
      subject: 'IT Support Request: Printer Not Working',
      recipients: [
        { name: 'IT Services', email: 'it@facility.com' }
      ],
      preview: 'The printer on the third floor is not working properly...',
      body: `Dear IT Services,

The printer on the third floor (near the nurses station) is not working properly.

Issue: Paper jams frequently and error message displays "service required"
Printer model: HP LaserJet Pro M402dn
Location: 3rd Floor, Room 305

Please send someone to look at it when available.

Thank you,
John Doe`,
      lastEdited: 'yesterday',
      lastEditedDate: yesterday,
      created: twoDaysAgo,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['it', 'support', 'draft'],
      priority: 'low',
      wordCount: 62,
      characterCount: 398,
    },
    {
      id: 'd5',
      subject: 'Continuing Education Reimbursement Request',
      recipients: [
        { name: 'Education Department', email: 'education@facility.com' },
        { name: 'Finance Department', email: 'finance@facility.com' }
      ],
      preview: 'I would like to request reimbursement for CME courses completed last quarter...',
      body: `Dear Education and Finance Departments,

I would like to request reimbursement for CME courses completed last quarter:

Course 1: "Advances in Cardiac Care" - $450
Course 2: "Patient Safety Protocols" - $275
Total: $725

Attached please find:
- Course completion certificates
- Payment receipts
- Approval form

Please process reimbursement at your earliest convenience.

Thank you,
John Doe`,
      lastEdited: '2 days ago',
      lastEditedDate: twoDaysAgo,
      created: threeDaysAgo,
      starred: true,
      archived: false,
      deleted: false,
      labels: ['education', 'finance', 'reimbursement'],
      priority: 'normal',
      attachments: [
        { name: 'certificates.pdf', size: '3.2 MB', type: 'pdf' },
        { name: 'receipts.pdf', size: '1.8 MB', type: 'pdf' }
      ],
      wordCount: 95,
      characterCount: 612,
    },
    {
      id: 'd6',
      subject: 'Schedule Change Request - Personal Appointment',
      recipients: [
        { name: 'Scheduling Department', email: 'scheduling@facility.com' }
      ],
      cc: [
        { name: 'Nurse Manager', email: 'nurse.manager@facility.com' }
      ],
      preview: 'I need to request a schedule change due to a personal appointment...',
      body: `Dear Scheduling Department,

I need to request a schedule change due to a personal medical appointment.

Current shift: Monday, June 17th, 7:00 AM - 3:00 PM
Requested change: Tuesday, June 18th, 3:00 PM - 11:00 PM

I have already discussed this with my nurse manager and they are okay with the swap.

Please let me know if this can be accommodated.

Thank you,
John Doe`,
      lastEdited: '3 days ago',
      lastEditedDate: threeDaysAgo,
      created: threeDaysAgo,
      starred: false,
      archived: true,
      deleted: false,
      labels: ['schedule', 'request', 'personal'],
      priority: 'normal',
      wordCount: 88,
      characterCount: 542,
    },
    {
      id: 'd7',
      subject: 'Patient Referral - Dr. Smith',
      recipients: [
        { name: 'Dr. Sarah Johnson', email: 's.johnson@specialists.org' }
      ],
      preview: 'I am referring a patient who needs specialized care...',
      body: `Dear Dr. Johnson,

I am referring a patient who needs specialized care for a cardiac condition.

Patient: John Smith (MRN: 7890123)
DOB: 05/15/1965
Reason for referral: Chest pain and abnormal ECG findings
Insurance: Blue Cross PPO

Attached please find:
- Recent test results
- Medical history summary
- Insurance information

Please let me know if you can see this patient.

Best regards,
Dr. John Doe`,
      lastEdited: '4 days ago',
      lastEditedDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      created: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      starred: false,
      archived: false,
      deleted: false,
      labels: ['referral', 'patient', 'draft'],
      priority: 'high',
      attachments: [
        { name: 'test_results.pdf', size: '2.7 MB', type: 'pdf' },
        { name: 'patient_summary.pdf', size: '1.3 MB', type: 'pdf' }
      ],
      wordCount: 72,
      characterCount: 468,
      incompleteFields: ['cc'],
    },
    {
      id: 'd8',
      subject: 'Thank You - Retirement Party',
      recipients: [
        { name: 'All Staff', email: 'all-staff@facility.com' }
      ],
      preview: 'Thank you to everyone who made the retirement party special...',
      body: `Dear Colleagues,

I want to express my sincere gratitude to everyone who organized and attended the retirement party for Dr. Williams. 

The event was beautifully arranged, and it was wonderful to see so many colleagues come together to celebrate his 30 years of service.

Special thanks to:
- The planning committee
- Everyone who contributed to the gift
- Those who shared heartfelt speeches

It was a memorable evening that Dr. Williams will treasure.

Best regards,
John Doe`,
      lastEdited: '5 days ago',
      lastEditedDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      created: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      starred: true,
      archived: false,
      deleted: false,
      labels: ['thank you', 'social'],
      priority: 'low',
      wordCount: 112,
      characterCount: 678,
    },
    {
      id: 'd9',
      subject: 'Policy Feedback: New Documentation Requirements',
      recipients: [
        { name: 'Administration', email: 'admin@facility.com' }
      ],
      preview: 'I have some feedback on the new documentation requirements...',
      body: `Dear Administration,

I have some feedback on the new documentation requirements implemented last month.

Positive aspects:
- More structured format
- Better compliance tracking
- Improved clarity

Challenges:
- Increased time per patient
- Some redundant fields
- Training needs for new staff

Suggestions for improvement:
1. Streamline redundant fields
2. Provide quick-reference guide
3. Consider phased implementation

I'm happy to discuss this further.

Regards,
John Doe`,
      lastEdited: '6 days ago',
      lastEditedDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      created: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      starred: false,
      archived: false,
      deleted: false,
      labels: ['policy', 'feedback', 'draft'],
      priority: 'normal',
      wordCount: 98,
      characterCount: 612,
    },
    {
      id: 'd10',
      subject: 'Holiday Party Planning Committee',
      recipients: [
        { name: 'Social Committee', email: 'social@facility.com' }
      ],
      preview: 'I would like to volunteer for the holiday party planning committee...',
      body: `Dear Social Committee,

I would like to volunteer for the holiday party planning committee for this year's celebration.

I have experience organizing events and would be happy to help with:
- Venue selection
- Catering coordination
- Activities planning
- Budget management

Please let me know when the next meeting is scheduled.

Best regards,
John Doe`,
      lastEdited: '1 week ago',
      lastEditedDate: lastWeek,
      created: lastWeek,
      starred: false,
      archived: false,
      deleted: false,
      labels: ['social', 'volunteer', 'draft'],
      priority: 'low',
      wordCount: 65,
      characterCount: 412,
    }
  ];
};

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export const Draft: React.FC<DraftProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  
  /* -------------------------------- State --------------------------------- */
  
  const [messages, setMessages] = useState<DraftMessage[]>(generateMockDraftMessages);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(messages[0]?.id || null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editedBody, setEditedBody] = useState<string>('');
  const [editedSubject, setEditedSubject] = useState<string>('');
  
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
      case 'incomplete':
        filtered = filtered.filter(m => 
          m.incompleteFields && m.incompleteFields.length > 0 && !m.deleted
        );
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
        m.preview.toLowerCase().includes(term) ||
        m.labels.some(l => l.toLowerCase().includes(term))
      );
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      if (sort === 'recent') {
        return b.lastEditedDate.getTime() - a.lastEditedDate.getTime();
      } else if (sort === 'oldest') {
        return a.lastEditedDate.getTime() - b.lastEditedDate.getTime();
      } else if (sort === 'alphabetical') {
        return a.subject.localeCompare(b.subject);
      }
      return 0;
    });
    
    return filtered;
  }, [messages, filter, searchTerm, sort]);
  
  const stats = useMemo(() => {
    const total = messages.filter(m => !m.deleted).length;
    const starred = messages.filter(m => m.starred && !m.deleted).length;
    const archived = messages.filter(m => m.archived && !m.deleted).length;
    const incomplete = messages.filter(m => 
      m.incompleteFields && m.incompleteFields.length > 0 && !m.deleted
    ).length;
    
    return { total, starred, archived, incomplete };
  }, [messages]);
  
  /* ---------------------------- Action Handlers ---------------------------- */
  
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setMessages(generateMockDraftMessages());
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
  
  const handleSelectMessage = useCallback((id: string) => {
    setSelectedMessageId(id);
    const message = messages.find(m => m.id === id);
    if (message) {
      setEditedBody(message.body);
      setEditedSubject(message.subject);
    }
    if (window.innerWidth < 768) {
      setShowMobileList(false);
    }
  }, [messages]);
  
  const handleBackToList = useCallback(() => {
    setShowMobileList(true);
  }, []);
  
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);
  
  const handleEditDraft = useCallback((id: string) => {
    setEditingDraftId(id);
    const message = messages.find(m => m.id === id);
    if (message) {
      setEditedBody(message.body);
      setEditedSubject(message.subject);
    }
  }, [messages]);
  
  const handleSaveDraft = useCallback((id: string) => {
    setMessages(prev => 
      prev.map(m => 
        m.id === id 
          ? { 
              ...m, 
              body: editedBody,
              subject: editedSubject,
              lastEdited: 'just now',
              lastEditedDate: new Date(),
              autoSaved: true,
              autoSaveTime: 'just now',
              wordCount: editedBody.split(/\s+/).filter(w => w.length > 0).length,
              characterCount: editedBody.length,
            } 
          : m
      )
    );
    setEditingDraftId(null);
  }, [editedBody, editedSubject]);
  
  const handleSendDraft = useCallback((id: string) => {
    // Simulate sending the draft
    setMessages(prev => prev.filter(m => m.id !== id));
    setSelectedMessageId(null);
    setEditingDraftId(null);
    // Show success message (in a real app)
    console.log('Draft sent:', id);
  }, []);
  
  const handleCancelEdit = useCallback(() => {
    setEditingDraftId(null);
    if (selectedMessage) {
      setEditedBody(selectedMessage.body);
      setEditedSubject(selectedMessage.subject);
    }
  }, [selectedMessage]);
  
  const handleAutoSave = useCallback(() => {
    if (editingDraftId) {
      // Simulate auto-save
      console.log('Auto-saving draft:', editingDraftId);
    }
  }, [editingDraftId]);
  
  /* ----------------------------- Render Helpers ---------------------------- */
  
  const getPriorityBadge = (priority: DraftMessage['priority']) => {
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
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-amber-500/30 hover:border-amber-500/50' 
            : 'bg-gradient-to-br from-white to-amber-50/50 border-amber-200 hover:border-amber-400',
          'group'
        )}
      >
        {/* Background decoration */}
        <div className={cn(
          'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity',
          isDark ? 'bg-amber-500/10 group-hover:opacity-100' : 'bg-amber-500/5 group-hover:opacity-100',
          'opacity-0'
        )} />
        
        <div className="relative p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-3 rounded-xl transition-all duration-300',
                isDark 
                  ? 'bg-amber-500/20 group-hover:bg-amber-500/30 group-hover:scale-110' 
                  : 'bg-amber-100 group-hover:bg-amber-200 group-hover:scale-110'
              )}>
                <FileText className={cn(
                  'w-6 h-6',
                  isDark ? 'text-amber-400' : 'text-amber-600'
                )} />
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Drafts
                  <span className={cn(
                    'text-sm font-medium px-2.5 py-1 rounded-full',
                    isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-700 border border-amber-200'
                  )}>
                    {stats.total} drafts
                  </span>
                </h2>
                <p className={cn(
                  'mt-1 text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {stats.incomplete > 0 && (
                    <span className="text-amber-500 mr-2">{stats.incomplete} incomplete</span>
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
                    background: 'linear-gradient(90deg, #f59e0b, #f97316, #fbbf24, #f59e0b)',
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
                        ? 'text-amber-500' 
                        : isDark 
                          ? 'text-gray-500' 
                          : 'text-gray-400'
                    )}
                  />
                  <input
                    type="text"
                    placeholder="Search drafts..."
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
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-amber-600 border-amber-400 text-white'
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
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-amber-600 border-amber-400 text-white'
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
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-amber-600 border-amber-400 text-white'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  Archived ({stats.archived})
                </button>
                <button
                  onClick={() => setFilter('incomplete')}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    'border-2 cursor-pointer',
                    filter === 'incomplete'
                      ? isDark
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-amber-600 border-amber-400 text-white'
                      : isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  Incomplete ({stats.incomplete})
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
                <option value="recent">Most recent</option>
                <option value="oldest">Oldest first</option>
                <option value="alphabetical">Alphabetical</option>
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
                    placeholder="Search drafts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-10 py-2 rounded-lg text-sm border-2',
                      'focus:outline-none focus:ring-2 focus:ring-amber-500',
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
                          ? 'bg-amber-600 border-amber-500 text-white'
                          : 'bg-amber-600 border-amber-400 text-white'
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
                          ? 'bg-amber-600 border-amber-500 text-white'
                          : 'bg-amber-600 border-amber-400 text-white'
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
                          ? 'bg-amber-600 border-amber-500 text-white'
                          : 'bg-amber-600 border-amber-400 text-white'
                        : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                    )}
                  >
                    Archived ({stats.archived})
                  </button>
                  <button
                    onClick={() => setFilter('incomplete')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border-2',
                      filter === 'incomplete'
                        ? isDark
                          ? 'bg-amber-600 border-amber-500 text-white'
                          : 'bg-amber-600 border-amber-400 text-white'
                        : isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                    )}
                  >
                    Incomplete ({stats.incomplete})
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
                  <option value="recent">Most recent</option>
                  <option value="oldest">Oldest first</option>
                  <option value="alphabetical">Alphabetical</option>
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
                {filteredMessages.length} drafts
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
                    <FileText className={cn(
                      'w-12 h-12 mx-auto mb-3',
                      isDark ? 'text-gray-700' : 'text-gray-300'
                    )} />
                    <p className={cn(
                      'text-sm font-medium',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      No drafts found
                    </p>
                    <p className={cn(
                      'text-xs mt-1',
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    )}>
                      {searchTerm ? 'Try adjusting your search' : 'Your drafts folder is empty'}
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
                            ? 'bg-amber-900/20 border-l-4 border-amber-500'
                            : 'bg-amber-50 border-l-4 border-amber-500'
                          : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50',
                        message.incompleteFields && message.incompleteFields.length > 0 && (
                          isDark
                            ? 'bg-red-900/10 border-l-4 border-red-500'
                            : 'bg-red-50/50 border-l-4 border-red-500'
                        ),
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      )}
                    >
                      {/* Recipients and Last Edited */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            isDark ? 'bg-gray-700' : 'bg-gray-200'
                          )}>
                            <FileText className={cn(
                              'w-4 h-4',
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            )} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              'text-sm font-medium truncate',
                              isDark ? 'text-white' : 'text-gray-900'
                            )}>
                              {message.recipients.length > 0 
                                ? `To: ${message.recipients.map(r => r.name).join(', ')}`
                                : 'No recipients'
                              }
                            </p>
                            <p className={cn(
                              'text-xs truncate',
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              {message.recipients.length > 0 
                                ? message.recipients.map(r => r.email).join(', ')
                                : 'Add recipients'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {message.autoSaved && (
                            <Save className="w-3 h-3 text-amber-500" />
                          )}
                          <span className={cn(
                            'text-xs whitespace-nowrap',
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          )}>
                            {message.lastEdited}
                          </span>
                        </div>
                      </div>
                      
                      {/* Subject */}
                      <div className="flex items-start gap-2 mb-1">
                        {message.incompleteFields?.includes('subject') && (
                          <AlertTriangle className="w-3 h-3 text-red-500 mt-1 flex-shrink-0" />
                        )}
                        <p className={cn(
                          'text-sm truncate flex-1',
                          message.subject ? (isDark ? 'text-white' : 'text-gray-900') : 'text-red-500 italic',
                          message.subject ? '' : 'italic'
                        )}>
                          {message.subject || 'No subject'}
                        </p>
                      </div>
                      
                      {/* Preview */}
                      <p className={cn(
                        'text-xs truncate mb-2',
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        {message.preview}
                      </p>
                      
                      {/* Labels and Stats */}
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
                        {message.wordCount && (
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                            isDark
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-100 text-gray-700'
                          )}>
                            <Edit className="w-3 h-3" />
                            {message.wordCount} words
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
                    {editingDraftId === selectedMessage.id ? (
                      <input
                        type="text"
                        value={editedSubject}
                        onChange={(e) => setEditedSubject(e.target.value)}
                        placeholder="Subject"
                        className={cn(
                          'w-full px-3 py-1 rounded-lg border-2 text-lg font-semibold',
                          'focus:outline-none focus:ring-2 focus:ring-amber-500',
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                        )}
                      />
                    ) : (
                      selectedMessage.subject || <span className="italic text-red-500">No subject</span>
                    )}
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
                  {editingDraftId === selectedMessage.id ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSaveDraft(selectedMessage.id)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2',
                          isDark
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white',
                          'cursor-pointer'
                        )}
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSendDraft(selectedMessage.id)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2',
                          isDark
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white',
                          'cursor-pointer'
                        )}
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCancelEdit}
                        className={cn(
                          'p-2 rounded-lg transition-colors cursor-pointer',
                          isDark
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-200 text-gray-700'
                        )}
                        title="Cancel"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditDraft(selectedMessage.id)}
                        className={cn(
                          'p-2 rounded-lg transition-colors cursor-pointer',
                          isDark
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-200 text-gray-700'
                        )}
                        title="Edit draft"
                      >
                        <Edit className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSendDraft(selectedMessage.id)}
                        className={cn(
                          'p-2 rounded-lg transition-colors cursor-pointer',
                          isDark
                            ? 'hover:bg-gray-700 text-gray-300'
                            : 'hover:bg-gray-200 text-gray-700'
                        )}
                        title="Send now"
                      >
                        <Send className="w-5 h-5" />
                      </motion.button>
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
                    </>
                  )}
                </div>
              </div>
              
              {/* Message Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Auto-save indicator */}
                {selectedMessage.autoSaved && editingDraftId !== selectedMessage.id && (
                  <div className={cn(
                    'mb-4 p-2 rounded-lg flex items-center gap-2 text-sm',
                    isDark
                      ? 'bg-amber-900/20 text-amber-300 border border-amber-500/30'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  )}>
                    <Info className="w-4 h-4" />
                    <span>Auto-saved {selectedMessage.autoSaveTime}</span>
                  </div>
                )}
                
                {/* Incomplete fields warning */}
                {selectedMessage.incompleteFields && selectedMessage.incompleteFields.length > 0 && editingDraftId !== selectedMessage.id && (
                  <div className={cn(
                    'mb-4 p-2 rounded-lg flex items-center gap-2 text-sm',
                    isDark
                      ? 'bg-red-900/20 text-red-300 border border-red-500/30'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  )}>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Missing: {selectedMessage.incompleteFields.join(', ')}</span>
                  </div>
                )}
                
                {/* Recipients Info */}
                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center',
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    )}>
                      <Users className={cn(
                        'w-6 h-6',
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )} />
                    </div>
                    <div className="flex-1">
                      {editingDraftId === selectedMessage.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className={cn(
                              'block text-xs font-medium mb-1',
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              To:
                            </label>
                            <input
                              type="text"
                              defaultValue={selectedMessage.recipients.map(r => r.email).join('; ')}
                              placeholder="recipient@example.com"
                              className={cn(
                                'w-full px-3 py-2 rounded-lg border-2 text-sm',
                                'focus:outline-none focus:ring-2 focus:ring-amber-500',
                                isDark
                                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                              )}
                            />
                          </div>
                          <div>
                            <label className={cn(
                              'block text-xs font-medium mb-1',
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              CC:
                            </label>
                            <input
                              type="text"
                              defaultValue={selectedMessage.cc?.map(c => c.email).join('; ') || ''}
                              placeholder="cc@example.com"
                              className={cn(
                                'w-full px-3 py-2 rounded-lg border-2 text-sm',
                                'focus:outline-none focus:ring-2 focus:ring-amber-500',
                                isDark
                                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                              )}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className={cn(
                                'text-lg font-semibold',
                                isDark ? 'text-white' : 'text-gray-900'
                              )}>
                                To: {selectedMessage.recipients.length > 0 
                                  ? selectedMessage.recipients.map(r => r.name).join(', ')
                                  : <span className="italic text-red-500">No recipients</span>
                                }
                              </h4>
                              {selectedMessage.recipients.length > 0 && (
                                <p className={cn(
                                  'text-sm',
                                  isDark ? 'text-gray-400' : 'text-gray-600'
                                )}>
                                  {selectedMessage.recipients.map(r => r.email).join(', ')}
                                </p>
                              )}
                            </div>
                            <div className={cn(
                              'text-sm flex items-center gap-2',
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              <Calendar className="w-4 h-4" />
                              Last edited: {selectedMessage.lastEditedDate.toLocaleDateString()} at {selectedMessage.lastEditedDate.toLocaleTimeString()}
                            </div>
                          </div>
                          
                          {/* CC */}
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Message Body */}
                {editingDraftId === selectedMessage.id ? (
                  <div className="mb-4">
                    <textarea
                      value={editedBody}
                      onChange={(e) => setEditedBody(e.target.value)}
                      onBlur={handleAutoSave}
                      rows={15}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg border-2 text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-amber-500',
                        'resize-none',
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      )}
                      placeholder="Write your message here..."
                    />
                    
                    {/* Word/Character count */}
                    <div className={cn(
                      'mt-2 text-xs flex justify-end gap-4',
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    )}>
                      <span>Words: {editedBody.split(/\s+/).filter(w => w.length > 0).length}</span>
                      <span>Characters: {editedBody.length}</span>
                    </div>
                  </div>
                ) : (
                  <div className={cn(
                    'prose max-w-none mb-8 whitespace-pre-wrap',
                    isDark ? 'prose-invert' : ''
                  )}>
                    {selectedMessage.body}
                  </div>
                )}
                
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
                          {editingDraftId === selectedMessage.id && (
                            <button
                              className={cn(
                                'p-2 rounded-lg transition-colors cursor-pointer',
                                isDark
                                  ? 'hover:bg-gray-600 text-red-400'
                                  : 'hover:bg-gray-200 text-red-500'
                              )}
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {editingDraftId === selectedMessage.id && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'mt-3 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2',
                          'border-2 border-dashed w-full justify-center',
                          isDark
                            ? 'border-gray-600 text-gray-400 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50',
                          'cursor-pointer'
                        )}
                      >
                        <Plus className="w-4 h-4" />
                        Add Attachment
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center">
                <FileText className={cn(
                  'w-16 h-16 mx-auto mb-4',
                  isDark ? 'text-gray-700' : 'text-gray-300'
                )} />
                <h3 className={cn(
                  'text-lg font-semibold mb-2',
                  isDark ? 'text-white' : 'text-gray-900'
                )}>
                  No draft selected
                </h3>
                <p className={cn(
                  'text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Select a draft from the list to edit or continue working on it
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Draft;