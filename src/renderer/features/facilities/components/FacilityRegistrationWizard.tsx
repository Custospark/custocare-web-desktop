// import React, { useState, useCallback } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import type { RootState } from '../../store/index';
// import {
//   Building2,
//   MapPin,
//   Phone,
//   Shield,
//   CheckCircle,
//   AlertCircle,
//   Stethoscope,
//   Pill,
//   Microscope,
//   Building,

// } from 'lucide-react';
// import { cn } from '../../../utils/classNameUtils';
// import {
//   setOnboardingStep,
//   saveDraft,
//   clearDraft,
//   createFacility,
//   verifyLicense
// } from '../../../store/slices/facilitySlice';
// import WizardStepper from './WizardStepper';
// import { StepConfig } from '../types/onboarding';

// const FACILITY_TYPES = [
//   { value: 'Hospital', label: 'Hospital', icon: <Building2 className="w-4 h-4" /> },
//   { value: 'Clinic', label: 'Clinic', icon: <Stethoscope className="w-4 h-4" /> },
//   { value: 'Pharmacy', label: 'Pharmacy', icon: <Pill className="w-4 h-4" /> },
//   { value: 'Lab', label: 'Laboratory', icon: <Microscope className="w-4 h-4" /> },
//   { value: 'Other', label: 'Other Facility', icon: <Building className="w-4 h-4" /> },
// ];

// const FacilityRegistrationWizard: React.FC = () => {
//   const dispatch = useDispatch();
//   const theme = useSelector((state: RootState) => state.ui.theme);
//   const { currentStep } = useSelector((state: RootState) => state.facility.onboarding);
  
//   const [formData, setFormData] = useState({
//     // Step 1: Facility Details
//     name: '',
//     type: 'Hospital',
//     licenseNumber: '',
    
//     // Step 2: Location & Contact
//     address: {
//       street: '',
//       city: '',
//       state: '',
//       country: '',
//       postalCode: ''
//     },
//     contact: {
//       phone: '',
//       email: '',
//       emergencyContact: ''
//     },
    
//     // Step 3: Verification
//     licenseVerified: false,
    
//     // Step 4: Review
//     agreeToTerms: false
//   });
  
//   const steps: StepConfig[] = [
//     { id: 0, title: 'Facility Details', description: 'Basic facility information', completed: false },
//     { id: 1, title: 'Location & Contact', description: 'Address and contact information', completed: false },
//     { id: 2, title: 'License Verification', description: 'Validate facility license', completed: false },
//     { id: 3, title: 'Review & Confirm', description: 'Final review and submission', completed: false }
//   ];
  
//   const handleInputChange = useCallback((field: string, value: unknown) => {
//     setFormData(prev => ({
//       ...prev,
//       [field]: value
//     }));
    
//     // Auto-save to draft
//     dispatch(saveDraft({ [field]: value }));
//   }, [dispatch]);
  
//   const handleNext = useCallback(() => {
//     if (currentStep < steps.length - 1) {
//       dispatch(setOnboardingStep(currentStep + 1));
//     }
//   }, [currentStep, dispatch, steps.length]);
  
//   const handleBack = useCallback(() => {
//     if (currentStep > 0) {
//       dispatch(setOnboardingStep(currentStep - 1));
//     }
//   }, [currentStep, dispatch]);
  
//   const handleSaveDraft = useCallback(() => {
//     dispatch(saveDraft(formData));
//     alert('Draft saved successfully!');
//   }, [dispatch, formData]);
  
//   const handleSubmit = useCallback(async () => {
//     try {
//       await dispatch(createFacility(formData)).unwrap();
//       alert('Facility registered successfully!');
//       dispatch(clearDraft());
//     } catch (error) {
//       alert('Failed to register facility. Please try again.');
//     }
//   }, [dispatch, formData]);
  
//   const handleVerifyLicense = useCallback(async () => {
//     if (!formData.licenseNumber) {
//       alert('Please enter a license number');
//       return;
//     }
    
//     try {
//       await dispatch(verifyLicense(formData.licenseNumber)).unwrap();
//       setFormData(prev => ({ ...prev, licenseVerified: true }));
//     } catch (error) {
//       alert('License verification failed');
//     }
//   }, [dispatch, formData.licenseNumber]);
  
