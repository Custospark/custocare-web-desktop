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
import { logoutClientSession } from '../../../app/store/utils/logoutClientSession';

import {
  loginStart,
  loginSuccess,
  loginFailure,
  setSessionStart,
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

import { setUserContext } from '../../../app/store/slices/activeContextSlice';

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
      // refreshUser updates the auth slice with latest user data (email, id preserved)
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
 * - email and user_id are stored in registerSuccess (see authSlice)
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

        // registerSuccess stores email and userId in the slice (verification context)
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
 * - LOGIN_SUCCESS -> set auth (token + user), fetch context, set activeContext, navigate to portal selection
 *
 * In success case, token is stored in loginSuccess (authSlice) and persisted to localStorage.
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
      // Store pending login for flows that need a second step (email verify).
      // Note: this stores password in-memory only, not persisted.
      const pending = { email: variables.email, password: variables.password, remember_me: variables.remember_me ?? null };
      dispatch(setPendingLogin(pending));

      // Case 1: MFA required (legacy, but keep for backward compatibility)
      if (data.success && data.code === 'MFA_REQUIRED') {
        const userId = (data.user as any)?.id ?? null;

        dispatch(mfaRequired({ email: variables.email, userId }));
        showToast('info', data.message || 'MFA required.', 8000);

        navigate(ROUTES.TWO_FACTOR_AUTH);
        callbacks.onSuccess?.(data);
        return;
      }

      // Case 2: Email not verified (must come before generic failure catch-all)
      if (data.code === 'EMAIL_NOT_VERIFIED') {
        const userId = (data.user as any)?.id ?? null;

        dispatch(
          setVerificationContext({
            type: 'email',
            flow: 'login',
            userId,
            email: variables.email,
          })
        );

        showToast('info', data.message || 'Please verify your email before logging in.', 8000);
        navigate(ROUTES.TWO_FACTOR_AUTH);
        callbacks.onSuccess?.(data);
        return;
      }

      // Case 3: API returned failure (catch-all for remaining failures)
      if (!data.success) {
        const msg = data.message || 'Login failed.';
        dispatch(loginFailure(msg));
        showToast('error', msg, 8000);
        callbacks.onSuccess?.(data);
        return;
      }

      // Case 4: Successful login with user and token (email verified, no 2FA)
      if (data.token && data.user) {
        // loginSuccess stores token and user in authSlice and persists to localStorage
        dispatch(loginSuccess({ token: data.token, user: data.user }));
        dispatch(mfaClear());
        dispatch(clearVerificationContext());
        dispatch(clearPendingLogin());

        try {
          const context = await fetchUserContext();
          dispatch(setUserContext(context));
          dispatch(setSessionStart());
          showToast('success', data.message || 'Login successful.', 8000);
          navigate(ROUTES.PORTAL_SELECTOR);
        } catch {
          showToast('error', 'Logged in, but failed to load user context.', 8000);
          // Still navigate to Portal Selector - app may handle missing context gracefully
          navigate(ROUTES.PORTAL_SELECTOR);
        }

        callbacks.onSuccess?.(data);
        return;
      }

      // Case 5: Unexpected response shape (neither token/user nor verification needed)
      const msg = data.message || 'Login failed.System error.';
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
   *
   * Token is stored only after the re‑login (via loginSuccess) – the verify‑email endpoint itself returns token:null.
   */
  export const useVerifyEmail = (
    callbacks: MutationCallbacks<VerifyEmailResponse, AxiosError<ApiValidationErrorResponse>> = {}
  ) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const verification = useSelector(selectVerificationContext);

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

        // If the response includes token and user, authenticate the user
        // This applies to BOTH registration and login flows
        if (data.token && data.user) {
          dispatch(loginSuccess({ token: data.token, user: data.user }));
          dispatch(clearPendingLogin());
          dispatch(mfaClear());
        }

        dispatch(verifyEmailSuccess());
        showToast('success', data.message || 'Verification successfully completed.', 8000);

        // Handle navigation based on flow
        switch (verification.flow) {
          case 'registration':
            // Registration flow: user is authenticated if token was returned
            dispatch(clearVerificationContext());
            
            if (data.token && data.user) {
              // User is authenticated - fetch context and go to Portal Selector
              try {
                const context = await fetchUserContext();
                dispatch(setUserContext(context));
                dispatch(setSessionStart());
              } catch {
                showToast('error', 'Authentication successful, but failed to load user context.', 8000);
              }
              navigate(ROUTES.ROLE_SELECTION);
            } else {
              // No token (unlikely) - go to Role Selection as before
              navigate(ROUTES.ROLE_SELECTION);
              showToast('error', 'Unexpected error occured.Please try again later.', 8000);
            }
            break;

          case 'login':
            // Login flow: user is authenticated if token was returned
            dispatch(clearVerificationContext());
            
            if (data.token && data.user) {
              // Fetch user context and go to Portal Selector
              try {
                const context = await fetchUserContext();
                dispatch(setUserContext(context));
                dispatch(setSessionStart());
              } catch {
                showToast('error', 'Logged in, but failed to load user context.', 8000);
              }
              navigate(ROUTES.PORTAL_SELECTOR);
            } else {
              // Fallback: if no token (unlikely), send to login page
              showToast('info', 'Please log in with your credentials.', 5000);
              navigate(ROUTES.LOGIN);
            }
            break;

          default:
            // No flow known: go to login
            dispatch(clearVerificationContext());
            navigate(ROUTES.LOGIN);
            break;
        }

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
 * - set auth (token stored in loginSuccess)
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

      // Token stored here via loginSuccess
      dispatch(loginSuccess({ token: data.token, user: data.user }));
      dispatch(mfaClear());
      dispatch(clearPendingLogin());
      dispatch(clearVerificationContext());

      try {
        const context = await fetchUserContext();
        dispatch(setUserContext(context));
        dispatch(setSessionStart());
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
      showToast('success', data.message ||'If that email address is associated with an account, a password reset code has been sent.', 8000);
      callbacks.onSuccess?.(data);
    },
    onError: () => {
      const msg = 'If that email address is associated with an account, a password reset code has been sent.';
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
  // Get the main API message
  const apiMessage = error.response?.data?.message || error.message || 'Password reset failed.';
  
  // Format validation errors if they exist
  let errorDetails = '';
  if (error.response?.data?.errors) {
    errorDetails = Object.entries(error.response.data.errors)
      .map(([field, msgs]) => {
        // Handle both array and string error messages
        const messages = Array.isArray(msgs) ? msgs.join(', ') : msgs;
        return `${field}: ${messages}`;
      })
      .join(' • '); // Using bullet separator instead of pipe for cleaner look
  }

  // Construct final display message
  const displayMessage = errorDetails 
    ? `${apiMessage} (${errorDetails})` 
    : apiMessage;
      // Show toast with combined message
      showToast('error', displayMessage, 8000);

      // Dispatch failure action
      dispatch(resetPasswordFailure(apiMessage));
      
      // Call original callback
      callbacks.onError?.(error);
    }
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

      logoutClientSession(dispatch);

      navigate(ROUTES.HOME);
      callbacks.onSuccess?.(data);
    },
    onError: (error) => {
      // Clear client state anyway to avoid stuck sessions
      logoutClientSession(dispatch);

      const msg = error.response?.data?.message || error.message || 'Logout failed.';
      showToast('error', msg, 8000);

      navigate(ROUTES.LOGIN);
      callbacks.onError?.(error);
    },
  });
};