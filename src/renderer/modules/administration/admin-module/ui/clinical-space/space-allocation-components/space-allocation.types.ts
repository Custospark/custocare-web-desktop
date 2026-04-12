import type {
  AvailableSpace,
  SpaceWithAssignment,
  StaffForAssignment,
} from '../../../api/staff-space-assignment/StaffSpaceAssignmentTypes';

export interface SpaceAllocationProps {
  theme: 'light' | 'dark';
}

export interface AssignSpaceFormData {
  facility_id: number | null;
  space_id: number | null;
  staff_id: number | null;
  note: string;
}

export interface ReleaseSpaceFormData {
  facility_id: number | null;
  staff_id: number | null;
  assignment_id: number | null;
  note: string;
}

export interface SpaceAllocationColors {
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

export type SpaceAllocationViewMode = 'list' | 'grid';
export type OccupancyFilterValue = 'all' | 'occupied' | 'available';

export interface AssignSpaceDrawerProps {
  theme: 'light' | 'dark';
  open: boolean;
  formData: AssignSpaceFormData;
  availableSpaces: AvailableSpace[];
  staff: StaffForAssignment[];
  preselectedSpace?: SpaceWithAssignment | null;
  onChange: (next: AssignSpaceFormData) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isLoadingStaff: boolean;
  canSubmit: boolean;
}

export interface ReleaseSpaceDrawerProps {
  theme: 'light' | 'dark';
  open: boolean;
  formData: ReleaseSpaceFormData;
  selectedSpace: SpaceWithAssignment | null;
  onChange: (next: ReleaseSpaceFormData) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}