//   const renderStepContent = () => {
//     switch (currentStep) {
//       case 0: // Facility Details
//         return (
//           <div className="space-y-6">
//             <div>
//               <h3 className={cn(
//                 'text-lg font-semibold mb-2',
//                 theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
//               )}>
//                 Facility Information
//               </h3>
//               <p className={cn(
//                 'text-sm',
//                 theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
//               )}>
//                 Enter basic details about your healthcare facility
//               </p>
//             </div>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="md:col-span-2">
//                 <label className={cn(
//                   'block text-sm font-medium mb-2',
//                   theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
//                 )}>
//                   Facility Name *
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.name}
//                   onChange={(e) => handleInputChange('name', e.target.value)}
//                   required
//                   placeholder="e.g., Metropolitan General Hospital"
//                   className={cn(
//                     'w-full px-4 py-3 rounded-xl border text-sm',
//                     'focus:outline-none focus:ring-2 focus:ring-offset-0',
//                     theme === 'dark'
//                       ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
//                       : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
//                   )}
//                 />
//               </div>
              
//               <div>
//                 <label className={cn(
//                   'block text-sm font-medium mb-2',
//                   theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
//                 )}>
//                   Facility Type *
//                 </label>
//                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//                   {FACILITY_TYPES.map((type) => (
//                     <button
//                       key={type.value}
//                       type="button"
//                       onClick={() => handleInputChange('type', type.value)}
//                       className={cn(
//                         'p-4 rounded-xl border transition-all',
//                         'flex flex-col items-center gap-2',
//                         formData.type === type.value
//                           ? theme === 'dark'
//                             ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
//                             : 'border-blue-500 bg-blue-50 text-blue-700'
//                           : theme === 'dark'
//                             ? 'border-gray-800 bg-gray-800/30 text-gray-400 hover:border-gray-700 hover:bg-gray-800/50'
//                             : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
//                       )}
//                     >
//                       {type.icon}
//                       <span className="text-xs font-medium">{type.label}</span>
//                     </button>
//                   ))}
//                 </div>
//               </div>
              
//               <div>
//                 <label className={cn(
//                   'block text-sm font-medium mb-2',
//                   theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
//                 )}>
//                   License Number *
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.licenseNumber}
//                   onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
//                   required
//                   placeholder="e.g., HSP-2024-00123"
//                   className={cn(
//                     'w-full px-4 py-3 rounded-xl border text-sm',
//                     'focus:outline-none focus:ring-2 focus:ring-offset-0',
//                     theme === 'dark'
//                       ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
//                       : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
//                   )}
//                 />
//                 <p className={cn(
//                   'text-xs mt-2',
//                   theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
//                 )}>
//                   This will be verified in the next step
//                 </p>
//               </div>
//             </div>
//           </div>
//         );
        
//       case 1: // Location & Contact
//         return (
//           <div className="space-y-6">
//             <div>
//               <h3 className={cn(
//                 'text-lg font-semibold mb-2',
//                 theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
//               )}>
//                 Location & Contact Information
//               </h3>
//               <p className={cn(
//                 'text-sm',
//                 theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
//               )}>
//                 Enter your facility's physical address and contact details
//               </p>
//             </div>
            
//             <div className="space-y-6">
//               {/* Address Section */}
//               <div>
//                 <h4 className={cn(
//                   'text-sm font-semibold mb-3 flex items-center gap-2',
//                   theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
//                 )}>
//                   <MapPin className="w-4 h-4" />
//                   Physical Address
//                 </h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="md:col-span-2">
//                     <input
//                       type="text"
//                       value={formData.address.street}
//                       onChange={(e) => handleInputChange('address', { ...formData.address, street: e.target.value })}
//                       required
//                       placeholder="Street address"
//                       className={cn(
//                         'w-full px-4 py-3 rounded-xl border text-sm',
//                         'focus:outline-none focus:ring-2 focus:ring-offset-0',
//                         theme === 'dark'
//                           ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
//                           : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
//                       )}
//                     />
//                   </div>
//                   <div>
//                     <input
//                       type="text"
//                       value={formData.address.city}
//                       onChange={(e) => handleInputChange('address', { ...formData.address, city: e.target.value })}
//                       required
//                       placeholder="City"
//                       className={cn(
//                         'w-full px-4 py-3 rounded-xl border text-sm',
//                         'focus:outline-none focus:ring-2 focus:ring-offset-0',
//                         theme === 'dark'
//                           ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
//                           : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
//                       )}
//                     />
//                   </div>
//                   <div>
//                     <input
//                       type="text"
//                       value={formData.address.state}
//                       onChange={(e) => handleInputChange('address', { ...formData.address, state: e.target.value })}
//                       required
//                       placeholder="State/Province"
//                       className={cn(
//                         'w-full px-4 py-3 rounded-xl border text-sm',
//                         'focus:outline-none focus:ring-2 focus:ring-offset-0',
//                         theme === 'dark'
//                           ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
//                           : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
//                       )}
//                     />
//                   </div>
//                   <div>
//                     <input
//                       type="text"
//                       value={formData.address.country}
//                       onChange={(e) => handleInputChange('address', { ...formData.address, country: e.target.value })}
//                       required
//                       placeholder="Country"
//                       className={cn(
//                         'w-full px-4 py-3 rounded-xl border text-sm',
//                         'focus:outline-none focus:ring-2 focus:ring-offset-0',
//                         theme === 'dark'
//                           ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
//                           : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
//                       )}
//                     />
//                   </div>
//                   <div>
//                     <input
//                       type="text"
//                       value={formData.address.postalCode}
//                       onChange={(e) => handleInputChange('address', { ...formData.address, postalCode: e.target.value })}
//                       required
//                       placeholder="Postal/ZIP Code"
//                       className={cn(
//                         'w-full px-4 py-3 rounded-xl border text-sm',
//                         'focus:outline-none focus:ring-2 focus:ring-offset-0',
//                         theme === 'dark'
//                           ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
//                           : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
//                       )}
//                     />
//                   </div>
//                 </div>
//               </div>
              
