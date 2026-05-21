// src/modules/clinical/components/PatientSelector.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Search, UserPlus, User, AlertCircle, Phone, Calendar, FileText } from 'lucide-react';
import type { RootState } from '../../../../app/store/store';
import { cn } from '../../../utils/classNameUtils';
import type { Patient } from '../types/clinicalEncounterTypes';

interface PatientSelectorProps {
  onPatientSelected: (patient: Patient) => void;
  onCreateNewPatient: (patient: Patient) => void;
}

// Mock patient database
const MOCK_PATIENTS: Patient[] = [
  {
    id: 'PT-001',
    name: 'Sarah Nakato',
    age: 34,
    gender: 'Female',
    phone: '+256 700 123456',
    medicalRecordNumber: 'MRN-2024-001',
    allergies: ['Penicillin'],
    currentMedications: ['Metformin 500mg BD'],
    medicalHistory: ['Type 2 Diabetes', 'Hypertension']
  },
  {
    id: 'PT-002',
    name: 'John Okello',
    age: 45,
    gender: 'Male',
    phone: '+256 700 234567',
    medicalRecordNumber: 'MRN-2024-002',
    allergies: [],
    currentMedications: ['Lisinopril 10mg OD'],
    medicalHistory: ['Hypertension']
  },
  {
    id: 'PT-003',
    name: 'Grace Nambi',
    age: 28,
    gender: 'Female',
    phone: '+256 700 345678',
    medicalRecordNumber: 'MRN-2024-003',
    allergies: ['Sulfa drugs'],
    currentMedications: [],
    medicalHistory: []
  },
];

