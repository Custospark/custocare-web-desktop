import React, { useMemo } from 'react';
import { Search, Download, Eye, FileText, Phone, Mail } from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import { MOCK_PATIENTS, STATUS_CONFIG, type SearchFilters, } from './types';

/**
 * ============================================================================
 * PATIENT SEARCH COMPONENT
 * ============================================================================
 * 
 * Advanced patient search with filters and results table.
 * 
 * Features:
 * - Real-time text search (name, ID, email, phone)
 * - Multiple filter options (status, gender, age range)
 * - Client-side filtering and sorting
 * - Interactive results table
 * - Export functionality
 * - Quick action buttons
 */

interface PatientSearchProps {
  theme: 'light' | 'dark';
  searchFilters: SearchFilters;
  onFilterChange: (field: keyof SearchFilters, value: string) => void;
}

export const PatientSearch: React.FC<PatientSearchProps> = ({
  theme,
  searchFilters,
  onFilterChange,
}) => {
  /**
   * Filtered patients based on search criteria
   * Memoized for performance optimization
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
   * Handle export functionality
   * TODO: Implement actual export (CSV, PDF, etc.)
   */
  const handleExport = () => {
    console.log('Exporting patients:', filteredPatients);
    alert('Export functionality will be implemented');
  };

  return (
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
                onChange={(e) => onFilterChange('query', e.target.value)}
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
              onChange={(e) => onFilterChange('status', e.target.value)}
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
              onChange={(e) => onFilterChange('gender', e.target.value)}
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
              onChange={(e) => onFilterChange('ageRange', e.target.value)}
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
          
          <button
            onClick={handleExport}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
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
                        <button
                          onClick={() => console.log('View patient:', patient.id)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            theme === 'dark'
                              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          )}
                          aria-label="View patient details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => console.log('View records:', patient.id)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            theme === 'dark'
                              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          )}
                          aria-label="View medical records"
                        >
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
};

PatientSearch.displayName = 'PatientSearch';