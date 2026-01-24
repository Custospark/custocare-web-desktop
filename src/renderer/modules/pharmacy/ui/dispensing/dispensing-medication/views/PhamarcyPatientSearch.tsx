import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, AlertTriangle } from 'lucide-react';

import PatientSearch from './PatientSearch';
import { useConfirm } from '../../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { cn } from '../../../../../../shared/utils/classNameUtils';

import type { PatientSearchResult } from '../../../../api/dispensing/patient-search/usePatientTypes';
import { PatientStatus } from '../../../../api/dispensing/patient-search/usePatientTypes';
import { PHARMACY_ROUTES } from '../../../../../../app/routes/routeConstants';

interface PharmacyPatientSearchProps {
  theme: 'light' | 'dark';
  className?: string;
}

const PharmacyPatientSearch: React.FC<PharmacyPatientSearchProps> = ({ theme, className }) => {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const isDark = theme === 'dark';

  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);

  const requiresIsolation = useMemo(() => Boolean(selectedPatient?.requires_isolation), [selectedPatient]);
  const isDeceased = useMemo(() => selectedPatient?.status === PatientStatus.DECEASED, [selectedPatient]);
  const isTestPatient = useMemo(() => selectedPatient?.status === PatientStatus.TEST_PATIENT, [selectedPatient]);

  const handleCreate = useCallback(() => {
    navigate(PHARMACY_ROUTES.DISPENSING_QUICK_CREATE);
  }, [navigate]);

  const proceedToDispense = useCallback(async (patient: PatientSearchResult) => {
    if (patient.requires_isolation) {
      const ok = await confirm({
        title: 'Patient Requires Isolation',
        message: 'This patient requires isolation. Please ensure you are wearing appropriate PPE before proceeding.',
        confirmText: 'Proceed Anyway',
        cancelText: 'Cancel',
        variant: 'warning',
        theme,
      });
      if (!ok) return;
    }

    if (patient.status === PatientStatus.DECEASED) {
      const ok = await confirm({
        title: 'Patient is Deceased',
        message: 'This patient is marked as deceased. Are you sure you want to proceed with dispensing?',
        confirmText: 'Yes, Proceed',
        cancelText: 'Cancel',
        variant: 'danger',
        theme,
      });
      if (!ok) return;
    }

    if (patient.status === PatientStatus.TEST_PATIENT) {
      const ok = await confirm({
        title: 'Test Patient Record',
        message: 'This is a test patient record. Dispensing actions should not be treated as real-world dispensing.',
        confirmText: 'Proceed',
        cancelText: 'Cancel',
        variant: 'warning',
        theme,
      });
      if (!ok) return;
    }

    navigate(`${PHARMACY_ROUTES.DISPENSING_SEARCH_PRESCRIPTION}?patientId=${patient.patient_number}`);
  }, [confirm, navigate, theme]);

  const renderWarnings = () => {
    if (!selectedPatient) return null;

    return (
      <div
        className={cn(
          'rounded-xl border p-6 mt-6',
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
          className
        )}
      >
        <div className="flex items-center gap-3 mb-4">
          <Pill className={cn('w-5 h-5', isDark ? 'text-blue-300' : 'text-blue-700')} />
          <div className={cn('font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
            Pharmacy Warnings
          </div>
        </div>

        <div className="space-y-3">
          {requiresIsolation && (
            <div
              className={cn(
                'p-4 rounded-lg flex items-start gap-3 border',
                isDark ? 'bg-yellow-900/20 border-yellow-800/50' : 'bg-yellow-50 border-yellow-100'
              )}
            >
              <AlertTriangle className={cn('w-5 h-5 mt-0.5', isDark ? 'text-yellow-400' : 'text-yellow-600')} />
              <div>
                <div className={cn('font-medium', isDark ? 'text-yellow-200' : 'text-yellow-900')}>
                  Isolation Required
                </div>
                <div className={cn('text-sm', isDark ? 'text-yellow-300' : 'text-yellow-700')}>
                  Ensure proper PPE before dispensing medication.
                </div>
              </div>
            </div>
          )}

          {isDeceased && (
            <div
              className={cn(
                'p-4 rounded-lg flex items-start gap-3 border',
                isDark ? 'bg-red-900/20 border-red-800/50' : 'bg-red-50 border-red-100'
              )}
            >
              <AlertTriangle className={cn('w-5 h-5 mt-0.5', isDark ? 'text-red-400' : 'text-red-600')} />
              <div>
                <div className={cn('font-medium', isDark ? 'text-red-200' : 'text-red-900')}>
                  Deceased Patient
                </div>
                <div className={cn('text-sm', isDark ? 'text-red-300' : 'text-red-700')}>
                  Please verify before dispensing.
                </div>
              </div>
            </div>
          )}

          {isTestPatient && (
            <div
              className={cn(
                'p-4 rounded-lg flex items-start gap-3 border',
                isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-100 border-gray-200'
              )}
            >
              <AlertTriangle className={cn('w-5 h-5 mt-0.5', isDark ? 'text-gray-400' : 'text-gray-600')} />
              <div>
                <div className={cn('font-medium', isDark ? 'text-gray-200' : 'text-gray-900')}>
                  Test Patient
                </div>
                <div className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-700')}>
                  Actions for test patients are not real-world dispensing.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn(className)}>
      <PatientSearch
        theme={theme}
        title="Pharmacy Patient Search"
        subtitle="Search by patient UUID, name, DOB, phone to begin dispensing"
        filters={{ status: PatientStatus.ACTIVE }}
        onPatientSelect={setSelectedPatient}
        onSearchSubmitted={() => {
          // analytics hook (optional)
          // console.log('[pharmacy] search submitted:', q);
        }}
        processAction={{
          label: 'Dispense',
          icon: <Pill className="w-4 h-4" />,
          onProcess: proceedToDispense,
          onlyWhenSelected: true,
        }}
        createAction={{
          label: 'Register New Patient',
          onCreate: () => handleCreate(),
        }}
      />

      {renderWarnings()}
    </div>
  );
};

PharmacyPatientSearch.displayName = 'PharmacyPatientSearch';
export default PharmacyPatientSearch;
