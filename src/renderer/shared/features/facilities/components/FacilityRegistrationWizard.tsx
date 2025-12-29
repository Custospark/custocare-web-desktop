import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../../../app/store/store';
import {
  Building2,
  MapPin,
  Phone,
  Shield,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  Pill,
  Microscope,
  Building,
  Mail,
  Globe,
  FileText,
  Users,
  Clock,
  Search
} from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import WizardStepper from './WizardStepper';
import { type StepConfig } from '../types/onboarding';
import { setOnboardingStep, saveDraft, clearDraft } from '../../../../app/store/slices/facilitySlice';

const FACILITY_TYPES = [
  { value: 'Hospital', label: 'Hospital', icon: <Building2 className="w-5 h-5" />, description: 'Full-service medical facility' },
  { value: 'Clinic', label: 'Clinic', icon: <Stethoscope className="w-5 h-5" />, description: 'Outpatient care center' },
  { value: 'Pharmacy', label: 'Pharmacy', icon: <Pill className="w-5 h-5" />, description: 'Medication dispensing' },
  { value: 'Lab', label: 'Laboratory', icon: <Microscope className="w-5 h-5" />, description: 'Diagnostic testing facility' },
  { value: 'Other', label: 'Other Facility', icon: <Building className="w-5 h-5" />, description: 'Specialized healthcare facility' },
];

const FACILITY_LEVELS = [
  { value: 'Primary', label: 'Primary Care', description: 'Basic healthcare services' },
  { value: 'Secondary', label: 'Secondary Care', description: 'Specialist medical services' },
  { value: 'Tertiary', label: 'Tertiary Care', description: 'Advanced specialized care' },
  { value: 'Quaternary', label: 'Quaternary Care', description: 'Experimental medicine and procedures' },
];

const FacilityRegistrationWizard: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const { currentStep } = useSelector((state: RootState) => state.facility.onboarding);
  
  const [formData, setFormData] = useState({
    // Step 1: Facility Details
    name: '',
    type: 'Hospital',
    level: 'Secondary',
    licenseNumber: '',
    registrationNumber: '',
    establishmentYear: new Date().getFullYear(),
    operatingHours: {
      monday: '08:00-18:00',
      tuesday: '08:00-18:00',
      wednesday: '08:00-18:00',
      thursday: '08:00-18:00',
      friday: '08:00-18:00',
      saturday: '08:00-14:00',
      sunday: 'Closed'
    },
    
    // Step 2: Location & Contact
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      latitude: '',
      longitude: ''
    },
    contact: {
      phone: '',
      email: '',
      emergencyContact: '',
      website: '',
      fax: ''
    },
    
    // Step 3: Verification
    licenseVerified: false,
    registrationVerified: false,
    verificationNotes: '',
    
    // Step 4: Review
    agreeToTerms: false,
    enrollInNetwork: true,
    receiveUpdates: true
  });
  
  const steps: StepConfig[] = [
    { id: 0, title: 'Facility Details', description: 'Basic facility information', completed: false },
    { id: 1, title: 'Location & Contact', description: 'Address and contact information', completed: false },
    { id: 2, title: 'Document Verification', description: 'Validate facility documents', completed: false },
    { id: 3, title: 'Review & Confirm', description: 'Final review and submission', completed: false }
  ];
  
const handleInputChange = (field: string, value: any) => {
  setFormData(prev => {
    const fields = field.split('.');
    if (fields.length === 1) {
      return { ...prev, [field]: value };
    }
    
    const [parent, child] = fields;
    
    // Cast to Record type for safe access
    const prevAny = prev as Record<string, any>;
    
    return {
      ...prev,
      [parent]: {
        ...prevAny[parent],
        [child]: value
      }
    };
  });
};