//               {/* Contact Section */}
//               <div>
//                 <h4 className={cn(
//                   'text-sm font-semibold mb-3 flex items-center gap-2',
//                   theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
//                 )}>
//                   <Phone className="w-4 h-4" />
//                   Contact Information
//                 </h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className={cn(
//                       'block text-sm font-medium mb-2',
//                       theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
//                     )}>
//                       Primary Phone *
//                     </label>
//                     <input
//                       type="tel"
//                       value={formData.contact.phone}
//                       onChange={(e) => handleInputChange('contact', { ...formData.contact, phone: e.target.value })}
//                       required
//                       placeholder="+1 (555) 123-4567"
//                       className={cn(
//                         'w-full px-4 py-3 rounded-xl border text-sm',
//                         'focus:outline-none focus:ring-2 focus:ring-offset-0',
//                         theme === 'dark'
//                           ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
//                           : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
//                       )}
//                     />
//                   </div>
//                   <div>
//                     <label className={cn(
//                       'block text-sm font-medium mb-2',
//                       theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
//                     )}>
//                       Email Address *
//                     </label>
//                     <input
//                       type="email"
//                       value={formData.contact.email}
//                       onChange={(e) => handleInputChange('contact', { ...formData.contact, email: e.target.value })}
//                       required
//                       placeholder="contact@facility.com"
//                       className={cn(
//                         'w-full px-4 py-3 rounded-xl border text-sm',
//                         'focus:outline-none focus:ring-2 focus:ring-offset-0',
//                         theme === 'dark'
//                           ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
//                           : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
//                       )}
//                     />
//                   </div>
//                   <div>
//                     <label className={cn(
//                       'block text-sm font-medium mb-2',
//                       theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
//                     )}>
//                       Emergency Contact *
//                     </label>
//                     <input
//                       type="tel"
//                       value={formData.contact.emergencyContact}
//                       onChange={(e) => handleInputChange('contact', { ...formData.contact, emergencyContact: e.target.value })}
//                       required
//                       placeholder="+1 (555) 987-6543"
//                       className={cn(
//                         'w-full px-4 py-3 rounded-xl border text-sm',
//                         'focus:outline-none focus:ring-2 focus:ring-offset-0',
//                         theme === 'dark'
//                           ? 'bg-gray-900 border-gray-800 text-gray-300 placeholder-gray-500 focus:ring-cyan-500'
//                           : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-blue-500'
//                       )}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );
        
//       case 2: // License Verification
//         return (
//           <div className="space-y-6">
//             <div>
//               <h3 className={cn(
//                 'text-lg font-semibold mb-2',
//                 theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
//               )}>
//                 License Verification
//               </h3>
//               <p className={cn(
//                 'text-sm',
//                 theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
//               )}>
//                 Verify your facility's operating license
//               </p>
//             </div>
            
//             <div className={cn(
//               'p-6 rounded-xl border',
//               theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
//             )}>
//               <div className="flex items-center justify-between mb-6">
//                 <div>
//                   <h4 className={cn(
//                     'font-medium',
//                     theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
//                   )}>
//                     License Details
//                   </h4>
//                   <p className={cn(
//                     'text-sm mt-1',
//                     theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
//                   )}>
//                     {formData.licenseNumber || 'No license number entered'}
//                   </p>
//                 </div>
                
