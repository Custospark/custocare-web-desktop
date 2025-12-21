import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../../store/index';
import {
  AlertCircle,
  Building,
  Plus,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import { setOnboardingStep } from '../../../store/slices/facilitySlice';
import WizardStepper from './WizardStepper';
import { StepConfig } from '../types/onboarding';

const DepartmentConfigurationWizard: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const { currentStep } = useSelector((state: RootState) => state.facility.onboarding);
  const { predefinedDepartments } = useSelector((state: RootState) => state.facility);
  
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [customDepartments, setCustomDepartments] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [routingRules, setRoutingRules] = useState<Array<{ from: string; to: string }>>([]);
  
  const steps: StepConfig[] = [
    { id: 0, title: 'Select Departments', description: 'Choose predefined departments', completed: false },
    { id: 1, title: 'Add Custom Departments', description: 'Create custom departments', completed: false },
    { id: 2, title: 'Configure Routing', description: 'Define patient flow', completed: false },
    { id: 3, title: 'Review & Save', description: 'Final configuration', completed: false }
  ];
  
  const handleDepartmentToggle = useCallback((departmentId: string) => {
    setSelectedDepartments(prev => 
      prev.includes(departmentId)
        ? prev.filter(id => id !== departmentId)
        : [...prev, departmentId]
    );
  }, []);
  
  const handleAddCustomDepartment = useCallback(() => {
    const name = prompt('Enter custom department name:');
    if (name) {
      setCustomDepartments(prev => [
        ...prev,
        { id: `CUSTOM-${Date.now()}`, name, category: 'Custom' }
      ]);
    }
  }, []);
  
  const handleRemoveCustomDepartment = useCallback((id: string) => {
    setCustomDepartments(prev => prev.filter(dept => dept.id !== id));
  }, []);
  
  const handleAddRoutingRule = useCallback((from: string, to: string) => {
    setRoutingRules(prev => [...prev, { from, to }]);
  }, []);
  
  const handleRemoveRoutingRule = useCallback((index: number) => {
    setRoutingRules(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const handleNext = useCallback(() => {
    dispatch(setOnboardingStep(currentStep + 1));
  }, [currentStep, dispatch]);
  
  const handleBack = useCallback(() => {
    dispatch(setOnboardingStep(currentStep - 1));
  }, [currentStep, dispatch]);
  
  const handleSaveDraft = useCallback(() => {
    alert('Draft saved');
  }, []);
  
  const handleSubmit = useCallback(() => {
    alert('Configuration saved');
  }, []);
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Select Predefined Departments
        return (
          <div className="space-y-6">
            <div>
              <h3 className={cn(
                'text-lg font-semibold mb-2',
                theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
              )}>
                Select Predefined Departments
              </h3>
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Choose from standard healthcare departments. Required departments are pre-selected.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {predefinedDepartments.map((dept) => (
                <div
                  key={dept.id}
                  onClick={() => !dept.required && handleDepartmentToggle(dept.id)}
                  className={cn(
                    'p-4 rounded-xl border cursor-pointer transition-all',
                    'flex flex-col gap-3',
                    selectedDepartments.includes(dept.id) || dept.required
                      ? theme === 'dark'
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-blue-500 bg-blue-50'
                      : theme === 'dark'
                        ? 'border-gray-800 bg-gray-800/30 hover:border-gray-700 hover:bg-gray-800/50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100',
                    dept.required && 'opacity-75 cursor-default'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                      )}>
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className={cn(
                          'font-medium',
                          theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        )}>
                          {dept.name}
                        </h4>
                        <p className={cn(
                          'text-xs',
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          {dept.category}
                        </p>
                      </div>
                    </div>
                    
                    {(selectedDepartments.includes(dept.id) || dept.required) && (
                      <div className={cn(
                        'w-5 h-5 rounded-full',
                        theme === 'dark' ? 'bg-cyan-500' : 'bg-blue-500'
                      )} />
                    )}
                  </div>
                  
                  <p className={cn(
                    'text-xs line-clamp-2',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {dept.description}
                  </p>
                  
                  {dept.required && (
                    <div className={cn(
                      'text-xs px-2 py-1 rounded self-start',
                      theme === 'dark' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                    )}>
                      Required
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className={cn(
              'p-4 rounded-lg',
              theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50'
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn(
                    'text-sm font-medium',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    Selected Departments
                  </p>
                  <p className={cn(
                    'text-xs mt-1',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {selectedDepartments.length + predefinedDepartments.filter(d => d.required).length} departments selected
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNext}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    theme === 'dark'
                      ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  )}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        );
        
      case 1: // Add Custom Departments
        return (
          <div className="space-y-6">
            <div>
              <h3 className={cn(
                'text-lg font-semibold mb-2',
                theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
              )}>
                Add Custom Departments
              </h3>
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Create custom departments specific to your facility's needs
              </p>
            </div>
            
            {/* Add Custom Department Form */}
            <div className={cn(
              'p-6 rounded-xl border',
              theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
            )}>
              <button
                type="button"
                onClick={handleAddCustomDepartment}
                className={cn(
                  'w-full p-4 rounded-xl border-2 border-dashed transition-colors',
                  'flex flex-col items-center justify-center gap-2',
                  theme === 'dark'
                    ? 'border-gray-700 text-gray-400 hover:border-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10'
                    : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'
                )}
              >
                <Plus className="w-6 h-6" />
                <span className="font-medium">Add Custom Department</span>
                <span className="text-xs">Click to add specialized departments (e.g., Maternity Ward, HIV Clinic)</span>
              </button>
            </div>
            
            {/* Custom Departments List */}
            {customDepartments.length > 0 && (
              <div>
                <h4 className={cn(
                  'text-sm font-semibold mb-3',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Custom Departments ({customDepartments.length})
                </h4>
                <div className="space-y-3">
                  {customDepartments.map((dept) => (
                    <div
                      key={dept.id}
                      className={cn(
                        'p-4 rounded-xl border',
                        'flex items-center justify-between',
                        theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'p-2 rounded-lg',
                          theme === 'dark' ? 'bg-cyan-500/20' : 'bg-blue-100'
                        )}>
                          <Building className={cn(
                            'w-4 h-4',
                            theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                          )} />
                        </div>
                        <div>
                          <h5 className={cn(
                            'font-medium',
                            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                          )}>
                            {dept.name}
                          </h5>
                          <p className={cn(
                            'text-xs',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            Custom Department
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomDepartment(dept.id)}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-red-400 hover:bg-gray-800'
                            : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      case 2: // Configure Routing
        return (
          <div className="space-y-6">
            <div>
              <h3 className={cn(
                'text-lg font-semibold mb-2',
                theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
              )}>
                Patient Routing Configuration
              </h3>
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Define allowed patient flow between departments
              </p>
            </div>
            
            <div className={cn(
              'p-6 rounded-xl border',
              theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
            )}>
              <div className="mb-6">
                <h4 className={cn(
                  'text-sm font-semibold mb-3',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Example Routing Flow
                </h4>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {['Triage', 'OPD', 'Lab', 'Pharmacy'].map((dept, index) => (
                    <React.Fragment key={dept}>
                      <div className={cn(
                        'px-4 py-2 rounded-lg font-medium',
                        theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      )}>
                        {dept}
                      </div>
                      {index < 3 && (
                        <ChevronRight className={cn(
                          'w-4 h-4',
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        )} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <p className={cn(
                  'text-xs text-center mt-3',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                )}>
                  Typical patient flow: Triage → OPD → Lab → Pharmacy
                </p>
              </div>
              
              <div>
                <h4 className={cn(
                  'text-sm font-semibold mb-3',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Configure Routing Rules
                </h4>
                <div className="space-y-4">
                  {routingRules.map((rule, index) => (
                    <div
                      key={index}
                      className={cn(
                        'p-4 rounded-lg border',
                        'flex items-center justify-between',
                        theme === 'dark' ? 'bg-gray-800/50 border-gray-600' : 'bg-white border-gray-300'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'px-3 py-1 rounded text-sm font-medium',
                          theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                        )}>
                          {rule.from}
                        </span>
                        <ChevronRight className={cn(
                          'w-4 h-4',
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        )} />
                        <span className={cn(
                          'px-3 py-1 rounded text-sm font-medium',
                          theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-700'
                        )}>
                          {rule.to}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRoutingRule(index)}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-red-400 hover:bg-gray-800'
                            : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => {
                      const from = prompt('Enter source department:');
                      const to = prompt('Enter destination department:');
                      if (from && to) {
                        handleAddRoutingRule(from, to);
                      }
                    }}
                    className={cn(
                      'w-full p-3 rounded-lg border-2 border-dashed transition-colors',
                      'flex items-center justify-center gap-2',
                      theme === 'dark'
                        ? 'border-gray-700 text-gray-400 hover:border-cyan-500 hover:text-cyan-400 hover:bg-cyan-500/10'
                        : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    Add Routing Rule
                  </button>
                </div>
              </div>
            </div>
            
            <div className={cn(
              'p-4 rounded-lg',
              theme === 'dark' ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-200'
            )}>
              <div className="flex items-start gap-3">
                <AlertCircle className={cn(
                  'w-5 h-5 mt-0.5 flex-shrink-0',
                  theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                )} />
                <div>
                  <h5 className={cn(
                    'text-sm font-semibold',
                    theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
                  )}>
                    Routing Best Practices
                  </h5>
                  <ul className={cn(
                    'text-xs space-y-1 mt-2',
                    theme === 'dark' ? 'text-yellow-400/80' : 'text-yellow-600/80'
                  )}>
                    <li>• Define clear patient pathways for common scenarios</li>
                    <li>• Ensure emergency departments can route to critical care</li>
                    <li>• Consider overflow routing for high-traffic departments</li>
                    <li>• Review and update routing rules periodically</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <WizardStepper
        currentStep={currentStep}
        totalSteps={steps.length}
        onNext={handleNext}
        onBack={handleBack}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {renderStepContent()}
      </div>
    </div>
  );
};

export default DepartmentConfigurationWizard;