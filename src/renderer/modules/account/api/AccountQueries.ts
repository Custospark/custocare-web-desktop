/**
 * ============================================================================
 * ACCOUNT REACT QUERY HOOKS (AUTH + CONTEXT + ROUTING)
 * ============================================================================
 *
 * STRICT RULES:
 * - Do NOT introduce endpoints beyond what you provided:
 *   /auth/register
 *   /auth/login
 *   /auth/logout
 *   /auth/me
 *   /auth/verify-email
 *   /auth/resend-verification
 *   /auth/forgot-password
 *   /auth/reset-password
 *   PLUS the provided:
 *   /user/context/resolve
 *
 * - Do NOT pass data via routes.
 * - Persist flow-critical data in slices:
 *   - authSlice.ts (verification context, pending login, token, user)
 *   - activeContextSlice.ts (user context)
 *
 * - Routing is executed here using react-router navigate().
 */

import { useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { axiosInstance } from '../../../app/api/axiosConfig';
import { useToast } from '../../../app/store/contexts/toast/useToast';

import {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  verifyEmailStart,
  verifyEmailSuccess,
  verifyEmailFailure,
  resendVerificationStart,
  resendVerificationSuccess,
  resendVerificationFailure,
  forgotPasswordStart,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  resetPasswordStart,
  resetPasswordSuccess,
  resetPasswordFailure,
  refreshUser,
  logout as logoutAction,

  setPendingLogin,
  clearPendingLogin,
  setVerificationContext,
  clearVerificationContext,

  mfaRequired,
  mfaVerificationStart,
  mfaVerificationFailure,
  mfaClear,

  selectPendingLogin,
  selectVerificationContext,
  selectPasswordResetEmail,
} from '../../../app/store/slices/authSlice';

import { setUserContext, clearActiveContext } from '../../../app/store/slices/activeContextSlice';

import type { UnifiedUserProfile } from '../../../shared/types/userTypes';
import { ROUTES } from '../../administration/onboarding/routes/onboardingRouteConstants';
import type {
  ApiValidationErrorResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  MutationCallbacks,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationResponse,
  ResendVerificationVariables,
  ResetPasswordResponse,
  ResetPasswordVariables,
  UserContext,
  VerifyEmailResponse,
  VerifyEmailVariables,
} from './AccountTypes';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

export const accountKeys = {
  all: ['account'] as const,
  me: () => [...accountKeys.all, 'me'] as const,
};

/* -------------------------------------------------------------------------- */
/*                          CONTEXT RESOLVE (provided)                        */
/* -------------------------------------------------------------------------- */

const fetchUserContext = async (): Promise<UserContext> => {
  const response = await axiosInstance.get('/user/context/resolve');

  if (response.data && response.data.data) {
    return response.data.data as UserContext;
  }

  throw new Error('Invalid context response from server');
};

/* -------------------------------------------------------------------------- */
/*                                  QUERIES                                   */
/* -------------------------------------------------------------------------- */

export const useMe = (
  options?: Omit<
    UseQueryOptions<UnifiedUserProfile, AxiosError<ApiValidationErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const dispatch = useDispatch();

  return useQuery<UnifiedUserProfile, AxiosError<ApiValidationErrorResponse>>({
    queryKey: accountKeys.me(),
    queryFn: async () => {
      const res = await axiosInstance.get<{ user: UnifiedUserProfile }>('/auth/me');
      dispatch(refreshUser(res.data.user));
      return res.data.user;
    },
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                                 MUTATIONS                                  */
/* -------------------------------------------------------------------------- */

/**
 * REGISTER
 * - Stores verification context in slice (flow=registration, type=email)
 * - Navigates to email verification screen
 */
export const useRegister = (
  callbacks: MutationCallbacks<RegisterResponse<UnifiedUserProfile>, AxiosError<ApiValidationErrorResponse>> = {}
) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  return useMutation<RegisterResponse<UnifiedUserProfile>, AxiosError<ApiValidationErrorResponse>, RegisterRequest>({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post<RegisterResponse<UnifiedUserProfile>>('/auth/register', payload);
      return res.data;
    },
    onMutate: () => dispatch(registerStart()),
    onSuccess: (data, variables) => {
      if (data.success) {
        const userId = (data.user as any)?.id ?? null;

        dispatch(
          registerSuccess({
            user: data.user ?? null,
            email: variables.email,
            userId,
          })
        );

        showToast('success', data.message || 'Account created. Please verify your email.', 8000);

        // Go to email verification screen (no route state; slice contains context)
        navigate(ROUTES.TWO_FACTOR_AUTH);
      } else {
        const msg = data.message || 'Registration failed.';
        dispatch(registerFailure(msg));
        showToast('error', msg, 8000);
      }

      callbacks.onSuccess?.(data);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || 'Registration failed.';
      dispatch(registerFailure(msg));
      showToast('error', msg, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * LOGIN
 * Handles:
 * - MFA_REQUIRED -> set slice verification(type=mfa, flow=login), set pendingLogin, navigate to 2FA page
 * - EMAIL_NOT_VERIFIED -> set slice verification(type=email, flow=login), set pendingLogin, navigate to email verification page
 * - LOGIN_SUCCESS -> set auth, fetch context, set activeContext, navigate to portal selection
 */
export const useLogin = (
  callbacks: MutationCallbacks<LoginResponse<UnifiedUserProfile>, AxiosError<ApiValidationErrorResponse>> = {}
) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  return useMutation<LoginResponse<UnifiedUserProfile>, AxiosError<ApiValidationErrorResponse>, LoginRequest>({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post<LoginResponse<UnifiedUserProfile>>('/auth/login', payload);
      return res.data;
    },
    onMutate: () => dispatch(loginStart()),
    onSuccess: async (data, variables) => {
      // Store pending login for flows that need a second step (email verify or MFA).
      // Note: this stores password in-memory only, not persisted.
      const pending = { email: variables.email, password: variables.password, remember_me: variables.remember_me ?? null };
      dispatch(setPendingLogin(pending));

      if (data.success && data.code === 'MFA_REQUIRED') {
        // Backend provides user in MFA_REQUIRED flow (per your service)
        const userId = (data.user as any)?.id ?? null;

        dispatch(mfaRequired({ email: variables.email, userId }));
        showToast('info', data.message || 'MFA required.', 8000);

        // Route to MFA screen
        navigate(ROUTES.TWO_FACTOR_AUTH);
        callbacks.onSuccess?.(data);
        return;
      }

      if (!data.success) {
        const msg = data.message || 'Login failed.';
        dispatch(loginFailure(msg));
        showToast('error', msg, 8000);
        callbacks.onSuccess?.(data);
        return;
      }

      // Email not verified case
      if (data.code === 'EMAIL_NOT_VERIFIED') {
        const userId = (data.user as any)?.id ?? null; // may be null depending on backend response

        dispatch(
          setVerificationContext({
            type: 'email',
            flow: 'login',
            userId,
            email: variables.email,
          })
        );

        showToast('error', data.message || 'Please verify your email before logging in.', 8000);
        navigate(ROUTES.TWO_FACTOR_AUTH);
        callbacks.onSuccess?.(data);
        return;
      }

      // Successful login
      if (data.token && data.user) {
        dispatch(loginSuccess({ token: data.token, user: data.user }));
        dispatch(mfaClear());
        dispatch(clearVerificationContext());
        dispatch(clearPendingLogin());

        try {
          const context = await fetchUserContext();
          dispatch(setUserContext(context));
        } catch {
          showToast('error', 'Logged in, but failed to load user context.', 8000);
          // Still allow navigation; app may handle missing context gracefully.
        }

        showToast('success', data.message || 'Login successful.', 8000);
        navigate(ROUTES.PORTAL_SELECTOR);

        callbacks.onSuccess?.(data);
        return;
      }

      // Fallback: unexpected shape
      const msg = data.message || 'Login failed (unexpected response).';
      dispatch(loginFailure(msg));
      showToast('error', msg, 8000);
      callbacks.onSuccess?.(data);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || 'Login failed.';
      dispatch(loginFailure(msg));
      showToast('error', msg, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * VERIFY EMAIL
 * - If verification.flow=registration -> navigate to role selection
 * - If verification.flow=login -> auto re-attempt login using pendingLogin, then:
 *    - if MFA_REQUIRED -> navigate to MFA
 *    - if LOGIN_SUCCESS -> fetch context, set activeContext, navigate to portal selection
 */
export const useVerifyEmail = (
  callbacks: MutationCallbacks<VerifyEmailResponse, AxiosError<ApiValidationErrorResponse>> = {}
) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const verification = useSelector(selectVerificationContext);
  const pendingLogin = useSelector(selectPendingLogin);

  return useMutation<VerifyEmailResponse, AxiosError<ApiValidationErrorResponse>, VerifyEmailVariables>({
    mutationFn: async (vars) => {
      const user_id = vars.user_id ?? verification.userId;

      if (!user_id) {
        throw new Error(
          'Missing user_id for email verification. Ensure it is stored in slice (registration or login response).'
        );
      }

      const res = await axiosInstance.post<VerifyEmailResponse>('/auth/verify-email', {
        user_id,
        code: vars.code,
        is_token: vars.is_token ?? false,
      });

      return res.data;
    },
    onMutate: () => dispatch(verifyEmailStart()),
    onSuccess: async (data) => {
      if (!data.success) {
        const msg = data.message || 'Verification failed.';
        dispatch(verifyEmailFailure(msg));
        showToast('error', msg, 8000);
        callbacks.onSuccess?.(data);
        return;
      }

      dispatch(verifyEmailSuccess());
      showToast('success', data.message || 'Email verified successfully.', 8000);

      // Registration flow: go to Role Selection (required)
      if (verification.flow === 'registration') {
        dispatch(clearVerificationContext());
        navigate(ROUTES.ROLE_SELECTION);
        callbacks.onSuccess?.(data);
        return;
      }

      // Login flow: must complete login + fetch context + go to Portal Selection (required)
      if (verification.flow === 'login') {
        if (!pendingLogin) {
          const msg = 'Cannot complete login after verification: missing pending login credentials in slice.';
          dispatch(verifyEmailFailure(msg));
          showToast('error', msg, 8000);
          callbacks.onSuccess?.(data);
          return;
        }

        try {
          const loginRes = await axiosInstance.post<LoginResponse<UnifiedUserProfile>>('/auth/login', {
            email: pendingLogin.email,
            password: pendingLogin.password,
            remember_me: pendingLogin.remember_me ?? null,
          });

          const loginData = loginRes.data;

          if (loginData.success && loginData.code === 'MFA_REQUIRED') {
            // Switch to MFA step after email verification
            const userId = (loginData.user as any)?.id ?? verification.userId ?? null;

            dispatch(mfaRequired({ email: pendingLogin.email, userId }));
            showToast('info', loginData.message || 'MFA required.', 8000);

            navigate(ROUTES.TWO_FACTOR_AUTH);
            callbacks.onSuccess?.(data);
            return;
          }

          if (loginData.success && loginData.token && loginData.user) {
            dispatch(loginSuccess({ token: loginData.token, user: loginData.user }));
            dispatch(clearVerificationContext());
            dispatch(clearPendingLogin());
            dispatch(mfaClear());

            const context = await fetchUserContext();
            dispatch(setUserContext(context));

            navigate(ROUTES.PORTAL_SELECTOR);
            callbacks.onSuccess?.(data);
            return;
          }

          // If still not verified or other failure
          const msg = loginData.message || 'Login failed after email verification.';
          dispatch(loginFailure(msg));
          showToast('error', msg, 8000);
          callbacks.onSuccess?.(data);
        } catch (e) {
          const msg = 'Login failed after email verification.';
          dispatch(loginFailure(msg));
          showToast('error', msg, 8000);
          callbacks.onSuccess?.(data);
        }

        return;
      }

      // No flow known: just clear and go to login
      dispatch(clearVerificationContext());
      navigate(ROUTES.LOGIN);
      callbacks.onSuccess?.(data);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || 'Verification failed.';
      dispatch(verifyEmailFailure(msg));
      showToast('error', msg, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * VERIFY MFA (2FA)
 * Uses ONLY /auth/login with mfa_code (no new endpoint).
 * On success:
 * - set auth
 * - fetch context -> set activeContext
 * - navigate to portal selection
 */
export const useVerifyMfa = (
  callbacks: MutationCallbacks<LoginResponse<UnifiedUserProfile>, AxiosError<ApiValidationErrorResponse>> = {}
) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const pendingLogin = useSelector(selectPendingLogin);

  return useMutation<LoginResponse<UnifiedUserProfile>, AxiosError<ApiValidationErrorResponse>, { mfa_code: string }>({
    mutationFn: async ({ mfa_code }) => {
      if (!pendingLogin) {
        throw new Error('Missing pending login credentials in slice. Please restart login.');
      }

      const res = await axiosInstance.post<LoginResponse<UnifiedUserProfile>>('/auth/login', {
        email: pendingLogin.email,
        password: pendingLogin.password,
        remember_me: pendingLogin.remember_me ?? null,
        mfa_code,
      });

      return res.data;
    },
    onMutate: () => dispatch(mfaVerificationStart()),
    onSuccess: async (data) => {
      if (!data.success || !data.token || !data.user) {
        const msg = data.message || 'MFA verification failed.';
        dispatch(mfaVerificationFailure(msg));
        showToast('error', msg, 8000);
        callbacks.onSuccess?.(data);
        return;
      }

      dispatch(loginSuccess({ token: data.token, user: data.user }));
      dispatch(mfaClear());
      dispatch(clearPendingLogin());
      dispatch(clearVerificationContext());

      try {
        const context = await fetchUserContext();
        dispatch(setUserContext(context));
      } catch {
        showToast('error', 'Logged in, but failed to load user context.', 8000);
      }

      showToast('success', data.message || 'Login successful.', 8000);
      navigate(ROUTES.PORTAL_SELECTOR);

      callbacks.onSuccess?.(data);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || 'MFA verification failed.';
      dispatch(mfaVerificationFailure(msg));
      showToast('error', msg, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * RESEND VERIFICATION
 * Requires user_id (from slice or override).
 */
export const useResendVerification = (
  callbacks: MutationCallbacks<ResendVerificationResponse, AxiosError<ApiValidationErrorResponse>> = {}
) => {
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const verification = useSelector(selectVerificationContext);

  return useMutation<ResendVerificationResponse, AxiosError<ApiValidationErrorResponse>, ResendVerificationVariables>({
    mutationFn: async (vars) => {
      const user_id = vars.user_id ?? verification.userId;

      if (!user_id) {
        throw new Error('Missing user_id for resend verification. It must be available in the slice.');
      }

      const res = await axiosInstance.post<ResendVerificationResponse>('/auth/resend-verification', {
        user_id,
        channel: vars.channel ?? 'email',
      });

      return res.data;
    },
    onMutate: () => dispatch(resendVerificationStart()),
    onSuccess: (data) => {
      if (data.success) {
        dispatch(resendVerificationSuccess({ expiresAt: data.expires_at ?? null }));
        showToast('success', data.message || 'Verification sent.', 8000);
      } else {
        const msg = data.message || 'Resend failed.';
        dispatch(resendVerificationFailure(msg));
        showToast('error', msg, 8000);
      }
      callbacks.onSuccess?.(data);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || 'Resend failed.';
      dispatch(resendVerificationFailure(msg));
      showToast('error', msg, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * FORGOT PASSWORD
 * Stores email in slice so reset screen doesn't need route state.
 */
export const useForgotPassword = (
  callbacks: MutationCallbacks<ForgotPasswordResponse, AxiosError<ApiValidationErrorResponse>> = {}
) => {
  const dispatch = useDispatch();
  const { showToast } = useToast();

  return useMutation<ForgotPasswordResponse, AxiosError<ApiValidationErrorResponse>, ForgotPasswordRequest>({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post<ForgotPasswordResponse>('/auth/forgot-password', payload);
      return res.data;
    },
    onMutate: () => dispatch(forgotPasswordStart()),
    onSuccess: (data, variables) => {
      // Backend returns success always for security
      dispatch(forgotPasswordSuccess({ email: variables.email, expiresAt: data.expires_at ?? null }));
      showToast('success', data.message || 'If the email exists, a reset code has been sent.', 8000);
      callbacks.onSuccess?.(data);
    },
    onError: () => {
      const msg = 'If the email exists, a reset code has been sent.';
      dispatch(forgotPasswordFailure(msg));
      showToast('success', msg, 8000);
    },
  });
};

/**
 * RESET PASSWORD
 * Defaults email to slice value from forgot-password.
 */
export const useResetPassword = (
  callbacks: MutationCallbacks<ResetPasswordResponse, AxiosError<ApiValidationErrorResponse>> = {}
) => {
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const emailFromSlice = useSelector(selectPasswordResetEmail);

  return useMutation<ResetPasswordResponse, AxiosError<ApiValidationErrorResponse>, ResetPasswordVariables>({
    mutationFn: async (vars) => {
      const email = vars.email ?? emailFromSlice;
      if (!email) throw new Error('Missing email for reset-password (not found in slice).');

      const res = await axiosInstance.post<ResetPasswordResponse>('/auth/reset-password', {
        email,
        code: vars.code,
        new_password: vars.new_password,
        new_password_confirmation: vars.new_password_confirmation,
        is_token: vars.is_token ?? false,
      });

      return res.data;
    },
    onMutate: () => dispatch(resetPasswordStart()),
    onSuccess: (data) => {
      if (data.success) {
        dispatch(resetPasswordSuccess());
        showToast('success', data.message || 'Password reset successfully.', 8000);
      } else {
        const msg = data.message || 'Password reset failed.';
        dispatch(resetPasswordFailure(msg));
        showToast('error', msg, 8000);
      }
      callbacks.onSuccess?.(data);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || 'Password reset failed.';
      dispatch(resetPasswordFailure(msg));
      showToast('error', msg, 8000);
      callbacks.onError?.(error);
    },
  });
};

/**
 * LOGOUT
 * Clears auth + active context and routes back to login.
 */
export const useLogout = (
  callbacks: MutationCallbacks<LogoutResponse, AxiosError<ApiValidationErrorResponse>> = {}
) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  return useMutation<LogoutResponse, AxiosError<ApiValidationErrorResponse>, void>({
    mutationFn: async () => {
      const res = await axiosInstance.post<LogoutResponse>('/auth/logout');
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) showToast('success', data.message || 'Logged out.', 5000);

      dispatch(logoutAction());
      dispatch(clearActiveContext());

      navigate(ROUTES.HOME);
      callbacks.onSuccess?.(data);
    },
    onError: (error) => {
      // Clear client state anyway to avoid stuck sessions
      dispatch(logoutAction());
      dispatch(clearActiveContext());

      const msg = error.response?.data?.message || error.message || 'Logout failed.';
      showToast('error', msg, 8000);

      navigate(ROUTES.LOGIN);
      callbacks.onError?.(error);
    },
  });
};
