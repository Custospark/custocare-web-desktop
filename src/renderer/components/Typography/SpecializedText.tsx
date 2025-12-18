import React from 'react';

/**
 * PatientName Component
 * Prominent display of patient names
 */
export const PatientName: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
}> = ({ children, className = '' }) => (
  <span className={`text-patient-name text-neutral-black font-semibold ${className}`}>
    {children}
  </span>
);

/**
 * PatientID Component
 * Monospace display for patient IDs and technical codes
 */
export const PatientID: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
}> = ({ children, className = '' }) => (
  <span className={`text-patient-id font-mono text-neutral-gray-dark font-medium ${className}`}>
    {children}
  </span>
);

/**
 * AllergyWarning Component
 * Bold, uppercase, high-visibility allergy warnings
 */
export const AllergyWarning: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
}> = ({ children, className = '' }) => (
  <span className={`text-allergy-warning text-critical font-bold uppercase tracking-wide ${className}`}>
    {children}
  </span>
);

/**
 * CriticalValue Component
 * Large, bold display for critical clinical values
 */
export const CriticalValue: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
}> = ({ children, className = '' }) => (
  <span className={`text-critical-value text-critical font-bold ${className}`}>
    {children}
  </span>
);

/**
 * Usage Examples:
 * 
 * <PatientName>John Doe</PatientName>
 * <PatientID>UG-2025-AB12345</PatientID>
 * <AllergyWarning>Allergy: Penicillin</AllergyWarning>
 * <CriticalValue>185 mg/dL</CriticalValue>
 */