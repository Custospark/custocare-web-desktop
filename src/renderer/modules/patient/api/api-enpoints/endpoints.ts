export const PATIENT_ENDPOINTS = {
  /**
   * POST: Register a new patient
   * Body: { date_of_birth, biological_sex, emergency_contact }
   * Returns: { success, message, data: PatientResource }
   */
  REGISTER: '/patients',

  /**
   * GET: Retrieve patient profile by UUID
   * Returns: { success, data: PatientResource }
   */
  GET_PROFILE: (patientUuid: string) => `/patients/${patientUuid}`,

  /**
   * PUT: Update patient profile
   * Returns: { success, message, data: PatientResource }
   */
  UPDATE_PROFILE: (patientUuid: string) => `/patients/${patientUuid}`,

  /**
   * GET: Get patient dashboard data
   * Returns: { success, data: DashboardData }
   */
  DASHBOARD: (patientUuid: string) => `/patients/${patientUuid}/dashboard`,

  /**
   * GET: Get patient appointments
   * Returns: { success, data: Appointment[] }
   */
  APPOINTMENTS: (patientUuid: string) => `/patients/${patientUuid}/appointments`,

  /**
   * GET: Get patient medical records
   * Returns: { success, data: MedicalRecord[] }
   */
  MEDICAL_RECORDS: (patientUuid: string) => `/patients/${patientUuid}/medical-records`,
} as const;