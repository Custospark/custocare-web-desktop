// src/modules/clinical/components/SymptomCapture.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  MessageSquare, Plus, Trash2, Activity, Thermometer,
  Heart, Droplets, Weight, AlertCircle, Stethoscope
} from 'lucide-react';
import type { RootState } from '../../../store';
import { cn } from '../../../utils/classNameUtils';
import type { Symptom, PatientVitals, Patient } from '../types/clinicalEncounterTypes';

interface SymptomCaptureProps {
  patient: Patient;
  onDataChange: (data: {
    chiefComplaint: string;
    symptoms: Symptom[];
    vitals: PatientVitals;
    examFindings: string;
  }) => void;
}

export const SymptomCapture: React.FC<SymptomCaptureProps> = ({
  patient,
  onDataChange
}) => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  
  // Form state
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [vitals, setVitals] = useState<PatientVitals>({
    temperature: 37.0,
    bloodPressure: '120/80',
    pulse: 80,
    respiratoryRate: 16,
    spO2: 98,
    weight: 70,
    height: 170,
  });
  const [examFindings, setExamFindings] = useState('');

  // Notify parent of changes
  useEffect(() => {
    onDataChange({
      chiefComplaint,
      symptoms,
      vitals,
      examFindings
    });
  }, [chiefComplaint, symptoms, vitals, examFindings, onDataChange]);

  // Calculate BMI
  const bmi = vitals.height 
    ? (vitals.weight / Math.pow(vitals.height / 100, 2)).toFixed(1)
    : null;

  const addSymptom = useCallback(() => {
    const newSymptom: Symptom = {
      id: `SYM-${Date.now()}`,
      name: '',
      severity: 5,
      duration: '',
      onset: 'gradual',
      timestamp: new Date().toISOString()
    };
    setSymptoms(prev => [...prev, newSymptom]);
  }, []);

  const updateSymptom = useCallback((id: string, field: keyof Symptom, value: any) => {
    setSymptoms(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  }, []);

  const removeSymptom = useCallback((id: string) => {
    setSymptoms(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateVital = useCallback((field: keyof PatientVitals, value: number | string) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  }, []);

  // Check for abnormal vitals
  const abnormalVitals = [];
  if (vitals.temperature > 37.5) abnormalVitals.push(`Fever: ${vitals.temperature}°C`);
  if (vitals.temperature < 36.0) abnormalVitals.push(`Hypothermia: ${vitals.temperature}°C`);
  if (vitals.pulse > 100) abnormalVitals.push(`Tachycardia: ${vitals.pulse} bpm`);
  if (vitals.pulse < 60) abnormalVitals.push(`Bradycardia: ${vitals.pulse} bpm`);
  if (vitals.spO2 < 95) abnormalVitals.push(`Low SpO2: ${vitals.spO2}%`);
  if (vitals.respiratoryRate > 20) abnormalVitals.push(`Tachypnea: ${vitals.respiratoryRate}/min`);

  return (
    <div className="space-y-6">
      {/* Chief Complaint */}
      <div className={cn(
        'rounded-2xl border p-6',
        theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
      )}>
        <h3 className={cn(
          'text-lg font-semibold mb-4 flex items-center gap-2',
          theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
        )}>
          <MessageSquare className="w-5 h-5" />
          1. Chief Complaint
        </h3>
        
        <div>
          <label className={cn(
            'block text-sm font-medium mb-2',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            Main presenting problem *
          </label>
          <input
            type="text"
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            placeholder="e.g., Fever and headache for 3 days"
            className={cn(
              'w-full px-4 py-3 rounded-xl border text-sm',
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                : 'bg-white border-gray-300 placeholder-gray-400'
            )}
          />
        </div>
      </div>

      {/* Symptoms */}
      <div className={cn(
        'rounded-2xl border p-6',
        theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
      )}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn(
            'text-lg font-semibold flex items-center gap-2',
            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
          )}>
            <Activity className="w-5 h-5" />
            2. Associated Symptoms
          </h3>
          <button
            type="button"
            onClick={addSymptom}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2',
              theme === 'dark' 
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            )}
          >
            <Plus className="w-4 h-4" /> Add Symptom
          </button>
        </div>

        {symptoms.length === 0 ? (
          <div className={cn(
            'p-8 rounded-xl text-center',
            theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
          )}>
            <p className={cn(
              'text-sm',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              No symptoms added yet. Click "Add Symptom" to begin.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {symptoms.map((symptom) => (
              <div
                key={symptom.id}
                className={cn(
                  'p-4 rounded-xl border',
                  theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  <div className="md:col-span-4">
                    <label className={cn(
                      'block text-xs mb-1',
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      Symptom Name *
                    </label>
                    <input
                      type="text"
                      value={symptom.name}
                      onChange={(e) => updateSymptom(symptom.id, 'name', e.target.value)}
                      placeholder="e.g., Headache, Cough, Nausea"
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border text-sm',
                        theme === 'dark' 
                          ? 'bg-gray-900 border-gray-700 text-white' 
                          : 'bg-white border-gray-300'
                      )}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className={cn(
                      'block text-xs mb-1',
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      Severity: {symptom.severity}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={symptom.severity}
                      onChange={(e) => updateSymptom(symptom.id, 'severity', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>Mild</span>
                      <span className={theme === 'dark' ? 'text-red-400' : 'text-red-600'}>Severe</span>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className={cn(
                      'block text-xs mb-1',
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      Duration
                    </label>
                    <input
                      type="text"
                      value={symptom.duration}
                      onChange={(e) => updateSymptom(symptom.id, 'duration', e.target.value)}
                      placeholder="e.g., 3 days"
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border text-sm',
                        theme === 'dark' 
                          ? 'bg-gray-900 border-gray-700 text-white' 
                          : 'bg-white border-gray-300'
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={cn(
                      'block text-xs mb-1',
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      Onset
                    </label>
                    <select
                      value={symptom.onset}
                      onChange={(e) => updateSymptom(symptom.id, 'onset', e.target.value)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border text-sm',
                        theme === 'dark' 
                          ? 'bg-gray-900 border-gray-700 text-white' 
                          : 'bg-white border-gray-300'
                      )}
                    >
                      <option value="sudden">Sudden</option>
                      <option value="gradual">Gradual</option>
                    </select>
                  </div>

                  <div className="md:col-span-1 flex items-end">
                    <button
                      onClick={() => removeSymptom(symptom.id)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        theme === 'dark' 
                          ? 'hover:bg-red-900/30 text-red-400' 
                          : 'hover:bg-red-50 text-red-600'
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vital Signs */}
      <div className={cn(
        'rounded-2xl border p-6',
        theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
      )}>
        <h3 className={cn(
          'text-lg font-semibold mb-4 flex items-center gap-2',
          theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
        )}>
          <Thermometer className="w-5 h-5" />
          3. Vital Signs
        </h3>

        {abnormalVitals.length > 0 && (
          <div className={cn(
            'p-4 rounded-lg mb-4 border',
            theme === 'dark' 
              ? 'bg-red-900/20 border-red-700/50' 
              : 'bg-red-50 border-red-200'
          )}>
            <div className="flex items-center gap-2">
              <AlertCircle className={cn(
                'w-5 h-5',
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              )} />
              <span className={cn(
                'font-semibold',
                theme === 'dark' ? 'text-red-300' : 'text-red-700'
              )}>
                Abnormal Values Detected:
              </span>
            </div>
            <ul className="mt-2 space-y-1">
              {abnormalVitals.map((vital, idx) => (
                <li key={idx} className={cn(
                  'text-sm',
                  theme === 'dark' ? 'text-red-300' : 'text-red-700'
                )}>
                  • {vital}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div>
            <label className={cn(
              'text-xs block mb-1 flex items-center gap-1',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              <Thermometer className="w-3 h-3" /> Temp (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={vitals.temperature}
              onChange={(e) => updateVital('temperature', parseFloat(e.target.value))}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-center font-bold',
                vitals.temperature > 37.5 ? 'text-red-600' : '',
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300'
              )}
            />
          </div>

          <div>
            <label className={cn(
              'text-xs block mb-1 flex items-center gap-1',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              <Activity className="w-3 h-3" /> BP (mmHg)
            </label>
            <input
              type="text"
              value={vitals.bloodPressure}
              onChange={(e) => updateVital('bloodPressure', e.target.value)}
              placeholder="120/80"
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-center font-bold',
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300'
              )}
            />
          </div>

          <div>
            <label className={cn(
              'text-xs block mb-1 flex items-center gap-1',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              <Heart className="w-3 h-3" /> Pulse (bpm)
            </label>
            <input
              type="number"
              value={vitals.pulse}
              onChange={(e) => updateVital('pulse', parseInt(e.target.value))}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-center font-bold',
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300'
              )}
            />
          </div>

          <div>
            <label className={cn(
              'text-xs block mb-1 flex items-center gap-1',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              <Activity className="w-3 h-3" /> RR (/min)
            </label>
            <input
              type="number"
              value={vitals.respiratoryRate}
              onChange={(e) => updateVital('respiratoryRate', parseInt(e.target.value))}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-center font-bold',
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300'
              )}
            />
          </div>

          <div>
            <label className={cn(
              'text-xs block mb-1 flex items-center gap-1',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              <Droplets className="w-3 h-3" /> SpO2 (%)
            </label>
            <input
              type="number"
              value={vitals.spO2}
              onChange={(e) => updateVital('spO2', parseInt(e.target.value))}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-center font-bold',
                vitals.spO2 < 95 ? 'text-red-600' : '',
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300'
              )}
            />
          </div>

          <div>
            <label className={cn(
              'text-xs block mb-1 flex items-center gap-1',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              <Weight className="w-3 h-3" /> Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={vitals.weight}
              onChange={(e) => updateVital('weight', parseFloat(e.target.value))}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-center font-bold',
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300'
              )}
            />
          </div>

          <div>
            <label className={cn(
              'text-xs block mb-1',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              BMI
            </label>
            <div className={cn(
              'w-full px-3 py-2 rounded-lg border text-center font-bold',
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 text-cyan-400' 
                : 'bg-gray-50 border-gray-300 text-blue-600'
            )}>
              {bmi || '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Examination */}
      <div className={cn(
        'rounded-2xl border p-6',
        theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
      )}>
        <h3 className={cn(
          'text-lg font-semibold mb-4 flex items-center gap-2',
          theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
        )}>
          <Stethoscope className="w-5 h-5" />
          4. Physical Examination Findings
        </h3>
        
        <div>
          <label className={cn(
            'block text-sm font-medium mb-2',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            Examination Notes
          </label>
          <textarea
            value={examFindings}
            onChange={(e) => setExamFindings(e.target.value)}
            rows={5}
            placeholder="Document examination findings: General appearance, system examination, palpation, auscultation findings..."
            className={cn(
              'w-full px-4 py-3 rounded-xl border text-sm resize-none',
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                : 'bg-white border-gray-300 placeholder-gray-400'
            )}
          />
          <div className={cn(
            'text-xs mt-2',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
          )}>
            💡 Tip: Be as detailed as possible. AI will use this information for diagnosis.
          </div>
        </div>
      </div>
    </div>
  );
};