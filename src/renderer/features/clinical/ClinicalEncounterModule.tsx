// features/clinical/ClinicalEncounterModule.tsx
import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/index';
import { ContentLayout } from '../../components/content/ContentLayout';
import {
  Stethoscope,
  Thermometer,
  Heart,
  Pill,
  Microscope,
  FileText,
  AlertCircle,
  Brain,
  Send,
  Clock,
  User,
} from 'lucide-react';
import { cn } from '../../utils/classNameUtils';
import {
  Symptom,
  VitalSigns,
  checkDrugInteractions,
  forwardToDepartment,
  updateSymptoms,
  addVitalSigns,
  updateClinicalNotes,
  addToDepartmentQueue,
} from '../../store/slices/clinicalEncounterSlice';

interface DepartmentOption {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const ClinicalEncounterModule: React.FC<{ encounterId?: string }> = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const { currentEncounter, aiSuggestions,  } = useSelector(
    (state: RootState) => state.clinicalEncounter
  );
  
  const [activeSection, setActiveSection] = useState<'symptoms' | 'vitals' | 'exam' | 'diagnosis' | 'prescription' | 'lab' | 'notes'>('symptoms');
  const [symptomInput, setSymptomInput] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  
  const departments: DepartmentOption[] = [
    { id: 'laboratory', name: 'Laboratory', icon: <Microscope className="w-4 h-4" /> },
    { id: 'pharmacy', name: 'Pharmacy', icon: <Pill className="w-4 h-4" /> },
    { id: 'radiology', name: 'Radiology', icon: <Heart className="w-4 h-4" /> },
    { id: 'billing', name: 'Billing', icon: <FileText className="w-4 h-4" /> },
  ];

  // Mock vital signs template
  const initialVitals: VitalSigns = {
    temperature: null,
    bloodPressure: { systolic: null, diastolic: null },
    pulse: null,
    respiratoryRate: null,
    spO2: null,
    weight: null,
    height: null,
    timestamp: new Date().toISOString(),
  };

  const [vitals, setVitals] = useState<VitalSigns>(initialVitals);

  // Handle symptom updates with AI suggestions
//   const handleSymptomUpdate = useCallback(async (symptoms: Symptom[]) => {
//     setSelectedSymptoms(symptoms);
//     dispatch(updateSymptoms(symptoms));
    
//     // Generate AI diagnosis suggestions
//     if (symptoms.length > 0) {
//     //   dispatch(generateAIDiagnosis(symptoms));
//     }
//   }, [dispatch]);

  // Handle vital signs submission
  const handleVitalsSubmit = useCallback(() => {
    dispatch(addVitalSigns(vitals));
    
    // Check for abnormal values
    const abnormalities = [];
    if (vitals.temperature && vitals.temperature > 38) {
      abnormalities.push('Fever detected');
    }
    if (vitals.spO2 && vitals.spO2 < 95) {
      abnormalities.push('Low oxygen saturation');
    }
    
    if (abnormalities.length > 0) {
      // Update AI suggestions with abnormalities
      // This would trigger additional AI analysis
    }
  }, [dispatch, vitals]);

  // Handle drug interaction check
//   const checkInteractions = useCallback(async () => {
//     if (currentEncounter) {
//     //   const medications = currentEncounter.prescriptions.map(p => p.name);
//     //   const allergies = currentEncounter.allergies.map(a => a.allergen);
      
//     //   dispatch(checkDrugInteractions({ medications, allergies }));
//     }
//   }, [dispatch, currentEncounter]);

  // Forward patient to department
  const handleForwardToDepartment = useCallback(async (departmentId: string) => {
    if (!currentEncounter) return;
    
    // const transfer = await dispatch(forwardToDepartment({
    //   encounterId: currentEncounter.id,
    //   fromDepartment: 'opd',
    //   toDepartment: departmentId,
    //   reason: 'Further investigation/treatment required',
    //   priority: 'routine',
    // })).unwrap();
    
    // Add to department queue
    dispatch(addToDepartmentQueue({
      department: departmentId,
      patient: {
        encounterId: currentEncounter.id,
        patientId: currentEncounter.patientId,
        patientName: 'John Doe', // This would come from patient data
        priority: 'routine',
        task: departmentId === 'laboratory' ? 'Complete blood count' : 'Dispense medication',
      },
    }));
  }, [dispatch, currentEncounter]);

