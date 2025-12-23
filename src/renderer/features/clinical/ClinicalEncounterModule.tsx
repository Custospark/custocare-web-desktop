import React, { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { ContentLayout, Operation } from  '../../components/content/ContentLayout'
import {
  Stethoscope, Activity, Pill, FileText, AlertCircle, Search, Plus, Send,
  Download, ArrowRight, CheckCircle, Thermometer,
  Heart, Droplets, Weight, MessageSquare, Brain, FlaskConical, Receipt
} from 'lucide-react';
import { cn } from '../../utils/classNameUtils';

/**
 * ============================================================================
 * CLINICAL ENCOUNTER MODULE - AI-POWERED HEALTHCARE WORKFLOW
 * ============================================================================
 * 
 * Purpose:
 * --------
 * Comprehensive clinical encounter system integrating AI-assisted diagnosis,
 * automated clinical documentation, e-prescribing, and department workflow.
 * 
 * Module Structure:
 * ----------------
 * 1. New Encounter - AI-assisted patient assessment
 * 2. Differential AI - Real-time diagnostic suggestions
 * 3. E-Prescribing - Smart medication management
 * 4. Clinical Notes - Auto-generated documentation
 * 5. Investigations - Test ordering and results
 * 6. Department Flow - Patient routing between departments
 * 7. Billing - Automated billing capture
 * 
 * Unique Features:
 * ---------------
 * • Context-Aware AI: Considers local disease prevalence, seasonal patterns
 * • Real-time Differential Diagnosis: Updates as data is entered
 * • Allergy & Interaction Checks: Prevents medication errors
 * • Auto-generated Notes: Saves clinician time
 * • Department Workflow: Seamless patient routing
 * • Automatic Billing: Real-time service logging
 */

/* ============================================================================
   TYPE DEFINITIONS
============================================================================ */

type ClinicalOperationId = 'newEncounter' | 'differentialAI' | 'ePrescribing' | 
                          'clinicalNotes' | 'investigations' | 'departmentFlow' | 'billing';

interface PatientVitals {
  temperature: number;
  bloodPressure: string;
  pulse: number;
  respiratoryRate: number;
  spO2: number;
  weight: number;
  bmi?: number;
}

interface Symptom {
  name: string;
  severity: number; // 1-10
  duration: string; // e.g., "3 days", "2 hours"
  notes?: string;
}

interface DifferentialDiagnosis {
  condition: string;
  probability: number; // 0-100%
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
  suggestedTests: string[];
}

interface PrescriptionItem {
  drug: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  warnings: string[];
  formularyAvailable: boolean;
  insuranceCovered: boolean;
}

interface InvestigationOrder {
  type: 'lab' | 'radiology' | 'other';
  testName: string;
  priority: 'routine' | 'urgent' | 'stat';
  instructions?: string;
}

interface DepartmentRoute {
  from: string;
  to: string;
  patientId: string;
  priority: string;
  status: 'pending' | 'in-progress' | 'completed';
  timestamp: string;
}

interface BillingItem {
  service: string;
  quantity: number;
  unitPrice: number;
  total: number;
  insuranceCovered: boolean;
}

/* ============================================================================
   CONSTANTS
============================================================================ */

const CLINICAL_OPERATIONS: Operation[] = [
  {
    id: 'newEncounter',
    label: 'New Encounter',
    icon: <Stethoscope className="w-4 h-4" />,
    description: 'Start AI-assisted patient assessment',
  },
  {
    id: 'differentialAI',
    label: 'Differential AI',
    icon: <Brain className="w-4 h-4" />,
    description: 'AI-powered diagnostic suggestions',
  },
  {
    id: 'ePrescribing',
    label: 'E-Prescribing',
    icon: <Pill className="w-4 h-4" />,
    description: 'Smart medication management',
  },
  {
    id: 'clinicalNotes',
    label: 'Clinical Notes',
    icon: <FileText className="w-4 h-4" />,
    description: 'Auto-generated documentation',
  },
  {
    id: 'investigations',
    label: 'Investigations',
    icon: <FlaskConical className="w-4 h-4" />,
    description: 'Test ordering and results',
  },
  {
    id: 'departmentFlow',
    label: 'Department Flow',
    icon: <ArrowRight className="w-4 h-4" />,
    description: 'Patient routing workflow',
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: <Receipt className="w-4 h-4" />,
    description: 'Automated billing capture',
  },
];

// Mock data for demonstration
const MOCK_DIFFERENTIALS: DifferentialDiagnosis[] = [
  {
    condition: 'Malaria',
    probability: 85,
    confidence: 'high',
    evidence: ['High fever', 'Headache', 'Malaria-endemic area'],
    suggestedTests: ['Malaria RDT', 'Blood smear'],
  },
  {
    condition: 'Typhoid Fever',
    probability: 45,
    confidence: 'medium',
    evidence: ['Fever pattern', 'Abdominal tenderness'],
    suggestedTests: ['Widal test', 'Blood culture'],
  },
  {
    condition: 'Dengue Fever',
    probability: 30,
    confidence: 'medium',
    evidence: ['Fever', 'Muscle pain', 'Rainy season'],
    suggestedTests: ['Dengue NS1 antigen', 'CBC'],
  },
];

const MOCK_DRUG_FORMULARY = [
  { name: 'Artemether-Lumefantrine', available: true, insurance: true },
  { name: 'Paracetamol', available: true, insurance: true },
  { name: 'Ciprofloxacin', available: true, insurance: true },
  { name: 'Metformin', available: true, insurance: true },
];

const MOCK_DEPARTMENTS = [
  { id: 'opd', name: 'Outpatient Department', queue: 3 },
  { id: 'lab', name: 'Laboratory', queue: 5 },
  { id: 'pharmacy', name: 'Pharmacy', queue: 2 },
  { id: 'radiology', name: 'Radiology', queue: 1 },
  { id: 'billing', name: 'Billing', queue: 4 },
];

/* ============================================================================
   MAIN COMPONENT
============================================================================ */

export const ClinicalEncounterModule: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const [activeOperation, setActiveOperation] = useState<ClinicalOperationId>('newEncounter');
  
  // New Encounter State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState<Symptom[]>([
    { name: 'Fever', severity: 8, duration: '3 days' },
    { name: 'Headache', severity: 7, duration: '2 days' },
  ]);
  const [vitals, setVitals] = useState<PatientVitals>({
    temperature: 39.2,
    bloodPressure: '120/78',
    pulse: 98,
    respiratoryRate: 18,
    spO2: 97,
    weight: 65,
  });
  const [examFindings, setExamFindings] = useState('');
  const [allergies, setAllergies] = useState<string[]>(['Penicillin']);
  const [currentMedications, setCurrentMedications] = useState<string[]>(['Metformin 500mg']);
  
  // Differential AI State
  const [differentials, setDifferentials] = useState<DifferentialDiagnosis[]>(MOCK_DIFFERENTIALS);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string>('');
  
  // E-Prescribing State
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    {
      drug: 'Paracetamol',
      dosage: '1g',
      frequency: 'TDS',
      duration: '3 days',
      quantity: 9,
      warnings: ['Take with food if stomach upset occurs'],
      formularyAvailable: true,
      insuranceCovered: true,
    },
  ]);
  const [drugSearch, setDrugSearch] = useState('');
  
  // Investigations State
  const [investigations, setInvestigations] = useState<InvestigationOrder[]>([
    { type: 'lab', testName: 'Malaria RDT', priority: 'urgent', instructions: 'Fast before test' },
    { type: 'lab', testName: 'Complete Blood Count', priority: 'routine' },
  ]);
  
  // Department Flow State
  const [departmentRoutes, setDepartmentRoutes] = useState<DepartmentRoute[]>([
    { from: 'opd', to: 'lab', patientId: 'PT-001', priority: 'urgent', status: 'completed', timestamp: '2024-01-20 10:30' },
    { from: 'lab', to: 'pharmacy', patientId: 'PT-001', priority: 'routine', status: 'in-progress', timestamp: '2024-01-20 11:15' },
  ]);
  
  // Billing State
  const [billingItems, setBillingItems] = useState<BillingItem[]>([
    { service: 'Consultation', quantity: 1, unitPrice: 50, total: 50, insuranceCovered: true },
    { service: 'Malaria RDT', quantity: 1, unitPrice: 15, total: 15, insuranceCovered: true },
    { service: 'Paracetamol', quantity: 9, unitPrice: 0.5, total: 4.5, insuranceCovered: true },
  ]);

  /* =========================================================================
     EVENT HANDLERS
  ========================================================================== */

  const handleOperationChange = useCallback((operationId: string) => {
    setActiveOperation(operationId as ClinicalOperationId);
  }, []);

  const addSymptom = useCallback(() => {
    setSymptoms(prev => [...prev, { name: '', severity: 5, duration: '' }]);
  }, []);

  const updateSymptom = useCallback((index: number, field: keyof Symptom, value: any) => {
    setSymptoms(prev => prev.map((s, i) => 
      i === index ? { ...s, [field]: value } : s
    ));
  }, []);

  const updateVital = useCallback((field: keyof PatientVitals, value: number | string) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  }, []);

  const addPrescription = useCallback(() => {
    const newDrug: PrescriptionItem = {
      drug: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 1,
      warnings: [],
      formularyAvailable: false,
      insuranceCovered: false,
    };
    setPrescriptions(prev => [...prev, newDrug]);
  }, []);

  const checkDrugInteractions = useCallback((drugName: string) => {
    // Mock interaction check
    if (drugName.toLowerCase().includes('cipro') && currentMedications.some(m => m.toLowerCase().includes('metformin'))) {
      return {
        warning: '🚨 CRITICAL: Ciprofloxacin interacts with Metformin. Increases risk of hypoglycemia.',
        alternatives: ['Amoxicillin', 'Azithromycin'],
      };
    }
    return null;
  }, [currentMedications]);

  const forwardToDepartment = useCallback((toDepartment: string) => {
    const newRoute: DepartmentRoute = {
      from: activeOperation === 'newEncounter' ? 'opd' : 'current',
      to: toDepartment,
      patientId: 'PT-001',
      priority: toDepartment === 'lab' ? 'urgent' : 'routine',
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
    setDepartmentRoutes(prev => [...prev, newRoute]);
    alert(`Patient forwarded to ${toDepartment}`);
  }, [activeOperation]);

  /* =========================================================================
     COMPUTED VALUES
  ========================================================================== */

  const abnormalVitals = useMemo(() => {
    const abnormal = [];
    if (vitals.temperature > 38) abnormal.push(`Fever: ${vitals.temperature}°C`);
    if (vitals.pulse > 100) abnormal.push(`Tachycardia: ${vitals.pulse} bpm`);
    if (vitals.spO2 < 95) abnormal.push(`Low SpO2: ${vitals.spO2}%`);
    return abnormal;
  }, [vitals]);

  const totalBill = useMemo(() => {
    return billingItems.reduce((sum, item) => sum + item.total, 0);
  }, [billingItems]);

  const insuranceCovered = useMemo(() => {
    return billingItems.reduce((sum, item) => item.insuranceCovered ? sum + item.total : sum, 0);
  }, [billingItems]);

  const patientPayable = useMemo(() => {
    return totalBill - insuranceCovered;
  }, [totalBill, insuranceCovered]);

  /* =========================================================================
     WORKSPACE CONTENT RENDERERS
  ========================================================================== */

  const renderNewEncounter = () => (
    <div className="p-6 space-y-6">
      <div>
        <h1 className={cn('text-3xl font-bold mb-2', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
          New Clinical Encounter
        </h1>
        <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
          AI-assisted patient assessment with real-time differential diagnosis
        </p>
      </div>

      {/* Chief Complaint Section */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200')}>
        <h3 className={cn('text-lg font-semibold mb-4 flex items-center gap-2', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
          <MessageSquare className="w-5 h-5" />
          1. Chief Complaint & Symptoms
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              Chief Complaint *
            </label>
            <input
              type="text"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g., Fever and headache for 3 days"
              className={cn('w-full px-4 py-2.5 rounded-xl border text-sm', theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300')}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={cn('text-sm font-medium', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                Symptoms
              </label>
              <button
                type="button"
                onClick={addSymptom}
                className={cn('text-sm flex items-center gap-1', theme === 'dark' ? 'text-cyan-400' : 'text-blue-600')}
              >
                <Plus className="w-4 h-4" /> Add Symptom
              </button>
            </div>
            
            <div className="space-y-3">
              {symptoms.map((symptom, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={symptom.name}
                    onChange={(e) => updateSymptom(index, 'name', e.target.value)}
                    placeholder="Symptom name"
                    className={cn('px-3 py-2 rounded-lg border text-sm', theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300')}
                  />
                  <div>
                    <label className={cn('text-xs block mb-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                      Severity: {symptom.severity}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={symptom.severity}
                      onChange={(e) => updateSymptom(index, 'severity', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <input
                    type="text"
                    value={symptom.duration}
                    onChange={(e) => updateSymptom(index, 'duration', e.target.value)}
                    placeholder="Duration"
                    className={cn('px-3 py-2 rounded-lg border text-sm', theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300')}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vital Signs Section */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200')}>
        <h3 className={cn('text-lg font-semibold mb-4 flex items-center gap-2', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
          <Activity className="w-5 h-5" />
          2. Vital Signs
        </h3>
        
        {abnormalVitals.length > 0 && (
          <div className={cn('p-3 rounded-lg mb-4', theme === 'dark' ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200')}>
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="font-semibold">Abnormal Values Detected:</span>
            </div>
            <ul className="mt-1 space-y-1">
              {abnormalVitals.map((vital, idx) => (
                <li key={idx} className={cn('text-sm', theme === 'dark' ? 'text-red-300' : 'text-red-700')}>
                  • {vital}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className={cn('text-xs block mb-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
              <Thermometer className="w-3 h-3 inline mr-1" /> Temp (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={vitals.temperature}
              onChange={(e) => updateVital('temperature', parseFloat(e.target.value))}
              className={cn('w-full px-3 py-2 rounded-lg border text-center font-medium', 
                vitals.temperature > 38 ? 'text-red-600' : '',
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              )}
            />
          </div>
          
          <div>
            <label className={cn('text-xs block mb-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
              <Activity className="w-3 h-3 inline mr-1" /> BP (mmHg)
            </label>
            <input
              type="text"
              value={vitals.bloodPressure}
              onChange={(e) => updateVital('bloodPressure', e.target.value)}
              className={cn('w-full px-3 py-2 rounded-lg border text-center font-medium', theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300')}
            />
          </div>
          
          <div>
            <label className={cn('text-xs block mb-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
              <Heart className="w-3 h-3 inline mr-1" /> Pulse (bpm)
            </label>
            <input
              type="number"
              value={vitals.pulse}
              onChange={(e) => updateVital('pulse', parseInt(e.target.value))}
              className={cn('w-full px-3 py-2 rounded-lg border text-center font-medium', theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300')}
            />
          </div>
          
          <div>
            <label className={cn('text-xs block mb-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
              <Droplets className="w-3 h-3 inline mr-1" /> SpO2 (%)
            </label>
            <input
              type="number"
              value={vitals.spO2}
              onChange={(e) => updateVital('spO2', parseInt(e.target.value))}
              className={cn('w-full px-3 py-2 rounded-lg border text-center font-medium', theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300')}
            />
          </div>
          
          <div>
            <label className={cn('text-xs block mb-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
              <Weight className="w-3 h-3 inline mr-1" /> Weight (kg)
            </label>
            <input
              type="number"
              value={vitals.weight}
              onChange={(e) => updateVital('weight', parseFloat(e.target.value))}
              className={cn('w-full px-3 py-2 rounded-lg border text-center font-medium', theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300')}
            />
          </div>
          
          <div>
            <label className={cn('text-xs block mb-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
              BMI
            </label>
            <div className={cn('w-full px-3 py-2 rounded-lg border text-center font-medium', theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300')}>
              {((vitals.weight / (1.7 * 1.7)).toFixed(1))}
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Examination */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200')}>
        <h3 className={cn('text-lg font-semibold mb-4 flex items-center gap-2', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
          <Stethoscope className="w-5 h-5" />
          3. Clinical Examination Findings
        </h3>
        
        <div>
          <label className={cn('block text-sm font-medium mb-2', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
            Examination Notes
          </label>
          <textarea
            value={examFindings}
            onChange={(e) => setExamFindings(e.target.value)}
            rows={4}
            placeholder="Document findings using structured templates or free text..."
            className={cn('w-full px-4 py-3 rounded-xl border text-sm resize-none', theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300')}
          />
          <div className="mt-2 text-xs text-gray-500">
            Pro tip: Use voice dictation (future feature) or select from system templates
          </div>
        </div>
      </div>

      {/* Allergy & Medication Check */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200')}>
        <h3 className={cn('text-lg font-semibold mb-4 flex items-center gap-2', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
          <AlertCircle className="w-5 h-5" />
          4. Safety Checks
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className={cn('text-sm font-medium mb-2', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              ⚠️ Documented Allergies
            </h4>
            <div className={cn('p-3 rounded-lg', theme === 'dark' ? 'bg-yellow-900/20 border border-yellow-700/50' : 'bg-yellow-50 border border-yellow-200')}>
              <ul className="space-y-1">
                {allergies.map((allergy, idx) => (
                  <li key={idx} className={cn('text-sm', theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700')}>
                    • {allergy} (documented 2023-06-15)
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div>
            <h4 className={cn('text-sm font-medium mb-2', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              💊 Current Medications
            </h4>
            <div className={cn('p-3 rounded-lg', theme === 'dark' ? 'bg-blue-900/20 border border-blue-700/50' : 'bg-blue-50 border border-blue-200')}>
              <ul className="space-y-1">
                {currentMedications.map((med, idx) => (
                  <li key={idx} className={cn('text-sm', theme === 'dark' ? 'text-blue-300' : 'text-blue-700')}>
                    • {med}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveOperation('differentialAI')}
          className={cn('px-6 py-3 rounded-xl font-medium flex items-center gap-2', theme === 'dark' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-blue-600 hover:bg-blue-700 text-white')}
        >
          <Brain className="w-5 h-5" />
          View AI Differential Diagnosis
        </button>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => forwardToDepartment('lab')}
            className={cn('px-6 py-3 rounded-xl font-medium flex items-center gap-2', theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')}
          >
            <ArrowRight className="w-5 h-5" />
            Forward to Lab
          </button>
          
          <button
            onClick={() => setActiveOperation('clinicalNotes')}
            className={cn('px-6 py-3 rounded-xl font-medium flex items-center gap-2', theme === 'dark' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700 text-white')}
          >
            <FileText className="w-5 h-5" />
            Generate Notes
          </button>
        </div>
      </div>
    </div>
  );

  const renderDifferentialAI = () => (
    <div className="p-6 space-y-6">
      <div>
        <h1 className={cn('text-3xl font-bold mb-2', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
          AI Differential Diagnosis
        </h1>
        <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
          Real-time diagnostic suggestions based on entered data
        </p>
      </div>

      {/* Context Awareness */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200')}>
        <h3 className={cn('text-lg font-semibold mb-4 flex items-center gap-2', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
          <Brain className="w-5 h-5" />
          Context-Aware AI Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={cn('p-4 rounded-lg', theme === 'dark' ? 'bg-purple-900/20 border border-purple-700/50' : 'bg-purple-50 border border-purple-200')}>
            <div className="text-xs text-purple-600 mb-1">🌍 Geographic Context</div>
            <div className="font-medium">Malaria-endemic Zone</div>
            <div className="text-sm opacity-75">Higher weighting for malaria</div>
          </div>
          
          <div className={cn('p-4 rounded-lg', theme === 'dark' ? 'bg-blue-900/20 border border-blue-700/50' : 'bg-blue-50 border border-blue-200')}>
            <div className="text-xs text-blue-600 mb-1">📅 Seasonal Pattern</div>
            <div className="font-medium">Rainy Season</div>
            <div className="text-sm opacity-75">Dengue/malaria prioritized</div>
          </div>
          
          <div className={cn('p-4 rounded-lg', theme === 'dark' ? 'bg-emerald-900/20 border border-emerald-700/50' : 'bg-emerald-50 border border-emerald-200')}>
            <div className="text-xs text-emerald-600 mb-1">📋 Patient History</div>
            <div className="font-medium">Recurrent UTIs</div>
            <div className="text-sm opacity-75">UTI flagged higher in future</div>
          </div>
          
          <div className={cn('p-4 rounded-lg', theme === 'dark' ? 'bg-red-900/20 border border-red-700/50' : 'bg-red-50 border border-red-200')}>
            <div className="text-xs text-red-600 mb-1">⚠️ Community Alert</div>
            <div className="font-medium">Cholera Outbreak</div>
            <div className="text-sm opacity-75">GI symptoms trigger cholera</div>
          </div>
        </div>
      </div>

      {/* Differential List */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200')}>
        <h3 className={cn('text-lg font-semibold mb-4', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
          Differential Diagnosis (Live Updates)
        </h3>
        
        <div className="space-y-4">
          {differentials.map((diff, index) => (
            <div
              key={index}
              className={cn('p-4 rounded-xl border', theme === 'dark' ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300')}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-lg">{diff.condition}</h4>
                    <span className={cn('px-2 py-1 text-xs rounded-full', {
                      'bg-green-100 text-green-800': diff.confidence === 'high',
                      'bg-yellow-100 text-yellow-800': diff.confidence === 'medium',
                      'bg-gray-100 text-gray-800': diff.confidence === 'low',
                    })}>
                      {diff.confidence.toUpperCase()} CONFIDENCE
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">Probability:</div>
                      <div className="flex-1">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${diff.probability > 70 ? 'bg-green-500' : diff.probability > 40 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                            style={{ width: `${diff.probability}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm font-bold">{diff.probability}%</div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedDiagnosis(diff.condition)}
                  className={cn('px-4 py-2 rounded-lg text-sm font-medium', selectedDiagnosis === diff.condition 
                    ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                    : (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200')
                  )}
                >
                  {selectedDiagnosis === diff.condition ? 'Selected' : 'Select'}
                </button>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-2">Supporting Evidence:</div>
                  <ul className="space-y-1">
                    {diff.evidence.map((item, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-2">Suggested Tests:</div>
                  <ul className="space-y-1">
                    {diff.suggestedTests.map((test, idx) => (
                      <li key={idx} className="text-sm">
                        <button
                          onClick={() => {
                            setInvestigations(prev => [...prev, { 
                              type: 'lab', 
                              testName: test, 
                              priority: 'routine' 
                            }]);
                            alert(`Added ${test} to investigations`);
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          + Order {test}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Diagnosis Actions */}
      {selectedDiagnosis && (
        <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200')}>
          <h3 className={cn('text-lg font-semibold mb-4', theme === 'dark' ? 'text-white' : 'text-blue-900')}>
            Working Diagnosis: {selectedDiagnosis}
          </h3>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveOperation('ePrescribing')}
              className={cn('px-6 py-3 rounded-xl font-medium flex items-center gap-2', theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700 text-white')}
            >
              <Pill className="w-5 h-5" />
              Prescribe Treatment
            </button>
            
            <button
              onClick={() => setActiveOperation('investigations')}
              className={cn('px-6 py-3 rounded-xl font-medium flex items-center gap-2', theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')}
            >
              <FlaskConical className="w-5 h-5" />
              Order Confirmatory Tests
            </button>
            
            <button
              onClick={() => setActiveOperation('clinicalNotes')}
              className={cn('px-6 py-3 rounded-xl font-medium flex items-center gap-2', theme === 'dark' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700 text-white')}
            >
              <FileText className="w-5 h-5" />
              Document Assessment
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderEPrescribing = () => (
    <div className="p-6 space-y-6">
      <div>
        <h1 className={cn('text-3xl font-bold mb-2', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
          E-Prescribing with AI Assistance
        </h1>
        <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
          Smart medication management with allergy and interaction checks
        </p>
      </div>

      {/* Drug Search */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200')}>
        <div className="relative">
          <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')} />
          <input
            type="text"
            value={drugSearch}
            onChange={(e) => setDrugSearch(e.target.value)}
            placeholder="Search for medications..."
            className={cn('w-full pl-10 pr-4 py-3 rounded-xl border', theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300')}
          />
        </div>
        
        {/* Drug Suggestions */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          {MOCK_DRUG_FORMULARY
            .filter(drug => drug.name.toLowerCase().includes(drugSearch.toLowerCase()))
            .map((drug, index) => (
              <button
                key={index}
                onClick={() => {
                  const interaction = checkDrugInteractions(drug.name);
                  if (interaction) {
                    alert(interaction.warning + '\n\nAlternatives: ' + interaction.alternatives.join(', '));
                  } else {
                    addPrescription();
                  }
                }}
                className={cn('p-3 rounded-lg text-left transition-colors', theme === 'dark' 
                  ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' 
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                )}
              >
                <div className="font-medium">{drug.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn('text-xs px-2 py-0.5 rounded', drug.available 
                    ? (theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')
                    : (theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800')
                  )}>
                    {drug.available ? 'Available' : 'Out of Stock'}
                  </span>
                  <span className={cn('text-xs px-2 py-0.5 rounded', drug.insurance 
                    ? (theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800')
                    : (theme === 'dark' ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800')
                  )}>
                    {drug.insurance ? 'Insurance Covered' : 'Self Pay'}
                  </span>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Current Prescriptions */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200')}>
        <h3 className={cn('text-lg font-semibold mb-4', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
          Current Prescriptions
        </h3>
        
        <div className="space-y-4">
          {prescriptions.map((prescription, index) => (
            <div key={index} className={cn('p-4 rounded-xl', theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50')}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-lg">{prescription.drug}</div>
                  <div className="text-sm mt-1">
                    <span className="opacity-75">Dosage:</span> {prescription.dosage} • 
                    <span className="opacity-75 ml-2">Frequency:</span> {prescription.frequency} • 
                    <span className="opacity-75 ml-2">Duration:</span> {prescription.duration}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold">Qty: {prescription.quantity}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {prescription.formularyAvailable && (
                      <span className={cn('text-xs px-2 py-0.5 rounded', theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')}>
                        In Stock
                      </span>
                    )}
                    {prescription.insuranceCovered && (
                      <span className={cn('text-xs px-2 py-0.5 rounded', theme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800')}>
                        Covered
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {prescription.warnings.length > 0 && (
                <div className={cn('mt-3 p-2 rounded-lg', theme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-50')}>
                  <div className="text-sm font-medium">⚠️ Warnings:</div>
                  <ul className="text-sm">
                    {prescription.warnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={addPrescription}
            className={cn('px-4 py-2 rounded-lg flex items-center gap-2', theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')}
          >
            <Plus className="w-4 h-4" />
            Add Medication
          </button>
          
          <button
            onClick={() => forwardToDepartment('pharmacy')}
            className={cn('px-6 py-3 rounded-xl font-medium flex items-center gap-2', theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700 text-white')}
          >
            <Send className="w-5 h-5" />
            Send to Pharmacy
          </button>
        </div>
      </div>

      {/* Patient SMS Notification */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200')}>
        <h3 className={cn('text-lg font-semibold mb-4', theme === 'dark' ? 'text-blue-200' : 'text-blue-900')}>
          Patient Notification
        </h3>
        
        <div className={cn('p-4 rounded-lg', theme === 'dark' ? 'bg-gray-800' : 'bg-white')}>
          <div className="font-medium">📱 SMS to Patient:</div>
          <div className="mt-2 text-sm">
            "Your prescription is ready at [Facility] Pharmacy. 
            Please collect within 48 hours. Medications: {prescriptions.map(p => p.drug).join(', ')}"
          </div>
        </div>
      </div>
    </div>
  );

  const renderClinicalNotes = () => (
    <div className="p-6 space-y-6">
      <div>
        <h1 className={cn('text-3xl font-bold mb-2', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
          Auto-Generated Clinical Notes
        </h1>
        <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
          AI-compiled structured notes ready for clinician review
        </p>
      </div>

      {/* Auto-generated Note */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200')}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={cn('text-xl font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            CLINICAL NOTE
          </h3>
          <div className="text-sm opacity-75">Auto-generated: {new Date().toLocaleDateString()}, 14:30</div>
        </div>
        
        <div className="space-y-6">
          <div>
            <h4 className={cn('font-semibold mb-2 text-lg', theme === 'dark' ? 'text-cyan-300' : 'text-blue-700')}>
              Chief Complaint:
            </h4>
            <p className={cn('pl-4', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              {chiefComplaint || "Fever and headache for 3 days"}
            </p>
          </div>
          
          <div>
            <h4 className={cn('font-semibold mb-2 text-lg', theme === 'dark' ? 'text-cyan-300' : 'text-blue-700')}>
              History of Presenting Illness:
            </h4>
            <p className={cn('pl-4', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              {symptoms.length > 0 
                ? `${symptoms.length}-year-old presents with ${symptoms.map(s => `${s.name} (severity ${s.severity}/10)`).join(', ')} starting ${symptoms[0]?.duration || 'recently'}.`
                : "34-year-old female presents with high-grade fever (39.2°C), severe headache, and chills starting 3 days ago. No cough, no abdominal pain. Resides in malaria-endemic area."
              }
            </p>
          </div>
          
          <div>
            <h4 className={cn('font-semibold mb-2 text-lg', theme === 'dark' ? 'text-cyan-300' : 'text-blue-700')}>
              Vital Signs:
            </h4>
            <div className={cn('pl-4 grid grid-cols-2 md:grid-cols-3 gap-2', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              <div>Temp: {vitals.temperature}°C</div>
              <div>BP: {vitals.bloodPressure} mmHg</div>
              <div>Pulse: {vitals.pulse} bpm</div>
              <div>RR: {vitals.respiratoryRate}</div>
              <div>SpO2: {vitals.spO2}%</div>
              <div>Weight: {vitals.weight} kg</div>
            </div>
          </div>
          
          <div>
            <h4 className={cn('font-semibold mb-2 text-lg', theme === 'dark' ? 'text-cyan-300' : 'text-blue-700')}>
              Examination:
            </h4>
            <p className={cn('pl-4', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              {examFindings || "Alert, mild pallor, no jaundice. CVS/Resp: Normal."}
            </p>
          </div>
          
          <div>
            <h4 className={cn('font-semibold mb-2 text-lg', theme === 'dark' ? 'text-cyan-300' : 'text-blue-700')}>
              Assessment:
            </h4>
            <ol className={cn('pl-8 list-decimal space-y-1', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              {selectedDiagnosis ? (
                <li>{selectedDiagnosis} (probable) - Investigations ordered</li>
              ) : (
                <>
                  <li>Malaria (probable) - RDT ordered</li>
                  <li>Rule out typhoid fever</li>
                </>
              )}
            </ol>
          </div>
          
          <div>
            <h4 className={cn('font-semibold mb-2 text-lg', theme === 'dark' ? 'text-cyan-300' : 'text-blue-700')}>
              Plan:
            </h4>
            <ul className={cn('pl-8 list-disc space-y-1', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
              {prescriptions.length > 0 && (
                <li>Medications: {prescriptions.map(p => `${p.drug} ${p.dosage} ${p.frequency}`).join(', ')}</li>
              )}
              {investigations.length > 0 && (
                <li>Investigations ordered: {investigations.map(i => i.testName).join(', ')}</li>
              )}
              <li>Review in 2 days or sooner if worsening</li>
              <li>Patient advised to return if symptoms persist</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t flex items-center justify-between">
          <div className="text-sm opacity-75">
            Clinician signature: __________________
          </div>
          
          <div className="flex items-center gap-3">
            <button className={cn('px-4 py-2 rounded-lg', theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')}>
              Edit Note
            </button>
            <button className={cn('px-6 py-2 rounded-lg font-medium', theme === 'dark' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700 text-white')}>
              Approve & Sign
            </button>
            <button className={cn('px-4 py-2 rounded-lg flex items-center gap-2', theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')}>
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInvestigations = () => (
    <div className="p-6 space-y-6">
      <div>
        <h1 className={cn('text-3xl font-bold mb-2', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
          Investigation Ordering & Results
        </h1>
        <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
          Seamless diagnostic workflow with automated alerts
        </p>
      </div>

      {/* Order Investigations */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200')}>
        <h3 className={cn('text-lg font-semibold mb-4', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
          Order Investigations
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['Malaria RDT', 'Complete Blood Count', 'Liver Function Test', 'Urinalysis', 'Chest X-Ray', 'Ultrasound Abdomen'].map((test, index) => (
            <button
              key={index}
              onClick={() => {
                setInvestigations(prev => [...prev, { 
                  type: index < 4 ? 'lab' : 'radiology', 
                  testName: test, 
                  priority: 'routine' 
                }]);
              }}
              className={cn('p-4 rounded-xl text-left transition-transform hover:scale-[1.02]', theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' 
                : 'bg-white hover:bg-gray-50 border border-gray-200'
              )}
            >
              <div className="font-medium">{test}</div>
              <div className={cn('text-xs mt-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                {index < 4 ? 'Laboratory Test' : 'Radiology'}
              </div>
              <div className="mt-2 text-xs opacity-75">Click to order</div>
            </button>
          ))}
        </div>
      </div>

      {/* Ordered Investigations */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200')}>
        <h3 className={cn('text-lg font-semibold mb-4', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
          Ordered Investigations ({investigations.length})
        </h3>
        
        <div className="space-y-3">
          {investigations.map((inv, index) => (
            <div key={index} className={cn('p-4 rounded-lg flex items-center justify-between', theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50')}>
              <div>
                <div className="font-medium">{inv.testName}</div>
                <div className="text-sm opacity-75 mt-1">
                  Type: {inv.type} • Priority: 
                  <span className={cn('ml-1 px-2 py-0.5 rounded text-xs', {
                    'bg-red-100 text-red-800': inv.priority === 'urgent',
                    'bg-yellow-100 text-yellow-800': inv.priority === 'stat',
                    'bg-gray-100 text-gray-800': inv.priority === 'routine',
                  })}>
                    {inv.priority.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={cn('px-3 py-1 rounded-full text-xs font-medium', theme === 'dark' 
                  ? 'bg-blue-900/30 text-blue-300' 
                  : 'bg-blue-100 text-blue-800'
                )}>
                  Sent to Lab Queue
                </span>
                <button
                  onClick={() => forwardToDepartment('lab')}
                  className={cn('px-3 py-1 rounded text-sm', theme === 'dark' 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
                  )}
                >
                  Track
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <button
            onClick={() => forwardToDepartment('lab')}
            className={cn('px-6 py-3 rounded-xl font-medium w-full flex items-center justify-center gap-2', theme === 'dark' 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            )}
          >
            <ArrowRight className="w-5 h-5" />
            Forward All to Laboratory
          </button>
        </div>
      </div>

      {/* Results Notification */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-emerald-900/20 border-emerald-700/50' : 'bg-emerald-50 border-emerald-200')}>
        <h3 className={cn('text-lg font-semibold mb-4', theme === 'dark' ? 'text-emerald-200' : 'text-emerald-900')}>
          🔔 Results Notification System
        </h3>
        
        <div className="space-y-3">
          <div className={cn('p-4 rounded-lg', theme === 'dark' ? 'bg-gray-800' : 'bg-white')}>
            <div className="font-medium">Automated Workflow:</div>
            <ol className="mt-2 space-y-2 text-sm">
              <li>1. Order sent to Lab queue with priority flag</li>
              <li>2. Lab completes test → Results auto-uploaded to patient file</li>
              <li>3. Abnormal results trigger alert to ordering clinician</li>
              <li>4. System auto-forwards to next department if protocol-driven</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDepartmentFlow = () => (
    <div className="p-6 space-y-6">
      <div>
        <h1 className={cn('text-3xl font-bold mb-2', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
          Department-to-Department Workflow
        </h1>
        <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
          Seamless patient routing between departments
        </p>
      </div>

      {/* Patient Journey */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200')}>
        <h3 className={cn('text-lg font-semibold mb-6', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
          Patient Journey: OPD → Lab → Pharmacy → Billing
        </h3>
        
        <div className="relative">
          {/* Timeline */}
          <div className="absolute left-0 top-0 bottom-0 w-1 ml-6">
            <div className={cn('h-full', theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')} />
          </div>
          
          {/* Steps */}
          <div className="space-y-8 pl-12">
            {[
              { 
                title: 'OPD Consultation', 
                status: 'completed',
                action: 'Doctor forwards to Laboratory',
                details: 'Priority: Urgent • Tests: Malaria RDT, CBC'
              },
              { 
                title: 'Laboratory', 
                status: 'in-progress',
                action: 'Lab technician performs tests',
                details: 'Status: Tests in progress • Estimated: 30 min'
              },
              { 
                title: 'Pharmacy', 
                status: 'pending',
                action: 'Awaiting lab results',
                details: 'Prescription ready when lab confirms'
              },
              { 
                title: 'Billing', 
                status: 'pending',
                action: 'Auto-generated bill',
                details: 'Total estimate: $69.50'
              },
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className={cn('absolute -left-7 w-4 h-4 rounded-full border-4', {
                  'bg-green-500 border-green-500': step.status === 'completed',
                  'bg-yellow-500 border-yellow-500 animate-pulse': step.status === 'in-progress',
                  'bg-gray-300 border-gray-300': step.status === 'pending',
                })} />
                
                <div className={cn('p-4 rounded-xl', theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50')}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{step.title}</h4>
                      <p className="text-sm mt-1">{step.action}</p>
                      <p className="text-xs opacity-75 mt-2">{step.details}</p>
                    </div>
                    
                    <span className={cn('px-3 py-1 rounded-full text-xs font-medium', {
                      'bg-green-100 text-green-800': step.status === 'completed',
                      'bg-yellow-100 text-yellow-800': step.status === 'in-progress',
                      'bg-gray-100 text-gray-800': step.status === 'pending',
                    })}>
                      {step.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Queue */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200')}>
        <h3 className={cn('text-lg font-semibold mb-4', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
          Department Queues
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {MOCK_DEPARTMENTS.map((dept) => (
            <div 
              key={dept.id}
              className={cn('p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02]', theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700' 
                : 'bg-white hover:bg-gray-50 border border-gray-200'
              )}
              onClick={() => forwardToDepartment(dept.id)}
            >
              <div className="font-medium">{dept.name}</div>
              <div className={cn('mt-2 flex items-center justify-between', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                <span className="text-sm">Queue:</span>
                <span className={cn('px-2 py-0.5 rounded text-xs font-bold', {
                  'bg-red-100 text-red-800': dept.queue > 4,
                  'bg-yellow-100 text-yellow-800': dept.queue > 2 && dept.queue <= 4,
                  'bg-green-100 text-green-800': dept.queue <= 2,
                })}>
                  {dept.queue} patients
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Routes */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200')}>
        <h3 className={cn('text-lg font-semibold mb-4', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
          Active Patient Routes
        </h3>
        
        <div className="space-y-3">
          {departmentRoutes.map((route, index) => (
            <div key={index} className={cn('p-4 rounded-lg flex items-center justify-between', theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50')}>
              <div className="flex items-center gap-4">
                <div className={cn('p-2 rounded-lg', theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')}>
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">
                    {route.from.toUpperCase()} → {route.to.toUpperCase()}
                  </div>
                  <div className="text-sm opacity-75 mt-1">
                    Patient: {route.patientId} • Priority: {route.priority} • {route.timestamp}
                  </div>
                </div>
              </div>
              
              <span className={cn('px-3 py-1 rounded-full text-xs font-medium', {
                'bg-green-100 text-green-800': route.status === 'completed',
                'bg-yellow-100 text-yellow-800': route.status === 'in-progress',
                'bg-gray-100 text-gray-800': route.status === 'pending',
              })}>
                {route.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Flexible Routing Feature */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200')}>
        <h3 className={cn('text-lg font-semibold mb-4', theme === 'dark' ? 'text-blue-200' : 'text-blue-900')}>
          🚀 Flexible Routing Feature
        </h3>
        
        <div className="space-y-3">
          <p className="text-sm">
            At <strong>ANY department</strong>, staff can forward patient to <strong>ANY other department</strong>
          </p>
          <div className={cn('p-4 rounded-lg', theme === 'dark' ? 'bg-gray-800' : 'bg-white')}>
            <div className="font-medium">Example Use Case:</div>
            <p className="text-sm mt-1">
              Pharmacist notices concerning symptom → Routes back to doctor for review
            </p>
            <p className="text-xs opacity-75 mt-2">
              System maintains audit trail of all patient movements
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="p-6 space-y-6">
      <div>
        <h1 className={cn('text-3xl font-bold mb-2', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
          Automatic Billing Capture
        </h1>
        <p className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
          Real-time service logging and billing generation
        </p>
      </div>

      {/* Itemized Bill */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200')}>
        <h3 className={cn('text-lg font-semibold mb-6', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
          Itemized Bill
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={cn('border-b text-sm font-semibold', theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600')}>
                <th className="py-3 px-4 text-left">Service</th>
                <th className="py-3 px-4 text-left">Quantity</th>
                <th className="py-3 px-4 text-left">Unit Price</th>
                <th className="py-3 px-4 text-left">Insurance</th>
                <th className="py-3 px-4 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {billingItems.map((item, index) => (
                <tr key={index} className={cn('border-b', theme === 'dark' ? 'border-gray-800' : 'border-gray-100')}>
                  <td className="py-4 px-4">
                    <div className="font-medium">{item.service}</div>
                  </td>
                  <td className="py-4 px-4">{item.quantity}</td>
                  <td className="py-4 px-4">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-4 px-4">
                    <span className={cn('px-2 py-0.5 rounded text-xs', item.insuranceCovered 
                      ? (theme === 'dark' ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')
                      : (theme === 'dark' ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800')
                    )}>
                      {item.insuranceCovered ? 'Covered' : 'Self Pay'}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium">${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={cn('border-t', theme === 'dark' ? 'border-gray-700' : 'border-gray-200')}>
                <td colSpan={4} className="py-4 px-4 text-right font-semibold">
                  Insurance Covered:
                </td>
                <td className="py-4 px-4 font-bold text-green-600">
                  ${insuranceCovered.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="py-4 px-4 text-right font-semibold">
                  Patient Payable:
                </td>
                <td className="py-4 px-4 font-bold text-blue-600">
                  ${patientPayable.toFixed(2)}
                </td>
              </tr>
              <tr className={cn('border-t-2', theme === 'dark' ? 'border-gray-600' : 'border-gray-300')}>
                <td colSpan={4} className="py-4 px-4 text-right font-bold text-lg">
                  GRAND TOTAL:
                </td>
                <td className="py-4 px-4 font-bold text-lg">
                  ${totalBill.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm opacity-75">
            Bill automatically generated from services rendered
          </div>
          
          <div className="flex items-center gap-3">
            <button className={cn('px-4 py-2 rounded-lg flex items-center gap-2', theme === 'dark' 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-gray-200 hover:bg-gray-300'
            )}>
              <Download className="w-4 h-4" />
              Export Bill
            </button>
            
            <button
              onClick={() => forwardToDepartment('billing')}
              className={cn('px-6 py-3 rounded-xl font-medium flex items-center gap-2', theme === 'dark' 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              )}
            >
              <Receipt className="w-5 h-5" />
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>

      {/* Billing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={cn('p-6 rounded-2xl border', theme === 'dark' ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200')}>
          <div className="text-3xl font-bold text-blue-600">${totalBill.toFixed(2)}</div>
          <div className="text-sm font-medium mt-2">Total Bill</div>
          <div className="text-xs opacity-75">All services rendered</div>
        </div>
        
        <div className={cn('p-6 rounded-2xl border', theme === 'dark' ? 'bg-green-900/20 border-green-700/50' : 'bg-green-50 border-green-200')}>
          <div className="text-3xl font-bold text-green-600">${insuranceCovered.toFixed(2)}</div>
          <div className="text-sm font-medium mt-2">Insurance Covered</div>
          <div className="text-xs opacity-75">Paid by insurance</div>
        </div>
        
        <div className={cn('p-6 rounded-2xl border', theme === 'dark' ? 'bg-purple-900/20 border-purple-700/50' : 'bg-purple-50 border-purple-200')}>
          <div className="text-3xl font-bold text-purple-600">${patientPayable.toFixed(2)}</div>
          <div className="text-sm font-medium mt-2">Patient Payable</div>
          <div className="text-xs opacity-75">Due at discharge</div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className={cn('rounded-2xl border p-6', theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-gray-200')}>
        <h3 className={cn('text-lg font-semibold mb-4', theme === 'dark' ? 'text-gray-200' : 'text-gray-800')}>
          Payment Processing
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { method: 'Cash', icon: '💵' },
            { method: 'Mobile Money', icon: '📱' },
            { method: 'Credit Card', icon: '💳' },
            { method: 'Insurance', icon: '🏥' },
          ].map((payment, index) => (
            <button
              key={index}
              className={cn('p-4 rounded-xl text-center transition-all hover:scale-[1.02]', theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700' 
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              )}
            >
              <div className="text-2xl mb-2">{payment.icon}</div>
              <div className="font-medium">{payment.method}</div>
            </button>
          ))}
        </div>
        
        <div className={cn('mt-6 p-4 rounded-lg', theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50')}>
          <div className="font-medium">📧 e-Receipt System</div>
          <p className="text-sm mt-1">
            Patient receives e-receipt via SMS/Email upon payment completion
          </p>
        </div>
      </div>
    </div>
  );

  /* =========================================================================
     MAIN RENDER
  ========================================================================== */

  const renderWorkspaceContent = () => {
    switch (activeOperation) {
      case 'newEncounter': return renderNewEncounter();
      case 'differentialAI': return renderDifferentialAI();
      case 'ePrescribing': return renderEPrescribing();
      case 'clinicalNotes': return renderClinicalNotes();
      case 'investigations': return renderInvestigations();
      case 'departmentFlow': return renderDepartmentFlow();
      case 'billing': return renderBilling();
      default: return renderNewEncounter();
    }
  };

  return (
    <ContentLayout
      operations={CLINICAL_OPERATIONS}
      activeOperation={activeOperation}
      onOperationChange={handleOperationChange}
      defaultOperation="newEncounter"
    >
      {renderWorkspaceContent()}
    </ContentLayout>
  );
};

ClinicalEncounterModule.displayName = 'ClinicalEncounterModule';
export default ClinicalEncounterModule;