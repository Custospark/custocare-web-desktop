export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  // Add other user properties from your backend response
  uuid?: string;
  national_id_country_code?: string;
  profile?: {
    first_name: string;
    last_name: string;
    full_name: string;
    title: string | null;
    display_name: string | null;
    dob: string | null;
    gender: string | null;
  };
}

export interface BackendLoginResponse {
  success: boolean;
  code: string;
  message: string;
  requires_mfa: boolean;
  user: UserProfile | null;
  token: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  mfa_code?: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: UserProfile;
  token: string;
}