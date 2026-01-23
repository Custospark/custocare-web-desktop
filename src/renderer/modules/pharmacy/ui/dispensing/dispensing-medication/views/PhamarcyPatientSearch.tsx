/**
 * ============================================================================
 * PHARMACY PATIENT SEARCH COMPONENT
 * ============================================================================
 * 
 * Pharmacy-specific patient search component that extends the base PatientSearch
 * component with pharmacy-related operations:
 * - Patient search with pharmacy context
 * - Navigation to prescription dispensing
 * - Create new patient option when not found
 * - Integration with pharmacy workflow
 * 
 * @module PharmacyPatientSearch
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, UserPlus } from 'lucide-react';
import PatientSearch from './PatientSearch';
import type { PatientSearchResult } from '../../../../api/dispensing/patient-search/usePatientTypes';
import { formatPatientName } from '../../../../api/dispensing/patient-search/usePatientTypes';
import { cn } from '../../../../../../shared/types/cn';
import { PHARMACY_ROUTES } from '../../../../../../app/routes/routeConstants';

/* -------------------------------------------------------------------------- */
/*                              COMPONENT PROPS                               */
/* -------------------------------------------------------------------------- */

export interface PharmacyPatientSearchProps {
  theme: 'light' | 'dark';
  onPatientCreateClick?: () => void;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*                      PHARMACY PATIENT SEARCH COMPONENT                     */
/* -------------------------------------------------------------------------- */

const PharmacyPatientSearch: React.FC<PharmacyPatientSearchProps> = ({
  theme,
  onPatientCreateClick,
  className,
}) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);

  /* -------------------------------------------------------------------------- */
  /*                              EVENT HANDLERS                                */
  /* -------------------------------------------------------------------------- */

  const handlePatientSelect = useCallback((patient: PatientSearchResult) => {
    setSelectedPatient(patient);
  }, []);

  const handleProceedToDispense = useCallback(() => {
    if (selectedPatient) {
      navigate(
        `${PHARMACY_ROUTES.DISPENSING_SEARCH_PRESCRIPTION}?patientId=${selectedPatient.patient_number}`
      );
    }
  }, [selectedPatient, navigate]);

  const handleCreateNewPatient = useCallback(() => {
    if (onPatientCreateClick) {
      onPatientCreateClick();
    }
  }, [onPatientCreateClick]);

  /* -------------------------------------------------------------------------- */
  /*                              THEME COLORS                                  */
  /* -------------------------------------------------------------------------- */

  const colors = {
    bg: {
      elevated: isDark ? 'bg-gray-800' : 'bg-white',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-300',
    },
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
    },
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: isDark 
        ? 'bg-green-600 hover:bg-green-700 text-white'
        : 'bg-green-600 hover:bg-green-700 text-white',
    },
  };

  /* -------------------------------------------------------------------------- */
  /*                              RENDER COMPONENT                              */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('p-6', className)}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className={cn('text-2xl font-bold mb-2', colors.text.primary)}>
            Search Patient
          </h2>
          <p className={colors.text.secondary}>
            Search by patient number to begin dispensing
          </p>
        </div>

        {/* Patient Search Component */}
        <PatientSearch
          theme={theme}
          onPatientSelect={handlePatientSelect}
          searchPlaceholder="Enter patient number (e.g., PN12345)"
          showContactInfo={true}
          autoFocus={true}
        />

        {/* Selected Patient Actions */}
        {selectedPatient && (
          <div
            className={cn(
              'rounded-xl border p-6 space-y-4',
              colors.bg.elevated,
              colors.border.primary
            )}
          >
            {/* Patient Summary */}
            <div className="flex items-center justify-between">
              <div>
                <div className={cn('text-sm font-medium', colors.text.secondary)}>
                  Selected Patient
                </div>
                <div className={cn('text-lg font-semibold', colors.text.primary)}>
                  {formatPatientName(selectedPatient)}
                </div>
                <div className={cn('text-sm', colors.text.secondary)}>
                  Patient #: {selectedPatient.patient_number}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Proceed to Dispense */}
              <button
                onClick={handleProceedToDispense}
                className={cn(
                  'w-full py-3 rounded-lg font-medium transition-colors',
                  'flex items-center justify-center gap-2',
                  colors.button.primary
                )}
              >
                Proceed to Dispense Medication
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Secondary Action - Clear Selection */}
              <button
                onClick={() => setSelectedPatient(null)}
                className={cn(
                  'w-full py-2 rounded-lg font-medium transition-colors',
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                )}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Create New Patient Section */}
        {onPatientCreateClick && (
          <div
            className={cn(
              'rounded-xl border p-6 text-center',
              colors.bg.elevated,
              colors.border.primary
            )}
          >
            <h3 className={cn('text-lg font-semibold mb-2', colors.text.primary)}>
              Patient Not Found?
            </h3>
            <p className={cn('mb-4', colors.text.secondary)}>
              If the patient doesn't exist in the system, you can create a new patient record
            </p>
            <button
              onClick={handleCreateNewPatient}
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors',
                colors.button.secondary
              )}
            >
              <UserPlus className="w-5 h-5" />
              Create New Patient
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

PharmacyPatientSearch.displayName = 'PharmacyPatientSearch';

export default PharmacyPatientSearch;