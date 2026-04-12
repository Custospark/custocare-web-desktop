import {
  Activity,
  Baby,
  Bed,
  Clock,
  Eye,
  Shield,
  Stethoscope,
  Users,
} from 'lucide-react';

import {
  AgeGroup,
  SexRestriction,
  WardStatus,
  WardType,
} from '../../../api/wards/wardTypes';

import type {
  FacilityWardFormData,
  WardColors,
  WardStatusOption,
  WardTypeOption,
} from './ward.types';

export const WARD_TYPE_OPTIONS: WardTypeOption[] = [
  {
    value: WardType.MEDICAL,
    label: 'Medical Ward',
    icon: Stethoscope,
    color: 'text-blue-500',
    description: 'General medical patients',
  },
  {
    value: WardType.SURGICAL,
    label: 'Surgical Ward',
    icon: Activity,
    color: 'text-red-500',
    description: 'Post-operative care',
  },
  {
    value: WardType.MATERNITY,
    label: 'Maternity Ward',
    icon: Baby,
    color: 'text-pink-500',
    description: 'Obstetric care',
  },
  {
    value: WardType.PEDIATRIC,
    label: 'Pediatric Ward',
    icon: Users,
    color: 'text-green-500',
    description: 'Children and adolescents',
  },
  {
    value: WardType.ICU,
    label: 'Intensive Care Unit',
    icon: Shield,
    color: 'text-purple-500',
    description: 'Critical care',
  },
  {
    value: WardType.NICU,
    label: 'Neonatal ICU',
    icon: Baby,
    color: 'text-yellow-500',
    description: 'Newborn intensive care',
  },
  {
    value: WardType.PSYCHIATRIC,
    label: 'Psychiatric Ward',
    icon: Eye,
    color: 'text-indigo-500',
    description: 'Mental health care',
  },
  {
    value: WardType.ISOLATION,
    label: 'Isolation Ward',
    icon: Shield,
    color: 'text-orange-500',
    description: 'Infection control',
  },
  {
    value: WardType.EMERGENCY_OBSERVATION,
    label: 'Emergency Observation',
    icon: Clock,
    color: 'text-cyan-500',
    description: 'Emergency monitoring',
  },
  {
    value: WardType.GENERAL,
    label: 'General Ward',
    icon: Bed,
    color: 'text-gray-500',
    description: 'General inpatient care',
  },
];

export const STATUS_OPTIONS: WardStatusOption[] = [
  { value: WardStatus.ACTIVE, label: 'Active', color: 'text-green-500' },
  { value: WardStatus.INACTIVE, label: 'Inactive', color: 'text-red-500' },
  {
    value: WardStatus.TEMPORARILY_CLOSED,
    label: 'Temporarily Closed',
    color: 'text-yellow-500',
  },
];

export const SEX_RESTRICTION_OPTIONS = [
  { value: SexRestriction.MIXED, label: 'Mixed' },
  { value: SexRestriction.MALE_ONLY, label: 'Male Only' },
  { value: SexRestriction.FEMALE_ONLY, label: 'Female Only' },
];

export const AGE_GROUP_OPTIONS = [
  { value: AgeGroup.ALL, label: 'All Ages' },
  { value: AgeGroup.ADULT, label: 'Adult Only' },
  { value: AgeGroup.PEDIATRIC, label: 'Pediatric Only' },
  { value: AgeGroup.NEONATAL, label: 'Neonatal Only' },
];
/**
 * Generate a unique word code
 * Format: WD-XXXX where XXXX is a random 4-digit number
 * Example: WD-1234, WD-5678, WD-9012
 */
export const generateWordCode = (): string => {
  // Generate random number between 1 and 9999
  const randomNum = Math.floor(Math.random() * 9999) + 1;
  // Pad with leading zeros to 4 digits
  const paddedNum = randomNum.toString().padStart(4, '0');
  return `WD-${paddedNum}`;
};

export const getEmptyFormData = (
  facilityId: number | null
): FacilityWardFormData => ({
  facility_id: facilityId,
  name: '',
  code: generateWordCode(),
  ward_type: '',
  building: '',
  floor: '',
  status: WardStatus.ACTIVE,
  capacity_declared: '',
  capacity_operational: '',
  sex_restriction: SexRestriction.MIXED,
  age_group: AgeGroup.ALL,
  note: '',
});

export const createWardColors = (theme: 'light' | 'dark'): WardColors => {
  const isDark = theme === 'dark';

  return {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      elevated: isDark ? 'bg-gray-800' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      secondary: isDark ? 'border-gray-700' : 'border-gray-300',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    accent: {
      primary: 'bg-blue-600',
      hover: isDark ? 'hover:bg-blue-600' : 'hover:bg-blue-700',
      text: 'text-white',
    },
  };
};