export const PatientSelector: React.FC<PatientSelectorProps> = ({
  onPatientSelected,
  onCreateNewPatient
}) => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // New patient form state
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    name: '',
    age: 0,
    gender: 'Male',
    phone: '',
    allergies: [],
    currentMedications: [],
    medicalHistory: []
  });

  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    if (searchQuery.trim() === '') return MOCK_PATIENTS;
    const query = searchQuery.toLowerCase();
    return MOCK_PATIENTS.filter(patient =>
      patient.name.toLowerCase().includes(query) ||
      patient.phone.includes(query) ||
      patient.medicalRecordNumber.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelectPatient = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
    onPatientSelected(patient);
  }, [onPatientSelected]);

  const handleCreatePatient = useCallback(() => {
    if (!newPatient.name || !newPatient.age || !newPatient.phone) {
      alert('Please fill in all required fields');
      return;
    }

    const patient: Patient = {
      id: `PT-${String(MOCK_PATIENTS.length + 1).padStart(3, '0')}`,
      name: newPatient.name!,
      age: newPatient.age!,
      gender: newPatient.gender || 'Male',
      phone: newPatient.phone!,
      medicalRecordNumber: `MRN-2024-${String(MOCK_PATIENTS.length + 1).padStart(3, '0')}`,
      allergies: newPatient.allergies || [],
      currentMedications: newPatient.currentMedications || [],
      medicalHistory: newPatient.medicalHistory || []
    };

    MOCK_PATIENTS.push(patient);
    onCreateNewPatient(patient);
    setShowNewPatientForm(false);
    setSelectedPatient(patient);
  }, [newPatient, onCreateNewPatient]);

  if (selectedPatient) {
    return (
      <div className={cn(
        'rounded-2xl border p-6 mb-6',
        theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
      )}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center',
              theme === 'dark' ? 'bg-cyan-500/20' : 'bg-blue-100'
            )}>
              <User className={cn(
                'w-8 h-8',
                theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
              )} />
            </div>
            
            <div>
              <h3 className={cn(
                'text-2xl font-bold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {selectedPatient.name}
              </h3>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className={cn(
                  'flex items-center gap-1',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  <Calendar className="w-4 h-4" />
                  {selectedPatient.age} years old
                </span>
                <span className={cn(
                  'flex items-center gap-1',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  <Phone className="w-4 h-4" />
                  {selectedPatient.phone}
                </span>
                <span className={cn(
                  'flex items-center gap-1',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  <FileText className="w-4 h-4" />
                  {selectedPatient.medicalRecordNumber}
                </span>
              </div>

              {/* Allergies & Medications Warning */}
              <div className="flex items-center gap-3 mt-4">
                {selectedPatient.allergies.length > 0 && (
                  <div className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium',
                    theme === 'dark' 
                      ? 'bg-red-900/30 text-red-300 border border-red-700' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  )}>
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Allergies: {selectedPatient.allergies.join(', ')}
                  </div>
                )}
                
                {selectedPatient.currentMedications.length > 0 && (
                  <div className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium',
                    theme === 'dark' 
                      ? 'bg-blue-900/30 text-blue-300 border border-blue-700' 
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  )}>
                    Current Medications: {selectedPatient.currentMedications.length}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedPatient(null)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm',
              theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            )}
          >
            Change Patient
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-2xl border p-6 mb-6',
      theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
    )}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={cn(
            'text-xl font-bold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Select or Create Patient
          </h3>
          <p className={cn(
            'text-sm mt-1',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            Search existing records or register new patient
          </p>
        </div>

        <button
          onClick={() => setShowNewPatientForm(!showNewPatientForm)}
          className={cn(
            'px-4 py-2 rounded-lg font-medium flex items-center gap-2',
            theme === 'dark' 
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          )}
        >
          <UserPlus className="w-4 h-4" />
          New Patient
        </button>
      </div>

      {!showNewPatientForm ? (
        <>
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, or MRN..."
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-xl border',
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              )}
            />
          </div>

          {/* Patient List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className={cn(
                    'w-full p-4 rounded-xl text-left transition-all',
                    'hover:scale-[1.01]',
                    theme === 'dark' 
                      ? 'bg-gray-800 hover:bg-gray-750 border border-gray-700' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={cn(
                        'font-semibold text-lg',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}>
                        {patient.name}
                      </div>
                      <div className={cn(
                        'text-sm mt-1 flex items-center gap-3',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        <span>{patient.age} yrs • {patient.gender}</span>
                        <span>{patient.phone}</span>
                        <span className="font-mono text-xs">{patient.medicalRecordNumber}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {patient.allergies.length > 0 && (
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          theme === 'dark' 
                            ? 'bg-red-900/30 text-red-300' 
                            : 'bg-red-100 text-red-700'
                        )}>
                          ⚠️ Allergies
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className={cn(
                'p-8 text-center rounded-xl',
                theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
              )}>
                <User className={cn(
                  'w-12 h-12 mx-auto mb-3',
                  theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                )} />
                <p className={cn(
                  'font-medium',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  No patients found
                </p>
                <p className={cn(
                  'text-sm mt-1',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                )}>
                  Try a different search or create a new patient
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className={cn(
          'p-6 rounded-xl',
          theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
        )}>
          <h4 className={cn(
            'font-semibold text-lg mb-4',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            New Patient Registration
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={cn(
                'block text-sm font-medium mb-2',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                Full Name *
              </label>
              <input
                type="text"
                value={newPatient.name}
                onChange={(e) => setNewPatient(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter patient name"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl border',
                  theme === 'dark' 
                    ? 'bg-gray-900 border-gray-700 text-white' 
                    : 'bg-white border-gray-300'
                )}
              />
            </div>

            <div>
              <label className={cn(
                'block text-sm font-medium mb-2',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                Age *
              </label>
              <input
                type="number"
                value={newPatient.age || ''}
                onChange={(e) => setNewPatient(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                placeholder="Age"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl border',
                  theme === 'dark' 
                    ? 'bg-gray-900 border-gray-700 text-white' 
                    : 'bg-white border-gray-300'
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
                value={newPatient.gender}
                onChange={(e) => setNewPatient(prev => ({ ...prev, gender: e.target.value as 'Male' | 'Female' | 'Other' }))}
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl border',
                  theme === 'dark' 
                    ? 'bg-gray-900 border-gray-700 text-white' 
                    : 'bg-white border-gray-300'
                )}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className={cn(
                'block text-sm font-medium mb-2',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                Phone Number *
              </label>
              <input
                type="tel"
                value={newPatient.phone}
                onChange={(e) => setNewPatient(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+256 700 000000"
                className={cn(
                  'w-full px-4 py-2.5 rounded-xl border',
                  theme === 'dark' 
                    ? 'bg-gray-900 border-gray-700 text-white' 
                    : 'bg-white border-gray-300'
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleCreatePatient}
              className={cn(
                'px-6 py-2.5 rounded-xl font-medium',
                theme === 'dark' 
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              )}
            >
              Create & Continue
            </button>
            <button
              onClick={() => setShowNewPatientForm(false)}
              className={cn(
                'px-6 py-2.5 rounded-xl font-medium',
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              )}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};