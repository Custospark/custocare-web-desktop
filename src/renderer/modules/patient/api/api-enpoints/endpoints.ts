export const PATIENT_ENDPOINTS = {
  /**
   * POST: Register a new patient
   * Body: { date_of_birth, biological_sex, emergency_contact }
   * Returns: { success, message, data: PatientResource }
   */
  REGISTER: '/api/patients',

  /**
   * GET: Retrieve patient profile by UUID
   * Returns: { success, data: PatientResource }
   */
  GET_PROFILE: (patientUuid: string) => `/api/patients/${patientUuid}`,

  /**
   * PUT: Update patient profile
   * Returns: { success, message, data: PatientResource }
   */
  UPDATE_PROFILE: (patientUuid: string) => `/api/patients/${patientUuid}`,

  /**
   * GET: Get patient dashboard data
   * Returns: { success, data: DashboardData }
   */
  DASHBOARD: (patientUuid: string) => `/api/patients/${patientUuid}/dashboard`,

  /**
   * GET: Get patient appointments
   * Returns: { success, data: Appointment[] }
   */
  APPOINTMENTS: (patientUuid: string) => `/api/patients/${patientUuid}/appointments`,

  /**
   * GET: Get patient medical records
   * Returns: { success, data: MedicalRecord[] }
   */
  MEDICAL_RECORDS: (patientUuid: string) => `/api/patients/${patientUuid}/medical-records`,
} as const;