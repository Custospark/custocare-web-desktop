import  { 
  type Patient, 
  type PatientDemographics,
  type PatientCreateData,
  type PatientUpdateData,
  type EmergencyPatientData,
  type ContactInfo,
  type Address,
  type PatientInsurance,
  type PatientMedicalInfo,
} from '../../features/types/patient';
import  { 
   Gender,
   PatientStatus
} from '../../features/types/patient';
import { type ValidationError } from '../../features/types/shared';

/**
 * Validates patient demographics data
 * @param demographics - Patient demographics to validate
 * @returns Array of validation errors
 */
export const validatePatientDemographics = (demographics: Partial<PatientDemographics>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Required fields validation
  if (!demographics.firstName?.trim()) {
    errors.push({
      field: 'demographics.firstName',
      message: 'First name is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  if (!demographics.lastName?.trim()) {
    errors.push({
      field: 'demographics.lastName',
      message: 'Last name is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  if (!demographics.dateOfBirth) {
    errors.push({
      field: 'demographics.dateOfBirth',
      message: 'Date of birth is required',
      code: 'REQUIRED_FIELD',
    });
  } else {
    const dob = new Date(demographics.dateOfBirth);
    if (isNaN(dob.getTime())) {
      errors.push({
        field: 'demographics.dateOfBirth',
        message: 'Invalid date format',
        code: 'INVALID_DATE',
      });
    } else if (dob > new Date()) {
      errors.push({
        field: 'demographics.dateOfBirth',
        message: 'Date of birth cannot be in the future',
        code: 'INVALID_DATE',
      });
    }
  }
  
  if (!demographics.gender) {
    errors.push({
      field: 'demographics.gender',
      message: 'Gender is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (!Object.values(Gender).includes(demographics.gender)) {
    errors.push({
      field: 'demographics.gender',
      message: 'Invalid gender value',
      code: 'INVALID_VALUE',
    });
  }
  
  // Optional field validation
  if (demographics.middleName && demographics.middleName.trim().length > 100) {
    errors.push({
      field: 'demographics.middleName',
      message: 'Middle name cannot exceed 100 characters',
      code: 'MAX_LENGTH_EXCEEDED',
    });
  }
  
  return errors;
};

/**
 * Validates contact information
 * @param contactInfo - Contact information to validate
 * @returns Array of validation errors
 */
export const validateContactInfo = (contactInfo: Partial<ContactInfo>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!contactInfo.phone?.trim()) {
    errors.push({
      field: 'contactInfo.phone',
      message: 'Phone number is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (!/^[\d\s\-+()]{10,15}$/.test(contactInfo.phone)) {
    errors.push({
      field: 'contactInfo.phone',
      message: 'Invalid phone number format (10-15 digits required)',
      code: 'INVALID_FORMAT',
    });
  }
  
  if (contactInfo.email && !/\S+@\S+\.\S+/.test(contactInfo.email)) {
    errors.push({
      field: 'contactInfo.email',
      message: 'Invalid email address format',
      code: 'INVALID_FORMAT',
    });
  }
  
  if (contactInfo.alternativePhone && !/^[\d\s\-+()]{10,15}$/.test(contactInfo.alternativePhone)) {
    errors.push({
      field: 'contactInfo.alternativePhone',
      message: 'Invalid alternative phone number format',
      code: 'INVALID_FORMAT',
    });
  }
  
  // Validate emergency contact if provided
  if (contactInfo.emergencyContact) {
    const { name, phone, relationship } = contactInfo.emergencyContact;
    
    if (!name?.trim()) {
      errors.push({
        field: 'contactInfo.emergencyContact.name',
        message: 'Emergency contact name is required',
        code: 'REQUIRED_FIELD',
      });
    }
    
    if (!phone?.trim()) {
      errors.push({
        field: 'contactInfo.emergencyContact.phone',
        message: 'Emergency contact phone is required',
        code: 'REQUIRED_FIELD',
      });
    } else if (!/^[\d\s\-+()]{10,15}$/.test(phone)) {
      errors.push({
        field: 'contactInfo.emergencyContact.phone',
        message: 'Invalid emergency contact phone format',
        code: 'INVALID_FORMAT',
      });
    }
    
    if (!relationship?.trim()) {
      errors.push({
        field: 'contactInfo.emergencyContact.relationship',
        message: 'Emergency contact relationship is required',
        code: 'REQUIRED_FIELD',
      });
    }
  }
  
  return errors;
};

/**
 * Validates address information
 * @param address - Address to validate
 * @param isRequired - Whether all address fields are required
 * @returns Array of validation errors
 */
export const validateAddress = (address: Partial<Address>, isRequired: boolean = false): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (isRequired || address?.street || address?.city || address?.state || address?.postalCode) {
    if (!address?.street?.trim()) {
      errors.push({
        field: 'address.street',
        message: 'Street address is required when providing address',
        code: 'REQUIRED_FIELD',
      });
    }
    
    if (!address?.city?.trim()) {
      errors.push({
        field: 'address.city',
        message: 'City is required when providing address',
        code: 'REQUIRED_FIELD',
      });
    }
    
    if (!address?.state?.trim()) {
      errors.push({
        field: 'address.state',
        message: 'State is required when providing address',
        code: 'REQUIRED_FIELD',
      });
    }
    
    if (!address?.postalCode?.trim()) {
      errors.push({
        field: 'address.postalCode',
        message: 'Postal code is required when providing address',
        code: 'REQUIRED_FIELD',
      });
    } else if (!/^\d{5}(-\d{4})?$/.test(address.postalCode)) {
      errors.push({
        field: 'address.postalCode',
        message: 'Invalid postal code format (use 12345 or 12345-6789)',
        code: 'INVALID_FORMAT',
      });
    }
  }
  
  return errors;
};

/**
 * Validates patient insurance information
 * @param insurance - Insurance information to validate
 * @returns Array of validation errors
 */
export const validateInsuranceData = (insurance: Partial<PatientInsurance>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!insurance?.provider?.trim()) {
    errors.push({
      field: 'insurance.provider',
      message: 'Insurance provider is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  if (!insurance?.policyNumber?.trim()) {
    errors.push({
      field: 'insurance.policyNumber',
      message: 'Policy number is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  if (!insurance?.effectiveDate) {
    errors.push({
      field: 'insurance.effectiveDate',
      message: 'Effective date is required',
      code: 'REQUIRED_FIELD',
    });
  } else {
    const effectiveDate = new Date(insurance.effectiveDate);
    if (isNaN(effectiveDate.getTime())) {
      errors.push({
        field: 'insurance.effectiveDate',
        message: 'Invalid effective date format',
        code: 'INVALID_DATE',
      });
    } else if (effectiveDate > new Date()) {
      errors.push({
        field: 'insurance.effectiveDate',
        message: 'Effective date cannot be in the future',
        code: 'INVALID_DATE',
      });
    }
  }
  
  if (insurance.expirationDate) {
    const expirationDate = new Date(insurance.expirationDate);
    if (isNaN(expirationDate.getTime())) {
      errors.push({
        field: 'insurance.expirationDate',
        message: 'Invalid expiration date format',
        code: 'INVALID_DATE',
      });
    } else if (expirationDate < new Date()) {
      errors.push({
        field: 'insurance.expirationDate',
        message: 'Insurance has expired',
        code: 'EXPIRED_DATE',
      });
    }
  }
  
  return errors;
};

/**
 * Validates medical information
 * @param medicalInfo - Medical information to validate
 * @returns Array of validation errors
 */
export const validateMedicalInfo = (medicalInfo: Partial<PatientMedicalInfo>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Validate blood type if provided
  if (medicalInfo.bloodType && !/^(A|B|AB|O)[+-]$/.test(medicalInfo.bloodType)) {
    errors.push({
      field: 'medicalInfo.bloodType',
      message: 'Invalid blood type format (e.g., A+, B-, AB+, O-)',
      code: 'INVALID_FORMAT',
    });
  }
  
  // Validate arrays are actually arrays
  if (!Array.isArray(medicalInfo.allergies)) {
    errors.push({
      field: 'medicalInfo.allergies',
      message: 'Allergies must be an array',
      code: 'INVALID_TYPE',
    });
  }
  
  if (!Array.isArray(medicalInfo.chronicConditions)) {
    errors.push({
      field: 'medicalInfo.chronicConditions',
      message: 'Chronic conditions must be an array',
      code: 'INVALID_TYPE',
    });
  }
  
  if (!Array.isArray(medicalInfo.medications)) {
    errors.push({
      field: 'medicalInfo.medications',
      message: 'Medications must be an array',
      code: 'INVALID_TYPE',
    });
  }
  
  if (!Array.isArray(medicalInfo.knownAllergies)) {
    errors.push({
      field: 'medicalInfo.knownAllergies',
      message: 'Known allergies must be an array',
      code: 'INVALID_TYPE',
    });
  }
  
  // Validate array items if arrays exist
  if (Array.isArray(medicalInfo.allergies)) {
    medicalInfo.allergies.forEach((allergy, index) => {
      if (typeof allergy !== 'string' || !allergy.trim()) {
        errors.push({
          field: `medicalInfo.allergies[${index}]`,
          message: 'Allergy must be a non-empty string',
          code: 'INVALID_VALUE',
        });
      }
    });
  }
  
  return errors;
};

/**
 * Main patient data validator for create operations
 * @param patientData - Patient data to validate
 * @returns Array of validation errors
 */
export const validatePatientData = (patientData: Partial<PatientCreateData>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Validate demographics (required for create)
  const demographicsErrors = validatePatientDemographics(patientData.demographics || {});
  errors.push(...demographicsErrors);
  
  // Validate contact info (required for create)
  const contactInfoErrors = validateContactInfo(patientData.contactInfo || {});
  errors.push(...contactInfoErrors);
  
  // Validate address if provided
  if (patientData.address) {
    const addressErrors = validateAddress(patientData.address, false);
    errors.push(...addressErrors);
  }
  
  // Validate medical info if provided
  if (patientData.medicalInfo) {
    const medicalInfoErrors = validateMedicalInfo(patientData.medicalInfo);
    errors.push(...medicalInfoErrors);
  }
  
  // Validate emergency contact if provided
  if (patientData.emergencyContact) {
    const emergencyContactErrors = validateContactInfo({ 
      emergencyContact: patientData.emergencyContact 
    });
    errors.push(...emergencyContactErrors);
  }
  
  // Validate insurance if provided
  if (patientData.insurance) {
    const insuranceErrors = validateInsuranceData(patientData.insurance);
    errors.push(...insuranceErrors);
  }
  
  return errors;
};

/**
 * Validates emergency patient data
 * @param data - Emergency patient data to validate
 * @returns Array of validation errors
 */
export const validateEmergencyPatientData = (data: EmergencyPatientData): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // At least one identifying method is required
  const hasDemographics = data.demographics?.firstName || data.demographics?.lastName;
  const hasIdentifyingInfo = data.identifyingInfo?.trim();
  
  if (!hasDemographics && !hasIdentifyingInfo) {
    errors.push({
      field: 'identifyingInfo',
      message: 'Either identifying information or patient name is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  // Validate demographics if provided
  if (data.demographics) {
    if (data.demographics.gender && !Object.values(Gender).includes(data.demographics.gender)) {
      errors.push({
        field: 'demographics.gender',
        message: 'Invalid gender value',
        code: 'INVALID_VALUE',
      });
    }
    
    if (data.demographics.approximateAge) {
      if (data.demographics.approximateAge < 0 || data.demographics.approximateAge > 120) {
        errors.push({
          field: 'demographics.approximateAge',
          message: 'Approximate age must be between 0 and 120',
          code: 'INVALID_RANGE',
        });
      }
    }
  }
  
  // Validate emergency contact (required for emergency patients)
  if (!data.emergencyContact) {
    errors.push({
      field: 'emergencyContact',
      message: 'Emergency contact is required for emergency patients',
      code: 'REQUIRED_FIELD',
    });
  } else {
    const emergencyContactErrors = validateContactInfo({ 
      emergencyContact: data.emergencyContact 
    });
    errors.push(...emergencyContactErrors);
  }
  
  // Validate vital signs if provided
  if (data.vitalSigns) {
    const { bloodPressure, heartRate, temperature, oxygenSaturation, respiratoryRate } = data.vitalSigns;
    
    if (bloodPressure && !/^\d{2,3}\/\d{2,3}$/.test(bloodPressure)) {
      errors.push({
        field: 'vitalSigns.bloodPressure',
        message: 'Invalid blood pressure format (e.g., 120/80)',
        code: 'INVALID_FORMAT',
      });
    }
    
    if (heartRate && (heartRate < 30 || heartRate > 200)) {
      errors.push({
        field: 'vitalSigns.heartRate',
        message: 'Heart rate must be between 30 and 200 BPM',
        code: 'INVALID_RANGE',
      });
    }
    
    if (temperature && (temperature < 32 || temperature > 43)) {
      errors.push({
        field: 'vitalSigns.temperature',
        message: 'Temperature must be between 32°C and 43°C',
        code: 'INVALID_RANGE',
      });
    }
    
    if (oxygenSaturation && (oxygenSaturation < 70 || oxygenSaturation > 100)) {
      errors.push({
        field: 'vitalSigns.oxygenSaturation',
        message: 'Oxygen saturation must be between 70% and 100%',
        code: 'INVALID_RANGE',
      });
    }
    
    if (respiratoryRate && (respiratoryRate < 6 || respiratoryRate > 60)) {
      errors.push({
        field: 'vitalSigns.respiratoryRate',
        message: 'Respiratory rate must be between 6 and 60 breaths per minute',
        code: 'INVALID_RANGE',
      });
    }
  }
  
  return errors;
};

/**
 * Validates patient update data
 * @param currentPatient - Current patient data
 * @param updates - Updates to apply
 * @returns Array of validation errors
 */
export const validatePatientUpdate = (
  // currentPatient: Patient,
  updates: Partial<PatientUpdateData>
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Combine current data with updates for validation
  // const combinedData = {
  //   demographics: { ...currentPatient.demographics, ...updates.demographics },
  //   contactInfo: { ...currentPatient.contactInfo, ...updates.contactInfo },
  //   address: { ...currentPatient.address, ...updates.address },
  //   medicalInfo: { ...currentPatient.medicalInfo, ...updates.medicalInfo },
  //   insurance: updates.insurance || currentPatient.primaryInsurance,
  // };
  
  // Validate demographics if being updated
  if (updates.demographics) {
    const demographicsErrors = validatePatientDemographics(updates.demographics);
    errors.push(...demographicsErrors);
  }
  
  // Validate contact info if being updated
  if (updates.contactInfo) {
    const contactInfoErrors = validateContactInfo(updates.contactInfo);
    errors.push(...contactInfoErrors);
  }
  
  // Validate address if being updated
  if (updates.address) {
    const addressErrors = validateAddress(updates.address, false);
    errors.push(...addressErrors);
  }
  
  // Validate medical info if being updated
  if (updates.medicalInfo) {
    const medicalInfoErrors = validateMedicalInfo(updates.medicalInfo);
    errors.push(...medicalInfoErrors);
  }
  
  // Validate insurance if being updated
  if (updates.insurance) {
    const insuranceErrors = validateInsuranceData(updates.insurance);
    errors.push(...insuranceErrors);
  }
  
  // Validate status-specific rules
  if (updates.status === PatientStatus.DECEASED && !updates.medicalInfo?.chronicConditions?.includes('Deceased')) {
    errors.push({
      field: 'status',
      message: 'Cannot set status to DECEASED without proper medical documentation',
      code: 'INVALID_STATUS_CHANGE',
    });
  }
  
  if (updates.status && !Object.values(PatientStatus).includes(updates.status)) {
    errors.push({
      field: 'status',
      message: 'Invalid patient status',
      code: 'INVALID_VALUE',
    });
  }
  
  return errors;
};

/**
 * Checks for potential duplicate patients
 * @param patientData - New patient data to check
 * @param existingPatients - Existing patients to compare against
 * @returns Array of potential duplicates with match scores
 */
export const checkForDuplicatePatient = (
  patientData: Partial<PatientCreateData>,
  existingPatients: Patient[]
): Array<{
  patient: Patient;
  matchScore: number;
  matchingFields: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}> => {
  const potentialDuplicates = [];
  const { demographics, contactInfo, address } = patientData;
  
  if (!demographics?.firstName || !demographics?.lastName || !demographics?.dateOfBirth) {
    return [];
  }
  
  for (const existingPatient of existingPatients) {
    let matchScore = 0;
    const matchingFields: string[] = [];
    
    // Exact full name match (40 points)
    if (
      existingPatient.demographics.firstName.toLowerCase() === demographics.firstName.toLowerCase() &&
      existingPatient.demographics.lastName.toLowerCase() === demographics.lastName.toLowerCase()
    ) {
      matchScore += 40;
      matchingFields.push('fullName');
    }
    
    // Date of birth match (30 points)
    if (existingPatient.demographics.dateOfBirth === demographics.dateOfBirth) {
      matchScore += 30;
      matchingFields.push('dateOfBirth');
    }
    
    // Phone number match (20 points)
    if (
      contactInfo?.phone &&
      existingPatient.contactInfo.phone === contactInfo.phone
    ) {
      matchScore += 20;
      matchingFields.push('phone');
    }
    
    // Address match (15 points)
    if (address && existingPatient.address) {
      const addressMatch = 
        address.postalCode === existingPatient.address.postalCode &&
        address.street?.toLowerCase() === existingPatient.address.street?.toLowerCase();
      
      if (addressMatch) {
        matchScore += 15;
        matchingFields.push('address');
      }
    }
    
    // Partial name match (10 points)
    if (
      existingPatient.demographics.firstName.toLowerCase().includes(demographics.firstName.toLowerCase()) ||
      existingPatient.demographics.lastName.toLowerCase().includes(demographics.lastName.toLowerCase())
    ) {
      matchScore += 10;
      matchingFields.push('partialName');
    }
    
    // Email match (10 points)
    if (
      contactInfo?.email &&
      existingPatient.contactInfo.email === contactInfo.email
    ) {
      matchScore += 10;
      matchingFields.push('email');
    }
    
    // Determine confidence level
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (matchScore >= 70) confidence = 'HIGH';
    else if (matchScore >= 50) confidence = 'MEDIUM';
    
    // Only include if there's at least a medium confidence match
    if (matchScore >= 50) {
      potentialDuplicates.push({
        patient: existingPatient,
        matchScore,
        matchingFields,
        confidence,
      });
    }
  }
  
  // Sort by match score descending
  return potentialDuplicates.sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Comprehensive patient validation with detailed results
 * @param patientData - Patient data to validate
 * @returns Detailed validation result
 */
export const validatePatient = (patientData: Partial<PatientCreateData>): {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
    severity: 'ERROR' | 'WARNING';
  }>;
  warnings: string[];
  suggestions: string[];
} => {
  const validationErrors = validatePatientData(patientData);
  
  const errors = validationErrors.map(error => ({
    ...error,
    severity: 'ERROR' as const,
  }));
  
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Add warnings for missing but recommended fields
  if (!patientData.address) {
    warnings.push('Address information is recommended for complete patient records');
    suggestions.push('Consider adding address information for billing and correspondence');
  }
  
  if (!patientData.medicalInfo?.allergies?.length) {
    warnings.push('No allergies documented. Consider documenting known allergies.');
    suggestions.push('Add allergy information for safe medication administration');
  }
  
  if (!patientData.emergencyContact) {
    warnings.push('Emergency contact information is recommended');
    suggestions.push('Add emergency contact for urgent situations');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
};