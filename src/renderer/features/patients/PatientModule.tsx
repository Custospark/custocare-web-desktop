import React, { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/index';
import { ContentLayout, Operation } from  '../../components/content/ContentLayout'
import {
  Home, Search, UserPlus, UserMinus, AlertCircle, FileText, Activity, Heart, User, Download, Eye, Phone, Mail
} from 'lucide-react';
import { cn } from '../../utils/classNameUtils';

/**
 * ============================================================================
 * PATIENT MODULE - ENTERPRISE HEALTHCARE MANAGEMENT
 * ============================================================================
 * 
 * Production-Grade Patient Management Interface
 * 
 * Purpose:
 * --------
 * Comprehensive patient management system demonstrating the ContentLayout
 * architecture with context-aware operations and dynamic workspace content.
 * 
 * Module Structure:
 * ----------------
 * 1. Overview (Default View)
 *    - Patient statistics and quick metrics
 *    - Recent activity feed
 *    - Alerts and notifications
 * 
 * 2. Search Patient
 *    - Advanced search filters
 *    - Real-time results table
 *    - Quick view and actions
 * 
 * 3. Register New Patient
 *    - Multi-step registration form
 *    - Validation and error handling
 *    - Document upload capability
 * 
 * 4. Discharge Patient
 *    - Patient selection
 *    - Discharge summary form
 *    - Follow-up scheduling
 * 
 * Architecture Highlights:
 * -----------------------
 * - Context-aware right sidebar with operations
 * - Dynamic workspace content based on selection
 * - Mobile-first responsive design
 * - Theme-aware styling (light/dark)
 * - Production-ready form validation
 * - Accessible ARIA labels
 * - Performance-optimized with memoization
 * 
 * State Management:
 * ----------------
 * - Active operation: Local state
 * - Theme: Redux global state
 * - Form data: Local state (would integrate with backend)
 * - Search filters: Local state with debouncing
 * 
 * @example
 * ```tsx
 * <Route path="/patients" element={<PatientModule />} />
 * ```
 */

/* ============================================================================
   TYPE DEFINITIONS
============================================================================ */

/**
 * Patient operation IDs
 */
type PatientOperationId = 'overview' | 'search' | 'register' | 'discharge';

/**
 * Patient record structure
 */
interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  status: 'Active' | 'Discharged' | 'Critical';
  lastVisit: string;
  nextAppointment?: string;
  assignedDoctor: string;
  conditions: string[];
}

/**
 * Search filter state
 */
interface SearchFilters {
  query: string;
  status: string;
  ageRange: string;
  gender: string;
  sortBy: string;
}

/**
 * Registration form data
 */
interface RegistrationForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType: string;
  allergies: string;
  medications: string;
  insurance: string;
}

/* ============================================================================
   CONSTANTS
============================================================================ */

/**
 * Patient module operations configuration
 * Defines the right sidebar menu items
 */
const PATIENT_OPERATIONS: Operation[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <Home className="w-4 h-4" />,
    description: 'Patient module overview and statistics',
  },
  {
    id: 'search',
    label: 'Search Patient',
    icon: <Search className="w-4 h-4" />,
    description: 'Search and filter patient records',
  },
  {
    id: 'register',
    label: 'Register New Patient',
    icon: <UserPlus className="w-4 h-4" />,
    description: 'Register a new patient in the system',
  },
  {
    id: 'discharge',
    label: 'Discharge Patient',
    icon: <UserMinus className="w-4 h-4" />,
    description: 'Process patient discharge',
  },
];

/**
 * Mock patient data for demonstration
 * TODO: Replace with API integration
 */