//                 <div className={cn(
//                   'px-3 py-1 rounded-lg text-sm font-medium',
//                   formData.licenseVerified
//                     ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
//                     : theme === 'dark' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
//                 )}>
//                   {formData.licenseVerified ? 'Verified' : 'Pending'}
//                 </div>
//               </div>
              
//               <button
//                 type="button"
//                 onClick={handleVerifyLicense}
//                 disabled={!formData.licenseNumber || formData.licenseVerified}
//                 className={cn(
//                   'w-full py-3 rounded-xl text-sm font-medium transition-all',
//                   'flex items-center justify-center gap-2',
//                   'focus:outline-none focus:ring-2 focus:ring-offset-0',
//                   theme === 'dark'
//                     ? 'bg-cyan-600 text-white hover:bg-cyan-500 focus:ring-cyan-500'
//                     : 'bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500',
//                   (!formData.licenseNumber || formData.licenseVerified) && 'opacity-50 cursor-not-allowed'
//                 )}
//               >
//                 <Shield className="w-4 h-4" />
//                 {formData.licenseVerified ? 'License Verified' : 'Verify License Now'}
//               </button>
              
//               {formData.licenseVerified && (
//                 <div className={cn(
//                   'mt-6 p-4 rounded-lg',
//                   theme === 'dark' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
//                 )}>
//                   <div className="flex items-center gap-3">
//                     <CheckCircle className={cn(
//                       'w-5 h-5 flex-shrink-0',
//                       theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
//                     )} />
//                     <div>
//                       <p className={cn(
//                         'text-sm font-medium',
//                         theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'
//                       )}>
//                         License Successfully Verified
//                       </p>
//                       <p className={cn(
//                         'text-xs mt-1',
//                         theme === 'dark' ? 'text-emerald-400/80' : 'text-emerald-600/80'
//                       )}>
//                         Your facility license has been validated. You may proceed to the next step.
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
            
//             <div className={cn(
//               'p-4 rounded-lg',
//               theme === 'dark' ? 'bg-gray-800/30 border border-gray-700' : 'bg-gray-50 border border-gray-200'
//             )}>
//               <h4 className={cn(
//                 'text-sm font-semibold mb-2 flex items-center gap-2',
//                 theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
//               )}>
//                 <AlertCircle className="w-4 h-4" />
//                 Important Information
//               </h4>
//               <ul className={cn(
//                 'text-xs space-y-1.5',
//                 theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
//               )}>
//                 <li>• License verification is required for facility registration</li>
//                 <li>• Upon verification, your facility will be enrolled in the National Referral Network</li>
//                 <li>• Verified facilities can accept patient referrals from other network members</li>
//                 <li>• License information is securely validated with regulatory authorities</li>
//               </ul>
//             </div>
//           </div>
//         );
        
//       case 3: // Review & Confirm
//         return (
//           <div className="space-y-6">
//             <div>
//               <h3 className={cn(
//                 'text-lg font-semibold mb-2',
//                 theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
//               )}>
//                 Review & Confirm
//               </h3>
//               <p className={cn(
//                 'text-sm',
//                 theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
//               )}>
//                 Review your facility information before final submission
//               </p>
//             </div>
            
