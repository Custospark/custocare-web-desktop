/**
 * ============================================================================
 * PATIENT MODULE - TYPE DEFINITIONS
 * ============================================================================
 * 
 * Shared TypeScript types and interfaces for the Patient Management System
 */

/**
 * Patient operation IDs
 */
export type PatientOperationId = 'overview' | 'search' | 'register' | 'discharge';

/**
 * Patient record structure
 */
export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  status: 'Active' | 'Discharged' | 'Critical';
  lastVisit: string;
  nextAppointment?: string;
  assignedDoctor: string;
  conditions: string[];
}

/**
 * Search filter state
 */
export interface SearchFilters {
  query: string;
  status: string;
  ageRange: string;
  gender: string;
  sortBy: string;
}

/**
 * Registration form data
 */
export interface RegistrationForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType: string;
  allergies: string;
  medications: string;
  insurance: string;
}

/**
 * Patient status badge styling configuration
 */
export const STATUS_CONFIG = {
  Active: {
    darkClasses: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    lightClasses: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  },
  Critical: {
    darkClasses: 'bg-red-500/20 text-red-300 border-red-500/30',
    lightClasses: 'bg-red-100 text-red-700 border-red-300',
  },
  Discharged: {
    darkClasses: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    lightClasses: 'bg-gray-100 text-gray-700 border-gray-300',
  },
} as const;

/**
 * Mock patient data for demonstration
 * TODO: Replace with API integration
 */
export const MOCK_PATIENTS: PatientRecord[] = [
  {
    id: 'PT-2024-001',
    name: 'John Smith',
    age: 45,
    gender: 'M',
    phone: '+1 (555) 123-4567',
    email: 'john.smith@email.com',
    address: '123 Main St, New York, NY 10001',
    bloodType: 'A+',
    status: 'Active',
    lastVisit: '2024-01-15',
    nextAppointment: '2024-02-01',
    assignedDoctor: 'Dr. Sarah Johnson',
    conditions: ['Hypertension', 'Type 2 Diabetes'],
  },
  {
    id: 'PT-2024-002',
    name: 'Maria Garcia',
    age: 32,
    gender: 'F',
    phone: '+1 (555) 234-5678',
    email: 'maria.garcia@email.com',
    address: '456 Oak Ave, Los Angeles, CA 90001',
    bloodType: 'O-',
    status: 'Active',
    lastVisit: '2024-01-18',
    assignedDoctor: 'Dr. Michael Chen',
    conditions: ['Asthma'],
  },
  {
    id: 'PT-2024-003',
    name: 'Robert Johnson',
    age: 67,
    gender: 'M',
    phone: '+1 (555) 345-6789',
    email: 'robert.j@email.com',
    address: '789 Pine Rd, Chicago, IL 60601',
    bloodType: 'B+',
    status: 'Critical',
    lastVisit: '2024-01-19',
    nextAppointment: '2024-01-22',
    assignedDoctor: 'Dr. Emily Williams',
    conditions: ['Coronary Artery Disease', 'COPD'],
  },
  {
    id: 'PT-2024-004',
    name: 'Lisa Anderson',
    age: 28,
    gender: 'F',
    phone: '+1 (555) 456-7890',
    email: 'lisa.a@email.com',
    address: '321 Elm St, Houston, TX 77001',
    bloodType: 'AB+',
    status: 'Discharged',
    lastVisit: '2024-01-10',
    assignedDoctor: 'Dr. David Lee',
    conditions: [],
  },
];