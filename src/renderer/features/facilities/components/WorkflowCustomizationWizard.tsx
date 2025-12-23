import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../../store/store';
import {
  UserCog,
  Shield,
  AlertCircle,
  Clock,
  CheckCircle,
  Users,
  FileText,
  ArrowRight,
  Plus,
  Trash2,
  Settings,
  Zap,
  Layers,
  TrendingUp
} from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import WizardStepper from './WizardStepper';
import { StepConfig } from '../types/onboarding';
import { setOnboardingStep, saveDraft } from '../../../store/slices/facilitySlice';

const WorkflowCustomizationWizard: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const { currentStep } = useSelector((state: RootState) => state.facility.onboarding);
  
  const [workflowData, setWorkflowData] = useState({
    patientJourney: {
      enabled: true,
      steps: [
        { id: 'step-1', name: 'Registration', department: 'Reception', duration: 15, required: true },
        { id: 'step-2', name: 'Triage', department: 'Emergency', duration: 10, required: true },
        { id: 'step-3', name: 'Consultation', department: 'OPD', duration: 30, required: true },
        { id: 'step-4', name: 'Diagnostics', department: 'Laboratory', duration: 45, required: false },
        { id: 'step-5', name: 'Pharmacy', department: 'Pharmacy', duration: 20, required: false },
      ]
    },
    billingRules: {
      autoGenerateInvoices: true,
      requireApproval: true,
      approvalThreshold: 5000,
      paymentMethods: ['Cash', 'Card', 'Insurance', 'Mobile Money']
    },
    approvalHierarchies: [
      { id: 'hierarchy-1', name: 'High-Cost Services', minAmount: 5000, approvers: ['Department Head', 'Medical Director', 'Finance'] },
      { id: 'hierarchy-2', name: 'Patient Discharge', minAmount: 0, approvers: ['Senior Doctor', 'Head Nurse'] },
      { id: 'hierarchy-3', name: 'Medication Changes', minAmount: 0, approvers: ['Pharmacist', 'Treating Doctor'] }
    ],
    clinicalWorkflows: [
      { id: 'clinical-1', name: 'Emergency Protocol', type: 'Emergency', steps: 5, active: true },
      { id: 'clinical-2', name: 'OPD Consultation', type: 'Outpatient', steps: 4, active: true },
      { id: 'clinical-3', name: 'Inpatient Round', type: 'Inpatient', steps: 6, active: true }
    ]
  });
  
  const steps: StepConfig[] = [
    { id: 0, title: 'Patient Journey', description: 'Define care pathways', completed: false },
    { id: 1, title: 'Billing Rules', description: 'Configure pricing logic', completed: false },
    { id: 2, title: 'Approval Hierarchies', description: 'Set approval workflows', completed: false },
    { id: 3, title: 'Clinical Workflows', description: 'Customize clinical processes', completed: false },
    { id: 4, title: 'Review & Activate', description: 'Finalize workflows', completed: false }
  ];
  
  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      dispatch(setOnboardingStep(currentStep + 1));
    }
  }, [currentStep, dispatch, steps.length]);
  
  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      dispatch(setOnboardingStep(currentStep - 1));
    }
  }, [currentStep, dispatch]);
  
  const handleSaveDraft = useCallback(() => {
    dispatch(saveDraft(workflowData));
    alert('Workflow draft saved successfully!');
  }, [dispatch, workflowData]);
  
  const handleSubmit = useCallback(() => {
    alert('Workflows activated successfully!');
    // Dispatch action to save workflows
  }, []);
  
  const togglePatientJourneyStep = useCallback((stepId: string) => {
    setWorkflowData(prev => ({
      ...prev,
      patientJourney: {
        ...prev.patientJourney,
        steps: prev.patientJourney.steps.map(step =>
          step.id === stepId ? { ...step, required: !step.required } : step
        )
      }
    }));
  }, []);
  
  const addBillingMethod = useCallback(() => {
    const method = prompt('Enter new payment method:');
    if (method && !workflowData.billingRules.paymentMethods.includes(method)) {
      setWorkflowData(prev => ({
        ...prev,
        billingRules: {
          ...prev.billingRules,
          paymentMethods: [...prev.billingRules.paymentMethods, method]
        }
      }));
    }
  }, [workflowData.billingRules.paymentMethods]);
  
  const removeBillingMethod = useCallback((method: string) => {
    setWorkflowData(prev => ({
      ...prev,
      billingRules: {
        ...prev.billingRules,
        paymentMethods: prev.billingRules.paymentMethods.filter(m => m !== method)
      }
    }));
  }, []);
  
  const updateApprovalThreshold = useCallback((value: number) => {
    setWorkflowData(prev => ({
      ...prev,
      billingRules: {
        ...prev.billingRules,
        approvalThreshold: value
      }
    }));
  }, []);
  
  const toggleClinicalWorkflow = useCallback((workflowId: string) => {
    setWorkflowData(prev => ({
      ...prev,
      clinicalWorkflows: prev.clinicalWorkflows.map(wf =>
        wf.id === workflowId ? { ...wf, active: !wf.active } : wf
      )
    }));
  }, []);
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Patient Journey
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className={cn(
                    'text-lg font-semibold mb-2',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    Patient Journey Configuration
                  </h3>
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Define the standard patient care pathway through your facility
                  </p>
                </div>
                
                {/* Journey Visualization */}
                <div className={cn(
                  'p-6 rounded-xl border',
                  theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                )}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className={cn(
                        'font-medium mb-1',
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                      )}>
                        Standard Patient Flow
                      </h4>
                      <p className={cn(
                        'text-sm',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        Drag and drop to reorder steps
                      </p>
                    </div>
                    <div className={cn(
                      'px-3 py-1 rounded-lg text-sm font-medium',
                      theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-700'
                    )}>
                      {workflowData.patientJourney.steps.length} Steps
                    </div>
                  </div>
                  
                  {/* Patient Flow Steps */}
                  <div className="space-y-3">
                    {workflowData.patientJourney.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className={cn(
                          'flex items-center justify-between p-4 rounded-lg border transition-all',
                          theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-300'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                            theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-600'
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <h5 className={cn(
                              'font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {step.name}
                            </h5>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded',
                                theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                              )}>
                                {step.department}
                              </span>
                              <span className={cn(
                                'text-xs flex items-center gap-1',
                                theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                              )}>
                                <Clock className="w-3 h-3" />
                                {step.duration} min
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={step.required}
                              onChange={() => togglePatientJourneyStep(step.id)}
                              className="rounded"
                            />
                            <span className={cn(
                              'text-sm',
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              Required
                            </span>
                          </label>
                          
                          {index < workflowData.patientJourney.steps.length - 1 && (
                            <ArrowRight className={cn(
                              'w-4 h-4',
                              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                            )} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const name = prompt('Enter step name:');
                      const department = prompt('Enter department:');
                      const duration = prompt('Enter duration (minutes):');
                      
                      if (name && department && duration) {
                        setWorkflowData(prev => ({
                          ...prev,
                          patientJourney: {
                            ...prev.patientJourney,
                            steps: [
                              ...prev.patientJourney.steps,
                              {
                                id: `step-${Date.now()}`,
                                name,
                                department,
                                duration: parseInt(duration),
                                required: true
                              }
                            ]
                          }
                        }));
                      }
                    }}
                    className={cn(
                      'w-full mt-4 p-3 rounded-lg border-2 border-dashed transition-colors',
                      'flex items-center justify-center gap-2',
                      theme === 'dark'
                        ? 'border-gray-700 text-gray-400 hover:border-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10'
                        : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    Add Custom Step
                  </button>
                </div>
                
                {/* Journey Tips */}
                <div className={cn(
                  'p-4 rounded-lg',
                  theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
                )}>
                  <div className="flex items-start gap-3">
                    <Zap className={cn(
                      'w-5 h-5 mt-0.5 flex-shrink-0',
                      theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                    )} />
                    <div>
                      <h5 className={cn(
                        'text-sm font-semibold',
                        theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                      )}>
                        Optimization Tips
                      </h5>
                      <ul className={cn(
                        'text-xs space-y-1 mt-2',
                        theme === 'dark' ? 'text-blue-400/80' : 'text-blue-600/80'
                      )}>
                        <li>• Required steps cannot be skipped by patients</li>
                        <li>• Consider average wait times when setting durations</li>
                        <li>• Add overflow routing for high-traffic departments</li>
                        <li>• Test the journey with common patient scenarios</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <WizardStepper
              currentStep={currentStep}
              totalSteps={steps.length}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmit}
            />
          </div>
        );
        
      case 1: // Billing Rules
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className={cn(
                    'text-lg font-semibold mb-2',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    Billing & Payment Configuration
                  </h3>
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Configure automated billing, payment methods, and approval rules
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Auto-Generation Settings */}
                  <div className={cn(
                    'p-5 rounded-xl border',
                    theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                  )}>
                    <h4 className={cn(
                      'font-medium mb-4 flex items-center gap-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      <Zap className="w-4 h-4" />
                      Automated Billing
                    </h4>
                    
                    <div className="space-y-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className={cn(
                            'text-sm font-medium',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            Auto-generate invoices
                          </span>
                          <p className={cn(
                            'text-xs mt-1',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            Generate invoices automatically after service completion
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={workflowData.billingRules.autoGenerateInvoices}
                          onChange={(e) => setWorkflowData(prev => ({
                            ...prev,
                            billingRules: {
                              ...prev.billingRules,
                              autoGenerateInvoices: e.target.checked
                            }
                          }))}
                          className="rounded"
                        />
                      </label>
                      
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className={cn(
                            'text-sm font-medium',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            Require approval
                          </span>
                          <p className={cn(
                            'text-xs mt-1',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            High-value invoices require manager approval
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={workflowData.billingRules.requireApproval}
                          onChange={(e) => setWorkflowData(prev => ({
                            ...prev,
                            billingRules: {
                              ...prev.billingRules,
                              requireApproval: e.target.checked
                            }
                          }))}
                          className="rounded"
                        />
                      </label>
                    </div>
                  </div>
                  
                  {/* Approval Threshold */}
                  <div className={cn(
                    'p-5 rounded-xl border',
                    theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                  )}>
                    <h4 className={cn(
                      'font-medium mb-4 flex items-center gap-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      <Shield className="w-4 h-4" />
                      Approval Threshold
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className={cn(
                          'block text-sm font-medium mb-2',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          Amount requiring approval
                        </label>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'text-sm',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          )}>
                            $
                          </span>
                          <input
                            type="number"
                            value={workflowData.billingRules.approvalThreshold}
                            onChange={(e) => updateApprovalThreshold(parseInt(e.target.value) || 0)}
                            className={cn(
                              'flex-1 px-3 py-2 rounded-lg border text-sm',
                              'focus:outline-none focus:ring-2 focus:ring-offset-0',
                              theme === 'dark'
                                ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                                : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                            )}
                          />
                        </div>
                        <p className={cn(
                          'text-xs mt-2',
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        )}>
                          Invoices above this amount will require manager approval
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Payment Methods */}
                <div className={cn(
                  'p-5 rounded-xl border',
                  theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={cn(
                      'font-medium flex items-center gap-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      <TrendingUp className="w-4 h-4" />
                      Accepted Payment Methods
                    </h4>
                    <button
                      type="button"
                      onClick={addBillingMethod}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        'flex items-center gap-2',
                        theme === 'dark'
                          ? 'text-cyan-400 hover:text-cyan-300 hover:bg-gray-800'
                          : 'text-blue-600 hover:text-blue-700 hover:bg-gray-200'
                      )}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Method
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {workflowData.billingRules.paymentMethods.map((method) => (
                      <div
                        key={method}
                        className={cn(
                          'px-3 py-2 rounded-lg flex items-center gap-2',
                          theme === 'dark' ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-300'
                        )}
                      >
                        <span className={cn(
                          'text-sm',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          {method}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeBillingMethod(method)}
                          className={cn(
                            'p-0.5 rounded transition-colors',
                            theme === 'dark'
                              ? 'text-gray-400 hover:text-red-400 hover:bg-gray-800'
                              : 'text-gray-500 hover:text-red-600 hover:bg-gray-200'
                          )}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <WizardStepper
              currentStep={currentStep}
              totalSteps={steps.length}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmit}
            />
          </div>
        );
        
      case 2: // Approval Hierarchies
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className={cn(
                    'text-lg font-semibold mb-2',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    Approval Hierarchies
                  </h3>
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Set up threshold-based approvals for clinical and administrative decisions
                  </p>
                </div>
                
                <div className={cn(
                  'p-6 rounded-xl border',
                  theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                )}>
                  <h4 className={cn(
                    'text-sm font-semibold mb-4',
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    Example: High-Cost Service Approval Flow
                  </h4>
                  
                  <div className="space-y-6">
                    {/* Approval Flow Visualization */}
                    <div className="relative">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                        {[
                          { role: 'Requesting Doctor', action: 'Initiates request', amount: '$500+' },
                          { role: 'Department Head', action: 'Reviews request', amount: '$500 - $5,000' },
                          { role: 'Medical Director', action: 'Approves/Rejects', amount: '$5,000 - $10,000' },
                          { role: 'Finance Committee', action: 'Final approval', amount: '$10,000+' },
                        ].map((step, index) => (
                          <div key={index} className="flex flex-col items-center">
                            <div className={cn(
                              'w-12 h-12 rounded-full flex items-center justify-center mb-2',
                              'border-2',
                              theme === 'dark' ? 'border-cyan-500 bg-cyan-500/10' : 'border-blue-500 bg-blue-50'
                            )}>
                              <UserCog className={cn(
                                'w-5 h-5',
                                theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                              )} />
                            </div>
                            <div className="text-center">
                              <p className={cn(
                                'text-xs font-semibold',
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              )}>
                                {step.role}
                              </p>
                              <p className={cn(
                                'text-xs',
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              )}>
                                {step.action}
                              </p>
                              <p className={cn(
                                'text-xs font-bold mt-1',
                                theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                              )}>
                                {step.amount}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Connecting lines - Desktop only */}
                      <div className="hidden md:block absolute top-6 left-1/4 right-0 h-0.5 -translate-y-1/2">
                        <div className={cn(
                          'h-0.5 w-2/3 mx-auto',
                          theme === 'dark' ? 'bg-cyan-500/30' : 'bg-blue-500/30'
                        )} />
                      </div>
                    </div>
                    
                    {/* Existing Approval Hierarchies */}
                    <div className="mt-8">
                      <h5 className={cn(
                        'text-sm font-semibold mb-3',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        Configured Approval Workflows
                      </h5>
                      <div className="space-y-3">
                        {workflowData.approvalHierarchies.map((hierarchy) => (
                          <div
                            key={hierarchy.id}
                            className={cn(
                              'p-4 rounded-lg border',
                              theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-300'
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h6 className={cn(
                                'font-medium',
                                theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                              )}>
                                {hierarchy.name}
                              </h6>
                              {hierarchy.minAmount > 0 && (
                                <span className={cn(
                                  'px-2 py-0.5 text-xs font-bold rounded',
                                  theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-700'
                                )}>
                                  ${hierarchy.minAmount.toLocaleString()}+
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {hierarchy.approvers.map((approver, index) => (
                                <span
                                  key={index}
                                  className={cn(
                                    'text-xs px-2 py-1 rounded flex items-center gap-1',
                                    theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                                  )}
                                >
                                  <Users className="w-3 h-3" />
                                  {approver}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Configuration Form */}
                    <div className="space-y-4">
                      <div>
                        <h5 className={cn(
                          'text-sm font-semibold mb-3',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          Create New Approval Workflow
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={cn(
                              'block text-sm font-medium mb-2',
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            )}>
                              Workflow Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., High-Risk Procedure"
                              className={cn(
                                'w-full px-4 py-2.5 rounded-xl border text-sm',
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
                              Minimum Amount (optional)
                            </label>
                            <input
                              type="number"
                              placeholder="0"
                              className={cn(
                                'w-full px-4 py-2.5 rounded-xl border text-sm',
                                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                                theme === 'dark'
                                  ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                                  : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className={cn(
                          'block text-sm font-medium mb-2',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          Escalation Rules
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Define escalation rules for pending approvals (e.g., escalate after 24 hours)"
                          className={cn(
                            'w-full px-4 py-2.5 rounded-xl border text-sm resize-none',
                            'focus:outline-none focus:ring-2 focus:ring-offset-0',
                            theme === 'dark'
                              ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                              : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={cn(
                  'p-4 rounded-lg',
                  theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50'
                )}>
                  <div className="flex items-start gap-3">
                    <Shield className={cn(
                      'w-5 h-5 mt-0.5 flex-shrink-0',
                      theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                    )} />
                    <div>
                      <h5 className={cn(
                        'text-sm font-semibold',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        Compliance & Governance
                      </h5>
                      <p className={cn(
                        'text-xs mt-1',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        Approval workflows ensure compliance with healthcare regulations and internal governance policies.
                        All approvals are logged for audit purposes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <WizardStepper
              currentStep={currentStep}
              totalSteps={steps.length}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmit}
            />
          </div>
        );
        
      case 3: // Clinical Workflows
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className={cn(
                    'text-lg font-semibold mb-2',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    Clinical Workflow Templates
                  </h3>
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Pre-configured clinical protocols and care pathways
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workflowData.clinicalWorkflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className={cn(
                        'p-5 rounded-xl border transition-all',
                        'flex flex-col gap-3',
                        workflow.active
                          ? theme === 'dark'
                            ? 'border-cyan-500/50 bg-cyan-500/5'
                            : 'border-blue-500/50 bg-blue-50'
                          : theme === 'dark'
                            ? 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'p-2 rounded-lg',
                            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                          )}>
                            <Layers className={cn(
                              'w-4 h-4',
                              theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                            )} />
                          </div>
                          <span className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded',
                            theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                          )}>
                            {workflow.type}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleClinicalWorkflow(workflow.id)}
                          className={cn(
                            'relative w-10 h-5 rounded-full transition-colors',
                            workflow.active
                              ? theme === 'dark' ? 'bg-cyan-600' : 'bg-blue-600'
                              : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                          )}
                        >
                          <div className={cn(
                            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                            workflow.active ? 'translate-x-5' : 'translate-x-0'
                          )} />
                        </button>
                      </div>
                      
                      <h4 className={cn(
                        'font-medium',
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                      )}>
                        {workflow.name}
                      </h4>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <Clock className={cn(
                            'w-3.5 h-3.5',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                          )} />
                          <span className={cn(
                            'text-xs',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            {workflow.steps} steps
                          </span>
                        </div>
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded',
                          workflow.active
                            ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                            : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                        )}>
                          {workflow.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          // Navigate to workflow details
                          alert(`Viewing details for ${workflow.name}`);
                        }}
                        className={cn(
                          'mt-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          'flex items-center gap-1.5 justify-center',
                          theme === 'dark'
                            ? 'text-cyan-400 hover:text-cyan-300 hover:bg-gray-800'
                            : 'text-blue-600 hover:text-blue-700 hover:bg-gray-200'
                        )}
                      >
                        <Settings className="w-3 h-3" />
                        Customize
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Add New Workflow */}
                <div className={cn(
                  'p-5 rounded-xl border-2 border-dashed',
                  theme === 'dark' 
                    ? 'border-gray-700 hover:border-cyan-500/50 hover:bg-cyan-500/5' 
                    : 'border-gray-300 hover:border-blue-500/50 hover:bg-blue-50'
                )}>
                  <button
                    type="button"
                    onClick={() => {
                      const name = prompt('Enter workflow name:');
                      const type = prompt('Enter workflow type (Emergency/Outpatient/Inpatient):');
                      
                      if (name && type) {
                        setWorkflowData(prev => ({
                          ...prev,
                          clinicalWorkflows: [
                            ...prev.clinicalWorkflows,
                            {
                              id: `clinical-${Date.now()}`,
                              name,
                              type,
                              steps: 4,
                              active: true
                            }
                          ]
                        }));
                      }
                    }}
                    className="w-full flex flex-col items-center justify-center gap-2"
                  >
                    <div className={cn(
                      'p-3 rounded-full',
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                    )}>
                      <Plus className={cn(
                        'w-6 h-6',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )} />
                    </div>
                    <span className={cn(
                      'text-sm font-medium',
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      Create Custom Workflow
                    </span>
                    <span className={cn(
                      'text-xs',
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    )}>
                      Add specialized clinical protocols
                    </span>
                  </button>
                </div>
              </div>
            </div>
            
            <WizardStepper
              currentStep={currentStep}
              totalSteps={steps.length}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmit}
            />
          </div>
        );
        
      case 4: // Review & Activate
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className={cn(
                    'text-lg font-semibold mb-2',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    Review & Activate Workflows
                  </h3>
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Review all configured workflows before activation
                  </p>
                </div>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={cn(
                    'p-4 rounded-xl border',
                    theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        theme === 'dark' ? 'bg-cyan-500/20' : 'bg-blue-100'
                      )}>
                        <Layers className={cn(
                          'w-5 h-5',
                          theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                        )} />
                      </div>
                      <div>
                        <p className={cn(
                          'text-sm font-medium',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          Patient Journey
                        </p>
                        <p className={cn(
                          'text-2xl font-bold mt-1',
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                          {workflowData.patientJourney.steps.length}
                        </p>
                        <p className={cn(
                          'text-xs',
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          Steps configured
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={cn(
                    'p-4 rounded-xl border',
                    theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100'
                      )}>
                        <Shield className={cn(
                          'w-5 h-5',
                          theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                        )} />
                      </div>
                      <div>
                        <p className={cn(
                          'text-sm font-medium',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          Approval Workflows
                        </p>
                        <p className={cn(
                          'text-2xl font-bold mt-1',
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                          {workflowData.approvalHierarchies.length}
                        </p>
                        <p className={cn(
                          'text-xs',
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          Hierarchies defined
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={cn(
                    'p-4 rounded-xl border',
                    theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'
                      )}>
                        <FileText className={cn(
                          'w-5 h-5',
                          theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                        )} />
                      </div>
                      <div>
                        <p className={cn(
                          'text-sm font-medium',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          Clinical Workflows
                        </p>
                        <p className={cn(
                          'text-2xl font-bold mt-1',
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                          {workflowData.clinicalWorkflows.filter(w => w.active).length}
                        </p>
                        <p className={cn(
                          'text-xs',
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          Active templates
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={cn(
                    'p-4 rounded-xl border',
                    theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100'
                      )}>
                        <Zap className={cn(
                          'w-5 h-5',
                          theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                        )} />
                      </div>
                      <div>
                        <p className={cn(
                          'text-sm font-medium',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          Payment Methods
                        </p>
                        <p className={cn(
                          'text-2xl font-bold mt-1',
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                          {workflowData.billingRules.paymentMethods.length}
                        </p>
                        <p className={cn(
                          'text-xs',
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          Accepted methods
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Activation Confirmation */}
                <div className={cn(
                  'p-6 rounded-xl border',
                  theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                )}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className={cn(
                        'text-lg font-bold',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}>
                        Ready to Activate
                      </h4>
                      <p className={cn(
                        'text-sm mt-1',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        All workflows are configured and ready for activation
                      </p>
                    </div>
                    <div className={cn(
                      'px-3 py-1 rounded-lg text-sm font-bold',
                      theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                    )}>
                      Ready
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className={cn(
                        'w-5 h-5',
                        theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                      )} />
                      <div>
                        <p className={cn(
                          'text-sm font-medium',
                          theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        )}>
                          Patient journey with {workflowData.patientJourney.steps.length} steps
                        </p>
                        <p className={cn(
                          'text-xs mt-1',
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          Standard care pathway from registration to discharge
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <CheckCircle className={cn(
                        'w-5 h-5',
                        theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                      )} />
                      <div>
                        <p className={cn(
                          'text-sm font-medium',
                          theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        )}>
                          ${workflowData.billingRules.approvalThreshold.toLocaleString()} approval threshold
                        </p>
                        <p className={cn(
                          'text-xs mt-1',
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          Automated billing with {workflowData.billingRules.paymentMethods.length} payment methods
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <CheckCircle className={cn(
                        'w-5 h-5',
                        theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                      )} />
                      <div>
                        <p className={cn(
                          'text-sm font-medium',
                          theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        )}>
                          {workflowData.approvalHierarchies.length} approval hierarchies
                        </p>
                        <p className={cn(
                          'text-xs mt-1',
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          Multi-level approval workflows for compliance
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <CheckCircle className={cn(
                        'w-5 h-5',
                        theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                      )} />
                      <div>
                        <p className={cn(
                          'text-sm font-medium',
                          theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        )}>
                          {workflowData.clinicalWorkflows.filter(w => w.active).length} active clinical workflows
                        </p>
                        <p className={cn(
                          'text-xs mt-1',
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          Pre-configured clinical protocols
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={cn(
                    'mt-6 p-4 rounded-lg',
                    theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
                  )}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className={cn(
                        'w-5 h-5 mt-0.5 flex-shrink-0',
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      )} />
                      <div>
                        <h6 className={cn(
                          'text-sm font-semibold',
                          theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                        )}>
                          Activation Notes
                        </h6>
                        <p className={cn(
                          'text-xs mt-1',
                          theme === 'dark' ? 'text-blue-400/80' : 'text-blue-600/80'
                        )}>
                          Upon activation, all configured workflows will be immediately available to staff.
                          You can modify any workflow later from the Workflow Management section.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <WizardStepper
              currentStep={currentStep}
              totalSteps={steps.length}
              onNext={handleNext}
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmit}
            />
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return renderStepContent();
};

export default WorkflowCustomizationWizard;