//             <div className={cn(
//               'rounded-xl border overflow-hidden',
//               theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
//             )}>
//               {/* Summary Header */}
//               <div className={cn(
//                 'px-6 py-4 border-b',
//                 theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
//               )}>
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h4 className={cn(
//                       'text-lg font-bold',
//                       theme === 'dark' ? 'text-white' : 'text-gray-900'
//                     )}>
//                       {formData.name}
//                     </h4>
//                     <p className={cn(
//                       'text-sm mt-1',
//                       theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
//                     )}>
//                       Facility Registration Summary
//                     </p>
//                   </div>
//                   <div className={cn(
//                     'px-3 py-1 rounded-lg text-sm font-bold',
//                     theme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-50 text-blue-700'
//                   )}>
//                     Ready to Register
//                   </div>
//                 </div>
//               </div>
              
//               {/* Summary Details */}
//               <div className="p-6 space-y-6">
//                 <div>
//                   <h5 className={cn(
//                     'text-sm font-semibold mb-3',
//                     theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
//                   )}>
//                     Facility Details
//                   </h5>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <p className={cn(
//                         'text-xs',
//                         theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
//                       )}>
//                         Facility Type
//                       </p>
//                       <p className={cn(
//                         'font-medium',
//                         theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
//                       )}>
//                         {formData.type}
//                       </p>
//                     </div>
//                     <div>
//                       <p className={cn(
//                         'text-xs',
//                         theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
//                       )}>
//                         License Number
//                       </p>
//                       <p className={cn(
//                         'font-medium flex items-center gap-2',
//                         theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
//                       )}>
//                         {formData.licenseNumber}
//                         {formData.licenseVerified && (
//                           <CheckCircle className="w-4 h-4 text-emerald-500" />
//                         )}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
                
//                 <div>
//                   <h5 className={cn(
//                     'text-sm font-semibold mb-3',
//                     theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
//                   )}>
//                     Location & Contact
//                   </h5>
//                   <div className="space-y-3">
//                     <div>
//                       <p className={cn(
//                         'text-xs',
//                         theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
//                       )}>
//                         Address
//                       </p>
//                       <p className={cn(
//                         'font-medium',
//                         theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
//                       )}>
//                         {formData.address.street}, {formData.address.city}, {formData.address.state} {formData.address.postalCode}, {formData.address.country}
//                       </p>
//                     </div>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                       <div>
//                         <p className={cn(
//                           'text-xs',
//                           theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
//                         )}>
//                           Primary Phone
//                         </p>
//                         <p className={cn(
//                           'font-medium',
//                           theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
//                         )}>
//                           {formData.contact.phone}
//                         </p>
//                       </div>
//                       <div>
//                         <p className={cn(
//                           'text-xs',
//                           theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
//                         )}>
//                           Email
//                         </p>
//                         <p className={cn(
//                           'font-medium',
//                           theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
//                         )}>
//                           {formData.contact.email}
//                         </p>
//                       </div>
//                       <div>
//                         <p className={cn(
//                           'text-xs',
//                           theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
//                         )}>
//                           Emergency Contact
//                         </p>
//                         <p className={cn(
//                           'font-medium',
//                           theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
//                         )}>
//                           {formData.contact.emergencyContact}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
                
//                 {/* Network Enrollment */}
//                 <div className={cn(
//                   'p-4 rounded-lg',
//                   theme === 'dark' ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-blue-50 border border-blue-200'
//                 )}>
//                   <div className="flex items-center gap-3">
//                     <div className={cn(
//                       'p-2 rounded-lg',
//                       theme === 'dark' ? 'bg-cyan-500/20' : 'bg-blue-100'
//                     )}>
//                       <Building2 className={cn(
//                         'w-5 h-5',
//                         theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
//                       )} />
//                     </div>
//                     <div>
//                       <h6 className={cn(
//                         'text-sm font-semibold',
//                         theme === 'dark' ? 'text-cyan-300' : 'text-blue-700'
//                       )}>
//                         National Referral Network
//                       </h6>
//                       <p className={cn(
//                         'text-xs mt-1',
//                         theme === 'dark' ? 'text-cyan-400/80' : 'text-blue-600/80'
//                       )}>
//                         Your facility will be automatically enrolled in the national referral network upon registration. This enables inter-facility patient referrals and collaboration.
//                       </p>
//                     </div>
//                   </div>
//                 </div>
                
//                 {/* Terms Agreement */}
//                 <div>
//                   <label className="flex items-start gap-3 cursor-pointer">
//                     <input
//                       type="checkbox"
//                       checked={formData.agreeToTerms}
//                       onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
//                       className="mt-1"
//                     />
//                     <div>
//                       <p className={cn(
//                         'text-sm font-medium',
//                         theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
//                       )}>
//                         I agree to the terms and conditions
//                       </p>
//                       <p className={cn(
//                         'text-xs mt-1',
//                         theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
//                       )}>
//                         By submitting this form, I confirm that all information provided is accurate and I agree to the facility registration terms, privacy policy, and network participation agreement.
//                       </p>
//                     </div>
//                   </label>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );
        
//       default:
//         return null;
//     }
//   };
  
//   return (
//     <div className="flex flex-col h-full">
//       <WizardStepper
//         currentStep={currentStep}
//         totalSteps={steps.length}
//         onNext={handleNext}
//         onBack={handleBack}
//         onSaveDraft={handleSaveDraft}
//         onSubmit={handleSubmit}
//       />
      
//       <div className="flex-1 overflow-y-auto p-6">
//         {renderStepContent()}
//       </div>
//     </div>
//   );
// };

// export default FacilityRegistrationWizard;