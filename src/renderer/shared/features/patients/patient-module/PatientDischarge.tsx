import React, { useMemo } from 'react';
import { User, FileText, UserMinus } from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import { MOCK_PATIENTS, STATUS_CONFIG } from './types';

/**
 * ============================================================================
 * PATIENT DISCHARGE COMPONENT
 * ============================================================================
 * 
 * Process patient discharge with discharge summary form.
 * 
 * Features:
 * - Patient selection dropdown (Active/Critical only)
 * - Patient details display
 * - Discharge summary form
 * - Discharge date and diagnosis
 * - Instructions and medications
 * - Follow-up appointment scheduling
 * - Form validation
 */

interface PatientDischargeProps {
  theme: 'light' | 'dark';
  selectedPatientId: string;
  onPatientSelect: (patientId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const PatientDischarge: React.FC<PatientDischargeProps> = ({
  theme,
  selectedPatientId,
  onPatientSelect,
  onSubmit,
  onCancel,
}) => {
  /**
   * Filter active patients eligible for discharge
   * Memoized for performance
   */
  const activePatients = useMemo(() => {
    return MOCK_PATIENTS.filter(p => p.status === 'Active' || p.status === 'Critical');
  }, []);

  /**
   * Get selected patient details
   */
  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return activePatients.find(p => p.id === selectedPatientId);
  }, [selectedPatientId, activePatients]);

  return (
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
      <form onSubmit={onSubmit}>
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
              value={selectedPatientId}
              onChange={(e) => onPatientSelect(e.target.value)}
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
          {selectedPatient && (
            <>
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
                        {selectedPatient.name}
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
                        {selectedPatient.id}
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
                          ? STATUS_CONFIG[selectedPatient.status].darkClasses
                          : STATUS_CONFIG[selectedPatient.status].lightClasses
                      )}>
                        {selectedPatient.status}
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
                        {selectedPatient.assignedDoctor}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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
              onClick={onCancel}
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
              disabled={!selectedPatientId}
              className={cn(
                'px-6 py-2.5 rounded-xl text-sm font-medium transition-all',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                'flex items-center gap-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                theme === 'dark'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 focus:ring-red-500 disabled:hover:from-red-600 disabled:hover:to-rose-600'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 focus:ring-red-500 disabled:hover:from-red-600 disabled:hover:to-rose-600'
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
};

PatientDischarge.displayName = 'PatientDischarge';