  // Render AI diagnosis suggestions
  const renderAIDiagnoses = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-cyan-400" />
        <h4 className="font-semibold text-gray-200">AI Differential Diagnosis</h4>
      </div>
      {aiSuggestions.diagnoses.map((diagnosis, index) => (
        <div
          key={diagnosis.id}
          className={cn(
            'p-3 rounded-lg border transition-all cursor-pointer',
            theme === 'dark'
              ? 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/50'
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          )}
          onClick={() => {
            // Add to selected diagnoses
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-gray-200">{diagnosis.name}</h5>
              <p className="text-xs text-gray-400">{diagnosis.icd10Code}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-sm font-bold text-cyan-300">
                  {(diagnosis.probability * 100).toFixed(0)}%
                </span>
                <div className={cn(
                  'text-xs',
                  diagnosis.confidence === 'high' ? 'text-emerald-400' :
                  diagnosis.confidence === 'medium' ? 'text-amber-400' : 'text-rose-400'
                )}>
                  {diagnosis.confidence} confidence
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-400">
              Evidence: {diagnosis.evidence.join(', ')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  // Render clinical notes
  const renderClinicalNotes = () => {
    if (!currentEncounter) return null;
    
    return (
      <div className="space-y-4">
        <div className={cn(
          'p-4 rounded-xl border',
          theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
        )}>
          <h4 className="font-semibold text-gray-200 mb-2">History of Presenting Illness</h4>
          <textarea
            className={cn(
              'w-full h-32 p-3 rounded-lg text-sm',
              theme === 'dark'
                ? 'bg-gray-900/50 border-gray-700 text-gray-200'
                : 'bg-white border-gray-300 text-gray-800'
            )}
            value={currentEncounter.clinicalNotes.hpi}
            onChange={(e) => dispatch(updateClinicalNotes({ hpi: e.target.value }))}
            placeholder="Enter patient history..."
          />
        </div>
        
        <div className={cn(
          'p-4 rounded-xl border',
          theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
        )}>
          <h4 className="font-semibold text-gray-200 mb-2">Assessment & Plan</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Assessment</label>
              <textarea
                className={cn(
                  'w-full h-24 p-3 rounded-lg text-sm',
                  theme === 'dark'
                    ? 'bg-gray-900/50 border-gray-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-800'
                )}
                value={currentEncounter.clinicalNotes.assessment}
                onChange={(e) => dispatch(updateClinicalNotes({ assessment: e.target.value }))}
                placeholder="Enter assessment..."
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Plan</label>
              <textarea
                className={cn(
                  'w-full h-24 p-3 rounded-lg text-sm',
                  theme === 'dark'
                    ? 'bg-gray-900/50 border-gray-700 text-gray-200'
                    : 'bg-white border-gray-300 text-gray-800'
                )}
                value={currentEncounter.clinicalNotes.plan}
                onChange={(e) => dispatch(updateClinicalNotes({ plan: e.target.value }))}
                placeholder="Enter treatment plan..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render department forwarding options
  const renderDepartmentForwarding = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Send className="w-5 h-5 text-amber-400" />
        <h4 className="font-semibold text-gray-200">Forward Patient to Department</h4>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {departments.map((dept) => (
          <button
            key={dept.id}
            className={cn(
              'p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all',
              theme === 'dark'
                ? 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/50 hover:border-cyan-500/50'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-blue-500/50'
            )}
            onClick={() => handleForwardToDepartment(dept.id)}
          >
            <div className={cn(
              'p-2 rounded-lg',
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            )}>
              {dept.icon}
            </div>
            <span className="font-medium text-sm text-gray-200">{dept.name}</span>
          </button>
        ))}
      </div>
      
      <div className="mt-6">
        <h5 className="text-sm font-medium text-gray-300 mb-2">Current Patient Status</h5>
        <div className={cn(
          'p-3 rounded-lg',
          theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">John Doe</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-gray-400">In Consultation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkspaceContent = () => {
    switch (activeSection) {
      case 'symptoms':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-200 mb-4">Chief Complaint & Symptoms</h3>
              
              {/* Symptom Entry */}
              <div className="mb-6">
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    className={cn(
                      'flex-1 p-3 rounded-lg',
                      theme === 'dark'
                        ? 'bg-gray-900/50 border-gray-700 text-gray-200'
                        : 'bg-white border-gray-300 text-gray-800'
                    )}
                    placeholder="Enter chief complaint..."
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                  />
                  <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
                    Add
                  </button>
                </div>
                
                {/* Selected Symptoms */}
                <div className="space-y-2">
                  {selectedSymptoms.map((symptom, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                      <div>
                        <span className="text-gray-200">{symptom.name}</span>
                        <span className="text-xs text-gray-400 ml-3">Severity: {symptom.severity}/10</span>
                      </div>
                      <button className="text-rose-400 hover:text-rose-300">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* AI Diagnosis Suggestions */}
              {aiSuggestions.diagnoses.length > 0 && renderAIDiagnoses()}
            </div>
          </div>
        );
        
      case 'vitals':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-200 mb-4">Vital Signs Capture</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Temperature (°C)', value: vitals.temperature, setter: (val: number) => setVitals({...vitals, temperature: val}) },
                { label: 'Systolic BP', value: vitals.bloodPressure.systolic, setter: (val: number) => setVitals({...vitals, bloodPressure: {...vitals.bloodPressure, systolic: val}}) },
                { label: 'Diastolic BP', value: vitals.bloodPressure.diastolic, setter: (val: number) => setVitals({...vitals, bloodPressure: {...vitals.bloodPressure, diastolic: val}}) },
                { label: 'Pulse (bpm)', value: vitals.pulse, setter: (val: number) => setVitals({...vitals, pulse: val}) },
                { label: 'Respiratory Rate', value: vitals.respiratoryRate, setter: (val: number) => setVitals({...vitals, respiratoryRate: val}) },
                { label: 'SpO2 (%)', value: vitals.spO2, setter: (val: number) => setVitals({...vitals, spO2: val}) },
              ].map((field, index) => (
                <div key={index} className="space-y-2">
                  <label className="text-sm text-gray-400">{field.label}</label>
                  <input
                    type="number"
                    className={cn(
                      'w-full p-3 rounded-lg',
                      theme === 'dark'
                        ? 'bg-gray-900/50 border-gray-700 text-gray-200'
                        : 'bg-white border-gray-300 text-gray-800'
                    )}
                    value={field.value || ''}
                    onChange={(e) => field.setter(parseFloat(e.target.value))}
                  />
                </div>
              ))}
            </div>
            
            <button
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              onClick={handleVitalsSubmit}
            >
              Record Vital Signs
            </button>
          </div>
        );
        
      case 'notes':
        return renderClinicalNotes();
        
      default:
        return null;
    }
  };

  // Clinical operations/sections
  const CLINICAL_OPERATIONS = [
    { id: 'symptoms', label: 'Symptoms & History', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'vitals', label: 'Vital Signs', icon: <Thermometer className="w-4 h-4" /> },
    { id: 'exam', label: 'Clinical Exam', icon: <Heart className="w-4 h-4" /> },
    { id: 'diagnosis', label: 'Diagnosis', icon: <Brain className="w-4 h-4" /> },
    { id: 'prescription', label: 'E-Prescribing', icon: <Pill className="w-4 h-4" /> },
    { id: 'lab', label: 'Lab Orders', icon: <Microscope className="w-4 h-4" /> },
    { id: 'notes', label: 'Clinical Notes', icon: <FileText className="w-4 h-4" /> },
    { id: 'forward', label: 'Forward Patient', icon: <Send className="w-4 h-4" /> },
  ];

  return (
    <ContentLayout
      operations={CLINICAL_OPERATIONS}
      activeOperation={activeSection}
      onOperationChange={(op) => setActiveSection(op as any)}
      defaultOperation="symptoms"
      headerTitle={`Clinical Encounter - ${currentEncounter?.id || 'New'}`}
      rightSidebarContent={renderDepartmentForwarding()}
    >
      {/* AI Alerts Banner */}
      {aiSuggestions.alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {aiSuggestions.alerts.map((alert, index) => (
            <div
              key={index}
              className={cn(
                'p-4 rounded-xl border flex items-start gap-3',
                alert.severity === 'danger'
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : alert.severity === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-cyan-500/10 border-cyan-500/30'
              )}
            >
              <AlertCircle className={cn(
                'w-5 h-5 mt-0.5',
                alert.severity === 'danger' ? 'text-rose-400' :
                alert.severity === 'warning' ? 'text-amber-400' : 'text-cyan-400'
              )} />
              <div>
                <p className="text-sm text-gray-200">{alert.message}</p>
                {alert.type === 'interaction' && (
                  <button className="text-xs text-cyan-400 hover:text-cyan-300 mt-1">
                    View alternative suggestions
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {renderWorkspaceContent()}
      
      {/* Action Bar */}
      <div className="fixed bottom-6 right-6 flex gap-3">
        <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700">
          Save Draft
        </button>
        <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
          Complete Encounter
        </button>
      </div>
    </ContentLayout>
  );
};

export default ClinicalEncounterModule;