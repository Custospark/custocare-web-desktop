import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { selectAllPatients } from '../slices/patientSlice';
import { PatientStatus, Gender } from '../../features/types/patient';

// Basic selectors
export const selectPatientState = (state: RootState) => state.patients;
export const selectSelectedPatient = (state: RootState) => state.patients.selectedPatient;
export const selectSearchResults = (state: RootState) => state.patients.searchResults;
export const selectSearchParams = (state: RootState) => state.patients.searchParams;
export const selectPatientStats = (state: RootState) => state.patients.stats;
export const selectPatientLoading = (state: RootState) => state.patients.isLoading;
export const selectPatientError = (state: RootState) => state.patients.error;

// Memoized selectors
export const selectActivePatients = createSelector(
  [selectAllPatients],
  (patients) => patients.filter(p => p.status === PatientStatus.ACTIVE)
);

export const selectEmergencyPatients = createSelector(
  [selectAllPatients],
  (patients) => patients.filter(p => p.isEmergency)
);

export const selectPatientsRequiringCompletion = createSelector(
  [selectAllPatients],
  (patients) => patients.filter(p => p.requiresDataCompletion)
);

export const selectPatientAge = createSelector(
  [selectSelectedPatient],
  (patient) => {
    if (!patient?.dateOfBirth) return null;
    const birthDate = new Date(patient.dateOfBirth);
    const ageDiff = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
);

export const selectPatientAgeGroup = createSelector(
  [selectPatientAge],
  (age) => {
    if (!age) return null;
    if (age <= 18) return '0-18';
    if (age <= 40) return '19-40';
    if (age <= 60) return '41-60';
    return '61+';
  }
);

export const selectPatientFullName = createSelector(
  [selectSelectedPatient],
  (patient) => {
    if (!patient) return '';
    return `${patient.firstName} ${patient.middleName ? patient.middleName + ' ' : ''}${patient.lastName}`;
  }
);

export const selectPatientContactInfo = createSelector(
  [selectSelectedPatient],
  (patient) => ({
    phone: patient?.contactInfo.phone || '',
    email: patient?.contactInfo.email || '',
    emergencyContact: patient?.contactInfo.emergencyContact || null,
  })
);

export const selectPatientMedicalSummary = createSelector(
  [selectSelectedPatient],
  (patient) => ({
    bloodType: patient?.bloodType || 'Unknown',
    allergies: patient?.allergies || [],
    chronicConditions: patient?.chronicConditions || [],
    medications: patient?.medications || [],
  })
);

// Search-related selectors
export const selectFilteredPatients = createSelector(
  [selectAllPatients, selectSearchParams],
  (patients, searchParams) => {
    let filtered = [...patients];
    
    // Filter by name
    if (searchParams.firstName) {
      filtered = filtered.filter(p =>
        p.firstName.toLowerCase().includes(searchParams.firstName!.toLowerCase())
      );
    }
    
    if (searchParams.lastName) {
      filtered = filtered.filter(p =>
        p.lastName.toLowerCase().includes(searchParams.lastName!.toLowerCase())
      );
    }
    
    // Filter by status
    if (searchParams.status) {
      filtered = filtered.filter(p => p.status === searchParams.status);
    }
    
    // Filter out archived unless explicitly included
    if (!searchParams.includeArchived) {
      filtered = filtered.filter(p => p.status !== PatientStatus.ARCHIVED);
    }
    
    // Filter by date of birth (exact match)
    if (searchParams.dateOfBirth) {
      filtered = filtered.filter(p => 
        p.dateOfBirth.startsWith(searchParams.dateOfBirth!)
      );
    }
    
    // Filter by medical record number
    if (searchParams.medicalRecordNumber) {
      filtered = filtered.filter(p =>
        p.medicalRecordNumber.includes(searchParams.medicalRecordNumber!)
      );
    }
    
    return filtered;
  }
);

// Statistics selectors
export const selectPatientStatistics = createSelector(
  [selectAllPatients],
  (patients) => {
    const stats = {
      total: patients.length,
      active: patients.filter(p => p.status === PatientStatus.ACTIVE).length,
      inactive: patients.filter(p => p.status === PatientStatus.INACTIVE).length,
      deceased: patients.filter(p => p.status === PatientStatus.DECEASED).length,
      emergency: patients.filter(p => p.isEmergency).length,
      byGender: {
        [Gender.MALE]: patients.filter(p => p.gender === Gender.MALE).length,
        [Gender.FEMALE]: patients.filter(p => p.gender === Gender.FEMALE).length,
        [Gender.OTHER]: patients.filter(p => p.gender === Gender.OTHER).length,
        [Gender.UNKNOWN]: patients.filter(p => p.gender === Gender.UNKNOWN).length,
      },
      byAgeGroup: {
        '0-18': 0,
        '19-40': 0,
        '41-60': 0,
        '61+': 0,
      },
      newThisMonth: 0, // Would need additional data
    };
    
    // Calculate age groups
    patients.forEach(patient => {
      if (patient.dateOfBirth) {
        const birthDate = new Date(patient.dateOfBirth);
        const ageDiff = Date.now() - birthDate.getTime();
        const age = Math.abs(new Date(ageDiff).getUTCFullYear() - 1970);
        
        if (age <= 18) stats.byAgeGroup['0-18']++;
        else if (age <= 40) stats.byAgeGroup['19-40']++;
        else if (age <= 60) stats.byAgeGroup['41-60']++;
        else stats.byAgeGroup['61+']++;
      }
    });
    
    return stats;
  }
);

// Insurance selectors
export const selectPatientInsurance = createSelector(
  [selectSelectedPatient],
  (patient) => patient?.primaryInsurance || null
);

export const selectPatientHasInsurance = createSelector(
  [selectPatientInsurance],
  (insurance) => !!insurance
);

// Cross-facility selectors
export const selectLinkedPatients = createSelector(
  [selectSelectedPatient, selectAllPatients],
  (selectedPatient, allPatients) => {
    if (!selectedPatient?.linkedPatientIds) return [];
    return allPatients.filter(p => 
      selectedPatient.linkedPatientIds?.includes(p.id)
    );
  }
);

export const selectIsMasterPatient = createSelector(
  [selectSelectedPatient],
  (patient) => !patient?.masterPatientId && (patient?.linkedPatientIds?.length || 0) > 0
);

// Validation selectors
export const selectPatientValidationErrors = createSelector(
  [selectSelectedPatient],
  (patient) => {
    const errors: string[] = [];
    
    if (!patient) return errors;
    
    // Required fields
    if (!patient.firstName.trim()) errors.push('First name is required');
    if (!patient.lastName.trim()) errors.push('Last name is required');
    if (!patient.dateOfBirth) errors.push('Date of birth is required');
    if (!patient.contactInfo.phone.trim()) errors.push('Phone number is required');
    
    // Date validation
    const dob = new Date(patient.dateOfBirth);
    if (dob > new Date()) errors.push('Date of birth cannot be in the future');
    
    // Email validation (if provided)
    if (patient.contactInfo.email && !/\S+@\S+\.\S+/.test(patient.contactInfo.email)) {
      errors.push('Invalid email address');
    }
    
    // Emergency contact validation (if patient is emergency)
    if (patient.isEmergency && !patient.contactInfo.emergencyContact) {
      errors.push('Emergency contact is required for emergency patients');
    }
    
    return errors;
  }
);

export const selectIsPatientValid = createSelector(
  [selectPatientValidationErrors],
  (errors) => errors.length === 0
);