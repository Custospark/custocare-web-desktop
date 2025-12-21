// src/modules/clinical/components/RealtimeAIDiagnosis.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Brain, TrendingUp, Activity, AlertCircle, CheckCircle,
  Zap, Globe, Calendar, Users, FlaskConical
} from 'lucide-react';
import type { RootState } from '../../../store';
import { cn } from '../../../utils/classNameUtils';
import type {
  Symptom,
  PatientVitals,
  DifferentialDiagnosis,
  ContextFactor,
  DiagnosisUpdate
} from '../types/clinicalEncounterTypes';

interface RealtimeAIDiagnosisProps {
  chiefComplaint: string;
  symptoms: Symptom[];
  vitals: PatientVitals | null;
  examFindings: string;
}

// Mock AI diagnosis engine
const generateDifferentials = (
  chiefComplaint: string,
  symptoms: Symptom[],
  vitals: PatientVitals | null
): DifferentialDiagnosis[] => {
  const differentials: DifferentialDiagnosis[] = [];
  const now = new Date().toISOString();

  // Extract key features
  const hasFever = vitals && vitals.temperature > 37.5;
  const hasHeadache = symptoms.some(s => s.name.toLowerCase().includes('headache'));
  const hasBodyPain = symptoms.some(s => 
    s.name.toLowerCase().includes('pain') || 
    s.name.toLowerCase().includes('ache')
  );
  const hasCough = symptoms.some(s => s.name.toLowerCase().includes('cough'));
  const hasAbdominalPain = symptoms.some(s => 
    s.name.toLowerCase().includes('abdomen') ||
    s.name.toLowerCase().includes('stomach')
  );

  // Malaria (high probability if fever + headache in endemic area)
  if (hasFever || hasHeadache) {
    differentials.push({
      id: 'DIFF-001',
      condition: 'Malaria',
      probability: hasFever && hasHeadache ? 85 : hasFever ? 70 : 45,
      confidence: hasFever && hasHeadache ? 'high' : 'medium',
      evidence: [
        ...(hasFever ? ['High-grade fever present'] : []),
        ...(hasHeadache ? ['Severe headache reported'] : []),
        'Patient in malaria-endemic region',
        ...(hasBodyPain ? ['Body aches consistent with malaria'] : [])
      ],
      suggestedTests: ['Malaria RDT', 'Blood smear (thick & thin)', 'Complete Blood Count'],
      contextFactors: [
        {
          type: 'geographic',
          factor: 'Malaria-endemic zone',
          weight: 0.3,
          description: 'Region has high malaria prevalence'
        },
        {
          type: 'seasonal',
          factor: 'Rainy season',
          weight: 0.2,
          description: 'Peak malaria transmission period'
        }
      ],
      updatedAt: now
    });
  }

  // Typhoid fever
  if (hasFever || hasAbdominalPain) {
    differentials.push({
      id: 'DIFF-002',
      condition: 'Typhoid Fever',
      probability: hasFever && hasAbdominalPain ? 65 : 40,
      confidence: 'medium',
      evidence: [
        ...(hasFever ? ['Sustained fever pattern'] : []),
        ...(hasAbdominalPain ? ['Abdominal discomfort'] : []),
        'Endemic area for enteric fever'
      ],
      suggestedTests: ['Widal test', 'Blood culture', 'Stool culture', 'Complete Blood Count'],
      contextFactors: [
        {
          type: 'geographic',
          factor: 'Endemic region',
          weight: 0.25,
          description: 'Area with poor sanitation infrastructure'
        }
      ],
      updatedAt: now
    });
  }

  // Upper Respiratory Tract Infection
  if (hasCough || chiefComplaint.toLowerCase().includes('cold')) {
    differentials.push({
      id: 'DIFF-003',
      condition: 'Upper Respiratory Tract Infection',
      probability: hasCough ? 60 : 35,
      confidence: hasCough ? 'medium' : 'low',
      evidence: [
        ...(hasCough ? ['Cough present'] : []),
        'Common viral syndrome',
        ...(hasFever ? ['Mild fever supportive'] : [])
      ],
      suggestedTests: ['Clinical diagnosis', 'Chest X-ray if severe'],
      contextFactors: [
        {
          type: 'seasonal',
          factor: 'Cold & flu season',
          weight: 0.15,
          description: 'Increased viral transmission'
        }
      ],
      updatedAt: now
    });
  }

  // Dengue Fever
  if (hasFever && hasBodyPain) {
    differentials.push({
      id: 'DIFF-004',
      condition: 'Dengue Fever',
      probability: 45,
      confidence: 'medium',
      evidence: [
        ...(hasFever ? ['Acute febrile illness'] : []),
        ...(hasBodyPain ? ['Myalgia and arthralgia'] : []),
        'Dengue transmission area'
      ],
      suggestedTests: ['Dengue NS1 antigen', 'Dengue IgM/IgG', 'Complete Blood Count', 'Platelet count'],
      contextFactors: [
        {
          type: 'seasonal',
          factor: 'Rainy season',
          weight: 0.2,
          description: 'Peak Aedes mosquito breeding'
        },
        {
          type: 'community',
          factor: 'Recent dengue cases',
          weight: 0.15,
          description: 'Community outbreak reported'
        }
      ],
      updatedAt: now
    });
  }

  // Sort by probability
  return differentials.sort((a, b) => b.probability - a.probability);
};