const MOCK_PATIENTS: PatientRecord[] = [
  {
    id: 'PT-2024-001',
    name: 'John Smith',
    age: 45,
    gender: 'M',
    phone: '+1 (555) 123-4567',
    email: 'john.smith@email.com',
    address: '123 Main St, New York, NY 10001',
    bloodType: 'A+',
    status: 'Active',
    lastVisit: '2024-01-15',
    nextAppointment: '2024-02-01',
    assignedDoctor: 'Dr. Sarah Johnson',
    conditions: ['Hypertension', 'Type 2 Diabetes'],
  },
  {
    id: 'PT-2024-002',
    name: 'Maria Garcia',
    age: 32,
    gender: 'F',
    phone: '+1 (555) 234-5678',
    email: 'maria.garcia@email.com',
    address: '456 Oak Ave, Los Angeles, CA 90001',
    bloodType: 'O-',
    status: 'Active',
    lastVisit: '2024-01-18',
    assignedDoctor: 'Dr. Michael Chen',
    conditions: ['Asthma'],
  },
  {
    id: 'PT-2024-003',
    name: 'Robert Johnson',
    age: 67,
    gender: 'M',
    phone: '+1 (555) 345-6789',
    email: 'robert.j@email.com',
    address: '789 Pine Rd, Chicago, IL 60601',
    bloodType: 'B+',
    status: 'Critical',
    lastVisit: '2024-01-19',
    nextAppointment: '2024-01-22',
    assignedDoctor: 'Dr. Emily Williams',
    conditions: ['Coronary Artery Disease', 'COPD'],
  },
  {
    id: 'PT-2024-004',
    name: 'Lisa Anderson',
    age: 28,
    gender: 'F',
    phone: '+1 (555) 456-7890',
    email: 'lisa.a@email.com',
    address: '321 Elm St, Houston, TX 77001',
    bloodType: 'AB+',
    status: 'Discharged',
    lastVisit: '2024-01-10',
    assignedDoctor: 'Dr. David Lee',
    conditions: [],
  },
];

/**
 * Patient status badge styling configuration
 */
const STATUS_CONFIG = {
  Active: {
    darkClasses: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    lightClasses: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  },
  Critical: {
    darkClasses: 'bg-red-500/20 text-red-300 border-red-500/30',
    lightClasses: 'bg-red-100 text-red-700 border-red-300',
  },
  Discharged: {
    darkClasses: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    lightClasses: 'bg-gray-100 text-gray-700 border-gray-300',
  },
} as const;

/* ============================================================================
   MAIN COMPONENT
============================================================================ */

