import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/index';
import { ContentLayout, Operation } from '../../components/content/ContentLayout';
import {
  Building2, Users, GitBranch, Settings,
  Home, CheckCircle,
  Building, MapPin, Phone, UserCog,
   Shield, Briefcase, Stethoscope,
  Pill, Microscope, Bed, FileDigit,
   Clock, AlertCircle, ChevronRight,
  Save,Trash2,Plus 
} from 'lucide-react';
import { cn } from '../../utils/classNameUtils';
import {
  setActiveAction,
  setOnboardingStep,
  saveDraft,
  clearDraft,
//   selectFacility,
  // createFacility,
  // verifyLicense
} from '../../store/slices/facilitySlice';

/* ============================================================================
   TYPE DEFINITIONS
============================================================================ */

type FacilityActionId = 'overview' | 'registration' | 'departments' | 'staff' | 'workflows';

interface StepConfig {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

interface WizardStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

/* ============================================================================
   CONSTANTS
============================================================================ */

const FACILITY_OPERATIONS: Operation[] = [
  {
    id: 'overview',
    label: 'Facility Overview',
    icon: <Home className="w-4 h-4" />,
    description: 'Facility dashboard and status overview',
  },
  {
    id: 'registration',
    label: 'Facility Registration',
    icon: <Building2 className="w-4 h-4" />,
    description: 'Register new healthcare facility',
  },
  {
    id: 'departments',
    label: 'Department Configuration',
    icon: <Building className="w-4 h-4" />,
    description: 'Configure departments and patient routing',
  },
  {
    id: 'staff',
    label: 'Staff Onboarding',
    icon: <Users className="w-4 h-4" />,
    description: 'Onboard and assign staff members',
  },
  {
    id: 'workflows',
    label: 'Workflow Customization',
    icon: <GitBranch className="w-4 h-4" />,
    description: 'Customize clinical and operational workflows',
  },
];

const FACILITY_TYPES = [
  { value: 'Hospital', label: 'Hospital', icon: <Building2 className="w-4 h-4" /> },
  { value: 'Clinic', label: 'Clinic', icon: <Stethoscope className="w-4 h-4" /> },
  { value: 'Pharmacy', label: 'Pharmacy', icon: <Pill className="w-4 h-4" /> },
  { value: 'Lab', label: 'Laboratory', icon: <Microscope className="w-4 h-4" /> },
  { value: 'Other', label: 'Other Facility', icon: <Building className="w-4 h-4" /> },
];

/* ============================================================================
   WIZARD STEPPER COMPONENT
============================================================================ */

const WizardStepper: React.FC<WizardStepProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onSaveDraft,
  onSubmit
}) => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  
  return (
    <div className={cn(
      'sticky top-0 z-10 py-4 px-6 border-b backdrop-blur-lg',
      theme === 'dark' 
        ? 'bg-gray-900/80 border-gray-800/40' 
        : 'bg-white/80 border-gray-200/50'
    )}>
      <div className="flex items-center justify-between">
        {/* Progress */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-8 h-1.5 rounded-full transition-all duration-300',
                  index < currentStep 
                    ? theme === 'dark' ? 'bg-cyan-500' : 'bg-blue-500'
                    : index === currentStep
                    ? theme === 'dark' ? 'bg-cyan-400' : 'bg-blue-400'
                    : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                )}
              />
            ))}
          </div>
          <span className={cn(
            'text-sm font-medium',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          )}>
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSaveDraft}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'flex items-center gap-2',
              theme === 'dark'
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          
          {currentStep > 0 && (
            <button
              type="button"
              onClick={onBack}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                theme === 'dark'
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              Back
            </button>
          )}
          
          {currentStep < totalSteps - 1 ? (
            <button
              type="button"
              onClick={onNext}
              className={cn(
                'px-6 py-2 rounded-lg text-sm font-medium transition-all',
                'flex items-center gap-2',
                theme === 'dark'
                  ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              )}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              className={cn(
                'px-6 py-2 rounded-lg text-sm font-medium transition-all',
                'flex items-center gap-2',
                theme === 'dark'
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500'
                  : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500'
              )}
            >
              <CheckCircle className="w-4 h-4" />
              Complete Setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   ACTION 1: FACILITY REGISTRATION COMPONENT
============================================================================ */

const FacilityRegistrationWizard: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const { currentStep } = useSelector((state: RootState) => state.facility.onboarding);
  
  const [formData, setFormData] = useState({
    // Step 1: Facility Details
    name: '',
    type: 'Hospital',
    licenseNumber: '',
    
    // Step 2: Location & Contact
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    contact: {
      phone: '',
      email: '',
      emergencyContact: ''
    },
    
    // Step 3: Verification
    licenseVerified: false,
    
    // Step 4: Review
    agreeToTerms: false
  });
  
  const steps: StepConfig[] = [
    { id: 0, title: 'Facility Details', description: 'Basic facility information', completed: false },
    { id: 1, title: 'Location & Contact', description: 'Address and contact information', completed: false },
    { id: 2, title: 'License Verification', description: 'Validate facility license', completed: false },
    { id: 3, title: 'Review & Confirm', description: 'Final review and submission', completed: false }
  ];
  
 interface FacilityFormData {
  name: string;
  type: "Hospital" | "Clinic" | "Pharmacy" | "Lab" | "Other";
  licenseNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  contact: {
    phone: string;
    email: string;
    emergencyContact: string;
  };
  licenseVerified: boolean;
  agreeToTerms: boolean;
}


 const handleInputChange = useCallback<
  <K extends keyof FacilityFormData>(field: K, value: FacilityFormData[K]) => void
>(
  (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-save to draft
    dispatch(saveDraft({ [field]: value } as Partial<FacilityFormData>));
  },
  [dispatch]
);

  
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
    dispatch(saveDraft(formData));
    alert('Draft saved successfully!');
  }, [dispatch, formData]);
  
  const handleSubmit = useCallback(async () => {
    try {
      // TODO: Implement actual API call
      // await dispatch(createFacility(formData)).unwrap();
      alert('Facility registered successfully!');
      dispatch(clearDraft());
      dispatch(setActiveAction('overview'));
    } catch (error) {
        alert(error);

      alert('Failed to register facility. Please try again.');
    }
  }, [dispatch, formData]);
  
  const handleVerifyLicense = useCallback(async () => {
    if (!formData.licenseNumber) {
      alert('Please enter a license number');
      return;
    }
    
    try {
      // await dispatch(verifyLicense(formData.licenseNumber)).unwrap();
      setFormData(prev => ({ ...prev, licenseVerified: true }));
    } catch (error) {
        alert(error);

      alert('License verification failed');
    }
  }, [dispatch, formData.licenseNumber]);
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Facility Details
        return (
          <div className="space-y-6">
            <div>
              <h3 className={cn(
                'text-lg font-semibold mb-2',
                theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
              )}>
                Facility Information
              </h3>
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Enter basic details about your healthcare facility
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  Facility Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  placeholder="e.g., Metropolitan General Hospital"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border text-sm',
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
                  Facility Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {FACILITY_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      // onClick={() => handleInputChange('type', type.value)}
                      className={cn(
                        'p-4 rounded-xl border transition-all',
                        'flex flex-col items-center gap-2',
                        formData.type === type.value
                          ? theme === 'dark'
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                            : 'border-blue-500 bg-blue-50 text-blue-700'
                          : theme === 'dark'
                            ? 'border-gray-800 bg-gray-800/30 text-gray-400 hover:border-gray-700 hover:bg-gray-800/50'
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                      )}
                    >
                      {type.icon}
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  License Number *
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                  required
                  placeholder="e.g., HSP-2024-00123"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                  )}
                />
                <p className={cn(
                  'text-xs mt-2',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                )}>
                  This will be verified in the next step
                </p>
              </div>
            </div>
          </div>
        );
        
      case 1: // Location & Contact
        return (
          <div className="space-y-6">
            <div>
              <h3 className={cn(
                'text-lg font-semibold mb-2',
                theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
              )}>
                Location & Contact Information
              </h3>
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Enter your facility's physical address and contact details
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Address Section */}
              <div>
                <h4 className={cn(
                  'text-sm font-semibold mb-3 flex items-center gap-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  <MapPin className="w-4 h-4" />
                  Physical Address
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address', { ...formData.address, street: e.target.value })}
                      required
                      placeholder="Street address"
                      className={cn(
                        'w-full px-4 py-3 rounded-xl border text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                          : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                      )}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange('address', { ...formData.address, city: e.target.value })}
                      required
                      placeholder="City"
                      className={cn(
                        'w-full px-4 py-3 rounded-xl border text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                          : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                      )}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) => handleInputChange('address', { ...formData.address, state: e.target.value })}
                      required
                      placeholder="State/Province"
                      className={cn(
                        'w-full px-4 py-3 rounded-xl border text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                          : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                      )}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.address.country}
                      onChange={(e) => handleInputChange('address', { ...formData.address, country: e.target.value })}
                      required
                      placeholder="Country"
                      className={cn(
                        'w-full px-4 py-3 rounded-xl border text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                          : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                      )}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.address.postalCode}
                      onChange={(e) => handleInputChange('address', { ...formData.address, postalCode: e.target.value })}
                      required
                      placeholder="Postal/ZIP Code"
                      className={cn(
                        'w-full px-4 py-3 rounded-xl border text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                          : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                      )}
                    />
                  </div>
                </div>
              </div>
              
              {/* Contact Section */}
              <div>
                <h4 className={cn(
                  'text-sm font-semibold mb-3 flex items-center gap-2',
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                )}>
                  <Phone className="w-4 h-4" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Primary Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.contact.phone}
                      onChange={(e) => handleInputChange('contact', { ...formData.contact, phone: e.target.value })}
                      required
                      placeholder="+1 (555) 123-4567"
                      className={cn(
                        'w-full px-4 py-3 rounded-xl border text-sm',
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
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.contact.email}
                      onChange={(e) => handleInputChange('contact', { ...formData.contact, email: e.target.value })}
                      required
                      placeholder="contact@facility.com"
                      className={cn(
                        'w-full px-4 py-3 rounded-xl border text-sm',
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
                      Emergency Contact *
                    </label>
                    <input
                      type="tel"
                      value={formData.contact.emergencyContact}
                      onChange={(e) => handleInputChange('contact', { ...formData.contact, emergencyContact: e.target.value })}
                      required
                      placeholder="+1 (555) 987-6543"
                      className={cn(
                        'w-full px-4 py-3 rounded-xl border text-sm',
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
          </div>
        );
        
      case 2: // License Verification
        return (
          <div className="space-y-6">
            <div>
              <h3 className={cn(
                'text-lg font-semibold mb-2',
                theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
              )}>
                License Verification
              </h3>
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Verify your facility's operating license
              </p>
            </div>
            
            <div className={cn(
              'p-6 rounded-xl border',
              theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
            )}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className={cn(
                    'font-medium',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    License Details
                  </h4>
                  <p className={cn(
                    'text-sm mt-1',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {formData.licenseNumber || 'No license number entered'}
                  </p>
                </div>
                
                <div className={cn(
                  'px-3 py-1 rounded-lg text-sm font-medium',
                  formData.licenseVerified
                    ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                    : theme === 'dark' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                )}>
                  {formData.licenseVerified ? 'Verified' : 'Pending'}
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleVerifyLicense}
                disabled={!formData.licenseNumber || formData.licenseVerified}
                className={cn(
                  'w-full py-3 rounded-xl text-sm font-medium transition-all',
                  'flex items-center justify-center gap-2',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  theme === 'dark'
                    ? 'bg-cyan-600 text-white hover:bg-cyan-500 focus:ring-cyan-500'
                    : 'bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500',
                  (!formData.licenseNumber || formData.licenseVerified) && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Shield className="w-4 h-4" />
                {formData.licenseVerified ? 'License Verified' : 'Verify License Now'}
              </button>
              
              {formData.licenseVerified && (
                <div className={cn(
                  'mt-6 p-4 rounded-lg',
                  theme === 'dark' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
                )}>
                  <div className="flex items-center gap-3">
                    <CheckCircle className={cn(
                      'w-5 h-5 flex-shrink-0',
                      theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                    )} />
                    <div>
                      <p className={cn(
                        'text-sm font-medium',
                        theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'
                      )}>
                        License Successfully Verified
                      </p>
                      <p className={cn(
                        'text-xs mt-1',
                        theme === 'dark' ? 'text-emerald-400/80' : 'text-emerald-600/80'
                      )}>
                        Your facility license has been validated. You may proceed to the next step.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className={cn(
              'p-4 rounded-lg',
              theme === 'dark' ? 'bg-gray-800/30 border border-gray-700' : 'bg-gray-50 border border-gray-200'
            )}>
              <h4 className={cn(
                'text-sm font-semibold mb-2 flex items-center gap-2',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                <AlertCircle className="w-4 h-4" />
                Important Information
              </h4>
              <ul className={cn(
                'text-xs space-y-1.5',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                <li>• License verification is required for facility registration</li>
                <li>• Upon verification, your facility will be enrolled in the National Referral Network</li>
                <li>• Verified facilities can accept patient referrals from other network members</li>
                <li>• License information is securely validated with regulatory authorities</li>
              </ul>
            </div>
          </div>
        );
        
      case 3: // Review & Confirm
        return (
          <div className="space-y-6">
            <div>
              <h3 className={cn(
                'text-lg font-semibold mb-2',
                theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
              )}>
                Review & Confirm
              </h3>
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Review your facility information before final submission
              </p>
            </div>
            
            <div className={cn(
              'rounded-xl border overflow-hidden',
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            )}>
              {/* Summary Header */}
              <div className={cn(
                'px-6 py-4 border-b',
                theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={cn(
                      'text-lg font-bold',
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      {formData.name}
                    </h4>
                    <p className={cn(
                      'text-sm mt-1',
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      Facility Registration Summary
                    </p>
                  </div>
                  <div className={cn(
                    'px-3 py-1 rounded-lg text-sm font-bold',
                    theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-50 text-blue-700'
                  )}>
                    Ready to Register
                  </div>
                </div>
              </div>
              
              {/* Summary Details */}
              <div className="p-6 space-y-6">
                <div>
                  <h5 className={cn(
                    'text-sm font-semibold mb-3',
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    Facility Details
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className={cn(
                        'text-xs',
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      )}>
                        Facility Type
                      </p>
                      <p className={cn(
                        'font-medium',
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                      )}>
                        {formData.type}
                      </p>
                    </div>
                    <div>
                      <p className={cn(
                        'text-xs',
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      )}>
                        License Number
                      </p>
                      <p className={cn(
                        'font-medium flex items-center gap-2',
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                      )}>
                        {formData.licenseNumber}
                        {formData.licenseVerified && (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className={cn(
                    'text-sm font-semibold mb-3',
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    Location & Contact
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <p className={cn(
                        'text-xs',
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      )}>
                        Address
                      </p>
                      <p className={cn(
                        'font-medium',
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                      )}>
                        {formData.address.street}, {formData.address.city}, {formData.address.state} {formData.address.postalCode}, {formData.address.country}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className={cn(
                          'text-xs',
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        )}>
                          Primary Phone
                        </p>
                        <p className={cn(
                          'font-medium',
                          theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        )}>
                          {formData.contact.phone}
                        </p>
                      </div>
                      <div>
                        <p className={cn(
                          'text-xs',
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        )}>
                          Email
                        </p>
                        <p className={cn(
                          'font-medium',
                          theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        )}>
                          {formData.contact.email}
                        </p>
                      </div>
                      <div>
                        <p className={cn(
                          'text-xs',
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        )}>
                          Emergency Contact
                        </p>
                        <p className={cn(
                          'font-medium',
                          theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        )}>
                          {formData.contact.emergencyContact}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Network Enrollment */}
                <div className={cn(
                  'p-4 rounded-lg',
                  theme === 'dark' ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-blue-50 border border-blue-200'
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      theme === 'dark' ? 'bg-cyan-500/20' : 'bg-blue-100'
                    )}>
                      <Building2 className={cn(
                        'w-5 h-5',
                        theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                      )} />
                    </div>
                    <div>
                      <h6 className={cn(
                        'text-sm font-semibold',
                        theme === 'dark' ? 'text-cyan-300' : 'text-blue-700'
                      )}>
                        National Referral Network
                      </h6>
                      <p className={cn(
                        'text-xs mt-1',
                        theme === 'dark' ? 'text-cyan-400/80' : 'text-blue-600/80'
                      )}>
                        Your facility will be automatically enrolled in the national referral network upon registration. This enables inter-facility patient referrals and collaboration.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Terms Agreement */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                      className="mt-1"
                    />
                    <div>
                      <p className={cn(
                        'text-sm font-medium',
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                      )}>
                        I agree to the terms and conditions
                      </p>
                      <p className={cn(
                        'text-xs mt-1',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        By submitting this form, I confirm that all information provided is accurate and I agree to the facility registration terms, privacy policy, and network participation agreement.
                      </p>
                    </div>
                  </label>
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

/* ============================================================================
   ACTION 2: DEPARTMENT CONFIGURATION COMPONENT
============================================================================ */

const DepartmentConfigurationWizard: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const { currentStep } = useSelector((state: RootState) => state.facility.onboarding);
  const { predefinedDepartments, } = useSelector((state: RootState) => state.facility);
  
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
                        {dept.category === 'Emergency' && <AlertCircle className="w-4 h-4" />}
                        {dept.category === 'Outpatient' && <Users className="w-4 h-4" />}
                        {dept.category === 'Inpatient' && <Bed className="w-4 h-4" />}
                        {dept.category === 'Pharmacy' && <Pill className="w-4 h-4" />}
                        {dept.category === 'Diagnostic' && <Microscope className="w-4 h-4" />}
                        {dept.category === 'Clinical' && <Stethoscope className="w-4 h-4" />}
                        {dept.category === 'Administrative' && <FileDigit className="w-4 h-4" />}
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
                      <CheckCircle className={cn(
                        'w-5 h-5',
                        theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
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
        onSaveDraft={() => alert('Draft saved')}
        onSubmit={() => alert('Configuration saved')}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {renderStepContent()}
      </div>
    </div>
  );
};

/* ============================================================================
   ACTION 3: STAFF ONBOARDING COMPONENT
============================================================================ */

const StaffOnboardingWizard: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const { currentStep } = useSelector((state: RootState) => state.facility.onboarding);
  const { predefinedRoles } = useSelector((state: RootState) => state.facility);
  
  const steps: StepConfig[] = [
    { id: 0, title: 'Staff Information', description: 'Basic staff details', completed: false },
    { id: 1, title: 'Department Assignment', description: 'Assign to departments', completed: false },
    { id: 2, title: 'Role & Permissions', description: 'Set access controls', completed: false },
    { id: 3, title: 'Credentials', description: 'Generate login details', completed: false },
    { id: 4, title: 'Review & Notify', description: 'Finalize and notify', completed: false }
  ];
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h3 className={cn(
                'text-lg font-semibold mb-2',
                theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
              )}>
                Staff Information
              </h3>
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Enter basic information for the new staff member
              </p>
            </div>
            
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
                  required
                  placeholder="Dr. Jane Smith"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border text-sm',
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
                  Professional Role *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Senior Physician, Head Nurse"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border text-sm',
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
                  License/Registration Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., MD-123456"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border text-sm',
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
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="staff@facility.com"
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-offset-0',
                    theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                  )}
                />
              </div>
            </div>
          </div>
        );
        
      case 2: // Role & Permissions
        return (
          <div className="space-y-6">
            <div>
              <h3 className={cn(
                'text-lg font-semibold mb-2',
                theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
              )}>
                Role-Based Access Control (RBAC)
              </h3>
              <p className={cn(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                Assign roles and customize permissions from 15+ predefined roles
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {predefinedRoles.map((role) => (
                <div
                  key={role.id}
                  className={cn(
                    'p-4 rounded-xl border cursor-pointer transition-all',
                    'flex flex-col gap-2',
                    theme === 'dark'
                      ? 'border-gray-800 bg-gray-800/30 hover:border-cyan-500 hover:bg-cyan-500/10'
                      : 'border-gray-200 bg-gray-50 hover:border-blue-500 hover:bg-blue-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'p-1.5 rounded',
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                      )}>
                        {role.category === 'Clinical' && <Stethoscope className="w-3.5 h-3.5" />}
                        {role.category === 'Administrative' && <Briefcase className="w-3.5 h-3.5" />}
                        {role.category === 'Technical' && <Settings className="w-3.5 h-3.5" />}
                        {role.category === 'Support' && <Users className="w-3.5 h-3.5" />}
                      </div>
                      <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded',
                        theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      )}>
                        {role.category}
                      </span>
                    </div>
                    <div className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded',
                      theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-700'
                    )}>
                      Level {role.accessLevel}
                    </div>
                  </div>
                  
                  <h4 className={cn(
                    'font-medium',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    {role.name}
                  </h4>
                  
                  <p className={cn(
                    'text-xs line-clamp-2',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {role.description}
                  </p>
                  
                  <div className="mt-2">
                    <div className={cn(
                      'text-xs mb-1',
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    )}>
                      Key Permissions:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((perm, index) => (
                        <span
                          key={index}
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded',
                            theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                          )}
                        >
                          {perm.replace('_', ' ')}
                        </span>
                      ))}
                      {role.permissions.length > 3 && (
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                        )}>
                          +{role.permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={cn(
              'p-4 rounded-lg',
              theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50'
            )}>
              <h4 className={cn(
                'text-sm font-semibold mb-2',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                Custom Permission Overrides
              </h4>
              <p className={cn(
                'text-xs',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                After selecting a role, you can customize individual permissions to match specific needs.
              </p>
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
        onNext={() => {}}
        onBack={() => {}}
        onSaveDraft={() => alert('Draft saved')}
        onSubmit={() => alert('Staff onboarded')}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {renderStepContent()}
      </div>
    </div>
  );
};

/* ============================================================================
   ACTION 4: WORKFLOW CUSTOMIZATION COMPONENT
============================================================================ */

const WorkflowCustomizationWizard: React.FC = () => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const { currentStep } = useSelector((state: RootState) => state.facility.onboarding);
  
  const steps: StepConfig[] = [
    { id: 0, title: 'Patient Journey', description: 'Define care pathways', completed: false },
    { id: 1, title: 'Billing Rules', description: 'Configure pricing logic', completed: false },
    { id: 2, title: 'Approval Hierarchies', description: 'Set approval workflows', completed: false },
    { id: 3, title: 'Review & Activate', description: 'Finalize workflows', completed: false }
  ];
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 2: // Approval Hierarchies
        return (
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
                  <div className="flex items-center justify-between">
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
                  
                  {/* Connecting lines */}
                  <div className="absolute top-6 left-1/4 right-0 h-0.5 -translate-y-1/2">
                    <div className={cn(
                      'h-0.5 w-2/3 mx-auto',
                      theme === 'dark' ? 'bg-cyan-500/30' : 'bg-blue-500/30'
                    )} />
                  </div>
                </div>
                
                {/* Configuration Form */}
                <div className="space-y-4">
                  <div>
                    <h5 className={cn(
                      'text-sm font-semibold mb-3',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Configure Approval Thresholds
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={cn(
                          'block text-sm font-medium mb-2',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          Department Head Approval
                        </label>
                        <input
                          type="number"
                          placeholder="500"
                          className={cn(
                            'w-full px-4 py-2.5 rounded-xl border text-sm',
                            'focus:outline-none focus:ring-2 focus:ring-offset-0',
                            theme === 'dark'
                              ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                              : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                          )}
                        />
                        <p className={cn(
                          'text-xs mt-1',
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        )}>
                          Minimum amount requiring department head approval
                        </p>
                      </div>
                      
                      <div>
                        <label className={cn(
                          'block text-sm font-medium mb-2',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          Medical Director Approval
                        </label>
                        <input
                          type="number"
                          placeholder="5000"
                          className={cn(
                            'w-full px-4 py-2.5 rounded-xl border text-sm',
                            'focus:outline-none focus:ring-2 focus:ring-offset-0',
                            theme === 'dark'
                              ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                              : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                          )}
                        />
                        <p className={cn(
                          'text-xs mt-1',
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        )}>
                          Minimum amount requiring medical director approval
                        </p>
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
        onNext={() => {}}
        onBack={() => {}}
        onSaveDraft={() => alert('Draft saved')}
        onSubmit={() => alert('Workflows activated')}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {renderStepContent()}
      </div>
    </div>
  );
};

/* ============================================================================
   MAIN MODULE COMPONENT
============================================================================ */

export const FacilityOnboardingModule: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const { facilities } = useSelector((state: RootState) => state.facility);
  
  const [activeAction, setActiveAction] = useState<FacilityActionId>('overview');
  
  const handleOperationChange = useCallback((operationId: string) => {
    setActiveAction(operationId as FacilityActionId);
    // dispatch(setActiveAction(operationId));
  }, [dispatch]);
  
  const renderOverview = () => (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className={cn(
          'text-3xl font-bold mb-2',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Facility Onboarding & Configuration Hub
        </h1>
        <p className={cn(
          'text-sm',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          Enterprise facility management with multi-branch support, dynamic staff allocation, and role-based access control
        </p>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Facilities',
            value: facilities.length.toString(),
            icon: <Building2 className="w-5 h-5" />,
            color: 'from-blue-500 to-cyan-500',
            description: 'Across all organizations'
          },
          {
            label: 'Active Staff',
            value: '24',
            icon: <Users className="w-5 h-5" />,
            color: 'from-emerald-500 to-green-500',
            description: 'Currently assigned'
          },
          {
            label: 'Departments',
            value: '12',
            icon: <Building className="w-5 h-5" />,
            color: 'from-purple-500 to-pink-500',
            description: 'Configured across facilities'
          },
          {
            label: 'Pending Actions',
            value: '3',
            icon: <Clock className="w-5 h-5" />,
            color: 'from-orange-500 to-amber-500',
            description: 'Require attention'
          },
        ].map((stat, index) => (
          <div
            key={index}
            className={cn(
              'relative p-5 rounded-2xl border backdrop-blur-sm',
              'transition-all duration-300 hover:scale-[1.02]',
              theme === 'dark'
                ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
                : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
            )}
          >
            <div className={cn(
              'absolute inset-0 rounded-2xl opacity-10',
              `bg-gradient-to-br ${stat.color}`
            )} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  'p-2.5 rounded-xl',
                  theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'
                )}>
                  <div className={cn(
                    stat.color.includes('blue') ? 'text-blue-400' :
                    stat.color.includes('emerald') ? 'text-emerald-400' :
                    stat.color.includes('purple') ? 'text-purple-400' : 'text-orange-400'
                  )}>
                    {stat.icon}
                  </div>
                </div>
              </div>
              
              <p className={cn(
                'text-sm mb-1',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}>
                {stat.label}
              </p>
              
              <h3 className={cn(
                'text-3xl font-bold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {stat.value}
              </h3>
              
              <p className={cn(
                'text-xs mt-1',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
              )}>
                {stat.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cn(
          'rounded-2xl border p-6',
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
            : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
        )}>
          <h3 className={cn(
            'text-lg font-semibold mb-4',
            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
          )}>
            Quick Setup Guide
          </h3>
          
          <div className="space-y-4">
            {[
              { step: 1, title: 'Register Facility', description: 'Complete basic registration and license verification', action: 'registration' },
              { step: 2, title: 'Configure Departments', description: 'Set up departments and patient routing', action: 'departments' },
              { step: 3, title: 'Onboard Staff', description: 'Add staff and assign roles/permissions', action: 'staff' },
              { step: 4, title: 'Customize Workflows', description: 'Define patient journeys and approval processes', action: 'workflows' },
            ].map((guide) => (
              <div
                key={guide.step}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all',
                  theme === 'dark'
                    ? 'bg-gray-800/30 hover:bg-gray-800/50'
                    : 'bg-gray-50 hover:bg-gray-100'
                )}
                onClick={() => handleOperationChange(guide.action)}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                  theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-700'
                )}>
                  {guide.step}
                </div>
                <div className="flex-1">
                  <h4 className={cn(
                    'font-medium',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    {guide.title}
                  </h4>
                  <p className={cn(
                    'text-xs mt-1',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {guide.description}
                  </p>
                </div>
                <ChevronRight className={cn(
                  'w-4 h-4',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={cn(
          'rounded-2xl border p-6',
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
            : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
        )}>
          <h3 className={cn(
            'text-lg font-semibold mb-4',
            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
          )}>
            Recent Facility Activity
          </h3>
          
          <div className="space-y-4">
            {[
              { facility: 'Metropolitan General', action: 'Department configuration updated', time: '2 hours ago', status: 'completed' },
              { facility: 'City Clinic', action: 'New staff onboarded', time: '1 day ago', status: 'completed' },
              { facility: 'Regional Hospital', action: 'Workflow customization in progress', time: '2 days ago', status: 'in-progress' },
              { facility: 'Community Pharmacy', action: 'Facility registration pending verification', time: '3 days ago', status: 'pending' },
            ].map((activity, index) => (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-xl border',
                  theme === 'dark' ? 'bg-gray-800/30 border-gray-800' : 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className={cn(
                    'font-medium',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    {activity.facility}
                  </h4>
                  <span className={cn(
                    'px-2 py-0.5 text-xs rounded',
                    activity.status === 'completed' 
                      ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                      : activity.status === 'in-progress'
                      ? theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-700'
                      : theme === 'dark' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                  )}>
                    {activity.status}
                  </span>
                </div>
                <p className={cn(
                  'text-sm',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {activity.action}
                </p>
                <p className={cn(
                  'text-xs mt-2',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                )}>
                  {activity.time}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Branch Support */}
      <div className={cn(
        'rounded-2xl border p-6',
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50'
          : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60'
      )}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={cn(
              'text-lg font-semibold',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
            )}>
              Multi-Branch Organization Support
            </h3>
            <p className={cn(
              'text-sm mt-1',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Manage multiple facilities under a single organization with shared configuration
            </p>
          </div>
          <div className={cn(
            'px-3 py-1 rounded-lg text-sm font-bold',
            theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-50 text-blue-700'
          )}>
            Enterprise Feature
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={cn(
            'p-4 rounded-xl',
            theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100'
          )}>
            <h4 className={cn(
              'font-medium mb-2 flex items-center gap-2',
              theme === 'dark' ? 'text-cyan-300' : 'text-blue-600'
            )}>
              <Building2 className="w-4 h-4" />
              Shared Configuration
            </h4>
            <p className={cn(
              'text-xs',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Standardized roles, departments, and workflows across all facilities
            </p>
          </div>
          
          <div className={cn(
            'p-4 rounded-xl',
            theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100'
          )}>
            <h4 className={cn(
              'font-medium mb-2 flex items-center gap-2',
              theme === 'dark' ? 'text-cyan-300' : 'text-blue-600'
            )}>
              <GitBranch className="w-4 h-4" />
              Facility-Specific Customization
            </h4>
            <p className={cn(
              'text-xs',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Override configurations for individual facility needs
            </p>
          </div>
          
          <div className={cn(
            'p-4 rounded-xl',
            theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-100'
          )}>
            <h4 className={cn(
              'font-medium mb-2 flex items-center gap-2',
              theme === 'dark' ? 'text-cyan-300' : 'text-blue-600'
            )}>
              <Users className="w-4 h-4" />
              Centralized Management
            </h4>
            <p className={cn(
              'text-xs',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Manage all facilities from a single dashboard with unified reporting
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkspaceContent = () => {
    switch (activeAction) {
      case 'overview':
        return renderOverview();
      case 'registration':
        return <FacilityRegistrationWizard />;
      case 'departments':
        return <DepartmentConfigurationWizard />;
      case 'staff':
        return <StaffOnboardingWizard />;
      case 'workflows':
        return <WorkflowCustomizationWizard />;
      default:
        return renderOverview();
    }
  };

  return (
    <ContentLayout
      operations={FACILITY_OPERATIONS}
      activeOperation={activeAction}
      onOperationChange={handleOperationChange}
      defaultOperation="overview"
      headerTitle="Facility Management"
    >
      {renderWorkspaceContent()}
    </ContentLayout>
  );
};

FacilityOnboardingModule.displayName = 'FacilityOnboardingModule';

export default FacilityOnboardingModule;