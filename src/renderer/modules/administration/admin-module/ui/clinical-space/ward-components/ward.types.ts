import type React from 'react';
import type {
  AgeGroup,
  SexRestriction,
  WardStatus,
  WardType,
} from '../../../api/wards/wardTypes';

export interface FacilityWardProps {
  theme: 'light' | 'dark';
}

export interface FacilityWardFormData {
  facility_id: number | null;
  name: string;
  code: string;
  ward_type: WardType | '';
  building: string;
  floor: string;
  status: WardStatus;
  capacity_declared: string;
  capacity_operational: string;
  sex_restriction: SexRestriction;
  age_group: AgeGroup;
  note: string;
}

export interface WardTypeOption {
  value: WardType;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

export interface WardStatusOption {
  value: WardStatus;
  label: string;
  color: string;
}

export interface WardColors {
  bg: {
    primary: string;
    secondary: string;
    elevated: string;
    hover: string;
  };
  border: {
    primary: string;
    secondary: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  accent: {
    primary: string;
    hover: string;
    text: string;
  };
}

export type WardViewMode = 'list' | 'grid';