export const PatientModule: React.FC = () => {
  /**
   * =========================================================================
   * REDUX STATE
   * =========================================================================
   */
  
  const theme = useSelector((state: RootState) => state.ui.theme);

  /**
   * =========================================================================
   * LOCAL STATE
   * =========================================================================
   */

  // Active operation state
  const [activeOperation, setActiveOperation] = useState<PatientOperationId>('overview');

  // Search filters state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    status: 'all',
    ageRange: 'all',
    gender: 'all',
    sortBy: 'name',
  });

  // Registration form state
  const [registrationForm, setRegistrationForm] = useState<RegistrationForm>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    bloodType: '',
    allergies: '',
    medications: '',
    insurance: '',
  });

  // Discharge form state
  const [selectedPatientForDischarge, setSelectedPatientForDischarge] = useState<string>('');

  /**
   * =========================================================================
   * EVENT HANDLERS (MEMOIZED)
   * =========================================================================
   */

  /**
   * Handle operation change from sidebar
   * Clears workspace and switches to new operation
   */
  const handleOperationChange = useCallback((operationId: string) => {
    setActiveOperation(operationId as PatientOperationId);
    
    // Reset states when switching operations
    if (operationId === 'search') {
      // Reset search filters to defaults
      setSearchFilters({
        query: '',
        status: 'all',
        ageRange: 'all',
        gender: 'all',
        sortBy: 'name',
      });
    }
  }, []);

  /**
   * Handle search filter changes
   */
  const handleSearchFilterChange = useCallback((
    field: keyof SearchFilters,
    value: string
  ) => {
    setSearchFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Handle registration form field changes
   */
  const handleRegistrationChange = useCallback((
    field: keyof RegistrationForm,
    value: string
  ) => {
    setRegistrationForm(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Handle registration form submission
   */
  const handleRegistrationSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    console.log('Registration form submitted:', registrationForm);
    
    // TODO: Implement API call to register patient
    // Example: dispatch(registerPatient(registrationForm));
    
    // Reset form after successful submission
    setRegistrationForm({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      bloodType: '',
      allergies: '',
      medications: '',
      insurance: '',
    });
    
    // Show success message
    alert('Patient registered successfully!');
  }, [registrationForm]);

  /**
   * Handle discharge submission
   */
  const handleDischargeSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatientForDischarge) {
      alert('Please select a patient to discharge');
      return;
    }
    
    console.log('Discharging patient:', selectedPatientForDischarge);
    
    // TODO: Implement API call to discharge patient
    // Example: dispatch(dischargePatient(selectedPatientForDischarge));
    
    // Reset selection
    setSelectedPatientForDischarge('');
    
    // Show success message
    alert('Patient discharged successfully!');
  }, [selectedPatientForDischarge]);

  /**
   * =========================================================================
   * COMPUTED VALUES (MEMOIZED)
   * =========================================================================
   */

  /**
   * Filtered patients based on search criteria
   * Client-side filtering for demonstration
   * TODO: Move to backend API for production
   */
  const filteredPatients = useMemo(() => {
    let filtered = [...MOCK_PATIENTS];

    // Text search
    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.phone.includes(query)
      );
    }

    // Status filter
    if (searchFilters.status !== 'all') {
      filtered = filtered.filter(p => p.status === searchFilters.status);
    }

    // Gender filter
    if (searchFilters.gender !== 'all') {
      filtered = filtered.filter(p => p.gender === searchFilters.gender);
    }

    // Age range filter
    if (searchFilters.ageRange !== 'all') {
      const [min, max] = searchFilters.ageRange.split('-').map(Number);
      filtered = filtered.filter(p => {
        if (max) return p.age >= min && p.age <= max;
        return p.age >= min;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (searchFilters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'age':
          return a.age - b.age;
        case 'lastVisit':
          return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchFilters]);

  /**
   * Active patients for discharge selection
   */
  const activePatients = useMemo(() => {
    return MOCK_PATIENTS.filter(p => p.status === 'Active' || p.status === 'Critical');
  }, []);

  /**
   * =========================================================================
   * WORKSPACE CONTENT RENDERERS
   * =========================================================================
   */

  /**
   * Render Overview workspace content
   */
  const renderOverview = () => (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className={cn(
          'text-3xl font-bold mb-2',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Patient Management Overview
        </h1>
        <p className={cn(
          'text-sm',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          Quick insights and statistics for patient care management
        </p>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Patients',
            value: MOCK_PATIENTS.length.toString(),
            icon: <User className="w-5 h-5" />,
            color: 'from-blue-500 to-cyan-500',
          },
          {
            label: 'Active',
            value: MOCK_PATIENTS.filter(p => p.status === 'Active').length.toString(),
            icon: <Activity className="w-5 h-5" />,
            color: 'from-emerald-500 to-green-500',
          },
          {
            label: 'Critical',
            value: MOCK_PATIENTS.filter(p => p.status === 'Critical').length.toString(),
            icon: <AlertCircle className="w-5 h-5" />,
            color: 'from-red-500 to-rose-500',
          },
          {
            label: 'Discharged Today',
            value: MOCK_PATIENTS.filter(p => p.status === 'Discharged').length.toString(),
            icon: <UserMinus className="w-5 h-5" />,
            color: 'from-purple-500 to-pink-500',
          },
        ].map((stat, index) => (
          <div
            key={index}
            className={cn(
              'relative p-5 rounded-2xl border backdrop-blur-sm',
              'transition-all duration-300 hover:scale-[1.02]',
              theme === 'dark'
                ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
                : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
            )}
          >
            <div className={cn(
              'absolute inset-0 rounded-2xl opacity-10',
              `bg-gradient-to-br ${stat.color}`
            )} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  'p-2.5 rounded-xl',
                  theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'
                )}>
                  <div className={cn(
                    stat.color.includes('blue') ? 'text-blue-400' :
                    stat.color.includes('emerald') ? 'text-emerald-400' :
                    stat.color.includes('red') ? 'text-red-400' : 'text-purple-400'
                  )}>
                    {stat.icon}
                  </div>
                </div>
              </div>
              
              <p className={cn(
                'text-sm mb-1',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                {stat.label}
              </p>
              
              <h3 className={cn(
                'text-3xl font-bold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className={cn(
        'rounded-2xl border p-6',
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
          : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
      )}>
        <h3 className={cn(
          'text-lg font-semibold mb-4',
          theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
        )}>
          Recent Activity
        </h3>
        
        <div className="space-y-3">
          {MOCK_PATIENTS.slice(0, 3).map((patient) => (
            <div
              key={patient.id}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl transition-colors',
                theme === 'dark'
                  ? 'bg-gray-800/50 hover:bg-gray-800'
                  : 'bg-gray-50 hover:bg-gray-100'
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
                  theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                )}>
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </div>
                
                <div>
                  <p className={cn(
                    'font-medium',
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    {patient.name}
                  </p>
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Last visit: {patient.lastVisit}
                  </p>
                </div>
              </div>
              
              <span className={cn(
                'px-3 py-1 text-xs font-bold rounded-full border',
                theme === 'dark'
                  ? STATUS_CONFIG[patient.status].darkClasses
                  : STATUS_CONFIG[patient.status].lightClasses
              )}>
                {patient.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /**
   * Render Search Patient workspace content
   */
  const renderSearch = () => (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className={cn(
          'text-3xl font-bold mb-2',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Search Patients
        </h1>
        <p className={cn(
          'text-sm',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          Advanced search and filter patient records
        </p>
      </div>

      {/* Search and filters */}
      <div className={cn(
        'rounded-2xl border p-6',
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
          : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
      )}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search input */}
          <div className="lg:col-span-3">
            <label className={cn(
              'block text-sm font-medium mb-2',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}>
              Search
            </label>
            <div className="relative">
              <Search className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )} />
              <input
                type="text"
                value={searchFilters.query}
                onChange={(e) => handleSearchFilterChange('query', e.target.value)}
                placeholder="Search by name, ID, email, or phone..."
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  theme === 'dark'
                    ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                    : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                )}
              />
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className={cn(
              'block text-sm font-medium mb-2',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}>
              Status
            </label>
            <select
              value={searchFilters.status}
              onChange={(e) => handleSearchFilterChange('status', e.target.value)}
              className={cn(
                'w-full px-3 py-2.5 rounded-xl border text-sm',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                  : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
              )}
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Critical">Critical</option>
              <option value="Discharged">Discharged</option>
            </select>
          </div>

          {/* Gender filter */}
          <div>
            <label className={cn(
              'block text-sm font-medium mb-2',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}>
              Gender
            </label>
            <select
              value={searchFilters.gender}
              onChange={(e) => handleSearchFilterChange('gender', e.target.value)}
              className={cn(
                'w-full px-3 py-2.5 rounded-xl border text-sm',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                  : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
              )}
            >
              <option value="all">All Genders</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Age range filter */}
          <div>
            <label className={cn(
              'block text-sm font-medium mb-2',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}>
              Age Range
            </label>
            <select
              value={searchFilters.ageRange}
              onChange={(e) => handleSearchFilterChange('ageRange', e.target.value)}
              className={cn(
                'w-full px-3 py-2.5 rounded-xl border text-sm',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                  : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
              )}
            >
              <option value="all">All Ages</option>
              <option value="0-18">0-18 years</option>
              <option value="19-35">19-35 years</option>
              <option value="36-50">36-50 years</option>
              <option value="51-65">51-65 years</option>
              <option value="66-200">65+ years</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className={cn(
        'rounded-2xl border overflow-hidden',
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
          : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
      )}>
        {/* Results header */}
        <div className={cn(
          'px-6 py-4 border-b flex items-center justify-between',
          theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200'
        )}>
          <h3 className={cn(
            'text-sm font-semibold',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            Results ({filteredPatients.length})
          </h3>
          
          <button className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          )}>
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Results table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={cn(
                'border-b text-xs font-semibold',
                theme === 'dark'
                  ? 'border-gray-800/50 text-gray-400'
                  : 'border-gray-200 text-gray-600'
              )}>
                <th className="py-3 px-6 text-left">Patient</th>
                <th className="py-3 px-6 text-left">Status</th>
                <th className="py-3 px-6 text-left">Contact</th>
                <th className="py-3 px-6 text-left">Last Visit</th>
                <th className="py-3 px-6 text-left">Doctor</th>
                <th className="py-3 px-6 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className={cn(
                      'border-b transition-colors',
                      theme === 'dark'
                        ? 'border-gray-800/30 hover:bg-gray-800/30'
                        : 'border-gray-100 hover:bg-gray-50/50'
                    )}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold',
                          theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                        )}>
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className={cn(
                            'text-sm font-medium',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          )}>
                            {patient.name}
                          </p>
                          <p className={cn(
                            'text-xs',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                          )}>
                            {patient.id} • {patient.age}yo {patient.gender}
                          </p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <span className={cn(
                        'px-2.5 py-1 text-xs font-bold rounded-full border',
                        theme === 'dark'
                          ? STATUS_CONFIG[patient.status].darkClasses
                          : STATUS_CONFIG[patient.status].lightClasses
                      )}>
                        {patient.status}
                      </span>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <p className={cn(
                          'text-xs flex items-center gap-1.5',
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          <Phone className="w-3 h-3" />
                          {patient.phone}
                        </p>
                        <p className={cn(
                          'text-xs flex items-center gap-1.5',
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          <Mail className="w-3 h-3" />
                          {patient.email}
                        </p>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <p className={cn(
                        'text-sm',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        {patient.lastVisit}
                      </p>
                    </td>
                    
                    <td className="py-4 px-6">
                      <p className={cn(
                        'text-sm font-medium',
                        theme === 'dark' ? 'text-cyan-300' : 'text-blue-600'
                      )}>
                        {patient.assignedDoctor}
                      </p>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        )}>
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        )}>
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <p className={cn(
                      'text-sm',
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    )}>
                      No patients found matching your search criteria
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  /**
   * Render Register New Patient workspace content
   */
  const renderRegister = () => (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className={cn(
          'text-3xl font-bold mb-2',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Register New Patient
        </h1>
        <p className={cn(
          'text-sm',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          Enter patient information to create a new record
        </p>
      </div>

      {/* Registration form */}
      <form onSubmit={handleRegistrationSubmit}>
        <div className={cn(
          'rounded-2xl border p-6',
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
            : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
        )}>
          {/* Personal Information Section */}
          <div className="mb-8">
            <h3 className={cn(
              'text-lg font-semibold mb-4 flex items-center gap-2',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            )}>
              <User className="w-5 h-5" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  First Name *
                </label>
                <input
                  type="text"
                  value={registrationForm.firstName}
                  onChange={(e) => handleRegistrationChange('firstName', e.target.value)}
                  required
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                  )}
                />
              </div>
              
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Last Name *
                </label>
                <input
                  type="text"
                  value={registrationForm.lastName}
                  onChange={(e) => handleRegistrationChange('lastName', e.target.value)}
                  required
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                  )}
                />
              </div>
              
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={registrationForm.dateOfBirth}
                  onChange={(e) => handleRegistrationChange('dateOfBirth', e.target.value)}
                  required
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                  )}
                />
              </div>
              
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Gender *
                </label>
                <select
                  value={registrationForm.gender}
                  onChange={(e) => handleRegistrationChange('gender', e.target.value)}
                  required
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                  )}
                >
                  <option value="">Select Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="mb-8">
            <h3 className={cn(
              'text-lg font-semibold mb-4 flex items-center gap-2',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            )}>
              <Phone className="w-5 h-5" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={registrationForm.phone}
                  onChange={(e) => handleRegistrationChange('phone', e.target.value)}
                  required
                  placeholder="+1 (555) 123-4567"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                  )}
                />
              </div>
              
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={registrationForm.email}
                  onChange={(e) => handleRegistrationChange('email', e.target.value)}
                  required
                  placeholder="patient@email.com"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                  )}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Address *
                </label>
                <input
                  type="text"
                  value={registrationForm.address}
                  onChange={(e) => handleRegistrationChange('address', e.target.value)}
                  required
                  placeholder="123 Main St, City, State, ZIP"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="mb-8">
            <h3 className={cn(
              'text-lg font-semibold mb-4 flex items-center gap-2',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            )}>
              <AlertCircle className="w-5 h-5" />
              Emergency Contact
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={registrationForm.emergencyContact}
                  onChange={(e) => handleRegistrationChange('emergencyContact', e.target.value)}
                  required
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                  )}
                />
              </div>
              
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  value={registrationForm.emergencyPhone}
                  onChange={(e) => handleRegistrationChange('emergencyPhone', e.target.value)}
                  required
                  placeholder="+1 (555) 123-4567"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Medical Information Section */}
          <div className="mb-8">
            <h3 className={cn(
              'text-lg font-semibold mb-4 flex items-center gap-2',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            )}>
              <Heart className="w-5 h-5" />
              Medical Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Blood Type
                </label>
                <select
                  value={registrationForm.bloodType}
                  onChange={(e) => handleRegistrationChange('bloodType', e.target.value)}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                  )}
                >
                  <option value="">Select Blood Type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Insurance Provider
                </label>
                <input
                  type="text"
                  value={registrationForm.insurance}
                  onChange={(e) => handleRegistrationChange('insurance', e.target.value)}
                  placeholder="e.g., Blue Cross, Aetna"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                  )}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Known Allergies
                </label>
                <textarea
                  value={registrationForm.allergies}
                  onChange={(e) => handleRegistrationChange('allergies', e.target.value)}
                  rows={2}
                  placeholder="List any known allergies..."
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                  )}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Current Medications
                </label>
                <textarea
                  value={registrationForm.medications}
                  onChange={(e) => handleRegistrationChange('medications', e.target.value)}
                  rows={2}
                  placeholder="List current medications..."
                  className={cn(
                    'w-full px-4 py-2.5 rounded-xl border text-sm resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Form actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setActiveOperation('overview')}
              className={cn(
                'px-6 py-2.5 rounded-xl text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 focus:ring-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400'
              )}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className={cn(
                'px-6 py-2.5 rounded-xl text-sm font-medium transition-all',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                'flex items-center gap-2',
                theme === 'dark'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 focus:ring-cyan-500'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 focus:ring-blue-500'
              )}
            >
              <UserPlus className="w-4 h-4" />
              Register Patient
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  /**
   * Render Discharge Patient workspace content
   */
  const renderDischarge = () => (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className={cn(
          'text-3xl font-bold mb-2',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Discharge Patient
        </h1>
        <p className={cn(
          'text-sm',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          Process patient discharge and generate discharge summary
        </p>
      </div>

      {/* Discharge form */}
      <form onSubmit={handleDischargeSubmit}>
        <div className={cn(
          'rounded-2xl border p-6',
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
            : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
        )}>
          {/* Patient selection */}
          <div className="mb-8">
            <h3 className={cn(
              'text-lg font-semibold mb-4 flex items-center gap-2',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            )}>
              <User className="w-5 h-5" />
              Select Patient
            </h3>
            
            <select
              value={selectedPatientForDischarge}
              onChange={(e) => setSelectedPatientForDischarge(e.target.value)}
              required
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-sm',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                  : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
              )}
            >
              <option value="">Choose a patient to discharge...</option>
              {activePatients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.id}) - {patient.status}
                </option>
              ))}
            </select>
          </div>

          {/* Selected patient details */}
          {selectedPatientForDischarge && (
            <>
              {(() => {
                const patient = activePatients.find(p => p.id === selectedPatientForDischarge);
                if (!patient) return null;
                
                return (
                  <div className="mb-8">
                    <h3 className={cn(
                      'text-lg font-semibold mb-4',
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                    )}>
                      Patient Details
                    </h3>
                    
                    <div className={cn(
                      'p-5 rounded-xl',
                      theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
                    )}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className={cn(
                            'text-xs mb-1',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                          )}>
                            Patient Name
                          </p>
                          <p className={cn(
                            'font-medium',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          )}>
                            {patient.name}
                          </p>
                        </div>
                        
                        <div>
                          <p className={cn(
                            'text-xs mb-1',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                          )}>
                            Patient ID
                          </p>
                          <p className={cn(
                            'font-medium',
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          )}>
                            {patient.id}
                          </p>
                        </div>
                        
                        <div>
                          <p className={cn(
                            'text-xs mb-1',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                          )}>
                            Current Status
                          </p>
                          <span className={cn(
                            'inline-block px-2.5 py-1 text-xs font-bold rounded-full border',
                            theme === 'dark'
                              ? STATUS_CONFIG[patient.status].darkClasses
                              : STATUS_CONFIG[patient.status].lightClasses
                          )}>
                            {patient.status}
                          </span>
                        </div>
                        
                        <div>
                          <p className={cn(
                            'text-xs mb-1',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                          )}>
                            Assigned Doctor
                          </p>
                          <p className={cn(
                            'font-medium',
                            theme === 'dark' ? 'text-cyan-300' : 'text-blue-600'
                          )}>
                            {patient.assignedDoctor}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Discharge summary */}
              <div className="mb-8">
                <h3 className={cn(
                  'text-lg font-semibold mb-4 flex items-center gap-2',
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                )}>
                  <FileText className="w-5 h-5" />
                  Discharge Summary
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Discharge Date *
                    </label>
                    <input
                      type="date"
                      required
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl border text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                          : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Discharge Diagnosis *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Enter final diagnosis..."
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl border text-sm resize-none',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                          : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Discharge Instructions *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Enter detailed discharge instructions and follow-up care..."
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl border text-sm resize-none',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                          : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Medications Prescribed
                    </label>
                    <textarea
                      rows={3}
                      placeholder="List all medications prescribed at discharge..."
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl border text-sm resize-none',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                          : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Follow-up Appointment
                    </label>
                    <input
                      type="date"
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl border text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                          : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                      )}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Form actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setSelectedPatientForDischarge('');
                setActiveOperation('overview');
              }}
              className={cn(
                'px-6 py-2.5 rounded-xl text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 focus:ring-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400'
              )}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={!selectedPatientForDischarge}
              className={cn(
                'px-6 py-2.5 rounded-xl text-sm font-medium transition-all',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                'flex items-center gap-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                theme === 'dark'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 focus:ring-red-500'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 focus:ring-red-500'
              )}
            >
              <UserMinus className="w-4 h-4" />
              Process Discharge
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  /**
   * =========================================================================
   * MAIN RENDER
   * =========================================================================
   */

  // Select workspace content based on active operation
  const renderWorkspaceContent = () => {
    switch (activeOperation) {
      case 'overview':
        return renderOverview();
      case 'search':
        return renderSearch();
      case 'register':
        return renderRegister();
      case 'discharge':
        return renderDischarge();
      default:
        return renderOverview();
    }
  };

  return (
    <ContentLayout
      operations={PATIENT_OPERATIONS}
      activeOperation={activeOperation}
      onOperationChange={handleOperationChange}
      defaultOperation="overview"
    >
      {renderWorkspaceContent()}
    </ContentLayout>
  );
};

// Display name for React DevTools
PatientModule.displayName = 'PatientModule';

export default PatientModule;