export const RealtimeAIDiagnosis: React.FC<RealtimeAIDiagnosisProps> = ({
  chiefComplaint,
  symptoms,
  vitals,
  examFindings
}) => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const [differentials, setDifferentials] = useState<DifferentialDiagnosis[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [updates, setUpdates] = useState<DiagnosisUpdate[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

  // Simulate real-time AI processing
  const updateDiagnosis = useCallback(() => {
    setIsProcessing(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      const previousDifferentials = [...differentials];
      const newDifferentials = generateDifferentials(chiefComplaint, symptoms, vitals);
      
      // Track changes
      const changes: DiagnosisUpdate['changes'] = [];
      newDifferentials.forEach(newDiff => {
        const oldDiff = previousDifferentials.find(d => d.condition === newDiff.condition);
        if (oldDiff && oldDiff.probability !== newDiff.probability) {
          changes.push({
            condition: newDiff.condition,
            previousProbability: oldDiff.probability,
            newProbability: newDiff.probability,
            reason: newDiff.probability > oldDiff.probability 
              ? 'New evidence supports this diagnosis' 
              : 'Alternative diagnoses more likely'
          });
        }
      });

      if (changes.length > 0) {
        setUpdates(prev => [{
          timestamp: new Date().toISOString(),
          trigger: 'symptom_added',
          changes
        }, ...prev].slice(0, 5)); // Keep last 5 updates
      }

      setDifferentials(newDifferentials);
      setLastUpdateTime(new Date().toLocaleTimeString());
      setIsProcessing(false);
    }, 800);
  }, [chiefComplaint, symptoms, vitals, differentials]);

  // Update diagnosis when inputs change
  useEffect(() => {
    if (chiefComplaint || symptoms.length > 0 || vitals) {
      updateDiagnosis();
    }
  }, [chiefComplaint, symptoms, vitals]); // Intentionally excluding updateDiagnosis from deps

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return theme === 'dark' ? 'text-green-400 bg-green-900/30' : 'text-green-700 bg-green-100';
      case 'medium':
        return theme === 'dark' ? 'text-yellow-400 bg-yellow-900/30' : 'text-yellow-700 bg-yellow-100';
      case 'low':
        return theme === 'dark' ? 'text-gray-400 bg-gray-800/50' : 'text-gray-600 bg-gray-100';
      default:
        return '';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return theme === 'dark' ? 'bg-green-500' : 'bg-green-600';
    if (probability >= 40) return theme === 'dark' ? 'bg-yellow-500' : 'bg-yellow-600';
    return theme === 'dark' ? 'bg-orange-500' : 'bg-orange-600';
  };

  return (
    <div className="space-y-4 sticky top-4">
      {/* Header */}
      <div className={cn(
        'rounded-2xl border p-4',
        theme === 'dark' 
          ? 'bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-700/50' 
          : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              theme === 'dark' ? 'bg-cyan-500/20' : 'bg-blue-100'
            )}>
              <Brain className={cn(
                'w-6 h-6',
                theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
              )} />
            </div>
            <div>
              <h3 className={cn(
                'font-bold text-lg',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                AI Differential Diagnosis
              </h3>
              <p className={cn(
                'text-xs',
                theme === 'dark' ? 'text-cyan-300/80' : 'text-blue-600/80'
              )}>
                Real-time analysis • Context-aware
              </p>
            </div>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-2">
              <Zap className={cn(
                'w-4 h-4 animate-pulse',
                theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
              )} />
              <span className={cn(
                'text-xs font-medium',
                theme === 'dark' ? 'text-cyan-300' : 'text-blue-600'
              )}>
                Processing...
              </span>
            </div>
          )}
        </div>

        {lastUpdateTime && (
          <div className={cn(
            'mt-3 text-xs flex items-center gap-2',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            <Activity className="w-3 h-3" />
            Last updated: {lastUpdateTime}
          </div>
        )}
      </div>

      {/* Context Factors */}
      {differentials.length > 0 && differentials[0].contextFactors.length > 0 && (
        <div className={cn(
          'rounded-xl border p-4',
          theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
        )}>
          <h4 className={cn(
            'text-sm font-semibold mb-3',
            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
          )}>
            Context Factors
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {differentials[0].contextFactors.map((factor, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-2 rounded-lg text-xs',
                  theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {factor.type === 'geographic' && <Globe className="w-3 h-3" />}
                  {factor.type === 'seasonal' && <Calendar className="w-3 h-3" />}
                  {factor.type === 'community' && <Users className="w-3 h-3" />}
                  <span className="font-medium">{factor.factor}</span>
                </div>
                <p className={cn(
                  'text-xs',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {factor.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Differentials List */}
      {differentials.length > 0 ? (
        <div className="space-y-3">
          {differentials.map((diff, index) => (
            <div
              key={diff.id}
              className={cn(
                'rounded-xl border p-4 transition-all hover:scale-[1.02]',
                theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      'text-2xl font-bold',
                      theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                    )}>
                      #{index + 1}
                    </span>
                    <h4 className={cn(
                      'font-bold text-base',
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      {diff.condition}
                    </h4>
                  </div>
                  
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full font-medium',
                    getConfidenceColor(diff.confidence)
                  )}>
                    {diff.confidence.toUpperCase()} CONFIDENCE
                  </span>
                </div>

                <div className="text-right">
                  <div className={cn(
                    'text-3xl font-bold',
                    diff.probability >= 70 
                      ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                      : diff.probability >= 40
                      ? theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                      : theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                  )}>
                    {diff.probability}%
                  </div>
                </div>
              </div>

              {/* Probability Bar */}
              <div className="mb-3">
                <div className={cn(
                  'h-2 rounded-full overflow-hidden',
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                )}>
                  <div
                    className={cn(
                      'h-full transition-all duration-500',
                      getProbabilityColor(diff.probability)
                    )}
                    style={{ width: `${diff.probability}%` }}
                  />
                </div>
              </div>

              {/* Evidence */}
              <div className="mb-3">
                <div className={cn(
                  'text-xs font-semibold mb-1',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Supporting Evidence:
                </div>
                <ul className="space-y-1">
                  {diff.evidence.map((item, idx) => (
                    <li
                      key={idx}
                      className={cn(
                        'text-xs flex items-start gap-2',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      )}
                    >
                      <CheckCircle className={cn(
                        'w-3 h-3 mt-0.5 flex-shrink-0',
                        theme === 'dark' ? 'text-green-400' : 'text-green-600'
                      )} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested Tests */}
              <div>
                <div className={cn(
                  'text-xs font-semibold mb-1 flex items-center gap-1',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  <FlaskConical className="w-3 h-3" />
                  Suggested Tests:
                </div>
                <div className="flex flex-wrap gap-1">
                  {diff.suggestedTests.map((test, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        'text-xs px-2 py-0.5 rounded',
                        theme === 'dark' 
                          ? 'bg-blue-900/30 text-blue-300' 
                          : 'bg-blue-100 text-blue-700'
                      )}
                    >
                      {test}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn(
          'rounded-xl border p-8 text-center',
          theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
        )}>
          <Brain className={cn(
            'w-12 h-12 mx-auto mb-3',
            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
          )} />
          <p className={cn(
            'font-medium',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            Waiting for clinical data...
          </p>
          <p className={cn(
            'text-sm mt-2',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
          )}>
            Enter symptoms and vitals to see AI-powered differential diagnosis
          </p>
        </div>
      )}

      {/* Recent Updates */}
      {updates.length > 0 && (
        <div className={cn(
          'rounded-xl border p-4',
          theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'
        )}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className={cn(
              'w-4 h-4',
              theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
            )} />
            <h4 className={cn(
              'text-sm font-semibold',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            )}>
              Recent Updates
            </h4>
          </div>
          <div className="space-y-2">
            {updates.slice(0, 3).map((update, idx) => (
              <div
                key={idx}
                className={cn(
                  'text-xs p-2 rounded-lg',
                  theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
                )}
              >
                {update.changes.map((change, cidx) => (
                  <div key={cidx} className="flex items-center justify-between">
                    <span className={cn(
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      {change.condition}
                    </span>
                    <span className={cn(
                      'font-bold',
                      change.newProbability > change.previousProbability
                        ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                        : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                    )}>
                      {change.previousProbability}% → {change.newProbability}%
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Disclaimer */}
      <div className={cn(
        'rounded-lg p-3 text-xs',
        theme === 'dark' 
          ? 'bg-yellow-900/20 border border-yellow-700/50' 
          : 'bg-yellow-50 border border-yellow-200'
      )}>
        <div className="flex items-start gap-2">
          <AlertCircle className={cn(
            'w-4 h-4 flex-shrink-0 mt-0.5',
            theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
          )} />
          <p className={cn(
            theme === 'dark' ? 'text-yellow-300/90' : 'text-yellow-700'
          )}>
            AI-generated suggestions. Always use clinical judgment and confirm with appropriate investigations.
          </p>
        </div>
      </div>
    </div>
  );
};