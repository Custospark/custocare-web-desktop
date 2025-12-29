import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../../../app/store/store';
import {
  Stethoscope,
  Settings,
  Users,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  User,
  Shield,
  Key,
  Bell,
  CheckCircle,
  Plus,
  Trash2,
  Search,
  Calendar,
  Clock,
  Star,
  Award,
  GraduationCap
} from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import WizardStepper from './WizardStepper';
import { type StepConfig } from '../types/onboarding';
import { setOnboardingStep, saveDraft } from '../../../../app/store/slices/facilitySlice';

const StaffOnboardingWizard: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const { currentStep } = useSelector((state: RootState) => state.facility.onboarding);
  const { predefinedRoles, predefinedDepartments } = useSelector((state: RootState) => state.facility);
  
  const [staffData, setStaffData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      middleName: '',
      dateOfBirth: '',
      gender: '',
      nationality: '',
      identificationNumber: ''
    },
    contactInfo: {
      email: '',
      phone: '',
      emergencyContact: '',
      emergencyPhone: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: ''
      }
    },
    professionalInfo: {
      title: '',
      licenseNumber: '',
      licenseExpiry: '',
      qualifications: [''],
      specializations: [''],
      yearsOfExperience: 0
    },
    departmentAssignment: {
      primaryDepartmentId: '',
      secondaryDepartmentIds: [] as string[],
      supervisorId: '',
      startDate: '',
      workingHours: '09:00-17:00',
      scheduleType: 'Full-time'
    },
    roleAndPermissions: {
      roleId: '',
      customPermissions: [] as string[],
      accessLevel: 'Limited',
      canApprove: false,
      canAudit: false,
      canSupervise: false
    },
    credentials: {
      username: '',
      temporaryPassword: '',
      requirePasswordChange: true,
      emailCredentials: true,
      sendWelcomeEmail: true
    }
  });
  
  const steps: StepConfig[] = [
    { id: 0, title: 'Personal Information', description: 'Basic staff details', completed: false },
    { id: 1, title: 'Contact Details', description: 'Address and emergency contact', completed: false },
    { id: 2, title: 'Professional Details', description: 'Qualifications and experience', completed: false },
    { id: 3, title: 'Department Assignment', description: 'Assign to departments', completed: false },
    { id: 4, title: 'Role & Permissions', description: 'Set access controls', completed: false },
    { id: 5, title: 'Credentials', description: 'Generate login details', completed: false },
    { id: 6, title: 'Review & Notify', description: 'Finalize and notify', completed: false }
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
    dispatch(saveDraft(staffData));
    alert('Staff draft saved successfully!');
  }, [dispatch, staffData]);
  
  const handleSubmit = useCallback(() => {
    // Generate staff ID
    const staffId = `STAFF-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Create final staff object
    // const finalStaffData = {
    //   ...staffData,
    //   id: staffId,
    //   status: 'Pending',
    //   createdAt: new Date().toISOString()
    // };
    
    alert(`Staff ${staffData.personalInfo.firstName} ${staffData.personalInfo.lastName} onboarded successfully!\nStaff ID: ${staffId}`);
    
    // Dispatch action to create staff
    // dispatch(createStaff(finalStaffData));
  }, [staffData]);
  
  const handleInputChange = useCallback((section: keyof typeof staffData, field: string, value: any) => {
    setStaffData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  }, []);
  
  const handleNestedInputChange = useCallback((section: keyof typeof staffData, subSection: string, field: string, value: any) => {
    setStaffData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subSection]: {
          ...(prev[section] as any)[subSection],
          [field]: value
        }
      }
    }));
  }, []);
  
  const addQualification = useCallback(() => {
    const qualification = prompt('Enter qualification:');
    if (qualification) {
      setStaffData(prev => ({
        ...prev,
        professionalInfo: {
          ...prev.professionalInfo,
          qualifications: [...prev.professionalInfo.qualifications, qualification]
        }
      }));
    }
  }, []);
  
  const removeQualification = useCallback((index: number) => {
    setStaffData(prev => ({
      ...prev,
      professionalInfo: {
        ...prev.professionalInfo,
        qualifications: prev.professionalInfo.qualifications.filter((_, i) => i !== index)
      }
    }));
  }, []);
  
  const addSpecialization = useCallback(() => {
    const specialization = prompt('Enter specialization:');
    if (specialization) {
      setStaffData(prev => ({
        ...prev,
        professionalInfo: {
          ...prev.professionalInfo,
          specializations: [...prev.professionalInfo.specializations, specialization]
        }
      }));
    }
  }, []);
  
  const removeSpecialization = useCallback((index: number) => {
    setStaffData(prev => ({
      ...prev,
      professionalInfo: {
        ...prev.professionalInfo,
        specializations: prev.professionalInfo.specializations.filter((_, i) => i !== index)
      }
    }));
  }, []);
  
  const toggleSecondaryDepartment = useCallback((departmentId: string) => {
    setStaffData(prev => {
      const currentIds = prev.departmentAssignment.secondaryDepartmentIds;
      const newIds = currentIds.includes(departmentId)
        ? currentIds.filter(id => id !== departmentId)
        : [...currentIds, departmentId];
      
      return {
        ...prev,
        departmentAssignment: {
          ...prev.departmentAssignment,
          secondaryDepartmentIds: newIds
        }
      };
    });
  }, []);
  
  const generateUsername = useCallback(() => {
    const firstName = staffData.personalInfo.firstName.toLowerCase();
    const lastName = staffData.personalInfo.lastName.toLowerCase();
    const randomNum = Math.floor(Math.random() * 999);
    const username = `${firstName.charAt(0)}${lastName}${randomNum}`.substring(0, 15);
    
    setStaffData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        username
      }
    }));
  }, [staffData.personalInfo.firstName, staffData.personalInfo.lastName]);
  
  const generatePassword = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setStaffData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        temporaryPassword: password
      }
    }));
  }, []);
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Personal Information
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className={cn(
                    'text-lg font-semibold mb-2',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    Personal Information
                  </h3>
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Enter basic personal details for the new staff member
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={staffData.personalInfo.firstName}
                      onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                      required
                      placeholder="John"
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
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={staffData.personalInfo.lastName}
                      onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                      required
                      placeholder="Doe"
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
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={staffData.personalInfo.middleName}
                      onChange={(e) => handleInputChange('personalInfo', 'middleName', e.target.value)}
                      placeholder="Michael"
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
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={staffData.personalInfo.dateOfBirth}
                      onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                      required
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
                      Gender *
                    </label>
                    <select
                      value={staffData.personalInfo.gender}
                      onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                      required
                      className={cn(
                        'w-full px-4 py-3 rounded-xl border text-sm',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                          : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                      )}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Nationality *
                    </label>
                    <input
                      type="text"
                      value={staffData.personalInfo.nationality}
                      onChange={(e) => handleInputChange('personalInfo', 'nationality', e.target.value)}
                      required
                      placeholder="e.g., American"
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
                      National ID/Passport Number *
                    </label>
                    <input
                      type="text"
                      value={staffData.personalInfo.identificationNumber}
                      onChange={(e) => handleInputChange('personalInfo', 'identificationNumber', e.target.value)}
                      required
                      placeholder="e.g., A12345678"
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
        
      case 1: // Contact Details
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className={cn(
                    'text-lg font-semibold mb-2',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    Contact Information
                  </h3>
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Enter contact details and emergency contact information
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        value={staffData.contactInfo.email}
                        onChange={(e) => handleInputChange('contactInfo', 'email', e.target.value)}
                        required
                        placeholder="john.doe@facility.com"
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
                      Phone Number *
                    </label>
                    <div className="flex items-center gap-2">
                      <Phone className={cn(
                        'w-5 h-5',
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                      )} />
                      <input
                        type="tel"
                        value={staffData.contactInfo.phone}
                        onChange={(e) => handleInputChange('contactInfo', 'phone', e.target.value)}
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
                      Emergency Contact Name *
                    </label>
                    <input
                      type="text"
                      value={staffData.contactInfo.emergencyContact}
                      onChange={(e) => handleInputChange('contactInfo', 'emergencyContact', e.target.value)}
                      required
                      placeholder="Jane Doe"
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
                      Emergency Contact Phone *
                    </label>
                    <input
                      type="tel"
                      value={staffData.contactInfo.emergencyPhone}
                      onChange={(e) => handleInputChange('contactInfo', 'emergencyPhone', e.target.value)}
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
                
                {/* Address Section */}
                <div className="mt-6">
                  <h4 className={cn(
                    'text-sm font-semibold mb-3 flex items-center gap-2',
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    <MapPin className="w-4 h-4" />
                    Residential Address
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        value={staffData.contactInfo.address.street}
                        onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'street', e.target.value)}
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
                        value={staffData.contactInfo.address.city}
                        onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'city', e.target.value)}
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
                        value={staffData.contactInfo.address.state}
                        onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'state', e.target.value)}
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
                        value={staffData.contactInfo.address.country}
                        onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'country', e.target.value)}
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
                        value={staffData.contactInfo.address.postalCode}
                        onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'postalCode', e.target.value)}
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
        
      case 2: // Professional Details
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className={cn(
                    'text-lg font-semibold mb-2',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    Professional Information
                  </h3>
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Enter professional qualifications, licenses, and experience
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={cn(
                      'block text-sm font-medium mb-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      Professional Title *
                    </label>
                    <input
                      type="text"
                      value={staffData.professionalInfo.title}
                      onChange={(e) => handleInputChange('professionalInfo', 'title', e.target.value)}
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
                      value={staffData.professionalInfo.licenseNumber}
                      onChange={(e) => handleInputChange('professionalInfo', 'licenseNumber', e.target.value)}
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
                      License Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={staffData.professionalInfo.licenseExpiry}
                      onChange={(e) => handleInputChange('professionalInfo', 'licenseExpiry', e.target.value)}
                      required
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
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      value={staffData.professionalInfo.yearsOfExperience}
                      onChange={(e) => handleInputChange('professionalInfo', 'yearsOfExperience', parseInt(e.target.value) || 0)}
                      required
                      min="0"
                      max="50"
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
                
                {/* Qualifications */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={cn(
                      'text-sm font-semibold flex items-center gap-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      <GraduationCap className="w-4 h-4" />
                      Professional Qualifications
                    </h4>
                    <button
                      type="button"
                      onClick={addQualification}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        'flex items-center gap-2',
                        theme === 'dark'
                          ? 'text-cyan-400 hover:text-cyan-300 hover:bg-gray-800'
                          : 'text-blue-600 hover:text-blue-700 hover:bg-gray-200'
                      )}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Qualification
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {staffData.professionalInfo.qualifications.map((qualification, index) => (
                      <div
                        key={index}
                        className={cn(
                          'p-3 rounded-lg border',
                          'flex items-center justify-between',
                          theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Award className={cn(
                            'w-4 h-4',
                            theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                          )} />
                          <span className={cn(
                            'text-sm',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            {qualification}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQualification(index)}
                          className={cn(
                            'p-1 rounded transition-colors',
                            theme === 'dark'
                              ? 'text-gray-400 hover:text-red-400 hover:bg-gray-800'
                              : 'text-gray-500 hover:text-red-600 hover:bg-gray-200'
                          )}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {staffData.professionalInfo.qualifications.length === 0 && (
                      <div className={cn(
                        'p-4 rounded-lg border-2 border-dashed text-center',
                        theme === 'dark' ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-600'
                      )}>
                        <p className="text-sm">No qualifications added yet</p>
                        <p className="text-xs mt-1">Click "Add Qualification" to add professional qualifications</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Specializations */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={cn(
                      'text-sm font-semibold flex items-center gap-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      <Star className="w-4 h-4" />
                      Specializations
                    </h4>
                    <button
                      type="button"
                      onClick={addSpecialization}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        'flex items-center gap-2',
                        theme === 'dark'
                          ? 'text-cyan-400 hover:text-cyan-300 hover:bg-gray-800'
                          : 'text-blue-600 hover:text-blue-700 hover:bg-gray-200'
                      )}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Specialization
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {staffData.professionalInfo.specializations.map((specialization, index) => (
                      <div
                        key={index}
                        className={cn(
                          'px-3 py-2 rounded-lg flex items-center gap-2',
                          theme === 'dark' ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-300'
                        )}
                      >
                        <span className={cn(
                          'text-sm',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          {specialization}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSpecialization(index)}
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
                    
                    {staffData.professionalInfo.specializations.length === 0 && (
                      <div className={cn(
                        'w-full p-4 rounded-lg border-2 border-dashed text-center',
                        theme === 'dark' ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-600'
                      )}>
                        <p className="text-sm">No specializations added yet</p>
                        <p className="text-xs mt-1">Click "Add Specialization" to add areas of specialization</p>
                      </div>
                    )}
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
        
      case 3: // Department Assignment
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className={cn(
                    'text-lg font-semibold mb-2',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    Department Assignment
                  </h3>
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Assign staff to primary and secondary departments
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Primary Department */}
                  <div className={cn(
                    'p-5 rounded-xl border',
                    theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                  )}>
                    <h4 className={cn(
                      'font-medium mb-4 flex items-center gap-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      <Briefcase className="w-4 h-4" />
                      Primary Department *
                    </h4>
                    
                    <div className="space-y-3">
                      {predefinedDepartments.map((dept) => (
                        <label
                          key={dept.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                            staffData.departmentAssignment.primaryDepartmentId === dept.id
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
                            name="primaryDepartment"
                            value={dept.id}
                            checked={staffData.departmentAssignment.primaryDepartmentId === dept.id}
                            onChange={(e) => handleInputChange('departmentAssignment', 'primaryDepartmentId', e.target.value)}
                            className="text-cyan-500"
                          />
                          <div>
                            <span className={cn(
                              'font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {dept.name}
                            </span>
                            <p className={cn(
                              'text-xs mt-1',
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              {dept.category}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Secondary Departments & Schedule */}
                  <div className="space-y-4">
                    <div className={cn(
                      'p-5 rounded-xl border',
                      theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                    )}>
                      <h4 className={cn(
                        'font-medium mb-4 flex items-center gap-2',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        <Users className="w-4 h-4" />
                        Secondary Departments
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {predefinedDepartments.map((dept) => (
                          <label
                            key={dept.id}
                            className={cn(
                              'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all',
                              staffData.departmentAssignment.secondaryDepartmentIds.includes(dept.id)
                                ? theme === 'dark'
                                  ? 'border-cyan-500 bg-cyan-500/10'
                                  : 'border-blue-500 bg-blue-50'
                                : theme === 'dark'
                                  ? 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                                  : 'border-gray-300 bg-white hover:border-gray-400'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={staffData.departmentAssignment.secondaryDepartmentIds.includes(dept.id)}
                              onChange={() => toggleSecondaryDepartment(dept.id)}
                              className="rounded"
                            />
                            <span className={cn(
                              'text-sm',
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            )}>
                              {dept.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* Schedule Information */}
                    <div className={cn(
                      'p-5 rounded-xl border',
                      theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                    )}>
                      <h4 className={cn(
                        'font-medium mb-4 flex items-center gap-2',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        <Calendar className="w-4 h-4" />
                        Schedule Information
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={cn(
                            'block text-sm font-medium mb-2',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            Start Date *
                          </label>
                          <input
                            type="date"
                            value={staffData.departmentAssignment.startDate}
                            onChange={(e) => handleInputChange('departmentAssignment', 'startDate', e.target.value)}
                            required
                            className={cn(
                              'w-full px-3 py-2 rounded-lg border text-sm',
                              'focus:outline-none focus:ring-2 focus:ring-offset-0',
                              theme === 'dark'
                                ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                                : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                            )}
                          />
                        </div>
                        
                        <div>
                          <label className={cn(
                            'block text-sm font-medium mb-2',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            Schedule Type *
                          </label>
                          <select
                            value={staffData.departmentAssignment.scheduleType}
                            onChange={(e) => handleInputChange('departmentAssignment', 'scheduleType', e.target.value)}
                            className={cn(
                              'w-full px-3 py-2 rounded-lg border text-sm',
                              'focus:outline-none focus:ring-2 focus:ring-offset-0',
                              theme === 'dark'
                                ? 'bg-gray-900 border-gray-800 text-gray-300 focus:ring-cyan-500'
                                : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                            )}
                          >
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Shift-based">Shift-based</option>
                            <option value="Contract">Contract</option>
                            <option value="On-call">On-call</option>
                          </select>
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className={cn(
                            'block text-sm font-medium mb-2',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            Working Hours *
                          </label>
                          <div className="flex items-center gap-2">
                            <Clock className={cn(
                              'w-4 h-4',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            )} />
                            <input
                              type="text"
                              value={staffData.departmentAssignment.workingHours}
                              onChange={(e) => handleInputChange('departmentAssignment', 'workingHours', e.target.value)}
                              required
                              placeholder="e.g., 09:00-17:00"
                              className={cn(
                                'flex-1 px-3 py-2 rounded-lg border text-sm',
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
        
      case 4: // Role & Permissions
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
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
                    Assign roles and customize permissions from predefined roles
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {predefinedRoles.map((role) => (
                    <div
                      key={role.id}
                      className={cn(
                        'p-4 rounded-xl border cursor-pointer transition-all',
                        'flex flex-col gap-2',
                        staffData.roleAndPermissions.roleId === role.id
                          ? theme === 'dark'
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-blue-500 bg-blue-50'
                          : theme === 'dark'
                            ? 'border-gray-800 bg-gray-800/30 hover:border-cyan-500 hover:bg-cyan-500/10'
                            : 'border-gray-200 bg-gray-50 hover:border-blue-500 hover:bg-blue-50'
                      )}
                      onClick={() => handleInputChange('roleAndPermissions', 'roleId', role.id)}
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
                      
                      {staffData.roleAndPermissions.roleId === role.id && (
                        <div className="mt-3 pt-3 border-t border-gray-700/30">
                          <div className="flex items-center justify-center">
                            <CheckCircle className={cn(
                              'w-5 h-5',
                              theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                            )} />
                            <span className={cn(
                              'text-xs font-medium ml-2',
                              theme === 'dark' ? 'text-cyan-300' : 'text-blue-700'
                            )}>
                              Selected
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Custom Permission Overrides */}
                {staffData.roleAndPermissions.roleId && (
                  <div className={cn(
                    'p-5 rounded-xl border',
                    theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                  )}>
                    <h4 className={cn(
                      'font-medium mb-4 flex items-center gap-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      <Shield className="w-4 h-4" />
                      Custom Permission Overrides
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffData.roleAndPermissions.canApprove}
                          onChange={(e) => handleInputChange('roleAndPermissions', 'canApprove', e.target.checked)}
                          className="rounded"
                        />
                        <div>
                          <span className={cn(
                            'text-sm font-medium',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            Can approve requests
                          </span>
                          <p className={cn(
                            'text-xs mt-1',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            Allow approving patient discharge, medication, etc.
                          </p>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffData.roleAndPermissions.canAudit}
                          onChange={(e) => handleInputChange('roleAndPermissions', 'canAudit', e.target.checked)}
                          className="rounded"
                        />
                        <div>
                          <span className={cn(
                            'text-sm font-medium',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            Can audit records
                          </span>
                          <p className={cn(
                            'text-xs mt-1',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            Allow viewing and auditing patient records
                          </p>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffData.roleAndPermissions.canSupervise}
                          onChange={(e) => handleInputChange('roleAndPermissions', 'canSupervise', e.target.checked)}
                          className="rounded"
                        />
                        <div>
                          <span className={cn(
                            'text-sm font-medium',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            Can supervise staff
                          </span>
                          <p className={cn(
                            'text-xs mt-1',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            Allow supervising other staff members
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
                
                <div className={cn(
                  'p-4 rounded-lg',
                  theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50'
                )}>
                  <h4 className={cn(
                    'text-sm font-semibold mb-2 flex items-center gap-2',
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    <Shield className="w-4 h-4" />
                    Security Note
                  </h4>
                  <p className={cn(
                    'text-xs',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    After selecting a role, you can customize individual permissions to match specific needs.
                    All permissions are logged for audit purposes.
                  </p>
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
        
      case 5: // Credentials
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className={cn(
                    'text-lg font-semibold mb-2',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    System Credentials
                  </h3>
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Generate login credentials and configure access settings
                  </p>
                </div>
                
                <div className={cn(
                  'p-6 rounded-xl border',
                  theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
                )}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Username Generation */}
                    <div>
                      <h4 className={cn(
                        'font-medium mb-4 flex items-center gap-2',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        <User className="w-4 h-4" />
                        Username
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={staffData.credentials.username}
                            onChange={(e) => handleInputChange('credentials', 'username', e.target.value)}
                            placeholder="e.g., jdoe123"
                            className={cn(
                              'flex-1 px-4 py-2.5 rounded-lg border text-sm',
                              'focus:outline-none focus:ring-2 focus:ring-offset-0',
                              theme === 'dark'
                                ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
                                : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
                            )}
                          />
                          <button
                            type="button"
                            onClick={generateUsername}
                            className={cn(
                              'px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                              'flex items-center gap-2',
                              theme === 'dark'
                                ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                                : 'bg-blue-600 text-white hover:bg-blue-500'
                            )}
                          >
                            <Search className="w-4 h-4" />
                            Generate
                          </button>
                        </div>
                        <p className={cn(
                          'text-xs',
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        )}>
                          Username must be unique. Click Generate to auto-create.
                        </p>
                      </div>
                    </div>
                    
                    {/* Password Generation */}
                    <div>
                      <h4 className={cn(
                        'font-medium mb-4 flex items-center gap-2',
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      )}>
                        <Key className="w-4 h-4" />
                        Temporary Password
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={staffData.credentials.temporaryPassword}
                            onChange={(e) => handleInputChange('credentials', 'temporaryPassword', e.target.value)}
                            readOnly
                            className={cn(
                              'flex-1 px-4 py-2.5 rounded-lg border text-sm font-mono',
                              theme === 'dark'
                                ? 'bg-gray-900 border-gray-800 text-gray-300'
                                : 'bg-white border-gray-300 text-gray-700'
                            )}
                          />
                          <button
                            type="button"
                            onClick={generatePassword}
                            className={cn(
                              'px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                              'flex items-center gap-2',
                              theme === 'dark'
                                ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                                : 'bg-blue-600 text-white hover:bg-blue-500'
                            )}
                          >
                            <Key className="w-4 h-4" />
                            Generate
                          </button>
                        </div>
                        <p className={cn(
                          'text-xs',
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        )}>
                          Secure password will be generated. Staff must change on first login.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Credential Settings */}
                  <div className="mt-6">
                    <h4 className={cn(
                      'font-medium mb-4 flex items-center gap-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      <Settings className="w-4 h-4" />
                      Credential Settings
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffData.credentials.requirePasswordChange}
                          onChange={(e) => handleInputChange('credentials', 'requirePasswordChange', e.target.checked)}
                          className="rounded"
                        />
                        <div>
                          <span className={cn(
                            'text-sm font-medium',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            Require password change on first login
                          </span>
                          <p className={cn(
                            'text-xs mt-1',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            Enhances security by forcing password reset
                          </p>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffData.credentials.emailCredentials}
                          onChange={(e) => handleInputChange('credentials', 'emailCredentials', e.target.checked)}
                          className="rounded"
                        />
                        <div>
                          <span className={cn(
                            'text-sm font-medium',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            Email credentials to staff
                          </span>
                          <p className={cn(
                            'text-xs mt-1',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            Send login details via email
                          </p>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffData.credentials.sendWelcomeEmail}
                          onChange={(e) => handleInputChange('credentials', 'sendWelcomeEmail', e.target.checked)}
                          className="rounded"
                        />
                        <div>
                          <span className={cn(
                            'text-sm font-medium',
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            Send welcome email
                          </span>
                          <p className={cn(
                            'text-xs mt-1',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            Include facility information and onboarding guide
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Security Reminder */}
                <div className={cn(
                  'p-4 rounded-lg',
                  theme === 'dark' ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-blue-50 border border-blue-200'
                )}>
                  <div className="flex items-start gap-3">
                    <Shield className={cn(
                      'w-5 h-5 mt-0.5 flex-shrink-0',
                      theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                    )} />
                    <div>
                      <h5 className={cn(
                        'text-sm font-semibold',
                        theme === 'dark' ? 'text-cyan-300' : 'text-blue-700'
                      )}>
                        Security Best Practices
                      </h5>
                      <ul className={cn(
                        'text-xs space-y-1 mt-2',
                        theme === 'dark' ? 'text-cyan-400/80' : 'text-blue-600/80'
                      )}>
                        <li>• Always generate strong, random passwords</li>
                        <li>• Require password change on first login</li>
                        <li>• Never share credentials via unsecured channels</li>
                        <li>• Monitor login activity for new accounts</li>
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
        
      case 6: // Review & Notify
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className={cn(
                    'text-lg font-semibold mb-2',
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  )}>
                    Review & Complete Onboarding
                  </h3>
                  <p className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Review all information and complete staff onboarding
                  </p>
                </div>
                
                {/* Staff Summary Card */}
                <div className={cn(
                  'rounded-xl border overflow-hidden',
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                )}>
                  {/* Header */}
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
                          {staffData.personalInfo.firstName} {staffData.personalInfo.lastName}
                        </h4>
                        <p className={cn(
                          'text-sm mt-1',
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          Staff Onboarding Summary
                        </p>
                      </div>
                      <div className={cn(
                        'px-3 py-1 rounded-lg text-sm font-bold',
                        theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                      )}>
                        Ready to Onboard
                      </div>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="p-6 space-y-6">
                    {/* Personal & Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className={cn(
                          'text-sm font-semibold mb-3 flex items-center gap-2',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          <User className="w-4 h-4" />
                          Personal Information
                        </h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              Full Name
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {staffData.personalInfo.firstName} {staffData.personalInfo.middleName} {staffData.personalInfo.lastName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              Date of Birth
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {staffData.personalInfo.dateOfBirth || 'Not specified'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              Gender
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {staffData.personalInfo.gender || 'Not specified'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className={cn(
                          'text-sm font-semibold mb-3 flex items-center gap-2',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          <Phone className="w-4 h-4" />
                          Contact Information
                        </h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              Email
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {staffData.contactInfo.email}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              Phone
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {staffData.contactInfo.phone}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              Emergency Contact
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {staffData.contactInfo.emergencyContact}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Professional & Department Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className={cn(
                          'text-sm font-semibold mb-3 flex items-center gap-2',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          <Briefcase className="w-4 h-4" />
                          Professional Details
                        </h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              Title
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {staffData.professionalInfo.title}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              License Number
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {staffData.professionalInfo.licenseNumber}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              Experience
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {staffData.professionalInfo.yearsOfExperience} years
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className={cn(
                          'text-sm font-semibold mb-3 flex items-center gap-2',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          <Users className="w-4 h-4" />
                          Department Assignment
                        </h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              Primary Department
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {predefinedDepartments.find(d => d.id === staffData.departmentAssignment.primaryDepartmentId)?.name || 'Not assigned'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              Schedule Type
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {staffData.departmentAssignment.scheduleType}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              Start Date
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {staffData.departmentAssignment.startDate || 'Not specified'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Role & Credentials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className={cn(
                          'text-sm font-semibold mb-3 flex items-center gap-2',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          <Shield className="w-4 h-4" />
                          Role & Permissions
                        </h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              Assigned Role
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {predefinedRoles.find(r => r.id === staffData.roleAndPermissions.roleId)?.name || 'Not assigned'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              Access Level
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {staffData.roleAndPermissions.accessLevel}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className={cn(
                          'text-sm font-semibold mb-3 flex items-center gap-2',
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        )}>
                          <Key className="w-4 h-4" />
                          System Credentials
                        </h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              Username
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                            )}>
                              {staffData.credentials.username || 'Not generated'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={cn(
                              'text-xs',
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                            )}>
                              Password Change Required
                            </span>
                            <span className={cn(
                              'text-sm font-medium',
                              staffData.credentials.requirePasswordChange
                                ? theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                                : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            )}>
                              {staffData.credentials.requirePasswordChange ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Notification Settings */}
                    <div className={cn(
                      'p-4 rounded-lg',
                      theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
                    )}>
                      <div className="flex items-start gap-3">
                        <Bell className={cn(
                          'w-5 h-5 mt-0.5 flex-shrink-0',
                          theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        )} />
                        <div>
                          <h6 className={cn(
                            'text-sm font-semibold',
                            theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                          )}>
                            Notification Settings
                          </h6>
                          <div className="flex flex-wrap gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className={cn(
                                'w-4 h-4',
                                staffData.credentials.emailCredentials
                                  ? theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                                  : theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                              )} />
                              <span className={cn(
                                'text-xs',
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              )}>
                                Email credentials
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className={cn(
                                'w-4 h-4',
                                staffData.credentials.sendWelcomeEmail
                                  ? theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                                  : theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                              )} />
                              <span className={cn(
                                'text-xs',
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              )}>
                                Welcome email
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Final Confirmation */}
                    <div className="pt-4 border-t border-gray-700/30">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          required
                          className="mt-1"
                        />
                        <div>
                          <p className={cn(
                            'text-sm font-medium',
                            theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                          )}>
                            I confirm all information is accurate
                          </p>
                          <p className={cn(
                            'text-xs mt-1',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            By submitting, I confirm that all provided information is accurate and I authorize the creation of this staff account.
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

export default StaffOnboardingWizard;