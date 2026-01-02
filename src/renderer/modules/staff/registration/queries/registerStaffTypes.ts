export type ProfessionalTitle = 
  | 'Doctor'
  | 'Nurse'
  | 'Pharmacist'
  | 'Therapist'
  | 'Technician'
  | 'Allied Health'
  | 'Administrative Staff'
  | 'Support Staff';

export type EmploymentStatus = 
  | 'employed'
  | 'suspended'
  | 'unemployed'
  | 'terminated'
  | 'retired'
  | 'credentialing_pending';

export type EmploymentType = 
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'locum_tenens'
  | 'volunteer';

export interface RegisterStaffRequest {
  professional_title: ProfessionalTitle;
  employment_status: EmploymentStatus;
  employment_type?: EmploymentType;
  user_id: string;
}

export interface RegisterStaffResponse {
  data: {
    staff_uuid: string;
    professional_title: ProfessionalTitle;
    employment_status: EmploymentStatus;
    employment_type?: EmploymentType;
    user_id: string;
    created_at: string;
    updated_at: string;
  };
  message: string;
}