// Usage remains the same
  
  const handleNestedInputChange = useCallback((section: string, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        [field]: value
      }
    }));
  }, []);
  
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
    alert('Facility draft saved successfully!');
  }, [dispatch, formData]);
  
  const handleSubmit = useCallback(async () => {
    try {
      // Generate facility ID
      const facilityId = `FAC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Create final facility object
      // const finalFacilityData = {
      //   ...formData,
      //   id: facilityId,
      //   status: 'Pending',
      //   registrationStatus: 'In Progress',
      //   createdAt: new Date().toISOString(),
      //   facilityId: facilityId
      // };
      
      alert(`Facility "${formData.name}" registered successfully!\nFacility ID: ${facilityId}`);
      dispatch(clearDraft());
      
      // Dispatch action to create facility
      // dispatch(createFacility(finalFacilityData));
    } catch (error) {
      console.log(error);
      alert('Failed to register facility. Please try again.');
    }
  }, [dispatch, formData]);
  
  const handleVerifyLicense = useCallback(async () => {
    if (!formData.licenseNumber) {
      alert('Please enter a license number');
      return;
    }
    
    // Simulate verification
    try {
      // await dispatch(verifyLicense(formData.licenseNumber)).unwrap();
      setFormData(prev => ({ ...prev, licenseVerified: true }));
      alert('License verification successful!');
    } catch (error) {
      console.log(error);
      alert('License verification failed. Please check the number and try again.');
    }
  }, [formData.licenseNumber]);
  
  const handleVerifyRegistration = useCallback(async () => {
    if (!formData.registrationNumber) {
      alert('Please enter a registration number');
      return;
    }
    
    // Simulate verification
    try {
      // await dispatch(verifyRegistration(formData.registrationNumber)).unwrap();
      setFormData(prev => ({ ...prev, registrationVerified: true }));
      alert('Registration verification successful!');
    } catch (error) {
      console.log(error);
      alert('Registration verification failed. Please check the number and try again.');
    }
  }, [formData.registrationNumber]);
  
  const handleGeolocate = useCallback(() => {
    // Simulate geolocation service
    if (formData.address.city && formData.address.country) {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          latitude: '40.7128',
          longitude: '-74.0060'
        }
      }));
      alert('Geolocation coordinates added for ' + formData.address.city);
    } else {
      alert('Please enter city and country first');
    }
  }, [formData.address.city, formData.address.country]);
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Facility Details
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
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
                          onClick={() => handleInputChange('type', type.value)}
                          className={cn(
                            'p-4 rounded-xl border transition-all',
                            'flex flex-col items-center gap-2 text-center',
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
                          <span className="text-xs opacity-75">{type.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Care Level *
                    </label>
                    <div className="space-y-2">
                      {FACILITY_LEVELS.map((level) => (
                        <label
                          key={level.value}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                            formData.level === level.value
                              ? theme === 'dark'
                                ? 'border-cyan-500 bg-cyan-500/10'
                                : 'border-blue-500 bg-blue-50'
                              : theme === 'dark'
                                ? 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                                : 'border-gray-300 bg-white hover:border-gray-400'
                          )}
                        >
                          <input
                            type="radio"
                            name="careLevel"
                            value={level.value}
                            checked={formData.level === level.value}
                            onChange={(e) => handleInputChange('level', e.target.value)}
                            className="text-cyan-500"
                          />
                          <div>
                            <span className={cn(
                              'font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {level.label}
                            </span>
                            <p className={cn(
                              'text-xs mt-1',
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              {level.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Operating License Number *
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
                  
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Registration Number *
                    </label>
                    <input
                      type="text"
                      value={formData.registrationNumber}
                      onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                      required
                      placeholder="e.g., REG-2024-0456"
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
                      Year of Establishment *
                    </label>
                    <input
                      type="number"
                      value={formData.establishmentYear}
                      onChange={(e) => handleInputChange('establishmentYear', parseInt(e.target.value) || new Date().getFullYear())}
                      required
                      min="1800"
                      max={new Date().getFullYear()}
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
                
                {/* Operating Hours */}
                <div className="mt-6">
                  <h4 className={cn(
                    'text-sm font-semibold mb-3 flex items-center gap-2',
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    <Clock className="w-4 h-4" />
                    Operating Hours
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(formData.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center justify-between">
                        <span className={cn(
                          'text-sm capitalize',
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          {day}
                        </span>
                        <input
                          type="text"
                          value={hours}
                          onChange={(e) => handleInputChange('operatingHours', {
                            ...formData.operatingHours,
                            [day]: e.target.value
                          })}
                          className={cn(
                            'w-32 px-3 py-2 rounded-lg border text-sm',
                            'focus:outline-none focus:ring-2 focus:ring-offset-0',
                            theme === 'dark'
                              ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                              : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                          )}
                          placeholder="e.g., 08:00-18:00"
                        />
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
        
      case 1: // Location & Contact
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
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
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={cn(
                        'text-sm font-semibold flex items-center gap-2',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        <MapPin className="w-4 h-4" />
                        Physical Address
                      </h4>
                      <button
                        type="button"
                        onClick={handleGeolocate}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          'flex items-center gap-2',
                          theme === 'dark'
                            ? 'text-cyan-400 hover:text-cyan-300 hover:bg-gray-800'
                            : 'text-blue-600 hover:text-blue-700 hover:bg-gray-200'
                        )}
                      >
                        <Search className="w-3.5 h-3.5" />
                        Auto-locate
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className={cn(
                          'block text-sm font-medium mb-2',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          Street Address *
                        </label>
                        <input
                          type="text"
                          value={formData.address.street}
                          onChange={(e) => handleNestedInputChange('address', 'street', e.target.value)}
                          required
                          placeholder="123 Healthcare Avenue"
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
                          City *
                        </label>
                        <input
                          type="text"
                          value={formData.address.city}
                          onChange={(e) => handleNestedInputChange('address', 'city', e.target.value)}
                          required
                          placeholder="New York"
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
                          State/Province *
                        </label>
                        <input
                          type="text"
                          value={formData.address.state}
                          onChange={(e) => handleNestedInputChange('address', 'state', e.target.value)}
                          required
                          placeholder="New York"
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
                          Country *
                        </label>
                        <input
                          type="text"
                          value={formData.address.country}
                          onChange={(e) => handleNestedInputChange('address', 'country', e.target.value)}
                          required
                          placeholder="United States"
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
                          Postal/ZIP Code *
                        </label>
                        <input
                          type="text"
                          value={formData.address.postalCode}
                          onChange={(e) => handleNestedInputChange('address', 'postalCode', e.target.value)}
                          required
                          placeholder="10001"
                          className={cn(
                            'w-full px-4 py-3 rounded-xl border text-sm',
                            'focus:outline-none focus:ring-2 focus:ring-offset-0',
                            theme === 'dark'
                              ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                              : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                          )}
                        />
                      </div>
                      
                      {/* Coordinates */}
                      <div className="grid grid-cols-2 gap-4 md:col-span-2">
                        <div>
                          <label className={cn(
                            'block text-sm font-medium mb-2',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            Latitude
                          </label>
                          <input
                            type="text"
                            value={formData.address.latitude}
                            onChange={(e) => handleNestedInputChange('address', 'latitude', e.target.value)}
                            placeholder="40.7128"
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
                            Longitude
                          </label>
                          <input
                            type="text"
                            value={formData.address.longitude}
                            onChange={(e) => handleNestedInputChange('address', 'longitude', e.target.value)}
                            placeholder="-74.0060"
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
                        <div className="flex items-center gap-2">
                          <Phone className={cn(
                            'w-5 h-5',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          )} />
                          <input
                            type="tel"
                            value={formData.contact.phone}
                            onChange={(e) => handleNestedInputChange('contact', 'phone', e.target.value)}
                            required
                            placeholder="+1 (555) 123-4567"
                            className={cn(
                              'flex-1 px-4 py-3 rounded-xl border text-sm',
                              'focus:outline-none focus:ring-2 focus:ring-offset-0',
                              theme === 'dark'
                                ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                                : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                            )}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={cn(
                          'block text-sm font-medium mb-2',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          Email Address *
                        </label>
                        <div className="flex items-center gap-2">
                          <Mail className={cn(
                            'w-5 h-5',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          )} />
                          <input
                            type="email"
                            value={formData.contact.email}
                            onChange={(e) => handleNestedInputChange('contact', 'email', e.target.value)}
                            required
                            placeholder="contact@facility.com"
                            className={cn(
                              'flex-1 px-4 py-3 rounded-xl border text-sm',
                              'focus:outline-none focus:ring-2 focus:ring-offset-0',
                              theme === 'dark'
                                ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                                : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                            )}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={cn(
                          'block text-sm font-medium mb-2',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          Emergency Contact *
                        </label>
                        <div className="flex items-center gap-2">
                          <AlertCircle className={cn(
                            'w-5 h-5',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          )} />
                          <input
                            type="tel"
                            value={formData.contact.emergencyContact}
                            onChange={(e) => handleNestedInputChange('contact', 'emergencyContact', e.target.value)}
                            required
                            placeholder="+1 (555) 987-6543"
                            className={cn(
                              'flex-1 px-4 py-3 rounded-xl border text-sm',
                              'focus:outline-none focus:ring-2 focus:ring-offset-0',
                              theme === 'dark'
                                ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                                : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                            )}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={cn(
                          'block text-sm font-medium mb-2',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          Fax Number
                        </label>
                        <input
                          type="tel"
                          value={formData.contact.fax}
                          onChange={(e) => handleNestedInputChange('contact', 'fax', e.target.value)}
                          placeholder="+1 (555) 123-4568"
                          className={cn(
                            'w-full px-4 py-3 rounded-xl border text-sm',
                            'focus:outline-none focus:ring-2 focus:ring-offset-0',
                            theme === 'dark'
                              ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                              : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                          )}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={cn(
                          'block text-sm font-medium mb-2',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          Website
                        </label>
                        <div className="flex items-center gap-2">
                          <Globe className={cn(
                            'w-5 h-5',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                          )} />
                          <input
                            type="url"
                            value={formData.contact.website}
                            onChange={(e) => handleNestedInputChange('contact', 'website', e.target.value)}
                            placeholder="https://www.facility.com"
                            className={cn(
                              'flex-1 px-4 py-3 rounded-xl border text-sm',
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
        
      case 2: // Document Verification
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className={cn(
                    'text-lg font-semibold mb-2',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    Document Verification
                  </h3>
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Verify your facility's operating license and registration
                  </p>
                </div>
                
                {/* License Verification */}
                <div className={cn(
                  'p-6 rounded-xl border',
                  theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                )}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className={cn(
                        'font-medium flex items-center gap-2 mb-1',
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                      )}>
                        <FileText className="w-4 h-4" />
                        Operating License
                      </h4>
                      <p className={cn(
                        'text-sm',
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
                            Your facility license has been validated with regulatory authorities.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Registration Verification */}
                <div className={cn(
                  'p-6 rounded-xl border',
                  theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                )}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className={cn(
                        'font-medium flex items-center gap-2 mb-1',
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                      )}>
                        <FileText className="w-4 h-4" />
                        Facility Registration
                      </h4>
                      <p className={cn(
                        'text-sm',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        {formData.registrationNumber || 'No registration number entered'}
                      </p>
                    </div>
                    
                    <div className={cn(
                      'px-3 py-1 rounded-lg text-sm font-medium',
                      formData.registrationVerified
                        ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                        : theme === 'dark' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                    )}>
                      {formData.registrationVerified ? 'Verified' : 'Pending'}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleVerifyRegistration}
                    disabled={!formData.registrationNumber || formData.registrationVerified}
                    className={cn(
                      'w-full py-3 rounded-xl text-sm font-medium transition-all',
                      'flex items-center justify-center gap-2',
                      'focus:outline-none focus:ring-2 focus:ring-offset-0',
                      theme === 'dark'
                        ? 'bg-cyan-600 text-white hover:bg-cyan-500 focus:ring-cyan-500'
                        : 'bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500',
                      (!formData.registrationNumber || formData.registrationVerified) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Shield className="w-4 h-4" />
                    {formData.registrationVerified ? 'Registration Verified' : 'Verify Registration Now'}
                  </button>
                  
                  {formData.registrationVerified && (
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
                            Registration Successfully Verified
                          </p>
                          <p className={cn(
                            'text-xs mt-1',
                            theme === 'dark' ? 'text-emerald-400/80' : 'text-emerald-600/80'
                          )}>
                            Your facility registration has been confirmed with health authorities.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Verification Notes */}
                <div className={cn(
                  'p-4 rounded-lg border',
                  theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                )}>
                  <label className="block">
                    <span className={cn(
                      'text-sm font-medium mb-2 block',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Verification Notes (Optional)
                    </span>
                    <textarea
                      value={formData.verificationNotes}
                      onChange={(e) => handleInputChange('verificationNotes', e.target.value)}
                      rows={3}
                      placeholder="Add any notes about the verification process or additional documentation..."
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                          : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                      )}
                    />
                  </label>
                </div>
                
                {/* Information */}
                <div className={cn(
                  'p-4 rounded-lg',
                  theme === 'dark' ? 'bg-gray-800/30 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                )}>
                  <h4 className={cn(
                    'text-sm font-semibold mb-2 flex items-center gap-2',
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    <AlertCircle className="w-4 h-4" />
                    Verification Requirements
                  </h4>
                  <ul className={cn(
                    'text-xs space-y-1.5',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    <li>• Both license and registration verification are required for facility registration</li>
                    <li>• Upon verification, your facility will be enrolled in the National Referral Network</li>
                    <li>• Verified facilities can accept patient referrals from other network members</li>
                    <li>• Verification information is securely validated with regulatory authorities</li>
                    <li>• The verification process typically takes 1-2 business days</li>
                  </ul>
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
        
      case 3: // Review & Confirm
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className={cn(
                    'text-lg font-semibold mb-2',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    Review & Confirm Registration
                  </h3>
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Review all information before final submission
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
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded',
                            theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-100 text-blue-700'
                          )}>
                            {formData.type}
                          </span>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded',
                            theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                          )}>
                            {formData.level} Care
                          </span>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded',
                            theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                          )}>
                            Est. {formData.establishmentYear}
                          </span>
                        </div>
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
                    {/* Facility Details */}
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
                        <div>
                          <p className={cn(
                            'text-xs',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                          )}>
                            Registration Number
                          </p>
                          <p className={cn(
                            'font-medium flex items-center gap-2',
                            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                          )}>
                            {formData.registrationNumber}
                            {formData.registrationVerified && (
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Location & Contact */}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <div>
                            <p className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              Website
                            </p>
                            <p className={cn(
                              'font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {formData.contact.website || 'Not provided'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Operating Hours */}
                    <div>
                      <h5 className={cn(
                        'text-sm font-semibold mb-3',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        Operating Hours
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(formData.operatingHours).map(([day, hours]) => (
                          <div key={day} className="flex flex-col">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {hours}
                            </span>
                          </div>
                        ))}
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
                          <Users className={cn(
                            'w-5 h-5',
                            theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                          )} />
                        </div>
                        <div className="flex-1">
                          <h6 className={cn(
                            'text-sm font-semibold',
                            theme === 'dark' ? 'text-cyan-300' : 'text-blue-700'
                          )}>
                            National Healthcare Network
                          </h6>
                          <p className={cn(
                            'text-xs mt-1',
                            theme === 'dark' ? 'text-cyan-400/80' : 'text-blue-600/80'
                          )}>
                            Your facility will be automatically enrolled in the national healthcare network upon registration.
                            This enables inter-facility patient referrals, resource sharing, and collaborative care.
                          </p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.enrollInNetwork}
                            onChange={(e) => handleInputChange('enrollInNetwork', e.target.checked)}
                            className="rounded"
                          />
                          <span className={cn(
                            'text-sm',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            Enroll
                          </span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Terms & Updates */}
                    <div className="space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.agreeToTerms}
                          onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                          className="mt-1"
                          required
                        />
                        <div>
                          <p className={cn(
                            'text-sm font-medium',
                            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                          )}>
                            I agree to the terms and conditions *
                          </p>
                          <p className={cn(
                            'text-xs mt-1',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            By submitting this form, I confirm that all information provided is accurate and I agree to the facility registration terms, privacy policy, and network participation agreement.
                          </p>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.receiveUpdates}
                          onChange={(e) => handleInputChange('receiveUpdates', e.target.checked)}
                          className="mt-1"
                        />
                        <div>
                          <p className={cn(
                            'text-sm font-medium',
                            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                          )}>
                            Receive updates and announcements
                          </p>
                          <p className={cn(
                            'text-xs mt-1',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            I would like to receive updates about network features, regulatory changes, and healthcare industry news.
                          </p>
                        </div>
                      </label>
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

export default FacilityRegistrationWizard;