// src/modules/clinical/ClinicalEncounterModule.tsx

import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Stethoscope } from 'lucide-react';
import type { RootState } from '../../store';
import { cn } from '../../utils/classNameUtils';
import { PatientSelector } from './components/PatientSelector';
import { SymptomCapture } from './components/SymptomCapture';
import { RealtimeAIDiagnosis } from './components/RealtimeAIDiagnosis';
import type {
  Patient,
  Symptom,
  PatientVitals
} from './types/clinicalEncounterTypes';

/**
 * ============================================================================
 * CLINICAL ENCOUNTER MODULE - AI-POWERED PATIENT ASSESSMENT
 * ============================================================================
 * 
 * Features:
 * ---------
 * 1. Patient Selection/Creation - Automatic selection if exists
 * 2. Real-time Symptom Capture - Dynamic form with vitals
 * 3. Live AI Diagnosis - Context-aware differential diagnosis
 * 4. Enterprise-grade UX - Production-ready interface
 * 
 * Components:
 * -----------
 * - PatientSelector: Search/create patient (left panel)
 * - SymptomCapture: Capture clinical data (main panel)
 * - RealtimeAIDiagnosis: Live AI analysis (right panel - sticky)
 */

export const ClinicalEncounterModule: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  
  // State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [vitals, setVitals] = useState<PatientVitals | null>(null);
  const [examFindings, setExamFindings] = useState('');

  const handlePatientSelected = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
  }, []);

  const handleCreateNewPatient = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
  }, []);

  const handleDataChange = useCallback((data: {
    chiefComplaint: string;
    symptoms: Symptom[];
    vitals: PatientVitals;
    examFindings: string;
  }) => {
    setChiefComplaint(data.chiefComplaint);
    setSymptoms(data.symptoms);
    setVitals(data.vitals);
    setExamFindings(data.examFindings);
  }, []);

  return (
    <div className={cn(
      'min-h-screen p-6',
      theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'
    )}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            'p-3 rounded-xl',
            theme === 'dark' 
              ? 'bg-gradient-to-br from-cyan-600 to-blue-600' 
              : 'bg-gradient-to-br from-blue-600 to-cyan-600'
          )}>
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={cn(
              'text-3xl font-bold',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Clinical Encounter
            </h1>
            <p className={cn(
              'text-sm',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              AI-powered patient assessment with real-time differential diagnosis
            </p>
          </div>
        </div>
      </div>

      {/* Patient Selector - Always visible */}
      <PatientSelector
        onPatientSelected={handlePatientSelected}
        onCreateNewPatient={handleCreateNewPatient}
      />

      {/* Main Content - Only show after patient is selected */}
      {selectedPatient && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Symptom Capture (2 columns) */}
          <div className="lg:col-span-2">
            <SymptomCapture
              patient={selectedPatient}
              onDataChange={handleDataChange}
            />
          </div>

          {/* Right Panel - Real-time AI Diagnosis (1 column, sticky) */}
          <div className="lg:col-span-1">
            <RealtimeAIDiagnosis
              chiefComplaint={chiefComplaint}
              symptoms={symptoms}
              vitals={vitals}
              examFindings={examFindings}
            />
          </div>
        </div>
      )}

      {/* Empty State - Before patient selection */}
      {!selectedPatient && (
        <div className={cn(
          'rounded-2xl border p-12 text-center mt-6',
          theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
        )}>
          <Stethoscope className={cn(
            'w-16 h-16 mx-auto mb-4',
            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
          )} />
          <h3 className={cn(
            'text-xl font-bold mb-2',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            Select or Create a Patient to Begin
          </h3>
          <p className={cn(
            'text-sm',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
          )}>
            Search for an existing patient or register a new one to start the clinical encounter
          </p>
        </div>
      )}

      {/* Feature Highlights */}
      {!selectedPatient && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[
            {
              title: 'Smart Patient Search',
              description: 'Instantly find patients by name, phone, or medical record number',
              icon: '🔍'
            },
            {
              title: 'Real-time AI Analysis',
              description: 'Context-aware differential diagnosis updates as you enter symptoms',
              icon: '🧠'
            },
            {
              title: 'Comprehensive Assessment',
              description: 'Capture vitals, symptoms, and examination findings in one workflow',
              icon: '⚡'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className={cn(
                'rounded-xl border p-6',
                theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
              )}
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h4 className={cn(
                'font-semibold mb-2',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {feature.title}
              </h4>
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ClinicalEncounterModule.displayName = 'ClinicalEncounterModule';
export default ClinicalEncounterModule;