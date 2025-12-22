import { 
  Patient, 
  PatientCreateData, 
  EmergencyPatientData,
  Gender,
  PatientStatus 
} from '../../types/patient.types';
import { ValidationError } from '../../types/shared.types';

export const validatePatientData = (patientData: Partial<Patient>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Required fields validation
  if (!patientData.firstName?.trim()) {
    errors.push({
      field: 'firstName',
      message: 'First name is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  if (!patientData.lastName?.trim()) {
    errors.push({
      field: 'lastName',
      message: 'Last name is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  if (!patientData.dateOfBirth) {
    errors.push({
      field: 'dateOfBirth',
      message: 'Date of birth is required',
      code: 'REQUIRED_FIELD',
    });
  } else {
    const dob = new Date(patientData.dateOfBirth);
    if (dob > new Date()) {
      errors.push({
        field: 'dateOfBirth',
        message: 'Date of birth cannot be in the future',
        code: 'INVALID_DATE',
      });
    }
  }
  
  if (!patientData.gender) {
    errors.push({
      field: 'gender',
      message: 'Gender is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (!Object.values(Gender).includes(patientData.gender)) {
    errors.push({
      field: 'gender',
      message: 'Invalid gender value',
      code: 'INVALID_VALUE',
    });
  }
  
  // Contact info validation
  if (patientData.contactInfo) {
    if (!patientData.contactInfo.phone?.trim()) {
      errors.push({
        field: 'contactInfo.phone',
        message: 'Phone number is required',
        code: 'REQUIRED_FIELD',
      });
    } else if (!/^[\d\s\-\+\(\)]{10,15}$/.test(patientData.contactInfo.phone)) {
      errors.push({
        field: 'contactInfo.phone',
        message: 'Invalid phone number format',
        code: 'INVALID_FORMAT',
      });
    }
    
    if (patientData.contactInfo.email && !/\S+@\S+\.\S+/.test(patientData.contactInfo.email)) {
      errors.push({
        field: 'contactInfo.email',
        message: 'Invalid email address',
        code: 'INVALID_FORMAT',
      });
    }
  }
  
  // Status validation
  if (patientData.status && !Object.values(PatientStatus).includes(patientData.status)) {
    errors.push({
      field: 'status',
      message: 'Invalid patient status',
      code: 'INVALID_VALUE',
    });
  }
  
  // Address validation (if provided)
  if (patientData.address) {
    const { street, city, state, postalCode, country } = patientData.address;
    
    if (!street?.trim()) {
      errors.push({
        field: 'address.street',
        message: 'Street address is required',
        code: 'REQUIRED_FIELD',
      });
    }
    
    if (!city?.trim()) {
      errors.push({
        field: 'address.city',
        message: 'City is required',
        code: 'REQUIRED_FIELD',
      });
    }
    
    if (!postalCode?.trim()) {
      errors.push({
        field: 'address.postalCode',
        message: 'Postal code is required',
        code: 'REQUIRED_FIELD',
      });
    }
  }
  
  return errors;
};

export const validateEmergencyPatientData = (data: EmergencyPatientData): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Minimal validation for emergency cases
  if (!data.identifyingInfo?.trim() && (!data.firstName?.trim() || !data.lastName?.trim())) {
    errors.push({
      field: 'identifyingInfo',
      message: 'Either identifying information or full name is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  // Gender validation if provided
  if (data.gender && !Object.values(Gender).includes(data.gender)) {
    errors.push({
      field: 'gender',
      message: 'Invalid gender value',
      code: 'INVALID_VALUE',
    });
  }
  
  // Age validation if provided
  if (data.approximateAge && (data.approximateAge < 0 || data.approximateAge > 120)) {
    errors.push({
      field: 'approximateAge',
      message: 'Age must be between 0 and 120',
      code: 'INVALID_RANGE',
    });
  }
  
  // Emergency contact validation
  if (data.emergencyContact) {
    if (!data.emergencyContact.name?.trim()) {
      errors.push({
        field: 'emergencyContact.name',
        message: 'Emergency contact name is required',
        code: 'REQUIRED_FIELD',
      });
    }
    
    if (!data.emergencyContact.phone?.trim()) {
      errors.push({
        field: 'emergencyContact.phone',
        message: 'Emergency contact phone is required',
        code: 'REQUIRED_FIELD',
      });
    }
  }
  
  return errors;
};

export const validatePatientUpdate = (
  currentPatient: Patient,
  updates: Partial<Patient>
): ValidationError[] => {
  const errors = validatePatientData({ ...currentPatient, ...updates });
  
  // Additional validation for updates
  if (updates.status === PatientStatus.DECEASED && !updates.dateOfDeath) {
    errors.push({
      field: 'dateOfDeath',
      message: 'Date of death is required when status is set to deceased',
      code: 'REQUIRED_FIELD',
    });
  }
  
  return errors;
};

export const checkForDuplicatePatient = (
  patientData: Partial<Patient>,
  existingPatients: Patient[]
): Array<{
  patient: Patient;
  matchScore: number;
  matchingFields: string[];
}> => {
  const potentialDuplicates = [];
  const { firstName, lastName, dateOfBirth, contactInfo } = patientData;
  
  if (!firstName || !lastName || !dateOfBirth) {
    return [];
  }
  
  for (const existingPatient of existingPatients) {
    let matchScore = 0;
    const matchingFields: string[] = [];
    
    // Exact name match
    if (
      existingPatient.firstName.toLowerCase() === firstName.toLowerCase() &&
      existingPatient.lastName.toLowerCase() === lastName.toLowerCase()
    ) {
      matchScore += 40;
      matchingFields.push('fullName');
    }
    
    // Date of birth match
    if (existingPatient.dateOfBirth === dateOfBirth) {
      matchScore += 30;
      matchingFields.push('dateOfBirth');
    }
    
    // Phone number match
    if (
      contactInfo?.phone &&
      existingPatient.contactInfo.phone === contactInfo.phone
    ) {
      matchScore += 20;
      matchingFields.push('phone');
    }
    
    // Partial name match
    if (
      existingPatient.firstName.toLowerCase().includes(firstName.toLowerCase()) ||
      existingPatient.lastName.toLowerCase().includes(lastName.toLowerCase())
    ) {
      matchScore += 10;
      matchingFields.push('partialName');
    }
    
    if (matchScore >= 50) {
      potentialDuplicates.push({
        patient: existingPatient,
        matchScore,
        matchingFields,
      });
    }
  }
  
  // Sort by match score descending
  return potentialDuplicates.sort((a, b) => b.matchScore - a.matchScore);
};

export const validateInsuranceData = (insuranceData: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!insuranceData.provider?.trim()) {
    errors.push({
      field: 'insurance.provider',
      message: 'Insurance provider is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  if (!insuranceData.policyNumber?.trim()) {
    errors.push({
      field: 'insurance.policyNumber',
      message: 'Policy number is required',
      code: 'REQUIRED_FIELD',
    });
  }
  
  if (!insuranceData.effectiveDate) {
    errors.push({
      field: 'insurance.effectiveDate',
      message: 'Effective date is required',
      code: 'REQUIRED_FIELD',
    });
  } else if (new Date(insuranceData.effectiveDate) > new Date()) {
    errors.push({
      field: 'insurance.effectiveDate',
      message: 'Effective date cannot be in the future',
      code: 'INVALID_DATE',
    });
  }
  
  return errors;
};