import { BadgeCheck, Briefcase, Building2, CheckCircle2, Church, Landmark, School, Shield, Users } from 'lucide-react';
import type { 
  NatureOfFacility,
  FacilityType,
  FacilityTier,
  OperationalStatus,
  OperatingHours
} from '../../../api/queries/facility-owner/registerFacilityTypes';

export interface FacilityFormData {
  // Step 1: Identity
  facility_name: string;
  legal_entity_name: string;
  nature_of_facility: NatureOfFacility | '';
  facility_type: FacilityType | '';
  facility_tier: FacilityTier | '';
  
  // Step 2: Location & Contact
  address_line1: string;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string;
  main_phone: string;
  email: string;
  website: string;
  
  // Step 3: Services & Operations
  operating_hours: OperatingHours;
  available_services: string[];
  operational_status: OperationalStatus | '';
}

export interface NatureOfFacilityOption {
  value: NatureOfFacility;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export const NATURE_OF_FACILITY_OPTIONS: NatureOfFacilityOption[] = [
  { 
    value: 'government', 
    label: 'Government', 
    icon: <Building2 className="w-4 h-4" />,
    description: 'Public/gov'
  },
  { 
    value: 'private', 
    label: 'Private', 
    icon: <Briefcase className="w-4 h-4" />,
    description: 'Private owned'
  },
  { 
    value: 'faith_based', 
    label: 'Faith-based', 
    icon: <Church className="w-4 h-4" />,
    description: 'Religious org'
  },
  { 
    value: 'ngo', 
    label: 'NGO', 
    icon: <Users className="w-4 h-4" />,
    description: 'Non-gov'
  },
  { 
    value: 'military', 
    label: 'Military', 
    icon: <Shield className="w-4 h-4" />,
    description: 'Military'
  },
  { 
    value: 'academic', 
    label: 'Academic', 
    icon: <School className="w-4 h-4" />,
    description: 'Teaching'
  },
  { 
    value: 'public_private_partnership', 
    label: 'Public Private Partnership', 
    icon: <Landmark className="w-4 h-4" />,
    description: 'Public-private'
  },
];

export const FACILITY_TYPE_OPTIONS: FacilityType[] = [
  'hospital',
  'clinic',
  'urgent_care',
  'emergency_department',
  'ambulatory_surgery_center',
  'diagnostic_center',
  'rehabilitation_center',
  'long_term_care',
  'hospice',
  'community_health_center',
  'specialty_center',
  'telehealth_hub',
  'pharmacy',
  'laboratory'
];

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  urgent_care: 'Urgent Care',
  emergency_department: 'Emergency Department',
  ambulatory_surgery_center: 'Ambulatory Surgery Center',
  diagnostic_center: 'Diagnostic Center',
  rehabilitation_center: 'Rehabilitation Center',
  long_term_care: 'Long-term Care',
  hospice: 'Hospice',
  community_health_center: 'Community Health Center',
  specialty_center: 'Specialty Center',
  telehealth_hub: 'Telehealth Hub',
  pharmacy: 'Pharmacy',
  laboratory: 'Laboratory'
};

export const FACILITY_TIER_OPTIONS: FacilityTier[] = ['primary', 'secondary', 'tertiary', 'specialized'];

export const FACILITY_TIER_LABELS: Record<FacilityTier, string> = {
  primary: 'Primary Care',
  secondary: 'Secondary Care',
  tertiary: 'Tertiary Care',
  specialized: 'Specialized Care'
};

export const OPERATIONAL_STATUS_OPTIONS: OperationalStatus[] = [
  'fully_operational',
  'limited_services',
  'emergency_only',
  'temporarily_closed',
  'permanently_closed',
  'under_construction'
];

export const OPERATIONAL_STATUS_LABELS: Record<OperationalStatus, string> = {
  fully_operational: 'Fully Operational',
  limited_services: 'Limited Services',
  emergency_only: 'Emergency Only',
  temporarily_closed: 'Temporarily Closed',
  permanently_closed: 'Permanently Closed',
  under_construction: 'Under Construction'
};

export const DEFAULT_OPERATING_HOURS: OperatingHours = {
  monday: { open: '08:00', close: '18:00', is_closed: false },
  tuesday: { open: '08:00', close: '18:00', is_closed: false },
  wednesday: { open: '08:00', close: '18:00', is_closed: false },
  thursday: { open: '08:00', close: '18:00', is_closed: false },
  friday: { open: '08:00', close: '18:00', is_closed: false },
  saturday: { open: '09:00', close: '13:00', is_closed: false },
  sunday: { open: '09:00', close: '13:00', is_closed: false }
};

export const HEALTHCARE_SERVICES = [
  'Emergency Care',
  'Primary Care',
  'Specialty Consultation',
  'Diagnostic Imaging',
  'Laboratory Services',
  'Pharmacy',
  'Physical Therapy',
  'Mental Health Services',
  'Maternity Care',
  'Pediatric Care',
  'Geriatric Care',
  'Surgical Services',
  'Dental Services',
  'Optometry',
  'Vaccinations',
  'Chronic Disease Management'
];

export const SECURITY_BADGES = [
  { icon: BadgeCheck, text: 'HIPAA' },
  { icon: Shield, text: '256-bit' },
  { icon: CheckCircle2, text: 'SOC 2' }
];